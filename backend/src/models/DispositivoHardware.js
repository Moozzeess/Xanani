const mongoose = require('mongoose');

const dispositivoHardwareSchema = new mongoose.Schema({
    Direccion_Mac: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    Id_Dispositivo_Hardware: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    administrador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    estado: {
        type: String,
        enum: ['activo', 'inactivo', 'mantenimiento'],
        default: 'inactivo'
    },
    topico: {
        type: String,
        trim: true,
        default: 'xanani/hardware/test'
    },
    broker: { type: String, default: 'mqtt://[IP_ADDRESS]', hash: true },
    puerto: { type: String, default: '1883', hash: true },
    usuario_mqtt: { type: String, default: '', hash: true },
    password_mqtt: { type: String, default: '', hash: true },
    capacidadMaxima: { type: Number, default: 15 },
    umbralPeso: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('DispositivoHardware', dispositivoHardwareSchema);
