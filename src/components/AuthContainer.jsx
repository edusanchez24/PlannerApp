import { useState } from 'react';
import { iniciarSesion, registrarEstudiante } from '../services/authService';

const initialRegisterForm = {
  nombre: '',
  email: '',
  password: '',
  aceptoTerminos: false
};

const initialLoginForm = {
  email: '',
  password: ''
};

export function AuthContainer() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [registerData, setRegisterData] = useState(initialRegisterForm);
  const [loginData, setLoginData] = useState(initialLoginForm);
  const [estado, setEstado] = useState({ tipo: '', mensaje: '' });
  const [cargando, setCargando] = useState(false);
  const [mostrarModalConsentimiento, setMostrarModalConsentimiento] = useState(false);

  function manejarCambioRegistro(e) {
    const { name, type, value, checked } = e.target;
    setRegisterData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setEstado({ tipo: '', mensaje: '' });
  }

  function manejarCambioLogin(e) {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value
    }));
    setEstado({ tipo: '', mensaje: '' });
  }

  function cargarCredencialesDemo() {
    setLoginData({
      email: 'estudiante@inacap.cl',
      password: 'Password123'
    });
    setEstado({
      tipo: 'info',
      mensaje: 'Credenciales de prueba cargadas. Haz clic en "Iniciar Sesión".'
    });
  }

  async function ejecutarLogin(e) {
    e.preventDefault();
    setCargando(true);
    setEstado({ tipo: '', mensaje: '' });

    try {
      const res = await iniciarSesion(loginData);
      if (!res.exito) {
        setEstado({ tipo: 'error', mensaje: res.mensaje });
      }
    } catch (err) {
      setEstado({ tipo: 'error', mensaje: err.message });
    } finally {
      setCargando(false);
    }
  }

  async function ejecutarRegistro(e) {
    e.preventDefault();
    setCargando(true);
    setEstado({ tipo: '', mensaje: '' });

    try {
      const res = await registrarEstudiante(registerData);
      setEstado({
        tipo: res.exito ? 'success' : 'error',
        mensaje: res.mensaje
      });
      if (res.exito) {
        setRegisterData(initialRegisterForm);
        if (!res.requiereConfirmacionEmail) {
          // El inicio de sesión es automático tras registrar en modo local o Supabase sin confirmación obligatoria
        }
      }
    } catch (err) {
      setEstado({ tipo: 'error', mensaje: err.message });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
          onClick={() => {
            setTab('login');
            setEstado({ tipo: '', mensaje: '' });
          }}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
          onClick={() => {
            setTab('register');
            setEstado({ tipo: '', mensaje: '' });
          }}
        >
          Crear Cuenta
        </button>
      </div>

      {estado.mensaje && (
        <div className={`alert-box alert-${estado.tipo}`} role="alert">
          {estado.mensaje}
        </div>
      )}

      {tab === 'login' ? (
        <form onSubmit={ejecutarLogin}>
          <div className="demo-credentials-box">
            <strong>Evaluación Rápida:</strong>
            <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)' }}>
              Accede directamente con la cuenta demo de estudiante:
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={cargarCredencialesDemo}
            >
              Usar estudiante@inacap.cl
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="login-email">Correo Electrónico</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={loginData.email}
              onChange={manejarCambioLogin}
              required
              autoComplete="email"
              placeholder="ejemplo@inacapmail.cl"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={loginData.password}
              onChange={manejarCambioLogin}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={cargando}
          >
            {cargando ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      ) : (
        <form onSubmit={ejecutarRegistro} noValidate>
          <div className="form-group">
            <label htmlFor="reg-nombre">Nombre Completo</label>
            <input
              id="reg-nombre"
              name="nombre"
              type="text"
              value={registerData.nombre}
              onChange={manejarCambioRegistro}
              required
              placeholder="Ej: Eduardo Sánchez"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Correo Electrónico Institucional</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={registerData.email}
              onChange={manejarCambioRegistro}
              required
              placeholder="usuario@inacapmail.cl"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Contraseña</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              value={registerData.password}
              onChange={manejarCambioRegistro}
              required
              minLength={8}
            />
            <small>OWASP: Al menos 8 caracteres, 1 letra mayúscula y 1 número.</small>
          </div>

          <div className="checkbox-group">
            <input
              id="aceptoTerminos"
              name="aceptoTerminos"
              type="checkbox"
              checked={registerData.aceptoTerminos}
              onChange={manejarCambioRegistro}
              required
            />
            <label htmlFor="aceptoTerminos">
              Acepto el tratamiento de datos personales según la <strong>Ley N° 21.719</strong>{' '}
              y las condiciones de privacidad.{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', padding: 0, font: 'inherit', cursor: 'pointer' }}
                onClick={() => setMostrarModalConsentimiento(true)}
              >
                Ver términos legales
              </button>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={!registerData.aceptoTerminos || cargando}
          >
            {cargando ? 'Registrando...' : 'Crear Cuenta de Estudiante'}
          </button>
        </form>
      )}

      {mostrarModalConsentimiento && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={() => setMostrarModalConsentimiento(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '550px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '0.75rem', color: '#1e3a8a' }}>
              🛡️ Consentimiento Expreso - Ley N° 21.719
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#334155', maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                En conformidad con la <strong>Ley N° 21.719</strong> sobre Protección de Datos Personales en Chile, se informa:
              </p>
              <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.5rem' }}>
                <li><strong>Finalidad del tratamiento:</strong> Sus datos (nombre, correo y horarios de actividades) son tratados exclusivamente para la optimización de su agenda y la generación de sugerencias de bienestar (Digital Nudges).</li>
                <li><strong>No Diagnóstico Clínico:</strong> De acuerdo con el estándar ético IEEE (2021), la aplicación Smart Planner ofrece apoyo organizacional y recomendaciones de bienestar preventivo, sin sustituir atención médica o psicológica profesional.</li>
                <li><strong>Seguridad y Cifrado:</strong> La información se almacena con cifrado AES-256 en la nube y aislamiento por políticas Row Level Security (RLS).</li>
                <li><strong>Derechos ARCO:</strong> Usted puede en cualquier momento acceder, rectificar, cancelar (eliminar) sus datos o revocar su consentimiento desde la sección de Privacidad.</li>
              </ul>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => setMostrarModalConsentimiento(false)}
            >
              Entendido y Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
