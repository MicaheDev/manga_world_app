import express from "express";
import {
  GITHUB_API_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  PORT,
} from "./src/config/environment";
import axios from "axios";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { uploadToGithub } from "./src/services/storage";
import { readFile, unlink } from "node:fs/promises";

const app = express();
app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // La carpeta 'uploads/mangas/' debe existir
    cb(null, "uploads/mangas/");
  },
  filename: (req, file, cb) => {
    // Genera un nombre de archivo único
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

if (!GITHUB_API_TOKEN) {
  console.error("Error: GITHUB_API_TOKEN deben estar definidos en .env");
  process.exit(1);
}

app.get("/", (req, res) => {
  res.send("Hola");
});


app.post("/mangas/upload", upload.single("image"), async (req, res) => {
  try {
    const { title, tags, author } = req.body;
    const image = req.file;

    if (!title || !tags || !author || !image) {
      if (image) {
        await unlink(image.path); // Elimina la imagen si algo falta
      }
      return res.status(400).json({ error: "Faltan campos requeridos." });
    }

    let tagsArray;
    // Intenta parsear el JSON
    try {
      tagsArray = JSON.parse(tags);
    } catch (e) {
      // Si falla, asume que es una cadena separada por comas
      tagsArray = tags.split(",").map((tag: string) => tag.trim());
    }

    // ⬇️ Lógica para subir el archivo a GitHub
    const fileContent = await readFile(image.path);
    const githubFileName = `${title}/${image.filename}`;
    const commitMessage = `Añadiendo el manga: ${title}`;

    // Pasa el Buffer directamente a la función
    await uploadToGithub(githubFileName, fileContent, commitMessage);

    await unlink(image.path);
    console.log("Imagen eliminada del servidor:", image.path);

    res.status(200).json({
      message: "Manga subido correctamente",
      data: {
        title,
        author,
        tags: tagsArray,
      },
    });
  } catch (error) {
    console.error("Error al subir el manga:", error);
    // ⚠️ Si ocurre un error, también es buena práctica eliminar la imagen.
    if (req.file) {
      await unlink(req.file.path).catch((err) => console.error(err));
    }

    res
      .status(500)
      .json({ error: "Ocurrió un error al procesar la solicitud." });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
