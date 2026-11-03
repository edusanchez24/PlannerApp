import { supabase } from '../config/supabaseClient';
import {
  validarEmail,
  validarNombre,
  validarPasswordSegura
} from '../utils/validators';

export async function registrarEstudiante({
  email,
  password,
  nombre,
  aceptoTerminos
}) {
  if (aceptoTerminos !== true) {
    return {
      exito: false,
      mensaje:
        'Debes aceptar los términos y el tratamiento de datos según la Ley N° 21.719.'
    };
  }

  if (!validarNombre(nombre)) {
    return { exito: false, mensaje: 'Ingresa tu nombre completo.' };
  }

  if (!validarEmail(email)) {
    return { exito: false, mensaje: 'Ingresa un correo electrónico válido.' };
  }

  const passwordValidation = validarPasswordSegura(password);
  if (!passwordValidation.valido) {
    return { exito: false, mensaje: passwordValidation.mensaje };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        nombre: nombre.trim(),
        consentimiento_ley_21719: 'true'
      }
    }
  });

  if (signUpError) {
    return { exito: false, mensaje: signUpError.message };
  }

  const user = signUpData.user;
  if (!user) {
    return {
      exito: false,
      mensaje: 'Supabase no devolvió el usuario registrado.'
    };
  }

  // Con confirmación de email habilitada no hay sesión todavía. En ese caso,
  // el trigger de schema.sql crea el perfil con el consentimiento registrado.
  if (signUpData.session) {
    const { error: profileError } = await supabase.from('perfiles').upsert({
      id: user.id,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      consentimiento_ley_21719: true,
      fecha_consentimiento: new Date().toISOString(),
      rol: 'estudiante'
    });

    if (profileError) {
      return {
        exito: false,
        mensaje:
          'La cuenta fue creada, pero no se pudo guardar el perfil. ' +
          'Contacta soporte antes de volver a intentarlo.'
      };
    }
  }

  return {
    exito: true,
    requiereConfirmacionEmail: !signUpData.session,
    usuario: user,
    mensaje: signUpData.session
      ? 'Registro completado correctamente.'
      : 'Registro completado. Revisa tu correo para confirmar la cuenta.'
  };
}
