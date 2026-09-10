import React, { useRef, useMemo } from 'react';
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

/** 精致眼睛组件 — 眼白+虹膜+瞳孔+双层高光 */
function CuteEye({ position, lookDir = 0 }: { position: [number, number, number]; lookDir?: number }) {
  return (
    <group position={position}>
      {/* 眼白 */}
      <mesh position={[0, 0, 0.01]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      {/* 虹膜 */}
      <mesh position={[lookDir * 0.015, -0.005, 0.05]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#3d2817" roughness={0.15} />
      </mesh>
      {/* 瞳孔 */}
      <mesh position={[lookDir * 0.018, -0.005, 0.08]}>
        <sphereGeometry args={[0.025, 10, 10]} />
        <meshStandardMaterial color="#1a0f08" roughness={0.1} />
      </mesh>
      {/* 主高光 */}
      <mesh position={[lookDir * 0.01 - 0.012, 0.015, 0.1]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* 次高光 */}
      <mesh position={[lookDir * 0.01 + 0.01, -0.01, 0.095]}>
        <sphereGeometry args={[0.006, 6, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/** 腮红 */
function Blush({ position, color = '#ffb3c6' }: { position: [number, number, number]; color?: string }) {
  return (
    <mesh position={position}>
      <circleGeometry args={[0.05, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** 嘴巴 — 微笑 */
function SmileMouth({ position, open = false }: { position: [number, number, number]; open?: boolean }) {
  if (open) {
    return (
      <group position={position}>
        <mesh>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#c44569" roughness={0.3} />
        </mesh>
        {/* 小舌头 */}
        <mesh position={[0, -0.012, 0.02]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#ff8fa3" roughness={0.4} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={position} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.04, 0.012, 8, 16, Math.PI]} />
      <meshStandardMaterial color="#5a3a2a" roughness={0.4} />
    </mesh>
  );
}

/** 圆润身体 — 胶囊形 */
function CuteBody({ color, accentColor }: { color: string; accentColor: string }) {
  return (
    <group position={[0, 0.35, 0]}>
      {/* 身体主体 */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.25, 8, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.4} clearcoatRoughness={0.3} />
      </mesh>
      {/* 肚子（浅色） */}
      <mesh position={[0, -0.02, 0.18]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshPhysicalMaterial color={accentColor} roughness={0.4} clearcoat={0.3} />
      </mesh>
    </group>
  );
}

/** 小短手 */
function CuteArm({ position, color, rotation = 0 }: { position: [number, number, number]; color: string; rotation?: number }) {
  return (
    <mesh position={position} rotation={[0, 0, rotation]} castShadow>
      <capsuleGeometry args={[0.06, 0.12, 6, 12]} />
      <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.3} />
    </mesh>
  );
}

/** 小短腿 */
function CuteLeg({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow>
      <capsuleGeometry args={[0.07, 0.08, 6, 12]} />
      <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.3} />
    </mesh>
  );
}

/** 一二 — 白色小熊猫，黑圆耳朵，黑蝴蝶领结，粉腮红，吐舌 */
function YierCharacter() {
  return (
    <group>
      {/* 身体 */}
      <CuteBody color="#f5f0e8" accentColor="#fff8f0" />
      {/* 手臂 */}
      <CuteArm position={[-0.25, 0.4, 0.05]} color="#f5f0e8" rotation={0.3} />
      <CuteArm position={[0.25, 0.4, 0.05]} color="#f5f0e8" rotation={-0.3} />
      {/* 腿 */}
      <CuteLeg position={[-0.1, 0.08, 0]} color="#2a2a2a" />
      <CuteLeg position={[0.1, 0.08, 0]} color="#2a2a2a" />

      {/* 头部 */}
      <group position={[0, 0.85, 0]}>
        {/* 头 */}
        <mesh castShadow>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshPhysicalMaterial color="#f5f0e8" roughness={0.3} clearcoat={0.5} clearcoatRoughness={0.25} />
        </mesh>
        {/* 黑耳朵 */}
        <mesh position={[-0.2, 0.22, -0.02]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial color="#2a2a2a" roughness={0.3} clearcoat={0.4} />
        </mesh>
        <mesh position={[0.2, 0.22, -0.02]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial color="#2a2a2a" roughness={0.3} clearcoat={0.4} />
        </mesh>
        {/* 眼睛 */}
        <CuteEye position={[-0.11, 0.03, 0.28]} />
        <CuteEye position={[0.11, 0.03, 0.28]} />
        {/* 腮红 */}
        <Blush position={[-0.18, -0.05, 0.26]} color="#ffb3c6" />
        <Blush position={[0.18, -0.05, 0.26]} color="#ffb3c6" />
        {/* 嘴巴 — 吐舌 */}
        <SmileMouth position={[0, -0.1, 0.29]} open />
        {/* 小鼻子 */}
        <mesh position={[0, -0.02, 0.31]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.2} />
        </mesh>
      </group>

      {/* 黑色蝴蝶领结 */}
      <group position={[0, 0.62, 0.2]}>
        <mesh position={[-0.06, 0, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.08, 0.05, 0.02]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.25} clearcoat={0.6} />
        </mesh>
        <mesh position={[0.06, 0, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.08, 0.05, 0.02]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.25} clearcoat={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.25} clearcoat={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/** 布布 — 棕色小熊，黄腮红，温和微笑 */
function BubuCharacter() {
  return (
    <group>
      {/* 身体 */}
      <CuteBody color="#a67c52" accentColor="#d4a574" />
      {/* 手臂 */}
      <CuteArm position={[-0.25, 0.4, 0.05]} color="#a67c52" rotation={0.3} />
      <CuteArm position={[0.25, 0.4, 0.05]} color="#a67c52" rotation={-0.3} />
      {/* 腿 */}
      <CuteLeg position={[-0.1, 0.08, 0]} color="#8b6340" />
      <CuteLeg position={[0.1, 0.08, 0]} color="#8b6340" />

      {/* 头部 */}
      <group position={[0, 0.85, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshPhysicalMaterial color="#a67c52" roughness={0.32} clearcoat={0.45} clearcoatRoughness={0.3} />
        </mesh>
        {/* 棕色圆耳朵 */}
        <mesh position={[-0.22, 0.2, -0.02]} castShadow>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshPhysicalMaterial color="#8b6340" roughness={0.3} clearcoat={0.4} />
        </mesh>
        <mesh position={[0.22, 0.2, -0.02]} castShadow>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshPhysicalMaterial color="#8b6340" roughness={0.3} clearcoat={0.4} />
        </mesh>
        {/* 耳朵内侧 */}
        <mesh position={[-0.22, 0.2, 0.04]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#d4a574" roughness={0.5} />
        </mesh>
        <mesh position={[0.22, 0.2, 0.04]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#d4a574" roughness={0.5} />
        </mesh>
        {/* 眼睛 */}
        <CuteEye position={[-0.11, 0.03, 0.28]} />
        <CuteEye position={[0.11, 0.03, 0.28]} />
        {/* 黄色腮红 */}
        <Blush position={[-0.18, -0.05, 0.26]} color="#ffd93d" />
        <Blush position={[0.18, -0.05, 0.26]} color="#ffd93d" />
        {/* 温和微笑 */}
        <SmileMouth position={[0, -0.1, 0.29]} />
        {/* 鼻子 */}
        <mesh position={[0, -0.02, 0.31]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#4a3020" roughness={0.2} />
        </mesh>
        {/* 口鼻区（浅色） */}
        <mesh position={[0, -0.06, 0.27]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#d4a574" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/** 通用可爱角色 — 根据角色ID定制 */
function GenericCharacter({ character }: { character: Character }) {
  const mainColor = character.color || '#ffb3c6';
  const accentColor = character.accentColor || '#fff0f5';

  // 根据角色ID添加独特配饰
  const renderAccessory = () => {
    switch (character.id) {
      case 'duoduo': // 云朵邮差 - 邮差帽
        return (
          <group position={[0, 1.15, 0]}>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.18, 0.2, 0.08, 16]} />
              <meshPhysicalMaterial color="#4a90d9" roughness={0.3} clearcoat={0.5} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.03, 16]} />
              <meshPhysicalMaterial color="#357abd" roughness={0.3} clearcoat={0.5} />
            </mesh>
          </group>
        );
      case 'tangtang': // 糖果厨师 - 厨师帽
        return (
          <group position={[0, 1.18, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshPhysicalMaterial color="#ffffff" roughness={0.4} clearcoat={0.3} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.18, 0.06, 16]} />
              <meshPhysicalMaterial color="#f5f5f5" roughness={0.35} clearcoat={0.4} />
            </mesh>
          </group>
        );
      case 'asong': // 森林侦探 - 侦探帽
        return (
          <group position={[0, 1.12, 0]} rotation={[0, 0, 0.05]}>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.15, 0.17, 0.1, 16]} />
              <meshPhysicalMaterial color="#5d4e37" roughness={0.35} clearcoat={0.4} />
            </mesh>
            <mesh position={[0, -0.01, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.025, 16]} />
              <meshPhysicalMaterial color="#4a3d2a" roughness={0.35} clearcoat={0.4} />
            </mesh>
          </group>
        );
      case 'yueyue': // 月光魔术师 - 巫师帽
        return (
          <group position={[0, 1.2, 0]}>
            <mesh position={[0, 0.1, 0]}>
              <coneGeometry args={[0.15, 0.25, 16]} />
              <meshPhysicalMaterial color="#6b4c9a" roughness={0.3} clearcoat={0.5} />
            </mesh>
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} />
              <meshPhysicalMaterial color="#5a3d8a" roughness={0.3} clearcoat={0.5} />
            </mesh>
            {/* 星星装饰 */}
            <mesh position={[0.05, 0.15, 0.1]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
          </group>
        );
      case 'xiaoban': // 玩具修理师 - 护目镜
        return (
          <group position={[0, 0.88, 0.28]}>
            <mesh position={[-0.08, 0, 0]}>
              <torusGeometry args={[0.05, 0.015, 8, 16]} />
              <meshPhysicalMaterial color="#ff8c00" roughness={0.25} clearcoat={0.6} metalness={0.3} />
            </mesh>
            <mesh position={[0.08, 0, 0]}>
              <torusGeometry args={[0.05, 0.015, 8, 16]} />
              <meshPhysicalMaterial color="#ff8c00" roughness={0.25} clearcoat={0.6} metalness={0.3} />
            </mesh>
          </group>
        );
      case 'mimi': // 星星歌手 - 蝴蝶结
        return (
          <group position={[0.15, 1.1, 0.1]}>
            <mesh position={[-0.04, 0, 0]} rotation={[0, 0, 0.4]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshPhysicalMaterial color="#ff6b9d" roughness={0.3} clearcoat={0.5} />
            </mesh>
            <mesh position={[0.04, 0, 0]} rotation={[0, 0, -0.4]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshPhysicalMaterial color="#ff6b9d" roughness={0.3} clearcoat={0.5} />
            </mesh>
          </group>
        );
      case 'qiaoqiao': // 胆小幽灵 - 半透明效果
        return null;
      case 'tuantuan': // 淘气团子 - 头顶小叶子
        return (
          <mesh position={[0, 1.18, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.03, 0.08, 8]} />
            <meshStandardMaterial color="#7cb342" roughness={0.4} />
          </mesh>
        );
      case 'huahua': // 梦境画师 - 贝雷帽
        return (
          <group position={[0, 1.12, 0]}>
            <mesh position={[0, 0.03, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshPhysicalMaterial color="#e57373" roughness={0.35} clearcoat={0.4} />
            </mesh>
            <mesh position={[0.1, 0.05, 0.05]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshPhysicalMaterial color="#c62828" roughness={0.3} clearcoat={0.5} />
            </mesh>
          </group>
        );
      case 'kaka': // 发条骑士 - 头盔
        return (
          <group position={[0, 0.95, 0]}>
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.28, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial color="#b0bec5" roughness={0.2} clearcoat={0.7} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.04, 0.08, 0.15]} />
              <meshPhysicalMaterial color="#90a4ae" roughness={0.2} clearcoat={0.7} metalness={0.5} />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  };

  const isGhost = character.id === 'qiaoqiao';

  return (
    <group>
      {/* 身体 */}
      <CuteBody color={mainColor} accentColor={accentColor} />
      {/* 手臂 */}
      <CuteArm position={[-0.25, 0.4, 0.05]} color={mainColor} rotation={0.3} />
      <CuteArm position={[0.25, 0.4, 0.05]} color={mainColor} rotation={-0.3} />
      {/* 腿 */}
      <CuteLeg position={[-0.1, 0.08, 0]} color={mainColor} />
      <CuteLeg position={[0.1, 0.08, 0]} color={mainColor} />

      {/* 头部 */}
      <group position={[0, 0.85, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshPhysicalMaterial
            color={mainColor}
            roughness={0.3}
            clearcoat={0.5}
            clearcoatRoughness={0.25}
            transparent={isGhost}
            opacity={isGhost ? 0.7 : 1}
          />
        </mesh>
        {/* 耳朵（通用小圆耳） */}
        {!['kaka'].includes(character.id) && (
          <>
            <mesh position={[-0.22, 0.2, -0.02]} castShadow>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshPhysicalMaterial color={mainColor} roughness={0.3} clearcoat={0.4} />
            </mesh>
            <mesh position={[0.22, 0.2, -0.02]} castShadow>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshPhysicalMaterial color={mainColor} roughness={0.3} clearcoat={0.4} />
            </mesh>
          </>
        )}
        {/* 眼睛 */}
        <CuteEye position={[-0.11, 0.03, 0.28]} />
        <CuteEye position={[0.11, 0.03, 0.28]} />
        {/* 腮红 */}
        <Blush position={[-0.18, -0.05, 0.26]} color="#ffb3c6" />
        <Blush position={[0.18, -0.05, 0.26]} color="#ffb3c6" />
        {/* 嘴巴 */}
        <SmileMouth position={[0, -0.1, 0.29]} />
        {/* 鼻子 */}
        <mesh position={[0, -0.02, 0.31]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#4a3020" roughness={0.2} />
        </mesh>
      </group>

      {/* 独特配饰 */}
      {renderAccessory()}
    </group>
  );
}

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
  const bobRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // 呼吸浮动
    bobRef.current = Math.sin(t * 1.5 + position[0]) * 0.02;
    groupRef.current.position.y = position[1] + bobRef.current;
    // 活跃玩家轻微晃动
    if (isActive) {
      groupRef.current.rotation.z = Math.sin(t * 2) * 0.03;
    }
  });

  const charId = character?.id || 'unknown';

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* 角色模型 */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.15}>
        {charId === 'yier' ? (
          <YierCharacter />
        ) : charId === 'bubu' ? (
          <BubuCharacter />
        ) : character ? (
          <GenericCharacter character={character} />
        ) : null}
      </Float>

      {/* 名字牌 */}
      {playerName && (
        <group position={[0, 1.45, 0]}>
          <mesh>
            <planeGeometry args={[0.9, 0.22]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.1}
            color={isActive ? '#4A90D9' : '#5a4a3a'}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.85}
          >
            {playerName}
          </Text>
        </group>
      )}

      {/* 活力心心 */}
      <group position={[-0.2, 1.3, 0]}>
        {Array.from({ length: Math.min(vitality, 4) }).map((_, i) => (
          <mesh key={i} position={[i * 0.1, 0, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#ff6b6b" />
          </mesh>
        ))}
      </group>

      {/* 友情值 */}
      {friendship > 0 && (
        <group position={[0.2, 1.3, 0]}>
          {Array.from({ length: Math.min(friendship, 6) }).map((_, i) => (
            <mesh key={i} position={[i * 0.08, 0, 0]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#ff8fa3" />
            </mesh>
          ))}
        </group>
      )}

      {/* 活跃光环 */}
      {isActive && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.42, 32]} />
          <meshBasicMaterial color="#4A90D9" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 梦境状态 — 半透明+zzz */}
      {isDreaming && (
        <group position={[0.3, 1.5, 0]}>
          <Text fontSize={0.12} color="#9b8bbf" anchorX="center">
            zzz
          </Text>
        </group>
      )}
    </group>
  );
}
