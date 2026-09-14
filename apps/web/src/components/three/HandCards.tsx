import React, { useMemo } from 'react';
import type { Card } from '@yierbubu/shared';
import { Card3D } from './Card3D';

interface HandCardsProps {
  cards: Card[];
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
  selectedCardId?: string | null;
  seat: { x: number; z: number; rotY: number };
}

export function HandCards({ cards, onPlayCard, isMyTurn, selectedCardId, seat }: HandCardsProps) {
  const cardPositions = useMemo(() => {
    const count = Math.min(cards.length, 10);
    const spread = Math.min(count * 0.32, 2.4);
    const positions: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const x = seat.x * 0.72 + t * spread * Math.cos(seat.rotY);
      const z = seat.z * 0.72 - t * spread * Math.sin(seat.rotY);
      const rotY = seat.rotY + Math.PI - t * 0.45;
      const rotX = -0.2;
      positions.push({ pos: [x, 1.05, z], rot: [rotX, rotY, 0] });
    }
    return positions;
  }, [cards.length, seat.x, seat.z, seat.rotY]);

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
