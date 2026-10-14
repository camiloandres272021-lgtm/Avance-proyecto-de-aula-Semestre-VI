import axios from 'axios';

// URL base de nuestro backend. La sacamos de una variable de entorno
// para que sea facil cambiarla despues (ej: cuando despleguemos a produccion).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor: antes de CADA peticion, si hay un token guardado,
// lo agregamos automaticamente al header Authorization.
// Asi no tenemos que repetir esta logica en cada archivo.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export { API_URL };
