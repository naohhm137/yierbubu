import type {
  RoomState, PlayerState, Card, Character, IdentityId,
  LogEntry, VictoryResult, CardCategory, CONSTANTS as C,
} from './types.js';
import { CARDS, CARD_MAP, getCard } from './cards.js';
import { CHARACTERS, getCharacter } from './characters.js';
import { SCENES, SCENE_MAP } from './scenes.js';
import { STANDARD_IDENTITY_DISTRIBUTION } from './identities.js';
import { CONSTANTS } from './types.js';

// ============================================================
// 游戏引擎 — 纯逻辑，服务端唯一状态来源
// 所有状态变更通过引擎方法执行，保证可复现与可测试
// ============================================================

// 简易可种子化随机数（mulberry32）
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rng = makeRng(Date.now() % 2147483647);

export function setSeed(seed: number) {
  rng = makeRng(seed);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ---------- 日志 ----------

let logCounter = 0;

function addLog(
  state: RoomState,
  type: LogEntry['type'],
  message: string,
  playerId?: string,
  hiddenFor?: string[]
) {
  state.actionLog.push({
    id: ++state.logCounter,
    round: state.round,
    type,
    message,
    playerId,
    hiddenFor,
    timestamp: Date.now(),
  });
  if (state.actionLog.length > 200) state.actionLog.shift();
}

// ---------- 玩家辅助 ----------

function getPlayer(state: RoomState, id: string): PlayerState | undefined {
  return state.players.find((p) => p.id === id);
}

function activePlayers(state: RoomState): PlayerState[] {
  return state.players.filter((p) => p.status === 'active');
}

function drawCards(state: RoomState, player: PlayerState, count: number): string[] {
  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      state.deck = shuffle(state.discard);
      state.discard = [];
      addLog(state, 'system', '牌堆已空，弃牌堆洗回牌堆。');
    }
    const card = state.deck.pop();
    if (card) {
      player.hand.push(card);
      drawn.push(card);
    }
  }
  return drawn;
}

function discardCard(state: RoomState, player: PlayerState, cardId: string) {
  const idx = player.hand.indexOf(cardId);
  if (idx >= 0) {
    player.hand.splice(idx, 1);
    state.discard.push(cardId);
  }
}

function changeFriendship(player: PlayerState, delta: number) {
  player.friendship = clamp(player.friendship + delta, 0, CONSTANTS.MAX_FRIENDSHIP);
}

function damagePlayer(state: RoomState, target: PlayerState, amount: number, sourceId?: string) {
  let remaining = amount;
  // 先扣护盾
  while (remaining > 0 && target.shield > 0) {
    target.shield--;
    remaining--;
    addLog(state, 'action', `${target.name} 的护盾抵消了 1 点伤害。`, target.id);
  }
  if (remaining > 0) {
    // 胆小幽灵被动
    if (target.characterId === 'qiaoqiao' && !target.usedSkillThisGame) {
      target.usedSkillThisGame = true;
      drawCards(state, target, 1);
      addLog(state, 'skill', `${target.name} 的「隐形」触发！免疫伤害并摸 1 张牌。`, target.id);
      return;
    }
    target.vitality = clamp(target.vitality - remaining, 0, target.maxVitality);
    addLog(state, 'action', `${target.name} 失去 ${remaining} 点活力（当前 ${target.vitality}/${target.maxVitality}）。`, target.id);
    if (target.vitality <= 0) {
      enterDreamState(state, target);
    }
  }
}

function healPlayer(target: PlayerState, amount: number) {
  target.vitality = clamp(target.vitality + amount, 0, target.maxVitality);
}

function enterDreamState(state: RoomState, player: PlayerState) {
  player.status = 'dream';
  player.shield = 0;
  addLog(state, 'system', `${player.name} 活力耗尽，进入「梦境旁观者」状态。仍可每轮提供一次帮助。`, player.id);
}

function revivePlayer(state: RoomState, player: PlayerState, vitality: number) {
  if (player.status === 'dream') {
    player.status = 'active';
    player.vitality = vitality;
    addLog(state, 'action', `${player.name} 被救回，恢复 ${vitality} 点活力！`, player.id);
  }
}

// ---------- 创建游戏 ----------

export interface CreateGameOptions {
  roomId: string;
  hostId: string;
  players: Array<{ id: string; name: string; isBot: boolean; characterId?: string }>;
}

