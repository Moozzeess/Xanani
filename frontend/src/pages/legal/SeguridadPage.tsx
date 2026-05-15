import React from 'react';
import { Link } from 'react-router-dom';
import '../../Styles/legal.css';

/**
 * Componente de la página de Seguridad.
 * Proporciona información sobre los protocolos y medidas de seguridad en Xanani.
 */
const SeguridadPage: React.FC = () => {
  return (
    <div className="legal-container">
      <div className="legal-logo-container">
        <img src="/LOGO.png" alt="Xanani Logo" className="legal-logo" />
      </div>
      <div className="legal-card">
        <header className="legal-header">
          <h1 className="legal-title">Seguridad en Xanani</h1>
          <p className="legal-subtitle">Tu bienestar es nuestra prioridad</p>
        </header>

        <section className="legal-section">
          <h2 className="legal-section-title">1. Monitoreo en Tiempo Real</h2>
          <p className="legal-text">Para tu tranquilidad, cada unidad de transporte cuenta con un sistema de localización activo que permite conocer su ubicación exacta durante todo el trayecto.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">2. Botón de Auxilio Inmediato</h2>
          <p className="legal-text">Nuestras unidades están equipadas con un mecanismo de alerta que permite al conductor reportar cualquier situación de riesgo a la central de forma instantánea.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">3. Verificación de Conductores</h2>
          <p className="legal-text">Solo personal debidamente registrado y validado por la administración puede operar el sistema, garantizando que el servicio sea prestado por conductores autorizados.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">4. Información de Ocupación Verídica</h2>
          <p className="legal-text">Garantizamos que la información sobre asientos disponibles sea precisa, evitando que esperes unidades que ya están a su máxima capacidad.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">5. Reporte de Incidencias en Ruta</h2>
          <p className="legal-text">Como usuario, tienes la posibilidad de reportar irregularidades en el servicio, lo cual ayuda a mantener un entorno seguro para todos los pasajeros.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">6. Protección de tu Cuenta</h2>
          <p className="legal-text">Si decides registrarte, utilizamos estándares de seguridad de alto nivel para asegurar que nadie más pueda acceder a tu perfil o historial.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">7. Prevención de Unidades No Autorizadas</h2>
          <p className="legal-text">El sistema solo muestra vehículos certificados, lo que ayuda a los usuarios a identificar y abordar únicamente el transporte público oficial.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">8. Alertas de Cambios en la Ruta</h2>
          <p className="legal-text">Cualquier desviación o cambio importante en el recorrido será detectado por el sistema para informar sobre el estado actual del viaje.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">9. Seguridad en el Acceso a la Web</h2>
          <p className="legal-text">Nuestra plataforma web está protegida contra ataques externos, asegurando que tu navegación sea segura y libre de software malicioso.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">10. Historial de Viajes Confiable</h2>
          <p className="legal-text">Mantenemos un registro interno de las operaciones de las unidades para poder aclarar cualquier malentendido o incidente ocurrido durante el servicio.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">11. Control de Velocidad</h2>
          <p className="legal-text">El sistema detecta la velocidad de las unidades, fomentando que los conductores respeten los límites establecidos para un viaje más seguro.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">12. Validación de Paradas Oficiales</h2>
          <p className="legal-text">Xanani ayuda a identificar los puntos de ascenso y descenso más seguros y concurridos en cada ruta.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">13. Recuperación de Sesión Segura</h2>
          <p className="legal-text">En caso de olvidar tus credenciales, contamos con métodos seguros para que solo tú puedas recuperar el acceso a tu cuenta.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">14. Actualización Constante</h2>
          <p className="legal-text">Actualizamos nuestra aplicación periódicamente para corregir fallos y mejorar las medidas de protección hacia el usuario.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">15. Integridad de los Datos de Tráfico</h2>
          <p className="legal-text">La información sobre el tiempo de espera se procesa con algoritmos que filtran datos erróneos, brindándote estimaciones confiables.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">16. Respaldo Administrativo</h2>
          <p className="legal-text">Existe un equipo de administradores monitoreando el sistema para responder ante cualquier falla técnica que pueda afectar tu seguridad informativa.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">17. Transparencia Operativa</h2>
          <p className="legal-text">Mantenemos canales abiertos para que conozcas cómo funciona nuestro sistema de seguridad sin necesidad de ser un experto técnico.</p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">18. Uso Ético de la Tecnología</h2>
          <p className="legal-text">Xanani se compromete a usar todas sus herramientas tecnológicas exclusivamente para mejorar la seguridad del transporte público.</p>
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

export default SeguridadPage;
