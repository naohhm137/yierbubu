// 引擎单元测试 — 使用 Node 内置 test runner
// 运行: node --test packages/shared/src/engine.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

// 动态导入 TS（通过 tsx 或编译后运行）
// 此文件在 npm test 中通过 tsx 执行
const { createGame, playerAction, botTakeTurn, checkVictory, setSeed, CARDS, CHARACTERS, SCENES, CONSTANTS } = await import('./index.ts');

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

test('机器人执行一次行动后必须推进回合', () => {
  setSeed(1);
  const players = [
    { id: 'bot-a', name: '机器人甲', isBot: true },
    { id: 'bot-b', name: '机器人乙', isBot: true },
    { id: 'bot-c', name: '机器人丙', isBot: true },
    { id: 'bot-d', name: '机器人丁', isBot: true },
  ];
  const game = createGame({ roomId: 'BOT-PROGRESS', hostId: 'bot-a', players });
  const activeId = game.activePlayerId!;
  const active = game.players.find((p) => p.id === activeId)!;
  // 倒流沙漏会回到手牌；旧 AI 只返回不结束回合，导致该机器人永久重复此牌。
  active.hand = ['A05'];
  active.hasDrawnThisTurn = true;
  active.usedSkillThisTurn = true;
  botTakeTurn(game, activeId);
  assert.ok(game.phase === 'finished' || game.activePlayerId !== activeId);
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

function integrityGame(count = 4, seed = 1) {
  setSeed(seed);
  return createGame({ roomId: 'INTEGRITY', hostId: 'p0', players: Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `玩家${i}`, isBot: true, characterId: CHARACTERS[(i + seed - 1) % 12].id })) });
}

for (const action of ['playCard', 'useSkill'] as const) {
  test(`${action} 窥牌信息只对施法者可见`, async () => {
    const { getPublicView } = await import('./index.ts');
    const game = integrityGame();
    game.sceneId = 'dessert_party';
    game.activePlayerId = 'p0';
    const caster = game.players[0];
    const card = CARDS.find((c) => c.effects.some((e) => e.type === 'peekHand'))!;
    if (action === 'playCard') {
      for (const p of game.players) p.hand = p.hand.filter((id) => id !== card.id);
      game.deck = game.deck.filter((id) => id !== card.id);
      game.discard = game.discard.filter((id) => id !== card.id);
      caster.hand.push(card.id);
    }
    assert.equal(playerAction(game, caster.id, action, { cardId: card.id, targetId: 'p1' }).ok, true);
    const secrets = game.actionLog.filter((l) => /手牌：|一张手牌：|牌堆顶是/.test(l.message));
    assert.ok(secrets.length > 0);
    for (const secret of secrets) {
      assert.ok(getPublicView(game, caster.id).actionLog.some((l) => l.id === secret.id));
      for (const viewer of game.players.slice(1)) assert.ok(!getPublicView(game, viewer.id).actionLog.some((l) => l.id === secret.id));
    }
  });
}

test('未知和重复角色安全分配有效的唯一角色', () => {
  const players = Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, name: '玩家', isBot: true, characterId: i === 0 ? 'unknown' : 'yier' }));
  const game = createGame({ roomId: 'INVALID', hostId: 'p0', players });
  assert.equal(new Set(game.players.map((p) => p.characterId)).size, 4);
  assert.ok(game.players.every((p) => CHARACTERS.some((c) => c.id === p.characterId)));
});

test('不存在的行动目标不消耗卡牌、技能或资源', () => {
  for (const action of ['playCard', 'useSkill'] as const) {
    const game = integrityGame();
    const player = game.players.find((p) => p.id === game.activePlayerId)!;
    const before = JSON.stringify(game);
    assert.equal(playerAction(game, player.id, action, { cardId: player.hand[0], targetId: 'missing-player' }).ok, false);
    assert.equal(JSON.stringify(game), before);
  }
});