export function createGame(opts: CreateGameOptions): RoomState {
  const playerCount = opts.players.length;
  const identityPool = [...(STANDARD_IDENTITY_DISTRIBUTION[String(playerCount)] || STANDARD_IDENTITY_DISTRIBUTION['5'])];
  const shuffledIdentities = shuffle(identityPool);

  // 随机分配角色（未指定的）
  const availableChars = shuffle(CHARACTERS.map((c) => c.id));
  const assignedChars = new Set<string>();

  const players: PlayerState[] = opts.players.map((p, idx) => {
    let charId = p.characterId;
    if (!charId) {
      charId = availableChars.find((c) => !assignedChars.has(c))!;
    }
    assignedChars.add(charId!);
    const char = getCharacter(charId!)!;
    return {
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      characterId: charId!,
      identityId: shuffledIdentities[idx] as IdentityId,
      vitality: char.baseVitality,
      maxVitality: char.baseVitality,
      friendship: char.baseFriendship,
      hand: [],
      handLimit: char.handLimit,
      status: 'active',
      bonds: [],
      shield: 0,
      usedSkillThisTurn: false,
      usedSkillThisGame: false,
      hasActedThisTurn: false,
      hasDrawnThisTurn: false,
      protectedBy: null,
      hiddenAction: false,
      lastPlayedCard: null,
      wishFragments: 0,
      personalGoalProgress: 0,
      dreamHelpUsed: false,
      ready: true,
    };
  });

  // 构建牌堆（72 张）
  const deck = shuffle(CARDS.map((c) => c.id));

  // 场景牌堆
  const sceneDeck = shuffle(SCENES.map((s) => s.id));

  const state: RoomState = {
    roomId: opts.roomId,
    phase: 'playing',
    hostId: opts.hostId,
    players,
    sceneId: null,
    sceneDeck,
    round: 0,
    maxRounds: CONSTANTS.MAX_ROUNDS,
    activePlayerId: null,
    turnOrder: players.map((p) => p.id),
    deck,
    discard: [],
    wishFragments: 0,
    wishProgress: 0,
    actionLog: [],
    bannedCategory: null,
    lastTargetPlayerId: null,
    giftBonusUsed: false,
    starStageSkillFree: {},
    meteorClaimed: false,
    settings: { mode: 'standard', playerCount },
    logCounter: 0,
  };

  // 发起始手牌
  for (const p of players) {
    drawCards(state, p, CONSTANTS.BASE_HAND);
  }

  addLog(state, 'system', `游戏开始！${playerCount} 名玩家进入萌境，身份已秘密分配。`);

  // 开始第一轮
  startRound(state);

  return state;
}

// ---------- 回合流程 ----------

export function startRound(state: RoomState) {
  state.round++;
  state.bannedCategory = null;
  state.giftBonusUsed = false;
  state.meteorClaimed = false;
  state.starStageSkillFree = {};

  // 翻开场景牌
  if (state.sceneDeck.length === 0) {
    state.sceneDeck = shuffle(SCENES.map((s) => s.id));
  }
  state.sceneId = state.sceneDeck.pop()!;
  const scene = SCENE_MAP[state.sceneId];
  addLog(state, 'scene', `第 ${state.round} 轮 · 场景「${scene.name}」：${scene.rule}`);

  // 梦幻迷宫：重新排列行动顺序
  if (state.sceneId === 'dream_maze') {
    state.turnOrder = shuffle(state.turnOrder);
    addLog(state, 'scene', '梦幻迷宫：行动顺序已重新排列！');
  }

  // 礼物交换日：全员传牌
  if (state.sceneId === 'gift_exchange') {
    const order = state.turnOrder;
    const gifts: Record<string, string> = {};
    for (const pid of order) {
      const p = getPlayer(state, pid)!;
      if (p.hand.length > 0 && p.status === 'active') {
        const cardId = p.hand[Math.floor(rng() * p.hand.length)];
        gifts[pid] = cardId;
        discardCard(state, p, cardId);
      }
    }
    for (let i = 0; i < order.length; i++) {
      const giver = order[i];
      const receiver = order[(i + 1) % order.length];
      if (gifts[giver]) {
        const rp = getPlayer(state, receiver)!;
        rp.hand.push(gifts[giver]);
      }
    }
    addLog(state, 'scene', '礼物交换日：所有玩家将一张手牌传给了左侧玩家！');
  }

  // 所有玩家补充手牌至 4 张
  for (const p of state.players) {
    if (p.status === 'active') {
      const need = Math.max(0, CONSTANTS.BASE_HAND - p.hand.length);
      if (need > 0) drawCards(state, p, need);
    }
    p.usedSkillThisTurn = false;
    p.hasActedThisTurn = false;
    p.hasDrawnThisTurn = false;
    p.dreamHelpUsed = false;
    p.hiddenAction = false;
  }

  // 设置首个行动玩家
  const firstActive = state.turnOrder.find((id) => {
    const p = getPlayer(state, id);
    return p && p.status === 'active';
  });
  state.activePlayerId = firstActive || null;

  if (state.activePlayerId) {
    const ap = getPlayer(state, state.activePlayerId)!;
    addLog(state, 'system', `轮到 ${ap.name} 行动。`);
  }
}

export function endTurn(state: RoomState) {
  if (!state.activePlayerId) return;
  const current = getPlayer(state, state.activePlayerId)!;
  current.hasActedThisTurn = true;

  // 找下一个 active 玩家
  const idx = state.turnOrder.indexOf(state.activePlayerId);
  let nextId: string | null = null;
  for (let i = 1; i <= state.turnOrder.length; i++) {
    const candidateId = state.turnOrder[(idx + i) % state.turnOrder.length];
    const candidate = getPlayer(state, candidateId);
    if (candidate && candidate.status === 'active') {
      nextId = candidateId;
      break;
    }
  }

  if (nextId && nextId !== state.turnOrder[0]) {
    state.activePlayerId = nextId;
    const np = getPlayer(state, nextId)!;
    addLog(state, 'system', `轮到 ${np.name} 行动。`);
  } else {
    // 一轮结束
    endRound(state);
  }
}

