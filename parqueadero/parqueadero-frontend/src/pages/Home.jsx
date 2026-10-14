import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEnVista } from '../hooks/useEnVista';
import MiniPlanoAnimado from '../components/MiniPlanoAnimado';
import './Home.css';

export default function Home() {
  const { estaLogueado } = useAuth();

  const [refFeatures, visibleFeatures] = useEnVista();
  const [refProceso, visibleProceso] = useEnVista();
  const [refPlataformas, visiblePlataformas] = useEnVista();
  const [refCta, visibleCta] = useEnVista();

  const destinoCta = estaLogueado ? '/parqueaderos' : '/acceso?modo=registro';

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-logo">
          <span className="landing-logo-marca">🅿️</span> Parqueadero
        </span>
        <div className="landing-nav-acciones">
          {estaLogueado ? (
            <Link to="/parqueaderos" className="landing-boton-secundario">Ir al plano</Link>
          ) : (
            <>
              <Link to="/parqueaderos" className="landing-boton-secundario">Ver puestos</Link>
              <Link to="/acceso?modo=login" className="landing-boton-secundario">Iniciar sesion</Link>
              <Link to="/acceso?modo=registro" className="landing-boton-primario">Registrarme</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero">
        <div>
          <div className="landing-eyebrow">Sistema de gestion de parqueaderos</div>
          <h1 className="landing-h1">
            Cada puesto,<br />
            <span>en tiempo real.</span>
          </h1>
          <p className="landing-hero-parrafo">
            Olvida el cuaderno de registros. Visualiza tu parqueadero como es en
            realidad, registra entradas y salidas con un clic, y deja que el
            sistema calcule cada factura por ti.
          </p>
          <div className="landing-cta-grupo">
            <Link to={destinoCta} className="landing-boton-primario">
              {estaLogueado ? 'Ir a mi plano →' : 'Registra tu parqueadero →'}
            </Link>
            <Link to="/parqueaderos" className="landing-boton-secundario">
              Ver puestos en vivo
            </Link>
            {!estaLogueado && (
              <Link to="/acceso?modo=login" className="landing-boton-secundario">Ya tengo cuenta</Link>
            )}
          </div>
        </div>
        <MiniPlanoAnimado />
      </section>

      {/* FEATURES */}
      <section ref={refFeatures} className={`landing-features landing-seccion ${visibleFeatures ? 'visible' : ''}`}>
        <h2 className="landing-titulo-seccion">Todo lo que necesitas para operar sin papel</h2>
        <div className="landing-grid-features">
          <div className="landing-feature-card">
            <span className="landing-feature-etiqueta">Plano en vivo</span>
            <h3>Ve cada puesto</h3>
            <p>Un mapa real de tu parqueadero, no una lista. Verde es libre, rojo es ocupado, actualizado al instante para todo tu equipo.</p>
          </div>
          <div className="landing-feature-card">
            <span className="landing-feature-etiqueta">Un clic</span>
            <h3>Entradas y salidas</h3>
            <p>Toca un puesto libre para registrar una placa. Toca uno ocupado para liberarlo. Nada de formularios largos.</p>
          </div>
          <div className="landing-feature-card">
            <span className="landing-feature-etiqueta">Automatico</span>
            <h3>Facturacion al segundo</h3>
            <p>El sistema calcula el tiempo exacto y el valor a cobrar apenas el vehiculo sale. Sin calculadora, sin errores.</p>
          </div>
        </div>
      </section>

      <section ref={refProceso} className={`landing-proceso landing-seccion ${visibleProceso ? 'visible' : ''}`}>
        <h2 className="landing-titulo-seccion">Como funciona</h2>
        <div className="landing-lista-pasos">
          <div className="landing-paso">
            <span className="landing-paso-numero">01</span>
            <h4>Crea tu cuenta</h4>
            <p>Registra tu usuario en menos de un minuto, sin instalaciones.</p>
          </div>
          <div className="landing-paso">
            <span className="landing-paso-numero">02</span>
            <h4>Dibuja tu plano</h4>
            <p>Ubica cada puesto arrastrandolo donde va en la vida real.</p>
          </div>
          <div className="landing-paso">
            <span className="landing-paso-numero">03</span>
            <h4>Registra movimientos</h4>
            <p>Marca entradas y salidas de vehiculos con un clic sobre el plano.</p>
          </div>
          <div className="landing-paso">
            <span className="landing-paso-numero">04</span>
            <h4>Recibe el cobro</h4>
            <p>La factura se genera sola, con el tiempo y valor exactos.</p>
          </div>
        </div>
      </section>

      <section ref={refPlataformas} className={`landing-plataformas landing-seccion ${visiblePlataformas ? 'visible' : ''}`}>
        <h2 className="landing-titulo-seccion">Donde estes, tu parqueadero contigo</h2>
        <div className="landing-grid-plataformas">
          <div className="landing-plataforma">
            <span className="landing-plataforma-icono">🖥️</span>
            <h3>Panel web</h3>
            <p>Administra puestos, usuarios y registros desde cualquier navegador, sin instalar nada.</p>
          </div>
          <div className="landing-plataforma">
            <span className="landing-plataforma-icono">📱</span>
            <h3>App movil</h3>
            <p>Consulta y gestiona tu parqueadero desde el celular con tu misma cuenta.</p>
          </div>
          <div className="landing-plataforma">
            <span className="landing-plataforma-icono">⚡</span>
            <h3>Tiempo real</h3>
            <p>Cada cambio se refleja al instante en todos los dispositivos conectados, gracias a Socket.io.</p>
          </div>
        </div>
      </section>

      <section ref={refCta} className={`landing-cta-banda landing-seccion ${visibleCta ? 'visible' : ''}`}>
        <h2>¿Listo para dejar el cuaderno de registros?</h2>
        <Link to={destinoCta} className="landing-boton-primario">
          {estaLogueado ? 'Ir a mi plano →' : 'Crear cuenta gratis →'}
        </Link>
      </section>

      <footer className="landing-footer">
        Parqueadero — sistema de gestion en tiempo real
      </footer>
    </div>
  );
}