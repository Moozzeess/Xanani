/**
 * Factoría de iconos para el sistema de mapas de Xanani.
 * Centraliza la generación de HTML/SVG para asegurar consistencia visual entre roles.
 */

export const htmlMarcadorVehiculo = (v, enSeguimiento = false) => {
  const colorClass = v.color || 'bg-blue-600';
  const txtColor = v.text || 'text-white';
  const labelEta = v.eta != null ? (v.eta < 1 ? '<1m' : `${v.eta}m`) : v.eta || 'Desc.';
  const esDemoStyle = v.esDemo ? ' opacity-90 saturate-[0.8]' : '';

  return `
    <div class="bus-marker-container relative w-12 h-12 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer${esDemoStyle}">
      <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-2 py-0.5 rounded-md text-[9px] font-bold shadow-xl border border-white/20 z-20 whitespace-nowrap">
        ${v.esDemo ? '🚌 SIM ' : ''}${labelEta}
      </div>
      <!-- Halo pulsante tipo Xanani Premium -->
      <div class="absolute inset-0 rounded-2xl bg-blue-500 opacity-30 animate-ping"></div>
      <div class="relative w-10 h-10 ${colorClass} rounded-xl border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center ${txtColor}${enSeguimiento ? ' ring-4 ring-blue-400' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
      </div>
    </div>
  `;
};

export const htmlMarcadorParada = (indice) => {
  return `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-50%);">
       <!-- Icono de escudo de parada -->
       <div style="background-color: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;">
         <img src="/parada_bus.svg" style="width: 22px; height: 22px;" />
       </div>
       <!-- Badge de número lateral -->
       <div style="position: absolute; top: -10px; right: -10px; background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 10px; font-family: 'Inter', sans-serif; z-index: 10;">
         ${indice + 1}
       </div>
    </div>
  `;
};
