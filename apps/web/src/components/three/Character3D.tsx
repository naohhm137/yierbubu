import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Float, Text, RoundedBox, Billboard } from '@react-three/drei';
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

/* 角色主色调映射 */
const characterColors: Record<string, { side: string; back: string; base: string; accent: string; glow: string }> = {
  yier: { side: '#e8e0d4', back: '#d8d0c4', base: '#2a2a2a', accent: '#ffb3c6', glow: '#ffd4e0' },
  bubu: { side: '#b89060', back: '#a07848', base: '#8b6340', accent: '#ffd93d', glow: '#ffe8a0' },
  duoduo: { side: '#c8e0f5', back: '#b0d0ee', base: '#4a90d9', accent: '#ffd700', glow: '#b8e0ff' },
  tangtang: { side: '#ffc0d4', back: '#ffa8c4', base: '#ff8fab', accent: '#ffffff', glow: '#ffd4e0' },
  asong: { side: '#7cb342', back: '#689f38', base: '#5d4e37', accent: '#8d6e63', glow: '#c8e6c9' },
  yueyue: { side: '#9575cd', back: '#7e57c2', base: '#6b4c9a', accent: '#ffd700', glow: '#d1c4e9' },
  xiaoban: { side: '#ffa726', back: '#ff9800', base: '#e67e22', accent: '#87ceeb', glow: '#ffe0b2' },
  mimi: { side: '#f48fb1', back: '#f06292', base: '#ff6b9d', accent: '#ffd700', glow: '#f8bbd0' },
  qiaoqiao: { side: '#e0e8f8', back: '#c8d4f0', base: '#8b9dc3', accent: '#b3e5fc', glow: '#e3f2fd' },
  tuantuan: { side: '#ffd8d8', back: '#ffc8c8', base: '#ffb3c6', accent: '#81c784', glow: '#ffcdd2' },
  huahua: { side: '#ba68c8', back: '#ab47bc', base: '#9c27b0', accent: '#ff7043', glow: '#e1bee7' },
  kaka: { side: '#90a4ae', back: '#78909c', base: '#607d8b', accent: '#e53935', glow: '#cfd8dc' },
};

function getColors(id?: string) {
  return characterColors[id || 'bubu'] || characterColors.bubu;
}

/* 智能去背景 — 更精确的边缘处理 */
function useTransparentTexture(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;

      const canvas = document.createElement('canvas');
      canvas.width = tex.image.width;
      canvas.height = tex.image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(tex.image, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width, h = canvas.height;

      // 先找背景色（四角采样）
      const corners = [
        [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
        [w / 2, 0], [w / 2, h - 1]
      ];
      let bgR = 0, bgG = 0, bgB = 0;
      corners.forEach(([x, y]) => {
        const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
        bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2];
      });
      bgR /= corners.length; bgG /= corners.length; bgB /= corners.length;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
          // 只处理边缘区域（距边缘60px内），避免误删角色白色部分
          const edgeDist = Math.min(x, y, w - 1 - x, h - 1 - y);
          if (edgeDist < 60) {
            if (dist < 20) {
              data[i + 3] = 0;
            } else if (dist < 45) {
              data[i + 3] = Math.floor((dist - 20) / 25 * 255);
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const newTex = new THREE.CanvasTexture(canvas);
      newTex.colorSpace = THREE.SRGBColorSpace;
      newTex.anisotropy = 8;
      setTexture(newTex);
      setLoaded(true);
    });
  }, [url]);

  return { texture, loaded };
}

/* 出场动画 */
function useEntranceAnimation(delay = 0) {
  const ref = useRef<THREE.Group>(null);
  const [done, setDone] = useState(false);

  useFrame((state) => {
    if (!ref.current || done) return;
    const t = state.clock.elapsedTime - delay;
    if (t < 0) {
      ref.current.scale.setScalar(0.01);
      ref.current.position.y = -0.8;
    } else {
      const progress = Math.min(1, t * 2.5);
      const ease = 1 - Math.pow(1 - progress, 3);
      ref.current.scale.setScalar(0.01 + ease * 0.99);
      ref.current.position.y = -0.8 + ease * 0.8;
      if (progress >= 1) setDone(true);
    }
  });

  return ref;
}

