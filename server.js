import { createServer } from 'node:http';
import { guardarLogNudge, obtenerEstadisticasLogs } from './src/services/serverLogService.js';
import { isMongoConfigured } from './src/config/mongoClient.js';

const port = Number(process.env.API_PORT || 3001);

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) reject(new Error('El cuerpo de la solicitud es demasiado grande.'));
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('El cuerpo debe ser JSON válido.'));
      }
    });
    request.on('error', reject);
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  // Soporte preflight CORS
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    response.end();
    return;
  }

  // Ruta raíz: informativo para el navegador
  if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
    if (request.headers.accept?.includes('text/html')) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Smart Planner API</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2.5rem 1rem; max-width: 620px; margin: auto; line-height: 1.5; }
    .card { background: #1e293b; padding: 2rem; border-radius: 14px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    h1 { color: #38bdf8; font-size: 1.5rem; margin-top: 0; }
    p { color: #cbd5e1; margin-bottom: 1rem; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 700; margin: 0.5rem 0 1.5rem 0; font-size: 1rem; }
    .btn:hover { background: #1d4ed8; }
    hr { border: none; border-top: 1px solid #334155; margin: 1.5rem 0; }
    code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📡 Servidor API de Smart Planner (Puerto 3001)</h1>
    <p>Este puerto aloja el <strong>backend de telemetría, auditoría y logging (MongoDB Atlas)</strong>.</p>
    <p>Para ver y usar la <strong>aplicación web (calendario, nudges, estadísticas y login)</strong>, haz clic aquí:</p>
    <div>
      <a class="btn" href="http://localhost:5173">👉 Ir a la Aplicación en http://localhost:5173</a>
    </div>
    <hr>
    <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 0;">
      <strong>Endpoints de la API:</strong><br>
      • <a href="/api/health" style="color:#38bdf8;">/api/health</a> (Estado de salud del backend)<br>
      • <a href="/api/nudges/stats" style="color:#38bdf8;">/api/nudges/stats</a> (Estadísticas y auditoría de eventos)
    </p>
  </div>
</body>
</html>`);
      return;
    }

    sendJson(response, 200, {
      mensaje: 'API de Smart Planner en ejecución en puerto 3001',
      aplicacionFrontend: 'http://localhost:5173',
      endpoints: ['/api/health', '/api/nudges/stats', '/api/nudges/log']
    });
    return;
  }

  // Health check
  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, {
      status: 'ok',
      service: 'Smart Planner Telemetry & Nudge API',
      timestamp: new Date().toISOString(),
      mongoConfigured: isMongoConfigured(),
      databaseMode: isMongoConfigured() ? 'MongoDB Atlas Cloud' : 'Local Audit Storage'
    });
    return;
  }

  // Estadísticas de Nudges
  if (request.method === 'GET' && url.pathname === '/api/nudges/stats') {
    try {
      const stats = await obtenerEstadisticasLogs();
      sendJson(response, 200, stats);
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
    return;
  }

  // Registro de eventos de Nudge (audit log Ley 21.459)
  if (request.method === 'POST' && url.pathname === '/api/nudges/log') {
    try {
      const evento = await readBody(request);
      const id = await guardarLogNudge(evento);
      sendJson(response, 201, { id: id.toString(), exito: true });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  sendJson(response, 404, { error: 'Ruta no encontrada.' });
});

server.listen(port, () => {
  console.log(`[Smart Planner] API escuchando en http://localhost:${port}`);
  console.log(`[Smart Planner] Modo de telemetría: ${isMongoConfigured() ? 'MongoDB Atlas (Cloud)' : 'Local Audit Log'}`);
});

