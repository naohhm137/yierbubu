import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text, RoundedBox } from '@react-three/drei';
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

/* ============================================================
   精致材质预设
   ============================================================ */
const skinMat = (color: string) => (
  <meshPhysicalMaterial
    color={color}
    roughness={0.55}
    clearcoat={0.15}
    clearcoatRoughness={0.6}
    sheen={0.4}
    sheenColor={new THREE.Color(color).offsetHSL(0, 0.1, 0.15)}
    sheenRoughness={0.7}
  />
);

const furMat = (color: string) => (
  <meshPhysicalMaterial
    color={color}
    roughness={0.75}
    clearcoat={0.08}
    sheen={0.6}
    sheenColor={new THREE.Color(color).offsetHSL(0, 0.05, 0.2)}
    sheenRoughness={0.85}
  />
);

/* ============================================================
   精致眼睛 — 眼白+虹膜+瞳孔+三层高光+眼底反光
   ============================================================ */
function CuteEye({ position, lookDir = 0 }: { position: [number, number, number]; lookDir?: number }) {
  return (
    <group position={position}>
      {/* 眼白 */}
      <mesh position={[0, 0, 0.005]}>
        <sphereGeometry args={[0.085, 24, 24]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.15} clearcoat={0.8} clearcoatRoughness={0.1} />
      </mesh>
      {/* 虹膜 */}
      <mesh position={[lookDir * 0.02, -0.008, 0.05]}>
        <sphereGeometry args={[0.052, 20, 20]} />
        <meshPhysicalMaterial color="#3d2817" roughness={0.12} clearcoat={0.9} clearcoatRoughness={0.05} />
      </mesh>
      {/* 瞳孔 */}
      <mesh position={[lookDir * 0.022, -0.008, 0.088]}>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshStandardMaterial color="#1a0f08" roughness={0.08} />
      </mesh>
      {/* 主高光 */}
      <mesh position={[lookDir * 0.015 - 0.016, 0.02, 0.11]}>
        <sphereGeometry args={[0.016, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* 次高光 */}
      <mesh position={[lookDir * 0.028 + 0.01, -0.018, 0.105]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      {/* 眼底反光 */}
      <mesh position={[lookDir * 0.01, -0.035, 0.09]}>
        <sphereGeometry args={[0.006, 8, 8]} />
        <meshBasicMaterial color="#ffb3c6" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* 腮红 — 柔和渐变 */
function Blush({ position, color = '#ffb3c6', size = 0.06 }: { position: [number, number, number]; color?: string; size?: number }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color + 'cc');
    g.addColorStop(0.5, color + '66');
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, [color]);
  return (
    <mesh position={position}>
      <circleGeometry args={[size, 24]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/* 微笑嘴 */
function SmileMouth({ position, open = false, size = 1 }: { position: [number, number, number]; open?: boolean; size?: number }) {
  if (open) {
    return (
      <group position={position} scale={size}>
        <mesh>
          <sphereGeometry args={[0.042, 16, 16]} />
          <meshStandardMaterial color="#8b2040" roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.016, 0.025]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial color="#ff8fa3" roughness={0.4} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={position} rotation={[0, 0, 0]} scale={size}>
      <torusGeometry args={[0.048, 0.016, 10, 24, Math.PI]} />
      <meshStandardMaterial color="#3d1f10" roughness={0.4} />
    </mesh>
  );
}

/* 圆润身体 — 用球+变形，不是简单胶囊 */
function CuteBody({ color, bellyColor, scale = 1 }: { color: string; bellyColor: string; scale?: number }) {
  return (
    <group position={[0, 0.4, 0]} scale={scale}>
      {/* 主躯干 */}
      <mesh castShadow position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        {furMat(color)}
      </mesh>
      {/* 下腹部 */}
      <mesh castShadow position={[0, -0.12, 0.02]}>
        <sphereGeometry args={[0.22, 28, 28]} />
        {furMat(color)}
      </mesh>
      {/* 肚皮 */}
      <mesh position={[0, -0.02, 0.21]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshPhysicalMaterial color={bellyColor} roughness={0.6} sheen={0.3} sheenRoughness={0.8} />
      </mesh>
    </group>
  );
}

/* 小短手 */
function CuteArm({ position, color, rotation = 0, scale = 1 }: { position: [number, number, number]; color: string; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, 0, rotation]} scale={scale}>
      <mesh castShadow position={[0, -0.06, 0]}>
        <capsuleGeometry args={[0.06, 0.1, 8, 16]} />
        {furMat(color)}
      </mesh>
      {/* 手掌 */}
      <mesh castShadow position={[0, -0.14, 0.02]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        {furMat(color)}
      </mesh>
    </group>
  );
}

/* 小短脚 */
function CuteLeg({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, -0.04, 0]}>
        <capsuleGeometry args={[0.07, 0.06, 8, 16]} />
        {furMat(color)}
      </mesh>
      <mesh castShadow position={[0, -0.11, 0.04]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        {furMat(color)}
      </mesh>
    </group>
  );
}

/* 圆耳朵 */
function RoundEar({ position, color, innerColor, size = 0.11 }: { position: [number, number, number]; color: string; innerColor?: string; size?: number }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[size, 24, 24]} />
        {furMat(color)}
      </mesh>
      {innerColor && (
        <mesh position={[0, -0.015, 0.045]}>
          <sphereGeometry args={[size * 0.55, 18, 18]} />
          <meshStandardMaterial color={innerColor} roughness={0.55} />
        </mesh>
      )}
    </group>
  );
}

/* ============================================================
   一二 — 白色小熊猫，黑圆耳朵，黑蝴蝶领结，粉腮红，吐舌
   ============================================================ */
function YierCharacter() {
  return (
    <group>
      <CuteBody color="#f5f0e8" bellyColor="#fffaf5" />
      <CuteArm position={[-0.28, 0.44, 0.08]} color="#f5f0e8" rotation={0.4} />
      <CuteArm position={[0.28, 0.44, 0.08]} color="#f5f0e8" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#2a2a2a" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#2a2a2a" />

      {/* 头部 */}
      <group position={[0, 0.9, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.35, 40, 40]} />
          {furMat('#f5f0e8')}
        </mesh>
        <RoundEar position={[-0.23, 0.24, -0.04]} color="#2a2a2a" size={0.11} />
        <RoundEar position={[0.23, 0.24, -0.04]} color="#2a2a2a" size={0.11} />
        <CuteEye position={[-0.12, 0.05, 0.31]} />
        <CuteEye position={[0.12, 0.05, 0.31]} />
        <Blush position={[-0.2, -0.03, 0.29]} color="#ffb3c6" size={0.055} />
        <Blush position={[0.2, -0.03, 0.29]} color="#ffb3c6" size={0.055} />
        <SmileMouth position={[0, -0.1, 0.32]} open />
        {/* 鼻子 */}
        <mesh position={[0, -0.01, 0.33]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.2} />
        </mesh>
      </group>

      {/* 黑色蝴蝶领结 */}
      <group position={[0, 0.66, 0.22]}>
        <mesh position={[-0.07, 0, 0]} rotation={[0, 0, 0.4]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.25} clearcoat={0.7} clearcoatRoughness={0.2} />
        </mesh>
        <mesh position={[0.07, 0, 0]} rotation={[0, 0, -0.4]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.25} clearcoat={0.7} clearcoatRoughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.25} clearcoat={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   布布 — 棕色小熊，棕耳朵，黄腮红，温和微笑
   ============================================================ */
function BubuCharacter() {
  return (
    <group>
      <CuteBody color="#a67c52" bellyColor="#d4a574" />
      <CuteArm position={[-0.28, 0.44, 0.08]} color="#a67c52" rotation={0.4} />
      <CuteArm position={[0.28, 0.44, 0.08]} color="#a67c52" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#8b6340" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#8b6340" />

      <group position={[0, 0.9, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.35, 40, 40]} />
          {furMat('#a67c52')}
        </mesh>
        <RoundEar position={[-0.24, 0.22, -0.04]} color="#8b6340" innerColor="#d4a574" size={0.12} />
        <RoundEar position={[0.24, 0.22, -0.04]} color="#8b6340" innerColor="#d4a574" size={0.12} />
        <CuteEye position={[-0.12, 0.05, 0.31]} />
        <CuteEye position={[0.12, 0.05, 0.31]} />
        <Blush position={[-0.2, -0.03, 0.29]} color="#ffd93d" size={0.06} />
        <Blush position={[0.2, -0.03, 0.29]} color="#ffd93d" size={0.06} />
        <SmileMouth position={[0, -0.1, 0.32]} />
        <mesh position={[0, -0.01, 0.33]}>
          <sphereGeometry args={[0.026, 12, 12]} />
          <meshStandardMaterial color="#4a3020" roughness={0.2} />
        </mesh>
        {/* 嘴周浅色 */}
        <mesh position={[0, -0.07, 0.3]}>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshStandardMaterial color="#d4a574" roughness={0.55} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   朵朵 — 云朵邮差，蓝白色，邮差帽，邮包
   ============================================================ */
function DuoduoCharacter() {
  return (
    <group>
      <CuteBody color="#e8f4fd" bellyColor="#ffffff" />
      <CuteArm position={[-0.28, 0.44, 0.08]} color="#e8f4fd" rotation={0.4} />
      <CuteArm position={[0.28, 0.44, 0.08]} color="#e8f4fd" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#4a90d9" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#4a90d9" />

      <group position={[0, 0.9, 0]}>
        {/* 云朵状头部 — 多个球组合 */}
        <mesh castShadow><sphereGeometry args={[0.32, 32, 32]} />{furMat('#f0f8ff')}</mesh>
        <mesh castShadow position={[-0.22, 0.1, 0]}><sphereGeometry args={[0.18, 24, 24]} />{furMat('#f0f8ff')}</mesh>
        <mesh castShadow position={[0.22, 0.1, 0]}><sphereGeometry args={[0.18, 24, 24]} />{furMat('#f0f8ff')}</mesh>
        <mesh castShadow position={[0, 0.22, -0.05]}><sphereGeometry args={[0.2, 24, 24]} />{furMat('#f0f8ff')}</mesh>
        <CuteEye position={[-0.11, 0.04, 0.3]} />
        <CuteEye position={[0.11, 0.04, 0.3]} />
        <Blush position={[-0.18, -0.03, 0.28]} color="#a8d8ff" size={0.05} />
        <Blush position={[0.18, -0.03, 0.28]} color="#a8d8ff" size={0.05} />
        <SmileMouth position={[0, -0.09, 0.31]} />
      </group>

      {/* 邮差帽 */}
      <group position={[0, 1.18, 0]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.1, 24]} />
          <meshPhysicalMaterial color="#4a90d9" roughness={0.3} clearcoat={0.5} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.035, 24]} />
          <meshPhysicalMaterial color="#357abd" roughness={0.3} clearcoat={0.5} />
        </mesh>
        {/* 徽章 */}
        <mesh position={[0, 0.06, 0.21]}>
          <circleGeometry args={[0.04, 16]} />
          <meshPhysicalMaterial color="#ffd700" roughness={0.2} metalness={0.6} clearcoat={0.8} />
        </mesh>
      </group>

      {/* 邮包 */}
      <mesh position={[0.3, 0.35, 0.12]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.14, 0.17, 0.09]} />
        <meshPhysicalMaterial color="#8b6340" roughness={0.45} clearcoat={0.3} />
      </mesh>
    </group>
  );
}

/* ============================================================
   糖糖 — 糖果厨师，粉白色，蓬松厨师帽
   ============================================================ */
function TangtangCharacter() {
  return (
    <group>
      <CuteBody color="#ffe4ec" bellyColor="#fff5f8" />
      <CuteArm position={[-0.28, 0.44, 0.08]} color="#ffe4ec" rotation={0.4} />
      <CuteArm position={[0.28, 0.44, 0.08]} color="#ffe4ec" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#ff8fab" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#ff8fab" />

      <group position={[0, 0.9, 0]}>
        <mesh castShadow><sphereGeometry args={[0.34, 36, 36]} />{furMat('#fff0f5')}</mesh>
        <CuteEye position={[-0.115, 0.04, 0.31]} />
        <CuteEye position={[0.115, 0.04, 0.31]} />
        <Blush position={[-0.19, -0.03, 0.29]} color="#ffb3c6" size={0.055} />
        <Blush position={[0.19, -0.03, 0.29]} color="#ffb3c6" size={0.055} />
        <SmileMouth position={[0, -0.09, 0.32]} open />
      </group>

      {/* 蓬松厨师帽 — 多个球 */}
      <group position={[0, 1.22, 0]}>
        <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.17, 24, 24]} />{furMat('#ffffff')}</mesh>
        <mesh position={[-0.11, 0.06, 0.05]}><sphereGeometry args={[0.11, 20, 20]} />{furMat('#ffffff')}</mesh>
        <mesh position={[0.11, 0.06, 0.05]}><sphereGeometry args={[0.11, 20, 20]} />{furMat('#ffffff')}</mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.08, 24]} />
          <meshPhysicalMaterial color="#f5f5f5" roughness={0.35} clearcoat={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   阿松 — 森林侦探，绿棕色，侦探帽，放大镜
   ============================================================ */
function AsongCharacter() {
  return (
    <group>
      <CuteBody color="#c8b89a" bellyColor="#e8dcc8" />
      <CuteArm position={[-0.28, 0.44, 0.08]} color="#c8b89a" rotation={0.4} />
      <CuteArm position={[0.28, 0.44, 0.08]} color="#c8b89a" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#6b5a45" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#6b5a45" />

      <group position={[0, 0.9, 0]}>
        <mesh castShadow><sphereGeometry args={[0.34, 36, 36]} />{furMat('#d4c4a8')}</mesh>
        <CuteEye position={[-0.115, 0.04, 0.31]} />
        <CuteEye position={[0.115, 0.04, 0.31]} />
        <Blush position={[-0.19, -0.03, 0.29]} color="#d4a574" size={0.05} />
        <Blush position={[0.19, -0.03, 0.29]} color="#d4a574" size={0.05} />
        <SmileMouth position={[0, -0.09, 0.32]} />
      </group>

      {/* 侦探帽 */}
      <group position={[0, 1.16, 0]} rotation={[0, 0, 0.05]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.12, 24]} />
          <meshPhysicalMaterial color="#5d4e37" roughness={0.35} clearcoat={0.45} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.035, 24]} />
          <meshPhysicalMaterial color="#4a3d2a" roughness={0.35} clearcoat={0.45} />
        </mesh>
      </group>

      {/* 放大镜 */}
      <group position={[0.32, 0.48, 0.18]} rotation={[0, 0, -0.5]}>
        <mesh>
          <torusGeometry args={[0.065, 0.014, 10, 24]} />
          <meshPhysicalMaterial color="#c0c0c0" roughness={0.15} clearcoat={0.85} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.013, 0.013, 0.11, 8]} />
          <meshPhysicalMaterial color="#8b6340" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   月月 — 月光魔术师，紫蓝色，巫师帽，星星
   ============================================================ */
