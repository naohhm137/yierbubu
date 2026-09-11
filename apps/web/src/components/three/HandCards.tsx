import React, { useMemo } from 'react';
import type { Card } from '@yierbubu/shared';
import { Card3D } from './Card3D';

interface HandCardsProps {
  cards: Card[];
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
  selectedCardId?: string | null;
}

export function HandCards({ cards, onPlayCard, isMyTurn, selectedCardId }: HandCardsProps) {
  const cardPositions = useMemo(() => {
    const count = Math.min(cards.length, 10);
    const spread = Math.min(count * 0.32, 2.4);
    const positions: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const x = t * spread;
      const z = 1.6 + Math.abs(t) * 0.25;
      const rotY = -t * 0.45;
      const rotX = -0.2;
      positions.push({ pos: [x, 1.05, z], rot: [rotX, rotY, 0] });
    }
    return positions;
  }, [cards.length]);

  if (cards.length === 0) return null;

  return (
    <group>
      {cards.slice(0, 10).map((card, i) => {
        const { pos, rot } = cardPositions[i] || { pos: [0, 1.05, 1.6], rot: [-0.2, 0, 0] };
        const isSelected = selectedCardId === card.id;
        return (
          <Card3D
            key={card.id + i}
            card={card}
            position={pos}
            rotation={rot}
            faceUp={true}
            isSelected={isSelected}
            isPlayable={isMyTurn}
            onClick={() => isMyTurn && onPlayCard(card.id)}
          />
        );
      })}
    </group>
  );
}
