import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

/** 温馨的熊熊村小屋场景 — 圆桌、木质地板、暖色墙壁、窗户、装饰 */
export function TableScene() {
  return (
    <group>
      {/* 地板 — 温暖木质 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#e8d5b7" roughness={0.8} />
      </mesh>
      {/* 地板木纹圆环装饰 */}
      {[2, 4, 6, 8, 10].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <ringGeometry args={[r - 0.02, r, 64]} />
          <meshStandardMaterial color="#d4c0a0" roughness={0.9} />
        </mesh>
      ))}

      {/* 圆桌 — 温暖木纹 */}
      <group position={[0, 0.75, 0]}>
        {/* 桌面 */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[2.8, 2.8, 0.12, 64]} />
          <meshStandardMaterial color="#c9a87c" roughness={0.6} />
        </mesh>
        {/* 桌面边缘装饰 */}
        <mesh position={[0, 0.07, 0]}>
          <torusGeometry args={[2.78, 0.04, 16, 64]} />
          <meshStandardMaterial color="#a88860" roughness={0.5} />
        </mesh>
        {/* 桌面中心装饰 — 心愿星图案 */}
        <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 32]} />
          <meshStandardMaterial color="#f5e6d0" roughness={0.7} emissive="#ffd700" emissiveIntensity={0.1} />
        </mesh>
        {/* 桌腿 */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 0.9, 32]} />
          <meshStandardMaterial color="#a88860" roughness={0.7} />
        </mesh>
        {/* 底座 */}
        <mesh position={[0, -0.95, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.7, 0.1, 32]} />
          <meshStandardMaterial color="#8b7355" roughness={0.7} />
        </mesh>
      </group>

      {/* 桌面道具 — 茶杯、点心、小灯 */}
      <TableProps />

      {/* 背景墙壁 — 奶油色温馨小屋 */}
      <BackgroundWalls />

      {/* 窗户 — 透进暖光 */}
      <Window />

      {/* 墙上装饰 — 挂画、架子 */}
      <WallDecor />
    </group>
  );
}

/** 桌面小道具 */
function TableProps() {
  const cupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (cupRef.current) {
      cupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group>
      {/* 茶杯 — 左侧 */}
      <group ref={cupRef} position={[-1.8, 0.88, -0.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.15, 32]} />
          <meshStandardMaterial color="#fff8f0" roughness={0.3} />
        </mesh>
        {/* 茶杯把手 */}
        <mesh position={[0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.05, 0.015, 16, 32]} />
          <meshStandardMaterial color="#fff8f0" roughness={0.3} />
        </mesh>
        {/* 茶的热气 */}
        <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
        </Float>
      </group>

      {/* 小点心盘 — 右侧 */}
      <group position={[1.8, 0.86, 0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.18, 0.03, 32]} />
          <meshStandardMaterial color="#f5e6d0" roughness={0.4} />
        </mesh>
        {/* 马卡龙 */}
        {[[-0.06, 0.04, 0], [0.06, 0.04, 0.02], [0, 0.04, -0.06]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color={['#ffb6c1', '#c1e1c1', '#ffe4b5'][i]} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* 小台灯 — 桌面后方 */}
      <group position={[0, 0.88, -1.8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.02, 32]} />
          <meshStandardMaterial color="#d4a574" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.25, 16]} />
          <meshStandardMaterial color="#d4a574" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <coneGeometry args={[0.12, 0.15, 32, 1, true]} />
          <meshStandardMaterial color="#ffd4a3" roughness={0.4} side={THREE.DoubleSide} emissive="#ffaa55" emissiveIntensity={0.3} />
        </mesh>
        <pointLight position={[0, 0.28, 0]} intensity={0.5} color="#ffd4a3" distance={2} />
      </group>
    </group>
  );
}

