import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { PublicRoomView } from '@yierbubu/shared';

interface CenterCardsProps {
  room: PublicRoomView;
}

/** 中央出牌区 — 展示最近行动和装饰 */
export function CenterCards({ room }: CenterCardsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // 最近一条行动记录
  const latestAction = room.actionLog && room.actionLog.length > 0
    ? room.actionLog[room.actionLog.length - 1]
    : null;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.95, 0]}>
      {/* 装饰性卡牌堆叠 — 牌库 */}
      <group position={[-0.8, 0, 0.3]} rotation={[0, 0.3, 0]}>
        {[0, 0.01, 0.02, 0.03].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <boxGeometry args={[0.45, 0.02, 0.65]} />
            <meshStandardMaterial color={['#c9a87c', '#b8986c', '#c9a87c', '#d4b88c'][i]} roughness={0.6} />
          </mesh>
        ))}
        <Text
          position={[0, 0.06, 0]}
          fontSize={0.05}
          color="#8b7355"
          anchorX="center"
          anchorY="middle"
        >
          牌库
        </Text>
      </group>

      {/* 弃牌堆 */}
      <group position={[0.8, 0, 0.3]} rotation={[0, -0.3, 0]}>
        {[0, 0.01, 0.02].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <boxGeometry args={[0.45, 0.02, 0.65]} />
            <meshStandardMaterial color={['#a8c8a0', '#98b890', '#a8c8a0'][i]} roughness={0.6} />
          </mesh>
        ))}
        <Text
          position={[0, 0.05, 0]}
          fontSize={0.05}
          color="#5a7a50"
          anchorX="center"
          anchorY="middle"
        >
          弃牌
        </Text>
      </group>

      {/* 中央最近行动提示 */}
      {latestAction && (
        <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
          <group position={[0, 0.15, -0.2]}>
            <mesh>
              <planeGeometry args={[1.6, 0.25]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
            </mesh>
            <Text
              position={[0, 0.03, 0.01]}
              fontSize={0.06}
              color="#6b5b4f"
              anchorX="center"
              anchorY="middle"
              maxWidth={1.4}
              textAlign="center"
            >
              {latestAction.message.slice(0, 30)}
            </Text>
          </group>
        </Float>
      )}

      {/* 心愿碎片装饰 */}
      {room.wishFragments > 0 && (
        <group position={[0, 0.2, -0.5]}>
          {Array.from({ length: Math.min(room.wishFragments, 4) }).map((_, i) => (
            <Float key={i} speed={2 + i * 0.5} rotationIntensity={1} floatIntensity={0.5}>
              <mesh position={[(i - 1.5) * 0.15, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                <octahedronGeometry args={[0.06, 0]} />
                <meshStandardMaterial
                  color="#ffd700"
                  emissive="#ffd700"
                  emissiveIntensity={0.5}
                  roughness={0.2}
                />
              </mesh>
            </Float>
          ))}
        </group>
      )}
    </group>
  );
}
