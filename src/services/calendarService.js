import { supabase } from '../config/supabaseClient';

const activityFields =
  'id,user_id,titulo,categoria,fecha,hora_inicio,hora_fin,completada,created_at';

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
  const result = await supabase
    .from('actividades')
    .insert(actividadData)
    .select(activityFields)
    .single();

  return assertSuccessful(result, 'crear la actividad');
}

export async function actualizarActividad(id, cambios) {
  if (!id) throw new Error('Se requiere el identificador de la actividad.');

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
