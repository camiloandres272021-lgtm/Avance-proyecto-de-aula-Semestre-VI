const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const {
  registrarEntrada,
  registrarSalida,
  listarActivos,
  ocupacionPorHora,
} = require('../controllers/registros.controller');

router.use(verificarToken);

router.post('/entrada', registrarEntrada);

router.put('/:registroId/salida', registrarSalida);

router.get('/activos', listarActivos);

router.get('/ocupacion-por-hora', ocupacionPorHora);

module.exports = router;
