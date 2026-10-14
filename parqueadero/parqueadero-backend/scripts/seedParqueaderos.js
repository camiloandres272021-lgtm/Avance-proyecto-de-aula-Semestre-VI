// Crea parqueaderos adicionales (ademas de Mall Plaza) con su plano generado.
// Uso:
//   npm run seed:parqueaderos
//
// Es idempotente: si lo corres de nuevo actualiza los puestos existentes y no
// toca su estado (libre/ocupado). Para llenarlos con datos de demo despues:
//   npm run seed:demo
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Puesto = require('../models/Puesto');
const Parqueadero = require('../models/Parqueadero');

const FILAS_Y = [6, 17, 29, 41]; // mismas filas que usa el plano de Mall Plaza
const LETRAS = ['A', 'B', 'C', 'D'];
const X_INICIO = 4;
const X_FIN = 96;

function generarSegmento({ prefijo, inicioNumero, y, xInicio, xFin, cantidad, tipo, zona, nivel }) {
  if (cantidad <= 0) return [];
  const gap = 0.25;
  const ancho = (xFin - xInicio - gap * (cantidad - 1)) / cantidad;
  return Array.from({ length: cantidad }, (_, i) => ({
    numero: `${prefijo}${inicioNumero + i}`,
    tipo,
    zona,
    nivel,
    posicion: { x: xInicio + i * (ancho + gap), y, ancho, alto: 8, rotacion: 0 },
  }));
}

// Genera un nivel completo: filas de carros, algunos puestos preferenciales al
// inicio de la fila A y, en la ultima fila, zona de motos y bicicletas.
function generarNivel({ codigo, nivel, filas, porFila, preferenciales = 2, motos = 0, bicis = 0 }) {
  const celda = (X_FIN - X_INICIO) / porFila;
  let puestos = [];

  for (let f = 0; f < filas; f++) {
    const y = FILAS_Y[f];
    const letra = LETRAS[f];
    const prefijo = `${codigo}-${letra}`;
    const esUltima = f === filas - 1;
    const pref = f === 0 ? preferenciales : 0;
    const mo = esUltima ? motos : 0;
    const bi = esUltima ? bicis : 0;
    const carros = porFila - pref - mo - bi;

    let cursor = X_INICIO;
    let numero = 1;
    const tramo = (cantidad, tipo, zona) => {
      const xFin = cursor + cantidad * celda;
      puestos = puestos.concat(
        generarSegmento({ prefijo, inicioNumero: numero, y, xInicio: cursor, xFin, cantidad, tipo, zona, nivel })
      );
      cursor = xFin;
      numero += cantidad;
    };

    tramo(pref, 'discapacitado', 'preferencial');
    tramo(carros, 'carro', 'estandar');
    tramo(mo, 'moto', 'moto');
    tramo(bi, 'bicicleta', 'bicicleta');
  }
  return puestos;
}

const PARQUEADEROS = [
  {
    nombre: 'Centro Comercial Santafe',
    direccion: 'Calle 185 # 45-03',
    tarifaPorMinuto: 120,
    niveles: [
      { codigo: 'N1', nivel: 'Nivel 1', filas: 4, porFila: 16, preferenciales: 3, motos: 4, bicis: 2 },
      { codigo: 'N2', nivel: 'Nivel 2', filas: 4, porFila: 16, preferenciales: 0 },
    ],
  },
  {
    nombre: 'Plaza Norte',
    direccion: 'Avenida Norte # 12-40',
    tarifaPorMinuto: 90,
    niveles: [
      { codigo: 'N1', nivel: 'Nivel 1', filas: 3, porFila: 14, preferenciales: 2, motos: 4, bicis: 0 },
    ],
  },
  {
    nombre: 'Torre Empresarial Central',
    direccion: 'Carrera 7 # 71-21',
    tarifaPorMinuto: 150,
    niveles: [
      { codigo: 'S1', nivel: 'Nivel S1', filas: 4, porFila: 12, preferenciales: 2, motos: 3, bicis: 3 },
      { codigo: 'S2', nivel: 'Nivel S2', filas: 4, porFila: 12, preferenciales: 0, motos: 0, bicis: 0 },
      { codigo: 'S3', nivel: 'Nivel S3', filas: 3, porFila: 12, preferenciales: 0, motos: 0, bicis: 0 },
    ],
  },
  {
    nombre: 'Terminal de Transporte',
    direccion: 'Diagonal 23 # 69-60',
    tarifaPorMinuto: 70,
    niveles: [
      { codigo: 'N1', nivel: 'Nivel 1', filas: 4, porFila: 20, preferenciales: 4, motos: 6, bicis: 4 },
    ],
  },
  {
    nombre: 'Universidad - Campus Principal',
    direccion: 'Calle 45 # 26-85',
    tarifaPorMinuto: 50,
    niveles: [
      { codigo: 'N1', nivel: 'Nivel 1', filas: 4, porFila: 18, preferenciales: 2, motos: 8, bicis: 6 },
    ],
  },
  {
    nombre: 'Aeropuerto Internacional',
    direccion: 'Via Aeropuerto, Terminal 1',
    tarifaPorMinuto: 180,
    niveles: [
      { codigo: 'N1', nivel: 'Nivel 1', filas: 4, porFila: 18, preferenciales: 4, motos: 0, bicis: 0 },
      { codigo: 'N2', nivel: 'Nivel 2', filas: 4, porFila: 18, preferenciales: 0, motos: 0, bicis: 0 },
    ],
  },
];

async function correrSeed() {
  await connectDB();

  let totalPuestos = 0;

  for (const config of PARQUEADEROS) {
    const parqueadero = await Parqueadero.findOneAndUpdate(
      { nombre: config.nombre },
      {
        $set: {
          direccion: config.direccion,
          niveles: config.niveles.map((n) => n.nivel),
          tarifaPorMinuto: config.tarifaPorMinuto,
        },
        $setOnInsert: { activo: true },
      },
      { upsert: true, new: true }
    );
    const parqueaderoId = String(parqueadero._id);

    const puestos = config.niveles.flatMap((n) => generarNivel(n));

    await Puesto.bulkWrite(
      puestos.map((p) => ({
        updateOne: {
          filter: { numero: p.numero, parqueaderoId },
          update: {
            $set: { tipo: p.tipo, zona: p.zona, nivel: p.nivel, posicion: p.posicion, parqueaderoId },
            $setOnInsert: { estado: 'libre' },
          },
          upsert: true,
        },
      }))
    );

    totalPuestos += puestos.length;
    console.log(`🅿️  ${config.nombre}: ${puestos.length} puestos en ${config.niveles.length} nivel(es) · $${config.tarifaPorMinuto}/min`);
  }

  console.log(`\n✅ Listo. ${PARQUEADEROS.length} parqueaderos, ${totalPuestos} puestos en total.`);
  console.log('   Para llenarlos con datos de demo: npm run seed:demo');
  await mongoose.connection.close();
  process.exit(0);
}

correrSeed().catch((error) => {
  console.error('❌ Error al ejecutar el seed de parqueaderos:', error);
  process.exit(1);
});
