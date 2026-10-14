const mongoose = require('mongoose');

const registroEntradaSchema = new mongoose.Schema({
  puesto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Puesto', 
    required: true,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', 
    required: true,
  },
  placa: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  horaEntrada: {
    type: Date,
    default: Date.now,
  },
  horaSalida: {
    type: Date,
    default: null, 
  },
  estado: {
    type: String,
    enum: ['activo', 'finalizado'],
    default: 'activo',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('RegistroEntrada', registroEntradaSchema);
