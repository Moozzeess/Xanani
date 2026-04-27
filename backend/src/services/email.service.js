const nodemailer = require('nodemailer');
const { FRONTEND_URL } = require('../config/env');

const EMAIL_USER = process.env.EMAIL_USER; // ej: tu-correo@gmail.com
const EMAIL_PASS = process.env.EMAIL_PASS; // ej: App Password de Google

// Intentar inicializar el transporter si hay credenciales. Si no, usaremos consola (Simulacro)
let transporter = null;
if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail', // O manda host/port si usas otro SMTP
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

/**
 * Función interna para despachar correos o imprimirlos en consola de desarrollo
 */
async function sendEmail({ to, subject, html }) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Xanani Movilidad" <${EMAIL_USER}>`,
        to,
        subject,
        html
      });
      console.log(`[Email Service] Correo enviado exitosamente a ${to}`);
    } catch (error) {
      console.error('[Email Service] Fallo al enviar correo SMTP:', error.message);
    }
  } else {
    // Simulacro de envío de correo en terminal (Para pruebas locales cuando no hay credenciales SMTP)
    console.log('\n================== SIMULACRO DE CORREO ==================');
    console.log(`PARA: ${to}`);
    console.log(`ASUNTO: ${subject}`);
    console.log(`CONTENIDO HTML:\n${html.replace(/<[^>]*>?/gm, '')}`);
    console.log('=========================================================\n');
  }
}

/**
 * Plantilla: Verificación de cuenta nueva
 */
async function enviarCorreoVerificacion(to, username, token) {
  const url = `${FRONTEND_URL}/verify-email/${token}`;
  const html = `
    <h2>Bienvenido a Xanani, ${username}</h2>
    <p>Gracias por registrarte. Por favor confirma tu dirección de correo electrónico haciendo clic en el enlace siguiente:</p>
    <a href="${url}" style="display:inline-block; padding:10px 20px; background-color:#2563eb; color:white; text-decoration:none; border-radius:5px;">Verificar Correo</a>
    <p><small>Si el botón no funciona, copia y pega esto: ${url}</small></p>
  `;
  await sendEmail({ to, subject: 'Confirma tu correo en Xanani', html });
}

/**
 * Plantilla: Recuperación de contraseña
 */
async function enviarCorreoRecuperacion(to, username, token) {
  const url = `${FRONTEND_URL}/reset-password/${token}`;
  const html = `
    <h2>Recuperación de Contraseña - Xanani</h2>
    <p>Hola ${username}, hemos recibido una solicitud para cambiar tu contraseña.</p>
    <a href="${url}" style="display:inline-block; padding:10px 20px; background-color:#ef4444; color:white; text-decoration:none; border-radius:5px;">Restablecer Mi Contraseña</a>
    <p>Este enlace expirará en 1 hora. Si no lo solicitaste, puedes ignorar este mensaje.</p>
    <p><small>Si el botón no funciona, copia y pega esto: ${url}</small></p>
  `;
  await sendEmail({ to, subject: 'Recupera tu contraseña - Xanani', html });
}

module.exports = {
  enviarCorreoVerificacion,
  enviarCorreoRecuperacion
};
