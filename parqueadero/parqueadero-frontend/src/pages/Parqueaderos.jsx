import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';
import './Parqueaderos.css';

// Pantalla PUBLICA: cualquiera puede ver los parqueaderos y cuantos puestos
// libres tienen ahora mismo, sin iniciar sesion. Los cupos se actualizan solos
// (Socket.io) cuando alguien registra una entrada o una salida.
// Solo un admin logueado ve el boton para crear una sede nueva.
export default function Parqueaderos() {
  const { usuario, estaLogueado, logout } = useAuth();
  const [parqueaderos, setParqueaderos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [direccionNueva, setDireccionNueva] = useState('');
  const [tarifaNueva, setTarifaNueva] = useState('100');
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const temporizador = useRef(null);

  async function cargarParqueaderos(mostrarCargando = true) {
    if (mostrarCargando) setCargando(true);
    setError('');
    try {
      const respuesta = await api.get('/parqueaderos/resumen');
      setParqueaderos(respuesta.data.parqueaderos);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los parqueaderos');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarParqueaderos();
  }, []);

  // Cuando cambia cualquier puesto, refrescamos los cupos (con un pequeno
  // retraso para agrupar varios cambios seguidos en una sola consulta).
  useEffect(() => {
    function alCambiarPuesto() {
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => cargarParqueaderos(false), 400);
    }
    socket.on('puesto_actualizado', alCambiarPuesto);
    return () => {
      socket.off('puesto_actualizado', alCambiarPuesto);
      clearTimeout(temporizador.current);
    };
  }, []);

  async function crearParqueadero(evento) {
    evento.preventDefault();
    if (!nombreNuevo.trim()) return;

    setGuardando(true);
    try {
      const respuesta = await api.post('/parqueaderos', {
        nombre: nombreNuevo.trim(),
        direccion: direccionNueva.trim(),
        tarifaPorMinuto: tarifaNueva === '' ? 100 : Number(tarifaNueva),
      });
      setParqueaderos((actuales) => [
        ...actuales,
        { ...respuesta.data.parqueadero, total: 0, libres: 0, ocupados: 0 },
      ]);
      setNombreNuevo('');
      setDireccionNueva('');
      setTarifaNueva('100');
      setMostrarFormulario(false);
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo crear el parqueadero');
    } finally {
      setGuardando(false);
    }
  }

  const termino = busqueda.trim().toLowerCase();
  const visibles = parqueaderos.filter(
    (p) =>
      !termino ||
      p.nombre.toLowerCase().includes(termino) ||
      (p.direccion || '').toLowerCase().includes(termino)
  );
  const totalLibres = parqueaderos.reduce((suma, p) => suma + (p.activo ? p.libres || 0 : 0), 0);

  return (
    <div className="parqueaderos-fondo">
      <header className="parqueaderos-header">
        <Link to="/" className="parqueaderos-logo" style={{ textDecoration: 'none' }}>
          <span className="parqueaderos-logo-icono">P</span> Parqueadero
        </Link>
        <div className="parqueaderos-usuario">
          {estaLogueado ? (
            <>
              {usuario?.rol === 'admin' && (
                <Link to="/admin/usuarios" className="parqueaderos-link-admin">👥 Usuarios</Link>
              )}
              <span>Hola, {usuario?.nombre}</span>
              <button onClick={logout} className="parqueaderos-boton-salir">Salir</button>
            </>
          ) : (
            <>
              <Link to="/acceso?modo=login&volver=/parqueaderos" className="parqueaderos-link-admin">
                Iniciar sesion
              </Link>
              <Link to="/acceso?modo=registro&volver=/parqueaderos" className="parqueaderos-link-admin">
                Registrarme
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="parqueaderos-main">
        <h1 className="parqueaderos-titulo">Parqueaderos disponibles</h1>
        <p className="parqueaderos-subtitulo">
          Mira en tiempo real cuantos puestos libres hay, sin necesidad de iniciar sesion.
          {!estaLogueado && ' Cuando quieras registrar una entrada, te pediremos que ingreses.'}
        </p>

        {cargando && <p className="parqueaderos-subtitulo">Cargando...</p>}
        {error && <p className="parqueaderos-subtitulo" style={{ color: '#fca5a5' }}>{error}</p>}

        {!cargando && !error && parqueaderos.length > 0 && (
          <div className="parqueaderos-barra">
            <input
              type="search"
              className="parqueaderos-buscador"
              placeholder="Buscar por nombre o direccion..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <span className="parqueaderos-total">
              <strong>{totalLibres}</strong> puestos libres en {parqueaderos.filter((p) => p.activo).length} parqueaderos
            </span>
          </div>
        )}

        {!cargando && !error && termino && visibles.length === 0 && (
          <p className="parqueaderos-subtitulo">Ningun parqueadero coincide con "{busqueda}".</p>
        )}

        {!cargando && !error && (
          <div className="parqueaderos-grid">
            {visibles.map((p) =>
              p.activo ? (
                <Link key={p._id} to={`/dashboard/${p._id}`} className="tarjeta-parqueadero tarjeta-habilitada">
                  <span className="tarjeta-badge tarjeta-badge-disponible">
                    {p.total > 0 && p.libres === 0 ? 'Lleno' : 'Disponible ahora'}
                  </span>
                  <div className="tarjeta-icono tarjeta-icono-activo">{p.nombre.charAt(0).toUpperCase()}</div>
                  <h2>{p.nombre}</h2>
                  <p>{p.niveles?.join(' y ') || 'Sin niveles configurados'}</p>
                  {p.direccion && <p className="tarjeta-direccion">📍 {p.direccion}</p>}
                  {p.total > 0 && (
                    <>
                      <p className="tarjeta-cupos">
                        <strong>{p.libres}</strong> libres de {p.total} puestos
                      </p>
                      <div className="tarjeta-barra" title={`${p.ocupados} ocupados`}>
                        <div
                          className={`tarjeta-barra-relleno ${
                            p.ocupados / p.total >= 0.9 ? 'critica' : p.ocupados / p.total >= 0.7 ? 'alta' : ''
                          }`}
                          style={{ width: `${Math.round((p.ocupados / p.total) * 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                  {p.tarifaPorMinuto > 0 && (
                    <p className="tarjeta-tarifa">${p.tarifaPorMinuto.toLocaleString('es-CO')} / minuto</p>
                  )}
                </Link>
              ) : (
                <div key={p._id} className="tarjeta-parqueadero tarjeta-bloqueada">
                  <span className="tarjeta-badge tarjeta-badge-proximamente">Proximamente</span>
                  <div className="tarjeta-icono tarjeta-icono-bloqueado">🔒</div>
                  <h2>{p.nombre}</h2>
                  <p>Aun sin configurar</p>
                </div>
              )
            )}

            {usuario?.rol === 'admin' && !mostrarFormulario && (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="tarjeta-parqueadero tarjeta-bloqueada"
                style={{ cursor: 'pointer', border: '1.5px dashed rgba(245, 166, 35, 0.5)' }}
              >
                <div className="tarjeta-icono tarjeta-icono-bloqueado">＋</div>
                <h2>Agregar parqueadero</h2>
                <p>Crear una sede nueva</p>
              </button>
            )}
          </div>
        )}

        {mostrarFormulario && (
          <form onSubmit={crearParqueadero} className="parqueaderos-form">
            <h3>Nuevo parqueadero</h3>
            <input
              type="text"
              placeholder="Nombre (ej: Centro Comercial Santafe)"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Direccion (opcional)"
              value={direccionNueva}
              onChange={(e) => setDireccionNueva(e.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Tarifa por minuto (COP)"
              value={tarifaNueva}
              onChange={(e) => setTarifaNueva(e.target.value)}
            />
            <div className="parqueaderos-form-botones">
              <button type="submit" disabled={guardando}>
                {guardando ? 'Creando...' : 'Crear'}
              </button>
              <button type="button" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </button>
            </div>
            <p className="parqueaderos-form-ayuda">
              Nace vacio: entra a su dashboard y usa "Editar posiciones" para ir agregando los puestos.
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
