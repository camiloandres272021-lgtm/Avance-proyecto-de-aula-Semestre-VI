import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ children, soloAdmin = false }) {
  const { estaLogueado, usuario } = useAuth();

  if (!estaLogueado) {
    return <Navigate to="/acceso?modo=login" replace />;
  }

  if (soloAdmin && usuario?.rol !== 'admin') {
    return <Navigate to="/parqueaderos" replace />;
  }

  return children;
}
