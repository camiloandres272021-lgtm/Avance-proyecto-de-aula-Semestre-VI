const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { datosEstado, paginaEstadoHTML } = require('./config/paginaEstado');

const app = express();
const PORT = process.env.PORT || 3000;

const servidorHttp = http.createServer(app);

initSocket(servidorHttp);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  const quiereHTML = req.accepts(['json', 'html']) === 'html' && req.query.formato !== 'json';
  if (quiereHTML) return res.send(paginaEstadoHTML(PORT));
  res.json(datosEstado());
});

app.use('/auth', require('./routes/auth.routes'));
app.use('/parqueaderos', require('./routes/parqueaderos.routes'));
app.use('/puestos', require('./routes/puestos.routes'));
app.use('/registros', require('./routes/registros.routes'));
app.use('/usuarios', require('./routes/usuarios.routes'));

async function iniciarServidor() {
  await connectDB();
  servidorHttp.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

iniciarServidor();