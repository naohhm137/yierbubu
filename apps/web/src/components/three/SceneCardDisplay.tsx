import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { Scene } from '@yierbubu/shared';

interface SceneCardDisplayProps {
  scene: Scene;
}

/** 场景牌 — 桌面中央悬浮展示，带发光效果 */
export function SceneCardDisplay({ scene }: SceneCardDisplayProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group position={[0, 1.3, 0]}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <group ref={groupRef}>
          {/* 场景牌底座 — 发光圆环 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
            <ringGeometry args={[0.4, 0.5, 64]} />
            <meshBasicMaterial color="#ffd700" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>

          {/* 场景牌主体 */}
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.9, 0.05]} />
            <meshStandardMaterial color="#fff8f0" roughness={0.4} />
          </mesh>

          {/* 场景牌正面 */}
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.62, 0.82]} />
            <meshStandardMaterial color={scene.color || '#ffe4c4'} roughness={0.5} emissive={scene.color || '#ffe4c4'} emissiveIntensity={0.15} />
          </mesh>

          {/* 场景名称 */}
          <Text
            position={[0, 0.2, 0.06]}
            fontSize={0.08}
            color="#5a4a3a"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.55}
          >
            {scene.name}
          </Text>

          {/* 场景图标 */}
          <mesh position={[0, -0.05, 0.06]}>
            <circleGeometry args={[0.12, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} emissive="#ffffff" emissiveIntensity={0.2} />
          </mesh>

          {/* 场景效果描述 */}
          <Text
            position={[0, -0.25, 0.06]}
            fontSize={0.04}
            color="#7a6a5a"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.5}
            textAlign="center"
          >
            {scene.rule}
          </Text>

          {/* 发光效果 */}
          <pointLight position={[0, 0.5, 0.5]} intensity={0.5} color="#ffd700" distance={2} />
        </group>
      </Float>
    </group>
  );
}
