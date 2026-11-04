import { supabase } from '../config/supabaseClient';

const activityFields =
  'id,user_id,titulo,categoria,fecha,hora_inicio,hora_fin,completada,created_at';

export const CATEGORIAS_VALIDAS = [
  'Estudio',
  'Deporte',
  'Salud',
  'Alimentacion',
  'Hobby',
  'Cuidado Personal'
];

function assertSuccessful(result, operation) {
  if (result.error) {
    throw new Error(`No fue posible ${operation}: ${result.error.message}`);
  }
  return result.data;
}

export async function obtenerActividadesPorFecha(userId, fecha) {
  if (!userId || !fecha) {
    throw new Error('Se requiere usuario y fecha para consultar actividades.');
  }

  const result = await supabase
    .from('actividades')
    .select(activityFields)
    .eq('user_id', userId)
    .eq('fecha', fecha)
    .order('hora_inicio', { ascending: true });

  return assertSuccessful(result, 'obtener las actividades');
}

export async function crearActividad(actividadData) {
  const { hora_inicio, hora_fin, titulo, categoria } = actividadData;
  if (!titulo || titulo.trim().length === 0) {
    throw new Error('El título de la actividad no puede estar vacío.');
  }
  if (!hora_inicio || !hora_fin) {
    throw new Error('Debes indicar hora de inicio y fin.');
  }
  if (hora_fin <= hora_inicio) {
    throw new Error('La hora de término debe ser posterior a la de inicio.');
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    throw new Error(`Categoría inválida. Debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`);
  }

  const result = await supabase
    .from('actividades')
    .insert({
      ...actividadData,
      titulo: titulo.trim(),
      completada: Boolean(actividadData.completada)
    })
    .select(activityFields)
    .single();

  return assertSuccessful(result, 'crear la actividad');
}

export async function actualizarActividad(id, cambios) {
  if (!id) throw new Error('Se requiere el identificador de la actividad.');

  if (cambios.hora_inicio && cambios.hora_fin && cambios.hora_fin <= cambios.hora_inicio) {
    throw new Error('La hora de término debe ser posterior a la de inicio.');
  }

  const result = await supabase
    .from('actividades')
    .update(cambios)
    .eq('id', id)
    .select(activityFields)
    .single();

  return assertSuccessful(result, 'actualizar la actividad');
}

export async function eliminarActividad(id) {
  if (!id) throw new Error('Se requiere el identificador de la actividad.');

  const result = await supabase.from('actividades').delete().eq('id', id);
  assertSuccessful(result, 'eliminar la actividad');
}

// Resumen semanal para el panel de estadísticas (Requisito 5.2 del Informe)
export async function obtenerResumenSemanal(userId, fechaReferencia = new Date()) {
  if (!userId) return null;

  const hoy = new Date(fechaReferencia);
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - 6); // Últimos 7 días

  const fechaInicioStr = inicioSemana.toISOString().slice(0, 10);
  const fechaFinStr = hoy.toISOString().slice(0, 10);

  const result = await supabase
    .from('actividades')
    .select(activityFields)
    .eq('user_id', userId);

  const todas = assertSuccessful(result, 'consultar actividades para resumen');
  
  // Filtrar rango de la semana
  const semanaActividades = todas.filter(
    (act) => act.fecha >= fechaInicioStr && act.fecha <= fechaFinStr
  );

  const tiempoPorCategoria = {};
  CATEGORIAS_VALIDAS.forEach((c) => {
    tiempoPorCategoria[c] = 0; // en minutos
  });

  let totalCompletadas = 0;

  for (const act of semanaActividades) {
    if (act.completada) totalCompletadas += 1;
    const [hI, mI] = act.hora_inicio.slice(0, 5).split(':').map(Number);
    const [hF, mF] = act.hora_fin.slice(0, 5).split(':').map(Number);
    const duracion = Math.max(0, hF * 60 + mF - (hI * 60 + mI));
    if (tiempoPorCategoria[act.categoria] !== undefined) {
      tiempoPorCategoria[act.categoria] += duracion;
    }
  }

  const minutosTotales = Object.values(tiempoPorCategoria).reduce((a, b) => a + b, 0);
  const minutosEstudio = tiempoPorCategoria['Estudio'] || 0;
  const minutosBienestar = minutosTotales - minutosEstudio;

  return {
    rango: { desde: fechaInicioStr, hasta: fechaFinStr },
    totalActividades: semanaActividades.length,
    completadas: totalCompletadas,
    porcentajeCompletadas: semanaActividades.length > 0
      ? Math.round((totalCompletadas / semanaActividades.length) * 100)
      : 0,
    tiempoPorCategoria,
    minutosTotales,
    minutosEstudio,
    minutosBienestar,
    indiceEquilibrio: minutosTotales > 0
      ? Math.round((minutosBienestar / minutosTotales) * 100)
      : 50
  };
}
