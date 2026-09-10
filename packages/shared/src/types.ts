// ============================================================
// 《一二布布：萌境奇旅》共享类型定义
// 服务端与前端共用，服务端为唯一状态来源
// ============================================================

// ---------- 基础枚举 ----------

export type CardCategory =
  | 'interact'   // 互动牌 24
  | 'guard'      // 守护牌 14
  | 'vitality'   // 活力牌 8
  | 'adventure'  // 奇遇牌 10
  | 'item'       // 道具牌 8
  | 'friendship'; // 友情牌 8

export type CardColor =
  | 'starBlue'    // 星蓝 — 信息
  | 'honeyYellow' // 蜜黄 — 资源
  | 'coralPink'   // 珊瑚粉 — 互动
  | 'mossGreen'   // 苔绿 — 防护
  | 'mistPurple'  // 雾紫 — 探索
  | 'tideCyan';   // 潮青 — 移动

export type PlayerStatus = 'active' | 'dream' | 'asleep';

export type RoomPhase = 'lobby' | 'playing' | 'finished';

export type IdentityId = 'guide' | 'guardian' | 'trickster' | 'dreamer';

// ---------- 卡牌效果系统 ----------

export type EffectType =
  | 'damage'           // 目标失去活力
  | 'heal'             // 恢复活力
  | 'shield'           // 获得护盾（吸收一次伤害）
  | 'peekHand'         // 查看目标一张手牌
  | 'swapCard'         // 与目标交换一张手牌
  | 'reorderTurn'      // 改变行动顺序
  | 'copySkill'        // 临时复制技能
  | 'banCategory'      // 禁止某类牌一轮
  | 'recycle'          // 废弃牌回牌库
  | 'secretAid'        // 秘密选择帮助/捣蛋
  | 'gainFriendship'   // 获得友情值
  | 'formBond'         // 建立羁绊
  | 'breakBond'        // 解除羁绊
  | 'modifyScene'      // 改变场景效果
  | 'failureToReward'  // 失败效果转奖励
  | 'draw'             // 额外抽牌
  | 'discard'          // 弃牌
  | 'revive'           // 救回梦境旁观者
  | 'wishFragment'     // 获得心愿碎片
  | 'transferNegative' // 转移负面效果
  | 'randomEvent';     // 随机奇遇

export interface CardEffect {
  type: EffectType;
  value?: number;
  target?: 'self' | 'other' | 'any' | 'all';
  category?: CardCategory; // 用于 banCategory
  description?: string;
}

export interface Card {
  id: string;
  name: string;
  category: CardCategory;
  color: CardColor;
  description: string;      // 手机端可读的简短文案
  hint?: string;            // 新玩家提示
  effects: CardEffect[];
  cost?: { friendship?: number };
  rarity?: 'common' | 'variable' | 'rare';
}

// ---------- 角色 ----------

export interface CharacterSkill {
  id: string;
  name: string;
  trigger: string;      // 触发条件
  timing: string;       // 使用时机
  target: string;       // 目标范围
  effect: string;       // 效果描述
  cost: string;         // 费用
  cooldown: string;     // 冷却/限制
  failure: string;      // 失败处理
  // 引擎可执行的效果编码
  code?: SkillCode;
}

export type SkillCode =
  | 'yier_insight'       // 一二：查看手牌
  | 'bubu_burst'         // 布布：友情爆发
  | 'cloud_mail'         // 云朵邮差：送牌+友情
  | 'candy_chef'         // 糖果厨师：消耗手牌回血
  | 'forest_detective'   // 森林侦探：查看最近用牌
  | 'moon_magician'      // 月光魔术师：隐藏行动
  | 'toy_repair'         // 玩具修理师：道具复活
  | 'star_singer'        // 星星歌手：相邻增益
  | 'timid_ghost'        // 胆小幽灵：首次负面免疫
  | 'naughty_dumpling'   // 淘气团子：重定向互动
  | 'dream_painter'      // 梦境画师：废弃牌转换
  | 'windup_knight';     // 发条骑士：守护+延后

export interface Character {
  id: string;
  name: string;
  title: string;         // 称号
  species: string;       // 种族
  color: string;         // 主色 hex
  accentColor: string;   // 辅色 hex
  avatar: string;        // 图片路径
  personality: string;   // 性格
  background: string;    // 背景故事
  keywords: string[];    // 核心关键词
  playStyle: string;     // 核心玩法定位
  baseVitality: number;
  baseFriendship: number;
  handLimit: number;
  skill: CharacterSkill;
  isProtagonist?: boolean;
}

// ---------- 身份 ----------

export interface Identity {
  id: IdentityId;
  name: string;
  goal: string;
  winCondition: string;
  description: string;
  color: string;
}

// ---------- 场景 ----------

export interface Scene {
  id: string;
  name: string;
  tag: string;
  rule: string;          // 本轮规则改变
  description: string;
  color: string;
  icon: string;
}

