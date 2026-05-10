/**
 * simuladorEstadisticas.js
 * 
 * Utilidad para generar variaciones aleatorias en los datos de estadísticas
 * con fines demostrativos ("live demo").
 * 
 * Ubicación: Xanani/frontend/src/components/common/estadisticas/
 */

/**
 * Genera una variación sutil para un valor numérico.
 * 
 * @param {number} valorActual - El valor actual a variar.
 * @param {number} min - Valor mínimo permitido.
 * @param {number} max - Valor máximo permitido.
 * @param {number} variacionMax - El porcentaje máximo de cambio (ej: 0.05 para 5%).
 * @returns {number} El nuevo valor variado.
 */
export const variarValor = (valorActual, min = 0, max = 100, variacionMax = 0.05) => {
    const cambio = valorActual * (Math.random() * variacionMax * 2 - variacionMax);
    let nuevoValor = valorActual + cambio;
    
    // Asegurar límites
    if (nuevoValor < min) nuevoValor = min;
    if (nuevoValor > max) nuevoValor = max;
    
    return Math.round(nuevoValor);
};

/**
 * Genera variaciones para un array de datos de histograma/gráfico.
 * 
 * @param {Array} datos - Array de objetos con datos.
 * @param {string} llaveValor - La propiedad que contiene el valor numérico (ej: 'ocupacion').
 * @param {Object} opciones - Configuración de límites y variación.
 * @returns {Array} Nuevo array con valores variados.
 */
export const variarSerieDatos = (datos, llaveValor, opciones = { min: 5, max: 95, variacion: 0.08 }) => {
    if (!datos || !Array.isArray(datos)) return [];
    
    return datos.map(item => ({
        ...item,
        [llaveValor]: variarValor(item[llaveValor], opciones.min, opciones.max, opciones.variacion)
    }));
};
