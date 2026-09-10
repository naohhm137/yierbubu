import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Float, Text } from '@react-three/drei';
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

/** 鼠标视角微动 — 模拟第一人称头部轻微晃动 */
function MouseLook() {
  const { camera, gl } = useThree();
  const target = useRef(new THREE.Vector3(0, 1.1, 0));
  const basePos = useRef(new THREE.Vector3(0, 2.0, 4.8));

  useFrame((state) => {
    const x = state.pointer.x * 0.35;
    const y = state.pointer.y * 0.2;
    camera.position.x = basePos.current.x + x;
    camera.position.y = basePos.current.y + y;
    camera.lookAt(target.current);
  });
  return null;
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
      x: (Math.random() - 0.5) * 10,
      y: Math.random() * 4 + 0.5,
      z: (Math.random() - 0.5) * 8,
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

export function GameCanvas({ room, privateView, onPlayCard, onUseSkill, onEndTurn }: GameCanvasProps) {
  const device = useDeviceQuality();
  const otherPlayers = room.players.filter((p) => p.id !== privateView.playerId);
  const seats = useSeatPositions(otherPlayers.length + 1);
  const currentScene = room.sceneId ? SCENES.find((s) => s.id === room.sceneId) : null;

  const handCards = useMemo(() => {
    return (privateView.hand || [])
      .map((id) => CARDS.find((c) => c.id === id))
      .filter(Boolean) as Card[];
  }, [privateView.hand]);

  const otherSeats = seats.slice(1);

  // 移动端相机更高更远，确保看到所有玩家
  const camPos: [number, number, number] = device.isMobile ? [0, 3.5, 6.5] : [0, 2.8, 5.5];
  const camFov = device.isMobile ? 60 : 55;

  return (
    <Canvas
      shadows={device.shadows}
      camera={{ position: camPos, fov: camFov }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9 }}
      style={{ background: 'linear-gradient(180deg, #fef3e2 0%, #fce4d6 50%, #f8d5c0 100%)' }}
      dpr={[1, device.dpr]}
    >
      <MouseLook />
      <Suspense fallback={null}>
        {/* 灯光 — 柔和暖色调，避免过曝 */}
        <ambientLight intensity={0.4} color="#fff5e6" />
        <hemisphereLight args={['#ffeedd', '#d4c4a8', 0.4]} />
        <directionalLight
          position={[4, 7, 4]}
          intensity={0.7}
          color="#ffeedd"
          castShadow={device.shadows}
          shadow-mapSize={[device.shadowMapSize, device.shadowMapSize]}
          shadow-bias={-0.0001}
        />
        <pointLight position={[0, 3.5, 0]} intensity={0.5} color="#ffd4a3" distance={10} decay={2} />
        <pointLight position={[-4, 2.5, -3]} intensity={0.25} color="#ffc4d6" distance={8} decay={2} />
        <pointLight position={[4, 2, -2]} intensity={0.2} color="#c4d4ff" distance={6} decay={2} />
        {device.shadows && <spotLight position={[0, 6, 0]} angle={0.5} penumbra={0.8} intensity={0.35} color="#fff0d4" castShadow />}

        {/* 桌面场景 */}
        <TableScene />

        {/* 场景牌 — 桌面中央 */}
        {currentScene && <SceneCardDisplay scene={currentScene} />}

        {/* 中央出牌区 */}
        <CenterCards room={room} />

        {/* 其他玩家角色 — 围坐桌前 */}
        {otherPlayers.map((player, i) => {
          const seat = otherSeats[i];
          if (!seat) return null;
          const char = CHARACTERS.find((c) => c.id === player.characterId);
          // 手牌位置：玩家和桌子中心之间
          const handX = seat.x * 0.75;
          const handZ = seat.z * 0.75;
          return (
            <React.Fragment key={player.id}>
              <Character3D
                character={char}
                position={[seat.x, 0, seat.z]}
                rotation={[0, seat.rotY, 0]}
                playerName={player.name}
                vitality={player.vitality}
                friendship={player.friendship}
                isActive={room.activePlayerId === player.id}
                isDreaming={player.status === 'dream'}
              />
              {/* 该玩家面前的手牌（牌背） */}
              <PlayerHandBacks
                position={[handX, 0, handZ]}
                rotationY={seat.rotY}
                cardCount={player.handCount || 4}
                isActive={room.activePlayerId === player.id}
              />
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

        {/* 接触阴影 — 角色脚下柔和阴影（仅桌面端） */}
        {device.shadows && (
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.5}
            scale={12}
            blur={2.5}
            far={4}
            color="#8b6f47"
          />
        )}
      </Suspense>

      {/* 后处理 — 仅桌面端（移动端可能不兼容） */}
      {device.postprocessing && (
        <EffectComposer>
          <Bloom intensity={0.15} luminanceThreshold={0.85} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.4} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}
