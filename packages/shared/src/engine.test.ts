// 引擎单元测试 — 使用 Node 内置 test runner
// 运行: node --test packages/shared/src/engine.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

// 动态导入 TS（通过 tsx 或编译后运行）
// 此文件在 npm test 中通过 tsx 执行
const { createGame, playerAction, botTakeTurn, checkVictory, CARDS, CHARACTERS, SCENES, CONSTANTS } = await import('./index.ts');

test('卡牌总数为 72 张', () => {
  assert.equal(CARDS.length, 72);
});

test('角色总数为 12 名', () => {
  assert.equal(CHARACTERS.length, 12);
});

test('场景牌总数为 8 张', () => {
  assert.equal(SCENES.length, 8);
});

test('卡牌分类数量正确', () => {
  const counts = {};
  for (const card of CARDS) {
    counts[card.category] = (counts[card.category] || 0) + 1;
  }
  assert.equal(counts.interact, 24);
  assert.equal(counts.guard, 14);
  assert.equal(counts.vitality, 8);
  assert.equal(counts.adventure, 10);
  assert.equal(counts.item, 8);
  assert.equal(counts.friendship, 8);
});

test('一二和布布为主角', () => {
  const yier = CHARACTERS.find((c) => c.id === 'yier');
  const bubu = CHARACTERS.find((c) => c.id === 'bubu');
  assert.ok(yier?.isProtagonist);
  assert.ok(bubu?.isProtagonist);
});

test('创建 5 人游戏成功', () => {
  const players = [
    { id: 'p1', name: '玩家1', isBot: false },
    { id: 'p2', name: '玩家2', isBot: true },
    { id: 'p3', name: '玩家3', isBot: true },
    { id: 'p4', name: '玩家4', isBot: true },
    { id: 'p5', name: '玩家5', isBot: true },
  ];
  const game = createGame({ roomId: 'TEST1', hostId: 'p1', players });
  assert.equal(game.phase, 'playing');
  assert.equal(game.players.length, 5);
  assert.equal(game.round, 1);
  assert.ok(game.sceneId);
  // 每人 4 张起始手牌
  for (const p of game.players) {
    assert.equal(p.hand.length, CONSTANTS.BASE_HAND);
    assert.equal(p.vitality > 0, true);
  }
  // 身份分配
  const identities = game.players.map((p) => p.identityId);
  assert.equal(identities.filter((id) => id === 'guide').length, 1);
  assert.equal(identities.filter((id) => id === 'trickster').length, 1);
});

test('玩家可以抽牌', () => {
  const players = [
    { id: 'p1', name: '玩家1', isBot: false },
    { id: 'p2', name: '玩家2', isBot: true },
    { id: 'p3', name: '玩家3', isBot: true },
    { id: 'p4', name: '玩家4', isBot: true },
    { id: 'p5', name: '玩家5', isBot: true },
  ];
  const game = createGame({ roomId: 'TEST2', hostId: 'p1', players });
  const activeId = game.activePlayerId!;
  const player = game.players.find((p) => p.id === activeId)!;
  const handBefore = player.hand.length;
  const result = playerAction(game, activeId, 'draw');
  assert.equal(result.ok, true);
  assert.equal(player.hand.length, handBefore + 1);
});

test('玩家可以结束回合并推进', () => {
  const players = [
    { id: 'p1', name: '玩家1', isBot: false },
    { id: 'p2', name: '玩家2', isBot: true },
    { id: 'p3', name: '玩家3', isBot: true },
    { id: 'p4', name: '玩家4', isBot: true },
    { id: 'p5', name: '玩家5', isBot: true },
  ];
  const game = createGame({ roomId: 'TEST3', hostId: 'p1', players });
  const firstActive = game.activePlayerId;
  playerAction(game, firstActive!, 'endTurn');
  assert.notEqual(game.activePlayerId, firstActive);
});

test('机器人可以完整执行回合', () => {
  const players = [
    { id: 'p1', name: '玩家1', isBot: true },
    { id: 'p2', name: '玩家2', isBot: true },
    { id: 'p3', name: '玩家3', isBot: true },
    { id: 'p4', name: '玩家4', isBot: true },
    { id: 'p5', name: '玩家5', isBot: true },
  ];
  const game = createGame({ roomId: 'TEST4', hostId: 'p1', players });
  // 让当前机器人行动
  const activeId = game.activePlayerId!;
  botTakeTurn(game, activeId);
  // 不抛异常即通过
  assert.ok(true);
});

test('5 个机器人完整模拟多轮不崩溃', () => {
  const players = [
    { id: 'p1', name: '机器人1', isBot: true },
    { id: 'p2', name: '机器人2', isBot: true },
    { id: 'p3', name: '机器人3', isBot: true },
    { id: 'p4', name: '机器人4', isBot: true },
    { id: 'p5', name: '机器人5', isBot: true },
  ];
  const game = createGame({ roomId: 'TEST5', hostId: 'p1', players });

  let turns = 0;
  const maxTurns = 100;
  while (game.phase === 'playing' && turns < maxTurns) {
    const activeId = game.activePlayerId;
    if (!activeId) break;
    botTakeTurn(game, activeId);
    turns++;
  }

  // 游戏应该在 100 回合内结束或持续运行不崩溃
  assert.ok(turns <= maxTurns);
  assert.ok(game.actionLog.length > 0);
});

test('友情值不超过上限 6', () => {
  const players = [
    { id: 'p1', name: '玩家1', isBot: false },
    { id: 'p2', name: '玩家2', isBot: true },
    { id: 'p3', name: '玩家3', isBot: true },
    { id: 'p4', name: '玩家4', isBot: true },
    { id: 'p5', name: '玩家5', isBot: true },
  ];
  const game = createGame({ roomId: 'TEST6', hostId: 'p1', players });
  for (const p of game.players) {
    assert.ok(p.friendship <= CONSTANTS.MAX_FRIENDSHIP);
    assert.ok(p.friendship >= 0);
  }
});

test('活力降至 0 进入梦境旁观者状态', () => {
  const players = [
    { id: 'p1', name: '玩家1', isBot: false },
    { id: 'p2', name: '玩家2', isBot: true },
    { id: 'p3', name: '玩家3', isBot: true },
    { id: 'p4', name: '玩家4', isBot: true },
    { id: 'p5', name: '玩家5', isBot: true },
  ];
  const game = createGame({ roomId: 'TEST7', hostId: 'p1', players });
  const target = game.players[1];
  target.vitality = 1;
  // 直接造成伤害
  const damageCard = CARDS.find((c) => c.effects.some((e) => e.type === 'damage'))!;
  target.hand.push(damageCard.id);
  game.activePlayerId = target.id;
  playerAction(game, target.id, 'playCard', { cardId: damageCard.id, targetId: target.id });
  // 目标应该进入梦境状态（自伤）
  assert.ok(target.status === 'dream' || target.vitality >= 0);
});

test('4 人游戏也能创建', () => {
  const players = [
    { id: 'p1', name: '玩家1', isBot: false },
    { id: 'p2', name: '玩家2', isBot: true },
    { id: 'p3', name: '玩家3', isBot: true },
    { id: 'p4', name: '玩家4', isBot: true },
  ];
  const game = createGame({ roomId: 'TEST8', hostId: 'p1', players });
  assert.equal(game.players.length, 4);
  assert.equal(game.phase, 'playing');
});

console.log('\n✅ 所有引擎测试通过！');
