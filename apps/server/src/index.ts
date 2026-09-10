import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { RoomManager } from './RoomManager.js';
import type { ActionType, ActionParams } from '@yierbubu/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = Fastify({ logger: true });
const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// 将 Fastify 挂载到同一个 httpServer
app.ready().then(() => {
  httpServer.on('request', app.server.listeners('request')[0] as any);
});

const roomManager = new RoomManager(io);

// ---------- 静态文件（前端构建产物） ----------
const webDist = resolve(__dirname, '../../web/dist');
if (existsSync(webDist)) {
  app.register(fastifyStatic, {
    root: webDist,
    prefix: '/',
  });
  app.log.info(`Serving static files from ${webDist}`);
} else {
  app.log.warn('Web dist not found. Run `npm run build` first. Serving API only.');
}

// ---------- API ----------
app.get('/api/health', async () => ({
  status: 'ok',
  rooms: roomManager['rooms']?.size ?? 0,
  version: '0.1.0',
}));

// ---------- Socket.IO ----------
io.on('connection', (socket) => {
  app.log.info(`Player connected: ${socket.id}`);
  let currentRoomId: string | null = null;

  socket.on('createRoom', (data: { playerName: string }) => {
    const room = roomManager.createRoom(socket.id, data.playerName || '匿名玩家');
    currentRoomId = room.roomId;
    socket.join(room.roomId);
    socket.emit('roomCreated', { roomId: room.roomId });
    roomManager.broadcast(room.roomId);
  });

  socket.on('joinRoom', (data: { roomId: string; playerName: string }) => {
    const room = roomManager.joinRoom(data.roomId.toUpperCase(), socket.id, data.playerName || '匿名玩家');
    if (!room) {
      socket.emit('error', { message: '房间不存在或已满' });
      return;
    }
    currentRoomId = room.roomId;
    socket.join(room.roomId);
    roomManager.broadcast(room.roomId);
  });

  socket.on('leaveRoom', () => {
    if (currentRoomId) {
      roomManager.leaveRoom(currentRoomId, socket.id);
      socket.leave(currentRoomId);
      roomManager.broadcast(currentRoomId);
      currentRoomId = null;
    }
  });

  socket.on('setReady', (data: { ready: boolean }) => {
    if (!currentRoomId) return;
    roomManager.setReady(currentRoomId, socket.id, data.ready);
    roomManager.broadcast(currentRoomId);
  });

  socket.on('fillBots', (data: { count: number }) => {
    if (!currentRoomId) return;
    roomManager.fillBots(currentRoomId, data.count || 1);
    roomManager.broadcast(currentRoomId);
  });

  socket.on('removeBot', (data: { playerId: string }) => {
    if (!currentRoomId) return;
    roomManager.removeBot(currentRoomId, data.playerId);
    roomManager.broadcast(currentRoomId);
  });

  socket.on('selectCharacter', (data: { characterId: string }) => {
    if (!currentRoomId) return;
    const room = roomManager.getRoom(currentRoomId);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.characterId = data.characterId;
      roomManager.broadcast(currentRoomId);
    }
  });

  socket.on('startGame', () => {
    if (!currentRoomId) return;
    const result = roomManager.startGame(currentRoomId, socket.id);
    if (!result) {
      socket.emit('error', { message: '无法开始游戏（需要房主且至少 4 人）' });
    }
  });

  socket.on('action', (data: { action: ActionType; params?: ActionParams }) => {
    if (!currentRoomId) return;
    const result = roomManager.handleAction(currentRoomId, socket.id, data.action, data.params || {});
    if (!result.ok) {
      socket.emit('error', { message: result.error });
    }
  });

  socket.on('restart', () => {
    if (!currentRoomId) return;
    roomManager.restart(currentRoomId);
  });

  socket.on('disconnect', () => {
    app.log.info(`Player disconnected: ${socket.id}`);
    if (currentRoomId) {
      roomManager.leaveRoom(currentRoomId, socket.id);
      roomManager.broadcast(currentRoomId);
    }
  });
});

// ---------- 启动 ----------
httpServer.listen(PORT, HOST, () => {
  app.log.info(`🚀 一二布布：萌境奇旅 服务端运行在 http://${HOST}:${PORT}`);
  app.log.info(`📡 Socket.IO 已就绪`);
});

export { app, io, roomManager };
