const Puesto = require('../models/Puesto');
const { getIO } = require('../config/socket');

// Crear un nuevo puesto de parqueo
async function crearPuesto(req, res) {
  try {
    const { numero, tipo, zona, nivel, posicion, parqueaderoId } = req.body;

    if (!numero) {
      return res.status(400).json({ error: 'El numero del puesto es obligatorio' });
    }
    if (!parqueaderoId) {
      return res.status(400).json({ error: 'El parqueaderoId es obligatorio' });
    }

    const puestoExistente = await Puesto.findOne({ numero, parqueaderoId });
    if (puestoExistente) {
      return res.status(409).json({ error: 'Ya existe un puesto con ese numero en este parqueadero' });
    }

    const nuevoPuesto = new Puesto({
      numero,
      tipo: tipo || 'carro',
      zona: zona || 'estandar',
      nivel: nivel || 'Nivel 1',
      posicion,
      parqueaderoId,
    });
    await nuevoPuesto.save();

    getIO().emit('puesto_actualizado', nuevoPuesto);

    res.status(201).json({
      mensaje: 'Puesto creado correctamente',
      puesto: nuevoPuesto,
    });
  } catch (error) {
    console.error('Error al crear puesto:', error);
    res.status(500).json({ error: 'Error interno al crear el puesto' });
  }
}

async function listarPuestos(req, res) {
  try {
    const filtro = {};
    if (req.query.estado) {
      filtro.estado = req.query.estado;
    }
    if (req.query.nivel) {
      filtro.nivel = req.query.nivel;
    }
    if (req.query.parqueaderoId) {
      filtro.parqueaderoId = req.query.parqueaderoId;
    }

    const puestos = await Puesto.find(filtro).sort({ numero: 1 });
    res.json({ total: puestos.length, puestos });
  } catch (error) {
    console.error('Error al listar puestos:', error);
    res.status(500).json({ error: 'Error interno al listar los puestos' });
  }
}

async function obtenerPuesto(req, res) {
  try {
    const puesto = await Puesto.findById(req.params.id);
    if (!puesto) {
      return res.status(404).json({ error: 'Puesto no encontrado' });
    }
    res.json({ puesto });
  } catch (error) {
    console.error('Error al obtener puesto:', error);
    res.status(500).json({ error: 'Error interno al obtener el puesto' });
  }
}

async function actualizarPosicionPuesto(req, res) {
  try {
    const { x, y, ancho, alto, rotacion } = req.body;

    const camposPosicion = {};
    if (x !== undefined) camposPosicion['posicion.x'] = x;
    if (y !== undefined) camposPosicion['posicion.y'] = y;
    if (ancho !== undefined) camposPosicion['posicion.ancho'] = ancho;
    if (alto !== undefined) camposPosicion['posicion.alto'] = alto;
    if (rotacion !== undefined) camposPosicion['posicion.rotacion'] = rotacion;

    const puesto = await Puesto.findByIdAndUpdate(
      req.params.id,
      { $set: camposPosicion },
      { new: true }
    );

    if (!puesto) {
      return res.status(404).json({ error: 'Puesto no encontrado' });
    }

    res.json({ mensaje: 'Posicion actualizada correctamente', puesto });
  } catch (error) {
    console.error('Error al actualizar posicion:', error);
    res.status(500).json({ error: 'Error interno al actualizar la posicion' });
  }
}

async function actualizarEstadoPuesto(req, res) {
  try {
    const { estado } = req.body;

    if (!['libre', 'ocupado'].includes(estado)) {
      return res.status(400).json({ error: "El estado debe ser 'libre' u 'ocupado'" });
    }

    const puesto = await Puesto.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    if (!puesto) {
      return res.status(404).json({ error: 'Puesto no encontrado' });
    }

    getIO().emit('puesto_actualizado', puesto);

    res.json({ mensaje: 'Estado actualizado correctamente', puesto });
  } catch (error) {
    console.error('Error al actualizar puesto:', error);
    res.status(500).json({ error: 'Error interno al actualizar el puesto' });
  }
}

async function eliminarPuesto(req, res) {
  try {
    const puesto = await Puesto.findByIdAndDelete(req.params.id);
    if (!puesto) {
      return res.status(404).json({ error: 'Puesto no encontrado' });
    }
    res.json({ mensaje: 'Puesto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar puesto:', error);
    res.status(500).json({ error: 'Error interno al eliminar el puesto' });
  }
}

module.exports = {
  crearPuesto,
  listarPuestos,
  obtenerPuesto,
  actualizarEstadoPuesto,
  actualizarPosicionPuesto,
  eliminarPuesto,
};