function endRound(state: RoomState) {
  addLog(state, 'system', `第 ${state.round} 轮结束。`);

  // 检查胜利
  const victory = checkVictory(state);
  if (victory) {
    state.winnerData = victory;
    state.phase = 'finished';
    addLog(state, 'victory', `游戏结束！${formatVictory(victory)}`);
    return;
  }

  if (state.round >= state.maxRounds) {
    // 强制终局结算
    const finalVictory = resolveFinalVictory(state);
    state.winnerData = finalVictory;
    state.phase = 'finished';
    addLog(state, 'victory', `到达最大轮数，终局结算：${formatVictory(finalVictory)}`);
    return;
  }

  startRound(state);
}

// ---------- 玩家行动 ----------

export type ActionType =
  | 'draw' | 'playCard' | 'useSkill' | 'gift' | 'exchange'
  | 'defend' | 'hoard' | 'endTurn' | 'dreamHelp';

export interface ActionParams {
  cardId?: string;
  targetId?: string;
  extra?: any;
}

export function playerAction(
  state: RoomState,
  playerId: string,
  action: ActionType,
  params: ActionParams = {}
): { ok: boolean; error?: string } {
  if (state.phase !== 'playing') return { ok: false, error: '游戏已结束' };
  if (state.activePlayerId !== playerId && action !== 'dreamHelp') {
    return { ok: false, error: '还没轮到你行动' };
  }

  const player = getPlayer(state, playerId);
  if (!player) return { ok: false, error: '玩家不存在' };

  // 梦境旁观者只能 dreamHelp
  if (player.status === 'dream' && action !== 'dreamHelp') {
    return { ok: false, error: '你处于梦境旁观者状态，只能提供帮助' };
  }

  switch (action) {
    case 'draw':
      return actionDraw(state, player);
    case 'playCard':
      return actionPlayCard(state, player, params.cardId!, params.targetId);
    case 'useSkill':
      return actionUseSkill(state, player, params.targetId, params.extra);
    case 'gift':
      return actionGift(state, player, params.cardId!, params.targetId!);
    case 'exchange':
      return actionExchange(state, player, params.cardId!, params.targetId!);
    case 'defend':
      return actionDefend(state, player);
    case 'hoard':
      return actionHoard(state, player);
    case 'dreamHelp':
      return actionDreamHelp(state, player, params.targetId!);
    case 'endTurn':
      endTurn(state);
      return { ok: true };
    default:
      return { ok: false, error: '未知行动' };
  }
}

function actionDraw(state: RoomState, player: PlayerState) {
  if (player.hasDrawnThisTurn) return { ok: false, error: '本回合已经抽过牌了' };
  player.hasDrawnThisTurn = true;
  const drawn = drawCards(state, player, 1);
  if (drawn.length > 0) {
    const card = getCard(drawn[0]);
    addLog(state, 'action', `${player.name} 抽了 1 张牌。`, player.id, [player.id]);
  }
  return { ok: true };
}

function actionPlayCard(state: RoomState, player: PlayerState, cardId: string, targetId?: string) {
  const card = getCard(cardId);
  if (!card) return { ok: false, error: '卡牌不存在' };
  if (!player.hand.includes(cardId)) return { ok: false, error: '你没有这张牌' };
  if (state.bannedCategory === card.category) {
    return { ok: false, error: `本轮禁止使用${categoryName(card.category)}` };
  }

  // 云朵暴雨：不能连续指定同一人
  if (targetId && state.sceneId === 'cloud_rain' && state.lastTargetPlayerId === targetId && targetId !== player.id) {
    return { ok: false, error: '云朵暴雨：不能连续两次指定同一个玩家' };
  }

  // 消耗友情
  if (card.cost?.friendship && player.friendship < card.cost.friendship) {
    return { ok: false, error: `友情值不足（需要 ${card.cost.friendship}）` };
  }
  if (card.cost?.friendship) {
    changeFriendship(player, -card.cost.friendship);
  }

  // 打出
  discardCard(state, player, cardId);
  player.lastPlayedCard = cardId;
  player.hasActedThisTurn = true;

  const hidden = player.hiddenAction ? state.players.filter((p) => p.id !== player.id).map((p) => p.id) : undefined;
  addLog(state, 'card', `${player.name} 打出了「${card.name}」。`, player.id, hidden);

  // 应用效果
  applyCardEffects(state, player, card, targetId);

  if (targetId) state.lastTargetPlayerId = targetId;

  // 心愿流星：第一个帮助他人的玩家获得碎片
  if (state.sceneId === 'wish_meteor' && !state.meteorClaimed && isHelpingAction(card, targetId)) {
    state.meteorClaimed = true;
    player.wishFragments++;
    state.wishFragments++;
    state.wishProgress = Math.min(state.wishProgress + 1, CONSTANTS.WISH_GOAL + 2);
    addLog(state, 'scene', `心愿流星！${player.name} 第一个帮助他人，获得 1 枚心愿碎片！`, player.id);
  }

  return { ok: true };
}

