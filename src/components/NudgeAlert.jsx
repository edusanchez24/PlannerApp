export function NudgeAlert({ nudge, onAction, error }) {
  if (!nudge) return null;

  return (
    <aside role="status" aria-live="polite">
      <strong>Sugerencia de bienestar</strong>
      <p>{nudge.sugerencia.texto}</p>
      <small>
        Tienes {nudge.espacio.duracionMinutos} minutos libres (
        {nudge.espacio.desde.slice(0, 5)} - {nudge.espacio.hasta.slice(0, 5)}).
      </small>
      <div>
        <button type="button" onClick={() => onAction('aceptar')}>
          Aceptar sugerencia
        </button>
        <button type="button" onClick={() => onAction('posponer')}>
          Posponer
        </button>
        <button type="button" onClick={() => onAction('descartar')}>
          Descartar
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}
