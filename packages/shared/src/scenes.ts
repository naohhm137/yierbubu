import type { Scene } from './types.js';

// ============================================================
// 8 张场景牌
// 每轮开始时翻开，改变本轮规则
// ============================================================

export const SCENES: Scene[] = [
  {
    id: 'dessert_party',
    name: '甜品派对',
    tag: '友情 / 赠送',
    rule: '本轮第一次赠送卡牌时，双方各获得 1 点友情值。',
    description:
      '糖果城的甜品派对正在进行！分享甜点会让大家的友情升温。抓住机会送出卡牌吧。',
    color: '#FFB6C1',
    icon: '🍰',
  },
  {
    id: 'dream_maze',
    name: '梦幻迷宫',
    tag: '顺序 / 距离',
    rule: '玩家的行动顺序重新随机排列，远距离互动（非相邻玩家）失效。',
    description:
      '玩具森林的迷宫会不断变化方向。你永远不知道下一个行动的是谁，也无法轻易影响远处的朋友。',
    color: '#9370DB',
    icon: '🌀',
  },
  {
    id: 'star_stage',
    name: '星光舞台',
    tag: '技能 / 免费',
    rule: '本轮每名玩家第一次使用角色技能时不消耗友情值。',
    description:
      '星光剧场的聚光灯照亮了每一个人！在舞台上展示你的专属技能吧，第一次演出完全免费。',
    color: '#FFD700',
    icon: '⭐',
  },
  {
    id: 'toy_rampage',
    name: '玩具暴走',
    tag: '道具 / 风险',
    rule: '所有道具牌的效果增强（+1），但使用后有 25% 概率产生副作用。',
    description:
      '玩具森林的发条玩具全部失控了！道具牌变得异常强大，但随时可能反噬使用者。',
    color: '#FF8C00',
    icon: '🤖',
  },
  {
    id: 'cloud_rain',
    name: '云朵暴雨',
    tag: '限制 / 目标',
    rule: '本轮不能连续两次指定同一个玩家为目标。',
    description:
      '云朵乐园下起了奇怪的雨，被雨淋到的人会暂时"隐身"。你不能连续针对同一个人。',
    color: '#87CEEB',
    icon: '🌧️',
  },
  {
    id: 'gift_exchange',
    name: '礼物交换日',
    tag: '交换 / 全员',
    rule: '所有玩家秘密选择一张手牌，同时传给左侧玩家。',
    description:
      '彩虹集市的传统节日！每个人都要送出一份礼物，也会收到一份惊喜。你会送出什么，又会收到什么？',
    color: '#FF69B4',
    icon: '🎁',
  },
  {
    id: 'quiet_afternoon',
    name: '安静午后',
    tag: '防御 / 恢复',
    rule: '攻击性互动效果减半（伤害 -1，最低 0），保护和恢复效果增强（+1）。',
    description:
      '月光湖的午后格外宁静。大家都不想打破这份平和，攻击变得无力，而关怀与治愈更加温暖。',
    color: '#B0C4DE',
    icon: '🌙',
  },
  {
    id: 'wish_meteor',
    name: '心愿流星',
    tag: '碎片 / 竞速',
    rule: '场上出现一枚临时心愿碎片，本轮第一个完成"帮助他人"行动的玩家获得它。',
    description:
      '一颗流星划过梦境车站！谁能第一个向朋友伸出援手，谁就能抓住这枚珍贵的心愿碎片。',
    color: '#FFA500',
    icon: '☄️',
  },
];

export const SCENE_MAP: Record<string, Scene> = Object.fromEntries(
  SCENES.map((s) => [s.id, s])
);

export function getScene(id: string): Scene | undefined {
  return SCENE_MAP[id];
}
