import React, { useMemo } from 'react';
import type { Card, CardCategory } from '@yierbubu/shared';
import { Card3D } from './Card3D';

interface HandCardsProps {
  cards: Card[];
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
  selectedCardId?: string | null;
  bannedCategory?: CardCategory | null;
}

export function HandCards({ cards, onPlayCard, isMyTurn, selectedCardId, bannedCategory }: HandCardsProps) {
  const cardPositions = useMemo(() => {
    const count = Math.min(cards.length, 12);
    // 超过8张时压缩间距
    const spacing = count > 8 ? 0.24 : 0.32;
    const spread = Math.min(count * spacing, 2.6);
    const positions: { pos: [number, number, number]; rot: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const x = t * spread;
      const z = 1.3 + Math.abs(t) * 0.2;
      const rotY = -t * 0.45;
      const rotX = -0.25;
      // 超过10张时略微缩小卡牌
      const scale = count > 10 ? 0.88 : 1;
      positions.push({ pos: [x, 1.15, z], rot: [rotX, rotY, 0], scale });
    }
    return positions;
  }, [cards.length]);

  if (cards.length === 0) return null;

  const displayCards = cards.slice(0, 12);

  return (
    <group>
      {displayCards.map((card, i) => {
        const { pos, rot, scale } = cardPositions[i] || { pos: [0, 1.05, 1.6], rot: [-0.2, 0, 0], scale: 1 };
        const isSelected = selectedCardId === card.id;
        const isBanned = bannedCategory && card.category === bannedCategory;
        const playable = isMyTurn && !isBanned;
        return (
          <Card3D
            key={card.id + i}
            card={card}
            position={pos}
            rotation={rot}
            faceUp={true}
            isSelected={isSelected}
            isPlayable={playable}
            onClick={() => playable && onPlayCard(card.id)}
            scale={scale}
          />
        );
      })}
      {cards.length > 12 && (
        <mesh position={[0, 0.9, 1.8]}>
          <planeGeometry args={[0.6, 0.2]} />
          <meshBasicMaterial color="#ff8fab" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}
