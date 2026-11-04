import { useCallback, useEffect, useState } from 'react';
import {
  actualizarActividad,
  crearActividad,
  eliminarActividad,
  obtenerActividadesPorFecha,
  CATEGORIAS_VALIDAS
} from '../services/calendarService';
import {
  generarNudges,
  registrarAccionNudge,
  prepararActividadDesdeNudge,
  reproducirCampanaBienestar,
  solicitarPermisoNotificaciones,
  enviarNotificacionNudge,
  estaEnBloqueoNocturno
} from '../services/nudgeEngine';
import { NudgeAlert } from './NudgeAlert';
import { IconCalendar, IconClock, IconEdit, IconTrash, IconPlus, IconMoon, IconSun, IconSparkles } from './Icons';

function fechaLocal(offsetDias = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDias);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

const initialForm = {
  titulo: '',
  categoria: 'Estudio',
  hora_inicio: '10:00',
  hora_fin: '11:30'
};

export function AgendaManager({ userId }) {
  const [fecha, setFecha] = useState(() => fechaLocal(0));
  const [actividades, setActividades] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editandoActividad, setEditandoActividad] = useState(null);
  const [nudge, setNudge] = useState(null);
  const [error, setError] = useState('');
  const [nudgeError, setNudgeError] = useState('');
  const [simularNoche, setSimularNoche] = useState(false);
  const [latenciaRNF02, setLatenciaRNF02] = useState(null);

  // Solicitar permiso de notificaciones push
  useEffect(() => {
    solicitarPermisoNotificaciones();
  }, []);

  const cargarActividades = useCallback(async () => {
    try {
      setError('');
      const data = await obtenerActividadesPorFecha(userId, fecha);
      setActividades(data || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [fecha, userId]);

  useEffect(() => {
    cargarActividades();
  }, [cargarActividades]);

  // Evaluación de Nudges de Bienestar (Empujones Digitales)
  useEffect(() => {
    let cancelled = false;

    async function evaluar() {
      const inicioTiempo = performance.now();
      try {
        const fakeDate = simularNoche ? new Date(2026, 10, 3, 23, 30) : new Date();
        const nudges = await generarNudges(actividades, {
          userId,
          fecha,
          now: fakeDate
        });

        const finTiempo = performance.now();
        const latenciaMs = Math.round(finTiempo - inicioTiempo);
        if (!cancelled) setLatenciaRNF02(latenciaMs);

        if (!cancelled) {
          const primerNudge = nudges?.[0] || null;
          if (primerNudge && (!nudge || nudge.id !== primerNudge.id)) {
            // Sonido suave y notificación del navegador
            reproducirCampanaBienestar();
            enviarNotificacionNudge(primerNudge);
          }
          setNudge(primerNudge);
        }
      } catch (nudgeLoadError) {
        if (!cancelled) setNudgeError(nudgeLoadError.message);
      }
    }

    if (actividades.length >= 1) {
      evaluar();
    } else {
      setNudge(null);
    }

    return () => {
      cancelled = true;
    };
  }, [actividades, fecha, userId, simularNoche]);

  function actualizarCampo(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function actualizarCampoEdicion(event) {
    setEditandoActividad((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
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

  async function guardarEdicionActividad(event) {
    event.preventDefault();
    try {
      setError('');
      await actualizarActividad(editandoActividad.id, {
        titulo: editandoActividad.titulo,
        categoria: editandoActividad.categoria,
        hora_inicio: editandoActividad.hora_inicio,
        hora_fin: editandoActividad.hora_fin
      });
      setEditandoActividad(null);
      await cargarActividades();
    } catch (updateError) {
      setError(updateError.message);
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

  // Funcionalidad clave: Aceptar sugerencia e insertarla directamente en la agenda
  async function manejarAceptarEInsertar(nudgeAceptado) {
    try {
      setNudgeError('');
      // 1. Registrar interacción en MongoDB / telemetría
      await registrarAccionNudge(nudgeAceptado, 'aceptar', { userId });
      
      // 2. Crear actividad en la agenda
      const nuevaActividad = prepararActividadDesdeNudge(nudgeAceptado, userId);
      await crearActividad(nuevaActividad);
      
      // 3. Recargar agenda y limpiar nudge actual
      setNudge(null);
      await cargarActividades();
    } catch (err) {
      setNudgeError(`Error al calendarizar la sugerencia: ${err.message}`);
    }
  }

  const hoyStr = fechaLocal(0);
  const ayerStr = fechaLocal(-1);
  const mananaStr = fechaLocal(1);

  const totalCompletadas = actividades.filter((a) => a.completada).length;

  return (
    <section>
      {/* Controles de Fecha */}
      <div className="agenda-controls">
        <div className="date-picker-group">
          <label htmlFor="fecha-agenda" className="date-picker-label">
            <IconCalendar size={14} />
            <span>Día:</span>
          </label>
          <input
            id="fecha-agenda"
            type="date"
            className="oneshot-date-input"
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`quick-date-btn ${fecha === ayerStr ? 'active' : ''}`}
            onClick={() => setFecha(ayerStr)}
          >
            Ayer
          </button>
          <button
            type="button"
            className={`quick-date-btn ${fecha === hoyStr ? 'active' : ''}`}
            onClick={() => setFecha(hoyStr)}
          >
            Hoy
          </button>
          <button
            type="button"
            className={`quick-date-btn ${fecha === mananaStr ? 'active' : ''}`}
            onClick={() => setFecha(mananaStr)}
          >
            Mañana
          </button>

          {latenciaRNF02 !== null && (
            <span
              className="latency-badge"
              title="Cumplimiento Requerimiento No Funcional RNF02: Respuesta < 2000ms"
            >
              RNF02: {latenciaRNF02}ms (&lt;2s)
            </span>
          )}
        </div>
      </div>

      {/* Alerta de Nudge Activo (Empujón Digital) */}
      <NudgeAlert
        nudge={nudge}
        onAction={manejarAccionNudge}
        onAcceptAndSchedule={manejarAceptarEInsertar}
        error={nudgeError}
      />

      {/* Aviso de Bloqueo Nocturno si está activo (SOCHIMES - RF04) */}
      {(simularNoche || estaEnBloqueoNocturno()) && (
        <div className="alert-box alert-info oneshot-night-card">
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <span className="night-icon-wrapper">
              <IconMoon size={22} />
            </span>
            <div>
              <strong style={{ color: '#ffd54f', display: 'block', marginBottom: '0.2rem' }}>
                Protección del Sueño Activa (RF04 - SOCHIMES)
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#c7d2fe' }}>
                Niko descansa en el Refugio. La Máquina del Mundo suspende las alertas entre las 23:00 y las 07:00 hrs para resguardar tu sueño biológico.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario Añadir Actividad (RF02) */}
      <div className="add-activity-card">
        <h3 className="section-card-title">
          <IconPlus size={16} />
          <span>Planificar Nueva Actividad (RF02)</span>
        </h3>
        <form onSubmit={agregarActividad}>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="titulo-actividad">Título de la actividad</label>
              <input
                id="titulo-actividad"
                name="titulo"
                value={form.titulo}
                onChange={actualizarCampo}
                required
                maxLength={200}
                placeholder="Ej: Estudio para Certamen de Redes"
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoria-actividad">Categoría</label>
              <select
                id="categoria-actividad"
                name="categoria"
                value={form.categoria}
                onChange={actualizarCampo}
              >
                {CATEGORIAS_VALIDAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="inicio-actividad">Hora Inicio</label>
              <input
                id="inicio-actividad"
                name="hora_inicio"
                type="time"
                value={form.hora_inicio}
                onChange={actualizarCampo}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fin-actividad">Hora Término</label>
              <input
                id="fin-actividad"
                name="hora_fin"
                type="time"
                value={form.hora_fin}
                onChange={actualizarCampo}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            <IconPlus size={15} />
            <span>Añadir a mi Agenda</span>
          </button>
        </form>
      </div>

      {error && <div className="alert-box alert-error" role="alert">{error}</div>}

      {/* Lista de Actividades de la Agenda */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
          Actividades del Día ({actividades.length})
        </h3>
        {actividades.length > 0 && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {totalCompletadas} de {actividades.length} completadas
          </span>
        )}
      </div>

      {actividades.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            No tienes actividades registradas para esta fecha.
          </p>
          <small style={{ color: '#94a3b8' }}>
            Añade al menos dos actividades con un espacio libre superior a 30 minutos para ver el motor de Nudges en acción.
          </small>
        </div>
      ) : (
        <div className="activities-list-container">
          {actividades.map((actividad) => {
            const categoriaClass = `cat-${actividad.categoria.replace(/\s+/g, '-')}`;
            return (
              <div
                key={actividad.id}
                className={`activity-card-item ${actividad.completada ? 'completed' : ''}`}
              >
                <div className="activity-left-col">
                  <input
                    type="checkbox"
                    className="activity-checkbox"
                    checked={actividad.completada}
                    onChange={() => marcarCompletada(actividad)}
                    title={actividad.completada ? 'Marcar como pendiente' : 'Marcar como completada'}
                  />
                  <div className="activity-content">
                    <span className="activity-title">{actividad.titulo}</span>
                    <div className="activity-meta-row">
                      <span className={`category-chip ${categoriaClass}`}>
                        {actividad.categoria}
                      </span>
                      <span className="activity-time-chip">
                        <IconClock size={12} />
                        <span>{actividad.hora_inicio.slice(0, 5)} - {actividad.hora_fin.slice(0, 5)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="activity-actions-col">
                  <button
                    type="button"
                    className="action-btn-edit"
                    onClick={() => setEditandoActividad(actividad)}
                    title="Modificar actividad (RF02)"
                  >
                    <IconEdit size={13} />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn-delete"
                    onClick={() => borrarActividad(actividad.id)}
                    title="Eliminar actividad (RF02)"
                  >
                    <IconTrash size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Edición de Actividad (Modificar - RF02) */}
      {editandoActividad && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 7, 24, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setEditandoActividad(null)}
        >
          <div
            style={{
              background: '#191136',
              border: '2px solid #5a4185',
              borderRadius: '14px',
              padding: '1.75rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 35px rgba(0,0,0,0.6), 0 0 20px rgba(245, 158, 11, 0.2)',
              color: '#f8fafc'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', color: '#ffb74d', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconEdit size={18} />
              <span>Modificar Actividad (RF02)</span>
            </h3>
            <form onSubmit={guardarEdicionActividad}>
              <div className="form-group">
                <label htmlFor="edit-titulo">Título</label>
                <input
                  id="edit-titulo"
                  name="titulo"
                  value={editandoActividad.titulo}
                  onChange={actualizarCampoEdicion}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-categoria">Categoría</label>
                <select
                  id="edit-categoria"
                  name="categoria"
                  value={editandoActividad.categoria}
                  onChange={actualizarCampoEdicion}
                >
                  {CATEGORIAS_VALIDAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label htmlFor="edit-inicio">Hora Inicio</label>
                  <input
                    id="edit-inicio"
                    name="hora_inicio"
                    type="time"
                    value={editandoActividad.hora_inicio.slice(0, 5)}
                    onChange={actualizarCampoEdicion}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-fin">Hora Término</label>
                  <input
                    id="edit-fin"
                    name="hora_fin"
                    type="time"
                    value={editandoActividad.hora_fin.slice(0, 5)}
                    onChange={actualizarCampoEdicion}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditandoActividad(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Caja de Simulación para Demostración en Vivo (Evaluación 3) */}
      <div className="simulator-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconSparkles size={16} />
          <strong>Control de Demostración Docente (RF04):</strong>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Prueba en vivo la regla de bloqueo nocturno (23:00 - 07:00 hrs).
          </span>
        </div>
        <button
          type="button"
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => setSimularNoche(!simularNoche)}
        >
          {simularNoche ? (
            <>
              <IconSun size={14} />
              <span>Volver a Horario Real</span>
            </>
          ) : (
            <>
              <IconMoon size={14} />
              <span>Simular Noche (23:30)</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
