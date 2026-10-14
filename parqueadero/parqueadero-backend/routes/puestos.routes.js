const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const {
  crearPuesto,
  listarPuestos,
  obtenerPuesto,
  actualizarEstadoPuesto,
  actualizarPosicionPuesto,
  eliminarPuesto,
} = require('../controllers/puestos.controller');

// --- Lectura PUBLICA: ver el estado de los puestos no requiere sesion.
router.get('/', listarPuestos);
router.get('/:id', obtenerPuesto);

// --- Cualquier cambio requiere token
router.post('/', verificarToken, crearPuesto);
router.put('/:id/estado', verificarToken, actualizarEstadoPuesto);
router.put('/:id/posicion', verificarToken, actualizarPosicionPuesto);
router.delete('/:id', verificarToken, eliminarPuesto);

module.exports = router;