/** 背景墙壁 */
function BackgroundWalls() {
  return (
    <group>
      {/* 后墙 */}
      <mesh position={[0, 3, -6]} receiveShadow>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#fdf6ec" roughness={0.9} />
      </mesh>
      {/* 左墙 */}
      <mesh position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#faf0e4" roughness={0.9} />
      </mesh>
      {/* 右墙 */}
      <mesh position={[6, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#faf0e4" roughness={0.9} />
      </mesh>
      {/* 踢脚线 */}
      <mesh position={[0, 0.15, -5.95]}>
        <boxGeometry args={[16, 0.3, 0.1]} />
        <meshStandardMaterial color="#d4c0a0" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** 窗户 — 透进温暖阳光 */
function Window() {
  return (
    <group position={[-4.5, 3.2, -5.9]}>
      {/* 窗框 */}
      <mesh>
        <boxGeometry args={[2.2, 1.8, 0.1]} />
        <meshStandardMaterial color="#c9a87c" roughness={0.6} />
      </mesh>
      {/* 玻璃 */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[1.9, 1.5]} />
        <meshStandardMaterial color="#b8e0f0" roughness={0.1} transparent opacity={0.7} emissive="#87ceeb" emissiveIntensity={0.2} />
      </mesh>
      {/* 窗格十字 */}
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[0.05, 1.5, 0.05]} />
        <meshStandardMaterial color="#c9a87c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[1.9, 0.05, 0.05]} />
        <meshStandardMaterial color="#c9a87c" roughness={0.6} />
      </mesh>
      {/* 窗台 */}
      <mesh position={[0, -1, 0.15]}>
        <boxGeometry args={[2.5, 0.1, 0.3]} />
        <meshStandardMaterial color="#b8986c" roughness={0.6} />
      </mesh>
      {/* 窗台上的小盆栽 */}
      <group position={[0.6, -0.85, 0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.06, 0.12, 16]} />
          <meshStandardMaterial color="#e8a87c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#7cb342" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/** 墙上装饰 — 挂画、架子 */
function WallDecor() {
  return (
    <group>
      {/* 挂画 1 — 一二布布剪影 */}
      <group position={[2, 3.5, -5.9]}>
        <mesh>
          <boxGeometry args={[1.2, 0.9, 0.05]} />
          <meshStandardMaterial color="#d4a574" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.0, 0.7]} />
          <meshStandardMaterial color="#ffe4c4" roughness={0.8} />
        </mesh>
        {/* 画中两个小圆代表一二布布 */}
        <mesh position={[-0.15, 0, 0.05]}>
          <circleGeometry args={[0.12, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[0.15, 0, 0.05]}>
          <circleGeometry args={[0.12, 32]} />
          <meshStandardMaterial color="#c68e5e" roughness={0.5} />
        </mesh>
      </group>

      {/* 挂画 2 — 心愿星 */}
      <group position={[4.2, 2.5, -5.9]}>
        <mesh>
          <boxGeometry args={[0.8, 0.8, 0.05]} />
          <meshStandardMaterial color="#c9a87c" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.65, 0.65]} />
          <meshStandardMaterial color="#e8f4f8" roughness={0.8} />
        </mesh>
      </group>

      {/* 墙上置物架 */}
      <group position={[-2, 4.2, -5.9]}>
        <mesh>
          <boxGeometry args={[1.5, 0.05, 0.2]} />
          <meshStandardMaterial color="#b8986c" roughness={0.6} />
        </mesh>
        {/* 架子上的小摆件 */}
        <mesh position={[-0.4, 0.12, 0]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ffb6c1" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.12, 0.15, 0.1]} />
          <meshStandardMaterial color="#87ceeb" roughness={0.5} />
        </mesh>
        <mesh position={[0.4, 0.12, 0]} castShadow>
          <coneGeometry args={[0.06, 0.15, 16]} />
          <meshStandardMaterial color="#dda0dd" roughness={0.5} />
        </mesh>
      </group>

      {/* 串灯装饰 */}
      <StringLights />
    </group>
  );
}

/** 墙上串灯 — 温馨氛围 */
function StringLights() {
  const lights = useMemo(() => {
    const arr: { x: number; y: number; color: string }[] = [];
    const colors = ['#ffd700', '#ffb6c1', '#87ceeb', '#98fb98', '#dda0dd'];
    for (let i = 0; i < 12; i++) {
      arr.push({
        x: -5.5 + i * 1.0,
        y: 5.2 - Math.sin(i * 0.5) * 0.15,
        color: colors[i % colors.length],
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* 灯线 */}
      <mesh position={[0, 5.25, -5.85]}>
        <boxGeometry args={[12, 0.01, 0.01]} />
        <meshStandardMaterial color="#8b7355" roughness={0.8} />
      </mesh>
      {/* 灯泡 */}
      {lights.map((light, i) => (
        <group key={i} position={[light.x, light.y - 0.08, -5.85]}>
          <mesh>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color={light.color} emissive={light.color} emissiveIntensity={0.8} roughness={0.3} />
          </mesh>
          <pointLight intensity={0.15} color={light.color} distance={1.5} />
        </group>
      ))}
    </group>
  );
}
