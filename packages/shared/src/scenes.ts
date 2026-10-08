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
    rule: '轮开始时随机排列行动顺序；本轮已行动的玩家不会重复获得回合。',
    description:
      '茶会的迷宫会变化方向，轮开始时重新排好座位，下一位朋友会是谁呢？',
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
    rule: '道具牌的伤害和护盾各 +1；伤害、护盾、抽牌、友情、场景效果分别有 25% 概率触发对应副作用，详见牌面。',
    description:
      '玩具森林的发条玩具全部失控了！道具牌变得异常强大，但随时可能反噬使用者。',
    color: '#FF8C00',
    icon: '🤖',
  },
  {
    id: 'cloud_rain',
    name: '云朵暴雨',
    tag: '限制 / 目标',
    rule: '出牌时不能连续两次指定同一个其他玩家；记录会延续到下一轮，指定自己不受限制。',
    description:
      '云朵乐园下起了奇怪的雨，被雨淋到的人会暂时"隐身"。你不能连续针对同一个人。',
    color: '#87CEEB',
    icon: '🌧️',
  },
  {
    id: 'gift_exchange',
    name: '礼物交换日',
    tag: '交换 / 全员',
    rule: '轮开始时，每名行动中的玩家随机将一张手牌传给行动顺序中的下一位玩家（梦境玩家也可接收）。',
    description:
      '彩虹集市的传统节日！每个人都要送出一份礼物，也会收到一份惊喜。你会送出什么，又会收到什么？',
    color: '#FF69B4',
    icon: '🎁',
  },
  {
    id: 'quiet_afternoon',
    name: '安静午后',
    tag: '防御 / 恢复',
    rule: '卡牌伤害 -1（最低 0），卡牌恢复活力 +1；技能和护盾数值不变。',
    description:
      '月光湖的午后格外宁静。大家都不想打破这份平和，攻击变得无力，而关怀与治愈更加温暖。',
    color: '#B0C4DE',
    icon: '🌙',
  },
  {
    id: 'wish_meteor',
    name: '心愿流星',
    tag: '碎片 / 竞速',
    rule: '本轮首次赠牌，或出牌为他人/全队恢复、加护盾、加友情、复活或建立羁绊时，施法者获得 1 枚碎片，团队心愿进度 +1。',
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
