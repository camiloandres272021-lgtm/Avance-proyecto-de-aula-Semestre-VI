import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Acceso from './pages/Acceso';
import Parqueaderos from './pages/Parqueaderos';
import Dashboard from './pages/Dashboard';
import AdminUsuarios from './pages/AdminUsuarios';
import RutaProtegida from './components/RutaProtegida';

// Mejora SCAMPER "Reorganizar": ver los parqueaderos y sus puestos NO requiere
// sesion. El login/registro se pide solo cuando el usuario quiere registrar
// una entrada o una salida. Solo la administracion de usuarios sigue protegida.
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/acceso" element={<Acceso />} />
      <Route path="/parqueaderos" element={<Parqueaderos />} />
      <Route path="/dashboard/:parqueaderoId" element={<Dashboard />} />
      <Route
        path="/admin/usuarios"
        element={
          <RutaProtegida soloAdmin>
            <AdminUsuarios />
          </RutaProtegida>
        }
      />
    </Routes>
  );
}

export default App;
