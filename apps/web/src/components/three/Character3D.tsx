import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Character } from '@yierbubu/shared';

interface Character3DProps {
  character?: Character;
  position: [number, number, number];
  rotation: [number, number, number];
  playerName?: string;
  vitality?: number;
  friendship?: number;
  isActive?: boolean;
  isDreaming?: boolean;
}

/** 角色图片精灵 — 圆形裁剪+精致边框，billboard面向相机 */
function CharacterSprite({ characterId }: { characterId?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [aspect, setAspect] = React.useState(1);

  const texture = useMemo(() => {
    if (!characterId) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(
      `/characters/${characterId}.png`,
      (loaded) => {
        const img = loaded.image as HTMLImageElement;
        if (img && img.width && img.height) {
          setAspect(img.width / img.height);
        }
      }
    );
    tex.anisotropy = 16;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [characterId]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.lookAt(state.camera.position);
  });

  if (!texture) return null;

  // 根据图片比例计算显示尺寸，高度固定1.35
  const height = 1.35;
  const width = Math.min(height * aspect, 1.2);

  return (
    <group ref={groupRef}>
      {/* 背后光晕 */}
      <mesh position={[0, 0.8, -0.06]}>
        <circleGeometry args={[0.78, 48]} />
        <meshBasicMaterial color="#fff3e0" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* 头像框背板 */}
      <mesh position={[0, 0.8, -0.03]}>
        <circleGeometry args={[0.72, 48]} />
        <meshStandardMaterial color="#fffaf0" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* 金色边框 */}
      <mesh position={[0, 0.8, -0.01]}>
        <ringGeometry args={[0.68, 0.74, 48]} />
        <meshStandardMaterial color="#ffd54f" roughness={0.25} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* 角色图片 — 保持原始比例 */}
      <mesh position={[0, 0.8, 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.02}
          roughness={0.35}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** 精致底座 — 圆形平台+阴影 */
function CharacterBase({ isActive }: { isActive: boolean }) {
  return (
    <group position={[0, 0.02, 0]}>
      {/* 主底座 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.5, 40]} />
        <meshStandardMaterial color={isActive ? '#e3f2fd' : '#f5e6d3'} roughness={0.6} />
      </mesh>
      {/* 底座边缘 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.46, 0.52, 40]} />
        <meshStandardMaterial color={isActive ? '#2196f3' : '#d4a574'} roughness={0.4} />
      </mesh>
      {/* 内圈装饰 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[0.35, 0.37, 40]} />
        <meshBasicMaterial color={isActive ? '#64b5f6' : '#e8c99b'} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/** 活力心心 */
function VitalityHearts({ vitality }: { vitality: number }) {
  return (
    <group position={[-0.2, 1.65, 0]}>
      {Array.from({ length: Math.min(Math.max(vitality, 0), 4) }).map((_, i) => (
        <mesh key={i} position={[i * 0.12, 0, 0]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#ff5252" />
        </mesh>
      ))}
      {vitality <= 0 && (
        <Text position={[0.1, 0, 0]} fontSize={0.08} color="#999" anchorX="center">
          已休息
        </Text>
      )}
    </group>
  );
}

/** 友情值星星 */
function FriendshipStars({ friendship }: { friendship: number }) {
  if (friendship <= 0) return null;
  return (
    <group position={[0.2, 1.65, 0]}>
      {Array.from({ length: Math.min(friendship, 6) }).map((_, i) => (
        <mesh key={i} position={[i * 0.09, 0, 0]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color="#ff80ab" />
        </mesh>
      ))}
    </group>
  );
}

/** 名字牌 */
function NamePlate({ name, isActive }: { name: string; isActive: boolean }) {
  return (
    <group position={[0, 1.52, 0]}>
      <mesh>
        <planeGeometry args={[1.0, 0.22]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.96, 0.18]} />
        <meshBasicMaterial color={isActive ? '#e3f2fd' : '#fafafa'} transparent opacity={0.8} />
      </mesh>
      <Text
        position={[0, 0, 0.012]}
        fontSize={0.11}
        color={isActive ? '#1565c0' : '#4a3a2a'}
        anchorX="center"
        anchorY="middle"
        maxWidth={0.9}
        fontWeight="bold"
      >
        {name}
      </Text>
    </group>
  );
}

/** 活跃光环 */
function ActiveRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.6, 40, 1, 0, Math.PI * 1.5]} />
      <meshBasicMaterial color="#2196f3" transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** 梦境状态 */
function DreamingZzz() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 1.7 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    }
  });
  return (
    <group ref={ref} position={[0.35, 1.7, 0]}>
      <Text fontSize={0.14} color="#9575cd" anchorX="center" fontWeight="bold">
        zzz
      </Text>
    </group>
  );
}

/* ============================================================
   主组件
   ============================================================ */
export function Character3D({
  character,
  position,
  rotation,
  playerName,
  vitality = 4,
  friendship = 0,
  isActive = false,
  isDreaming = false,
}: Character3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // 整体轻微浮动
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0] * 3) * 0.02;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.08}>
        <Suspense fallback={null}>
          <CharacterSprite characterId={character?.id} />
        </Suspense>
      </Float>

      {/* 底座 */}
      <CharacterBase isActive={isActive} />

      {/* 名字牌 */}
      {playerName && <NamePlate name={playerName} isActive={isActive} />}

      {/* 活力值 */}
      <VitalityHearts vitality={vitality} />

      {/* 友情值 */}
      <FriendshipStars friendship={friendship} />

      {/* 活跃光环 */}
      {isActive && <ActiveRing />}

      {/* 梦境状态 */}
      {isDreaming && <DreamingZzz />}
    </group>
  );
}
