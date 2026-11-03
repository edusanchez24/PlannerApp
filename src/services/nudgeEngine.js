import { registrarEventoNudge } from './logService';

const NIGHT_START = 23;
const NIGHT_END = 7;

function estaEnBloqueoNocturno(date = new Date()) {
  const hour = date.getHours();
  return hour >= NIGHT_START || hour < NIGHT_END;
}

function minutosDesdeMedianoche(time) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function elegirSugerencia(index, duration) {
  const suggestions = [
    { tipo: 'pausa-activa', texto: 'Pausa activa: caminata de 15 min.' },
    { tipo: 'descanso-visual', texto: 'Hidratación y descanso visual.' },
    { tipo: 'alimentacion', texto: 'Momento de snack/alimentación.' }
  ];

  return {
    ...suggestions[index % suggestions.length],
    duracionMinutos: Math.min(15, duration)
  };
}

// Devuelve huecos estrictamente mayores a 30 minutos, ordenados cronológicamente.
export function evaluarEspaciosLibres(actividades = []) {
  if (!Array.isArray(actividades)) {
    throw new TypeError('Las actividades deben ser un arreglo.');
  }

  const ordered = [...actividades].sort(
    (a, b) =>
      minutosDesdeMedianoche(a.hora_inicio) -
      minutosDesdeMedianoche(b.hora_inicio)
  );
  const gaps = [];

  for (let index = 1; index < ordered.length; index += 1) {
    const previousEnd = minutosDesdeMedianoche(
      ordered[index - 1].hora_fin
    );
    const nextStart = minutosDesdeMedianoche(ordered[index].hora_inicio);
    const duration = nextStart - previousEnd;

    if (duration > 30) {
      gaps.push({
        desde: ordered[index - 1].hora_fin,
        hasta: ordered[index].hora_inicio,
        duracionMinutos: duration
      });
    }
  }

  return gaps;
}

export async function generarNudges(
  actividades,
  { userId, fecha, now = new Date(), logger = registrarEventoNudge } = {}
) {
  // Regla de bienestar: no se generan ni notifican sugerencias entre 23:00 y 07:00.
  if (estaEnBloqueoNocturno(now)) return null;

  const nudges = evaluarEspaciosLibres(actividades).map((gap, index) => ({
    id: `${fecha || 'dia'}-${gap.desde}-${gap.hasta}`,
    userId,
    fecha,
    espacio: gap,
    sugerencia: elegirSugerencia(index, gap.duracionMinutos)
  }));

  for (const nudge of nudges) {
    await logger({
      tipo: 'nudge_generado',
      userId,
      nudgeId: nudge.id,
      fecha,
      sugerencia: nudge.sugerencia,
      espacio: nudge.espacio
    });
  }

  return nudges;
}

export async function registrarAccionNudge(
  nudge,
  accion,
  { userId, logger = registrarEventoNudge } = {}
) {
  const accionesValidas = ['aceptar', 'posponer', 'descartar'];
  if (!nudge || !accionesValidas.includes(accion)) {
    throw new Error('La acción del nudge no es válida.');
  }

  return logger({
    tipo: 'nudge_interaccion',
    accion,
    userId,
    nudgeId: nudge.id,
    fecha: nudge.fecha,
    registradoEn: new Date().toISOString()
  });
}
