import { useState } from 'react';
import { Truck, CheckCircle, Tag } from 'lucide-react';
import { useAlertaGlobal } from '../../../context/AlertaContext';

interface DeviceIdentificationPanelProps {
  isConnected: boolean;
  esp32Online: boolean;
  hardwareId: string | null;
  onSaved?: () => void;
  mqttConfig: any;
  hardwareSettings: any;
  initialDevice?: any;
}

export const DeviceIdentificationPanel = ({ isConnected, esp32Online, hardwareId, onSaved, mqttConfig, hardwareSettings, initialDevice }: DeviceIdentificationPanelProps) => {
  const [unitName, setUnitName] = useState(initialDevice?.Id_Dispositivo_Hardware || '');
  const { disparar, dispararError } = useAlertaGlobal();

  const handleIdentify = async () => {
    if (!unitName.trim()) {
      dispararError('Campo vacío', 'Por favor, ingresa un identificador para la unidad (Ej: Unidad 4).');
      return;
    }

    if (!isConnected || !esp32Online) {
      dispararError('Dispositivo No Listo', 'Asegúrate de que el servidor y el ESP32 estén conectados antes de asignarlo.');
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const payload = {
        Direccion_Mac: hardwareId,
        Id_Dispositivo_Hardware: unitName,
        topico: mqttConfig.topic,
        broker: mqttConfig.broker,
        puerto: mqttConfig.port,
        usuario_mqtt: mqttConfig.username,
        password_mqtt: mqttConfig.password,
        capacidadMaxima: hardwareSettings.capacidadMaxima,
        umbralPeso: hardwareSettings.umbralPeso,
        estado: isConnected ? 'activo' : 'inactivo'
      };

      let url = `${backendUrl}/api/hardware`;
      let method = 'POST';

      if (initialDevice?._id) {
        url = `${backendUrl}/api/hardware/${initialDevice._id}/assign`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        disparar({
          tipo: 'exito',
          titulo: 'Dispositivo Configurado',
          mensaje: `El hardware MAC: ${hardwareId} se ha guardado y configurado exitosamente como "${unitName}".`
        });

        setTimeout(() => {
          if (onSaved) {
            onSaved();
          } else {
            window.location.href = '/superuser/hardware';
          }
        }, 1500);
      } else {
        dispararError('Error al guardar dispositivo', data.message || 'La MAC ya podría estar registrada.');
      }
    } catch (error: any) {
      dispararError('Error de conexión', error.message);
    }

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