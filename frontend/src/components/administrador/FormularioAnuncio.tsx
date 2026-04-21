import React, { useState } from 'react';
import { Send, Megaphone } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAlerta } from '../../hooks/useAlerta';

/**
 * Propiedades del componente FormularioAnuncio.
 */
interface FormularioAnuncioProps {
  /** Función opcional que se ejecuta tras un envío exitoso. */
  onExito?: () => void;
  /** Función opcional que se ejecuta al cancelar la acción. */
  onCancelar?: () => void;
}

/**
 * Componente que centraliza la lógica y el diseño para emitir avisos globales a la flotilla y pasajeros.
 * 
 * @param {FormularioAnuncioProps} props - Propiedades del componente.
 * @returns {JSX.Element} El componente de formulario renderizado.
 */
const FormularioAnuncio: React.FC<FormularioAnuncioProps> = ({ onExito, onCancelar }) => {
  const { socket } = useSocket();
  const { disparar, dispararError } = useAlerta();

  const [avisoTexto, setAvisoTexto] = useState('');
  const [destinatario, setDestinatario] = useState<'CONDUCTORES' | 'PASAJEROS' | 'TODOS'>('TODOS');
  const [enviando, setEnviando] = useState(false);

  /**
   * Maneja el envío del aviso tanto al backend como por sockets de tiempo real.
   * 
   * @param {React.FormEvent} e - Evento de formulario.
   */
  const enviarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTexto.trim()) return;

    setEnviando(true);

    try {
      // 1. Guardar como reporte con etiqueta 'ANUNCIO' en el backend para histórico
      await api.post('/reportes', {
        tipo: 'ANUNCIO',
        descripcion: avisoTexto,
        destinatario: destinatario,
        estado: 'RESUELTO' // Los anuncios nacen resueltos ya que son informativos
      });

      // 2. Emitir por Socket para tiempo real según el destinatario
      if (destinatario === 'CONDUCTORES' || destinatario === 'TODOS') {
        socket?.emit('aviso_conductor', {
          mensaje: avisoTexto,
          fecha: new Date().toISOString()
        });
      }

      if (destinatario === 'PASAJEROS' || destinatario === 'TODOS') {
        socket?.emit('aviso_pasajero', {
          mensaje: avisoTexto,
          fecha: new Date().toISOString()
        });
      }

      setAvisoTexto('');
      disparar({
        tipo: 'exito',
        titulo: 'Anuncio Emitido',
        mensaje: `El aviso ha sido enviado correctamente a ${destinatario.toLowerCase()}.`
      });
      
      if (onExito) onExito();
    } catch (error: any) {
      console.error("Error al enviar aviso:", error);
      dispararError("Error al emitir el anuncio", error.response?.data?.mensaje || "No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviarAviso} className="flex flex-col gap-5">
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-blue-500" /> Dirigido a:
        </label>
        <div className="flex gap-2">
          {(['TODOS', 'CONDUCTORES', 'PASAJEROS'] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setDestinatario(opcion)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                destinatario === opcion
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              {opcion === 'TODOS' ? 'Todos' : opcion === 'CONDUCTORES' ? 'Conductores' : 'Pasajeros'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-700">Mensaje del anuncio</label>
        <textarea
          rows={4}
          placeholder="Escribe el mensaje aquí... Ej. Tráfico pesado en Av. Central."
          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium resize-none placeholder:text-slate-400"
          value={avisoTexto}
          onChange={(e) => setAvisoTexto(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={enviando || !avisoTexto.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {enviando ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" /> Enviar Aviso
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default FormularioAnuncio;
