const mongoose = require('mongoose');

const ENDPOINTS = [
  { metodo: 'POST', ruta: '/auth', desc: 'Registro, login y sesion' },
  { metodo: 'GET', ruta: '/parqueaderos', desc: 'Parqueaderos disponibles' },
  { metodo: 'GET', ruta: '/puestos', desc: 'Puestos y su estado en vivo' },
  { metodo: 'POST', ruta: '/registros', desc: 'Entradas y salidas de vehiculos' },
  { metodo: 'GET', ruta: '/usuarios', desc: 'Administracion de usuarios' },
];

function formatearUptime(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return `${h}h ${m}m ${s}s`;
}

function datosEstado() {
  const mongoOk = mongoose.connection.readyState === 1;
  return {
    mensaje: 'API del parqueadero funcionando correctamente 🚗',
    estado: 'ok',
    mongodb: mongoOk ? 'conectado' : 'desconectado',
    uptime: formatearUptime(process.uptime()),
    endpoints: ENDPOINTS.map((e) => e.ruta),
  };
}

function paginaEstadoHTML(puerto) {
  const d = datosEstado();
  const mongoOk = d.mongodb === 'conectado';
  const filas = ENDPOINTS.map(
    (e) => `
      <li>
        <span class="metodo ${e.metodo.toLowerCase()}">${e.metodo}</span>
        <code>${e.ruta}</code>
        <span class="desc">${e.desc}</span>
      </li>`
  ).join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Parqueadero API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --asfalto: #191b20; --asfalto-suave: #23262d; --ambar: #f5a623;
      --verde: #2fb380; --coral: #e24c4b; --papel: #ecedef;
      --display: 'Oswald', Impact, sans-serif;
      --cuerpo: 'Inter', system-ui, sans-serif;
      --mono: 'JetBrains Mono', Consolas, monospace;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; background: var(--asfalto); color: var(--papel);
      font-family: var(--cuerpo); display: flex; justify-content: center; padding: 3rem 1.25rem;
    }
    main { width: 100%; max-width: 720px; }
    .marca { font-family: var(--display); text-transform: uppercase; letter-spacing: .04em; font-size: 1.1rem; display: flex; gap: .5rem; align-items: center; }
    .marca span { color: var(--ambar); }
    .eyebrow { font-family: var(--mono); color: var(--ambar); font-size: .78rem; letter-spacing: .12em; text-transform: uppercase; margin: 2.5rem 0 .7rem; }
    h1 { font-family: var(--display); font-size: clamp(2.2rem, 7vw, 3.6rem); line-height: 1.02; text-transform: uppercase; margin: 0 0 1rem; }
    h1 em { color: var(--ambar); font-style: normal; }
    p.sub { color: #b8bcc4; line-height: 1.6; margin: 0 0 2rem; }
    .estado { display: grid; grid-template-columns: repeat(3, 1fr); gap: .9rem; margin-bottom: 2.2rem; }
    .tarjeta { background: var(--asfalto-suave); border: 1px solid rgba(236,237,239,.08); border-radius: 10px; padding: 1rem 1.1rem; }
    .tarjeta small { display: block; font-family: var(--mono); font-size: .7rem; letter-spacing: .08em; text-transform: uppercase; color: #8b909a; margin-bottom: .45rem; }
    .tarjeta strong { font-family: var(--display); font-size: 1.15rem; text-transform: uppercase; display: flex; align-items: center; gap: .5rem; }
    .punto { width: 10px; height: 10px; border-radius: 50%; background: var(--verde); box-shadow: 0 0 0 0 rgba(47,179,128,.6); animation: pulso 1.8s infinite; }
    .punto.mal { background: var(--coral); animation: none; }
    @keyframes pulso { 70% { box-shadow: 0 0 0 9px rgba(47,179,128,0); } 100% { box-shadow: 0 0 0 0 rgba(47,179,128,0); } }
    h2 { font-family: var(--display); font-size: 1.1rem; text-transform: uppercase; margin: 0 0 .9rem; }
    ul { list-style: none; padding: 0; margin: 0; background: var(--asfalto-suave); border: 1px solid rgba(236,237,239,.08); border-radius: 10px; overflow: hidden; }
    li { display: grid; grid-template-columns: 64px 150px 1fr; gap: .8rem; align-items: center; padding: .85rem 1.1rem; border-bottom: 1px solid rgba(236,237,239,.06); }
    li:last-child { border-bottom: 0; }
    .metodo { font-family: var(--mono); font-size: .72rem; font-weight: 600; padding: .2rem .5rem; border-radius: 4px; text-align: center; }
    .metodo.get { background: rgba(47,179,128,.15); color: var(--verde); }
    .metodo.post { background: rgba(245,166,35,.15); color: var(--ambar); }
    code { font-family: var(--mono); font-size: .88rem; }
    .desc { color: #9ba0aa; font-size: .85rem; }
    footer { margin-top: 2rem; font-family: var(--mono); font-size: .75rem; color: #6b7079; display: flex; justify-content: space-between; flex-wrap: wrap; gap: .5rem; }
    @media (max-width: 620px) {
      .estado { grid-template-columns: 1fr; }
      li { grid-template-columns: 56px 1fr; }
      .desc { grid-column: 1 / -1; }
    }
  </style>
</head>
<body>
  <main>
    <div class="marca"><span>🅿️</span> Parqueadero API</div>
    <div class="eyebrow">Backend · Node + Express</div>
    <h1>La API esta <em>en linea.</em></h1>
    <p class="sub">Servidor listo para recibir peticiones del panel web y de la app movil, con actualizaciones en tiempo real por Socket.io.</p>

    <section class="estado">
      <div class="tarjeta"><small>Servidor</small><strong><i class="punto"></i> Activo</strong></div>
      <div class="tarjeta"><small>MongoDB</small><strong><i class="punto ${mongoOk ? '' : 'mal'}"></i> ${mongoOk ? 'Conectado' : 'Sin conexion'}</strong></div>
      <div class="tarjeta"><small>Uptime</small><strong>${d.uptime}</strong></div>
    </section>

    <h2>Endpoints</h2>
    <ul>${filas}
    </ul>

    <footer>
      <span>Puerto ${puerto}</span>
      <span>Para ver el JSON: /?formato=json</span>
    </footer>
  </main>
</body>
</html>`;
}

module.exports = { datosEstado, paginaEstadoHTML };