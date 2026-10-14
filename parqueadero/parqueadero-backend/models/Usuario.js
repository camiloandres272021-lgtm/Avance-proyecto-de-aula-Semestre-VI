const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: false, 
    unique: true,
    sparse: true, 
    lowercase: true,
    trim: true,
  },
  telefono: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: true, 
  },
  firebaseUid: {
    type: String,
    required: false,
    unique: true,
    sparse: true, 
  },
  rol: {
    type: String,
    enum: ['admin', 'operador'], 
    default: 'operador',
  },
  activo: {
    type: Boolean,
    default: true, 
  },
}, {
  timestamps: true, 
});

module.exports = mongoose.model('Usuario', usuarioSchema);
