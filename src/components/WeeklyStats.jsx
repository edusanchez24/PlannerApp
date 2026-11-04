import { useEffect, useState } from 'react';
import { obtenerResumenSemanal } from '../services/calendarService';
import { obtenerEstadisticasAPI } from '../services/logService';
import { IconChart, IconCheck, IconClock, IconSparkles } from './Icons';

export function WeeklyStats({ userId }) {
  const [resumen, setResumen] = useState(null);
  const [telemetria, setTelemetria] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      setCargando(true);
      try {
        const [res, stats] = await Promise.all([
          obtenerResumenSemanal(userId),
          obtenerEstadisticasAPI()
        ]);
        if (activo) {
          setResumen(res);
          setTelemetria(stats);
        }
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDatos();
    return () => {
      activo = false;
    };
  }, [userId]);

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Calculando métricas semanales...</div>;
  }

  if (!resumen) {
    return <div className="alert-box alert-info">No hay datos suficientes para generar estadísticas.</div>;
  }

  const horasEstudio = (resumen.minutosEstudio / 60).toFixed(1);
  const horasBienestar = (resumen.minutosBienestar / 60).toFixed(1);

  return (
    <section>
      <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffb74d' }}>
        <IconChart size={20} />
        <span>Panel de Estadísticas y Bienestar Semanal</span>
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Monitoreo del equilibrio académico y adherencia a hábitos saludables (Últimos 7 días).
      </p>

      {/* Tarjetas de Métricas Clave */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{horasEstudio}h</div>
          <div className="stat-label">Tiempo Dedicado a Estudio</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: '#2dd4bf' }}>
            {horasBienestar}h
          </div>
          <div className="stat-label">Tiempo de Bienestar y Pausas</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: '#a78bfa' }}>
            {resumen.porcentajeCompletadas}%
          </div>
          <div className="stat-label">Tareas Completadas</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: resumen.indiceEquilibrio >= 25 ? '#34d399' : '#fbbf24' }}>
            {resumen.indiceEquilibrio}%
          </div>
          <div className="stat-label">
            {resumen.indiceEquilibrio >= 25 ? 'Balance Saludable' : 'Riesgo de Fatiga'}
          </div>
        </div>
      </div>

      {/* Distribución por Categorías */}
      <div className="category-breakdown">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem', color: '#f8fafc' }}>
          Distribución de Horas por Categoría
        </h3>

        <div className="bar-container">
          {Object.entries(resumen.tiempoPorCategoria).map(([categoria, minutos]) => {
            if (minutos === 0 || resumen.minutosTotales === 0) return null;
            const pct = Math.round((minutos / resumen.minutosTotales) * 100);
            const colorClass = `cat-${categoria.replace(/\s+/g, '-')}`;
            return (
              <div
                key={categoria}
                className={`bar-segment ${colorClass}`}
                style={{ width: `${pct}%` }}
                title={`${categoria}: ${minutos} min (${pct}%)`}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
          {Object.entries(resumen.tiempoPorCategoria).map(([categoria, minutos]) => (
            <div
              key={categoria}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
            >
              <span className={`category-chip cat-${categoria.replace(/\s+/g, '-')}`}>
                {categoria}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {(minutos / 60).toFixed(1)} hrs
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetría del Servidor y MongoDB Atlas */}
      {telemetria && (
        <div style={{ background: '#130e26', border: '1px solid #382a54', borderRadius: '4px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffb74d' }}>
            <IconSparkles size={16} />
            <span>Telemetría de Digital Nudges</span>
            <small style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
              ({telemetria.motor})
            </small>
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Eventos auditados y persistidos según las directrices de integridad de la Ley N° 21.459:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', textAlign: 'center' }}>
            <div style={{ background: '#0e091e', padding: '0.75rem', borderRadius: '3px', border: '1px solid #2d2045' }}>
              <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#f8fafc' }}>{telemetria.totalGenerados}</div>
              <small style={{ color: '#94a3b8' }}>Sugerencias Generadas</small>
            </div>
            <div style={{ background: '#0e091e', padding: '0.75rem', borderRadius: '3px', border: '1px solid #2d2045' }}>
              <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#34d399' }}>{telemetria.aceptados}</div>
              <small style={{ color: '#94a3b8' }}>Aceptadas</small>
            </div>
            <div style={{ background: '#0e091e', padding: '0.75rem', borderRadius: '3px', border: '1px solid #2d2045' }}>
              <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#fbbf24' }}>{telemetria.pospuestos}</div>
              <small style={{ color: '#94a3b8' }}>Pospuestas</small>
            </div>
            <div style={{ background: '#0e091e', padding: '0.75rem', borderRadius: '3px', border: '1px solid #2d2045' }}>
              <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#94a3b8' }}>{telemetria.descartados}</div>
              <small style={{ color: '#94a3b8' }}>Descartadas</small>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