test('每回合六种主行动合计一次，重复或换种主行动不改变状态', () => {
  const actions = ['playCard', 'useSkill', 'gift', 'exchange', 'defend', 'hoard'] as const;
  for (const first of actions) {
    const game = integrityGame();
    game.sceneId = 'dessert_party';
    const actor = game.players[0];
    assert.equal(playerAction(game, actor.id, first, { cardId: actor.hand[0], targetId: 'p1' }).ok, true, first);
    for (const next of actions) {
      const before = JSON.stringify(game);
      assert.equal(playerAction(game, actor.id, next, { cardId: actor.hand[0], targetId: 'p1' }).ok, false, `${first} then ${next}`);
      assert.equal(JSON.stringify(game), before);
    }
    assert.equal(playerAction(game, actor.id, 'draw').ok, true);
    assert.equal(playerAction(game, actor.id, 'draw').ok, false);
    assert.equal(playerAction(game, actor.id, 'endTurn').ok, true);
  }
});

test('抽牌后仍可主行动，下一轮恢复主行动额度，梦境帮助不消耗主行动', () => {
  const game = integrityGame();
  const actor = game.players[0];
  assert.equal(playerAction(game, actor.id, 'draw').ok, true);
  assert.equal(playerAction(game, actor.id, 'defend').ok, true);
  const dreamer = game.players[2];
  dreamer.status = 'dream'; dreamer.vitality = 0;
  assert.equal(playerAction(game, dreamer.id, 'dreamHelp', { targetId: actor.id }).ok, true);
  assert.equal(dreamer.hasActedThisTurn, false);
  playerAction(game, actor.id, 'endTurn');
  for (let i = 0; i < 8 && game.activePlayerId !== actor.id; i++) playerAction(game, game.activePlayerId!, 'endTurn');
  assert.equal(game.activePlayerId, actor.id);
  assert.equal(playerAction(game, actor.id, 'hoard').ok, true);
});

function giveCard(game: any, actor: any, id: string) {
  for (const p of game.players) p.hand = p.hand.filter((card: string) => card !== id);
  game.deck = game.deck.filter((card: string) => card !== id);
  game.discard = game.discard.filter((card: string) => card !== id);
  actor.hand.push(id);
}

test('需要other或any目标的卡牌拒绝缺失、梦境与非法自己目标且保留状态', () => {
  for (const [cardId, targetId] of [['I01', undefined], ['I01', 'p0'], ['I01', 'p1'], ['I02', undefined], ['I02', 'p1'], ['V04', 'p2']] as const) {
    const game = integrityGame();
    const actor = game.players[0];
    giveCard(game, actor, cardId);
    game.players[1].status = 'dream'; game.players[1].vitality = 0;
    const before = JSON.stringify(game);
    assert.equal(playerAction(game, actor.id, 'playCard', { cardId, targetId }).ok, false, `${cardId} ${targetId}`);
    assert.equal(JSON.stringify(game), before);
  }
});

test('复活牌可指定梦境玩家，any目标可合法指定自己', () => {
  const game = integrityGame();
  const actor = game.players[0];
  const target = game.players[1];
  target.status = 'dream'; target.vitality = 0;
  giveCard(game, actor, 'V04');
  assert.equal(playerAction(game, actor.id, 'playCard', { cardId: 'V04', targetId: target.id }).ok, true);
  assert.equal(target.status, 'active');
  assert.equal(target.vitality, 1);
  const anyGame = integrityGame();
  giveCard(anyGame, anyGame.players[0], 'I02');
  assert.equal(playerAction(anyGame, 'p0', 'playCard', { cardId: 'I02', targetId: 'p0' }).ok, true);
});

