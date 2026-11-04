import { useEffect, useState } from 'react';
import { supabase } from './config/supabaseClient';
import { Header } from './components/Header';
import { AuthContainer } from './components/AuthContainer';
import { AgendaManager } from './components/AgendaManager';
import { WeeklyStats } from './components/WeeklyStats';
import { PrivacySection } from './components/PrivacySection';
import { obtenerPerfil } from './services/authService';

import { IconCalendar, IconChart, IconShield } from './components/Icons';

export function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' | 'stats' | 'privacy'
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function sincronizarUsuario(sessionUser) {
      if (!mounted) return;
      setUser(sessionUser || null);

      if (sessionUser) {
        try {
          const perfilData = await obtenerPerfil(sessionUser.id);
          if (mounted) setProfile(perfilData);
        } catch {
          if (mounted) setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setCargando(false);
    }

    supabase.auth.getUser().then(({ data }) => {
      sincronizarUsuario(data?.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      sincronizarUsuario(session?.user);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="app-container">
      <Header user={user} profile={profile} />

      {user && (
        <nav className="tab-navigation" aria-label="Navegación principal">
          <button
            type="button"
            className={`tab-button ${activeTab === 'agenda' ? 'active' : ''}`}
            onClick={() => setActiveTab('agenda')}
          >
            <IconCalendar size={15} />
            <span>Mi Agenda</span>
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <IconChart size={15} />
            <span>Estadísticas</span>
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <IconShield size={15} />
            <span>Privacidad & Normativa</span>
          </button>
        </nav>
      )}

      <main className="main-content">
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Iniciando Smart Planner...
          </div>
        ) : user ? (
          <>
            {activeTab === 'agenda' && <AgendaManager userId={user.id} />}
            {activeTab === 'stats' && <WeeklyStats userId={user.id} />}
            {activeTab === 'privacy' && <PrivacySection userId={user.id} profile={profile} />}
          </>
        ) : (
          <AuthContainer />
        )}
      </main>

      <footer className="app-footer">
        <p>
          <strong>Smart Planner</strong> · Proyecto Integrado de Ingeniería de Software (Evaluación 3)
        </p>
        <p style={{ marginTop: '0.25rem', opacity: 0.8 }}>
          Cumplimiento Ley N° 21.719 (Protección de Datos) y Ley N° 21.459 (Delitos Informáticos) · OWASP Mobile Security
        </p>
      </footer>
    </div>
  );
}
