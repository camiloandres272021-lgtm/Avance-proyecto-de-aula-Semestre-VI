import { createContext, useContext, useState } from 'react';
import api from '../services/api';
import { iniciarSesionConGoogle } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  async function login(email, password) {
    const respuesta = await api.post('/auth/login', { email, password });
    const { token, usuario: datosUsuario } = respuesta.data;

    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);

    return datosUsuario;
  }

  async function sincronizarConBackend(idToken) {
    const respuesta = await api.post('/auth/firebase', { idToken });
    const { token, usuario: datosUsuario } = respuesta.data;

    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);

    return datosUsuario;
  }

  async function loginWithGoogle() {
    const idToken = await iniciarSesionConGoogle();
    return sincronizarConBackend(idToken);
  }


  async function loginWithPhone(idToken) {
    return sincronizarConBackend(idToken);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  const estaLogueado = !!usuario;

  return (
    <AuthContext.Provider value={{ usuario, login, loginWithGoogle, loginWithPhone, logout, estaLogueado }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}
