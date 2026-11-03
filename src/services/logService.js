import { getMongoClient } from '../config/mongoClient';

// Servicio server-side para nudges/logs no estructurados; no contiene credenciales.
export async function guardarLogNudge(log) {
  if (!log || typeof log !== 'object') {
    throw new TypeError('El log de nudge debe ser un objeto.');
  }

  const client = await getMongoClient();
  const database = client.db('smart_planner');
  const result = await database.collection('nudge_logs').insertOne({
    ...log,
    creadoEn: new Date()
  });

  return result.insertedId;
}
