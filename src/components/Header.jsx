import { useState, useEffect } from 'react';
import { isCloudConfigured } from '../config/supabaseClient';
import { cerrarSesion } from '../services/authService';
import { reproducirCampanaBienestar } from '../services/nudgeEngine';
import { NikoAvatar } from './NikoAvatar';
import { IconPhone, IconMusic, IconBulb, IconUser } from './Icons';

export function Header({ user, profile }) {
  const [mostrarQR, setMostrarQR] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setInstallPrompt(e);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setInstalado(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  async function manejarCerrarSesion() {
    try {
      await cerrarSesion();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  async function manejarInstalacion() {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
        setInstalado(true);
      }
    } else {
      alert(
        "📱 Para instalar Smart Planner con su icono en la pantalla de inicio de tu celular:\n\n" +
        "• En Android / Chrome: Toca el menú (⋮) arriba a la derecha y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.\n\n" +
        "• En iPhone / Safari: Toca el botón Compartir (cuadrado con flecha hacia arriba) y selecciona 'Agregar al inicio'."
      );
    }
  }

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const mobileUrl = currentOrigin.includes('localhost') ? 'http://192.168.1.12:5173' : currentOrigin;

  return (
    <header className="app-header oneshot-header">
      <div className="header-top">
        <div className="brand-wrapper">
          <NikoAvatar size={42} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <h1 className="brand-title">Smart Planner</h1>
              <span className="oneshot-badge-edition">OneShot Edition</span>
            </div>
            <p className="brand-subtitle">Refugio Estudiantil & La Máquina del Mundo</p>
          </div>
        </div>

        <div className="header-actions">
          {!instalado && (
            <button
              type="button"
              className="btn-secondary oneshot-btn-glass"
              onClick={manejarInstalacion}
              style={{ borderColor: 'var(--oneshot-sun-gold)', color: 'var(--oneshot-sun-gold)' }}
              title="Instalar como app en tu pantalla de inicio"
            >
              <IconPhone size={13} />
              <span>Instalar App</span>
            </button>
          )}

          <button
            type="button"
            className="btn-secondary oneshot-btn-glass"
            onClick={() => setMostrarQR(true)}
            title="Escanear código QR para abrir en celular"
          >
            <IconPhone size={13} />
            <span>Compartir</span>
          </button>

          <button
            type="button"
            className="btn-secondary oneshot-btn-glass"
            onClick={reproducirCampanaBienestar}
            title="Prueba la melodía etérea de caja de música estilo OneShot (Web Audio API)"
          >
            <IconMusic size={13} />
            <span>Caja de Música</span>
          </button>

          <span
            className={`connection-badge ${isCloudConfigured ? 'badge-cloud' : 'badge-demo'}`}
            title={isCloudConfigured ? 'Conectado a PostgreSQL en Supabase Cloud con RLS' : 'Demostración local en navegador / offline seguro'}
          >
            <span className="badge-dot" />
            <span>{isCloudConfigured ? 'Supabase Cloud' : 'Memoria del Refugio'}</span>
          </span>
        </div>
      </div>

      {user && (
        <div className="header-user-bar">
          <div className="user-info">
            <IconUser size={14} style={{ color: 'var(--oneshot-sun-gold)' }} />
            <span className="user-name">{profile?.nombre || user.user_metadata?.nombre || user.email}</span>
            <span className="user-role-chip">{profile?.rol || 'Estudiante'}</span>
          </div>

          <button
            type="button"
            className="btn-logout"
            onClick={manejarCerrarSesion}
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      {mostrarQR && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 7, 24, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setMostrarQR(false)}
        >
          <div
            className="oneshot-modal-content"
            style={{
              background: '#181236',
              borderRadius: '16px',
              border: '2px solid #5a4185',
              padding: '2rem',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 35px rgba(0,0,0,0.6), 0 0 25px rgba(255,183,77,0.25)',
              color: '#f8fafc'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <NikoAvatar size={54} glow={true} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.35rem', color: '#ffb74d' }}>
              La Máquina del Mundo en tu Celular
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '1.25rem' }}>
              Conéctate a la misma red WiFi y escanea este código con la cámara de tu celular:
            </p>

            <div
              style={{
                background: '#ffffff',
                padding: '0.75rem',
                borderRadius: '12px',
                display: 'inline-block',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                marginBottom: '1rem'
              }}
            >
              <img
                src="/qr_mobile.png"
                alt="Código QR para abrir en celular"
                style={{ width: '190px', height: '190px', display: 'block' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = document.getElementById('qr-modal-fallback');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div id="qr-modal-fallback" style={{ display: 'none', padding: '1rem', color: '#0f172a', fontWeight: 'bold' }}>
                Accede directamente en:<br />
                <code>{mobileUrl}</code>
              </div>
            </div>

            <div style={{ background: '#251b4c', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid #4a3773' }}>
              <span style={{ color: '#94a3b8' }}>Enlace de Red Local:</span><br />
              <strong style={{ color: '#38bdf8', wordBreak: 'break-all' }}>{mobileUrl}</strong>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', background: '#f59e0b', color: '#181236', fontWeight: '800', border: 'none', borderRadius: '8px' }}
              onClick={() => setMostrarQR(false)}
            >
              ¡Entendido, volver al Refugio!
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
