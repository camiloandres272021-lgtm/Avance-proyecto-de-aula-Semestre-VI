const Parqueadero = require('../models/Parqueadero');
const Puesto = require('../models/Puesto');
const RegistroEntrada = require('../models/RegistroEntrada');
const Factura = require('../models/Factura');

async function listarParqueaderos(req, res) {
  try {
    const parqueaderos = await Parqueadero.find().sort({ createdAt: 1 });
    res.json({ total: parqueaderos.length, parqueaderos });
  } catch (error) {
    console.error('Error al listar parqueaderos:', error);
    res.status(500).json({ error: 'Error interno al listar los parqueaderos' });
  }
}

// Lista publica con la disponibilidad de cada parqueadero (total, libres, ocupados).
async function resumenParqueaderos(req, res) {
  try {
    const parqueaderos = await Parqueadero.find().sort({ createdAt: 1 }).lean();
    const conteos = await Puesto.aggregate([
      {
        $group: {
          _id: '$parqueaderoId',
          total: { $sum: 1 },
          libres: { $sum: { $cond: [{ $eq: ['$estado', 'libre'] }, 1, 0] } },
        },
      },
    ]);
    const porId = new Map(conteos.map((c) => [String(c._id), c]));

    const resultado = parqueaderos.map((p) => {
      const c = porId.get(String(p._id)) || { total: 0, libres: 0 };
      return { ...p, total: c.total, libres: c.libres, ocupados: c.total - c.libres };
    });

    res.json({ total: resultado.length, parqueaderos: resultado });
  } catch (error) {
    console.error('Error al obtener el resumen de parqueaderos:', error);
    res.status(500).json({ error: 'Error interno al obtener el resumen' });
  }
}

async function obtenerParqueadero(req, res) {
  try {
    const parqueadero = await Parqueadero.findById(req.params.id);
    if (!parqueadero) {
      return res.status(404).json({ error: 'Parqueadero no encontrado' });
    }
    res.json({ parqueadero });
  } catch (error) {
    console.error('Error al obtener parqueadero:', error);
    res.status(500).json({ error: 'Error interno al obtener el parqueadero' });
  }
}

async function crearParqueadero(req, res) {
  try {
    const { nombre, direccion, niveles, tarifaPorMinuto } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del parqueadero es obligatorio' });
    }

    if (tarifaPorMinuto !== undefined && (!Number.isFinite(Number(tarifaPorMinuto)) || Number(tarifaPorMinuto) < 0)) {
      return res.status(400).json({ error: 'La tarifa por minuto debe ser un numero mayor o igual a 0' });
    }

    const nuevoParqueadero = new Parqueadero({
      nombre: nombre.trim(),
      direccion: direccion || '',
      niveles: Array.isArray(niveles) && niveles.length > 0 ? niveles : ['Nivel 1'],
      ...(tarifaPorMinuto !== undefined && { tarifaPorMinuto: Number(tarifaPorMinuto) }),
    });
    await nuevoParqueadero.save();

    res.status(201).json({
      mensaje: 'Parqueadero creado correctamente',
      parqueadero: nuevoParqueadero,
    });
  } catch (error) {
    console.error('Error al crear parqueadero:', error);
    res.status(500).json({ error: 'Error interno al crear el parqueadero' });
  }
}

async function actualizarParqueadero(req, res) {
  try {
    const { nombre, direccion, niveles, activo, tarifaPorMinuto } = req.body;

    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (direccion !== undefined) cambios.direccion = direccion;
    if (niveles !== undefined) cambios.niveles = niveles;
    if (activo !== undefined) cambios.activo = activo;
    if (tarifaPorMinuto !== undefined) {
      if (!Number.isFinite(Number(tarifaPorMinuto)) || Number(tarifaPorMinuto) < 0) {
        return res.status(400).json({ error: 'La tarifa por minuto debe ser un numero mayor o igual a 0' });
      }
      cambios.tarifaPorMinuto = Number(tarifaPorMinuto);
    }

    const parqueadero = await Parqueadero.findByIdAndUpdate(req.params.id, cambios, { new: true });
    if (!parqueadero) {
      return res.status(404).json({ error: 'Parqueadero no encontrado' });
    }

    res.json({ mensaje: 'Parqueadero actualizado correctamente', parqueadero });
  } catch (error) {
    console.error('Error al actualizar parqueadero:', error);
    res.status(500).json({ error: 'Error interno al actualizar el parqueadero' });
  }
}

async function eliminarParqueadero(req, res) {
  try {
    const parqueadero = await Parqueadero.findById(req.params.id);
    if (!parqueadero) {
      return res.status(404).json({ error: 'Parqueadero no encontrado' });
    }

    const puestos = await Puesto.find({ parqueaderoId: String(parqueadero._id) }).select('_id');
    const idsPuestos = puestos.map((p) => p._id);

    const registros = await RegistroEntrada.find({ puesto: { $in: idsPuestos } }).select('_id');
    await Factura.deleteMany({ registro: { $in: registros.map((r) => r._id) } });
    await RegistroEntrada.deleteMany({ puesto: { $in: idsPuestos } });
    await Puesto.deleteMany({ parqueaderoId: String(parqueadero._id) });
    await parqueadero.deleteOne();

    res.json({ mensaje: 'Parqueadero y sus puestos eliminados correctamente' });
  } catch (error) {
    console.error('Error al eliminar parqueadero:', error);
    res.status(500).json({ error: 'Error interno al eliminar el parqueadero' });
  }
}

module.exports = {
  listarParqueaderos,
  resumenParqueaderos,
  obtenerParqueadero,
  crearParqueadero,
  actualizarParqueadero,
  eliminarParqueadero,
};
