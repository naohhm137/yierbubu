import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ContactShadows, Float, Text, OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { PublicRoomView, PrivatePlayerView, Card, Character } from '@yierbubu/shared';
import { CHARACTERS, CARDS, SCENES } from '@yierbubu/shared';
import { TableScene } from './TableScene';
import { Character3D } from './Character3D';
import { HandCards } from './HandCards';
import { SceneCardDisplay } from './SceneCardDisplay';
import { CenterCards } from './CenterCards';
import { PlayerHandBacks } from './PlayerHandBacks';
import { useDeviceQuality } from '../../hooks/useDeviceQuality';

interface GameCanvasProps {
  room: PublicRoomView;
  privateView: PrivatePlayerView;
  onPlayCard: (cardId: string, targetId?: string) => void;
  onUseSkill: () => void;
  onEndTurn: () => void;
}

/** 玩家座位位置计算 — 围坐圆桌，全部面向桌子中心 */
function useSeatPositions(count: number) {
  return useMemo(() => {
    const positions: { x: number; z: number; rotY: number }[] = [];
    const radius = 3.4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rotY = Math.atan2(x, z) + Math.PI;
      positions.push({ x, z, rotY });
    }
    return positions;
  }, [count]);
}

/** 漂浮粒子 — 心愿星尘氛围 */
function FloatingParticles({ count = 60 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 12,
      y: Math.random() * 5 + 0.5,
      z: (Math.random() - 0.5) * 10,
      speed: Math.random() * 0.3 + 0.1,
      size: Math.random() * 0.04 + 0.02,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.3,
        p.y + Math.sin(t * p.speed * 0.7 + p.phase) * 0.2,
        p.z + Math.cos(t * p.speed * 0.5 + p.phase) * 0.3
      );
      dummy.scale.setScalar(p.size * (1 + Math.sin(t * 2 + p.phase) * 0.3));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ffe4a3" transparent opacity={0.7} />
    </instancedMesh>
  );
}

