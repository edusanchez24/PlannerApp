import { useState } from 'react';
import { registrarEstudiante } from '../services/authService';

const initialForm = {
  nombre: '',
  email: '',
  password: '',
  aceptoTerminos: false
};

export function RegisterForm() {
  const [form, setForm] = useState(initialForm);
  const [estado, setEstado] = useState({ tipo: '', mensaje: '' });
  const [enviando, setEnviando] = useState(false);

  function actualizarCampo(event) {
    const { name, type, value, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
    setEstado({ tipo: '', mensaje: '' });
  }

  async function enviarFormulario(event) {
    event.preventDefault();
    setEnviando(true);
    setEstado({ tipo: '', mensaje: '' });

    try {
      const resultado = await registrarEstudiante(form);
      setEstado({
        tipo: resultado.exito ? 'success' : 'error',
        mensaje: resultado.mensaje
      });
      if (resultado.exito) setForm(initialForm);
    } catch (error) {
      setEstado({
        tipo: 'error',
        mensaje: `No fue posible completar el registro: ${error.message}`
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviarFormulario} noValidate aria-labelledby="register-title">
      <h2 id="register-title">Crear cuenta de estudiante</h2>

      <label htmlFor="nombre">Nombre completo</label>
      <input id="nombre" name="nombre" value={form.nombre} onChange={actualizarCampo} required autoComplete="name" />

      <label htmlFor="email">Correo electrónico</label>
      <input id="email" name="email" type="email" value={form.email} onChange={actualizarCampo} required autoComplete="email" />

      <label htmlFor="password">Contraseña</label>
      <input id="password" name="password" type="password" value={form.password} onChange={actualizarCampo} required minLength={8} autoComplete="new-password" />
      <small>Usa al menos 8 caracteres, una mayúscula y un número.</small>

      <label htmlFor="aceptoTerminos">
        <input id="aceptoTerminos" name="aceptoTerminos" type="checkbox" checked={form.aceptoTerminos} onChange={actualizarCampo} required />
        Acepto los términos y condiciones de uso y el tratamiento de mis datos personales según la Ley N° 21.719.
      </label>

      {estado.mensaje && (
        <p role="alert" aria-live="polite">
          {estado.mensaje}
        </p>
      )}

      <button type="submit" disabled={!form.aceptoTerminos || enviando}>
        {enviando ? 'Registrando...' : 'Registrarme'}
      </button>
    </form>
  );
}
