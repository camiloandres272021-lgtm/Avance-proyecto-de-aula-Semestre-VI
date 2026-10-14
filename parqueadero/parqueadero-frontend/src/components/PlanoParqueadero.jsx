import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';
import AccionPuestoModal from './AccionPuestoModal';
import {
  VIEWBOX,
  COLORES_ZONA,
  COLORES_ESTADO,
  obtenerLayoutNivel,
} from '../utils/layoutMallPlaza';

export default function PlanoParqueadero({ parqueaderoId, modoEdicion = false, nivel = 'Sotano 1' }) {
  const [puestos, setPuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(null); // id del puesto que se esta moviendo
  const [creandoPuesto, setCreandoPuesto] = useState(false);
  const [numeroNuevo, setNumeroNuevo] = useState('');
  const [tipoNuevo, setTipoNuevo] = useState('carro');
  const svgRef = useRef(null);
  const { estaLogueado } = useAuth();
  const [modal, setModal] = useState(null); // { tipo, puesto, registro?, factura?, error? }

  const layout = obtenerLayoutNivel(nivel);

  useEffect(() => {
    if (!parqueaderoId) return;
    async function cargarPuestos() {
      setCargando(true);
      try {
        const respuesta = await api.get('/puestos', { params: { parqueaderoId, nivel } });
        setPuestos(respuesta.data.puestos);
        setError('');
      } catch (err) {
        setError('No se pudieron cargar los puestos');
      } finally {
        setCargando(false);
      }
    }
    cargarPuestos();
  }, [parqueaderoId, nivel]);

  async function crearPuesto(evento) {
    evento.preventDefault();
    if (!numeroNuevo.trim()) return;
    try {
      const respuesta = await api.post('/puestos', {
        numero: numeroNuevo.trim(),
        tipo: tipoNuevo,
        nivel,
        parqueaderoId,
        posicion: { x: 45, y: 25, ancho: 8, alto: 12, rotacion: 0 },
      });
      setPuestos((actuales) => [...actuales, respuesta.data.puesto]);
      setNumeroNuevo('');
      setCreandoPuesto(false);
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo crear el puesto');
    }
  }

  useEffect(() => {
    function manejarActualizacion(puestoActualizado) {
      if (puestoActualizado.nivel !== nivel) return;
      setPuestos((actuales) =>
        actuales.map((p) => (p._id === puestoActualizado._id ? puestoActualizado : p))
      );
    }

    socket.on('puesto_actualizado', manejarActualizacion);
    return () => socket.off('puesto_actualizado', manejarActualizacion);
  }, [nivel]);

  // Un visitante sin sesion puede mirar el plano; al tocar un puesto se le
  // invita a iniciar sesion (y vuelve aqui). Con sesion, se abre el modal de
  // entrada (puesto libre) o de salida (puesto ocupado).
  async function manejarClickPuesto(puesto) {
    if (modoEdicion) return;

    if (!estaLogueado) {
      setModal({ tipo: 'visitante', puesto });
      return;
    }

    if (puesto.estado === 'libre') {
      setModal({ tipo: 'entrada', puesto });
      return;
    }

    try {
      const respuesta = await api.get('/registros/activos');
      const registro = respuesta.data.registros.find((r) => r.puesto?._id === puesto._id);
      if (!registro) {
        alert('No se encontro el registro activo de este puesto');
        return;
      }
      setModal({ tipo: 'salida', puesto, registro, tarifa: registro.tarifaPorMinuto ?? respuesta.data.tarifaPorMinuto });
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo consultar el registro del puesto');
    }
  }

  async function confirmarEntrada(puesto, placa) {
    try {
      await api.post('/registros/entrada', { puestoId: puesto._id, placa });
      setModal(null);
    } catch (err) {
      setModal((actual) => ({ ...actual, error: err.response?.data?.error || 'Error al registrar la entrada' }));
    }
  }

  async function confirmarSalida(registro) {
    try {
      const respuesta = await api.put(`/registros/${registro._id}/salida`);
      setModal({ tipo: 'factura', puesto: modal.puesto, factura: respuesta.data.factura });
    } catch (err) {
      setModal((actual) => ({ ...actual, error: err.response?.data?.error || 'Error al registrar la salida' }));
    }
  }

  function manejarInicioArrastre(evento, puesto) {
    if (!modoEdicion) return;
    evento.preventDefault();
    setArrastrando(puesto._id);
  }

  function obtenerCoordenadasPorcentaje(evento) {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const clienteX = evento.touches ? evento.touches[0].clientX : evento.clientX;
    const clienteY = evento.touches ? evento.touches[0].clientY : evento.clientY;
    const x = ((clienteX - rect.left) / rect.width) * 100;
    const y = ((clienteY - rect.top) / rect.height) * 56;
    return { x, y };
  }

  function manejarMovimiento(evento) {
    if (!arrastrando) return;
    const { x, y } = obtenerCoordenadasPorcentaje(evento);
    setPuestos((actuales) =>
      actuales.map((p) =>
        p._id === arrastrando
          ? { ...p, posicion: { ...p.posicion, x: Math.max(0, Math.min(97, x)), y: Math.max(0, Math.min(52, y)) } }
          : p
      )
    );
  }

  async function manejarFinArrastre() {
    if (!arrastrando) return;
    const puesto = puestos.find((p) => p._id === arrastrando);
    setArrastrando(null);

    try {
      await api.put(`/puestos/${puesto._id}/posicion`, {
        x: puesto.posicion.x,
        y: puesto.posicion.y,
      });
    } catch (err) {
      console.error('Error al guardar posicion:', err);
    }
  }

  if (cargando) return <p className="plano-mensaje">Cargando plano...</p>;
  if (error) return <p className="plano-mensaje plano-mensaje-error">{error}</p>;

  const libres = puestos.filter((p) => p.estado === 'libre').length;
  const ocupados = puestos.length - libres;

  return (
    <div>
      <div style={estilos.stats}>
        <span style={{ ...estilos.stat, backgroundColor: '#dcfce7', color: '#166534' }}>
          🟢 {libres} libres
        </span>
        <span style={{ ...estilos.stat, backgroundColor: '#fee2e2', color: '#991b1b' }}>
          🔴 {ocupados} ocupados
        </span>
        <span style={{ ...estilos.stat, backgroundColor: '#f3f4f6', color: '#374151' }}>
          {puestos.length} en este nivel
        </span>
      </div>

      {modoEdicion && (
        <div style={estilos.avisoEdicion}>
          <div>✏️ Modo edicion: arrastra los puestos para ubicarlos en el plano</div>
          {!creandoPuesto ? (
            <button type="button" onClick={() => setCreandoPuesto(true)} style={estilos.botonAgregarPuesto}>
              + Agregar puesto
            </button>
          ) : (
            <form onSubmit={crearPuesto} style={estilos.formPuesto}>
              <input
                type="text"
                placeholder="Numero (ej: A5)"
                value={numeroNuevo}
                onChange={(e) => setNumeroNuevo(e.target.value)}
                style={estilos.inputPuesto}
                autoFocus
              />
              <select value={tipoNuevo} onChange={(e) => setTipoNuevo(e.target.value)} style={estilos.inputPuesto}>
                <option value="carro">Carro</option>
                <option value="moto">Moto</option>
                <option value="bicicleta">Bicicleta</option>
                <option value="discapacitado">Discapacitado</option>
              </select>
              <button type="submit" style={estilos.botonAgregarPuesto}>Crear</button>
              <button type="button" onClick={() => setCreandoPuesto(false)} style={estilos.botonCancelarPuesto}>
                Cancelar
              </button>
            </form>
          )}
        </div>
      )}

      <div style={estilos.contenedorSvg}>
      <svg
        ref={svgRef}
        viewBox={VIEWBOX}
        style={estilos.svg}
        onMouseMove={manejarMovimiento}
        onMouseUp={manejarFinArrastre}
        onMouseLeave={manejarFinArrastre}
        onTouchMove={manejarMovimiento}
        onTouchEnd={manejarFinArrastre}
      >
        {/* Fondo general del nivel */}
        <rect x="0" y="0" width="100" height="56" fill="#f3f4f6" rx="1.5" />

        {/* Zonas decorativas: contorno, rampas, zonas de color, nucleo de ascensores */}
        {layout.zonas.map((zona, i) => {
          if (zona.tipo === 'contorno') {
            return (
              <rect
                key={`zona-${i}`}
                x={zona.x} y={zona.y} width={zona.ancho} height={zona.alto}
                fill="none" stroke="#c3c9d1" strokeWidth="0.4" rx="1"
              />
            );
          }
          const colores =
            zona.tipo === 'ascensor'
              ? { relleno: '#fef9c3', borde: '#eab308' }
              : zona.tipo === 'ancla'
              ? { relleno: '#e0e7ff', borde: '#818cf8' }
              : zona.tipo === 'rampa'
              ? { relleno: '#e5e7eb', borde: '#9ca3af' }
              : COLORES_ZONA[zona.tipo] || COLORES_ZONA.estandar;

          return (
            <g key={`zona-${i}`}>
              <rect
                x={zona.x} y={zona.y} width={zona.ancho} height={zona.alto}
                fill={colores.relleno} stroke={colores.borde} strokeWidth="0.35"
                strokeDasharray="1.2 0.8" rx="0.8"
              />
              {zona.label && zona.label.split('\n').map((linea, li) => (
                <text
                  key={li}
                  x={zona.x + zona.ancho / 2}
                  y={zona.y + zona.alto / 2 - ((zona.label.split('\n').length - 1) * 1.6) / 2 + li * 1.9}
                  fontSize="1.5"
                  textAnchor="middle"
                  fill="#4b5563"
                  fontWeight="700"
                  style={{ pointerEvents: 'none' }}
                >
                  {linea}
                </text>
              ))}
            </g>
          );
        })}

        {/* Rotulos sueltos: rampa de entrada, circulacion, etc */}
        {layout.rotulos.map((rotulo, i) => (
          <text key={`rotulo-${i}`} x={rotulo.x} y={rotulo.y} fontSize="1.6" fill="#6b7280" fontWeight="600">
            {rotulo.texto}
          </text>
        ))}

        {/* Cada puesto real, coloreado por zona (borde) y por estado (relleno) */}
        {puestos.map((puesto) => {
          const { x = 0, y = 0, ancho = 3, alto = 6, rotacion = 0 } = puesto.posicion || {};
          const ocupado = puesto.estado === 'ocupado';
          const estadoColor = ocupado ? COLORES_ESTADO.ocupado : COLORES_ESTADO.libre;
          const zonaColor = COLORES_ZONA[puesto.zona] || COLORES_ZONA.estandar;

          return (
            <g
              key={puesto._id}
              transform={`translate(${x}, ${y}) rotate(${rotacion}, ${ancho / 2}, ${alto / 2})`}
              onMouseDown={(e) => manejarInicioArrastre(e, puesto)}
              onTouchStart={(e) => manejarInicioArrastre(e, puesto)}
              onClick={() => manejarClickPuesto(puesto)}
              style={{ cursor: modoEdicion ? 'grab' : 'pointer' }}
            >
              <title>{`${puesto.numero} · ${ocupado ? 'Ocupado' : 'Libre'}`}</title>
              <rect
                width={ancho}
                height={alto}
                rx="0.5"
                fill={estadoColor.relleno}
                stroke={zonaColor.borde}
                strokeWidth="0.45"
              />
              {/* Numero del puesto */}
              <text
                x={ancho / 2}
                y={alto - 0.7}
                fontSize="1.5"
                textAnchor="middle"
                fill="#1f2937"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {puesto.numero}
              </text>
              {/* Icono simple cuando esta ocupado */}
              {ocupado && (
                <text
                  x={ancho / 2}
                  y={alto / 2 + 0.6}
                  fontSize="3"
                  textAnchor="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  🚗
                </text>
              )}
            </g>
          );
        })}
      </svg>
      </div>

      <div style={estilos.leyenda}>
        <div style={estilos.leyendaFila}>
          <span><span style={{ ...estilos.punto, backgroundColor: '#86efac' }} /> Libre</span>
          <span><span style={{ ...estilos.punto, backgroundColor: '#fca5a5' }} /> Ocupado</span>
        </div>
        <div style={estilos.leyendaFila}>
          <span><span style={{ ...estilos.punto, backgroundColor: '#3b82f6' }} /> Preferencial</span>
          <span><span style={{ ...estilos.punto, backgroundColor: '#f97316' }} /> Motos</span>
          <span><span style={{ ...estilos.punto, backgroundColor: '#22c55e' }} /> Bicicletas</span>
          <span><span style={{ ...estilos.punto, backgroundColor: '#eab308' }} /> Ascensores/Escaleras</span>
          <span><span style={{ ...estilos.punto, backgroundColor: '#9ca3af' }} /> Rampas/Circulacion</span>
        </div>
      </div>

      <AccionPuestoModal
        key={modal ? `${modal.tipo}-${modal.puesto?._id}` : 'cerrado'}
        modal={modal}
        parqueaderoId={parqueaderoId}
        onCerrar={() => setModal(null)}
        onConfirmarEntrada={confirmarEntrada}
        onConfirmarSalida={confirmarSalida}
      />
    </div>
  );
}

const estilos = {
  stats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  stat: {
    padding: '0.35rem 0.8rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  // En celulares el plano no se encoge hasta ser ilegible: se puede desplazar.
  contenedorSvg: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  svg: {
    display: 'block',
    minWidth: '720px',
    width: '100%',
    maxWidth: '1100px',
    aspectRatio: '100 / 56',
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    userSelect: 'none',
  },
  avisoEdicion: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.6rem',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    fontSize: '0.85rem',
  },
  botonAgregarPuesto: {
    padding: '0.35rem 0.7rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#92400e',
    color: '#fff7ed',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  botonCancelarPuesto: {
    padding: '0.35rem 0.7rem',
    borderRadius: '6px',
    border: '1px solid #92400e',
    backgroundColor: 'transparent',
    color: '#92400e',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  formPuesto: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  inputPuesto: {
    padding: '0.3rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid #d1a054',
    fontSize: '0.8rem',
  },
  leyenda: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.9rem',
    fontSize: '0.85rem',
    color: '#374151',
  },
  leyendaFila: {
    display: 'flex',
    gap: '1.25rem',
    flexWrap: 'wrap',
  },
  punto: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '0.4rem',
  },
};