/* 立体角色主体 */
function StereoCharacter({ characterId }: { characterId?: string }) {
  const colors = getColors(characterId);
  const { texture, loaded } = useTransparentTexture(`/characters_3d/${characterId}_3d.png`);
  const isGhost = characterId === 'qiaoqiao';

  if (!texture || !loaded) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.85, 1.15, 0.1]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.06, 24]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* 发光底座光晕 */}
      <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.5, 48]} />
        <meshBasicMaterial color={colors.glow} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* 主体 — 有厚度的圆角盒子 */}
      <RoundedBox args={[0.9, 1.25, 0.18]} radius={0.06} smoothness={6} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={texture}
          roughness={0.38}
          clearcoat={0.4}
          clearcoatRoughness={0.28}
          transparent={isGhost}
          opacity={isGhost ? 0.88 : 1}
          alphaTest={0.05}
        />
      </RoundedBox>

      {/* 侧面渐变装饰 */}
      <mesh position={[0, 0, -0.07]}>
        <boxGeometry args={[0.9, 1.25, 0.015]} />
        <meshPhysicalMaterial color={colors.back} roughness={0.5} clearcoat={0.2} />
      </mesh>
      {/* 背面装饰图案 */}
      <mesh position={[0, 0, -0.08]}>
        <ringGeometry args={[0.25, 0.3, 32]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* 精致底座 */}
      <group position={[0, -0.72, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.35, 0.4, 0.07, 32]} />
          <meshPhysicalMaterial color={colors.base} roughness={0.28} clearcoat={0.65} clearcoatRoughness={0.18} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.33, 0.35, 0.02, 32]} />
          <meshPhysicalMaterial color={colors.accent} roughness={0.18} clearcoat={0.85} metalness={0.15} />
        </mesh>
      </group>
    </group>
  );
}

/* 加载中的角色 */
function LoadingCharacter() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 2.5;
  });
  return (
    <group>
      <mesh ref={ref}>
        <torusGeometry args={[0.28, 0.035, 8, 24]} />
        <meshBasicMaterial color="#ffb3c6" />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.05, 24]} />
        <meshStandardMaterial color="#ddd" />
      </mesh>
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
  const entranceRef = useEntranceAnimation();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const colors = getColors(character?.id);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // 呼吸动画
    const breathe = 1 + Math.sin(t * 1.8 + position[0] * 1.5) * 0.012;
    const pressScale = pressed ? 0.95 : 1;
    groupRef.current.scale.setScalar(breathe * pressScale);
    // 漂浮
    groupRef.current.position.y = position[1] + Math.sin(t * 1.3 + position[0] * 2) * 0.02;
    // 活跃摇摆
    if (isActive) {
      groupRef.current.rotation.z = Math.sin(t * 2.2) * 0.018;
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
      <group ref={entranceRef}>
        <Suspense fallback={<LoadingCharacter />}>
          <Float speed={0.9} rotationIntensity={0.035} floatIntensity={0.09}>
            <StereoCharacter characterId={character?.id} />
          </Float>
        </Suspense>
      </group>

      {/* 名字牌 — Billboard始终面向相机 */}
      {playerName && (
        <Billboard position={[0, 1.12, 0]}>
          <mesh>
            <planeGeometry args={[0.95, 0.19]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.96} />
          </mesh>
          <mesh position={[0, 0, 0.003]}>
            <planeGeometry args={[0.91, 0.15]} />
            <meshBasicMaterial color={isActive ? '#e3f2fd' : hovered ? '#fff3e0' : '#fafafa'} transparent opacity={0.92} />
          </mesh>
          <Text
            position={[0, 0, 0.008]}
            fontSize={0.08}
            color={isActive ? '#1565c0' : '#5d4037'}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.85}
            fontWeight="bold"
          >
            {playerName}
          </Text>
        </Billboard>
      )}

      {/* 活力心心 — Billboard */}
      <Billboard position={[-0.18, 1.32, 0]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[i * 0.1, 0, 0]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshBasicMaterial color={i < vitality ? '#ff5252' : '#e0e0e0'} />
          </mesh>
        ))}
      </Billboard>

      {/* 友情值 — Billboard */}
      {friendship > 0 && (
        <Billboard position={[0.2, 1.32, 0]}>
          {Array.from({ length: Math.min(friendship, 6) }).map((_, i) => (
            <mesh key={i} position={[i * 0.08, 0, 0]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshBasicMaterial color="#ff80ab" />
            </mesh>
          ))}
        </Billboard>
      )}

      {/* 活跃光环 */}
      {isActive && (
        <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 48]} />
          <meshBasicMaterial color="#2196f3" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 悬停光环 */}
      {hovered && !isActive && (
        <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.53, 48]} />
          <meshBasicMaterial color={colors.accent} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 梦境状态 */}
      {isDreaming && (
        <Billboard position={[0.3, 1.45, 0]}>
          <Text fontSize={0.1} color="#9575cd" anchorX="center" fontWeight="bold">💤</Text>
        </Billboard>
      )}
    </group>
  );
}