function isHelpingAction(card: Card, targetId?: string): boolean {
  if (!targetId) return false;
  return card.effects.some((e) =>
    e.type === 'heal' || e.type === 'shield' || e.type === 'gainFriendship' || e.type === 'revive' || e.type === 'formBond'
  );
}

function actionUseSkill(state: RoomState, player: PlayerState, targetId?: string, extra?: any) {
  if (player.usedSkillThisTurn) return { ok: false, error: '本回合已经使用过技能了' };
  const char = getCharacter(player.characterId!);
  if (!char) return { ok: false, error: '角色不存在' };

  // 星光舞台：第一次技能免费
  const skillFree = state.sceneId === 'star_stage' && !state.starStageSkillFree[player.id];
  if (skillFree) {
    state.starStageSkillFree[player.id] = true;
  }

  player.usedSkillThisTurn = true;
  player.hasActedThisTurn = true;

  const hidden = player.hiddenAction ? state.players.filter((p) => p.id !== player.id).map((p) => p.id) : undefined;
  addLog(state, 'skill', `${player.name} 使用了技能「${char.skill.name}」。`, player.id, hidden);

  applySkill(state, player, char, targetId, extra, skillFree);

  return { ok: true };
}

function actionGift(state: RoomState, player: PlayerState, cardId: string, targetId: string) {
  if (!player.hand.includes(cardId)) return { ok: false, error: '你没有这张牌' };
  const target = getPlayer(state, targetId);
  if (!target || target.status !== 'active') return { ok: false, error: '目标无效' };

  discardCard(state, player, cardId);
  target.hand.push(cardId);
  player.hasActedThisTurn = true;

  addLog(state, 'action', `${player.name} 送给 ${target.name} 一张牌。`, player.id);

  // 甜品派对：首次赠送双方+1友情
  if (state.sceneId === 'dessert_party' && !state.giftBonusUsed) {
    state.giftBonusUsed = true;
    changeFriendship(player, 1);
    changeFriendship(target, 1);
    addLog(state, 'scene', `甜品派对！${player.name} 和 ${target.name} 各获得 1 点友情。`);
  } else {
    changeFriendship(player, 1);
  }

  // 心愿流星
  if (state.sceneId === 'wish_meteor' && !state.meteorClaimed) {
    state.meteorClaimed = true;
    player.wishFragments++;
    state.wishFragments++;
    state.wishProgress = Math.min(state.wishProgress + 1, CONSTANTS.WISH_GOAL + 2);
    addLog(state, 'scene', `心愿流星！${player.name} 获得 1 枚心愿碎片！`, player.id);
  }

  // 一二&布布羁绊检测
  checkProtagonistBond(state, player, target);

  return { ok: true };
}

function actionExchange(state: RoomState, player: PlayerState, cardId: string, targetId: string) {
  if (!player.hand.includes(cardId)) return { ok: false, error: '你没有这张牌' };
  const target = getPlayer(state, targetId);
  if (!target || target.status !== 'active' || target.hand.length === 0) {
    return { ok: false, error: '目标无效或没有手牌' };
  }

  const targetCard = target.hand[Math.floor(rng() * target.hand.length)];
  discardCard(state, player, cardId);
  discardCard(state, target, targetCard);
  player.hand.push(targetCard);
  target.hand.push(cardId);
  player.hasActedThisTurn = true;

  addLog(state, 'action', `${player.name} 与 ${target.name} 交换了一张手牌。`, player.id);
  changeFriendship(player, 1);
  changeFriendship(target, 1);

  checkProtagonistBond(state, player, target);

  return { ok: true };
}

function actionDefend(state: RoomState, player: PlayerState) {
  player.shield += 1;
  player.hasActedThisTurn = true;
  addLog(state, 'action', `${player.name} 进入防守状态，获得 1 层护盾。`, player.id);
  return { ok: true };
}

function actionHoard(state: RoomState, player: PlayerState) {
  changeFriendship(player, 1);
  player.hasActedThisTurn = true;
  addLog(state, 'action', `${player.name} 积蓄力量，获得 1 点友情值。`, player.id);
  return { ok: true };
}

function actionDreamHelp(state: RoomState, player: PlayerState, targetId: string) {
  if (player.status !== 'dream') return { ok: false, error: '只有梦境旁观者可以提供帮助' };
  if (player.dreamHelpUsed) return { ok: false, error: '本轮已经提供过帮助了' };
  const target = getPlayer(state, targetId);
  if (!target || target.status !== 'active') return { ok: false, error: '目标无效' };

  player.dreamHelpUsed = true;
  changeFriendship(target, 1);
  drawCards(state, target, 1);
  addLog(state, 'action', `梦境旁观者 ${player.name} 帮助了 ${target.name}（+1 友情，+1 手牌）。`, player.id);
  return { ok: true };
}

// ---------- 卡牌效果执行 ----------

