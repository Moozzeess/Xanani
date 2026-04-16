import { useState, useEffect, useRef } from 'react';

/**
 * Hook para gestionar la simulación de navegación del conductor.
 * Separa la lógica de simulación de los componentes de vista.
 */
export const useConductorSimulation = (routeLine, stops, isViewModeDriving) => {
  const [isTesting, setIsTesting] = useState(false);
  const [simulatedPosition, setSimulatedPosition] = useState(null);
  const [siguienteParada, setSiguienteParada] = useState("Calculando...");
  
  // Referencia para la ruta para evitar reinicios del loop por re-renders
  const routeRef = useRef(routeLine);
  const stopsRef = useRef(stops);

  // Sincronizar referencias con las props más recientes
  useEffect(() => { 
    if (routeLine && routeLine.length > 0) {
      routeRef.current = routeLine;
      // Inicializar posición simulada si no existe y tenemos ruta
      if (!simulatedPosition) {
        setSimulatedPosition(routeLine[0]);
      }
    }
  }, [routeLine]);

  useEffect(() => { 
    stopsRef.current = stops; 
    // Inicializar primera parada si está en espera
    if (stops && stops.length > 0 && (siguienteParada === "Calculando..." || siguienteParada === "")) {
      setSiguienteParada(stops[0].nombre);
    }
  }, [stops]);

  // Estado interno para la animación fluida
  const stateRef = useRef({
    currentIndex: 0,
    progress: 0, 
    lastTime: 0,
    speed: 0.002 // Velocidad optimizada para visualización clara
  });

  // Loop de animación fluida (Reactivo a isTesting, viewMode y cambios en routeLine)
  useEffect(() => {
    // Solo correr si estamos en modo prueba y en vista de conducción
    if (!isTesting || !isViewModeDriving) {
      stateRef.current.lastTime = 0;
      // No reiniciamos simulatedPosition aquí para permitir que se mantenga en el último punto
      return;
    }

    // Asegurar posición inicial al activar el modo prueba
    if (routeRef.current && routeRef.current.length > 0 && !simulatedPosition) {
      setSimulatedPosition(routeRef.current[0]);
    }

    let requestRef;
    const animate = (time) => {
      const currentLine = routeRef.current;
      const currentStops = stopsRef.current;

      if (!currentLine || currentLine.length < 2) {
        requestRef = requestAnimationFrame(animate);
        return;
      }

      if (!stateRef.current.lastTime) stateRef.current.lastTime = time;
      const deltaTime = time - stateRef.current.lastTime;
      stateRef.current.lastTime = time;

      // Avanzar el progreso basado en el tiempo transcurrido
      const step = stateRef.current.speed * (deltaTime / 16);
      stateRef.current.progress += step;

      if (stateRef.current.progress >= 1) {
        stateRef.current.progress = 0;
        stateRef.current.currentIndex = (stateRef.current.currentIndex + 1) % (currentLine.length - 1);
        
        // Actualizar parada más cercana al cambiar de tramo
        actualizarProximaParada(stateRef.current.currentIndex, currentLine, currentStops);
      }

      // Interpolar posición entre los puntos actuales de la línea
      const idx = stateRef.current.currentIndex;
      const p1 = currentLine[idx];
      const p2 = currentLine[idx + 1];

      if (p1 && p2) {
        const lat = p1[0] + (p2[0] - p1[0]) * stateRef.current.progress;
        const lng = p1[1] + (p2[1] - p1[1]) * stateRef.current.progress;
        setSimulatedPosition([lat, lng]);
      }

      requestRef = requestAnimationFrame(animate);
    };

    requestRef = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(requestRef);
      stateRef.current.lastTime = 0;
    };
  }, [isTesting, isViewModeDriving, routeLine?.length]); // Se reinicia si cambia la estructura de la ruta

  /**
   * Encuentra la próxima parada basándose en el tramo actual.
   */
  const actualizarProximaParada = (currentIndex, line, allStops) => {
    if (!allStops || allStops.length === 0 || !line[currentIndex]) return;

    let nearestIdx = 0;
    let minDistance = Infinity;
    const currentPos = line[currentIndex];

    allStops.forEach((stop, idx) => {
      const dist = calcularDistancia(currentPos[0], currentPos[1], stop.latitud, stop.longitud);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = idx;
      }
    });

    // Si estamos muy cerca de una parada, mostrar la siguiente
    if (minDistance < 0.1 && nearestIdx < allStops.length - 1) {
       setSiguienteParada(allStops[nearestIdx + 1].nombre);
    } else {
       setSiguienteParada(allStops[nearestIdx].nombre);
    }
  };

  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    return R * 2 * Math.atan2(
      Math.sqrt(Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2),
      Math.sqrt(1 - (Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2))
    );
  };

  return {
    isTesting,
    setIsTesting,
    simulatedPosition,
    siguienteParada,
    resetSimulation: () => {
      setIsTesting(false);
      stateRef.current.currentIndex = 0;
      stateRef.current.progress = 0;
      if (routeRef.current && routeRef.current.length > 0) {
        setSimulatedPosition(routeRef.current[0]);
      }
    }
  };
};