/** 3D背景 — 樱花治愈系场景 */
function SceneBackground() {
  const texture = useLoader(THREE.TextureLoader, '/backgrounds/sakura_bg.jpg');
  return (
    <group>
      {/* 远景背景大平面 */}
      <mesh position={[0, 3, -12]} scale={[20, 12, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
      {/* 左右侧背景 */}
      <mesh position={[-10, 3, -2]} rotation={[0, Math.PI / 2, 0]} scale={[16, 12, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[10, 3, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[16, 12, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** 桌上装饰 — 糖果、星星、小物件 */
function TableDecorations() {
  const items = useMemo(() => {
    const arr: { pos: [number, number, number]; color: string; type: string; scale: number }[] = [];
    const colors = ['#ff8fab', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b6b', '#c084fc'];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 0.8;
      arr.push({
        pos: [Math.cos(angle) * r, 0.78, Math.sin(angle) * r],
        color: colors[i % colors.length],
        type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'candy' : 'gem',
        scale: 0.8 + Math.random() * 0.5,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {items.map((item, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
          <group position={item.pos} scale={item.scale}>
            {item.type === 'star' && (
              <mesh>
                <octahedronGeometry args={[0.08, 0]} />
                <meshPhysicalMaterial color={item.color} roughness={0.2} clearcoat={0.8} clearcoatRoughness={0.15} emissive={item.color} emissiveIntensity={0.15} />
              </mesh>
            )}
            {item.type === 'candy' && (
              <group>
                <mesh>
                  <sphereGeometry args={[0.06, 16, 16]} />
                  <meshPhysicalMaterial color={item.color} roughness={0.25} clearcoat={0.7} />
                </mesh>
                <mesh position={[-0.07, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                  <coneGeometry args={[0.04, 0.08, 8]} />
                  <meshPhysicalMaterial color={item.color} roughness={0.3} clearcoat={0.6} />
                </mesh>
                <mesh position={[0.07, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
                  <coneGeometry args={[0.04, 0.08, 8]} />
                  <meshPhysicalMaterial color={item.color} roughness={0.3} clearcoat={0.6} />
                </mesh>
              </group>
            )}
            {item.type === 'gem' && (
              <mesh>
                <dodecahedronGeometry args={[0.07, 0]} />
                <meshPhysicalMaterial color={item.color} roughness={0.1} clearcoat={0.9} clearcoatRoughness={0.1} metalness={0.1} />
              </mesh>
            )}
          </group>
        </Float>
      ))}
    </group>
  );
}

/** 樱花花瓣飘落 */
function SakuraPetals({ count = 30 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const petals = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 12,
      y: Math.random() * 6 + 2,
      z: (Math.random() - 0.5) * 10,
      speed: 0.3 + Math.random() * 0.4,
      sway: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI,
    })), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    petals.forEach((p, i) => {
      const y = p.y - (t * p.speed) % 7;
      dummy.position.set(
        p.x + Math.sin(t * 0.8 + p.sway) * 0.5,
        y < 0 ? y + 7 : y,
        p.z + Math.cos(t * 0.6 + p.sway) * 0.3
      );
      dummy.rotation.set(t * 0.5 + p.rot, t * 0.3, t * 0.7);
      dummy.scale.setScalar(0.04 + Math.random() * 0.02);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffb3c6" transparent opacity={0.8} />
    </instancedMesh>
  );
}

export function GameCanvas({ room, privateView, onPlayCard, onUseSkill, onEndTurn }: GameCanvasProps) {
  const device = useDeviceQuality();
  const allPlayers = room.players;
  const seats = useSeatPositions(allPlayers.length);
  const currentScene = room.sceneId ? SCENES.find((s) => s.id === room.sceneId) : null;

  const handCards = useMemo(() => {
    return (privateView.hand || [])
      .map((id) => CARDS.find((c) => c.id === id))
      .filter(Boolean) as Card[];
  }, [privateView.hand]);

  const camPos: [number, number, number] = device.isMobile ? [0, 3.8, 7] : [0, 3.0, 5.8];
  const camFov = device.isMobile ? 62 : 55;

  return (
    <Canvas
      shadows={device.shadows}
      camera={{ position: camPos, fov: camFov, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      style={{ background: 'linear-gradient(180deg, #ffe4ec 0%, #ffd4e0 40%, #fce4d6 100%)' }}
      dpr={[1, device.dpr]}
    >
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.02}
        target={[0, 0.6, 0]}
        enableDamping
        dampingFactor={0.08}
      />
      <Suspense fallback={null}>
        {/* 背景 */}
        <SceneBackground />

        {/* 灯光 — 柔和暖色调 */}
        <ambientLight intensity={0.5} color="#fff5e6" />
        <hemisphereLight args={['#ffeedd', '#d4c4a8', 0.45]} />
        <directionalLight
          position={[4, 8, 4]}
          intensity={0.75}
          color="#ffeedd"
          castShadow={device.shadows}
          shadow-mapSize={[device.shadowMapSize, device.shadowMapSize]}
          shadow-bias={-0.0001}
        />
        <pointLight position={[0, 4, 0]} intensity={0.55} color="#ffd4a3" distance={12} decay={2} />
        <pointLight position={[-5, 3, -3]} intensity={0.3} color="#ffc4d6" distance={10} decay={2} />
        <pointLight position={[5, 2.5, -2]} intensity={0.25} color="#c4d4ff" distance={8} decay={2} />
        {device.shadows && <spotLight position={[0, 7, 0]} angle={0.55} penumbra={0.8} intensity={0.4} color="#fff0d4" castShadow />}

        {/* 桌面场景 */}
        <TableScene />

        {/* 桌上装饰 */}
        <TableDecorations />

        {/* 场景牌 — 桌面中央 */}
        {currentScene && <SceneCardDisplay scene={currentScene} />}

        {/* 中央出牌区 */}
        <CenterCards room={room} />

        {/* 所有玩家角色 — 包括自己 */}
        {allPlayers.map((player, i) => {
          const seat = seats[i];
          if (!seat) return null;
          const char = CHARACTERS.find((c) => c.id === player.characterId);
          const isMe = player.id === privateView.playerId;
          const handX = seat.x * 0.75;
          const handZ = seat.z * 0.75;
          return (
            <React.Fragment key={player.id}>
              <Character3D
                character={char}
                position={[seat.x, 0, seat.z]}
                rotation={[0, seat.rotY, 0]}
                playerName={isMe ? `${player.name}(你)` : player.name}
                vitality={player.vitality}
                friendship={player.friendship}
                isActive={room.activePlayerId === player.id}
                isDreaming={player.status === 'dream'}
              />
              {!isMe && (
                <PlayerHandBacks
                  position={[handX, 0, handZ]}
                  rotationY={seat.rotY}
                  cardCount={player.handCount || 4}
                  isActive={room.activePlayerId === player.id}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* 自己的手牌 */}
        <HandCards
          cards={handCards}
          onPlayCard={onPlayCard}
          isMyTurn={room.activePlayerId === privateView.playerId}
        />

        {/* 漂浮星尘粒子 */}
        <FloatingParticles count={device.particleCount} />

        {/* 樱花花瓣 */}
        {!device.isMobile && <SakuraPetals count={25} />}

        {/* 接触阴影 */}
        {device.shadows && (
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.45}
            scale={14}
            blur={2.8}
            far={5}
            color="#8b6f47"
          />
        )}
      </Suspense>

      {/* 后处理 */}
      {device.postprocessing && (
        <EffectComposer>
          <Bloom intensity={0.18} luminanceThreshold={0.85} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette eskil={false} offset={0.22} darkness={0.38} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}