function applyCardEffects(state: RoomState, player: PlayerState, card: Card, targetId?: string) {
  const target = targetId ? getPlayer(state, targetId) : undefined;

  for (const effect of card.effects) {
    const value = effect.value || 0;
    switch (effect.type) {
      case 'damage': {
        let dmg = value;
        // 安静午后：攻击减半
        if (state.sceneId === 'quiet_afternoon') dmg = Math.max(0, dmg - 1);
        // 玩具暴走：道具牌增强
        if (state.sceneId === 'toy_rampage' && card.category === 'item') dmg += 1;
        if (target) damagePlayer(state, target, dmg, player.id);
        // 玩具暴走副作用
        if (state.sceneId === 'toy_rampage' && card.category === 'item' && rng() < 0.25) {
          damagePlayer(state, player, 1);
          addLog(state, 'scene', `玩具暴走副作用！${player.name} 受到 1 点伤害。`, player.id);
        }
        break;
      }
      case 'heal': {
        let heal = value;
        if (state.sceneId === 'quiet_afternoon') heal += 1;
        if (effect.target === 'all') {
          for (const p of activePlayers(state)) healPlayer(p, heal);
          addLog(state, 'action', `全队恢复 ${heal} 点活力。`, player.id);
        } else if (target) {
          healPlayer(target, heal);
          addLog(state, 'action', `${target.name} 恢复 ${heal} 点活力。`, player.id);
        } else {
          healPlayer(player, heal);
          addLog(state, 'action', `${player.name} 恢复 ${heal} 点活力。`, player.id);
        }
        break;
      }
      case 'shield': {
        let shield = value;
        if (state.sceneId === 'toy_rampage' && card.category === 'item') shield += 1;
        if (effect.target === 'all') {
          for (const p of activePlayers(state)) p.shield += shield;
          addLog(state, 'action', `全队获得 ${shield} 层护盾。`, player.id);
        } else if (target) {
          target.shield += shield;
          addLog(state, 'action', `${target.name} 获得 ${shield} 层护盾。`, player.id);
        } else {
          player.shield += shield;
          addLog(state, 'action', `${player.name} 获得 ${shield} 层护盾。`, player.id);
        }
        if (state.sceneId === 'toy_rampage' && card.category === 'item' && rng() < 0.25) {
          addLog(state, 'scene', `玩具暴走副作用！${player.name} 下回合行动延后。`, player.id);
        }
        break;
      }
      case 'draw': {
        if (effect.target === 'all') {
          for (const p of activePlayers(state)) drawCards(state, p, value);
          addLog(state, 'action', `全队各摸 ${value} 张牌。`, player.id);
        } else {
          drawCards(state, player, value);
          addLog(state, 'action', `${player.name} 摸了 ${value} 张牌。`, player.id, [player.id]);
        }
        if (state.sceneId === 'toy_rampage' && card.category === 'item' && rng() < 0.25 && player.hand.length > 0) {
          const rc = player.hand[Math.floor(rng() * player.hand.length)];
          discardCard(state, player, rc);
          addLog(state, 'scene', `玩具暴走副作用！${player.name} 随机弃了 1 张牌。`, player.id);
        }
        break;
      }
      case 'discard': {
        if (target && target.hand.length > 0) {
          const rc = target.hand[Math.floor(rng() * target.hand.length)];
          discardCard(state, target, rc);
          addLog(state, 'action', `${target.name} 弃了 1 张牌。`, player.id);
        }
        break;
      }
      case 'gainFriendship': {
        if (effect.target === 'all') {
          for (const p of state.players) changeFriendship(p, value);
          addLog(state, 'action', `全队友情 +${value}。`, player.id);
        } else if (target) {
          changeFriendship(target, value);
          addLog(state, 'action', `${target.name} 友情 +${value}。`, player.id);
        } else {
          changeFriendship(player, value);
        }
        if (state.sceneId === 'toy_rampage' && card.category === 'item' && rng() < 0.25) {
          changeFriendship(player, -1);
          addLog(state, 'scene', `玩具暴走副作用！${player.name} 友情 -1。`, player.id);
        }
        break;
      }
      case 'formBond': {
        if (target && !player.bonds.includes(target.id)) {
          player.bonds.push(target.id);
          target.bonds.push(player.id);
          addLog(state, 'bond', `${player.name} 与 ${target.name} 建立了羁绊！`, player.id);
        }
        break;
      }
      case 'breakBond': {
        if (target && player.bonds.includes(target.id)) {
          player.bonds = player.bonds.filter((id) => id !== target.id);
          target.bonds = target.bonds.filter((id) => id !== player.id);
          addLog(state, 'bond', `${player.name} 解除了与 ${target.name} 的羁绊。`, player.id);
        }
        break;
      }
      case 'peekHand': {
        if (target && target.hand.length > 0) {
          const rc = target.hand[Math.floor(rng() * target.hand.length)];
          const card = getCard(rc);
          addLog(state, 'action', `${player.name} 查看了 ${target.name} 的一张手牌：「${card?.name}」。`, player.id, [target.id]);
        }
        break;
      }
      case 'swapCard': {
        if (target && target.hand.length > 0 && player.hand.length > 0) {
          const pc = player.hand[Math.floor(rng() * player.hand.length)];
          const tc = target.hand[Math.floor(rng() * target.hand.length)];
          discardCard(state, player, pc);
          discardCard(state, target, tc);
          player.hand.push(tc);
          target.hand.push(pc);
          addLog(state, 'action', `${player.name} 与 ${target.name} 交换了一张手牌。`, player.id);
        }
        break;
      }
      case 'reorderTurn': {
        state.turnOrder = shuffle(state.turnOrder);
        addLog(state, 'action', `${player.name} 打乱了行动顺序！`, player.id);
        break;
      }
      case 'banCategory': {
        const cats: CardCategory[] = ['interact', 'guard', 'vitality', 'adventure', 'item', 'friendship'];
        state.bannedCategory = pick(cats);
        addLog(state, 'action', `本轮禁止使用「${categoryName(state.bannedCategory)}」！`, player.id);
        break;
      }
      case 'recycle': {
        if (state.discard.length > 0) {
          const rc = state.discard.pop()!;
          player.hand.push(rc);
          addLog(state, 'action', `${player.name} 从弃牌堆取回了一张牌。`, player.id);
        }
        break;
      }
      case 'revive': {
        if (target && target.status === 'dream') {
          revivePlayer(state, target, value || 1);
        }
        break;
      }
      case 'modifyScene': {
        // 简化：心愿进度变化或场景效果切换
        if (card.id === 'T07' || card.id === 'F08' || card.id === 'I24') {
          const delta = card.id === 'I24' ? -1 : 1;
          state.wishProgress = clamp(state.wishProgress + delta, 0, CONSTANTS.WISH_GOAL + 2);
          addLog(state, 'action', `团队心愿进度 ${delta > 0 ? '+' : ''}${delta}（当前 ${state.wishProgress}/${CONSTANTS.WISH_GOAL}）。`, player.id);
        } else {
          addLog(state, 'action', `${player.name} 改变了场景效果！`, player.id);
        }
        if (state.sceneId === 'toy_rampage' && card.category === 'item' && rng() < 0.25) {
          state.wishProgress = clamp(state.wishProgress - 1, 0, CONSTANTS.WISH_GOAL + 2);
          addLog(state, 'scene', `玩具暴走副作用！心愿进度 -1。`, player.id);
        }
        break;
      }
      case 'secretAid': {
        if (target) {
          if (rng() < 0.5) {
            changeFriendship(target, 1);
            addLog(state, 'action', `秘密行动：${target.name} 获得了帮助（+1 友情）。`, player.id, [player.id, target.id]);
          } else {
            damagePlayer(state, target, 1, player.id);
          }
        }
        break;
      }
      case 'transferNegative': {
        if (target) {
          damagePlayer(state, target, 1, player.id);
          addLog(state, 'action', `${player.name} 将负面效果转移给了 ${target.name}。`, player.id);
        }
        break;
      }
      case 'copySkill': {
        addLog(state, 'action', `${player.name} 复制了一个技能效果（简化为摸 1 张牌）。`, player.id);
        drawCards(state, player, 1);
        break;
      }
      case 'failureToReward': {
        drawCards(state, player, 1);
        changeFriendship(player, 1);
        addLog(state, 'action', `${player.name} 将失败转化为奖励（+1 牌，+1 友情）。`, player.id);
        break;
      }
      case 'randomEvent': {
        if (target && rng() < 0.5) {
          damagePlayer(state, target, 1, player.id);
        } else {
          damagePlayer(state, player, 1, target?.id);
        }
        break;
      }
      default:
        break;
    }
  }
}

