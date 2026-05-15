import React from 'react';
import { Link } from 'react-router-dom';
import '../../Styles/legal.css';

/**
 * Componente de la página de Privacidad.
 * Proporciona información sobre el tratamiento de datos personales en Xanani.
 */
const PrivacidadPage: React.FC = () => {
  return (
    <div className="legal-container">
      <div className="legal-logo-container">
        <img src="/LOGO.png" alt="Xanani Logo" className="legal-logo" />
      </div>
      <div className="legal-card">
        <header className="legal-header">
          <h1 className="legal-title">Política de Privacidad</h1>
        </header>

        <section className="legal-section">
          <h2 className="legal-section-title">1. Respeto a tu Identidad</h2>
          <p className="legal-text">No utilizamos cámaras ni reconocimiento facial. El conteo de personas se realiza mediante sensores de peso y movimiento totalmente anónimos.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">2. Uso de Datos de Ubicación</h2>
          <p className="legal-text">La ubicación GPS que ves en el mapa es la de la unidad de transporte, no la de tu teléfono personal. Tu ubicación privada no es rastreada.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">3. Recopilación Mínima</h2>
          <p className="legal-text">Solo solicitamos datos personales (como nombre de usuario) si decides registrarte como parte del equipo operativo o administrativo.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">4. Confidencialidad de Reportes</h2>
          <p className="legal-text">Si realizas un reporte sobre el servicio, tu identidad se mantiene protegida y solo se utiliza la información para corregir la falla operativa.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">5. Finalidad Estadística</h2>
          <p className="legal-text">Los datos de ocupación de las unidades se analizan de forma grupal y estadística para mejorar las rutas, nunca para vigilar a individuos específicos.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">6. Almacenamiento Seguro</h2>
          <p className="legal-text">Cualquier información que proporciones se guarda en servidores protegidos bajo estrictas normas de privacidad digital.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">7. Control de tus Datos (Derechos ARCO)</h2>
          <p className="legal-text">Tienes derecho a conocer qué datos tenemos de ti, pedir que los corrijamos o solicitar que los eliminemos de nuestro sistema.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">8. Uso de Cookies</h2>
          <p className="legal-text">Nuestra web solo utiliza archivos técnicos temporales para que la página cargue más rápido y recuerde tus preferencias de visualización.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">9. Privacidad del Conductor</h2>
          <p className="legal-text">La información personal del conductor es privada; el usuario solo puede ver datos necesarios para la identificación del servicio, como el número económico de la unidad.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">10. Transparencia en Sensores</h2>
          <p className="legal-text">Informamos abiertamente que los asientos cuentan con sensores de presencia, los cuales solo detectan si el lugar está ocupado o libre.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">11. No Seguimiento fuera de la App</h2>
          <p className="legal-text">Una vez que cierras la aplicación, Xanani no realiza ningún tipo de seguimiento de tus actividades en otras páginas o aplicaciones.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">12. Notificación de Cambios</h2>
          <p className="legal-text">Si actualizamos nuestra política de privacidad, te lo haremos saber de forma clara a través de la plataforma.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">13. Acceso Restringido</h2>
          <p className="legal-text">Solo el personal administrativo autorizado tiene acceso a datos del sistema, bajo estrictos acuerdos de confidencialidad.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">14. Eliminación Automática</h2>
          <p className="legal-text">Los registros de viajes y ocupación se eliminan o anonimizan después de un periodo de tiempo, una vez que dejan de ser útiles para la operación.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">15. Seguridad de los Menores</h2>
          <p className="legal-text">Nuestra plataforma es segura para todas las edades, ya que no permite el contacto directo entre usuarios ni solicita datos sensibles a menores.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">16. Integridad del Perfil</h2>
          <p className="legal-text">Nos aseguramos de que tu información de registro (si la hay) no sea alterada ni utilizada para fines distintos a los del servicio de transporte.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">17. Compromiso Legal</h2>
          <p className="legal-text">Cumplimos con las leyes vigentes de protección de datos personales para garantizar que tus derechos estén siempre respaldados.</p>
        </section>
      </div>

      <footer className="legal-footer">
        <Link to="/login" className="btn-back">
          Volver al Inicio
        </Link>
      </footer>
    </div>
  );
};

export default PrivacidadPage;
