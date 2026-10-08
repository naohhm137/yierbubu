import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { RoomManager } from './RoomManager.js';
import { SocketSession } from './socketProtocol.js';

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
  const session = new SocketSession(roomManager, socket);
  for (const event of ['createRoom', 'joinRoom', 'leaveRoom', 'setReady', 'fillBots', 'removeBot', 'selectCharacter', 'startGame', 'action', 'restart', 'disconnect']) {
    socket.on(event, (data: unknown) => session.receive(event, data));
  }
});

// ---------- 启动 ----------
httpServer.listen(PORT, HOST, () => {
  app.log.info(`🚀 一二布布：萌境奇旅 服务端运行在 http://${HOST}:${PORT}`);
  app.log.info(`📡 Socket.IO 已就绪`);
});

export { app, io, roomManager };
