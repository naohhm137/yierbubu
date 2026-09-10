import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import type { Card } from '@yierbubu/shared';
import { Card3D } from './Card3D';

interface HandCardsProps {
  cards: Card[];
  onPlayCard: (cardId: string, targetId?: string) => void;
  isMyTurn: boolean;
}

/** 手牌 — 扇形排列在桌面靠近相机一侧，悬停上浮，点击打出 */
export function HandCards({ cards, onPlayCard, isMyTurn }: HandCardsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 扇形排列计算
  const cardPositions = useMemo(() => {
    const count = Math.min(cards.length, 8); // 最多显示8张
    const spread = Math.min(count * 0.35, 2.2);
    const positions: { pos: [number, number, number]; rot: [number, number, number] }[] = [];

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const x = t * spread;
      const z = 1.8 + Math.abs(t) * 0.3; // 弧形排列，更靠近相机
      const rotY = -t * 0.5; // 扇形旋转
      const rotX = -0.25; // 略微后仰，更易阅读
      positions.push({
        pos: [x, 1.15, z],
        rot: [rotX, rotY, 0],
      });
    }
    return positions;
  }, [cards.length]);

  const handleCardClick = (index: number) => {
    if (!isMyTurn) return;
    if (selectedIndex === index) {
      // 第二次点击 — 打出卡牌
      onPlayCard(cards[index].id);
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  };

  if (cards.length === 0) return null;

  return (
    <group>
      {cards.slice(0, 8).map((card, i) => {
        const { pos, rot } = cardPositions[i] || { pos: [0, 1.15, 1.8], rot: [-0.25, 0, 0] };
        return (
          <Card3D
            key={card.id + i}
            card={card}
            position={pos}
            rotation={rot}
            faceUp={true}
            isHovered={hoveredIndex === i}
            isSelected={selectedIndex === i}
            onClick={() => handleCardClick(i)}
            onPointerOver={() => setHoveredIndex(i)}
            onPointerOut={() => setHoveredIndex(null)}
          />
        );
      })}

      {/* 选中提示 */}
      {selectedIndex !== null && (
        <mesh position={[0, 1.6, 2.1]}>
          <planeGeometry args={[1.5, 0.15]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}