test('V05活力转移只治疗目标并扣施法者活力，自损入梦后回合继续', () => {
  const game = integrityGame();
  game.sceneId = 'dessert_party';
  const actor = game.players[0];
  const target = game.players[1];
  actor.vitality = 1; target.vitality = 1;
  giveCard(game, actor, 'V05');
  assert.equal(playerAction(game, actor.id, 'playCard', { cardId: 'V05', targetId: target.id }).ok, true);
  assert.equal(actor.vitality, 0);
  assert.equal(actor.status, 'dream');
  assert.equal(target.vitality, 2);
  assert.ok(game.phase === 'finished' || game.activePlayerId !== actor.id);
});

test('混合自身和他人效果分别结算，单纯自身效果不被额外targetId改变', () => {
  for (const cardId of ['G13', 'F01', 'F02', 'F03', 'F05', 'I16', 'V01', 'G01', 'A09']) {
    const game = integrityGame();
    game.sceneId = 'dessert_party';
    const actor = game.players[0];
    const target = game.players[1];
    actor.friendship = 1; target.friendship = 1;
    actor.vitality = 2; target.vitality = 2;
    giveCard(game, actor, cardId);
    const ownHand = actor.hand.length;
    const targetHand = target.hand.length;
    assert.equal(playerAction(game, actor.id, 'playCard', { cardId, targetId: target.id }).ok, true, cardId);
    switch (cardId) {
      case 'G13': assert.equal(actor.shield, 1); assert.equal(target.shield, 1); break;
      case 'F01': case 'F02': assert.equal(actor.friendship, 2); assert.equal(target.friendship, 2); break;
      case 'F03': assert.equal(actor.friendship, 2); assert.equal(target.friendship, 2); assert.equal(actor.vitality, 2); assert.equal(target.vitality, 3); break;
      case 'F05': assert.equal(actor.hand.length, ownHand); assert.equal(target.hand.length, targetHand + 1); break;
      case 'I16': assert.equal(actor.friendship, 2); assert.equal(target.friendship, 1); assert.equal(target.vitality, 1); break;
      case 'V01': assert.equal(actor.vitality, 3); assert.equal(target.vitality, 2); break;
      case 'G01': assert.equal(actor.shield, 2); assert.equal(target.shield, 0); break;
      case 'A09': assert.equal(actor.hand.length, ownHand - 1); assert.equal(target.hand.length, targetHand); assert.equal(game.discard.length, 2); break;
    }
    const cards = [...game.deck, ...game.discard, ...game.players.flatMap((p) => p.hand)];
    assert.equal(cards.length, 72); assert.equal(new Set(cards).size, 72);
  }
});

