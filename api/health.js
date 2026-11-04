import { isMongoConfigured } from '../../src/config/mongoClient.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    status: 'ok',
    service: 'Smart Planner Telemetry & Nudge API (Vercel Serverless)',
    timestamp: new Date().toISOString(),
    mongoConfigured: isMongoConfigured(),
    databaseMode: isMongoConfigured() ? 'MongoDB Atlas Cloud' : 'Vercel Serverless Audit Storage'
  });
}
