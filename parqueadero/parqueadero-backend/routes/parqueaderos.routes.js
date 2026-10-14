const express = require('express');
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');
const {
  listarParqueaderos,
  resumenParqueaderos,
  obtenerParqueadero,
  crearParqueadero,
  actualizarParqueadero,
  eliminarParqueadero,
} = require('../controllers/parqueaderos.controller');

// --- Lectura PUBLICA: cualquiera puede ver los parqueaderos y su disponibilidad
// sin iniciar sesion (mejora SCAMPER "Reorganizar": primero ver, despues registrarse).
router.get('/', listarParqueaderos);
router.get('/resumen', resumenParqueaderos); // debe ir antes de '/:id'
router.get('/:id', obtenerParqueadero);

// --- Escritura: requiere token y, ademas, rol admin
router.post('/', verificarToken, verificarAdmin, crearParqueadero);
router.put('/:id', verificarToken, verificarAdmin, actualizarParqueadero);
router.delete('/:id', verificarToken, verificarAdmin, eliminarParqueadero);

module.exports = router;
