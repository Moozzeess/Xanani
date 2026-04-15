import React from 'react';
import { MapPin, Eye, Footprints } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EstadoBus } from '../common/MarcadorBus';

export interface TarjetaInformativaProps {
  unidad: string;
  ocupabilidad: string;
  estado: EstadoBus;
  distancia: string;
  ultimaActualizacion: string;
}

const TarjetaInformativa: React.FC<TarjetaInformativaProps> = ({
  unidad,
  ocupabilidad,
  estado,
  distancia,
  ultimaActualizacion
}) => {
  const navigate = useNavigate();

  // Mapeo de estado a texto y color para la badge (Sincronizado con EstadoBus de MarcadorBus.ts)
  const estadoInfo: Record<string, { texto: string; color: string }> = {
    [EstadoBus.BAJA]: { texto: 'BAJA AFLUENCIA', color: '#22c55e' },
    [EstadoBus.MEDIA]: { texto: 'MEDIA AFLUENCIA', color: '#eab308' },
    [EstadoBus.ALTA]: { texto: 'ALTA AFLUENCIA', color: '#ef4444' },
    [EstadoBus.SIN_SENAL]: { texto: 'SIN SEÑAL', color: '#a855f7' },
    [EstadoBus.SIMULADO]: { texto: 'MODO PRUEBA', color: '#3b82f6' }
  };

  // Fallback de seguridad para evitar "Cannot read properties of undefined (reading 'color')"
  const estadoActual = estadoInfo[estado] || { texto: 'DESCONOCIDO', color: '#64748b' };
// Botón de ojo que redirige al login
  const handleEyeClick = () => {
    navigate('/login');
  };

  return (
    <div className="bottom-container">
      <div className="floating-label">
        <MapPin size={12} fill="white" /> Unidad más cercana
      </div>

      <div className="info-card">
        <div className="card-main-row">
          <div>
            <h2 className="unit-title">Unidad {unidad}</h2>
            <p className="unit-desc">Ocupabilidad: {ocupabilidad}</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span 
              className="status-badge" 
              style={{ 
                backgroundColor: estadoActual?.color || '#64748b',
                color: 'white'
              }}
            >
              {estadoActual?.texto || 'DESCONOCIDO'}
            </span>
            <button 
              className="eye-icon-bg" 
              onClick={handleEyeClick}
              style={{ 
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '0'
              }}
            >
              <Eye size={16} color="#0f172a" />
            </button>
          </div>
        </div>

        <div className="card-footer-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Footprints size={14} />
            <span>A {distancia} de tu ubicación</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
            Actualizado {ultimaActualizacion}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TarjetaInformativa;
