import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function manejarSubmit(evento) {
    evento.preventDefault(); // evita que la pagina se recargue al enviar el formulario
    setError('');
    setCargando(true);

    try {
      await login(email, password);
      navigate('/parqueaderos');
    } catch (err) {
      // Si el backend responde con un error (ej: credenciales invalidas), lo mostramos
      const mensaje = err.response?.data?.error || 'No se pudo iniciar sesion';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={estilos.contenedor}>
      <form style={estilos.formulario} onSubmit={manejarSubmit}>
        <div style={estilos.logo}>🅿️ Parqueadero</div>
        <h1 style={estilos.titulo}>Inicia sesion</h1>
        <p style={estilos.subtitulo}>Bienvenido de nuevo</p>

        {error && <div style={estilos.error}>{error}</div>}

        <label style={estilos.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={estilos.input}
            placeholder="tu@email.com"
          />
        </label>

        <label style={estilos.label}>
          Contrasena
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={estilos.input}
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={cargando} style={estilos.boton}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p style={estilos.pie}>
          ¿No tienes cuenta? <Link to="/registro" style={estilos.link}>Registrate</Link>
        </p>
      </form>
    </div>
  );
}

const estilos = {
  contenedor: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--asfalto)',
    fontFamily: 'var(--fuente-cuerpo)',
    padding: '1rem',
  },
  formulario: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '380px',
  },
  logo: {
    fontFamily: 'var(--fuente-display)',
    fontSize: '0.95rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#6b7280',
    marginBottom: '1rem',
  },
  titulo: {
    margin: 0,
    fontFamily: 'var(--fuente-display)',
    fontSize: '1.6rem',
    textTransform: 'uppercase',
  },
  subtitulo: {
    color: '#6b7280',
    marginTop: '0.25rem',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  label: {
    display: 'block',
    marginBottom: '1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    display: 'block',
    width: '100%',
    marginTop: '0.35rem',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
    boxSizing: 'border-box',
    fontFamily: 'var(--fuente-cuerpo)',
  },
  boton: {
    width: '100%',
    padding: '0.7rem',
    marginTop: '0.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--ambar)',
    color: 'var(--asfalto)',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '0.6rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  pie: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#6b7280',
    marginTop: '1.2rem',
    marginBottom: 0,
  },
  link: {
    color: 'var(--ambar-oscuro)',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
