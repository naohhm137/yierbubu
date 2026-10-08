import { io, Socket } from 'socket.io-client';

// Socket 客户端单例
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Vite proxies /socket.io in development; production shares the HTTP origin.
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
