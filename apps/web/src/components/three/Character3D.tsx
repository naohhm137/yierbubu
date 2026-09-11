import React, { useRef, useMemo, Suspense, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text, Billboard, RoundedBox } from '@react-three/drei';
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
  isTargetable?: boolean;
}

/* ============================================================
   精致材质 — 毛绒sheen + 次表面散射 + 清漆
   ============================================================ */
function FurMaterial({ color, sheen = 0.7 }: { color: string; sheen?: number }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.65}
      clearcoat={0.12}
      clearcoatRoughness={0.55}
      sheen={sheen}
      sheenColor={new THREE.Color(color).offsetHSL(0, 0.08, 0.18)}
      sheenRoughness={0.8}
    />
  );
}

function SkinMaterial({ color }: { color: string }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.45}
      clearcoat={0.25}
      clearcoatRoughness={0.4}
      sheen={0.35}
      sheenColor={new THREE.Color(color).offsetHSL(0, 0.1, 0.15)}
    />
  );
}

/* ============================================================
   精致眼睛 — 眼白+虹膜+瞳孔+双层高光+眼底反光
   ============================================================ */
function CuteEye({ position, size = 0.07, blink = 0 }: { position: [number, number, number]; size?: number; blink?: number }) {
  const scaleY = 1 - blink * 0.9;
  return (
    <group position={position} scale={[1, scaleY, 1]}>
      {/* 眼白 */}
      <mesh position={[0, 0, 0.002]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.12} clearcoat={0.9} clearcoatRoughness={0.08} />
      </mesh>
      {/* 虹膜 */}
      <mesh position={[0, -size * 0.08, size * 0.55]}>
        <sphereGeometry args={[size * 0.58, 24, 24]} />
        <meshPhysicalMaterial color="#2d1810" roughness={0.1} clearcoat={0.95} clearcoatRoughness={0.05} />
      </mesh>
      {/* 瞳孔 */}
      <mesh position={[0, -size * 0.08, size * 0.85]}>
        <sphereGeometry args={[size * 0.32, 16, 16]} />
        <meshStandardMaterial color="#0a0503" roughness={0.06} />
      </mesh>
      {/* 主高光 */}
      <mesh position={[-size * 0.18, size * 0.25, size * 1.05]}>
        <sphereGeometry args={[size * 0.2, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* 次高光 */}
      <mesh position={[size * 0.22, -size * 0.2, size * 0.98]}>
        <sphereGeometry args={[size * 0.1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      {/* 眼底反光 */}
      <mesh position={[0, -size * 0.38, size * 0.85]}>
        <sphereGeometry args={[size * 0.08, 8, 8]} />
        <meshBasicMaterial color="#ffb3c6" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* 腮红 — canvas径向渐变 */
function Blush({ position, color = '#ff9eb5', size = 0.075 }: { position: [number, number, number]; color?: string; size?: number }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color + 'dd');
    g.addColorStop(0.4, color + '88');
    g.addColorStop(0.75, color + '33');
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, [color]);
  return (
    <mesh position={position}>
      <circleGeometry args={[size, 32]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/* ============================================================
   一二 — 真正的3D人形模型（基于原型精确比例）
   二头身：大头小身体，黑圆耳朵，黑蝴蝶领结，粉腮红，吐舌
   ============================================================ */
function YierModel({ blink }: { blink: number }) {
  return (
    <group>
      {/* 身体 — 小而圆（二头身，身体更小） */}
      <group position={[0, 0.3, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 48, 48]} />
          <FurMaterial color="#f8f4ee" />
        </mesh>
        {/* 肚皮 */}
        <mesh position={[0, -0.02, 0.15]}>
          <sphereGeometry args={[0.13, 32, 32]} />
          <SkinMaterial color="#fffaf5" />
        </mesh>
      </group>

      {/* 左手 — 更小 */}
      <mesh position={[-0.24, 0.34, 0.07]} castShadow>
        <sphereGeometry args={[0.08, 24, 24]} />
        <FurMaterial color="#f8f4ee" />
      </mesh>
      {/* 右手 */}
      <mesh position={[0.24, 0.34, 0.07]} castShadow>
        <sphereGeometry args={[0.08, 24, 24]} />
        <FurMaterial color="#f8f4ee" />
      </mesh>

      {/* 左脚 */}
      <mesh position={[-0.11, 0.07, 0.08]} castShadow>
        <sphereGeometry args={[0.095, 24, 24]} />
        <meshPhysicalMaterial color="#2a2a2a" roughness={0.4} clearcoat={0.3} />
      </mesh>
      {/* 右脚 */}
      <mesh position={[0.11, 0.07, 0.08]} castShadow>
        <sphereGeometry args={[0.095, 24, 24]} />
        <meshPhysicalMaterial color="#2a2a2a" roughness={0.4} clearcoat={0.3} />
      </mesh>

      {/* 小尾巴 */}
      <mesh position={[0, 0.28, -0.2]} castShadow>
        <sphereGeometry args={[0.06, 20, 20]} />
        <FurMaterial color="#f8f4ee" />
      </mesh>

      {/* 头部 — 非常大的圆（二头身，头占2/3） */}
      <group position={[0, 0.78, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.4, 64, 64]} />
          <FurMaterial color="#f8f4ee" sheen={0.75} />
        </mesh>

        {/* 左耳 — 黑色实心圆，更靠近头顶 */}
        <mesh position={[-0.26, 0.32, -0.03]} castShadow>
          <sphereGeometry args={[0.115, 32, 32]} />
          <meshPhysicalMaterial color="#1f1f1f" roughness={0.5} clearcoat={0.2} sheen={0.4} />
        </mesh>
        {/* 右耳 */}
        <mesh position={[0.26, 0.32, -0.03]} castShadow>
          <sphereGeometry args={[0.115, 32, 32]} />
          <meshPhysicalMaterial color="#1f1f1f" roughness={0.5} clearcoat={0.2} sheen={0.4} />
        </mesh>

        {/* 眼睛 — 更小，间距更大 */}
        <CuteEye position={[-0.14, 0.07, 0.35]} size={0.06} blink={blink} />
        <CuteEye position={[0.14, 0.07, 0.35]} size={0.06} blink={blink} />

        {/* 腮红 — 更大 */}
        <Blush position={[-0.23, -0.05, 0.32]} color="#ff9eb5" size={0.08} />
        <Blush position={[0.23, -0.05, 0.32]} color="#ff9eb5" size={0.08} />

        {/* 鼻子 */}
        <mesh position={[0, -0.01, 0.38]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#1f1f1f" roughness={0.25} />
        </mesh>

        {/* 嘴巴 — 吐舌 */}
        <group position={[0, -0.11, 0.36]}>
          <mesh>
            <torusGeometry args={[0.042, 0.014, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#3d1f10" roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.02, 0.012]}>
            <sphereGeometry args={[0.024, 16, 16]} />
            <meshPhysicalMaterial color="#ff8fa3" roughness={0.35} clearcoat={0.4} />
          </mesh>
        </group>
      </group>

      {/* 头身衔接 — 脖子 */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <FurMaterial color="#f8f4ee" />
      </mesh>

      {/* 黑色蝴蝶领结 — 更高位置，靠近头底部 */}
      <group position={[0, 0.54, 0.18]}>
        <mesh position={[-0.075, 0, 0]} rotation={[0, 0, 0.45]} castShadow>
          <sphereGeometry args={[0.065, 24, 24]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.28} clearcoat={0.65} clearcoatRoughness={0.2} />
        </mesh>
        <mesh position={[0.075, 0, 0]} rotation={[0, 0, -0.45]} castShadow>
          <sphereGeometry args={[0.065, 24, 24]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.28} clearcoat={0.65} clearcoatRoughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.25} clearcoat={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   布布 — 真正的3D人形模型
   棕色小熊，棕耳朵，黄腮红，温和微笑
   ============================================================ */
function BubuModel({ blink }: { blink: number }) {
  return (
    <group>
      {/* 身体 */}
      <group position={[0, 0.3, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.21, 48, 48]} />
          <FurMaterial color="#b8895a" />
        </mesh>
        {/* 肚皮 */}
        <mesh position={[0, -0.02, 0.15]}>
          <sphereGeometry args={[0.14, 32, 32]} />
          <SkinMaterial color="#d4a574" />
        </mesh>
      </group>

      {/* 左手 */}
      <mesh position={[-0.25, 0.34, 0.07]} castShadow>
        <sphereGeometry args={[0.082, 24, 24]} />
        <FurMaterial color="#b8895a" />
      </mesh>
      {/* 右手 */}
      <mesh position={[0.25, 0.34, 0.07]} castShadow>
        <sphereGeometry args={[0.082, 24, 24]} />
        <FurMaterial color="#b8895a" />
      </mesh>

      {/* 左脚 */}
      <mesh position={[-0.11, 0.07, 0.08]} castShadow>
        <sphereGeometry args={[0.098, 24, 24]} />
        <FurMaterial color="#9a7040" />
      </mesh>
      {/* 右脚 */}
      <mesh position={[0.11, 0.07, 0.08]} castShadow>
        <sphereGeometry args={[0.098, 24, 24]} />
        <FurMaterial color="#9a7040" />
      </mesh>

      {/* 小尾巴 */}
      <mesh position={[0, 0.28, -0.21]} castShadow>
        <sphereGeometry args={[0.065, 20, 20]} />
        <FurMaterial color="#b8895a" />
      </mesh>

      {/* 头部 */}
      <group position={[0, 0.78, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.4, 64, 64]} />
          <FurMaterial color="#b8895a" sheen={0.75} />
        </mesh>

        {/* 左耳 — 棕色圆耳，内耳浅色 */}
        <group position={[-0.27, 0.28, -0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.125, 32, 32]} />
            <FurMaterial color="#9a7040" />
          </mesh>
          <mesh position={[0, -0.02, 0.05]}>
            <sphereGeometry args={[0.07, 20, 20]} />
            <SkinMaterial color="#d4a574" />
          </mesh>
        </group>
        {/* 右耳 */}
        <group position={[0.27, 0.28, -0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.125, 32, 32]} />
            <FurMaterial color="#9a7040" />
          </mesh>
          <mesh position={[0, -0.02, 0.05]}>
            <sphereGeometry args={[0.07, 20, 20]} />
            <SkinMaterial color="#d4a574" />
          </mesh>
        </group>

        {/* 眼睛 */}
        <CuteEye position={[-0.14, 0.07, 0.35]} size={0.06} blink={blink} />
        <CuteEye position={[0.14, 0.07, 0.35]} size={0.06} blink={blink} />

        {/* 黄色腮红 — 更大 */}
        <Blush position={[-0.23, -0.05, 0.32]} color="#ffd54f" size={0.085} />
        <Blush position={[0.23, -0.05, 0.32]} color="#ffd54f" size={0.085} />

        {/* 嘴周浅色 — 更合适的大小 */}
        <mesh position={[0, -0.09, 0.32]}>
          <sphereGeometry args={[0.09, 28, 28]} />
          <SkinMaterial color="#d4a574" />
        </mesh>

        {/* 鼻子 */}
        <mesh position={[0, -0.02, 0.38]}>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshStandardMaterial color="#4a3020" roughness={0.25} />
        </mesh>

        {/* 微笑嘴 */}
        <mesh position={[0, -0.12, 0.36]}>
          <torusGeometry args={[0.044, 0.014, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#3d1f10" roughness={0.35} />
        </mesh>
      </group>

      {/* 头身衔接 — 脖子 */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <FurMaterial color="#b8895a" />
      </mesh>
    </group>
  );
}

/* ============================================================
   通用配角3D模型 — 用AI生成的3D渲染图作为正面，有厚度的立体牌
   （配角用立体牌，主角用真正3D人形）
   ============================================================ */
function SupportCharacter({ characterId }: { characterId: string }) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(`/characters_3d/${characterId}_3d.png`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, [characterId]);

  const colors: Record<string, string> = {
    duoduo: '#b8d8f0', tangtang: '#ffc8d8', asong: '#8bc34a',
    yueyue: '#9575cd', xiaoban: '#ffb74d', mimi: '#f48fb1',
    qiaoqiao: '#e0e8f8', tuantuan: '#ffd8d8', huahua: '#ba68c8', kaka: '#90a4ae',
  };

  return (
    <group>
      <RoundedBox args={[0.85, 1.2, 0.16]} radius={0.05} smoothness={6} castShadow receiveShadow>
        <meshPhysicalMaterial map={texture} roughness={0.4} clearcoat={0.35} alphaTest={0.05} />
        <meshPhysicalMaterial color={colors[characterId] || '#ccc'} roughness={0.5} />
        <meshPhysicalMaterial color={colors[characterId] || '#ccc'} roughness={0.5} />
        <meshPhysicalMaterial color={colors[characterId] || '#ddd'} roughness={0.45} />
        <meshPhysicalMaterial color="#aaa" roughness={0.55} />
        <meshPhysicalMaterial color={colors[characterId] || '#bbb'} roughness={0.5} />
      </RoundedBox>
      {/* 底座 */}
      <mesh position={[0, -0.7, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.06, 32]} />
        <meshPhysicalMaterial color={colors[characterId] || '#888'} roughness={0.3} clearcoat={0.5} />
      </mesh>
    </group>
  );
}

/* 可选择目标 — 脉冲绿色光环 */
function TargetableRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 0.5 + Math.sin(t * 4) * 0.3;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
  });
  return (
    <mesh ref={ref} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.38, 0.52, 48]} />
      <meshBasicMaterial color="#4caf50" transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* 角色模型路由 */
function CharacterModel({ characterId, blink }: { characterId?: string; blink: number }) {
  if (characterId === 'yier') return <YierModel blink={blink} />;
  if (characterId === 'bubu') return <BubuModel blink={blink} />;
  if (characterId) return <SupportCharacter characterId={characterId} />;
  return <BubuModel blink={blink} />;
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
  isTargetable = false,
}: Character3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [blink, setBlink] = useState(0);

  // 眨眼动画
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const blinkCycle = (t + position[0]) % 4;
    if (blinkCycle > 3.85 && blinkCycle < 4) {
      setBlink(Math.min(1, (blinkCycle - 3.85) / 0.075));
    } else {
      setBlink(0);
    }
  });

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // 呼吸动画 — 更微妙
    const breathe = 1 + Math.sin(t * 1.5 + position[0] * 1.5) * 0.006;
    const pressScale = pressed ? 0.95 : 1;
    groupRef.current.scale.setScalar(breathe * pressScale);
    // 漂浮 — 更微妙，基础位置让脚接触桌面
    groupRef.current.position.y = position[1] - 0.06 + Math.sin(t * 1.1 + position[0] * 2) * 0.008;
    if (isActive) {
      groupRef.current.rotation.z = Math.sin(t * 2) * 0.012;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <Suspense fallback={null}>
        <group scale={0.82}>
          <Float speed={0.6} rotationIntensity={0.015} floatIntensity={0.03}>
            <CharacterModel characterId={character?.id} blink={blink} />
          </Float>
        </group>
      </Suspense>

      {/* 名字牌 */}
      {playerName && (
        <Billboard position={[0, 1.22, 0]}>
          <mesh>
            <planeGeometry args={[0.85, 0.17]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
          <Text
            position={[0, 0, 0.005]}
            fontSize={0.072}
            color={isActive ? '#1565c0' : '#5d4037'}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.78}
            fontWeight="bold"
          >
            {playerName}
          </Text>
        </Billboard>
      )}

      {/* 活力心心 */}
      <Billboard position={[-0.14, 1.38, 0]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[i * 0.085, 0, 0]}>
            <sphereGeometry args={[0.03, 10, 10]} />
            <meshBasicMaterial color={i < vitality ? '#ff5252' : '#e0e0e0'} />
          </mesh>
        ))}
      </Billboard>

      {/* 友情值 */}
      {friendship > 0 && (
        <Billboard position={[0.17, 1.38, 0]}>
          {Array.from({ length: Math.min(friendship, 6) }).map((_, i) => (
            <mesh key={i} position={[i * 0.07, 0, 0]}>
              <sphereGeometry args={[0.024, 8, 8]} />
              <meshBasicMaterial color="#ff80ab" />
            </mesh>
          ))}
        </Billboard>
      )}

      {/* 活跃光环 */}
      {isActive && (
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 48]} />
          <meshBasicMaterial color="#2196f3" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 可选择目标光环 — 脉冲绿色 */}
      {isTargetable && (
        <TargetableRing />
      )}

      {/* 梦境状态 */}
      {isDreaming && (
        <Billboard position={[0.3, 1.5, 0]}>
          <Text fontSize={0.1} color="#9575cd" anchorX="center" fontWeight="bold">💤</Text>
        </Billboard>
      )}
    </group>
  );
}
