import type { Identity } from './types.js';

// ============================================================
// 4 种隐藏身份
// 原创称呼，不直接使用其他游戏的身份名称
// ============================================================

export const IDENTITIES: Identity[] = [
  {
    id: 'guide',
    name: '引路人',
    goal: '推动团队修复大心愿星，完成指定数量的心愿任务。',
    winCondition: '终局时团队心愿进度 ≥ 4（大心愿星修复成功）。',
    description:
      '你是被心愿卡选中的守护者。你的目标是带领大家收集心愿碎片、完成心愿任务。你需要观察谁在真正帮忙，谁在暗中捣乱。可以公开身份来凝聚团队，但也可能因此成为捣蛋客的首要目标。',
    color: '#4A90D9',
  },
  {
    id: 'guardian',
    name: '守护伙伴',
    goal: '暗中保护引路人，避免引路人过早失去活力。',
    winCondition: '终局时引路人存活（活力 > 0）且引路人达成目标。',
    description:
      '你发誓要保护引路人。你知道引路人是谁吗？不——你需要通过观察找出引路人，然后暗中保护。可以替引路人承担伤害、赠送关键卡牌、在关键时刻使用守护技能。你的胜利与引路人绑定。',
    color: '#32CD32',
  },
  {
    id: 'trickster',
    name: '捣蛋客',
    goal: '让心愿修复失败、制造混乱或阻止特定任务完成。',
    winCondition: '终局时团队心愿进度 < 4（大心愿星未能修复），且你未被完全排除。',
    description:
      '你是萌境中被负面情绪影响的居民。你希望大心愿星继续碎裂，这样你就能获得无法控制的魔法能力。你可以假装帮助团队，在关键时刻打出破坏牌、转移负面效果、制造误会。不要轻易暴露身份。',
    color: '#FF6347',
  },
  {
    id: 'dreamer',
    name: '追梦者',
    goal: '拥有独立秘密愿望——积累友情值或收集心愿碎片。',
    winCondition: '终局时满足以下任一：①友情值 ≥ 5；②个人心愿碎片 ≥ 3。与团队胜负无关。',
    description:
      '你有一个只属于自己的愿望。你可以选择帮助团队，也可以选择独善其身。你的胜利不依赖团队成败——只要终局时你的友情值足够高，或者收集到足够的心愿碎片，你就赢了。灵活选择阵营是你的优势。',
    color: '#9370DB',
  },
];

export const IDENTITY_MAP: Record<string, Identity> = Object.fromEntries(
  IDENTITIES.map((i) => [i.id, i])
);

export function getIdentity(id: string): Identity | undefined {
  return IDENTITY_MAP[id];
}

// 5人标准局身份分配：1引路人 + 1守护伙伴 + 1捣蛋客 + 2追梦者
export const STANDARD_IDENTITY_DISTRIBUTION: Record<string, string[]> = {
  '4': ['guide', 'guardian', 'trickster', 'dreamer'],
  '5': ['guide', 'guardian', 'trickster', 'dreamer', 'dreamer'],
  '6': ['guide', 'guardian', 'trickster', 'trickster', 'dreamer', 'dreamer'],
  '7': ['guide', 'guardian', 'guardian', 'trickster', 'trickster', 'dreamer', 'dreamer'],
  '8': ['guide', 'guardian', 'guardian', 'trickster', 'trickster', 'trickster', 'dreamer', 'dreamer'],
};