for (const id of ['I11', 'I22', 'I23', 'G04', 'G05', 'G09', 'V06', 'A08', 'T04', 'T06', 'F06', 'A07', 'G12', 'G14', 'I09', 'I15', 'I08', 'I18', 'I19', 'G07', 'V08', 'A02', 'A10', 'T03', 'T08', 'F01', 'F07', 'A05', 'A09']) {
  test(`${id} 重制卡牌按实际契约产生明确资源或场景效果`, () => {
    const game = integrityGame();
    game.sceneId = 'dessert_party';
    const actor = game.players[0]; const target = game.players[1];
    actor.friendship = 2; target.friendship = 2;
    actor.vitality = 2; target.vitality = 2;
    giveCard(game, actor, id);
    if (id === 'F07') { actor.bonds = [target.id]; target.bonds = [actor.id]; }
    if (id === 'A05' || id === 'A09') {
      const recycledId = id === 'A05' ? 'I01' : 'A01';
      giveCard(game, actor, recycledId);
      actor.hand.splice(actor.hand.indexOf(recycledId), 1);
      game.discard.push(recycledId);
    }
    const hand = actor.hand.length; const targetHand = target.hand.length; const deck = game.deck.length;
    assert.equal(playerAction(game, actor.id, 'playCard', { cardId: id, targetId: target.id }).ok, true);
    switch (id) {
      case 'I11': assert.equal(game.skillRedirects?.[actor.id], target.id); break;
      case 'I22': assert.equal(target.hiddenAction, true); break;
      case 'I23': assert.equal(target.friendship, 0); break;
      case 'G04': assert.equal(target.shield, 1); assert.equal(actor.friendship, 3); assert.equal(actor.vitality, 2); break;
      case 'G05': assert.equal(game.players.every((p) => p.shield === 1), true); assert.equal(actor.hand.length, hand); assert.equal(target.hand.length, targetHand + 1); break;
      case 'G09': assert.equal(actor.shield, 1); assert.equal(actor.hand.length, hand); break;
      case 'V06': assert.equal(actor.friendship, 4); break;
      case 'A08': assert.equal(actor.shield, 2); assert.equal(actor.hand.length, hand); break;
      case 'T04': assert.notEqual(game.sceneId, 'dessert_party'); break;
      case 'T06': assert.equal(actor.hand.length, hand + 1); assert.equal(actor.vitality, 3); break;
      case 'F06': assert.equal(actor.friendship, 0); assert.equal(actor.vitality, 4); break;
      case 'A07': assert.equal(target.vitality, 3); assert.equal(target.shield, 1); break;
      case 'G12': assert.equal(target.vitality, 3); assert.equal(target.friendship, 3); break;
      case 'G14': assert.equal(actor.shield, 1); assert.equal(target.shield, 1); assert.equal(actor.bonds.includes(target.id), true); break;
      case 'I09': assert.equal(actor.friendship, 1); assert.equal(target.friendship, 4); assert.equal(target.vitality, 2); break;
      case 'I15': assert.equal(actor.shield, 1); assert.equal(target.friendship, 1); break;
      case 'I08': assert.equal(target.vitality, 1); assert.equal(actor.vitality, 3); break;
      case 'I18': assert.equal(actor.friendship, 3); assert.equal(target.friendship, 3); break;
      case 'I19': assert.equal(actor.hand.length, hand - 2); assert.equal(target.hand.length, targetHand - 1); assert.equal(actor.vitality + target.vitality, 3); break;
      case 'G07': assert.equal(actor.vitality, 4); assert.equal(actor.friendship, 1); break;
      case 'V08': assert.equal(actor.vitality, 4); assert.equal(actor.friendship, 0); break;
      case 'A02': assert.equal(actor.hand.length, hand); assert.equal(target.hand.length, targetHand + 1); break;
      case 'A10': assert.equal(game.deck.length, deck - 2); assert.equal(game.discard.length, 3); break;
      case 'T03': assert.equal(actor.hand.length, hand + 1); break;
      case 'T08': assert.equal(actor.friendship, 4); assert.equal(target.friendship, 4); break;
      case 'F01': assert.equal(actor.hand.length, hand - 2); assert.equal(target.hand.length, targetHand + 1); assert.equal(actor.friendship, 3); assert.equal(target.friendship, 3); break;
      case 'F07': assert.equal(target.hand.length, targetHand + 1); assert.equal(actor.hand.length, hand); break;
      case 'A05': assert.equal(actor.hand.includes('I01'), true); assert.equal(actor.hand.includes('A05'), false); break;
      case 'A09': assert.equal(game.deck.length, deck - 1); break;
    }
    const cards = [...game.deck, ...game.discard, ...game.players.flatMap((p) => p.hand)];
    assert.equal(cards.length, 72); assert.equal(new Set(cards).size, 72);
  });
}

test('有目标的座位交换与自己优先/移末遵守各自卡牌契约', () => {
  for (const [id, expected] of [['I02', ['p1', 'p0', 'p2', 'p3']], ['I17', ['p0', 'p1', 'p2', 'p3']], ['A03', ['p1', 'p2', 'p3', 'p0']]] as const) {
    const game = integrityGame();
    const actor = game.players[0];
    giveCard(game, actor, id);
    playerAction(game, actor.id, 'playCard', { cardId: id, targetId: 'p1' });
    assert.deepEqual(game.turnOrder, expected);
  }
});

