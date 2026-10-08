import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'socket.io';
import { setSeed } from '@yierbubu/shared';
import { RoomManager } from './RoomManager.js';

function setup(t: any) {
  const manager = new RoomManager(new Server());
  t.after(() => { for (const timer of (manager as any).botTimers.values()) clearTimeout(timer); });
  const lobby = manager.createRoom('host', '房主');
  manager.joinRoom(lobby.roomId, 'guest', '来宾');
  return { manager, lobby };
}

test('非房主不能添加或删除机器人', (t) => {
  const { manager, lobby } = setup(t);
  assert.equal(manager.fillBots(lobby.roomId, 2, 'guest'), null);
  assert.equal(manager.fillBots(lobby.roomId, 2), null);
  assert.equal(lobby.players.length, 2);
  manager.fillBots(lobby.roomId, 2, 'host');
  const bot = lobby.players.find((p) => p.isBot)!;
  assert.equal(manager.removeBot(lobby.roomId, bot.id, 'guest'), null);
  assert.equal(lobby.players.length, 4);
  assert.ok(manager.removeBot(lobby.roomId, bot.id, 'host'));
  assert.equal(lobby.players.length, 3);
});

test('非房主不能重开且大厅人数不足不能重开', (t) => {
  const { manager, lobby } = setup(t);
  assert.equal(manager.restart(lobby.roomId, 'guest'), null);
  assert.equal(manager.restart(lobby.roomId, 'host'), null);
  manager.fillBots(lobby.roomId, 2, 'host');
  const game = manager.startGame(lobby.roomId, 'host')!;
  assert.equal(manager.restart(lobby.roomId, 'guest'), null);
  assert.equal(manager.getRoom(lobby.roomId), game);
  assert.ok(manager.restart(lobby.roomId, 'host'));
});

test('角色选择拒绝未知、重复角色和游戏中更改', (t) => {
  const { manager, lobby } = setup(t);
  assert.equal(manager.selectCharacter(lobby.roomId, 'host', 'unknown'), null);
  assert.ok(manager.selectCharacter(lobby.roomId, 'host', 'yier'));
  assert.equal(manager.selectCharacter(lobby.roomId, 'guest', 'yier'), null);
  assert.equal(lobby.players[1].characterId, null);
  manager.fillBots(lobby.roomId, 2, 'host');
  manager.startGame(lobby.roomId, 'host');
  assert.equal(manager.selectCharacter(lobby.roomId, 'host', 'bubu'), null);
});

test('当前玩家离开保留手牌并由真实定时器推进，房主转交在线人类', async (t) => {
  const { manager, lobby } = setup(t);
  manager.fillBots(lobby.roomId, 2, 'host');
  setSeed(1);
  const game = manager.startGame(lobby.roomId, 'host')!;
  game.activePlayerId = 'host';
  const host = game.players.find((p) => p.id === 'host')!;
  const hand = [...host.hand];
  manager.leaveRoom(lobby.roomId, 'host');
  assert.equal(game.players.length, 4);
  assert.equal(host.isBot, true);
  assert.deepEqual(host.hand, hand);
  assert.equal(game.hostId, 'guest');
  assert.ok((manager as any).botTimers.has(lobby.roomId));
  await new Promise((resolve) => setTimeout(resolve, 2100));
  assert.ok(game.phase === 'finished' || game.activePlayerId !== 'host');
  const cards = [...game.deck, ...game.discard, ...game.players.flatMap((p) => p.hand)];
  assert.equal(cards.length, 72);
  assert.equal(new Set(cards).size, 72);
});

test('大厅最后一名人类离开后清理机器人房间', (t) => {
  const { manager, lobby } = setup(t);
  manager.fillBots(lobby.roomId, 2, 'host');
  manager.leaveRoom(lobby.roomId, 'guest');
  manager.leaveRoom(lobby.roomId, 'host');
  assert.equal(manager.getRoom(lobby.roomId), undefined);
});
