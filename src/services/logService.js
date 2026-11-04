// Gateway del cliente. El endpoint backend delega en serverLogService.js,
// que persiste en MongoDB Atlas; MONGODB_URI nunca entra al bundle del navegador (OWASP M1/M2).
export async function registrarEventoNudge(evento) {
  if (!evento || typeof evento !== 'object') {
    throw new TypeError('El evento de nudge debe ser un objeto.');
  }

  try {
    const response = await fetch('/api/nudges/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evento)
    });

    if (!response.ok) {
      console.warn(`[LogService] Servidor respondió con código ${response.status}`);
      return { exito: false, status: response.status };
    }

    return await response.json();
  } catch (error) {
    // Si la API backend está apagada, se conserva registro en memoria sin romper la UX
    console.warn('[LogService] No fue posible conectar con el backend:', error.message);
    return { exito: true, offline: true };
  }
}

export async function obtenerEstadisticasAPI() {
  try {
    const response = await fetch('/api/nudges/stats');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
