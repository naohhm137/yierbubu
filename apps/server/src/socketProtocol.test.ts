import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'socket.io';
import { RoomManager } from './RoomManager.js';
import { SocketSession } from './socketProtocol.js';

function setup() {
  const manager = new RoomManager(new Server());
  const events: Array<[string, any]> = [];
  const memberships = new Set<string>();
  const socket = { id: 'human', emit: (event: string, data: any) => events.push([event, data]), join: (id: string) => memberships.add(id), leave: (id: string) => memberships.delete(id) };
  return { manager, events, memberships, session: new SocketSession(manager, socket) };
}

test('畸形数据包返回错误且不抛异常', () => {
  const { session, events } = setup();
  for (const [event, packet] of [['joinRoom', {}], ['joinRoom', { roomId: 42 }], ['createRoom', undefined], ['action', undefined], ['setReady', null], ['fillBots', { count: 0 }], ['removeBot', {}], ['selectCharacter', {}], ['action', { action: 'playCard', params: { targetId: 3 } }]] as const) {
    const before = events.length;
    assert.doesNotThrow(() => session.receive(event, packet));
    assert.equal(events.length, before + 1);
    assert.equal(events.at(-1)?.[0], 'error');
  }
});

test('加入有效新房间才释放旧座位和socket房间，失败保留旧房间', () => {
  const { session, manager, memberships } = setup();
  session.receive('createRoom', { playerName: '人类' });
  const first = [...memberships][0];
  session.receive('joinRoom', { roomId: 'NOPE' });
  assert.ok(manager.getRoom(first)?.players.some((p) => p.id === 'human'));
  assert.deepEqual([...memberships], [first]);
  const target = manager.createRoom('other', '其他人');
  session.receive('joinRoom', { roomId: target.roomId });
  assert.equal(manager.getRoom(first), undefined);
  assert.deepEqual([...memberships], [target.roomId]);
  session.receive('createRoom', {});
  assert.ok(!target.players.some((p) => p.id === 'human'));
  assert.equal(memberships.size, 1);
  assert.ok(!memberships.has(target.roomId));
});

test('socket fillBots count0拒绝而合法count成功', () => {
  const { session, manager, memberships, events } = setup();
  session.receive('createRoom', {});
  const room = manager.getRoom([...memberships][0])!;
  session.receive('fillBots', { count: 0 });
  assert.equal(room.players.length, 1);
  assert.equal(events.at(-1)?.[0], 'error');
  session.receive('fillBots', { count: 2 });
  assert.equal(room.players.length, 3);
});
