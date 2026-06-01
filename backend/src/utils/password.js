const crypto = require('crypto');

/**
 * Genera una contraseña aleatoria y segura de una longitud específica.
 * Incluye mayúsculas, minúsculas, números y símbolos especiales.
 * 
 * @param {number} length - Longitud deseada de la contraseña (por defecto 16).
 * @returns {string} - Contraseña generada.
 */
function generarPasswordSegura(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  // Asegurar que al menos tenga un caracter de cada tipo (opcional, pero buena práctica)
  // Para mantenerlo simple, la entropía de 16 caracteres de este charset es muy alta.
  return password;
}

module.exports = { generarPasswordSegura };
