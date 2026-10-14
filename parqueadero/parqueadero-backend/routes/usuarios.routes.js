const express = require('express');
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');
const {
  listarUsuarios,
  cambiarRolUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
} = require('../controllers/usuarios.controller');

router.use(verificarToken);
router.use(verificarAdmin);

router.get('/', listarUsuarios);

router.put('/:id/rol', cambiarRolUsuario);

router.put('/:id/estado', cambiarEstadoUsuario);

router.delete('/:id', eliminarUsuario);

module.exports = router;
