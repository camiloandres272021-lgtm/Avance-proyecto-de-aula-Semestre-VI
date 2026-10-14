const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
  registro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegistroEntrada', 
    required: true,
  },
  placa: {
    type: String,
    required: true,
  },
  tiempoTotalMinutos: {
    type: Number,
    required: true,
  },
  valorCobrado: {
    type: Number,
    required: true,
  },
  fechaEmision: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Factura', facturaSchema);
