

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Puesto = require('../models/Puesto');
const Parqueadero = require('../models/Parqueadero');

function generarFila({ prefijo, inicioNumero, y, alto, xInicio, xFin, cantidad, tipo, zona, nivel }) {
  const gap = 0.25;
  const disponible = xFin - xInicio;
  const ancho = (disponible - gap * (cantidad - 1)) / cantidad;

  const puestos = [];
  for (let i = 0; i < cantidad; i++) {
    const x = xInicio + i * (ancho + gap);
    puestos.push({
      numero: `${prefijo}${inicioNumero + i}`,
      tipo,
      zona,
      nivel,
      posicion: { x, y, ancho, alto, rotacion: 0 },
    });
  }
  return puestos;
}

function generarLayoutSotano1() {
  const nivel = 'Sotano 1';
  let puestos = [];
  puestos = puestos.concat(generarFila({
    prefijo: 'PR', inicioNumero: 1, y: 7, alto: 6, xInicio: 4, xFin: 18,
    cantidad: 4, tipo: 'discapacitado', zona: 'preferencial', nivel,
  }));

  puestos = puestos.concat(generarFila({
    prefijo: 'M', inicioNumero: 1, y: 18, alto: 6, xInicio: 4, xFin: 18,
    cantidad: 6, tipo: 'moto', zona: 'moto', nivel,
  }));

  puestos = puestos.concat(generarFila({
    prefijo: 'BI', inicioNumero: 1, y: 30, alto: 6, xInicio: 4, xFin: 18,
    cantidad: 6, tipo: 'bicicleta', zona: 'bicicleta', nivel,
  }));

  puestos = puestos.concat(generarFila({
    prefijo: 'A', inicioNumero: 1, y: 6, alto: 8, xInicio: 21, xFin: 69,
    cantidad: 20, tipo: 'carro', zona: 'estandar', nivel,
  }));
  puestos = puestos.concat(generarFila({
    prefijo: 'A', inicioNumero: 21, y: 6, alto: 8, xInicio: 81, xFin: 97,
    cantidad: 6, tipo: 'carro', zona: 'estandar', nivel,
  }));

  puestos = puestos.concat(generarFila({
    prefijo: 'B', inicioNumero: 1, y: 17, alto: 8, xInicio: 21, xFin: 69,
    cantidad: 16, tipo: 'carro', zona: 'estandar', nivel,
  }));

  puestos = puestos.concat(generarFila({
    prefijo: 'C', inicioNumero: 1, y: 29, alto: 8, xInicio: 21, xFin: 69,
    cantidad: 16, tipo: 'carro', zona: 'estandar', nivel,
  }));

  puestos = puestos.concat(generarFila({
    prefijo: 'D', inicioNumero: 1, y: 41, alto: 8, xInicio: 21, xFin: 69,
    cantidad: 18, tipo: 'carro', zona: 'estandar', nivel,
  }));
  puestos = puestos.concat(generarFila({
    prefijo: 'D', inicioNumero: 19, y: 41, alto: 8, xInicio: 81, xFin: 97,
    cantidad: 6, tipo: 'carro', zona: 'estandar', nivel,
  }));

  return puestos;
}

function generarLayoutSotano2() {
  const nivel = 'Sotano 2';
  let puestos = [];

  puestos = puestos.concat(generarFila({
    prefijo: 'S2A', inicioNumero: 1, y: 6, alto: 8, xInicio: 4, xFin: 69,
    cantidad: 26, tipo: 'carro', zona: 'estandar', nivel,
  }));
  puestos = puestos.concat(generarFila({
    prefijo: 'S2B', inicioNumero: 1, y: 17, alto: 8, xInicio: 4, xFin: 69,
    cantidad: 26, tipo: 'carro', zona: 'estandar', nivel,
  }));
  puestos = puestos.concat(generarFila({
    prefijo: 'S2C', inicioNumero: 1, y: 29, alto: 8, xInicio: 4, xFin: 69,
    cantidad: 26, tipo: 'carro', zona: 'estandar', nivel,
  }));
  puestos = puestos.concat(generarFila({
    prefijo: 'S2D', inicioNumero: 1, y: 41, alto: 8, xInicio: 4, xFin: 69,
    cantidad: 26, tipo: 'carro', zona: 'estandar', nivel,
  }));

  return puestos;
}

async function correrSeed() {
  await connectDB();

  const mallPlaza = await Parqueadero.findOneAndUpdate(
    { nombre: 'Mall Plaza' },
    {
      $set: {
        direccion: 'Sede principal',
        niveles: ['Sotano 1', 'Sotano 2'],
        layoutEspecial: 'mallplaza',
      },
      $setOnInsert: { activo: true },
    },
    { upsert: true, new: true }
  );

  const parqueaderoId = String(mallPlaza._id);
  console.log(`🅿️  Parqueadero "Mall Plaza" listo (id: ${parqueaderoId})`);

  const migrados = await Puesto.updateMany(
    { parqueaderoId: 'principal' },
    { $set: { parqueaderoId } }
  );
  if (migrados.modifiedCount > 0) {
    console.log(`🔄 Migrados ${migrados.modifiedCount} puestos viejos de 'principal' a Mall Plaza`);
  }

  const todosLosPuestos = [
    ...generarLayoutSotano1(),
    ...generarLayoutSotano2(),
  ];

  console.log(`Preparando ${todosLosPuestos.length} puestos de MallPlaza...`);

  let creados = 0;
  let actualizados = 0;

  for (const datosPuesto of todosLosPuestos) {
    const resultado = await Puesto.findOneAndUpdate(
      { numero: datosPuesto.numero, parqueaderoId },
      {
        $set: {
          tipo: datosPuesto.tipo,
          zona: datosPuesto.zona,
          nivel: datosPuesto.nivel,
          posicion: datosPuesto.posicion,
          parqueaderoId,
        },
        $setOnInsert: { estado: 'libre' },
      },
      { upsert: true, new: true, rawResult: true }
    );

    if (resultado.lastErrorObject?.updatedExisting) {
      actualizados++;
    } else {
      creados++;
    }
  }

  console.log(`✅ Listo. Creados: ${creados} | Actualizados: ${actualizados}`);
  await mongoose.connection.close();
  process.exit(0);
}

correrSeed().catch((error) => {
  console.error('❌ Error al ejecutar el seed:', error);
  process.exit(1);
});
