import { io, Socket } from 'socket.io-client';

// Socket 客户端单例
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : window.location.origin;
    socket = io(url, {
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
