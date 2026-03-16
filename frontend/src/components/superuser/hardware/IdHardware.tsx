import { useState } from 'react';
import { Truck, CheckCircle, Tag } from 'lucide-react';
import { useAlertaGlobal } from '../../../context/AlertaContext';

interface DeviceIdentificationPanelProps {
  isConnected: boolean;
  esp32Online: boolean;
  hardwareId: string | null;
}

export const DeviceIdentificationPanel = ({ isConnected, esp32Online, hardwareId }: DeviceIdentificationPanelProps) => {
  const [unitName, setUnitName] = useState('');
  const { disparar, dispararError } = useAlertaGlobal();

  const handleIdentify = () => {
    if (!unitName.trim()) {
      dispararError('Campo vacío', 'Por favor, ingresa un identificador para la unidad (Ej: Unidad 4).');
      return;
    }

    if (!isConnected || !esp32Online) {
      dispararError('Dispositivo No Listo', 'Asegúrate de que el servidor y el ESP32 estén conectados antes de asignarlo.');
      return;
    }

    // Aquí en el futuro iría la petición POST al backend para guardar en DB
    console.log("Petición de Aprovisionamiento:", {
      identificador: unitName,
      hardwareId: hardwareId
    });

    disparar({
      tipo: 'exito',
      titulo: 'Dispositivo Identificado',
      mensaje: `El hardware MAC: ${hardwareId} se ha asignado exitosamente a "${unitName}".`
    });

    setUnitName('');
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-6">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Truck size={16} className="text-emerald-500" />
        Identificar Dispositivo
      </h3>

      <p className="text-xs text-slate-500 mb-3">
        Asigna el dispositivo de hardware testeado a un identificador para su uso.
      </p>

      <div className="space-y-4">
        {hardwareId && esp32Online && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Hardware ID detectado (MAC):</span>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded">{hardwareId}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <Tag size={12} />
            Asignar Identificador de Unidad
          </label>
          <input
            type="text"
            placeholder="Unidad 4"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <button
          onClick={handleIdentify}
          disabled={!isConnected || !esp32Online}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
        >
          <CheckCircle size={14} /> Marcar como Lista / Asignar
        </button>
      </div>
    </div>
  );
};
