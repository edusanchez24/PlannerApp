import { useState } from 'react';
import { exportarDatosUsuario, eliminarCuenta } from '../services/authService';
import { IconShield, IconDownload, IconTrash } from './Icons';

export function PrivacySection({ userId, profile }) {
  const [descargando, setDescargando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  async function manejarExportacion() {
    try {
      setDescargando(true);
      setMensaje({ tipo: '', texto: '' });
      const data = await exportarDatosUsuario(userId);
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis_datos_smart_planner_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMensaje({
        tipo: 'success',
        texto: 'Se ha descargado la copia íntegra de tus datos personales (Derecho de Portabilidad / Acceso).'
      });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error al exportar datos: ${err.message}` });
    } finally {
      setDescargando(false);
    }
  }

  async function manejarEliminacionCuenta() {
    const seguro = window.confirm(
      '¿Estás seguro de que deseas eliminar permanentemente tu cuenta y todos tus datos personales? Esta acción es irreversible y cumple con el Derecho al Olvido (Ley N° 21.719).'
    );
    if (!seguro) return;

    try {
      setEliminando(true);
      setMensaje({ tipo: '', texto: '' });
      await eliminarCuenta(userId);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error al eliminar cuenta: ${err.message}` });
      setEliminando(false);
    }
  }

  return (
    <section>
      <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffb74d' }}>
        <IconShield size={20} />
        <span>Marco Normativo, Ético y Privacidad</span>
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Cumplimiento legal, estándares de ingeniería segura y garantías de derechos para el estudiantado.
      </p>

      {mensaje.texto && (
        <div className={`alert-box alert-${mensaje.tipo}`} role="alert">
          {mensaje.texto}
        </div>
      )}

      {/* Grid de Normativas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#130e26', border: '1px solid #382a54', borderRadius: '4px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#60a5fa', marginBottom: '0.5rem' }}>
            Ley N° 21.719 (Protección de Datos)
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Moderniza la normativa chilena alineándola con el estándar GDPR. Exige consentimiento expreso, principio de finalidad y garantía de los <strong>Derechos ARCO</strong> (Acceso, Rectificación, Cancelación y Oposición).
          </p>
        </div>

        <div style={{ background: '#130e26', border: '1px solid #382a54', borderRadius: '4px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#34d399', marginBottom: '0.5rem' }}>
            Ley N° 21.459 (Delitos Informáticos)
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Sanciona el acceso ilícito, interceptación y daño a datos. Nuestra arquitectura implementa <strong>Row Level Security (RLS)</strong> en PostgreSQL, imposibilitando el acceso cruzado entre cuentas de estudiantes.
          </p>
        </div>

        <div style={{ background: '#130e26', border: '1px solid #382a54', borderRadius: '4px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#c084fc', marginBottom: '0.5rem' }}>
            Código Ético (ACM & Colegio de Ingenieros)
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Compromiso con el bienestar integral del ser humano. Se evita la sobreproductividad tóxica respetando el horario de descanso (SOCHIMES) y declarando el carácter no clínico de las sugerencias (IEEE 2021).
          </p>
        </div>

        <div style={{ background: '#130e26', border: '1px solid #382a54', borderRadius: '4px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fbbf24', marginBottom: '0.5rem' }}>
            OWASP Mobile Top 10
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            M1: Almacenamiento seguro cifrado en reposo (AES-256).<br />
            M2: Sin credenciales secretas (MONGODB_URI) en el cliente.<br />
            M3: Autenticación robusta y verificación de entradas en API.
          </p>
        </div>
      </div>

      {/* Ejercicio de Derechos ARCO */}
      <div style={{ background: '#130e26', border: '1px solid #382a54', borderRadius: '4px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.5rem', color: '#f8fafc' }}>
          Gestión de Tus Derechos de Datos (ARCO)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Titular actual: <strong>{profile?.nombre || 'Estudiante'}</strong> ({profile?.email || 'N/A'}).
          Consentimiento otorgado: {profile?.consentimiento_ley_21719 ? 'Válido y Registrado' : 'Pendiente'}.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={manejarExportacion}
            disabled={descargando}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <IconDownload size={14} />
            <span>{descargando ? 'Generando archivo...' : 'Descargar mis Datos (JSON)'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            onClick={manejarEliminacionCuenta}
            disabled={eliminando}
          >
            <IconTrash size={14} />
            <span>{eliminando ? 'Eliminando...' : 'Ejercer Derecho al Olvido (Eliminar Cuenta)'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
