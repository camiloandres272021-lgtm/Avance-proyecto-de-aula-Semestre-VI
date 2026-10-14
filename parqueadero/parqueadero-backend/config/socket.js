const { Server } = require('socket.io');

let io;

function initSocket(servidorHttp) {
  io = new Server(servidorHttp, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado todavia');
  }
  return io;
}

module.exports = { initSocket, getIO };
