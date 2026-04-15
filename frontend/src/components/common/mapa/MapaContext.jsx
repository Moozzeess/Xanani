import React, { createContext, useContext } from 'react';

/**
 * Contexto para compartir la instancia de Leaflet (L.Map) ente el componente Padre
 * y sus capas Hijas especializadas.
 */
const MapaContext = createContext(null);

export const MapaProvider = ({ map, children }) => {
  return (
    <MapaContext.Provider value={map}>
      {children}
    </MapaContext.Provider>
  );
};

export const useMapaInstance = () => {
  const context = useContext(MapaContext);
  if (context === undefined) {
    throw new Error('useMapaInstance debe usarse dentro de un MapaProvider');
  }
  return context;
};

export default MapaContext;
