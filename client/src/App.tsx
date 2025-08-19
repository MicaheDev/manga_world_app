import axios from "axios";
import React, { useState } from "react";

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

      // ⬇️ Construye el FormData para Multer
      const form = new FormData();

      // Agrega los campos de texto
      form.append("title", "Mi Gran Manga");
      form.append("author", "Juan Pérez");
      form.append("tags", JSON.stringify(["aventura", "acción"]));

      // Convierte el array de imágenes en una cadena JSON
      const imagesAsJson = JSON.stringify(imagesArray);

      // Crea un Blob (un "archivo") a partir de la cadena JSON
      const blob = new Blob([imagesAsJson], { type: "application/json" });

      // ⬇️ Adjunta el Blob al FormData con el nombre 'image'
      form.append("image", blob, "images.json");

      // ⬇️ Envía el FormData al servidor
      const response = await axios.post(
        "http://localhost:8080/mangas/upload",
        form
      );

      setImages(imagesArray);

      console.log("Respuesta del servidor:", response.data);
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

  return (
    <div>
      <input
        type="file"
        id="imageInput"
        multiple
        onChange={handleImageChange}
        disabled={loading}
      />
      {loading && <p>Convirtiendo imágenes...</p>}

      {convertedImages.length > 0 && (
        <div>
          <h3>Imágenes convertidas ({convertedImages.length})</h3>
          <p>Puedes ver los datos en la consola.</p>
        </div>
      )}

      {images.length > 0 &&
        images.map((image, index) => <img key={index} src={`${image}`} />)}
    </div>
  );
};

export default ImageUploader;
