import L from 'leaflet';

export enum EstadoBus {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  SIN_SENAL = 'sin_senal',
  SIMULADO = 'simulado'
}

interface ColoresEstado {
  background: string;
  opacity: string;
  textColor: string;
}

const COLORES_ESTADO: Record<EstadoBus, ColoresEstado> = {
  [EstadoBus.BAJA]: {
    background: '#4ade80', // Verde
    opacity: '0.4',
    textColor: '#064e3b'
  },
  [EstadoBus.MEDIA]: {
    background: '#facc15', // Amarillo
    opacity: '0.4',
    textColor: '#854d0e'
  },
  [EstadoBus.ALTA]: {
    background: '#ef4444', // Rojo
    opacity: '0.4',
    textColor: '#7f1d1d'
  },
  [EstadoBus.SIN_SENAL]: {
    background: '#a855f7', // Morado
    opacity: '0.4',
    textColor: '#581c87'
  },
  [EstadoBus.SIMULADO]: {
    background: '#3b82f6', // Azul
    opacity: '0.4',
    textColor: '#1e3a8a'
  }
};

export interface MarcadorBusProps {
  posicion: [number, number];
  estado: EstadoBus;
  mapa: L.Map;
}

export class MarcadorBus {
  private marker: L.Marker | null = null;
  private colores: ColoresEstado;

  constructor(private props: MarcadorBusProps) {
    this.colores = COLORES_ESTADO[props.estado];
  }

  crearMarcador(): L.Marker {
    const busIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:0;background:${this.colores.background}; 
            opacity:${this.colores.opacity};border-radius:12px;">
          </div>
          <div style="position:relative;width:32px;height:32px;background:${this.colores.background};
            border-radius:12px;border:2px solid white;display:flex;align-items:center;justify-content:center;
            color:${this.colores.textColor};box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <img src="/combi.svg" width="18" height="18" alt="Combi" />
          </div>
        </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    this.marker = L.marker(this.props.posicion, { icon: busIcon });
    return this.marker;
  }

  agregarAlMapa(): void {
    if (this.marker) {
      this.marker.addTo(this.props.mapa);
    }
  }

  actualizarEstado(nuevoEstado: EstadoBus): void {
    this.colores = COLORES_ESTADO[nuevoEstado];
    
    if (this.marker) {
      const nuevoIcono = this.crearMarcador().getIcon();
      this.marker.setIcon(nuevoIcono);
    }
  }

  removerDelMapa(): void {
    if (this.marker) {
      this.props.mapa.removeLayer(this.marker);
      this.marker = null;
    }
  }
}

// Función de utilidad para crear marcadores rápidamente
export function crearMarcadorBus(
  posicion: [number, number],
  estado: EstadoBus,
  mapa: L.Map
): MarcadorBus {
  const marcador = new MarcadorBus({ posicion, estado, mapa });
  marcador.crearMarcador().addTo(mapa);
  return marcador;
}