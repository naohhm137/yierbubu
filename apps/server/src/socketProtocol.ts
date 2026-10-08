import { RoomManager } from './RoomManager.js';
import type { ActionType } from '@yierbubu/shared';

interface SessionSocket {
  id: string;
  emit(event: string, data: any): unknown;
  join(room: string): unknown;
  leave(room: string): unknown;
}

export class SocketSession {
  private currentRoomId: string | null = null;
  constructor(private manager: RoomManager, private socket: SessionSocket) {}
  private error(message = '数据格式无效或操作不允许') { this.socket.emit('error', { message }); }
  private release() {
    if (!this.currentRoomId) return;
    this.manager.leaveRoom(this.currentRoomId, this.socket.id);
    this.socket.leave(this.currentRoomId);
    this.manager.broadcast(this.currentRoomId);
    this.currentRoomId = null;
  }
  receive(event: string, data?: any) {
    if (event === 'leaveRoom' || event === 'disconnect') { this.release(); return; }
    const object = (value: any) => value !== null && typeof value === 'object' && !Array.isArray(value);
    const text = (value: any) => typeof value === 'string' && value.length > 0 && value.length <= 100;
    const optionalText = (value: any) => value === undefined || text(value);
    const payloadEvents = ['createRoom', 'joinRoom', 'setReady', 'fillBots', 'removeBot', 'selectCharacter', 'action'];
    if (payloadEvents.includes(event) && !object(data)) { this.error(); return; }
    if ((event === 'createRoom' || event === 'joinRoom') && !optionalText(data.playerName)) { this.error(); return; }
    if (event === 'joinRoom' && !text(data.roomId)) { this.error(); return; }
    if (event === 'setReady' && typeof data.ready !== 'boolean') { this.error(); return; }
    if (event === 'fillBots' && (!Number.isInteger(data.count) || data.count < 1 || data.count > 8)) { this.error(); return; }
    if (event === 'removeBot' && !text(data.playerId)) { this.error(); return; }
    if (event === 'selectCharacter' && !text(data.characterId)) { this.error(); return; }
    if (event === 'action') {
      const actions = ['draw', 'playCard', 'useSkill', 'gift', 'exchange', 'defend', 'hoard', 'endTurn', 'dreamHelp'];
      if (!actions.includes(data.action) || (data.params !== undefined && !object(data.params))) { this.error(); return; }
      const params = data.params || {};
      if (!optionalText(params.cardId) || !optionalText(params.targetId) || (params.extra !== undefined && !object(params.extra))) { this.error(); return; }
      if (['playCard', 'gift', 'exchange'].includes(data.action) && !text(params.cardId)) { this.error(); return; }
      if (['gift', 'exchange', 'dreamHelp'].includes(data.action) && !text(params.targetId)) { this.error(); return; }
    }
    if (event === 'createRoom') {
      const room = this.manager.createRoom(this.socket.id, data.playerName || '匿名玩家');
      this.release();
      this.currentRoomId = room.roomId;
      this.socket.join(room.roomId);
      this.socket.emit('roomCreated', { roomId: room.roomId });
      this.manager.broadcast(room.roomId);
    } else if (event === 'joinRoom') {
      const room = this.manager.joinRoom(data.roomId.toUpperCase(), this.socket.id, data.playerName || '匿名玩家');
      if (!room) { this.socket.emit('error', { message: '房间不存在或已满' }); return; }
      if (this.currentRoomId !== room.roomId) this.release();
      this.currentRoomId = room.roomId;
      this.socket.join(room.roomId);
      this.manager.broadcast(room.roomId);
    } else {
      if (!this.currentRoomId) { this.error('请先加入房间'); return; }
      const id = this.currentRoomId;
      let result: unknown;
      switch (event) {
        case 'fillBots': result = this.manager.fillBots(id, data.count, this.socket.id); break;
        case 'removeBot': result = this.manager.removeBot(id, data.playerId, this.socket.id); break;
        case 'selectCharacter': result = this.manager.selectCharacter(id, this.socket.id, data.characterId); break;
        case 'setReady': result = this.manager.setReady(id, this.socket.id, data.ready); break;
        case 'startGame': result = this.manager.startGame(id, this.socket.id); break;
        case 'restart': result = this.manager.restart(id, this.socket.id); break;
        case 'action': {
          const actionResult = this.manager.handleAction(id, this.socket.id, data.action as ActionType, data.params || {});
          if (!actionResult.ok) this.error(actionResult.error);
          return;
        }
        default: this.error(); return;
      }
      if (!result) this.error();
      else this.manager.broadcast(id);
    }
  }
}
