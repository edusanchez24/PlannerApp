import { createServer } from 'node:http';
import { guardarLogNudge } from './src/services/serverLogService.js';

const port = Number(process.env.API_PORT || 3001);

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
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
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('El cuerpo debe ser JSON válido.'));
      }
    });
    request.on('error', reject);
  });
}

const server = createServer(async (request, response) => {
  if (request.method !== 'POST' || request.url !== '/api/nudges/log') {
    sendJson(response, 404, { error: 'Ruta no encontrada.' });
    return;
  }

  try {
    const evento = await readBody(request);
    const id = await guardarLogNudge(evento);
    sendJson(response, 201, { id: id.toString() });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`API de Smart Planner escuchando en http://localhost:${port}`);
});