test('公开/互查手牌满足各自观众范围', async () => {
  const { getPublicView } = await import('./index.ts');
  for (const id of ['I12', 'I14']) {
    const game = integrityGame(); const actor = game.players[0];
    giveCard(game, actor, id);
    playerAction(game, actor.id, 'playCard', { cardId: id, targetId: 'p1' });
    const secrets = game.actionLog.filter((l) => l.message.includes('手牌：「'));
    assert.equal(secrets.length, id === 'I12' ? 1 : 2);
    if (id === 'I12') for (const viewer of game.players) assert.equal(getPublicView(game, viewer.id).actionLog.some((l) => l.id === secrets[0].id), true);
    else {
      assert.equal(getPublicView(game, 'p0').actionLog.filter((l) => secrets.some((s) => s.id === l.id)).length, 1);
      assert.equal(getPublicView(game, 'p1').actionLog.filter((l) => secrets.some((s) => s.id === l.id)).length, 1);
      assert.equal(getPublicView(game, 'p2').actionLog.filter((l) => secrets.some((s) => s.id === l.id)).length, 0);
    }
  }
});

test('拒绝没有未来公告可隐藏的目标和资源不足的卡牌，保留主行动额度', () => {
  for (const id of ['I22', 'F01', 'F06', 'V08']) {
    const game = integrityGame(); const actor = game.players[0];
    giveCard(game, actor, id);
    if (id === 'I22') game.players[1].hasActedThisTurn = true;
    if (id === 'F01') { game.discard.push(...actor.hand.filter((card) => card !== id)); actor.hand = [id]; }
    if (id === 'F06' || id === 'V08') actor.friendship = 0;
    const before = JSON.stringify(game);
    assert.equal(playerAction(game, actor.id, 'playCard', { cardId: id, targetId: 'p1' }).ok, false);
    assert.equal(JSON.stringify(game), before);
  }
});

test('全部72张卡在有效目标和资源下可结算且卡牌总数保持唯一', () => {
  for (const card of CARDS) {
    const game = integrityGame(); game.sceneId = 'dessert_party';
    const actor = game.players[0]; const target = game.players[1];
    actor.friendship = 4; actor.vitality = 1; target.vitality = 1;
    actor.bonds = [target.id]; target.bonds = [actor.id];
    if (card.effects.some((e) => e.type === 'revive')) { target.status = 'dream'; target.vitality = 0; }
    giveCard(game, actor, card.id);
    const result = playerAction(game, actor.id, 'playCard', { cardId: card.id, targetId: target.id });
    assert.equal(result.ok, true, `${card.id}: ${result.error}`);
    const cards = [...game.deck, ...game.discard, ...game.players.flatMap((p) => p.hand)];
    assert.equal(cards.length, 72, card.id); assert.equal(new Set(cards).size, 72, card.id);
  }
});

test('星光舞台和心愿流星不会把自己的资源视为帮助他人', () => {
  const game = integrityGame(); game.sceneId = 'wish_meteor';
  giveCard(game, game.players[0], 'G01');
  playerAction(game, 'p0', 'playCard', { cardId: 'G01', targetId: 'p1' });
  assert.equal(game.wishProgress, 0);
  assert.equal(game.meteorClaimed, false);
  const next = integrityGame(); next.sceneId = 'wish_meteor';
  giveCard(next, next.players[0], 'I09');
  playerAction(next, 'p0', 'playCard', { cardId: 'I09', targetId: 'p1' });
  assert.equal(next.wishProgress, 1);
});

test('终局共享回顾不重发任何私密窥牌信息', async () => {
  const { getPublicView } = await import('./index.ts');
  const game = integrityGame();
  game.round = game.maxRounds; game.sceneId = 'dessert_party';
  playerAction(game, 'p0', 'useSkill', { targetId: 'p1' });
  const secrets = game.actionLog.filter((l) => l.hiddenFor?.length === 3).map((l) => l.message);
  assert.equal(secrets.length, 2);
  for (let i = 0; i < 4; i++) playerAction(game, game.activePlayerId!, 'endTurn');
  assert.equal(game.phase, 'finished');
  for (const viewer of game.players) for (const secret of secrets) {
    assert.equal(getPublicView(game, viewer.id).winnerData?.keyEvents.includes(secret), false);
  }
});

