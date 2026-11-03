import { MongoClient } from 'mongodb';

let client;
let clientPromise;

function getMongoUri() {
  const uri = globalThis.process?.env?.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI no está configurada en el entorno server-side.');
  }
  return uri;
}

// Este módulo debe ejecutarse únicamente en un backend/worker, nunca en el bundle del navegador.
export function getMongoClient() {
  if (!clientPromise) {
    client = new MongoClient(getMongoUri());
    clientPromise = client.connect().catch((error) => {
      client = undefined;
      clientPromise = undefined;
      throw new Error(`No fue posible conectar con MongoDB Atlas: ${error.message}`);
    });
  }
  return clientPromise;
}

export async function closeMongoClient() {
  if (client) {
    await client.close();
    client = undefined;
    clientPromise = undefined;
  }
}
