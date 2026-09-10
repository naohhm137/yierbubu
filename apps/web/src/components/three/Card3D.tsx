import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
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
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  scale?: number;
}

/** 3D 卡牌 — 有厚度、圆角、正反面纹理 */
export function Card3D({
  card,
  position,
  rotation,
  faceUp = true,
  isHovered = false,
  isSelected = false,
  onClick,
  onPointerOver,
  onPointerOut,
  scale = 1,
}: Card3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetY = useRef(position[1]);

  // 悬停/选中时上浮动画
  useFrame(() => {
    if (!groupRef.current) return;
    const target = isSelected ? position[1] + 0.25 : isHovered ? position[1] + 0.12 : position[1];
    targetY.current = target;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, target, 0.15);
  });

  const colorSet = CARD_COLORS[card.color] || CARD_COLORS.starBlue;

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
      {/* 卡牌主体 — 圆角长方体 */}
      <RoundedBox args={[0.55, 0.8, 0.04]} radius={0.04} smoothness={4} castShadow>
        <meshStandardMaterial color={faceUp ? '#fff8f0' : '#d4a574'} roughness={0.5} />
      </RoundedBox>

      {faceUp ? (
        <>
          {/* 正面 — 顶部色带 */}
          <mesh position={[0, 0.28, 0.025]}>
            <planeGeometry args={[0.48, 0.16]} />
            <meshStandardMaterial color={colorSet.bg} roughness={0.5} />
          </mesh>

          {/* 卡牌名称 */}
          <Text
            position={[0, 0.28, 0.03]}
            fontSize={0.055}
            color={colorSet.text}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.45}
          >
            {card.name}
          </Text>

          {/* 卡牌图标区域 — 彩色圆形 */}
          <mesh position={[0, 0.08, 0.025]}>
            <circleGeometry args={[0.1, 32]} />
            <meshStandardMaterial color={colorSet.accent} roughness={0.4} emissive={colorSet.accent} emissiveIntensity={0.2} />
          </mesh>

          {/* 卡牌类别标签 */}
          <Text
            position={[0, 0.08, 0.03]}
            fontSize={0.04}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {getCategoryIcon(card.category)}
          </Text>

          {/* 卡牌描述 */}
          <Text
            position={[0, -0.12, 0.03]}
            fontSize={0.032}
            color="#5a4a3a"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.45}
            textAlign="center"
          >
            {card.description}
          </Text>

          {/* 费用标识 */}
          {card.cost?.friendship !== undefined && card.cost.friendship > 0 && (
            <group position={[0.2, 0.3, 0.03]}>
              <mesh>
                <circleGeometry args={[0.04, 16]} />
                <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
              </mesh>
              <Text position={[0, 0, 0.005]} fontSize={0.035} color="#8b6914" anchorX="center" anchorY="middle">
                {card.cost.friendship}
              </Text>
            </group>
          )}

          {/* 底部装饰线 */}
          <mesh position={[0, -0.32, 0.025]}>
            <planeGeometry args={[0.4, 0.01]} />
            <meshStandardMaterial color={colorSet.accent} roughness={0.5} />
          </mesh>
        </>
      ) : (
        <>
          {/* 背面 — 统一花纹 */}
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.48, 0.72]} />
            <meshStandardMaterial color="#c9a87c" roughness={0.5} />
          </mesh>
          {/* 背面中心装饰 — 心愿星 */}
          <mesh position={[0, 0, 0.03]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.12, 0.12, 0.01]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <circleGeometry args={[0.05, 32]} />
            <meshStandardMaterial color="#fff8dc" roughness={0.3} />
          </mesh>
          {/* 背面边框装饰 */}
          <mesh position={[0, 0, 0.028]}>
            <ringGeometry args={[0.2, 0.22, 32]} />
            <meshStandardMaterial color="#a88860" roughness={0.5} />
          </mesh>
        </>
      )}

      {/* 选中高亮边框 */}
      {isSelected && (
        <mesh position={[0, 0, 0.026]}>
          <ringGeometry args={[0.28, 0.3, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

/** 卡牌类别图标 */
function getCategoryIcon(category: string): string {
  switch (category) {
    case 'interact': return '✦';
    case 'guard': return '🛡';
    case 'vitality': return '♥';
    case 'adventure': return '?';
    case 'item': return '⚙';
    case 'friendship': return '★';
    default: return '•';
  }
}
