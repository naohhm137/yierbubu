import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Card } from '@yierbubu/shared';
import { CARD_COLORS } from './cardColors';

interface Card3DProps {
  card: Card;
  position: [number, number, number];
  rotation: [number, number, number];
  faceUp?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  scale?: number;
}

/** 中文换行 — 按字符宽度自动换行 */
function wrapChineseText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** 生成高清卡牌正面纹理 */
function createCardTexture(card: Card): THREE.CanvasTexture {
  const W = 1024;
  const H = 1536;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const colorSet = CARD_COLORS[card.color] || CARD_COLORS.starBlue;

  // 背景 — 奶油色
  ctx.fillStyle = '#fffaf2';
  ctx.fillRect(0, 0, W, H);

  // 圆角边框
  ctx.strokeStyle = colorSet.accent;
  ctx.lineWidth = 12;
  roundRect(ctx, 20, 20, W - 40, H - 40, 50);
  ctx.stroke();

  // 顶部色带
  const grad = ctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, colorSet.bg);
  grad.addColorStop(1, lightenColor(colorSet.bg, 15));
  ctx.fillStyle = grad;
  roundRect(ctx, 40, 40, W - 80, 240, 35);
  ctx.fill();

  // 卡牌名称
  ctx.fillStyle = colorSet.text;
  ctx.font = 'bold 64px "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillText(card.name, W / 2, 160);
  ctx.shadowColor = 'transparent';

  // 图标圆形区域
  const iconY = 460;
  const iconR = 110;
  ctx.beginPath();
  ctx.arc(W / 2, iconY, iconR, 0, Math.PI * 2);
  ctx.fillStyle = colorSet.accent;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.stroke();

  // 类别文字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getCategoryChar(card.category), W / 2, iconY + 4);

  // 类别名称
  ctx.fillStyle = colorSet.accent;
  ctx.font = 'bold 36px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText(getCategoryName(card.category), W / 2, iconY + 170);

  // 描述文字区域背景
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  roundRect(ctx, 70, 720, W - 140, 520, 25);
  ctx.fill();

  // 描述文字
  ctx.fillStyle = '#3d2b1f';
  ctx.font = '44px "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const descLines = wrapChineseText(ctx, card.description, W - 200);
  const lineHeight = 62;
  const startY = 760 + Math.max(0, (520 - descLines.length * lineHeight) / 2);
  descLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  });

  // 费用标识
  if (card.cost?.friendship !== undefined && card.cost.friendship > 0) {
    const costX = W - 110;
    const costY = 160;
    ctx.beginPath();
    ctx.arc(costX, costY, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#8b6914';
    ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(card.cost.friendship), costX, costY + 2);
    // 友情小星
    ctx.fillStyle = '#fff8dc';
    ctx.font = '24px sans-serif';
    ctx.fillText('★', costX, costY + 42);
  }

  // 底部装饰
  ctx.fillStyle = colorSet.accent;
  roundRect(ctx, W / 2 - 150, H - 100, 300, 16, 8);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = 16;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** 生成卡牌背面纹理 */
function createCardBackTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 1536;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 背景
  ctx.fillStyle = '#c9a87c';
  ctx.fillRect(0, 0, W, H);

  // 边框
  ctx.strokeStyle = '#8b6340';
  ctx.lineWidth = 16;
  roundRect(ctx, 30, 30, W - 60, H - 60, 45);
  ctx.stroke();

  // 中心圆
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 200, 0, Math.PI * 2);
  ctx.fillStyle = '#a88860';
  ctx.fill();
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 10;
  ctx.stroke();

  // 心愿星
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 160px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', W / 2, H / 2 + 10);

  // 装饰环
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 280, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4b896';
  ctx.lineWidth = 6;
  ctx.setLineDash([20, 15]);
  ctx.stroke();
  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = 16;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + percent);
  const b = Math.min(255, (num & 0x0000ff) + percent);
  return `rgb(${r},${g},${b})`;
}

function getCategoryChar(category: string): string {
  switch (category) {
    case 'interact': return '互';
    case 'guard': return '守';
    case 'vitality': return '活';
    case 'adventure': return '奇';
    case 'item': return '道';
    case 'friendship': return '友';
    default: return '?';
  }
}

function getCategoryName(category: string): string {
  switch (category) {
    case 'interact': return '互动牌';
    case 'guard': return '守护牌';
    case 'vitality': return '活力牌';
    case 'adventure': return '奇遇牌';
    case 'item': return '道具牌';
    case 'friendship': return '友情牌';
    default: return '卡牌';
  }
}

// 缓存背面纹理
let backTextureCache: THREE.CanvasTexture | null = null;

/** 3D 卡牌 — canvas高清纹理，中文清晰 */
export function Card3D({
  card,
  position,
  rotation,
  faceUp = true,
  isHovered = false,
  isSelected = false,
  isPlayable = true,
  onClick,
  onPointerOver,
  onPointerOut,
  scale = 1,
}: Card3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const frontTexture = useMemo(() => createCardTexture(card), [card]);
  const backTexture = useMemo(() => {
    if (!backTextureCache) backTextureCache = createCardBackTexture();
    return backTextureCache;
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = isSelected ? position[1] + 0.3 : isHovered ? position[1] + 0.12 : position[1];
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, target, 0.15);
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* 卡牌主体 — 有厚度 */}
      <RoundedBox args={[0.62, 0.92, 0.04]} radius={0.04} smoothness={4} castShadow>
        <meshStandardMaterial color="#f5e6d0" roughness={0.5} />
      </RoundedBox>

      {/* 正面纹理 */}
      {faceUp && (
        <mesh position={[0, 0, 0.023]}>
          <planeGeometry args={[0.58, 0.87]} />
          <meshStandardMaterial map={frontTexture} roughness={0.35} metalness={0.05} transparent={!isPlayable} opacity={isPlayable ? 1 : 0.45} />
        </mesh>
      )}

      {/* 背面纹理 */}
      {!faceUp && (
        <mesh position={[0, 0, 0.023]}>
          <planeGeometry args={[0.58, 0.87]} />
          <meshStandardMaterial map={backTexture} roughness={0.4} />
        </mesh>
      )}

      {/* 选中高亮 — 金色光环+底部聚光 */}
      {isSelected && (
        <>
          <mesh position={[0, 0, 0.026]}>
            <ringGeometry args={[0.34, 0.37, 32]} />
            <meshBasicMaterial color="#ffd700" transparent opacity={0.95} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.55, 0]}>
            <planeGeometry args={[0.7, 0.08]} />
            <meshBasicMaterial color="#ffd700" transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {/* 不可用锁图标 */}
      {!isPlayable && faceUp && (
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.2, 0.2]} />
          <meshBasicMaterial color="#666" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