// ---------- 角色技能执行 ----------

function applySkill(
  state: RoomState,
  player: PlayerState,
  char: Character,
  targetId?: string,
  extra?: any,
  skillFree = false
) {
  const target = targetId ? getPlayer(state, targetId) : undefined;

  switch (char.skill.code) {
    case 'yier_insight': {
      if (target && target.hand.length > 0) {
        const rc = target.hand[Math.floor(rng() * target.hand.length)];
        const card = getCard(rc);
        addLog(state, 'skill', `一二查看了 ${target.name} 的手牌：「${card?.name}」。`, player.id, [target.id]);
      }
      if (state.deck.length > 0) {
        const top = state.deck[state.deck.length - 1];
        addLog(state, 'skill', `一二看到牌堆顶是「${getCard(top)?.name}」。`, player.id, [player.id]);
      }
      break;
    }
    case 'bubu_burst': {
      if (!skillFree && player.friendship < 1) {
        addLog(state, 'skill', `布布友情值不足，技能未生效。`, player.id);
        return;
      }
      if (!skillFree) changeFriendship(player, -1);
      if (target) {
        target.shield += 1;
        drawCards(state, target, 1);
        addLog(state, 'skill', `布布的友情爆发！${target.name} 获得 1 护盾并摸 1 张牌。`, player.id);
      } else {
        drawCards(state, player, 2);
        addLog(state, 'skill', `布布的友情爆发！自己摸了 2 张牌。`, player.id);
      }
      break;
    }
    case 'cloud_mail': {
      if (target && player.hand.length > 0) {
        const cardId = player.hand[Math.floor(rng() * player.hand.length)];
        discardCard(state, player, cardId);
        target.hand.push(cardId);
        changeFriendship(player, 1);
        changeFriendship(target, 1);
        addLog(state, 'skill', `朵朵将一张牌送给了 ${target.name}，双方 +1 友情。`, player.id);
      }
      break;
    }
    case 'candy_chef': {
      if (player.hand.length > 0 && target) {
        const cardId = player.hand[Math.floor(rng() * player.hand.length)];
        const discarded = getCard(cardId);
        discardCard(state, player, cardId);
        const bonus = discarded?.category === 'friendship' ? 1 : 0;
        healPlayer(target, 1 + bonus);
        addLog(state, 'skill', `糖糖消耗「${discarded?.name}」为 ${target.name} 恢复 ${1 + bonus} 点活力。`, player.id);
      }
      break;
    }
    case 'forest_detective': {
      if (target && target.lastPlayedCard) {
        const card = getCard(target.lastPlayedCard);
        addLog(state, 'skill', `阿松追踪到 ${target.name} 最近打出了「${card?.name}」。`, player.id);
      } else if (target && target.hand.length > 0) {
        const rc = target.hand[Math.floor(rng() * target.hand.length)];
        addLog(state, 'skill', `阿松查看了 ${target.name} 的一张手牌。`, player.id, [target.id]);
      }
      break;
    }
    case 'moon_magician': {
      if (target) {
        target.hiddenAction = true;
        addLog(state, 'skill', `月月让 ${target.name} 的行动隐藏了！`, player.id);
      }
      break;
    }
    case 'toy_repair': {
      const itemCards = state.discard.filter((id) => getCard(id)?.category === 'item');
      if (itemCards.length > 0) {
        const rc = itemCards[Math.floor(rng() * itemCards.length)];
        state.discard = state.discard.filter((id) => id !== rc);
        player.hand.push(rc);
        addLog(state, 'skill', `小扳从弃牌堆修好了一张道具牌「${getCard(rc)?.name}」。`, player.id);
      } else {
        drawCards(state, player, 1);
        addLog(state, 'skill', `小扳没找到可修的道具，摸了 1 张牌。`, player.id);
      }
      break;
    }
    case 'star_singer': {
      const idx = state.turnOrder.indexOf(player.id);
      const leftId = state.turnOrder[(idx - 1 + state.turnOrder.length) % state.turnOrder.length];
      const rightId = state.turnOrder[(idx + 1) % state.turnOrder.length];
      for (const nid of [leftId, rightId]) {
        const n = getPlayer(state, nid);
        if (n && n.status === 'active') {
          changeFriendship(n, 1);
          if (n.characterId === 'yier' || n.characterId === 'bubu') {
            healPlayer(n, 1);
          }
        }
      }
      addLog(state, 'skill', `咪咪的星光二重奏！相邻玩家各 +1 友情。`, player.id);
      break;
    }
    case 'timid_ghost': {
      // 被动技能，主动使用时获得 1 护盾
      player.shield += 1;
      addLog(state, 'skill', `悄悄躲进兜帽，获得 1 层护盾。`, player.id);
      break;
    }
    case 'naughty_dumpling': {
      addLog(state, 'skill', `团团准备好了！下一张互动牌的目标将被重定向。`, player.id);
      break;
    }
    case 'dream_painter': {
      if (state.discard.length > 0) {
        const rc = state.discard.pop()!;
        player.hand.push(rc);
        addLog(state, 'skill', `画画将弃牌堆的「${getCard(rc)?.name}」重绘后加入手牌。`, player.id);
      } else {
        drawCards(state, player, 1);
      }
      break;
    }
    case 'windup_knight': {
      if (target) {
        target.shield += 2;
        // 下回合行动延后：移到 turnOrder 末尾
        const pIdx = state.turnOrder.indexOf(player.id);
        if (pIdx >= 0) {
          state.turnOrder.splice(pIdx, 1);
          state.turnOrder.push(player.id);
        }
        addLog(state, 'skill', `咔咔保护了 ${target.name}（+2 护盾），但自己下回合行动延后。`, player.id);
      }
      break;
    }
    default:
      break;
  }
}

