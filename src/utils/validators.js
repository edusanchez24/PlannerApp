export function validarPasswordSegura(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return {
      valido: false,
      mensaje: 'La contraseña debe tener al menos 8 caracteres.'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valido: false,
      mensaje: 'La contraseña debe incluir al menos una letra mayúscula.'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valido: false,
      mensaje: 'La contraseña debe incluir al menos un número.'
    };
  }

  return { valido: true, mensaje: '' };
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validarNombre(nombre) {
  return nombre.trim().length >= 2;
}
