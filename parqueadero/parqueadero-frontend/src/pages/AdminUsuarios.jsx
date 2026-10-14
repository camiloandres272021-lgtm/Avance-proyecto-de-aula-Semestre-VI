import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminUsuarios.css';

export default function AdminUsuarios() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState(null); // evita doble-click mientras se guarda

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setCargando(true);
    setError('');
    try {
      const respuesta = await api.get('/usuarios');
      setUsuarios(respuesta.data.usuarios);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }

  async function cambiarRol(u, nuevoRol) {
    if (nuevoRol === u.rol) return;
    setProcesandoId(u._id);
    try {
      const respuesta = await api.put(`/usuarios/${u._id}/rol`, { rol: nuevoRol });
      setUsuarios((actuales) => actuales.map((x) => (x._id === u._id ? respuesta.data.usuario : x)));
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo cambiar el rol');
    } finally {
      setProcesandoId(null);
    }
  }

  async function alternarBloqueo(u) {
    const nuevoEstado = !u.activo;
    const confirmar = window.confirm(
      nuevoEstado
        ? `¿Desbloquear a ${u.nombre}?`
        : `¿Bloquear a ${u.nombre}? No podra iniciar sesion hasta que lo desbloquees.`
    );
    if (!confirmar) return;

    setProcesandoId(u._id);
    try {
      const respuesta = await api.put(`/usuarios/${u._id}/estado`, { activo: nuevoEstado });
      setUsuarios((actuales) => actuales.map((x) => (x._id === u._id ? respuesta.data.usuario : x)));
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo cambiar el estado');
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminar(u) {
    const confirmar = window.confirm(`¿Eliminar definitivamente a ${u.nombre}? Esta accion no se puede deshacer.`);
    if (!confirmar) return;

    setProcesandoId(u._id);
    try {
      await api.delete(`/usuarios/${u._id}`);
      setUsuarios((actuales) => actuales.filter((x) => x._id !== u._id));
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar el usuario');
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="admin-usuarios-fondo">
      <header className="admin-usuarios-header">
        <div className="admin-usuarios-header-izquierda">
          <Link to="/parqueaderos" className="admin-usuarios-volver">← Parqueaderos</Link>
          <span className="admin-usuarios-separador">|</span>
          <span className="admin-usuarios-logo">
            <span className="admin-usuarios-logo-icono">P</span> Usuarios
          </span>
        </div>
        <div className="admin-usuarios-usuario">
          <span>Hola, {usuario?.nombre}</span>
        </div>
      </header>

      <main className="admin-usuarios-main">
        <h1 className="admin-usuarios-titulo">Gestion de usuarios</h1>
        <p className="admin-usuarios-ayuda">
          Cambia el rol de un usuario, bloquealo para que no pueda iniciar sesion, o eliminalo definitivamente.
        </p>

        {cargando && <p className="admin-usuarios-mensaje">Cargando usuarios...</p>}
        {error && <p className="admin-usuarios-mensaje admin-usuarios-error">{error}</p>}

        {!cargando && !error && (
          <div className="admin-usuarios-tabla-card">
            <table className="admin-usuarios-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email / Telefono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const esYoMismo = u._id === usuario?.id;
                  const bloqueado = u.activo === false;
                  const procesando = procesandoId === u._id;

                  return (
                    <tr key={u._id} className={bloqueado ? 'fila-bloqueada' : ''}>
                      <td>{u.nombre} {esYoMismo && <span className="admin-usuarios-tag-yo">(tu)</span>}</td>
                      <td>{u.email || u.telefono || '—'}</td>
                      <td>
                        <select
                          value={u.rol}
                          disabled={esYoMismo || procesando}
                          onChange={(e) => cambiarRol(u, e.target.value)}
                          className="admin-usuarios-select"
                        >
                          <option value="operador">Operador</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`admin-usuarios-badge ${bloqueado ? 'badge-bloqueado' : 'badge-activo'}`}>
                          {bloqueado ? 'Bloqueado' : 'Activo'}
                        </span>
                      </td>
                      <td className="admin-usuarios-acciones">
                        <button
                          className="admin-usuarios-boton"
                          disabled={esYoMismo || procesando}
                          onClick={() => alternarBloqueo(u)}
                        >
                          {bloqueado ? 'Desbloquear' : 'Bloquear'}
                        </button>
                        <button
                          className="admin-usuarios-boton admin-usuarios-boton-peligro"
                          disabled={esYoMismo || procesando}
                          onClick={() => eliminar(u)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
