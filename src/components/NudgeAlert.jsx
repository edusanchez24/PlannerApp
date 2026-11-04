import { NikoAvatar } from './NikoAvatar';
import { IconClock, IconCheck, IconClose, IconSparkles, IconBulb } from './Icons';

export function NudgeAlert({ nudge, onAction, onAcceptAndSchedule, error }) {
  if (!nudge) return null;

  const categoria = nudge.sugerencia.categoria || 'Salud';
  const categoriaClass = `cat-${categoria.replace(/\s+/g, '-')}`;

  return (
    <aside className="nudge-card oneshot-dialogue" role="status" aria-live="polite">
      <div className="oneshot-dialogue-layout">
        {/* Retrato de Niko */}
        <div className="oneshot-avatar-container">
          <NikoAvatar size={62} />
        </div>

        {/* Cuerpo del Diálogo */}
        <div className="oneshot-dialogue-body">
          <div className="nudge-header">
            <div className="oneshot-nameplate">
              <IconSparkles size={13} className="oneshot-sparkle" />
              <strong>Niko & La Máquina del Mundo</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className={`category-chip ${categoriaClass}`}>
                {categoria}
              </span>
              <span className="nudge-time-info">
                <IconClock size={12} />
                <span>{nudge.espacio.duracionMinutos} min libres ({nudge.espacio.desde.slice(0, 5)} - {nudge.espacio.hasta.slice(0, 5)})</span>
              </span>
            </div>
          </div>

          <p className="nudge-text oneshot-text-dialogue">
            {nudge.sugerencia.texto}
          </p>

          {nudge.sugerencia.beneficio && (
            <p className="nudge-benefit">
              <IconBulb size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              <em>Impacto esperado:</em> {nudge.sugerencia.beneficio}
            </p>
          )}

          <div className="nudge-actions">
            <button
              type="button"
              className="btn-nudge-accept oneshot-btn-sun"
              onClick={() => (onAcceptAndSchedule ? onAcceptAndSchedule(nudge) : onAction('aceptar'))}
            >
              <IconCheck size={14} />
              <span>Aceptar e incluir en agenda</span>
            </button>
            <button
              type="button"
              className="btn-nudge-snooze"
              onClick={() => onAction('posponer')}
            >
              <IconClock size={13} />
              <span>Posponer</span>
            </button>
            <button
              type="button"
              className="btn-nudge-dismiss"
              onClick={() => onAction('descartar')}
            >
              <IconClose size={13} />
              <span>Descartar</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="alert-box alert-error" style={{ marginTop: '0.75rem' }} role="alert">
          {error}
        </p>
      )}
    </aside>
  );
}
