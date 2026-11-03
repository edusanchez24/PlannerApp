import { getMongoClient } from '../config/mongoClient';

// Este módulo es exclusivamente server-side y debe ser usado por /api/nudges/log.
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
