import React, { useMemo } from 'react';
import * as THREE from 'three';

interface PlayerHandBacksProps {
  position: [number, number, number];
  rotationY: number;
  cardCount: number;
  isActive: boolean;
}

/** 其他玩家面前的牌背（扇形排列） */
export function PlayerHandBacks({ position, rotationY, cardCount, isActive }: PlayerHandBacksProps) {
  const cards = useMemo(() => {
    const result = [];
    const count = Math.min(cardCount, 6);
    const spread = Math.min(count * 0.12, 0.6);

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : (i / (count - 1) - 0.5) * 2;
      const x = t * spread;
      const z = Math.abs(t) * 0.05;
      const rotZ = t * 0.15;
      result.push({ x, z, rotZ, key: i });
    }
    return result;
  }, [cardCount]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 手牌放在玩家面前的桌面上 */}
      <group position={[0, 0.06, -0.5]}>
        {cards.map((card) => (
          <group key={card.key} position={[card.x, card.z, 0]} rotation={[-Math.PI / 2, 0, card.rotZ]}>
            {/* 牌背 */}
            <mesh>
              <boxGeometry args={[0.28, 0.4, 0.02]} />
              <meshPhysicalMaterial
                color={isActive ? '#FF9A56' : '#8B7355'}
                roughness={0.3}
                clearcoat={0.6}
                clearcoatRoughness={0.2}
              />
            </mesh>
            {/* 牌背图案 - 星形装饰 */}
            <mesh position={[0, 0, 0.012]}>
              <planeGeometry args={[0.18, 0.28]} />
              <meshBasicMaterial color={isActive ? '#FFD700' : '#D4A574'} transparent opacity={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