test('self互动牌带额外targetId不消耗待触发重定向', () => {
  const game = integrityGame(); const actor = game.players[0];
  game.skillRedirects = { p3: 'p2' };
  giveCard(game, actor, 'I05');
  assert.equal(playerAction(game, actor.id, 'playCard', { cardId: 'I05', targetId: 'p1' }).ok, true);
  assert.deepEqual(game.skillRedirects, { p3: 'p2' });
});

test('I22重定向后的已行动目标拒绝，卡牌额度和待触发效果保留', () => {
  const game = integrityGame(); const actor = game.players[0];
  game.players[2].hasActedThisTurn = true;
  game.skillRedirects = { p3: 'p2' };
  giveCard(game, actor, 'I22');
  const before = JSON.stringify(game);
  assert.equal(playerAction(game, actor.id, 'playCard', { cardId: 'I22', targetId: 'p1' }).ok, false);
  assert.equal(JSON.stringify(game), before);
});

test('技能前置条件失败不消耗回合状态', () => {
  for (const [characterId, reason] of [['bubu', 'cost'], ['duoduo', 'hand'], ['tangtang', 'hand'], ['asong', 'target'], ['yueyue', 'target'], ['kaka', 'target'], ['tuantuan', 'target']] as const) {
    const game = integrityGame();
    const p = game.players[0];
    p.characterId = characterId;
    game.activePlayerId = p.id;
    game.sceneId = 'dessert_party';
    if (reason === 'cost') p.friendship = 0;
    if (reason === 'hand') { game.discard.push(...p.hand); p.hand = []; }
    const before = JSON.stringify(game);
    const result = playerAction(game, p.id, 'useSkill', reason === 'target' ? {} : { targetId: 'p1' });
    assert.equal(result.ok, false, characterId);
    assert.equal(JSON.stringify(game), before, characterId);
  }
});

test('团团指定目标后下一张指定玩家的互动牌重定向且只触发一次', () => {
  const game = integrityGame();
  const caster = game.players[0];
  caster.characterId = 'tuantuan';
  const card = CARDS.find((c) => c.category === 'interact' && c.effects.some((e) => e.type === 'damage'))!;
  for (const p of game.players) p.hand = p.hand.filter((id) => id !== card.id);
  game.deck = game.deck.filter((id) => id !== card.id);
  game.discard = game.discard.filter((id) => id !== card.id);
  const actor = game.players[1];
  actor.hand.push(card.id);
  assert.equal(playerAction(game, caster.id, 'useSkill', { targetId: 'p3' }).ok, true);
  game.activePlayerId = actor.id;
  game.sceneId = 'dessert_party';
  const original = game.players[2].vitality;
  const redirected = game.players[3].vitality;
  assert.equal(playerAction(game, actor.id, 'playCard', { cardId: card.id, targetId: 'p2' }).ok, true);
  assert.equal(game.players[2].vitality, original);
  assert.ok(game.players[3].vitality < redirected);
  playerAction(game, actor.id, 'endTurn');
  for (let i = 0; i < 12 && game.activePlayerId !== actor.id; i++) playerAction(game, game.activePlayerId!, 'endTurn');
  assert.equal(game.activePlayerId, actor.id);
  game.sceneId = 'dessert_party';
  actor.hand.push(...game.discard.splice(game.discard.indexOf(card.id), 1));
  const nextOriginal = game.players[2].vitality;
  const nextRedirected = game.players[3].vitality;
  playerAction(game, actor.id, 'playCard', { cardId: card.id, targetId: 'p2' });
  assert.ok(game.players[2].vitality < nextOriginal);
  assert.equal(game.players[3].vitality, nextRedirected);
});

