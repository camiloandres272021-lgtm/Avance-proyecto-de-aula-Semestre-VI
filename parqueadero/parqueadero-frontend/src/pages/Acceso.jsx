import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { crearRecaptcha, enviarCodigoSMS, confirmarCodigoSMS } from '../services/firebase';
import './Acceso.css';

// Esta pagina reemplaza los antiguos /login y /registro por separado.
// Primero muestra dos opciones grandes; al elegir una, se despliega el formulario.
// El "modo" inicial se puede pasar por la URL: /acceso?modo=login o ?modo=registro
export default function Acceso() {
  const [params] = useSearchParams();
  const modoInicial = params.get('modo'); // 'login' | 'registro' | null

  const [paso, setPaso] = useState(modoInicial ? modoInicial : 'elegir');

  if (paso === 'elegir') {
    return <PantallaElegir onElegir={setPaso} />;
  }

  return <PantallaFormulario modo={paso} onVolver={() => setPaso('elegir')} onCambiarModo={setPaso} />;
}

// --- Paso 1: elegir entre iniciar sesion o crear cuenta ---
function PantallaElegir({ onElegir }) {
  return (
    <div className="acceso">
      <div className="acceso-logo">🅿️ <span>Parqueadero</span></div>

      <div className="acceso-elegir">
        <h1 className="acceso-titulo">Bienvenido</h1>
        <p className="acceso-subtitulo">¿Que quieres hacer?</p>

        <div className="acceso-opciones">
          <div className="acceso-opcion" onClick={() => onElegir('login')}>
            <span className="acceso-opcion-icono">🔑</span>
            <h3>Iniciar sesion</h3>
            <p>Ya tengo una cuenta y quiero entrar a mi parqueadero.</p>
          </div>
          <div className="acceso-opcion" onClick={() => onElegir('registro')}>
            <span className="acceso-opcion-icono">✨</span>
            <h3>Crear cuenta</h3>
            <p>Es mi primera vez, quiero registrar mi parqueadero.</p>
          </div>
        </div>

        <Link to="/" className="acceso-volver-inicio">← Volver al inicio</Link>
      </div>
    </div>
  );
}

