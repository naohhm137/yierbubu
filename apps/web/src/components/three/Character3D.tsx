import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Character } from '@yierbubu/shared';
import { Figurine } from './Figurine';
import { useReducedMotion } from '../../hooks/useReducedMotion';

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

export function Character3D({
  character, position, rotation, playerName, vitality = 4, friendship = 0,
  isActive = false, isDreaming = false, isTargetable = false,
}: Character3DProps) {
  const figure = useRef<THREE.Group>(null);
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  useFrame(({ clock }, delta) => {
    if (!figure.current) return;
    const breathe = reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 1.5 + position[0]) * .005;
    const target = (pressed ? .97 : 1) * breathe;
    figure.current.scale.setScalar(THREE.MathUtils.damp(figure.current.scale.x, target, 16, delta));
  });
  return <group position={position} rotation={rotation}
    onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerLeave={() => setPressed(false)}>
    <group ref={figure}><Figurine characterId={character?.id}/></group>
    {playerName && <Html center position={[0,1.58,0]} style={{pointerEvents:'none',whiteSpace:'nowrap'}}>
      <div style={{padding:'5px 9px',borderRadius:10,background:isActive?'#493b31':'#fffcf4',color:isActive?'#fff9ec':'#493b31',fontFamily:'system-ui, sans-serif',fontSize:12,boxShadow:'0 2px 8px #493b3120',textAlign:'center',border:isTargetable?'2px solid #5d886c':'1px solid #bfa78d'}}>
        <strong>{playerName}</strong>
        <div style={{fontSize:10,marginTop:2}}>活力 {vitality} · 友情 {friendship}{isDreaming ? ' · 梦境中' : ''}</div>
      </div>
    </Html>}
    {(isActive || isTargetable) && <mesh position={[0,.012,0]} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[.37,.43,48]}/>
      <meshBasicMaterial color={isTargetable?'#5d886c':'#d7b96c'} transparent opacity={.8} side={THREE.DoubleSide}/>
    </mesh>}
  </group>;
}
