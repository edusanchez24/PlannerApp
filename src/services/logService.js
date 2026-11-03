// Gateway del cliente. El endpoint backend debe delegar en serverLogService.js,
// que persiste en MongoDB; MONGODB_URI nunca entra al bundle del navegador.
export async function registrarEventoNudge(evento) {
  if (!evento || typeof evento !== 'object') {
    throw new TypeError('El evento de nudge debe ser un objeto.');
  }

  const response = await fetch('/api/nudges/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evento)
  });

  if (!response.ok) {
    throw new Error(`No fue posible registrar el evento (${response.status}).`);
  }

  return response.json();
}