function YueyueCharacter() {
  return (
    <group>
      <CuteBody color="#d4c5e8" bellyColor="#ece4f5" />
      <CuteArm position={[-0.28, 0.44, 0.08]} color="#d4c5e8" rotation={0.4} />
      <CuteArm position={[0.28, 0.44, 0.08]} color="#d4c5e8" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#6b4c9a" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#6b4c9a" />

      <group position={[0, 0.9, 0]}>
        <mesh castShadow><sphereGeometry args={[0.34, 36, 36]} />{furMat('#e0d5f0')}</mesh>
        <CuteEye position={[-0.115, 0.04, 0.31]} />
        <CuteEye position={[0.115, 0.04, 0.31]} />
        <Blush position={[-0.19, -0.03, 0.29]} color="#c9a0dc" size={0.05} />
        <Blush position={[0.19, -0.03, 0.29]} color="#c9a0dc" size={0.05} />
        <SmileMouth position={[0, -0.09, 0.32]} />
      </group>

      {/* 巫师帽 */}
      <group position={[0, 1.26, 0]}>
        <mesh position={[0, 0.13, 0]}>
          <coneGeometry args={[0.17, 0.3, 28]} />
          <meshPhysicalMaterial color="#6b4c9a" roughness={0.28} clearcoat={0.55} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 28]} />
          <meshPhysicalMaterial color="#5a3d8a" roughness={0.28} clearcoat={0.55} />
        </mesh>
        {/* 星星装饰 */}
        <mesh position={[0.06, 0.2, 0.13]}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
        <mesh position={[-0.05, 0.1, 0.15]}>
          <sphereGeometry args={[0.016, 8, 8]} />
          <meshBasicMaterial color="#87ceeb" />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   小扳 — 玩具修理师，橙黄色，护目镜，工具腰带
   ============================================================ */
