const mongoose = require('mongoose');

const parqueaderoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  direccion: {
    type: String,
    trim: true,
    default: '',
  },
  niveles: {
    type: [String],
    default: ['Nivel 1'],
  },
  activo: {
    type: Boolean,
    default: true,
  },
  // Cada sede puede cobrar una tarifa distinta (pesos por minuto).
  tarifaPorMinuto: {
    type: Number,
    default: 100,
    min: 0,
  },
  layoutEspecial: {
    type: String,
    enum: [null, 'mallplaza'],
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Parqueadero', parqueaderoSchema);
