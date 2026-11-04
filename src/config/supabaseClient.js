import { createClient } from '@supabase/supabase-js';

const supabaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined;
const supabaseAnonKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;

export const isCloudConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('YOUR_SUPABASE') &&
  !supabaseAnonKey.includes('YOUR_SUPABASE') &&
  supabaseUrl.startsWith('http')
);

// Fallback en memoria / LocalStorage para demostración y evaluación offline segura.
function createLocalDemoClient() {
  console.info('[Smart Planner] Operando en Modo Demostración Local (Offline Safe)');

  const STORAGE_KEY_AUTH = 'smart_planner_demo_auth';
  const STORAGE_KEY_ACTIVITIES = 'smart_planner_demo_actividades';
  const STORAGE_KEY_PROFILES = 'smart_planner_demo_perfiles';

  function fechaLocalHoy() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  // Inicializar actividades por defecto si no existen
  if (!localStorage.getItem(STORAGE_KEY_ACTIVITIES)) {
    const hoy = fechaLocalHoy();
    const defaultActivities = [
      {
        id: 'act-1',
        user_id: 'demo-user-123',
        titulo: 'Clase de Ingeniería de Software',
        categoria: 'Estudio',
        fecha: hoy,
        hora_inicio: '08:30:00',
        hora_fin: '10:45:00',
        completada: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'act-2',
        user_id: 'demo-user-123',
        titulo: 'Taller de Programación Móvil',
        categoria: 'Estudio',
        fecha: hoy,
        hora_inicio: '12:00:00',
        hora_fin: '14:15:00',
        completada: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'act-3',
        user_id: 'demo-user-123',
        titulo: 'Sesión de Estudio Autónomo en Biblioteca',
        categoria: 'Estudio',
        fecha: hoy,
        hora_inicio: '15:30:00',
        hora_fin: '17:30:00',
        completada: false,
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(defaultActivities));
  }

  // Inicializar perfil demo si no existe
  if (!localStorage.getItem(STORAGE_KEY_PROFILES)) {
    const defaultProfiles = [
      {
        id: 'demo-user-123',
        nombre: 'Cristopher Toloza',
        email: 'estudiante@inacap.cl',
        password: 'Password123',
        consentimiento_ley_21719: true,
        fecha_consentimiento: new Date().toISOString(),
        rol: 'estudiante'
      }
    ];
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(defaultProfiles));
  }

  const authListeners = new Set();

  function notifyAuth(event, session) {
    authListeners.forEach((listener) => {
      try {
        listener(event, session);
      } catch (e) {
        console.error('Error in auth listener:', e);
      }
    });
  }

  function getStoredSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setStoredSession(session) {
    if (session) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  }

  function getProfiles() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_PROFILES) || '[]');
    } catch {
      return [];
    }
  }

  function saveProfiles(profiles) {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }

  function getActivities() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_ACTIVITIES) || '[]');
    } catch {
      return [];
    }
  }

  function saveActivities(activities) {
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  }

  return {
    auth: {
      async getUser() {
        const session = getStoredSession();
        return { data: { user: session?.user || null }, error: null };
      },
      async getSession() {
        const session = getStoredSession();
        return { data: { session }, error: null };
      },
      onAuthStateChange(callback) {
        authListeners.add(callback);
        const session = getStoredSession();
        setTimeout(() => callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session), 0);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              }
            }
          }
        };
      },
      async signUp({ email, password, options = {} }) {
        const profiles = getProfiles();
        const normalizedEmail = email.trim().toLowerCase();
        const existing = profiles.find((p) => p.email === normalizedEmail);
        if (existing) {
          return { data: { user: null, session: null }, error: { message: 'El correo electrónico ya está registrado.' } };
        }

        const newUser = {
          id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          email: normalizedEmail,
          user_metadata: options.data || {}
        };

        const newProfile = {
          id: newUser.id,
          nombre: (options.data?.nombre || 'Estudiante').trim(),
          email: normalizedEmail,
          password,
          consentimiento_ley_21719: options.data?.consentimiento_ley_21719 === 'true' || options.data?.consentimiento_ley_21719 === true,
          fecha_consentimiento: new Date().toISOString(),
          rol: 'estudiante'
        };

        profiles.push(newProfile);
        saveProfiles(profiles);

        const session = {
          access_token: `demo-token-${Date.now()}`,
          user: newUser
        };
        setStoredSession(session);
        notifyAuth('SIGNED_IN', session);

        return { data: { user: newUser, session }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const profiles = getProfiles();
        const normalizedEmail = email.trim().toLowerCase();
        const profile = profiles.find((p) => p.email === normalizedEmail);

        if (!profile || (profile.password && profile.password !== password)) {
          return { data: { user: null, session: null }, error: { message: 'Credenciales inválidas. Revisa correo y contraseña.' } };
        }

        const user = {
          id: profile.id,
          email: profile.email,
          user_metadata: {
            nombre: profile.nombre,
            consentimiento_ley_21719: profile.consentimiento_ley_21719
          }
        };

        const session = {
          access_token: `demo-token-${Date.now()}`,
          user
        };

        setStoredSession(session);
        notifyAuth('SIGNED_IN', session);

        return { data: { user, session }, error: null };
      },
      async signOut() {
        setStoredSession(null);
        notifyAuth('SIGNED_OUT', null);
        return { error: null };
      }
    },

    from(table) {
      let isSingle = false;
      const filters = [];
      let sortConfig = null;
      let pendingInsert = null;
      let pendingUpdate = null;
      let isDelete = false;
      let pendingUpsert = null;

      function executeOperation() {
        if (pendingInsert) {
          const list = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
          if (table === 'actividades') {
            const current = getActivities();
            const inserted = list.map((item) => ({
              ...item,
              id: item.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              completada: Boolean(item.completada),
              created_at: item.created_at || new Date().toISOString()
            }));
            saveActivities([...current, ...inserted]);
            return isSingle ? inserted[0] : inserted;
          }
          if (table === 'perfiles') {
            const current = getProfiles();
            saveProfiles([...current, ...list]);
            return isSingle ? list[0] : list;
          }
          return pendingInsert;
        }

        if (pendingUpsert) {
          const list = Array.isArray(pendingUpsert) ? pendingUpsert : [pendingUpsert];
          if (table === 'perfiles') {
            const current = getProfiles();
            for (const item of list) {
              const idx = current.findIndex((p) => p.id === item.id);
              if (idx >= 0) current[idx] = { ...current[idx], ...item };
              else current.push(item);
            }
            saveProfiles(current);
            return isSingle ? list[0] : list;
          }
          return pendingUpsert;
        }

        if (pendingUpdate) {
          if (table === 'actividades') {
            const current = getActivities();
            let updatedItem = null;
            const next = current.map((item) => {
              const match = filters.every((f) => String(item[f.col]) === String(f.val));
              if (match) {
                updatedItem = { ...item, ...pendingUpdate };
                return updatedItem;
              }
              return item;
            });
            saveActivities(next);
            return isSingle ? updatedItem : (updatedItem ? [updatedItem] : []);
          }
          return pendingUpdate;
        }

        if (isDelete) {
          if (table === 'actividades') {
            const current = getActivities();
            const next = current.filter((item) => !filters.every((f) => String(item[f.col]) === String(f.val)));
            saveActivities(next);
            return null;
          }
          if (table === 'perfiles') {
            const current = getProfiles();
            const next = current.filter((item) => !filters.every((f) => String(item[f.col]) === String(f.val)));
            saveProfiles(next);
            return null;
          }
          return null;
        }

        // Consulta SELECT normal
        let data = [];
        if (table === 'actividades') {
          data = getActivities();
        } else if (table === 'perfiles') {
          data = getProfiles();
        }

        for (const f of filters) {
          data = data.filter((item) => String(item[f.col]) === String(f.val));
        }

        if (sortConfig) {
          data.sort((a, b) => {
            const valA = a[sortConfig.col] || '';
            const valB = b[sortConfig.col] || '';
            return sortConfig.ascending ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
          });
        }

        return isSingle ? (data[0] || null) : data;
      }

      const builder = {
        select() {
          return builder;
        },
        eq(col, val) {
          filters.push({ col, val });
          return builder;
        },
        order(col, { ascending = true } = {}) {
          sortConfig = { col, ascending };
          return builder;
        },
        single() {
          isSingle = true;
          return builder;
        },
        insert(records) {
          pendingInsert = records;
          return builder;
        },
        upsert(records) {
          pendingUpsert = records;
          return builder;
        },
        update(changes) {
          pendingUpdate = changes;
          return builder;
        },
        delete() {
          isDelete = true;
          return builder;
        },
        then(resolve, reject) {
          try {
            const data = executeOperation();
            resolve({ data, error: null });
          } catch (err) {
            resolve({ data: null, error: { message: err.message } });
          }
        }
      };

      return builder;
    }
  };
}

// Inicialización de cliente Supabase (Cloud o Demostración Local)
export const supabase = isCloudConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : createLocalDemoClient();
