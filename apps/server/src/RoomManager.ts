import type { RoomState, PlayerState, ClientEvent } from '@yierbubu/shared';
import {
  createGame, playerAction, botTakeTurn, getPublicView,
  type ActionType, type ActionParams,
} from '@yierbubu/shared';
import type { Server } from 'socket.io';

// ============================================================
// 房间管理器 — 管理所有房间的生命周期与游戏状态
// ============================================================

const BOT_NAMES = ['小糖', '云朵', '星星', '月亮', '彩虹', '布丁', '棉花', '泡泡'];

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private io: Server;
  private botTimers = new Map<string, NodeJS.Timeout>();

  constructor(io: Server) {
    this.io = io;
  }

  createRoom(hostId: string, hostName: string): RoomState {
    const roomId = this.generateRoomId();
    const state: RoomState = {
      roomId,
      phase: 'lobby',
      hostId,
      players: [{
        id: hostId, name: hostName, isBot: false, characterId: null, identityId: null,
        vitality: 4, maxVitality: 4, friendship: 0, hand: [], handLimit: 6,
        status: 'active', bonds: [], shield: 0, usedSkillThisTurn: false,
        usedSkillThisGame: false, hasActedThisTurn: false, hasDrawnThisTurn: false,
        protectedBy: null, hiddenAction: false, lastPlayedCard: null,
        wishFragments: 0, personalGoalProgress: 0, dreamHelpUsed: false, ready: false,
      }],
      sceneId: null, sceneDeck: [], round: 0, maxRounds: 8, activePlayerId: null,
      turnOrder: [], deck: [], discard: [], wishFragments: 0, wishProgress: 0,
      actionLog: [], bannedCategory: null, lastTargetPlayerId: null,
      giftBonusUsed: false, starStageSkillFree: {}, meteorClaimed: false,
      settings: { mode: 'standard', playerCount: 5 }, logCounter: 0,
    };
    this.rooms.set(roomId, state);
    return state;
  }

  joinRoom(roomId: string, playerId: string, playerName: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'lobby') return null;
    if (room.players.length >= 8) return null;
    if (room.players.find((p) => p.id === playerId)) return room;
    room.players.push({
      id: playerId, name: playerName, isBot: false, characterId: null, identityId: null,
      vitality: 4, maxVitality: 4, friendship: 0, hand: [], handLimit: 6,
      status: 'active', bonds: [], shield: 0, usedSkillThisTurn: false,
      usedSkillThisGame: false, hasActedThisTurn: false, hasDrawnThisTurn: false,
      protectedBy: null, hiddenAction: false, lastPlayedCard: null,
      wishFragments: 0, personalGoalProgress: 0, dreamHelpUsed: false, ready: false,
    });
    return room;
  }

  leaveRoom(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      this.stopBotTimer(roomId);
    } else if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }
  }

  fillBots(roomId: string, count: number): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'lobby') return null;
    const existingBots = room.players.filter((p) => p.isBot).length;
    for (let i = 0; i < count && room.players.length < 8; i++) {
      const botId = `bot_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
      const botName = BOT_NAMES[(existingBots + i) % BOT_NAMES.length] + (existingBots + i > 3 ? (existingBots + i) : '');
      room.players.push({
        id: botId, name: botName, isBot: true, characterId: null, identityId: null,
        vitality: 4, maxVitality: 4, friendship: 0, hand: [], handLimit: 6,
        status: 'active', bonds: [], shield: 0, usedSkillThisTurn: false,
        usedSkillThisGame: false, hasActedThisTurn: false, hasDrawnThisTurn: false,
        protectedBy: null, hiddenAction: false, lastPlayedCard: null,
        wishFragments: 0, personalGoalProgress: 0, dreamHelpUsed: false, ready: true,
      });
    }
    return room;
  }

  removeBot(roomId: string, botId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'lobby') return null;
    room.players = room.players.filter((p) => p.id !== botId || !p.isBot);
    return room;
  }

  setReady(roomId: string, playerId: string, ready: boolean): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const p = room.players.find((pl) => pl.id === playerId);
    if (p) p.ready = ready;
    return room;
  }

  startGame(roomId: string, hostId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'lobby') return null;
    if (room.hostId !== hostId) return null;
    if (room.players.length < 4) return null;

    const game = createGame({
      roomId,
      hostId,
      players: room.players.map((p) => ({
        id: p.id, name: p.name, isBot: p.isBot, characterId: p.characterId || undefined,
      })),
    });
    this.rooms.set(roomId, game);
    this.broadcast(roomId);
    this.startBotTimer(roomId);
    return game;
  }

  handleAction(roomId: string, playerId: string, action: ActionType, params: ActionParams) {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: '房间不存在' };
    const result = playerAction(room, playerId, action, params);
    if (result.ok) {
      this.broadcast(roomId);
      // 如果行动后轮到机器人，调度机器人
      if (room.activePlayerId) {
        const ap = room.players.find((p) => p.id === room.activePlayerId);
        if (ap?.isBot) {
          this.scheduleBot(roomId);
        }
      }
    }
    return result;
  }

  restart(roomId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const players = room.players.map((p) => ({
      id: p.id, name: p.name, isBot: p.isBot, characterId: p.characterId || undefined,
    }));
    const game = createGame({ roomId, hostId: room.hostId, players });
    this.rooms.set(roomId, game);
    this.broadcast(roomId);
    this.startBotTimer(roomId);
    return game;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  broadcast(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    for (const player of room.players) {
      if (player.isBot) continue;
      const view = getPublicView(room, player.id);
      this.io.to(player.id).emit('roomState', {
        public: view,
        private: {
          playerId: player.id,
          identityId: player.identityId,
          hand: player.hand,
        },
      });
    }
  }

  private scheduleBot(roomId: string) {
    // 清除已有定时器
    const existing = this.botTimers.get(roomId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      const room = this.rooms.get(roomId);
      if (!room || room.phase !== 'playing') return;
      const ap = room.players.find((p) => p.id === room.activePlayerId);
      if (ap?.isBot) {
        botTakeTurn(room, ap.id);
        this.broadcast(roomId);
        // 继续调度下一个机器人
        const next = room.players.find((p) => p.id === room.activePlayerId);
        if (next?.isBot && room.phase === 'playing') {
          this.scheduleBot(roomId);
        }
      }
    }, 1200 + Math.random() * 800);

    this.botTimers.set(roomId, timer);
  }

  private startBotTimer(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const ap = room.players.find((p) => p.id === room.activePlayerId);
    if (ap?.isBot) {
      this.scheduleBot(roomId);
    }
  }

  private stopBotTimer(roomId: string) {
    const timer = this.botTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.botTimers.delete(roomId);
    }
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    do {
      id = '';
      for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
    } while (this.rooms.has(id));
    return id;
  }
}
