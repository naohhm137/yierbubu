// 卡牌颜色配置 — 对应 CardColor 枚举
export const CARD_COLORS = {
  starBlue: {
    bg: '#e8f0fe',
    accent: '#5b8def',
    text: '#2c5aa0',
    name: '星蓝',
  },
  honeyYellow: {
    bg: '#fff8e1',
    accent: '#f5c542',
    text: '#a07c1a',
    name: '蜜黄',
  },
  coralPink: {
    bg: '#ffebee',
    accent: '#ef6b8a',
    text: '#b03a5a',
    name: '珊瑚粉',
  },
  mossGreen: {
    bg: '#e8f5e9',
    accent: '#66bb6a',
    text: '#2e7d32',
    name: '苔绿',
  },
  mistPurple: {
    bg: '#f3e5f5',
    accent: '#ab47bc',
    text: '#6a1b9a',
    name: '雾紫',
  },
  tideCyan: {
    bg: '#e0f7fa',
    accent: '#26c6da',
    text: '#00838f',
    name: '潮青',
  },
} as const;

export type CardColorKey = keyof typeof CARD_COLORS;
