import axios from "axios";
import React, { useEffect, useState } from "react";

// Define una interfaz para los datos que se enviarán al servidor
interface MangaData {
  mangaTitle: string;
  author: string;
  tags: string[];
  images: string[];
}

const ImageUploader: React.FC = () => {
  const [convertedImages, setConvertedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [capNumber, setCapNumber] = useState("");

  useEffect(() => {

 // Definimos una función asíncrona para obtener los datos
    const fetchData = async () => {
      try {
        // La URL debe coincidir con la que definiste en tu backend
        const response = await axios.get("http://localhost:8080/mangas/Undead%20Unluck/1");
        
        // Guardamos los datos en el estado del componente
        setImages(response.data);
        
      } catch (err) {
        // En caso de error, guardamos el mensaje de error en el estado
        console.error("Error al obtener los datos:", err);
      }
    };

    fetchData();
  }, []);

  // Usa ChangeEvent para tipar el evento del input
  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    setLoading(true);
    const promises: Promise<string>[] = [];

    // Itera sobre el FileList
    for (const file of Array.from(files)) {
      promises.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            // El resultado es un string (Base64), lo afirmamos con 'as string'
            resolve(reader.result as string);
          };

          reader.onerror = (error) => {
            reject(error);
          };

          reader.readAsDataURL(file);
        })
      );
    }

    try {
      const imagesArray = await Promise.all(promises);
      setConvertedImages(imagesArray);

      setImages(imagesArray);

      console.log(
        `Se han convertido ${imagesArray.length} imágenes y se han enviado.`
      );
      console.log(`Se han convertido ${imagesArray.length} imágenes a Base64.`);
    } catch (error) {
      console.error("Hubo un error al convertir las imágenes:", error);
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (title == "" || author == "" || capNumber == "" || tags == "") {
        alert("Complete los campos");
        return;
      }

      if (images.length < 1) {
        alert("No selecciono imagenes");
        return;
      }
      // ⬇️ Construye el FormData para Multer
      const form = new FormData();

      // Agrega los campos de texto
      form.append("title", title);
      form.append("author", author);
      form.append("capNumber", capNumber);
      form.append("tags", tags);

      // Convierte el array de imágenes en una cadena JSON
      const imagesAsJson = JSON.stringify(images);

      // Crea un Blob (un "archivo") a partir de la cadena JSON
      const blob = new Blob([imagesAsJson], { type: "application/json" });

      // ⬇️ Adjunta el Blob al FormData con el nombre 'image'
      form.append("image", blob, "images.json");

      // ⬇️ Envía el FormData al servidor
      const response = await axios.post(
        "http://localhost:8080/mangas/upload",
        form
      );
      console.log("Respuesta del servidor:", response.data);
    } catch (error) {
      console.error("Hubo un error al convertir las imágenes:", error);
    }
  }

  return (
    <div>
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
        onSubmit={(e) => handleSubmit(e)}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="title"
        />
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="author"
        />
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags"
        />
        <input
          type="text"
          value={capNumber}
          onChange={(e) => setCapNumber(e.target.value)}
          placeholder="capNumber"
        />
        <input
          type="file"
          id="imageInput"
          multiple
          onChange={handleImageChange}
          disabled={loading}
        />

        <button type="submit">Subir</button>
      </form>
      {loading && <p>Convirtiendo imágenes...</p>}

      {convertedImages.length > 0 && (
        <div>
          <h3>Imágenes convertidas ({convertedImages.length})</h3>
          <p>Puedes ver los datos en la consola.</p>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {images.length > 0 &&
          images.map((image, index) => <img key={index} src={`${image}`} />)}
      </div>
    </div>
  );
};

export default ImageUploader;
