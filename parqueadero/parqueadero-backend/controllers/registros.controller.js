const RegistroEntrada = require('../models/RegistroEntrada');
const Puesto = require('../models/Puesto');
const Factura = require('../models/Factura');
const Parqueadero = require('../models/Parqueadero');
const { getIO } = require('../config/socket');

const TARIFA_POR_DEFECTO = 100;

// Tarifa (pesos por minuto) de la sede a la que pertenece un puesto.
async function tarifaDelPuesto(puesto) {
  const sede = await Parqueadero.findById(puesto.parqueaderoId).select('tarifaPorMinuto').lean().catch(() => null);
  return sede?.tarifaPorMinuto ?? TARIFA_POR_DEFECTO;
}
const ZONA_HORARIA = 'America/Bogota';

async function registrarEntrada(req, res) {
  try {
    const { puestoId, placa } = req.body;

    if (!puestoId || !placa) {
      return res.status(400).json({ error: 'puestoId y placa son obligatorios' });
    }

    const placaLimpia = String(placa).trim().toUpperCase();
    if (!/^[A-Z0-9]{5,7}$/.test(placaLimpia)) {
      return res.status(400).json({ error: 'La placa debe tener entre 5 y 7 letras o numeros (ej: ABC123)' });
    }

    const puesto = await Puesto.findById(puestoId);
    if (!puesto) {
      return res.status(404).json({ error: 'Puesto no encontrado' });
    }
    if (puesto.estado === 'ocupado') {
      return res.status(409).json({ error: 'El puesto ya esta ocupado' });
    }

    // Un mismo vehiculo no puede estar dentro dos veces al mismo tiempo.
    const placaYaActiva = await RegistroEntrada.findOne({ placa: placaLimpia, estado: 'activo' });
    if (placaYaActiva) {
      return res.status(409).json({ error: 'Esa placa ya tiene una entrada activa' });
    }

    const nuevoRegistro = new RegistroEntrada({
      puesto: puesto._id,
      usuario: req.usuario.id,
      placa: placaLimpia,
    });
    await nuevoRegistro.save();

    puesto.estado = 'ocupado';
    await puesto.save();

    getIO().emit('puesto_actualizado', puesto);

    res.status(201).json({
      mensaje: 'Entrada registrada correctamente',
      registro: nuevoRegistro,
    });
  } catch (error) {
    console.error('Error al registrar entrada:', error);
    res.status(500).json({ error: 'Error interno al registrar la entrada' });
  }
}

async function registrarSalida(req, res) {
  try {
    const { registroId } = req.params;

    const registro = await RegistroEntrada.findById(registroId);
    if (!registro) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    if (registro.estado === 'finalizado') {
      return res.status(409).json({ error: 'Este registro ya fue finalizado' });
    }

    const puestoDelRegistro = await Puesto.findById(registro.puesto);
    const tarifa = puestoDelRegistro ? await tarifaDelPuesto(puestoDelRegistro) : TARIFA_POR_DEFECTO;

    const horaSalida = new Date();
    const minutos = Math.max(1, Math.ceil((horaSalida - registro.horaEntrada) / 60000));
    const valorCobrado = minutos * tarifa;
    registro.horaSalida = horaSalida;
    registro.estado = 'finalizado';
    await registro.save();

    const puestoLiberado = await Puesto.findByIdAndUpdate(
      registro.puesto,
      { estado: 'libre' },
      { new: true }
    );

    getIO().emit('puesto_actualizado', puestoLiberado);

    const nuevaFactura = new Factura({
      registro: registro._id,
      placa: registro.placa,
      tiempoTotalMinutos: minutos,
      valorCobrado,
    });
    await nuevaFactura.save();

    res.json({
      mensaje: 'Salida registrada y factura generada',
      registro,
      factura: nuevaFactura,
    });
  } catch (error) {
    console.error('Error al registrar salida:', error);
    res.status(500).json({ error: 'Error interno al registrar la salida' });
  }
}

async function listarActivos(req, res) {
  try {
    const registros = await RegistroEntrada.find({ estado: 'activo' })
      .populate('puesto', 'numero tipo parqueaderoId')
      .populate('usuario', 'nombre email')
      .sort({ horaEntrada: -1 })
      .lean();

    const sedes = await Parqueadero.find().select('tarifaPorMinuto').lean();
    const tarifas = new Map(sedes.map((s) => [String(s._id), s.tarifaPorMinuto]));
    const conTarifa = registros.map((r) => ({
      ...r,
      tarifaPorMinuto: tarifas.get(String(r.puesto?.parqueaderoId)) ?? TARIFA_POR_DEFECTO,
    }));

    res.json({ total: conTarifa.length, registros: conTarifa, tarifaPorMinuto: TARIFA_POR_DEFECTO });
  } catch (error) {
    console.error('Error al listar registros activos:', error);
    res.status(500).json({ error: 'Error interno al listar los registros' });
  }
}

// Reutiliza los registros de entrada ya existentes para mostrar en que horas
// del dia llegan mas vehiculos (horas pico) en los ultimos 7 dias.
// Mejora SCAMPER "Dar otros usos": no requiere guardar datos nuevos.
async function ocupacionPorHora(req, res) {
  try {
    const { parqueaderoId } = req.query;
    if (!parqueaderoId) {
      return res.status(400).json({ error: 'parqueaderoId es obligatorio' });
    }

    const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const filas = await RegistroEntrada.aggregate([
      { $match: { horaEntrada: { $gte: desde } } },
      { $lookup: { from: 'puestos', localField: 'puesto', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $match: { 'p.parqueaderoId': String(parqueaderoId) } },
      {
        $group: {
          _id: { $hour: { date: '$horaEntrada', timezone: ZONA_HORARIA } },
          entradas: { $sum: 1 },
        },
      },
    ]);

    const porHora = new Map(filas.map((f) => [f._id, f.entradas]));
    const horas = Array.from({ length: 24 }, (_, hora) => ({ hora, entradas: porHora.get(hora) || 0 }));

    res.json({ dias: 7, horas });
  } catch (error) {
    console.error('Error al calcular la ocupacion por hora:', error);
    res.status(500).json({ error: 'Error interno al calcular la ocupacion por hora' });
  }
}

module.exports = { registrarEntrada, registrarSalida, listarActivos, ocupacionPorHora };
