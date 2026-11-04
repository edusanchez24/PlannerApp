import { guardarLogNudge } from '../../src/services/serverLogService.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Use POST.' });
  }

  try {
    const payload = req.body || {};
    const id = await guardarLogNudge(payload);
    return res.status(201).json({ id: id.toString(), exito: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
