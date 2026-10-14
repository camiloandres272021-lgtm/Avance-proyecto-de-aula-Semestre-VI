// Datos de DEMOSTRACION para la Expoferia.
// Uso (despues de `npm run seed:mallplaza` y `npm run seed:parqueaderos`):
//   npm run seed:demo
//
// Crea dos usuarios de prueba y, para CADA parqueadero activo, deja una parte
// de los puestos ocupados con vehiculos activos (cada sede con una ocupacion
// distinta) y genera 7 dias de historial (registros + facturas) para que la
// grafica de horas pico tenga datos. Se puede correr varias veces: borra lo
// que creo la vez anterior y lo vuelve a generar.
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { connectDB } = require('../config/db');
const Usuario = require('../models/Usuario');
const Parqueadero = require('../models/Parqueadero');
const Puesto = require('../models/Puesto');
const RegistroEntrada = require('../models/RegistroEntrada');
const Factura = require('../models/Factura');

const TARIFA_POR_DEFECTO = 100;
const PASSWORD_DEMO = 'Demo1234';

// Horas del dia con mas movimiento (mañana, almuerzo y salida de oficina).
const PESO_POR_HORA = [
  0, 0, 0, 0, 0, 1, 2, 6, 8, 5, 4, 5,
  8, 9, 6, 4, 5, 8, 9, 6, 3, 2, 1, 0,
];

function aleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function placaAleatoria() {
  const letras = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const l = () => letras[aleatorio(0, letras.length - 1)];
  return `${l()}${l()}${l()}${aleatorio(100, 999)}`;
}

function horaConPeso() {
  const total = PESO_POR_HORA.reduce((a, b) => a + b, 0);
  let n = Math.random() * total;
  for (let h = 0; h < 24; h++) {
    n -= PESO_POR_HORA[h];
    if (n <= 0) return h;
  }
  return 12;
}

async function asegurarUsuario({ nombre, email, rol }) {
  const password = await bcrypt.hash(PASSWORD_DEMO, 10);
  return Usuario.findOneAndUpdate(
    { email },
    { $set: { nombre, password, rol, activo: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function correrSeedDemo() {
  await connectDB();

  const parqueaderos = await Parqueadero.find({ activo: true });
  if (parqueaderos.length === 0) {
    console.error('❌ No hay parqueaderos. Corre primero: npm run seed:mallplaza y npm run seed:parqueaderos');
    process.exit(1);
  }

  const admin = await asegurarUsuario({ nombre: 'Admin Demo', email: 'admin@demo.com', rol: 'admin' });
  const operador = await asegurarUsuario({ nombre: 'Operador Demo', email: 'operador@demo.com', rol: 'operador' });
  console.log('👤 Usuarios demo listos: admin@demo.com y operador@demo.com');

  // Placas unicas en TODA la demo (una placa no puede estar dos veces activa).
  const placasUsadas = new Set();
  const nuevaPlaca = () => {
    let p = placaAleatoria();
    while (placasUsadas.has(p)) p = placaAleatoria();
    placasUsadas.add(p);
    return p;
  };

  const ahora = Date.now();

  for (const parqueadero of parqueaderos) {
    const parqueaderoId = String(parqueadero._id);
    const tarifa = parqueadero.tarifaPorMinuto ?? TARIFA_POR_DEFECTO;
    const puestos = await Puesto.find({ parqueaderoId });
    if (puestos.length === 0) {
      console.log(`⏭️  ${parqueadero.nombre}: sin puestos, se omite`);
      continue;
    }

    // Limpiar lo generado en corridas anteriores de esta sede
    const idsPuestos = puestos.map((p) => p._id);
    const anteriores = await RegistroEntrada.find({ puesto: { $in: idsPuestos }, usuario: operador._id }).select('_id');
    const idsAnteriores = anteriores.map((r) => r._id);
    await Factura.deleteMany({ registro: { $in: idsAnteriores } });
    await RegistroEntrada.deleteMany({ _id: { $in: idsAnteriores } });
    await Puesto.updateMany({ parqueaderoId }, { $set: { estado: 'libre' } });

    // 1) Historial de los ultimos 7 dias (proporcional al tamano de la sede)
    const cantidadHistorial = Math.max(60, puestos.length * 2);
    const historial = [];
    const facturas = [];
    for (let i = 0; i < cantidadHistorial; i++) {
      const puesto = puestos[aleatorio(0, puestos.length - 1)];
      const diasAtras = aleatorio(1, 7);
      const entrada = new Date(ahora - diasAtras * 86400000);
      // ajustar a una hora "con peso" (hora de Colombia = UTC-5)
      entrada.setUTCHours((horaConPeso() + 5) % 24, aleatorio(0, 59), 0, 0);
      if (entrada.getTime() > ahora) continue;
      const minutos = aleatorio(20, 240);
      const salida = new Date(entrada.getTime() + minutos * 60000);
      const registro = new RegistroEntrada({
        puesto: puesto._id,
        usuario: operador._id,
        placa: nuevaPlaca(),
        horaEntrada: entrada,
        horaSalida: salida,
        estado: 'finalizado',
      });
      historial.push(registro);
      facturas.push(new Factura({
        registro: registro._id,
        placa: registro.placa,
        tiempoTotalMinutos: minutos,
        valorCobrado: minutos * tarifa,
        fechaEmision: salida,
      }));
    }
    await RegistroEntrada.insertMany(historial);
    await Factura.insertMany(facturas);

    // 2) Vehiculos dentro ahora: cada sede con una ocupacion distinta (25%-85%)
    const porcentaje = 0.25 + Math.random() * 0.6;
    const mezclados = [...puestos].sort(() => Math.random() - 0.5);
    const ocupar = mezclados.slice(0, Math.round(puestos.length * porcentaje));
    const activos = ocupar.map((puesto) => new RegistroEntrada({
      puesto: puesto._id,
      usuario: operador._id,
      placa: nuevaPlaca(),
      horaEntrada: new Date(ahora - aleatorio(5, 180) * 60000),
      estado: 'activo',
    }));
    await RegistroEntrada.insertMany(activos);
    await Puesto.updateMany({ _id: { $in: ocupar.map((p) => p._id) } }, { $set: { estado: 'ocupado' } });

    console.log(`🅿️  ${parqueadero.nombre}: ${ocupar.length}/${puestos.length} ocupados · ${historial.length} registros de historial`);
  }

  console.log('\n✅ Demo lista. Credenciales (contraseña: ' + PASSWORD_DEMO + ')');
  console.log('   admin@demo.com    → administrador');
  console.log('   operador@demo.com → operador');
  console.log(`   (id admin: ${admin._id})`);

  await mongoose.connection.close();
  process.exit(0);
}

correrSeedDemo().catch((error) => {
  console.error('❌ Error al ejecutar el seed de demo:', error);
  process.exit(1);
});
