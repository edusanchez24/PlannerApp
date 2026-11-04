import { registrarEventoNudge } from './logService';

const NIGHT_START = 23;
const NIGHT_END = 7;

// Regla de bienestar: no se generan ni notifican sugerencias entre 23:00 y 07:00 (Protección del sueño SOCHIMES).
export function estaEnBloqueoNocturno(date = new Date()) {
  const hour = date.getHours();
  return hour >= NIGHT_START || hour < NIGHT_END;
}

function minutosDesdeMedianoche(time) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function formatoMinutosAHora(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function elegirSugerencia(index, duration) {
  const suggestions = [
    {
      tipo: 'pausa-activa',
      texto: 'Paseo por The Glen o el campus: caminata y estiramiento de 15 min.',
      categoria: 'Deporte',
      beneficio: 'Combate el sedentarismo y reactiva la circulación y vitalidad.'
    },
    {
      tipo: 'descanso-visual',
      texto: 'Cuidar la Bombilla del Sol: descanso visual de la pantalla e hidratación (regla 20-20-20).',
      categoria: 'Salud',
      beneficio: 'Reduce la fatiga ocular y restaura la calma mental.'
    },
    {
      tipo: 'alimentacion',
      texto: 'Unos panqueques o colación saludable: recarga energía con una pausa nutritiva.',
      categoria: 'Alimentacion',
      beneficio: 'Mantiene niveles estables de glucosa y energía para la jornada.'
    },
    {
      tipo: 'cuidado-personal',
      texto: 'Respiración consciente en el Refugio: 10 min de calma y desconexión.',
      categoria: 'Cuidado Personal',
      beneficio: 'Disminuye la ansiedad frente a evaluaciones y compromisos.'
    }
  ];

  const seleccion = suggestions[index % suggestions.length];
  return {
    ...seleccion,
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
    const previousEnd = minutosDesdeMedianoche(ordered[index - 1].hora_fin);
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

  const nudges = evaluarEspaciosLibres(actividades).map((gap, index) => {
    const sugerencia = elegirSugerencia(index, gap.duracionMinutos);
    const minInicio = minutosDesdeMedianoche(gap.desde);
    const minFin = minInicio + sugerencia.duracionMinutos;

    return {
      id: `${fecha || 'dia'}-${gap.desde}-${gap.hasta}`,
      userId,
      fecha,
      espacio: gap,
      sugerencia,
      horaInicioPropuesta: formatoMinutosAHora(minInicio),
      horaFinPropuesta: formatoMinutosAHora(minFin)
    };
  });

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
    sugerencia: nudge.sugerencia?.texto,
    registradoEn: new Date().toISOString()
  });
}

// Convierte el Nudge en una actividad para insertarlo en la agenda
export function prepararActividadDesdeNudge(nudge, userId) {
  return {
    user_id: userId,
    fecha: nudge.fecha,
    titulo: nudge.sugerencia.texto,
    categoria: nudge.sugerencia.categoria,
    hora_inicio: nudge.horaInicioPropuesta || nudge.espacio.desde.slice(0, 5),
    hora_fin: nudge.horaFinPropuesta || nudge.espacio.hasta.slice(0, 5),
    completada: false
  };
}

// Reproducción de alerta sonora suave mediante Web Audio API estilo caja de música OneShot
export function reproducirCampanaBienestar() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Notas de la caja de música (E5, G#5, B5, E6)
    const notas = [659.25, 830.61, 987.77, 1318.51];
    const duracionNota = 0.45;

    notas.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Envolvente de campana suave con caída exponencial
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duracionNota);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duracionNota);
    });
  } catch (err) {
    console.debug('Audio API no permitida o no disponible:', err);
  }
}

// Notificación Web nativa del navegador (Funcionalidad crítica de alerta en pauta)
export async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function enviarNotificacionNudge(nudge) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification('Smart Planner · Sugerencia de Bienestar', {
    body: `${nudge.sugerencia.texto} (${nudge.espacio.duracionMinutos} min libres).`,
    icon: '/favicon.ico',
    silent: false
  });
}
