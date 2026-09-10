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
      <RoundedBox args={[0.62, 0.9, 0.045]} radius={0.05} smoothness={4} castShadow>
        <meshStandardMaterial color={faceUp ? '#fff8f0' : '#d4a574'} roughness={0.4} />
      </RoundedBox>

      {faceUp ? (
        <>
          {/* 正面 — 顶部色带 */}
          <mesh position={[0, 0.32, 0.026]}>
            <planeGeometry args={[0.54, 0.18]} />
            <meshStandardMaterial color={colorSet.bg} roughness={0.4} />
          </mesh>

          {/* 卡牌名称 */}
          <Text
            position={[0, 0.32, 0.032]}
            fontSize={0.07}
            color={colorSet.text}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.5}
            fontWeight="bold"
          >
            {card.name}
          </Text>

          {/* 卡牌图标区域 — 彩色圆形 */}
          <mesh position={[0, 0.08, 0.026]}>
            <circleGeometry args={[0.11, 32]} />
            <meshStandardMaterial color={colorSet.accent} roughness={0.3} emissive={colorSet.accent} emissiveIntensity={0.25} />
          </mesh>

          {/* 卡牌类别标签 */}
          <Text
            position={[0, 0.08, 0.032]}
            fontSize={0.05}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {getCategoryIcon(card.category)}
          </Text>

          {/* 卡牌描述 */}
          <Text
            position={[0, -0.14, 0.032]}
            fontSize={0.042}
            color="#4a3a2a"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.52}
            textAlign="center"
            lineHeight={1.2}
          >
            {card.description}
          </Text>

          {/* 费用标识 */}
          {card.cost?.friendship !== undefined && card.cost.friendship > 0 && (
            <group position={[0.22, 0.34, 0.032]}>
              <mesh>
                <circleGeometry args={[0.045, 16]} />
                <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.4} />
              </mesh>
              <Text position={[0, 0, 0.006]} fontSize={0.04} color="#8b6914" anchorX="center" anchorY="middle" fontWeight="bold">
                {card.cost.friendship}
              </Text>
            </group>
          )}

          {/* 底部装饰线 */}
          <mesh position={[0, -0.36, 0.026]}>
            <planeGeometry args={[0.44, 0.012]} />
            <meshStandardMaterial color={colorSet.accent} roughness={0.4} />
          </mesh>
        </>
      ) : (
        <>
          {/* 背面 — 统一花纹 */}
          <mesh position={[0, 0, 0.026]}>
            <planeGeometry args={[0.54, 0.82]} />
            <meshStandardMaterial color="#c9a87c" roughness={0.4} />
          </mesh>
          {/* 背面中心装饰 — 心愿星 */}
          <mesh position={[0, 0, 0.032]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.14, 0.14, 0.012]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.35} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.038]}>
            <circleGeometry args={[0.06, 32]} />
            <meshStandardMaterial color="#fff8dc" roughness={0.2} />
          </mesh>
          {/* 背面边框装饰 */}
          <mesh position={[0, 0, 0.03]}>
            <ringGeometry args={[0.22, 0.24, 32]} />
            <meshStandardMaterial color="#a88860" roughness={0.4} />
          </mesh>
        </>
      )}

      {/* 选中高亮边框 */}
      {isSelected && (
        <mesh position={[0, 0, 0.028]}>
          <ringGeometry args={[0.32, 0.34, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.95} />
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
