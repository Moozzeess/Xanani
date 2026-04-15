import { Info } from 'lucide-react';

export const HardwareInstructions = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6 flex gap-3 shadow-sm">
      <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
      <div className="text-sm text-slate-700">
        <h3 className="font-bold text-blue-800 mb-1">Guía de Uso del Módulo de Hardware (Pruebas Reales)</h3>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li><strong>1. Configuración de Red:</strong> Para evitar consumos en vano de saldo en el SIM800L, el hardware no tiene conexión viva permanente. Usa "Conectar" introduciendo tu MQTT para enlazar el socket al ESP32.</li>
          <li><strong>2. Monitoreo Activo:</strong> El ESP32 mandará telemetría de forma constante. Cuentas con un temporizador; si la placa deja de comunicar por más de 30 segundos, el sistema interpretará caída de red y lo marcará offline.</li>
          <li><strong>3. Mapeo Reactivo:</strong> El mapa de pasajeros actualizará en tiempo real sus asientos dibujados respecto a la "Capacidad Máxima" que apliques mediante el panel del Microcontrolador.</li>
          <li><strong>4. Finalización Consciente:</strong> Al terminar la auditoría de la combi, debes dar "Desconectar" de forma imperativa para cerrar el hilo con el Bróker. No hay simulación de datos, este entorno es de producción.</li>
        </ul>
      </div>
    </div>
  );
};