function XiaobanCharacter() {
  return (
    <group>
      <CuteBody color="#ffd4a3" bellyColor="#ffe8cc" />
      <CuteArm position={[-0.28, 0.44, 0.08]} color="#ffd4a3" rotation={0.4} />
      <CuteArm position={[0.28, 0.44, 0.08]} color="#ffd4a3" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#e67e22" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#e67e22" />

      <group position={[0, 0.9, 0]}>
        <mesh castShadow><sphereGeometry args={[0.34, 36, 36]} />{furMat('#ffddb3')}</mesh>
        <CuteEye position={[-0.115, 0.04, 0.31]} />
        <CuteEye position={[0.115, 0.04, 0.31]} />
        <Blush position={[-0.19, -0.03, 0.29]} color="#ffb347" size={0.05} />
        <Blush position={[0.19, -0.03, 0.29]} color="#ffb347" size={0.05} />
        <SmileMouth position={[0, -0.09, 0.32]} open />
      </group>

      {/* 护目镜 */}
      <group position={[0, 0.94, 0.31]}>
        <mesh position={[-0.095, 0, 0]}>
          <torusGeometry args={[0.058, 0.017, 10, 24]} />
          <meshPhysicalMaterial color="#ff8c00" roughness={0.2} clearcoat={0.75} metalness={0.5} />
        </mesh>
        <mesh position={[0.095, 0, 0]}>
          <torusGeometry args={[0.058, 0.017, 10, 24]} />
          <meshPhysicalMaterial color="#ff8c00" roughness={0.2} clearcoat={0.75} metalness={0.5} />
        </mesh>
        <mesh position={[-0.095, 0, 0.006]}>
          <circleGeometry args={[0.042, 18]} />
          <meshPhysicalMaterial color="#a8d8ff" roughness={0.08} clearcoat={0.9} transparent opacity={0.75} />
        </mesh>
        <mesh position={[0.095, 0, 0.006]}>
          <circleGeometry args={[0.042, 18]} />
          <meshPhysicalMaterial color="#a8d8ff" roughness={0.08} clearcoat={0.9} transparent opacity={0.75} />
        </mesh>
      </group>

      {/* 工具腰带 */}
      <mesh position={[0, 0.34, 0.21]}>
        <boxGeometry args={[0.42, 0.055, 0.045]} />
        <meshPhysicalMaterial color="#8b4513" roughness={0.45} clearcoat={0.3} />
      </mesh>
    </group>
  );
}

