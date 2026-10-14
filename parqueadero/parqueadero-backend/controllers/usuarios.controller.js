const Usuario = require('../models/Usuario');

async function listarUsuarios(req, res) {
  try {
    const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
    res.json({ total: usuarios.length, usuarios });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno al listar usuarios' });
  }
}
async function cambiarRolUsuario(req, res) {
  try {
    const { rol } = req.body;

    if (!['admin', 'operador'].includes(rol)) {
      return res.status(400).json({ error: "El rol debe ser 'admin' u 'operador'" });
    }

    if (req.params.id === req.usuario.id && rol !== 'admin') {
      return res.status(400).json({ error: 'No puedes quitarte tu propio rol de administrador' });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { rol },
      { new: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Rol actualizado correctamente', usuario });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ error: 'Error interno al cambiar el rol' });
  }
}

async function cambiarEstadoUsuario(req, res) {
  try {
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: "El campo 'activo' debe ser true o false" });
    }

    if (req.params.id === req.usuario.id && activo === false) {
      return res.status(400).json({ error: 'No puedes bloquearte a ti mismo' });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo },
      { new: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: activo ? 'Usuario desbloqueado' : 'Usuario bloqueado',
      usuario,
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error interno al cambiar el estado del usuario' });
  }
}

async function eliminarUsuario(req, res) {
  try {
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno al eliminar el usuario' });
  }
}

module.exports = {
  listarUsuarios,
  cambiarRolUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
};