// --- Paso 2: el formulario (login o registro, segun el modo) ---
function PantallaFormulario({ modo, onVolver, onCambiarModo }) {
  const esLogin = modo === 'login';

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Estado del flujo de telefono: 'cerrado' -> 'pidiendo_numero' -> 'pidiendo_codigo'
  const [pasoTelefono, setPasoTelefono] = useState('cerrado');
  const [telefono, setTelefono] = useState('');
  const [codigoSMS, setCodigoSMS] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const { login, loginWithGoogle, loginWithPhone } = useAuth();
  const navigate = useNavigate();

  // Si el usuario venia de ver un plano (?volver=/dashboard/xxx), lo devolvemos
  // ahi despues de iniciar sesion. Solo aceptamos rutas internas.
  const [paramsUrl] = useSearchParams();
  const volver = paramsUrl.get('volver');
  const destino = volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/parqueaderos';

  async function manejarSubmit(evento) {
    evento.preventDefault();
    setError('');
    setCargando(true);

    try {
      if (esLogin) {
        await login(email, password);
      } else {
        await api.post('/auth/registrar', { nombre, email, password });
        await login(email, password);
      }
      navigate(destino);
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Ocurrio un error, intenta de nuevo';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  // --- Google: un solo clic, popup, y listo ---
  async function manejarGoogle() {
    setError('');
    setCargando(true);
    try {
      await loginWithGoogle();
      navigate(destino);
    } catch (err) {
      setError('No se pudo iniciar sesion con Google, intenta de nuevo');
    } finally {
      setCargando(false);
    }
  }

  // --- Telefono paso 1: enviar el codigo por SMS ---
  async function manejarEnviarCodigo(evento) {
    evento.preventDefault();
    setError('');
    setCargando(true);
    try {
      const recaptcha = crearRecaptcha('recaptcha-container');
      const resultado = await enviarCodigoSMS(telefono, recaptcha);
      setConfirmationResult(resultado);
      setPasoTelefono('pidiendo_codigo');
    } catch (err) {
      setError('No se pudo enviar el codigo. Revisa el numero (con codigo de pais, ej: +57...)');
    } finally {
      setCargando(false);
    }
  }

  // --- Telefono paso 2: confirmar el codigo que llego por SMS ---
  async function manejarConfirmarCodigo(evento) {
    evento.preventDefault();
    setError('');
    setCargando(true);
    try {
      const idToken = await confirmarCodigoSMS(confirmationResult, codigoSMS);
      await loginWithPhone(idToken);
      navigate(destino);
    } catch (err) {
      setError('Codigo incorrecto, intenta de nuevo');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="acceso">
      <div className="acceso-logo">🅿️ <span>Parqueadero</span></div>

      <div className="acceso-formulario-wrap">
        <button className="acceso-volver" onClick={onVolver}>← Volver</button>

        <div className="acceso-formulario">
          <h2>{esLogin ? 'Inicia sesion' : 'Crea tu cuenta'}</h2>
          <p className="subtitulo">
            {esLogin ? 'Bienvenido de nuevo' : 'Empieza a gestionar tu parqueadero'}
          </p>

          {error && <div className="acceso-error">{error}</div>}

          <form onSubmit={manejarSubmit}>
            {!esLogin && (
              <label className="acceso-label">
                Nombre
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="acceso-input"
                  placeholder="Tu nombre"
                />
              </label>
            )}

            <label className="acceso-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="acceso-input"
                placeholder="tu@email.com"
              />
            </label>

            <label className="acceso-label">
              Contrasena
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="acceso-input"
                placeholder={esLogin ? '••••••••' : 'Minimo 6 caracteres'}
              />
            </label>

            <button type="submit" disabled={cargando} className="acceso-boton">
              {cargando ? 'Un momento...' : esLogin ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <div className="acceso-divisor">o continua con</div>

          {pasoTelefono === 'cerrado' && (
            <div className="acceso-alt">
              <button className="acceso-boton-alt" onClick={manejarGoogle} disabled={cargando}>
                🔍 Google
              </button>
              <button
                className="acceso-boton-alt"
                onClick={() => setPasoTelefono('pidiendo_numero')}
                disabled={cargando}
              >
                📱 Numero de celular
              </button>
            </div>
          )}

          {pasoTelefono === 'pidiendo_numero' && (
            <form onSubmit={manejarEnviarCodigo} className="acceso-telefono-form">
              <label className="acceso-label">
                Numero de celular (con codigo de pais)
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  className="acceso-input"
                  placeholder="+573001234567"
                />
              </label>
              <button type="submit" disabled={cargando} className="acceso-boton">
                {cargando ? 'Enviando...' : 'Enviar codigo'}
              </button>
              <button type="button" className="acceso-boton-alt" onClick={() => setPasoTelefono('cerrado')}>
                Cancelar
              </button>
            </form>
          )}

          {pasoTelefono === 'pidiendo_codigo' && (
            <form onSubmit={manejarConfirmarCodigo} className="acceso-telefono-form">
              <label className="acceso-label">
                Codigo que llego por SMS
                <input
                  type="text"
                  value={codigoSMS}
                  onChange={(e) => setCodigoSMS(e.target.value)}
                  required
                  className="acceso-input"
                  placeholder="123456"
                />
              </label>
              <button type="submit" disabled={cargando} className="acceso-boton">
                {cargando ? 'Verificando...' : 'Confirmar codigo'}
              </button>
              <button type="button" className="acceso-boton-alt" onClick={() => setPasoTelefono('cerrado')}>
                Cancelar
              </button>
            </form>
          )}

          {/* Contenedor invisible donde Firebase monta el reCAPTCHA del login por telefono */}
          <div id="recaptcha-container"></div>

          <p className="acceso-pie">
            {esLogin ? (
              <>¿No tienes cuenta? <button onClick={() => onCambiarModo('registro')}>Registrate</button></>
            ) : (
              <>¿Ya tienes cuenta? <button onClick={() => onCambiarModo('login')}>Inicia sesion</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
