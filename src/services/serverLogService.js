import { getMongoClient, isMongoConfigured } from '../config/mongoClient.js';
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_FILE = process.env.VERCEL
  ? join('/tmp', 'nudge_audit.jsonl')
  : join(__dirname, '../../logs/nudge_audit.jsonl');

// Garantiza directorio de logs
async function asegurarDirLogs() {
  await mkdir(dirname(LOG_FILE), { recursive: true });
}

// Este módulo es exclusivamente server-side y debe ser usado por /api/nudges/log.
export async function guardarLogNudge(log) {
  if (!log || typeof log !== 'object') {
    throw new TypeError('El log de nudge debe ser un objeto.');
  }

  const logConFecha = {
    ...log,
    id: log.id || randomUUID(),
    creadoEn: new Date().toISOString()
  };

  if (isMongoConfigured()) {
    try {
      const client = await getMongoClient();
      const database = client.db('smart_planner');
      const result = await database.collection('nudge_logs').insertOne(logConFecha);
      return result.insertedId;
    } catch (error) {
      console.warn('Fallo guardado en MongoDB Atlas, respaldando en log local:', error.message);
    }
  }

  // Respaldo / Modo local de auditoría (Ley 21.459)
  await asegurarDirLogs();
  await appendFile(LOG_FILE, JSON.stringify(logConFecha) + '\n', 'utf8');
  return logConFecha.id;
}

export async function obtenerEstadisticasLogs() {
  const stats = {
    totalGenerados: 0,
    aceptados: 0,
    pospuestos: 0,
    descartados: 0,
    motor: isMongoConfigured() ? 'MongoDB Atlas (Cloud NoSQL SaaS)' : 'Almacenamiento Local de Auditoría'
  };

  try {
    if (isMongoConfigured()) {
      const client = await getMongoClient();
      const db = client.db('smart_planner');
      const collection = db.collection('nudge_logs');
      stats.totalGenerados = await collection.countDocuments({ tipo: 'nudge_generado' });
      stats.aceptados = await collection.countDocuments({ accion: 'aceptar' });
      stats.pospuestos = await collection.countDocuments({ accion: 'posponer' });
      stats.descartados = await collection.countDocuments({ accion: 'descartar' });
      return stats;
    }
  } catch (error) {
    console.warn('Error consultando MongoDB Atlas, leyendo log local:', error.message);
  }

  try {
    await asegurarDirLogs();
    const data = await readFile(LOG_FILE, 'utf8');
    const lineas = data.trim().split('\n').filter(Boolean);
    for (const linea of lineas) {
      try {
        const item = JSON.parse(linea);
        if (item.tipo === 'nudge_generado') stats.totalGenerados += 1;
        if (item.accion === 'aceptar') stats.aceptados += 1;
        if (item.accion === 'posponer') stats.pospuestos += 1;
        if (item.accion === 'descartar') stats.descartados += 1;
      } catch {
        // Ignorar línea corrupta
      }
    }
  } catch {
    // Archivo no existe aún
  }

  return stats;
}
