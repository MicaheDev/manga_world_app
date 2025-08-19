// src/services/storage.ts

import axios from "axios";
import {
  GITHUB_API_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
} from "../config/environment";

// La función ahora espera un Buffer como fileContent
export async function uploadToGithub(fileName: string, fileContent: Buffer, commitMessage: string) {
  try {
    // La conversión a Base64 se hace aquí, sobre el Buffer
    const base64Content = fileContent.toString('base64');
    
    const data = {
      message: commitMessage,
      content: base64Content,
    };
    
    // Asumiendo que quieres que todos los archivos estén en una carpeta 'files'
    const response = await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/mangas/${fileName}`,
      data, 
      {
        headers: {
          Authorization: `Bearer ${GITHUB_API_TOKEN}`,
        },
      }
    );
    
    console.log("Archivo subido con éxito:", response.data.content.html_url);
    return response.data;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error("Error al subir a GitHub:", error.response?.data?.message || error.message);
    } else {
        console.error("Ocurrió un error inesperado:", error);
    }
    throw error; 
  }
}