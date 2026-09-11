import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ContactShadows, Float, Text, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { PublicRoomView, PrivatePlayerView, Card } from '@yierbubu/shared';
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
  onSelectTarget?: (playerId: string) => void;
  targetMode?: boolean;
  selectedCardId?: string | null;
}

function useSeatPositions(count: number) {
  return useMemo(() => {
    const positions: { x: number; z: number; rotY: number }[] = [];
    const radius = 3.0;
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

function FloatingParticles({ count = 50 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 12, y: Math.random() * 5 + 0.5, z: (Math.random() - 0.5) * 10,
    speed: Math.random() * 0.3 + 0.1, size: Math.random() * 0.04 + 0.02, phase: Math.random() * Math.PI * 2,
  })), []);
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(p.x + Math.sin(t * p.speed + p.phase) * 0.3, p.y + Math.sin(t * p.speed * 0.7 + p.phase) * 0.2, p.z + Math.cos(t * p.speed * 0.5 + p.phase) * 0.3);
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

function SceneBackground() {
  const texture = useLoader(THREE.TextureLoader, '/backgrounds/sakura_bg.jpg');
  return (
    <group>
      <mesh position={[0, 3, -12]} scale={[20, 12, 1]}><planeGeometry /><meshBasicMaterial map={texture} side={THREE.DoubleSide} /></mesh>
      <mesh position={[-10, 3, -2]} rotation={[0, Math.PI / 2, 0]} scale={[16, 12, 1]}><planeGeometry /><meshBasicMaterial map={texture} side={THREE.DoubleSide} /></mesh>
      <mesh position={[10, 3, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[16, 12, 1]}><planeGeometry /><meshBasicMaterial map={texture} side={THREE.DoubleSide} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow><circleGeometry args={[15, 64]} /><meshStandardMaterial color="#f5e6d3" roughness={0.9} /></mesh>
    </group>
  );
}

function TableDecorations() {
  const items = useMemo(() => {
    const arr: { pos: [number, number, number]; color: string; type: string; scale: number }[] = [];
    const colors = ['#ff8fab', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b6b', '#c084fc'];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * 0.6;
      arr.push({ pos: [Math.cos(angle) * r, 0.78, Math.sin(angle) * r], color: colors[i % colors.length], type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'candy' : 'gem', scale: 0.7 + Math.random() * 0.4 });
    }
    return arr;
  }, []);
  return (
    <group>
      {items.map((item, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.25}>
          <group position={item.pos} scale={item.scale}>
            {item.type === 'star' && <mesh><octahedronGeometry args={[0.07, 0]} /><meshPhysicalMaterial color={item.color} roughness={0.2} clearcoat={0.8} emissive={item.color} emissiveIntensity={0.12} /></mesh>}
            {item.type === 'candy' && (
              <group>
                <mesh><sphereGeometry args={[0.05, 16, 16]} /><meshPhysicalMaterial color={item.color} roughness={0.25} clearcoat={0.7} /></mesh>
                <mesh position={[-0.06, 0, 0]} rotation={[0, 0, Math.PI / 4]}><coneGeometry args={[0.035, 0.07, 8]} /><meshPhysicalMaterial color={item.color} roughness={0.3} clearcoat={0.6} /></mesh>
                <mesh position={[0.06, 0, 0]} rotation={[0, 0, -Math.PI / 4]}><coneGeometry args={[0.035, 0.07, 8]} /><meshPhysicalMaterial color={item.color} roughness={0.3} clearcoat={0.6} /></mesh>
              </group>
            )}
            {item.type === 'gem' && <mesh><dodecahedronGeometry args={[0.06, 0]} /><meshPhysicalMaterial color={item.color} roughness={0.1} clearcoat={0.9} metalness={0.1} /></mesh>}
          </group>
        </Float>
      ))}
    </group>
  );
}

function SakuraPetals({ count = 20 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const petals = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 12, y: Math.random() * 6 + 2, z: (Math.random() - 0.5) * 10,
    speed: 0.3 + Math.random() * 0.4, sway: Math.random() * Math.PI * 2, rot: Math.random() * Math.PI,
  })), []);
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    petals.forEach((p, i) => {
      const y = p.y - (t * p.speed) % 7;
      dummy.position.set(p.x + Math.sin(t * 0.8 + p.sway) * 0.5, y < 0 ? y + 7 : y, p.z + Math.cos(t * 0.6 + p.sway) * 0.3);
      dummy.rotation.set(t * 0.5 + p.rot, t * 0.3, t * 0.7);
      dummy.scale.setScalar(0.035 + Math.random() * 0.015);
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

export function GameCanvas({ room, privateView, onPlayCard, onUseSkill, onEndTurn, onSelectTarget, targetMode, selectedCardId }: GameCanvasProps) {
  const device = useDeviceQuality();
  const allPlayers = room.players;
  const seats = useSeatPositions(allPlayers.length);
  const currentScene = room.sceneId ? SCENES.find((s) => s.id === room.sceneId) : null;
  const myIndex = allPlayers.findIndex((p) => p.id === privateView.playerId);
  const mySeat = seats[myIndex] || { x: 0, z: 3.0, rotY: 0 };

  const handCards = useMemo(() => (privateView.hand || []).map((id) => CARDS.find((c) => c.id === id)).filter(Boolean) as Card[], [privateView.hand]);

  return (
    <Canvas
      shadows={device.shadows}
      camera={{ position: [mySeat.x, 1.35, mySeat.z], fov: 62, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      style={{ background: 'linear-gradient(180deg, #ffe4ec 0%, #ffd4e0 40%, #fce4d6 100%)' }}
      dpr={[1, device.dpr]}
    >
      <OrbitControls enablePan={false} minDistance={0.3} maxDistance={1.2} minPolarAngle={Math.PI / 5} maxPolarAngle={Math.PI / 2 + 0.2} target={[0, 0.7, 0]} enableDamping dampingFactor={0.08} rotateSpeed={0.55} />
      <Suspense fallback={null}>
        <SceneBackground />
        <ambientLight intensity={0.55} color="#fff5e6" />
        <hemisphereLight args={['#ffeedd', '#d4c4a8', 0.45]} />
        <directionalLight position={[4, 8, 4]} intensity={0.75} color="#ffeedd" castShadow={device.shadows} shadow-mapSize={[device.shadowMapSize, device.shadowMapSize]} shadow-bias={-0.0001} />
        <pointLight position={[0, 4, 0]} intensity={0.5} color="#ffd4a3" distance={12} decay={2} />
        <pointLight position={[-5, 3, -3]} intensity={0.3} color="#ffc4d6" distance={10} decay={2} />
        <pointLight position={[5, 2.5, -2]} intensity={0.25} color="#c4d4ff" distance={8} decay={2} />
        {device.shadows && <spotLight position={[0, 7, 0]} angle={0.55} penumbra={0.8} intensity={0.4} color="#fff0d4" castShadow />}

        <TableScene />
        <TableDecorations />
        {currentScene && <SceneCardDisplay scene={currentScene} />}
        <CenterCards room={room} />

        {allPlayers.map((player, i) => {
          const seat = seats[i];
          if (!seat) return null;
          const char = CHARACTERS.find((c) => c.id === player.characterId);
          const isMe = player.id === privateView.playerId;
          const handX = seat.x * 0.72;
          const handZ = seat.z * 0.72;
          const charPos: [number, number, number] = isMe ? [mySeat.x * 1.18, 0, mySeat.z * 1.18] : [seat.x, 0, seat.z];
          const isTargetable = !!targetMode && !isMe && player.status === 'active';
          return (
            <React.Fragment key={player.id}>
              <group onClick={(e) => { if (isTargetable && onSelectTarget) { e.stopPropagation(); onSelectTarget(player.id); } }}>
                <Character3D character={char} position={charPos} rotation={[0, seat.rotY, 0]} playerName={isMe ? `${player.name}(你)` : player.name} vitality={player.vitality} friendship={player.friendship} isActive={room.activePlayerId === player.id} isDreaming={player.status === 'dream'} isTargetable={isTargetable} />
              </group>
              {!isMe && <PlayerHandBacks position={[handX, 0, handZ]} rotationY={seat.rotY} cardCount={player.handCount || 4} isActive={room.activePlayerId === player.id} />}
            </React.Fragment>
          );
        })}

        <HandCards cards={handCards} onPlayCard={onPlayCard} isMyTurn={room.activePlayerId === privateView.playerId} selectedCardId={selectedCardId} />
        <FloatingParticles count={device.particleCount} />
        {!device.isMobile && <SakuraPetals count={20} />}
        {device.shadows && <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={12} blur={2.8} far={5} color="#8b6f47" />}
      </Suspense>
      {device.postprocessing && (
        <EffectComposer>
          <Bloom intensity={0.15} luminanceThreshold={0.85} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.35} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}
