const mqtt = require('mqtt');

// Configuración de prueba
const BROKER_URL = 'mqtt://[IP_ADDRESS]';
const TOPIC = 'xanani/telemetria/test';

console.log(`Conectando al broker: ${BROKER_URL}`);
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
  console.log('Simulador ESP32: Conectado');

  // Publicar un mensaje de prueba cada 5 segundos
  setInterval(() => {
    const data = {
      unidad_id: 'BUS-001',
      lat: 19.4326 + (Math.random() - 0.5) * 0.01,
      lng: -99.1332 + (Math.random() - 0.5) * 0.01,
      velocidad: Math.floor(Math.random() * 60),
      timestamp: new Date().toISOString()
    };

    console.log(`Publicando en ${TOPIC}:`, data);
    client.publish(TOPIC, JSON.stringify(data));
  }, 5000);
});

client.on('error', (err) => {
  console.error('Error en simulador:', err);
});