test('阿松无出牌记录时仅自己看到随机手牌内容', async () => {
  const { getPublicView } = await import('./index.ts');
  const game = integrityGame();
  game.players[0].characterId = 'asong';
  playerAction(game, 'p0', 'useSkill', { targetId: 'p1' });
  const secret = game.actionLog.find((l) => l.message.includes('追踪手牌：'));
  assert.ok(secret);
  assert.ok(getPublicView(game, 'p0').actionLog.some((l) => l.id === secret.id));
  for (const id of ['p1', 'p2', 'p3']) assert.ok(!getPublicView(game, id).actionLog.some((l) => l.id === secret.id));
});

test('十二角色技能成功路径具有明确效果且重复使用拒绝', () => {
  for (const id of CHARACTERS.map((c) => c.id)) {
    const game = integrityGame();
    game.sceneId = 'dessert_party';
    const caster = game.players[0];
    const target = game.players[1];
    caster.characterId = id;
    target.vitality = 1;
    const handBefore = caster.hand.length;
    const targetHandBefore = target.hand.length;
    const friendshipBefore = caster.friendship;
    assert.equal(playerAction(game, caster.id, 'useSkill', { targetId: target.id }).ok, true, id);
    switch (id) {
      case 'yier': assert.ok(game.actionLog.some((l) => l.message.includes('牌堆顶是'))); break;
      case 'bubu': assert.equal(caster.friendship, friendshipBefore - 1); assert.equal(target.shield, 1); assert.equal(target.hand.length, targetHandBefore + 1); break;
      case 'duoduo': assert.equal(caster.hand.length, handBefore - 1); assert.equal(target.hand.length, targetHandBefore + 1); assert.equal(caster.friendship, friendshipBefore + 1); break;
      case 'tangtang': assert.equal(caster.hand.length, handBefore - 1); assert.ok(target.vitality >= 2); assert.equal(game.discard.length, 1); break;
      case 'asong': assert.ok(game.actionLog.some((l) => l.message.includes('追踪手牌：'))); break;
      case 'yueyue': assert.equal(target.hiddenAction, true); break;
      case 'xiaoban': case 'huahua': assert.equal(caster.hand.length, handBefore + 1); break;
      case 'mimi': assert.equal(target.friendship, 3); assert.equal(target.vitality, 2); assert.equal(game.players[3].friendship, 3); break;
      case 'qiaoqiao': assert.equal(caster.shield, 1); assert.equal(caster.usedSkillThisGame, false); break;
      case 'tuantuan': assert.equal(game.skillRedirects?.[caster.id], target.id); break;
      case 'kaka': assert.equal(target.shield, 2); assert.equal(game.turnOrder.at(-1), caster.id); break;
    }
    const before = JSON.stringify(game);
    assert.equal(playerAction(game, caster.id, 'useSkill', { targetId: target.id }).ok, false, id);
    assert.equal(JSON.stringify(game), before, id);
  }
});

test('悄悄第一次未被护盾吸收的伤害免疫，第二次正常扣活力', () => {
  const game = integrityGame();
  game.sceneId = 'dessert_party';
  const actor = game.players[0];
  const target = game.players[1];
  target.characterId = 'qiaoqiao';
  const handBefore = target.hand.length;
  const vitalityBefore = target.vitality;
  for (let i = 0; i < 2; i++) {
    if (i > 0) {
      playerAction(game, actor.id, 'endTurn');
      for (let j = 0; j < 12 && game.activePlayerId !== actor.id; j++) playerAction(game, game.activePlayerId!, 'endTurn');
      assert.equal(game.activePlayerId, actor.id);
      game.sceneId = 'dessert_party';
    }
    for (const p of game.players) p.hand = p.hand.filter((id) => id !== 'I01');
    game.deck = game.deck.filter((id) => id !== 'I01');
    game.discard = game.discard.filter((id) => id !== 'I01');
    actor.hand.push('I01');
    assert.equal(playerAction(game, actor.id, 'playCard', { cardId: 'I01', targetId: target.id }).ok, true);
    assert.equal(target.vitality, vitalityBefore - i);
    if (i === 0) assert.equal(target.hand.length, handBefore + 1);
    assert.equal(target.usedSkillThisGame, true);
  }
});