// ---------- 一二&布布专属羁绊 ----------

let protagonistBondTriggered = false;

function checkProtagonistBond(state: RoomState, a: PlayerState, b: PlayerState) {
  if (protagonistBondTriggered) return;
  const pair = [a.characterId, b.characterId].sort().join(',');
  if (pair === 'bubu,yier') {
    if (!a.bonds.includes(b.id)) {
      a.bonds.push(b.id);
      b.bonds.push(a.id);
    }
    protagonistBondTriggered = true;
    drawCards(state, a, 1);
    drawCards(state, b, 1);
    changeFriendship(a, 1);
    changeFriendship(b, 1);
    addLog(state, 'bond', `一二与布布的专属羁绊「星兔共鸣」触发！双方各摸 1 张牌，+1 友情！`);
  }
}

// ---------- 胜利判定 ----------

export function checkVictory(state: RoomState): VictoryResult | null {
  const active = activePlayers(state);
  if (active.length === 0) {
    return resolveFinalVictory(state);
  }
  // 引路人即时胜利：心愿进度达到目标
  if (state.wishProgress >= CONSTANTS.WISH_GOAL) {
    return resolveFinalVictory(state);
  }
  return null;
}

export function resolveFinalVictory(state: RoomState): VictoryResult {
  const guide = state.players.find((p) => p.identityId === 'guide');
  const guideWin = state.wishProgress >= CONSTANTS.WISH_GOAL;
  const guardianWin = guideWin && !!guide && guide.vitality > 0;
  const tricksterWin = !guideWin;
  const dreamers = state.players.filter((p) => p.identityId === 'dreamer');
  const dreamersWon = dreamers
    .filter((p) => p.friendship >= CONSTANTS.DREAMER_FRIENDSHIP_GOAL || p.wishFragments >= CONSTANTS.DREAMER_FRAGMENT_GOAL)
    .map((p) => p.id);

  const winningIdentities: IdentityId[] = [];
  if (guideWin) winningIdentities.push('guide');
  if (guardianWin) winningIdentities.push('guardian');
  if (tricksterWin) winningIdentities.push('trickster');
  if (dreamersWon.length > 0) winningIdentities.push('dreamer');

  return {
    winningIdentities,
    guideWin,
    tricksterWin,
    dreamersWon,
    guardianWin,
    keyEvents: state.actionLog.slice(-10).map((l) => l.message),
    finalWishProgress: state.wishProgress,
    finalFragments: state.wishFragments,
    roundReached: state.round,
  };
}

