import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs';

export const uploadToAzureBlob = async (filePath: string, blobName: string, containerName: string = 'dtes'): Promise<string> => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  
  if (!connectionString) {
    console.warn("⚠️  [Storage] AZURE_STORAGE_CONNECTION_STRING no configurado. Archivo almacenado localmente (/temp).");
    return `http://localhost:3000/temp/${blobName}`;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Crear el contenedor si no existe
    await containerClient.createIfNotExists({ access: 'blob' });

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(filePath);

    return blockBlobClient.url;
  } catch (error: any) {
    console.error("❌ Error subiendo archivo a Azure:", error.message);
    throw new Error("No se pudo almacenar el archivo en la nube.");
  }
};
