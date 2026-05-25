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
 * Plantilla Base (Diseño unificado)
 */
function basePlantilla(tituloH1, username, cuerpoHtml, urlBoton, textoBoton) {
  const btnYFallbackHtml = urlBoton ? `
    <div class="btn-container">
        <a href="${urlBoton}" class="btn" target="_blank">${textoBoton}</a>
    </div>
    <div class="link-fallback">
        <p>Si el botón no funciona, copia y pega esto en tu navegador web:</p>
        <a href="${urlBoton}" target="_blank">${urlBoton}</a>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xanani</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            width: 100% !important;
        }
        .wrapper {
            width: 100%;
            background-color: #f4f7f6;
            padding: 40px 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
            background: linear-gradient(135deg, #4ce2fc 0%, #1c529b 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo-container {
            width: 110px;
            height: 110px;
            background-color: #ffffff;
            border-radius: 50%;
            margin: 0 auto;
            display: block;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 4px;
            box-sizing: border-box;
            line-height: 102px;
            font-size: 24px;
            font-weight: bold;
            color: #1c529b;
        }
        .logo-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        h1 {
            color: #1c529b;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
            font-weight: 700;
        }
        p {
            font-size: 16px;
            color: #555555;
            margin-bottom: 30px;
        }
        .btn-container {
            text-align: center;
            margin: 35px 0;
        }
        .btn {
            background-color: #00b4d8;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 35px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 25px;
            display: inline-block;
            box-shadow: 0 3px 10px rgba(0, 180, 216, 0.3);
        }
        .link-fallback {
            background-color: #f8fafc;
            border-left: 4px solid #00b4d8;
            padding: 15px;
            border-radius: 0 8px 8px 0;
            margin-top: 30px;
            word-break: break-all;
        }
        .link-fallback p {
            font-size: 13px;
            color: #666666;
            margin: 0 0 8px 0;
        }
        .link-fallback a {
            color: #1c529b;
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
        }
        .footer {
            background-color: #f8fafc;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888888;
            border-top: 1px solid #edf2f7;
        }
        .report-box {
            padding: 15px;
            background-color: #f3f4f6;
            border-left: 4px solid #2563eb;
            margin: 20px 0;
            color: #333;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="logo-container">
                    <!-- Se utiliza el URL del frontend para que el correo pueda cargarlo -->
                    <img src="${FRONTEND_URL}/LOGO.png" alt="Xanani Logo" class="logo-img" onerror="this.style.display='none'; this.parentNode.innerHTML='XANANI';">
                </div>
            </div>
            
            <div class="content">
                <h1>${tituloH1}, ${username}</h1>
                ${cuerpoHtml}
                
                ${btnYFallbackHtml}
            </div>
            
            <div class="footer">
                &copy; ${new Date().getFullYear()} Xanani. Todos los derechos reservados.<br>
                Este es un mensaje automático, por favor no respondas a este correo.
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Plantilla: Verificación de cuenta nueva
 */
async function enviarCorreoVerificacion(to, username, token) {
  const url = `${FRONTEND_URL}/#/verify-email/${token}`;
  const cuerpoHtml = `<p>Gracias por registrarte. Por favor confirma tu dirección de correo electrónico haciendo clic en el botón de abajo para activar tu cuenta:</p>`;
  const html = basePlantilla('Bienvenido a Xanani', username, cuerpoHtml, url, 'Verificar Correo');
  await sendEmail({ to, subject: 'Confirma tu correo en Xanani', html });
}

/**
 * Plantilla: Recuperación de contraseña
 */
async function enviarCorreoRecuperacion(to, username, token) {
  const url = `${FRONTEND_URL}/#/reset-password/${token}`;
  const cuerpoHtml = `<p>Hemos recibido una solicitud para cambiar tu contraseña.</p>
                      <p>Este enlace expirará en 1 hora. Si no lo solicitaste, puedes ignorar este mensaje.</p>`;
  const html = basePlantilla('Recuperación de Contraseña', username, cuerpoHtml, url, 'Restablecer Mi Contraseña');
  await sendEmail({ to, subject: 'Recupera tu contraseña - Xanani', html });
}

/**
 * Plantilla: Respuesta a reporte de pasajero
 */
async function enviarCorreoRespuestaReporte(to, username, folio, respuesta) {
  const cuerpoHtml = `
    <p>Queremos informarte que un administrador ha respondido a tu reporte con folio <strong>#${folio}</strong>:</p>
    <div class="report-box">
      "${respuesta}"
    </div>
    <p>Agradecemos tu retroalimentación para seguir mejorando nuestro servicio.</p>
  `;
  const html = basePlantilla('Atención a tu Reporte', username, cuerpoHtml, null, null);
  await sendEmail({ to, subject: `Respuesta a tu reporte #${folio} - Xanani`, html });
}

/**
 * Plantilla: Actualización de estado de reporte de pasajero
 */
async function enviarCorreoEstadoReporte(to, username, folio, estado) {
  const cuerpoHtml = `
    <p>Queremos informarte que el estado de tu reporte con folio <strong>#${folio}</strong> ha sido actualizado a: <strong>${estado}</strong>.</p>
    <p>Agradecemos tu paciencia y retroalimentación para seguir mejorando nuestro servicio.</p>
  `;
  const html = basePlantilla('Actualización de tu Reporte', username, cuerpoHtml, null, null);
  await sendEmail({ to, subject: `Actualización de tu reporte #${folio} - Xanani`, html });
}

module.exports = {
  enviarCorreoVerificacion,
  enviarCorreoRecuperacion,
  enviarCorreoRespuestaReporte,
  enviarCorreoEstadoReporte
};
