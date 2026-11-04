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
    return { exito: false, mensaje: 'Ingresa tu nombre completo (mínimo 2 letras).' };
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
      console.warn('Perfil warning:', profileError.message);
    }
  }

  return {
    exito: true,
    requiereConfirmacionEmail: !signUpData.session,
    usuario: user,
    mensaje: signUpData.session
      ? 'Registro completado correctamente. ¡Bienvenido!'
      : 'Registro completado. Revisa tu correo para confirmar la cuenta.'
  };
}

export async function iniciarSesion({ email, password }) {
  if (!email || !validarEmail(email)) {
    return { exito: false, mensaje: 'Ingresa un correo electrónico válido.' };
  }
  if (!password) {
    return { exito: false, mensaje: 'Ingresa tu contraseña.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) {
    return {
      exito: false,
      mensaje: `No fue posible iniciar sesión: ${error.message}`
    };
  }

  return {
    exito: true,
    usuario: data.user,
    mensaje: 'Inicio de sesión exitoso.'
  };
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Error al cerrar sesión: ${error.message}`);
  }
}

export async function obtenerUsuarioActual() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function obtenerPerfil(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, email, consentimiento_ley_21719, fecha_consentimiento, rol')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }
  return data;
}

// Derecho al Olvido y Cancelación (Ley N° 21.719)
export async function eliminarCuenta(userId) {
  if (!userId) throw new Error('Se requiere el identificador de usuario.');
  
  // Eliminar actividades asociadas
  await supabase.from('actividades').delete().eq('user_id', userId);
  // Eliminar perfil
  await supabase.from('perfiles').delete().eq('id', userId);
  // Cerrar sesión
  await supabase.auth.signOut();
  return { exito: true };
}

// Derecho de Acceso y Portabilidad de Datos (Ley N° 21.719)
export async function exportarDatosUsuario(userId) {
  if (!userId) throw new Error('Se requiere el identificador de usuario.');
  
  const perfil = await obtenerPerfil(userId);
  const { data: actividades } = await supabase
    .from('actividades')
    .select('*')
    .eq('user_id', userId);

  return {
    fechaExportacion: new Date().toISOString(),
    legislacion: 'Ley N° 21.719 sobre Protección de Datos Personales (Chile)',
    titular: perfil,
    actividades: actividades || []
  };
}
