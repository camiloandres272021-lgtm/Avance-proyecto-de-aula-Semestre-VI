import { useState } from 'react';
import { Link } from 'react-router-dom';
import './AccionPuestoModal.css';

function formatearPesos(valor) {
  return `$${Number(valor).toLocaleString('es-CO')}`;
}

function minutosDesde(fecha) {
  return Math.max(1, Math.ceil((Date.now() - new Date(fecha).getTime()) / 60000));
}

// Ventana emergente que reemplaza los antiguos window.prompt / window.confirm.
// `modal` = { tipo, puesto, registro?, tarifa?, factura?, error? }
// tipos: 'visitante' | 'entrada' | 'salida' | 'factura'
export default function AccionPuestoModal({ modal, parqueaderoId, onCerrar, onConfirmarEntrada, onConfirmarSalida }) {
  const [placa, setPlaca] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!modal) return null;

  const { tipo, puesto, registro, tarifa = 100, factura, error } = modal;
  const volver = encodeURIComponent(`/dashboard/${parqueaderoId}`);

  async function enviarEntrada(evento) {
    evento.preventDefault();
    if (!placa.trim()) return;
    setEnviando(true);
    await onConfirmarEntrada(puesto, placa);
    setEnviando(false);
  }

  async function enviarSalida() {
    setEnviando(true);
    await onConfirmarSalida(registro);
    setEnviando(false);
  }

  return (
    <div className="modal-fondo" onClick={onCerrar} role="presentation">
      <div className="modal-caja" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>

        {tipo === 'visitante' && (
          <>
            <h2>Puesto {puesto.numero}</h2>
            <p className={`modal-estado ${puesto.estado === 'libre' ? 'libre' : 'ocupado'}`}>
              {puesto.estado === 'libre' ? '🟢 Libre ahora' : '🔴 Ocupado'}
            </p>
            <p className="modal-texto">
              Para registrar una entrada o una salida necesitas iniciar sesion. Solo te lo pedimos ahora,
              cuando ya elegiste el puesto.
            </p>
            <div className="modal-botones">
              <Link className="modal-boton-primario" to={`/acceso?modo=login&volver=${volver}`}>Iniciar sesion</Link>
              <Link className="modal-boton-secundario" to={`/acceso?modo=registro&volver=${volver}`}>Crear cuenta</Link>
            </div>
          </>
        )}

        {tipo === 'entrada' && (
          <form onSubmit={enviarEntrada}>
            <h2>Registrar entrada</h2>
            <p className="modal-texto">Puesto <strong>{puesto.numero}</strong> · {puesto.zona}</p>
            <label className="modal-label" htmlFor="placa-entrada">Placa del vehiculo</label>
            <input
              id="placa-entrada"
              className="modal-input"
              type="text"
              placeholder="ABC123"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={7}
              autoFocus
              autoComplete="off"
            />
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-botones">
              <button type="submit" className="modal-boton-primario" disabled={enviando || placa.length < 5}>
                {enviando ? 'Registrando...' : 'Confirmar entrada'}
              </button>
              <button type="button" className="modal-boton-secundario" onClick={onCerrar}>Cancelar</button>
            </div>
          </form>
        )}

        {tipo === 'salida' && (
          <>
            <h2>Registrar salida</h2>
            <p className="modal-texto">Puesto <strong>{puesto.numero}</strong></p>
            <div className="modal-datos">
              <div><span>Placa</span><strong>{registro.placa}</strong></div>
              <div><span>Tiempo</span><strong>{minutosDesde(registro.horaEntrada)} min</strong></div>
              <div><span>Valor estimado</span><strong>{formatearPesos(minutosDesde(registro.horaEntrada) * tarifa)}</strong></div>
            </div>
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-botones">
              <button className="modal-boton-primario" onClick={enviarSalida} disabled={enviando}>
                {enviando ? 'Registrando...' : 'Confirmar salida y cobrar'}
              </button>
              <button className="modal-boton-secundario" onClick={onCerrar}>Cancelar</button>
            </div>
          </>
        )}

        {tipo === 'factura' && (
          <>
            <h2>✅ Salida registrada</h2>
            <div className="modal-datos">
              <div><span>Placa</span><strong>{factura.placa}</strong></div>
              <div><span>Tiempo total</span><strong>{factura.tiempoTotalMinutos} min</strong></div>
              <div><span>Valor cobrado</span><strong>{formatearPesos(factura.valorCobrado)}</strong></div>
            </div>
            <div className="modal-botones">
              <button className="modal-boton-primario" onClick={onCerrar}>Listo</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
