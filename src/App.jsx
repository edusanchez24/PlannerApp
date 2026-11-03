import { useEffect, useState } from 'react';
import { supabase } from './config/supabaseClient';
import { Header } from './components/Header';
import { RegisterForm } from './components/RegisterForm';
import { AgendaManager } from './components/AgendaManager';

export function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Header />
      <main>
        {user ? <AgendaManager userId={user.id} /> : <RegisterForm />}
      </main>
    </>
  );
}