/* ============================================================
   咪咪 — 星星歌手，粉金色，蝴蝶结，麦克风
   ============================================================ */
function MimiCharacter() {
  return (
    <group>
      <CuteBody color="#ffd6e8" bellyColor="#fff0f7" />
      <CuteArm position={[-0.28, 0.44, 0.08]} color="#ffd6e8" rotation={0.4} />
      <CuteArm position={[0.28, 0.44, 0.08]} color="#ffd6e8" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#ff6b9d" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#ff6b9d" />

      <group position={[0, 0.9, 0]}>
        <mesh castShadow><sphereGeometry args={[0.34, 36, 36]} />{furMat('#ffe0f0')}</mesh>
        <CuteEye position={[-0.115, 0.04, 0.31]} />
        <CuteEye position={[0.115, 0.04, 0.31]} />
        <Blush position={[-0.19, -0.03, 0.29]} color="#ff8fab" size={0.055} />
        <Blush position={[0.19, -0.03, 0.29]} color="#ff8fab" size={0.055} />
        <SmileMouth position={[0, -0.09, 0.32]} open />
      </group>

      {/* 蝴蝶结 */}
      <group position={[0.17, 1.14, 0.13]}>
        <mesh position={[-0.05, 0, 0]} rotation={[0, 0, 0.45]}>
          <sphereGeometry args={[0.06, 18, 18]} />
          <meshPhysicalMaterial color="#ff6b9d" roughness={0.3} clearcoat={0.55} />
        </mesh>
        <mesh position={[0.05, 0, 0]} rotation={[0, 0, -0.45]}>
          <sphereGeometry args={[0.06, 18, 18]} />
          <meshPhysicalMaterial color="#ff6b9d" roughness={0.3} clearcoat={0.55} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshPhysicalMaterial color="#ff4081" roughness={0.28} clearcoat={0.6} />
        </mesh>
      </group>

      {/* 麦克风 */}
      <group position={[0.3, 0.52, 0.2]} rotation={[0, 0, -0.65]}>
        <mesh position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshPhysicalMaterial color="#c0c0c0" roughness={0.15} clearcoat={0.85} metalness={0.75} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.013, 0.016, 0.13, 10]} />
          <meshPhysicalMaterial color="#333333" roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   悄悄 — 胆小幽灵，白色半透明，幽灵形状
   ============================================================ */
