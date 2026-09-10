import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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

/* ============================================================
   基础可爱组件 — 所有角色共用
   ============================================================ */

/** 精致眼睛 — 眼白+虹膜+瞳孔+双层高光 */
function CuteEye({ position, lookDir = 0, blink = false }: { position: [number, number, number]; lookDir?: number; blink?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0.01]} scale={blink ? [1, 0.1, 1] : [1, 1, 1]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.15} />
      </mesh>
      <mesh position={[lookDir * 0.018, -0.006, 0.055]} scale={blink ? [1, 0.1, 1] : [1, 1, 1]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#2d1810" roughness={0.1} />
      </mesh>
      <mesh position={[lookDir * 0.02 - 0.014, 0.016, 0.09]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[lookDir * 0.02 + 0.01, -0.012, 0.085]}>
        <sphereGeometry args={[0.007, 6, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/** 腮红 */
function Blush({ position, color = '#ffb3c6', size = 0.055 }: { position: [number, number, number]; color?: string; size?: number }) {
  return (
    <mesh position={position}>
      <circleGeometry args={[size, 20]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** 微笑嘴巴 */
function SmileMouth({ position, open = false, size = 1 }: { position: [number, number, number]; open?: boolean; size?: number }) {
  if (open) {
    return (
      <group position={position} scale={size}>
        <mesh>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#b03050" roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.014, 0.022]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#ff8fa3" roughness={0.35} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={position} rotation={[0, 0, 0]} scale={size}>
      <torusGeometry args={[0.045, 0.014, 8, 18, Math.PI]} />
      <meshStandardMaterial color="#4a2a1a" roughness={0.35} />
    </mesh>
  );
}

/** 圆润身体 */
function CuteBody({ color, bellyColor, scale = 1 }: { color: string; bellyColor: string; scale?: number }) {
  return (
    <group position={[0, 0.38, 0]} scale={scale}>
      <mesh castShadow>
        <capsuleGeometry args={[0.24, 0.22, 8, 18]} />
        <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={0.5} clearcoatRoughness={0.25} />
      </mesh>
      <mesh position={[0, -0.03, 0.19]}>
        <sphereGeometry args={[0.15, 18, 18]} />
        <meshPhysicalMaterial color={bellyColor} roughness={0.4} clearcoat={0.3} />
      </mesh>
    </group>
  );
}

/** 小短手 */
function CuteArm({ position, color, rotation = 0, scale = 1 }: { position: [number, number, number]; color: string; rotation?: number; scale?: number }) {
  return (
    <mesh position={position} rotation={[0, 0, rotation]} scale={scale} castShadow>
      <capsuleGeometry args={[0.065, 0.13, 6, 14]} />
      <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={0.4} />
    </mesh>
  );
}

/** 小短脚 */
function CuteLeg({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <capsuleGeometry args={[0.075, 0.07, 6, 14]} />
      <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.45} />
    </mesh>
  );
}

/** 圆耳朵 */
function RoundEar({ position, color, innerColor, size = 0.11 }: { position: [number, number, number]; color: string; innerColor?: string; size?: number }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[size, 18, 18]} />
        <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.45} />
      </mesh>
      {innerColor && (
        <mesh position={[0, -0.01, 0.04]}>
          <sphereGeometry args={[size * 0.55, 14, 14]} />
          <meshStandardMaterial color={innerColor} roughness={0.45} />
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
      <CuteBody color="#f8f4ee" bellyColor="#fffaf5" />
      <CuteArm position={[-0.27, 0.42, 0.06]} color="#f8f4ee" rotation={0.35} />
      <CuteArm position={[0.27, 0.42, 0.06]} color="#f8f4ee" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#2a2a2a" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#2a2a2a" />

      {/* 头部 */}
      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#f8f4ee" roughness={0.28} clearcoat={0.55} clearcoatRoughness={0.22} />
        </mesh>
        <RoundEar position={[-0.22, 0.23, -0.03]} color="#2a2a2a" size={0.105} />
        <RoundEar position={[0.22, 0.23, -0.03]} color="#2a2a2a" size={0.105} />
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#ffb3c6" size={0.05} />
        <Blush position={[0.19, -0.04, 0.28]} color="#ffb3c6" size={0.05} />
        <SmileMouth position={[0, -0.1, 0.31]} open />
        <mesh position={[0, -0.015, 0.32]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.15} />
        </mesh>
      </group>

      {/* 黑色蝴蝶领结 */}
      <group position={[0, 0.64, 0.21]}>
        <mesh position={[-0.065, 0, 0]} rotation={[0, 0, 0.35]}>
          <boxGeometry args={[0.09, 0.055, 0.025]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.22} clearcoat={0.65} />
        </mesh>
        <mesh position={[0.065, 0, 0]} rotation={[0, 0, -0.35]}>
          <boxGeometry args={[0.09, 0.055, 0.025]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.22} clearcoat={0.65} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.22} clearcoat={0.65} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   布布 — 棕色小熊，棕圆耳朵，黄腮红，温和微笑
   ============================================================ */
function BubuCharacter() {
  return (
    <group>
      <CuteBody color="#a67c52" bellyColor="#d4a574" />
      <CuteArm position={[-0.27, 0.42, 0.06]} color="#a67c52" rotation={0.35} />
      <CuteArm position={[0.27, 0.42, 0.06]} color="#a67c52" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#8b6340" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#8b6340" />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#a67c52" roughness={0.3} clearcoat={0.5} clearcoatRoughness={0.25} />
        </mesh>
        <RoundEar position={[-0.23, 0.21, -0.03]} color="#8b6340" innerColor="#d4a574" size={0.115} />
        <RoundEar position={[0.23, 0.21, -0.03]} color="#8b6340" innerColor="#d4a574" size={0.115} />
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#ffd93d" size={0.055} />
        <Blush position={[0.19, -0.04, 0.28]} color="#ffd93d" size={0.055} />
        <SmileMouth position={[0, -0.1, 0.31]} />
        <mesh position={[0, -0.015, 0.32]}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshStandardMaterial color="#4a3020" roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.065, 0.29]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color="#d4a574" roughness={0.4} />
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
      <CuteArm position={[-0.27, 0.42, 0.06]} color="#e8f4fd" rotation={0.35} />
      <CuteArm position={[0.27, 0.42, 0.06]} color="#e8f4fd" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#4a90d9" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#4a90d9" />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#f0f8ff" roughness={0.28} clearcoat={0.55} />
        </mesh>
        <RoundEar position={[-0.22, 0.22, -0.03]} color="#e8f4fd" size={0.1} />
        <RoundEar position={[0.22, 0.22, -0.03]} color="#e8f4fd" size={0.1} />
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#a8d8ff" size={0.05} />
        <Blush position={[0.19, -0.04, 0.28]} color="#a8d8ff" size={0.05} />
        <SmileMouth position={[0, -0.1, 0.31]} />
      </group>

      {/* 邮差帽 */}
      <group position={[0, 1.18, 0]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.19, 0.21, 0.09, 20]} />
          <meshPhysicalMaterial color="#4a90d9" roughness={0.28} clearcoat={0.5} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 0.03, 20]} />
          <meshPhysicalMaterial color="#357abd" roughness={0.28} clearcoat={0.5} />
        </mesh>
        <mesh position={[0, 0.06, 0.19]}>
          <planeGeometry args={[0.08, 0.06]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      </group>

      {/* 邮包 */}
      <mesh position={[0.28, 0.35, 0.1]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.12, 0.15, 0.08]} />
        <meshPhysicalMaterial color="#8b6340" roughness={0.4} clearcoat={0.3} />
      </mesh>
    </group>
  );
}

/* ============================================================
   糖糖 — 糖果厨师，粉白色，厨师帽
   ============================================================ */
function TangtangCharacter() {
  return (
    <group>
      <CuteBody color="#ffe4ec" bellyColor="#fff5f8" />
      <CuteArm position={[-0.27, 0.42, 0.06]} color="#ffe4ec" rotation={0.35} />
      <CuteArm position={[0.27, 0.42, 0.06]} color="#ffe4ec" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#ff8fab" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#ff8fab" />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#fff0f5" roughness={0.28} clearcoat={0.55} />
        </mesh>
        <RoundEar position={[-0.22, 0.22, -0.03]} color="#ffe4ec" size={0.1} />
        <RoundEar position={[0.22, 0.22, -0.03]} color="#ffe4ec" size={0.1} />
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#ffb3c6" size={0.055} />
        <Blush position={[0.19, -0.04, 0.28]} color="#ffb3c6" size={0.055} />
        <SmileMouth position={[0, -0.1, 0.31]} open />
      </group>

      {/* 厨师帽 */}
      <group position={[0, 1.22, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.35} clearcoat={0.3} />
        </mesh>
        <mesh position={[-0.1, 0.06, 0.05]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.35} clearcoat={0.3} />
        </mesh>
        <mesh position={[0.1, 0.06, 0.05]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.35} clearcoat={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.07, 20]} />
          <meshPhysicalMaterial color="#f5f5f5" roughness={0.3} clearcoat={0.4} />
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
      <CuteArm position={[-0.27, 0.42, 0.06]} color="#c8b89a" rotation={0.35} />
      <CuteArm position={[0.27, 0.42, 0.06]} color="#c8b89a" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#6b5a45" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#6b5a45" />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#d4c4a8" roughness={0.3} clearcoat={0.5} />
        </mesh>
        <RoundEar position={[-0.22, 0.22, -0.03]} color="#c8b89a" size={0.1} />
        <RoundEar position={[0.22, 0.22, -0.03]} color="#c8b89a" size={0.1} />
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#d4a574" size={0.05} />
        <Blush position={[0.19, -0.04, 0.28]} color="#d4a574" size={0.05} />
        <SmileMouth position={[0, -0.1, 0.31]} />
      </group>

      {/* 侦探帽 */}
      <group position={[0, 1.16, 0]} rotation={[0, 0, 0.06]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.11, 20]} />
          <meshPhysicalMaterial color="#5d4e37" roughness={0.3} clearcoat={0.45} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 0.03, 20]} />
          <meshPhysicalMaterial color="#4a3d2a" roughness={0.3} clearcoat={0.45} />
        </mesh>
      </group>

      {/* 放大镜 */}
      <group position={[0.3, 0.45, 0.15]} rotation={[0, 0, -0.5]}>
        <mesh>
          <torusGeometry args={[0.06, 0.012, 8, 20]} />
          <meshPhysicalMaterial color="#c0c0c0" roughness={0.15} clearcoat={0.8} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
          <meshPhysicalMaterial color="#8b6340" roughness={0.35} />
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
      <CuteArm position={[-0.27, 0.42, 0.06]} color="#d4c5e8" rotation={0.35} />
      <CuteArm position={[0.27, 0.42, 0.06]} color="#d4c5e8" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#6b4c9a" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#6b4c9a" />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#e0d5f0" roughness={0.28} clearcoat={0.55} />
        </mesh>
        <RoundEar position={[-0.22, 0.22, -0.03]} color="#d4c5e8" size={0.1} />
        <RoundEar position={[0.22, 0.22, -0.03]} color="#d4c5e8" size={0.1} />
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#c9a0dc" size={0.05} />
        <Blush position={[0.19, -0.04, 0.28]} color="#c9a0dc" size={0.05} />
        <SmileMouth position={[0, -0.1, 0.31]} />
      </group>

      {/* 巫师帽 */}
      <group position={[0, 1.25, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.16, 0.28, 24]} />
          <meshPhysicalMaterial color="#6b4c9a" roughness={0.25} clearcoat={0.55} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.035, 24]} />
          <meshPhysicalMaterial color="#5a3d8a" roughness={0.25} clearcoat={0.55} />
        </mesh>
        {/* 星星装饰 */}
        <mesh position={[0.06, 0.18, 0.12]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
        <mesh position={[-0.05, 0.1, 0.14]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#87ceeb" />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   小扳 — 玩具修理师，橙黄色，护目镜
   ============================================================ */
function XiaobanCharacter() {
  return (
    <group>
      <CuteBody color="#ffd4a3" bellyColor="#ffe8cc" />
      <CuteArm position={[-0.27, 0.42, 0.06]} color="#ffd4a3" rotation={0.35} />
      <CuteArm position={[0.27, 0.42, 0.06]} color="#ffd4a3" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#e67e22" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#e67e22" />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#ffddb3" roughness={0.28} clearcoat={0.55} />
        </mesh>
        <RoundEar position={[-0.22, 0.22, -0.03]} color="#ffd4a3" size={0.1} />
        <RoundEar position={[0.22, 0.22, -0.03]} color="#ffd4a3" size={0.1} />
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#ffb347" size={0.05} />
        <Blush position={[0.19, -0.04, 0.28]} color="#ffb347" size={0.05} />
        <SmileMouth position={[0, -0.1, 0.31]} open />
      </group>

      {/* 护目镜 */}
      <group position={[0, 0.92, 0.3]}>
        <mesh position={[-0.09, 0, 0]}>
          <torusGeometry args={[0.055, 0.016, 8, 20]} />
          <meshPhysicalMaterial color="#ff8c00" roughness={0.2} clearcoat={0.7} metalness={0.4} />
        </mesh>
        <mesh position={[0.09, 0, 0]}>
          <torusGeometry args={[0.055, 0.016, 8, 20]} />
          <meshPhysicalMaterial color="#ff8c00" roughness={0.2} clearcoat={0.7} metalness={0.4} />
        </mesh>
        <mesh position={[-0.09, 0, 0.005]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color="#87ceeb" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.09, 0, 0.005]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color="#87ceeb" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* 工具腰带 */}
      <mesh position={[0, 0.32, 0.2]}>
        <boxGeometry args={[0.4, 0.05, 0.04]} />
        <meshPhysicalMaterial color="#8b4513" roughness={0.4} />
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
      <CuteArm position={[-0.27, 0.42, 0.06]} color="#ffd6e8" rotation={0.35} />
      <CuteArm position={[0.27, 0.42, 0.06]} color="#ffd6e8" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#ff6b9d" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#ff6b9d" />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#ffe0f0" roughness={0.26} clearcoat={0.6} />
        </mesh>
        <RoundEar position={[-0.22, 0.22, -0.03]} color="#ffd6e8" size={0.1} />
        <RoundEar position={[0.22, 0.22, -0.03]} color="#ffd6e8" size={0.1} />
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#ff8fab" size={0.055} />
        <Blush position={[0.19, -0.04, 0.28]} color="#ff8fab" size={0.055} />
        <SmileMouth position={[0, -0.1, 0.31]} open />
      </group>

      {/* 蝴蝶结 */}
      <group position={[0.16, 1.12, 0.12]}>
        <mesh position={[-0.045, 0, 0]} rotation={[0, 0, 0.4]}>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshPhysicalMaterial color="#ff6b9d" roughness={0.28} clearcoat={0.55} />
        </mesh>
        <mesh position={[0.045, 0, 0]} rotation={[0, 0, -0.4]}>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshPhysicalMaterial color="#ff6b9d" roughness={0.28} clearcoat={0.55} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshPhysicalMaterial color="#ff4081" roughness={0.25} clearcoat={0.6} />
        </mesh>
      </group>

      {/* 麦克风 */}
      <group position={[0.28, 0.5, 0.18]} rotation={[0, 0, -0.6]}>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshPhysicalMaterial color="#c0c0c0" roughness={0.15} clearcoat={0.8} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.012, 0.015, 0.12, 8]} />
          <meshPhysicalMaterial color="#333333" roughness={0.3} />
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
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.26, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
        <meshPhysicalMaterial color="#f0f4ff" roughness={0.2} clearcoat={0.6} transparent opacity={0.85} />
      </mesh>
      {/* 幽灵底部波浪 */}
      <mesh position={[-0.12, 0.22, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshPhysicalMaterial color="#f0f4ff" roughness={0.2} clearcoat={0.6} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshPhysicalMaterial color="#f0f4ff" roughness={0.2} clearcoat={0.6} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.12, 0.22, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshPhysicalMaterial color="#f0f4ff" roughness={0.2} clearcoat={0.6} transparent opacity={0.85} />
      </mesh>

      {/* 小手臂 */}
      <CuteArm position={[-0.24, 0.5, 0.05]} color="#f0f4ff" rotation={0.5} scale={0.85} />
      <CuteArm position={[0.24, 0.5, 0.05]} color="#f0f4ff" rotation={-0.5} scale={0.85} />

      {/* 头部 */}
      <group position={[0, 0.85, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 36, 36]} />
          <meshPhysicalMaterial color="#f5f8ff" roughness={0.22} clearcoat={0.65} transparent opacity={0.9} />
        </mesh>
        <CuteEye position={[-0.1, 0.04, 0.28]} />
        <CuteEye position={[0.1, 0.04, 0.28]} />
        <Blush position={[-0.17, -0.03, 0.26]} color="#b8d4ff" size={0.045} />
        <Blush position={[0.17, -0.03, 0.26]} color="#b8d4ff" size={0.045} />
        {/* 胆小的小嘴 */}
        <mesh position={[0, -0.09, 0.29]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color="#6b8bbf" roughness={0.3} />
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
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshPhysicalMaterial color="#fff5f5" roughness={0.28} clearcoat={0.55} />
      </mesh>
      <mesh position={[0, 0.35, 0.24]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.35} clearcoat={0.3} />
      </mesh>

      <CuteArm position={[-0.28, 0.45, 0.08]} color="#fff5f5" rotation={0.4} scale={0.9} />
      <CuteArm position={[0.28, 0.45, 0.08]} color="#fff5f5" rotation={-0.4} scale={0.9} />
      <CuteLeg position={[-0.12, 0.1, 0]} color="#ffb3c6" scale={0.85} />
      <CuteLeg position={[0.12, 0.1, 0]} color="#ffb3c6" scale={0.85} />

      <group position={[0, 0.82, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 36, 36]} />
          <meshPhysicalMaterial color="#fff8f8" roughness={0.26} clearcoat={0.6} />
        </mesh>
        <CuteEye position={[-0.11, 0.04, 0.29]} />
        <CuteEye position={[0.11, 0.04, 0.29]} />
        <Blush position={[-0.18, -0.03, 0.27]} color="#ffb3c6" size={0.055} />
        <Blush position={[0.18, -0.03, 0.27]} color="#ffb3c6" size={0.055} />
        <SmileMouth position={[0, -0.09, 0.3]} open size={0.9} />
      </group>

      {/* 头顶小叶子 */}
      <mesh position={[0, 1.15, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.035, 0.09, 8]} />
        <meshStandardMaterial color="#7cb342" roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ============================================================
   画画 — 梦境画师，彩虹色，贝雷帽，画笔
   ============================================================ */
function HuahuaCharacter() {
  return (
    <group>
      <CuteBody color="#e8d5f5" bellyColor="#f5ebfa" />
      <CuteArm position={[-0.27, 0.42, 0.06]} color="#e8d5f5" rotation={0.35} />
      <CuteArm position={[0.27, 0.42, 0.06]} color="#e8d5f5" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#9c27b0" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#9c27b0" />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#f0e0fa" roughness={0.28} clearcoat={0.55} />
        </mesh>
        <RoundEar position={[-0.22, 0.22, -0.03]} color="#e8d5f5" size={0.1} />
        <RoundEar position={[0.22, 0.22, -0.03]} color="#e8d5f5" size={0.1} />
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#ce93d8" size={0.05} />
        <Blush position={[0.19, -0.04, 0.28]} color="#ce93d8" size={0.05} />
        <SmileMouth position={[0, -0.1, 0.31]} />
      </group>

      {/* 贝雷帽 */}
      <group position={[0, 1.15, 0]}>
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.17, 24, 24]} />
          <meshPhysicalMaterial color="#e57373" roughness={0.32} clearcoat={0.45} />
        </mesh>
        <mesh position={[0.1, 0.06, 0.06]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshPhysicalMaterial color="#c62828" roughness={0.3} clearcoat={0.5} />
        </mesh>
      </group>

      {/* 画笔 */}
      <group position={[0.3, 0.48, 0.15]} rotation={[0, 0, -0.7]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.01, 0.012, 0.15, 8]} />
          <meshPhysicalMaterial color="#8b4513" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <coneGeometry args={[0.02, 0.06, 8]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.4} />
        </mesh>
      </group>

      {/* 调色板 */}
      <mesh position={[-0.28, 0.35, 0.12]} rotation={[0, 0, 0.3]}>
        <circleGeometry args={[0.08, 20]} />
        <meshPhysicalMaterial color="#deb887" roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ============================================================
   咔咔 — 发条骑士，银蓝色，头盔，铠甲
   ============================================================ */
function KakaCharacter() {
  return (
    <group>
      <CuteBody color="#b0bec5" bellyColor="#cfd8dc" scale={1.05} />
      <CuteArm position={[-0.28, 0.42, 0.06]} color="#90a4ae" rotation={0.35} />
      <CuteArm position={[0.28, 0.42, 0.06]} color="#90a4ae" rotation={-0.35} />
      <CuteLeg position={[-0.11, 0.07, 0]} color="#607d8b" />
      <CuteLeg position={[0.11, 0.07, 0]} color="#607d8b" />

      <group position={[0, 0.88, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 36, 36]} />
          <meshPhysicalMaterial color="#cfd8dc" roughness={0.18} clearcoat={0.75} metalness={0.4} />
        </mesh>
        <CuteEye position={[-0.115, 0.04, 0.3]} />
        <CuteEye position={[0.115, 0.04, 0.3]} />
        <Blush position={[-0.19, -0.04, 0.28]} color="#90caf9" size={0.045} />
        <Blush position={[0.19, -0.04, 0.28]} color="#90caf9" size={0.045} />
        <SmileMouth position={[0, -0.1, 0.31]} />
      </group>

      {/* 骑士头盔 */}
      <group position={[0, 0.98, 0]}>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.3, 28, 28, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#b0bec5" roughness={0.15} clearcoat={0.8} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.05, 0.1, 0.16]} />
          <meshPhysicalMaterial color="#90a4ae" roughness={0.15} clearcoat={0.8} metalness={0.5} />
        </mesh>
        {/* 头盔羽饰 */}
        <mesh position={[0, 0.28, 0]}>
          <coneGeometry args={[0.025, 0.12, 8]} />
          <meshStandardMaterial color="#e53935" roughness={0.3} />
        </mesh>
      </group>

      {/* 胸前铠甲 */}
      <mesh position={[0, 0.42, 0.22]}>
        <boxGeometry args={[0.3, 0.25, 0.04]} />
        <meshPhysicalMaterial color="#90a4ae" roughness={0.18} clearcoat={0.75} metalness={0.5} />
      </mesh>

      {/* 发条钥匙 */}
      <group position={[0, 0.7, -0.2]}>
        <mesh>
          <torusGeometry args={[0.05, 0.015, 8, 16]} />
          <meshPhysicalMaterial color="#ffd700" roughness={0.15} clearcoat={0.8} metalness={0.6} />
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
    groupRef.current.position.y = position[1] + Math.sin(t * 1.8 + position[0] * 2) * 0.025;
    if (isActive) {
      groupRef.current.rotation.z = Math.sin(t * 2.2) * 0.035;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.12}>
        <CharacterModel character={character} />
      </Float>

      {/* 名字牌 */}
      {playerName && (
        <group position={[0, 1.5, 0]}>
          <mesh>
            <planeGeometry args={[0.95, 0.24]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
          </mesh>
          <Text
            position={[0, 0, 0.012]}
            fontSize={0.11}
            color={isActive ? '#2196f3' : '#4a3a2a'}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.88}
            fontWeight="bold"
          >
            {playerName}
          </Text>
        </group>
      )}

      {/* 活力心心 */}
      <group position={[-0.22, 1.35, 0]}>
        {Array.from({ length: Math.min(vitality, 4) }).map((_, i) => (
          <mesh key={i} position={[i * 0.1, 0, 0]}>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshBasicMaterial color="#ff5252" />
          </mesh>
        ))}
      </group>

      {/* 友情值 */}
      {friendship > 0 && (
        <group position={[0.22, 1.35, 0]}>
          {Array.from({ length: Math.min(friendship, 6) }).map((_, i) => (
            <mesh key={i} position={[i * 0.08, 0, 0]}>
              <sphereGeometry args={[0.032, 10, 10]} />
              <meshBasicMaterial color="#ff80ab" />
            </mesh>
          ))}
        </group>
      )}

      {/* 活跃光环 */}
      {isActive && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.46, 40]} />
          <meshBasicMaterial color="#2196f3" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 梦境状态 */}
      {isDreaming && (
        <group position={[0.3, 1.55, 0]}>
          <Text fontSize={0.13} color="#9575cd" anchorX="center" fontWeight="bold">
            zzz
          </Text>
        </group>
      )}
    </group>
  );
}
