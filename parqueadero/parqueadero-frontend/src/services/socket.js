import { io } from 'socket.io-client';
import { API_URL } from './api';

// Creamos UNA sola conexion de socket para toda la app (no una por componente)
const socket = io(API_URL, {
  autoConnect: true,
});

export default socket;