function formatVictory(v: VictoryResult): string {
  const parts: string[] = [];
  if (v.guideWin) parts.push('引路人胜利（大心愿星修复）');
  if (v.guardianWin) parts.push('守护伙伴胜利');
  if (v.tricksterWin) parts.push('捣蛋客胜利（心愿修复失败）');
  if (v.dreamersWon.length > 0) parts.push(`${v.dreamersWon.length} 名追梦者达成个人愿望`);
  return parts.join('，') || '平局';
}

// ---------- 机器人 AI ----------

export function botTakeTurn(state: RoomState, playerId: string) {
  const player = getPlayer(state, playerId);
  if (!player || player.status !== 'active' || state.activePlayerId !== playerId) return;

  // 简单 AI 策略
  const enemies = state.players.filter((p) => p.id !== playerId && p.status === 'active');
  const weakest = [...enemies].sort((a, b) => a.vitality - b.vitality)[0];
  const strongest = [...enemies].sort((a, b) => b.vitality - a.vitality)[0];

  // 1. 如果有伤害牌且有弱目标，打出
  const damageCards = player.hand.filter((id) => {
    const c = getCard(id);
    return c?.effects.some((e) => e.type === 'damage');
  });
  if (damageCards.length > 0 && weakest && rng() < 0.6) {
    playerAction(state, playerId, 'playCard', { cardId: damageCards[0], targetId: weakest.id });
    return;
  }

  // 2. 如果有治疗牌且自己血量低，使用
  const healCards = player.hand.filter((id) => {
    const c = getCard(id);
    return c?.effects.some((e) => e.type === 'heal');
  });
  if (healCards.length > 0 && player.vitality <= 2) {
    playerAction(state, playerId, 'playCard', { cardId: healCards[0] });
    return;
  }

  // 3. 使用技能
  if (!player.usedSkillThisTurn && rng() < 0.5) {
    const target = strongest || weakest;
    playerAction(state, playerId, 'useSkill', { targetId: target?.id });
    return;
  }

  // 4. 友情牌/守护牌
  const friendlyCards = player.hand.filter((id) => {
    const c = getCard(id);
    return c?.category === 'friendship' || c?.category === 'guard';
  });
  if (friendlyCards.length > 0) {
    const target = enemies[Math.floor(rng() * enemies.length)];
    playerAction(state, playerId, 'playCard', { cardId: friendlyCards[0], targetId: target?.id });
    return;
  }

  // 5. 抽牌
  if (!player.hasDrawnThisTurn) {
    playerAction(state, playerId, 'draw');
    return;
  }

  // 6. 任意牌
  if (player.hand.length > 0) {
    const cardId = player.hand[Math.floor(rng() * player.hand.length)];
    const target = enemies[Math.floor(rng() * enemies.length)];
    playerAction(state, playerId, 'playCard', { cardId, targetId: target?.id });
    return;
  }

  // 7. 结束回合
  playerAction(state, playerId, 'endTurn');
}

// ---------- 工具 ----------

export function categoryName(cat: CardCategory): string {
  const map: Record<CardCategory, string> = {
    interact: '互动牌',
    guard: '守护牌',
    vitality: '活力牌',
    adventure: '奇遇牌',
    item: '道具牌',
    friendship: '友情牌',
  };
  return map[cat];
}

export function getPublicView(state: RoomState, viewerId: string) {
  return {
    roomId: state.roomId,
    phase: state.phase,
    hostId: state.hostId,
    players: state.players.map((p) => ({
      ...p,
      hand: p.id === viewerId ? p.hand : [],
      handCount: p.hand.length,
      identityId: (state.phase === 'finished' || p.id === viewerId) ? p.identityId : null,
    })),
    sceneId: state.sceneId,
    round: state.round,
    maxRounds: state.maxRounds,
    activePlayerId: state.activePlayerId,
    turnOrder: state.turnOrder,
    deckCount: state.deck.length,
    discardCount: state.discard.length,
    wishFragments: state.wishFragments,
    wishProgress: state.wishProgress,
    actionLog: state.actionLog.filter(
      (l) => !l.hiddenFor || !l.hiddenFor.includes(viewerId)
    ),
    bannedCategory: state.bannedCategory,
    winnerData: state.winnerData,
    settings: state.settings,
  };
}
