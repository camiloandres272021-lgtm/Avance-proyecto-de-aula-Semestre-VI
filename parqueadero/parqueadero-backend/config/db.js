const mongoose = require('mongoose');
require('dotenv').config();


async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexion a MongoDB exitosa');

    // Mongoose no borra indices viejos. Si la base tenia un indice unico solo
    // sobre "numero" (version anterior), impide repetir N1-A1 en otra sede.
    // syncIndexes deja en puestos solo los indices del modelo actual.
    try {
      await require('../models/Puesto').syncIndexes();
    } catch (e) {
      console.warn('⚠️  No se pudieron sincronizar los indices de puestos:', e.message);
    }
  } catch (error) {
    console.error('❌ No se pudo conectar a MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