// ---------- 玩家状态 ----------

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  characterId: string | null;
  identityId: IdentityId | null;  // 仅本人与服务端可见
  vitality: number;
  maxVitality: number;
  friendship: number;             // 0-6
  hand: string[];                 // 卡牌 id，仅本人可见
  handLimit: number;
  status: PlayerStatus;
  bonds: string[];                // 羁绊对象 playerId
  shield: number;                 // 护盾层数
  usedSkillThisTurn: boolean;
  usedSkillThisGame: boolean;
  hasActedThisTurn: boolean;
  hasDrawnThisTurn: boolean;
  protectedBy: string | null;     // 被谁保护（布布技能等）
  hiddenAction: boolean;          // 月光魔术师效果
  lastPlayedCard: string | null;
  wishFragments: number;
  personalGoalProgress: number;
  dreamHelpUsed: boolean;         // 梦境旁观者本轮是否已帮助
  ready: boolean;
}

// ---------- 房间/游戏状态 ----------

export interface LogEntry {
  id: number;
  round: number;
  playerId?: string;
  type: 'action' | 'scene' | 'system' | 'skill' | 'card' | 'victory' | 'bond';
  message: string;
  hiddenFor?: string[];           // 对这些玩家隐藏（月光魔术师等）
  timestamp: number;
}

export interface RoomState {
  roomId: string;
  phase: RoomPhase;
  hostId: string;
  players: PlayerState[];
  sceneId: string | null;
  sceneDeck: string[];            // 剩余场景牌
  round: number;
  maxRounds: number;
  activePlayerId: string | null;
  turnOrder: string[];
  deck: string[];                 // 牌堆（卡牌 id）
  discard: string[];              // 弃牌堆
  wishFragments: number;          // 团队心愿碎片总数
  wishProgress: number;           // 团队心愿任务进度（≥4 引路人胜）
  actionLog: LogEntry[];
  bannedCategory: CardCategory | null;
  lastTargetPlayerId: string | null;  // 云朵暴雨：不能连续指定同一人
  giftBonusUsed: boolean;         // 甜品派对：本轮首次赠送奖励已用
  starStageSkillFree: Record<string, boolean>; // 星光舞台：每人技能免费一次
  meteorClaimed: boolean;         // 心愿流星：碎片是否已被领取
  winnerData?: VictoryResult;
  settings: {
    mode: 'standard';
    playerCount: number;
  };
  logCounter: number;
}

// ---------- 胜利结算 ----------

export interface VictoryResult {
  winningIdentities: IdentityId[];
  guideWin: boolean;
  tricksterWin: boolean;
  dreamersWon: string[];          // 达成个人目标的追梦者 playerId
  guardianWin: boolean;
  keyEvents: string[];
  finalWishProgress: number;
  finalFragments: number;
  roundReached: number;
}

// ---------- Socket 协议 ----------

// 客户端 → 服务端
export type ClientEvent =
  | { type: 'createRoom'; playerName: string }
  | { type: 'joinRoom'; roomId: string; playerName: string }
  | { type: 'leaveRoom' }
  | { type: 'setReady'; ready: boolean }
  | { type: 'fillBots'; count: number }
  | { type: 'removeBot'; playerId: string }
  | { type: 'startGame' }
  | { type: 'selectCharacter'; characterId: string }
  | { type: 'draw' }
  | { type: 'playCard'; cardId: string; targetId?: string }
  | { type: 'useSkill'; targetId?: string; extra?: any }
  | { type: 'gift'; cardId: string; targetId: string }
  | { type: 'exchange'; cardId: string; targetId: string }
  | { type: 'defend' }
  | { type: 'hoard' }
  | { type: 'endTurn' }
  | { type: 'dreamHelp'; targetId: string }
  | { type: 'restart' }
  | { type: 'ping' };

// 服务端 → 客户端
export interface PublicRoomView {
  roomId: string;
  phase: RoomPhase;
  hostId: string;
  players: Array<Omit<PlayerState, 'hand' | 'identityId'> & { handCount: number; identityId: string | null }>;
  sceneId: string | null;
  round: number;
  maxRounds: number;
  activePlayerId: string | null;
  turnOrder: string[];
  deckCount: number;
  discardCount: number;
  wishFragments: number;
  wishProgress: number;
  actionLog: LogEntry[];
  bannedCategory: CardCategory | null;
  winnerData?: VictoryResult;
  settings: RoomState['settings'];
}

export interface PrivatePlayerView {
  playerId: string;
  identityId: IdentityId | null;
  hand: string[];
}

export type ServerEvent =
  | { type: 'roomState'; public: PublicRoomView; private?: PrivatePlayerView }
  | { type: 'error'; message: string }
  | { type: 'peekResult'; cardId: string; fromPlayerId: string }
  | { type: 'pong' };

// ---------- 常量 ----------

export const CONSTANTS = {
  MAX_FRIENDSHIP: 6,
  BASE_VITALITY: 4,
  BASE_HAND: 4,
  STANDARD_PLAYERS: 5,
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 8,
  MAX_ROUNDS: 8,
  WISH_GOAL: 4,        // 引路人胜利所需心愿进度
  DREAMER_FRIENDSHIP_GOAL: 5,
  DREAMER_FRAGMENT_GOAL: 3,
} as const;