function QiaoqiaoCharacter() {
  return (
    <group>
      {/* 幽灵身体 — 波浪底部 */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <sphereGeometry args={[0.28, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
        <meshPhysicalMaterial color="#f0f4ff" roughness={0.25} clearcoat={0.6} transparent opacity={0.88} />
      </mesh>
      <mesh position={[-0.13, 0.24, 0]}><sphereGeometry args={[0.09, 18, 18]} /><meshPhysicalMaterial color="#f0f4ff" transparent opacity={0.88} /></mesh>
      <mesh position={[0, 0.22, 0]}><sphereGeometry args={[0.1, 18, 18]} /><meshPhysicalMaterial color="#f0f4ff" transparent opacity={0.88} /></mesh>
      <mesh position={[0.13, 0.24, 0]}><sphereGeometry args={[0.09, 18, 18]} /><meshPhysicalMaterial color="#f0f4ff" transparent opacity={0.88} /></mesh>

      <CuteArm position={[-0.25, 0.52, 0.06]} color="#f0f4ff" rotation={0.5} scale={0.85} />
      <CuteArm position={[0.25, 0.52, 0.06]} color="#f0f4ff" rotation={-0.5} scale={0.85} />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.33, 38, 38]} />
          <meshPhysicalMaterial color="#f5f8ff" roughness={0.22} clearcoat={0.65} transparent opacity={0.92} />
        </mesh>
        <CuteEye position={[-0.105, 0.04, 0.3]} />
        <CuteEye position={[0.105, 0.04, 0.3]} />
        <Blush position={[-0.17, -0.02, 0.28]} color="#b8d4ff" size={0.048} />
        <Blush position={[0.17, -0.02, 0.28]} color="#b8d4ff" size={0.048} />
        {/* 胆小的小嘴 */}
        <mesh position={[0, -0.08, 0.3]}>
          <sphereGeometry args={[0.027, 12, 12]} />
          <meshStandardMaterial color="#6b8bbf" roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   团团 — 淘气团子，白粉色，圆滚滚，小叶子
   ============================================================ */
function TuantuanCharacter() {
  return (
    <group>
      {/* 圆滚滚身体 */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.32, 36, 36]} />
        {furMat('#fff5f5')}
      </mesh>
      <mesh position={[0, 0.37, 0.25]}>
        <sphereGeometry args={[0.19, 24, 24]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.4} sheen={0.3} />
      </mesh>

      <CuteArm position={[-0.29, 0.47, 0.09]} color="#fff5f5" rotation={0.45} scale={0.9} />
      <CuteArm position={[0.29, 0.47, 0.09]} color="#fff5f5" rotation={-0.45} scale={0.9} />
      <CuteLeg position={[-0.13, 0.1, 0]} color="#ffb3c6" scale={0.85} />
      <CuteLeg position={[0.13, 0.1, 0]} color="#ffb3c6" scale={0.85} />

      <group position={[0, 0.84, 0]}>
        <mesh castShadow><sphereGeometry args={[0.33, 38, 38]} />{furMat('#fff8f8')}</mesh>
        <CuteEye position={[-0.11, 0.04, 0.3]} />
        <CuteEye position={[0.11, 0.04, 0.3]} />
        <Blush position={[-0.18, -0.02, 0.28]} color="#ffb3c6" size={0.058} />
        <Blush position={[0.18, -0.02, 0.28]} color="#ffb3c6" size={0.058} />
        <SmileMouth position={[0, -0.08, 0.31]} open size={0.9} />
      </group>

      {/* 头顶小叶子 */}
      <mesh position={[0, 1.17, 0]} rotation={[0, 0, 0.35]}>
        <coneGeometry args={[0.038, 0.1, 10]} />
        <meshStandardMaterial color="#7cb342" roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ============================================================
   画画 — 梦境画师，彩虹色，贝雷帽，画笔，调色板
   ============================================================ */
function HuahuaCharacter() {
  return (
    <group>
      <CuteBody color="#e8d5f5" bellyColor="#f5ebfa" />
      <CuteArm position={[-0.28, 0.44, 0.08]} color="#e8d5f5" rotation={0.4} />
      <CuteArm position={[0.28, 0.44, 0.08]} color="#e8d5f5" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#9c27b0" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#9c27b0" />

      <group position={[0, 0.9, 0]}>
        <mesh castShadow><sphereGeometry args={[0.34, 36, 36]} />{furMat('#f0e0fa')}</mesh>
        <CuteEye position={[-0.115, 0.04, 0.31]} />
        <CuteEye position={[0.115, 0.04, 0.31]} />
        <Blush position={[-0.19, -0.03, 0.29]} color="#ce93d8" size={0.05} />
        <Blush position={[0.19, -0.03, 0.29]} color="#ce93d8" size={0.05} />
        <SmileMouth position={[0, -0.09, 0.32]} />
      </group>

      {/* 贝雷帽 */}
      <group position={[0, 1.17, 0]}>
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.18, 28, 28]} />
          <meshPhysicalMaterial color="#e57373" roughness={0.35} clearcoat={0.45} />
        </mesh>
        <mesh position={[0.11, 0.07, 0.07]}>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshPhysicalMaterial color="#c62828" roughness={0.32} clearcoat={0.5} />
        </mesh>
      </group>

      {/* 画笔 */}
      <group position={[0.31, 0.5, 0.17]} rotation={[0, 0, -0.75]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.011, 0.013, 0.16, 10]} />
          <meshPhysicalMaterial color="#8b4513" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <coneGeometry args={[0.022, 0.07, 10]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.45} />
        </mesh>
      </group>

      {/* 调色板 */}
      <mesh position={[-0.29, 0.37, 0.14]} rotation={[0, 0, 0.35]}>
        <circleGeometry args={[0.085, 24]} />
        <meshPhysicalMaterial color="#deb887" roughness={0.45} clearcoat={0.3} />
      </mesh>
    </group>
  );
}

/* ============================================================
   咔咔 — 发条骑士，银蓝色，头盔，铠甲，发条钥匙
   ============================================================ */
function KakaCharacter() {
  return (
    <group>
      <CuteBody color="#b0bec5" bellyColor="#cfd8dc" scale={1.05} />
      <CuteArm position={[-0.29, 0.44, 0.08]} color="#90a4ae" rotation={0.4} />
      <CuteArm position={[0.29, 0.44, 0.08]} color="#90a4ae" rotation={-0.4} />
      <CuteLeg position={[-0.12, 0.08, 0]} color="#607d8b" />
      <CuteLeg position={[0.12, 0.08, 0]} color="#607d8b" />

      <group position={[0, 0.9, 0]}>
        <mesh castShadow><sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#cfd8dc" roughness={0.2} clearcoat={0.75} metalness={0.45} />
        </mesh>
        <CuteEye position={[-0.115, 0.04, 0.31]} />
        <CuteEye position={[0.115, 0.04, 0.31]} />
        <Blush position={[-0.19, -0.03, 0.29]} color="#90caf9" size={0.048} />
        <Blush position={[0.19, -0.03, 0.29]} color="#90caf9" size={0.048} />
        <SmileMouth position={[0, -0.09, 0.32]} />
      </group>

      {/* 骑士头盔 */}
      <group position={[0, 1.0, 0]}>
        <mesh position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.31, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#b0bec5" roughness={0.18} clearcoat={0.8} metalness={0.55} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.055, 0.11, 0.18]} />
          <meshPhysicalMaterial color="#90a4ae" roughness={0.18} clearcoat={0.8} metalness={0.55} />
        </mesh>
        {/* 头盔羽饰 */}
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.028, 0.13, 10]} />
          <meshStandardMaterial color="#e53935" roughness={0.35} />
        </mesh>
      </group>

      {/* 胸前铠甲 */}
      <mesh position={[0, 0.44, 0.23]}>
        <boxGeometry args={[0.32, 0.27, 0.05]} />
        <meshPhysicalMaterial color="#90a4ae" roughness={0.2} clearcoat={0.75} metalness={0.55} />
      </mesh>

      {/* 发条钥匙 */}
      <group position={[0, 0.72, -0.22]}>
        <mesh>
          <torusGeometry args={[0.055, 0.017, 10, 20]} />
          <meshPhysicalMaterial color="#ffd700" roughness={0.15} clearcoat={0.85} metalness={0.65} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   角色路由
   ============================================================ */
function CharacterModel({ character }: { character?: Character }) {
  switch (character?.id) {
    case 'yier': return <YierCharacter />;
    case 'bubu': return <BubuCharacter />;
    case 'duoduo': return <DuoduoCharacter />;
    case 'tangtang': return <TangtangCharacter />;
    case 'asong': return <AsongCharacter />;
    case 'yueyue': return <YueyueCharacter />;
    case 'xiaoban': return <XiaobanCharacter />;
    case 'mimi': return <MimiCharacter />;
    case 'qiaoqiao': return <QiaoqiaoCharacter />;
    case 'tuantuan': return <TuantuanCharacter />;
    case 'huahua': return <HuahuaCharacter />;
    case 'kaka': return <KakaCharacter />;
    default: return <BubuCharacter />;
  }
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
    groupRef.current.position.y = position[1] + Math.sin(t * 1.6 + position[0] * 2.5) * 0.022;
    if (isActive) {
      groupRef.current.rotation.z = Math.sin(t * 2) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.1}>
        <CharacterModel character={character} />
      </Float>

      {/* 名字牌 */}
      {playerName && (
        <group position={[0, 1.55, 0]}>
          <mesh>
            <planeGeometry args={[1.0, 0.24]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.93} />
          </mesh>
          <Text
            position={[0, 0, 0.012]}
            fontSize={0.11}
            color={isActive ? '#1565c0' : '#4a3a2a'}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.92}
            fontWeight="bold"
          >
            {playerName}
          </Text>
        </group>
      )}

      {/* 活力心心 */}
      <group position={[-0.22, 1.7, 0]}>
        {Array.from({ length: Math.min(Math.max(vitality, 0), 4) }).map((_, i) => (
          <mesh key={i} position={[i * 0.11, 0, 0]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color="#ff5252" />
          </mesh>
        ))}
      </group>

      {/* 友情值 */}
      {friendship > 0 && (
        <group position={[0.22, 1.7, 0]}>
          {Array.from({ length: Math.min(friendship, 6) }).map((_, i) => (
            <mesh key={i} position={[i * 0.09, 0, 0]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshBasicMaterial color="#ff80ab" />
            </mesh>
          ))}
        </group>
      )}

      {/* 活跃光环 */}
      {isActive && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.48, 48]} />
          <meshBasicMaterial color="#2196f3" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 梦境状态 */}
      {isDreaming && (
        <group position={[0.35, 1.75, 0]}>
          <Text fontSize={0.14} color="#9575cd" anchorX="center" fontWeight="bold">zzz</Text>
        </group>
      )}
    </group>
  );
}
