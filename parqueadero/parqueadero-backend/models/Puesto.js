const mongoose = require('mongoose');

const puestoSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true, 
  },
  estado: {
    type: String,
    enum: ['libre', 'ocupado'],
    default: 'libre',
  },
  tipo: {
    type: String,
    enum: ['carro', 'moto', 'discapacitado', 'bicicleta'],
    default: 'carro',
  },
  zona: {
    type: String,
    enum: ['estandar', 'preferencial', 'moto', 'bicicleta'],
    default: 'estandar',
  },
  nivel: {
    type: String,
    default: 'Sotano 1',
  },
  parqueaderoId: {
    type: String,
    required: true,
    index: true,
  },
  posicion: {
    x: { type: Number, default: 0 },      
    y: { type: Number, default: 0 },      
    ancho: { type: Number, default: 8 },  
    alto: { type: Number, default: 12 },  
    rotacion: { type: Number, default: 0 }, 
  },
}, {
  timestamps: true,
});

puestoSchema.index({ parqueaderoId: 1, numero: 1 }, { unique: true });

module.exports = mongoose.model('Puesto', puestoSchema);