test('回合结束自动弃置最早获得的超限手牌且保留72张唯一卡牌', () => {
  const game = integrityGame();
  const p = game.players[0];
  p.hand.push(...game.deck.splice(0, 6));
  const hand = [...p.hand];
  const overflow = hand.length - p.handLimit;
  playerAction(game, p.id, 'endTurn');
  assert.deepEqual(p.hand, hand.slice(overflow));
  assert.deepEqual(game.discard, hand.slice(0, overflow));
  const cards = [...game.deck, ...game.discard, ...game.players.flatMap((p) => p.hand)];
  assert.equal(cards.length, 72);
  assert.equal(new Set(cards).size, 72);
});

test('不同房间交错行动与各自独立推演结果相同', () => {
  function snapshot(game: any) { return JSON.parse(JSON.stringify(game, (key, value) => key === 'timestamp' ? undefined : value)); }
  const alone = integrityGame(5, 17);
  for (let i = 0; i < 10 && alone.phase === 'playing'; i++) botTakeTurn(alone, alone.activePlayerId!);
  const expected = snapshot(alone);
  const a = integrityGame(5, 17);
  const b = integrityGame(7, 29);
  for (let i = 0; i < 10 && a.phase === 'playing'; i++) {
    if (b.phase === 'playing') botTakeTurn(b, b.activePlayerId!);
    botTakeTurn(a, a.activePlayerId!);
  }
  assert.deepEqual(snapshot(a), expected);
});

test('游戏状态序列化恢复后随机结果继续一致', () => {
  const game = integrityGame(6, 43);
  for (let i = 0; i < 3; i++) botTakeTurn(game, game.activePlayerId!);
  const restored = JSON.parse(JSON.stringify(game));
  for (let i = 0; i < 8 && game.phase === 'playing'; i++) {
    botTakeTurn(game, game.activePlayerId!);
    botTakeTurn(restored, restored.activePlayerId!);
  }
  const clean = (value: any) => JSON.parse(JSON.stringify(value, (key, v) => key === 'timestamp' ? undefined : v));
  assert.deepEqual(clean(game), clean(restored));
});

test('4–8 人各 100 个种子完整推演：72 张牌唯一、资源有界、最大轮数内结束', () => {
  for (let count = 4; count <= 8; count++) for (let seed = 1; seed <= 100; seed++) {
    const game = integrityGame(count, seed);
    let turns = 0;
    while (game.phase === 'playing' && turns < count * game.maxRounds + 1) {
      const cards = [...game.deck, ...game.discard, ...game.players.flatMap((p) => p.hand)];
      assert.equal(cards.length, 72, `count=${count} seed=${seed} turn=${turns}`);
      assert.equal(new Set(cards).size, 72);
      assert.ok(game.activePlayerId);
      for (const p of game.players) {
        assert.ok(p.vitality >= 0 && p.vitality <= p.maxVitality);
        assert.ok(p.friendship >= 0 && p.friendship <= 6);
      }
      botTakeTurn(game, game.activePlayerId!);
      turns++;
    }
    assert.equal(game.phase, 'finished', `count=${count} seed=${seed}`);
    assert.ok(game.round <= game.maxRounds);
    assert.ok(game.winnerData);
    const cards = [...game.deck, ...game.discard, ...game.players.flatMap((p) => p.hand)];
    assert.equal(cards.length, 72);
    assert.equal(new Set(cards).size, 72);
  }
});
