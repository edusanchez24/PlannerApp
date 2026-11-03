import { useCallback, useEffect, useState } from 'react';
import {
  actualizarActividad,
  crearActividad,
  eliminarActividad,
  obtenerActividadesPorFecha
} from '../services/calendarService';
import {
  generarNudges,
  registrarAccionNudge
} from '../services/nudgeEngine';
import { NudgeAlert } from './NudgeAlert';

const CATEGORIAS = [
  'Estudio',
  'Deporte',
  'Salud',
  'Alimentacion',
  'Hobby',
  'Cuidado Personal'
];

function fechaLocal() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

const initialForm = {
  titulo: '',
  categoria: 'Estudio',
  hora_inicio: '09:00',
  hora_fin: '10:00'
};

export function AgendaManager({ userId }) {
  const [fecha, setFecha] = useState(fechaLocal);
  const [actividades, setActividades] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [nudge, setNudge] = useState(null);
  const [error, setError] = useState('');
  const [nudgeError, setNudgeError] = useState('');

  const cargarActividades = useCallback(async () => {
    try {
      setError('');
      setActividades(await obtenerActividadesPorFecha(userId, fecha));
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [fecha, userId]);

  useEffect(() => {
    cargarActividades();
  }, [cargarActividades]);

  useEffect(() => {
    let cancelled = false;
    async function evaluar() {
      try {
        const nudges = await generarNudges(actividades, { userId, fecha });
        if (!cancelled) setNudge(nudges?.[0] || null);
      } catch (nudgeLoadError) {
        if (!cancelled) setNudgeError(nudgeLoadError.message);
      }
    }
    if (actividades.length > 1) evaluar();
    return () => {
      cancelled = true;
    };
  }, [actividades, fecha, userId]);

  function actualizarCampo(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function agregarActividad(event) {
    event.preventDefault();
    try {
      setError('');
      await crearActividad({ ...form, user_id: userId, fecha });
      setForm(initialForm);
      await cargarActividades();
    } catch (createError) {
      setError(createError.message);
    }
  }

  async function marcarCompletada(actividad) {
    try {
      setError('');
      const updated = await actualizarActividad(actividad.id, {
        completada: !actividad.completada
      });
      setActividades((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function borrarActividad(id) {
    try {
      await eliminarActividad(id);
      setActividades((current) => current.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function manejarAccionNudge(accion) {
    try {
      setNudgeError('');
      await registrarAccionNudge(nudge, accion, { userId });
      setNudge(null);
    } catch (actionError) {
      setNudgeError(actionError.message);
    }
  }

  return (
    <section>
      <h2>Mi agenda</h2>
      <label htmlFor="fecha-agenda">Fecha</label>
      <input id="fecha-agenda" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />

      <form onSubmit={agregarActividad}>
        <h3>Añadir actividad</h3>
        <label htmlFor="titulo-actividad">Título</label>
        <input id="titulo-actividad" name="titulo" value={form.titulo} onChange={actualizarCampo} required maxLength={200} />
        <label htmlFor="categoria-actividad">Categoría</label>
        <select id="categoria-actividad" name="categoria" value={form.categoria} onChange={actualizarCampo}>
          {CATEGORIAS.map((categoria) => <option key={categoria}>{categoria}</option>)}
        </select>
        <label htmlFor="inicio-actividad">Inicio</label>
        <input id="inicio-actividad" name="hora_inicio" type="time" value={form.hora_inicio} onChange={actualizarCampo} required />
        <label htmlFor="fin-actividad">Fin</label>
        <input id="fin-actividad" name="hora_fin" type="time" value={form.hora_fin} onChange={actualizarCampo} required />
        <button type="submit">Añadir a mi agenda</button>
      </form>

      {error && <p role="alert">{error}</p>}
      <ul>
        {actividades.map((actividad) => (
          <li key={actividad.id}>
            <label>
              <input type="checkbox" checked={actividad.completada} onChange={() => marcarCompletada(actividad)} />
              <strong>{actividad.titulo}</strong> ({actividad.categoria}) - {actividad.hora_inicio.slice(0, 5)} a {actividad.hora_fin.slice(0, 5)}
            </label>
            <button type="button" onClick={() => borrarActividad(actividad.id)}>Eliminar</button>
          </li>
        ))}
      </ul>

      <NudgeAlert nudge={nudge} onAction={manejarAccionNudge} error={nudgeError} />
    </section>
  );
}
