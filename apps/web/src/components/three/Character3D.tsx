import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Character } from '@yierbubu/shared';

interface Character3DProps {
  character?: Character;
  position: [number, number, number];
  rotation: [number, number, number];
  playerName: string;
  vitality: number;
  friendship: number;
  isActive: boolean;
  isDreaming: boolean;
}

/** 高品质潮玩材质 — 清漆+光泽+次表面散射感 */
function useToyMaterial(color: string, opts?: { roughness?: number; clearcoat?: number; sheen?: number }) {
  return useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness: opts?.roughness ?? 0.35,
      metalness: 0,
      clearcoat: opts?.clearcoat ?? 0.8,
      clearcoatRoughness: 0.2,
      sheen: opts?.sheen ?? 0.5,
      sheenColor: new THREE.Color(color).offsetHSL(0, 0, 0.15),
      sheenRoughness: 0.4,
      envMapIntensity: 1.2,
    });
  }, [color, opts?.roughness, opts?.clearcoat, opts?.sheen]);
}

/** 眼睛组件 — 带高光的精致眼睛 */
function Eye({ position, size = 0.07 }: { position: [number, number, number]; size?: number }) {
  return (
    <group position={position}>
      {/* 眼白 */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.1} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      {/* 瞳孔 */}
      <mesh position={[0, 0, size * 0.6]}>
        <sphereGeometry args={[size * 0.65, 16, 16]} />
        <meshPhysicalMaterial color="#1a1a2e" roughness={0.15} clearcoat={1} />
      </mesh>
      {/* 高光 */}
      <mesh position={[size * 0.2, size * 0.2, size * 0.95]}>
        <sphereGeometry args={[size * 0.2, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/** 腮红组件 */
function Blush({ position, color = '#ffb3c6', size = 0.08 }: { position: [number, number, number]; color?: string; size?: number }) {
  return (
    <mesh position={position}>
      <circleGeometry args={[size, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** 一二 — 白色小熊猫，黑圆耳朵，黑蝴蝶领结，粉腮红，吐舌 */
function YierCharacter() {
  const whiteMat = useToyMaterial('#faf8f5', { roughness: 0.3, clearcoat: 0.9, sheen: 0.6 });
  const blackMat = useToyMaterial('#1a1a1a', { roughness: 0.25, clearcoat: 1, sheen: 0.3 });
  const pinkMat = useToyMaterial('#ffb3c6', { roughness: 0.4, clearcoat: 0.6, sheen: 0.8 });

  return (
    <group>
      {/* 身体 */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.35, 8, 16]} />
        <primitive object={whiteMat} attach="material" />
      </mesh>
      {/* 头部 */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.42, 32, 32]} />
        <primitive object={whiteMat} attach="material" />
      </mesh>
      {/* 黑色圆耳朵 */}
      <mesh position={[-0.28, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <primitive object={blackMat} attach="material" />
      </mesh>
      <mesh position={[0.28, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <primitive object={blackMat} attach="material" />
      </mesh>
      {/* 眼睛 */}
      <Eye position={[-0.14, 1.18, 0.36]} size={0.065} />
      <Eye position={[0.14, 1.18, 0.36]} size={0.065} />
      {/* 粉色腮红 */}
      <Blush position={[-0.24, 1.08, 0.38]} color="#ff9eb5" size={0.07} />
      <Blush position={[0.24, 1.08, 0.38]} color="#ff9eb5" size={0.07} />
      {/* 鼻子 */}
      <mesh position={[0, 1.1, 0.4]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <primitive object={blackMat} attach="material" />
      </mesh>
      {/* 吐舌 */}
      <mesh position={[0, 1.02, 0.42]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <primitive object={pinkMat} attach="material" />
      </mesh>
      {/* 黑色蝴蝶领结 */}
      <group position={[0, 0.82, 0.28]}>
        <mesh position={[-0.08, 0, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.12, 0.08, 0.03]} />
          <primitive object={blackMat} attach="material" />
        </mesh>
        <mesh position={[0.08, 0, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.12, 0.08, 0.03]} />
          <primitive object={blackMat} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <primitive object={blackMat} attach="material" />
        </mesh>
      </group>
      {/* 手臂 */}
      <mesh position={[-0.38, 0.6, 0.05]} rotation={[0, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.08, 0.2, 6, 12]} />
        <primitive object={whiteMat} attach="material" />
      </mesh>
      <mesh position={[0.38, 0.6, 0.05]} rotation={[0, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.08, 0.2, 6, 12]} />
        <primitive object={whiteMat} attach="material" />
      </mesh>
      {/* 黑色小脚 */}
      <mesh position={[-0.15, 0.12, 0.08]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <primitive object={blackMat} attach="material" />
      </mesh>
      <mesh position={[0.15, 0.12, 0.08]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <primitive object={blackMat} attach="material" />
      </mesh>
    </group>
  );
}

/** 布布 — 棕色小熊，棕圆耳朵，黄腮红，温和微笑 */
function BubuCharacter() {
  const brownMat = useToyMaterial('#a67c52', { roughness: 0.35, clearcoat: 0.85, sheen: 0.5 });
  const lightBrownMat = useToyMaterial('#c9a66b', { roughness: 0.4, clearcoat: 0.7, sheen: 0.6 });
  const yellowMat = useToyMaterial('#ffd966', { roughness: 0.4, clearcoat: 0.6, sheen: 0.7 });

  return (
    <group>
      {/* 身体 */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.35, 8, 16]} />
        <primitive object={brownMat} attach="material" />
      </mesh>
      {/* 肚子（浅色） */}
      <mesh position={[0, 0.55, 0.28]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <primitive object={lightBrownMat} attach="material" />
      </mesh>
      {/* 头部 */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.44, 32, 32]} />
        <primitive object={brownMat} attach="material" />
      </mesh>
      {/* 棕色圆耳朵 */}
      <mesh position={[-0.3, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <primitive object={brownMat} attach="material" />
      </mesh>
      <mesh position={[0.3, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <primitive object={brownMat} attach="material" />
      </mesh>
      {/* 耳朵内侧 */}
      <mesh position={[-0.3, 1.5, 0.08]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <primitive object={lightBrownMat} attach="material" />
      </mesh>
      <mesh position={[0.3, 1.5, 0.08]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <primitive object={lightBrownMat} attach="material" />
      </mesh>
      {/* 眼睛 */}
      <Eye position={[-0.15, 1.2, 0.38]} size={0.06} />
      <Eye position={[0.15, 1.2, 0.38]} size={0.06} />
      {/* 黄色腮红 */}
      <Blush position={[-0.26, 1.08, 0.4]} color="#ffcc44" size={0.075} />
      <Blush position={[0.26, 1.08, 0.4]} color="#ffcc44" size={0.075} />
      {/* 鼻子 */}
      <mesh position={[0, 1.12, 0.42]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshPhysicalMaterial color="#5c4033" roughness={0.2} clearcoat={1} />
      </mesh>
      {/* 微笑嘴巴 */}
      <mesh position={[0, 1.04, 0.4]}>
        <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
        <meshPhysicalMaterial color="#5c4033" roughness={0.3} />
      </mesh>
      {/* 手臂 */}
      <mesh position={[-0.4, 0.6, 0.05]} rotation={[0, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.09, 0.22, 6, 12]} />
        <primitive object={brownMat} attach="material" />
      </mesh>
      <mesh position={[0.4, 0.6, 0.05]} rotation={[0, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.09, 0.22, 6, 12]} />
        <primitive object={brownMat} attach="material" />
      </mesh>
      {/* 脚 */}
      <mesh position={[-0.16, 0.12, 0.08]} castShadow>
        <sphereGeometry args={[0.11, 12, 12]} />
        <primitive object={lightBrownMat} attach="material" />
      </mesh>
      <mesh position={[0.16, 0.12, 0.08]} castShadow>
        <sphereGeometry args={[0.11, 12, 12]} />
        <primitive object={lightBrownMat} attach="material" />
      </mesh>
    </group>
  );
}

/** 通用配角 — 根据角色颜色生成精致Q版角色 */
function GenericCharacter({ character }: { character: Character }) {
  const bodyMat = useToyMaterial(character.color, { roughness: 0.35, clearcoat: 0.8, sheen: 0.5 });
  const accentMat = useToyMaterial(character.accentColor || '#ffffff', { roughness: 0.3, clearcoat: 0.9, sheen: 0.6 });

  return (
    <group>
      {/* 身体 */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.35, 8, 16]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* 头部 */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.42, 32, 32]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* 特色耳朵/头饰 — 根据角色类型 */}
      {character.id === 'duoduo' && (
        <>
          {/* 云朵邮差 — 云朵帽 */}
          <mesh position={[0, 1.55, 0]} castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
          <mesh position={[-0.15, 1.5, 0.05]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
          <mesh position={[0.15, 1.5, 0.05]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
        </>
      )}
      {character.id === 'tangtang' && (
        <>
          {/* 糖果厨师 — 厨师帽 */}
          <mesh position={[0, 1.58, 0]}>
            <cylinderGeometry args={[0.15, 0.18, 0.15, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
          <mesh position={[0, 1.68, 0]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
        </>
      )}
      {character.id === 'asong' && (
        <>
          {/* 森林侦探 — 侦探帽 */}
          <mesh position={[0, 1.52, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.28, 0.06, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.18, 0.2, 0.12, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
        </>
      )}
      {character.id === 'yueyue' && (
        <>
          {/* 月光魔术师 — 尖顶帽 */}
          <mesh position={[0, 1.65, 0]}>
            <coneGeometry args={[0.2, 0.35, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
          <mesh position={[0, 1.48, 0]}>
            <torusGeometry args={[0.22, 0.03, 8, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
        </>
      )}
      {/* 默认耳朵 */}
      {!['duoduo', 'tangtang', 'asong', 'yueyue'].includes(character.id) && (
        <>
          <mesh position={[-0.28, 1.48, 0]} castShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
          <mesh position={[0.28, 1.48, 0]} castShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
        </>
      )}
      {/* 眼睛 */}
      <Eye position={[-0.14, 1.18, 0.36]} size={0.06} />
      <Eye position={[0.14, 1.18, 0.36]} size={0.06} />
      {/* 腮红 */}
      <Blush position={[-0.24, 1.08, 0.38]} color="#ffb3c6" size={0.065} />
      <Blush position={[0.24, 1.08, 0.38]} color="#ffb3c6" size={0.065} />
      {/* 嘴巴 */}
      <mesh position={[0, 1.05, 0.4]}>
        <torusGeometry args={[0.04, 0.01, 8, 12, Math.PI]} />
        <meshPhysicalMaterial color="#5c4033" roughness={0.3} />
      </mesh>
      {/* 手臂 */}
      <mesh position={[-0.38, 0.6, 0.05]} rotation={[0, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.08, 0.2, 6, 12]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      <mesh position={[0.38, 0.6, 0.05]} rotation={[0, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.08, 0.2, 6, 12]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* 脚 */}
      <mesh position={[-0.15, 0.12, 0.08]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <primitive object={accentMat} attach="material" />
      </mesh>
      <mesh position={[0.15, 0.12, 0.08]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <primitive object={accentMat} attach="material" />
      </mesh>
    </group>
  );
}

export function Character3D({ character, position, rotation, playerName, vitality, friendship, isActive, isDreaming }: Character3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // 活跃玩家呼吸动画
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    if (isActive) {
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.03;
      groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.02;
    }
    if (haloRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.1;
      haloRef.current.scale.setScalar(scale);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = isActive ? 0.4 + Math.sin(t * 3) * 0.2 : 0;
    }
  });

  const renderCharacter = () => {
    if (!character) return null;
    if (character.id === 'yier') return <YierCharacter />;
    if (character.id === 'bubu') return <BubuCharacter />;
    return <GenericCharacter character={character} />;
  };

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* 活跃光环 */}
      <mesh ref={haloRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* 角色本体 — 做梦状态显示Zzz */}
      <group>
        {renderCharacter()}
      </group>

      {/* 玩家名牌 */}
      <group position={[0, 1.85, 0]}>
        <RoundedBox args={[0.9, 0.22, 0.02]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial
            color={isActive ? '#fff4d6' : '#ffffff'}
            roughness={0.2}
            clearcoat={0.8}
            transparent
            opacity={0.92}
          />
        </RoundedBox>
        <Text
          position={[0, 0, 0.015]}
          fontSize={0.1}
          color={isActive ? '#b8860b' : '#4a4a4a'}
          anchorX="center"
          anchorY="middle"
          maxWidth={0.8}
        >
          {playerName}
        </Text>
      </group>

      {/* 活力值 — 心形 */}
      <group position={[-0.25, 1.65, 0]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[i * 0.1, 0, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshPhysicalMaterial
              color={i < vitality ? '#ff6b6b' : '#ddd'}
              roughness={0.2}
              clearcoat={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* 友情值 — 星星 */}
      <group position={[0.2, 1.65, 0]}>
        {Array.from({ length: Math.min(friendship, 6) }).map((_, i) => (
          <mesh key={i} position={[i * 0.08, 0, 0]}>
            <octahedronGeometry args={[0.035, 0]} />
            <meshPhysicalMaterial color="#ffd700" roughness={0.15} clearcoat={1} emissive="#ffd700" emissiveIntensity={0.3} />
          </mesh>
        ))}
      </group>

      {/* 做梦状态 — Zzz */}
      {isDreaming && (
        <Float speed={2} rotationIntensity={0} floatIntensity={1}>
          <Text position={[0.3, 1.5, 0.3]} fontSize={0.12} color="#999">
            Zzz
          </Text>
        </Float>
      )}
    </group>
  );
}
