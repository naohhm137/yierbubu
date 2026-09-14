import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Vec3 = [number, number, number];
// Unit geometry and a small, bounded palette are shared by all twelve figures.
const sphere = new THREE.SphereGeometry(1, 32, 24);
const materials = new Map<string, THREE.MeshStandardMaterial>();
function material(color: string) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .72, metalness: 0 }));
  return materials.get(color)!;
}
function Orb({ at, size, color, rotate = [0,0,0] }: { at: Vec3; size: Vec3; color: string; rotate?: Vec3 }) {
  return <mesh position={at} scale={size} rotation={rotate} geometry={sphere} material={material(color)} dispose={null} castShadow receiveShadow />;
}
function Cap({ color, chef = false }: { color: string; chef?: boolean }) {
  return <group position={[0,.29,-.015]} rotation={[0,0,-.12]}>
    <Orb at={[0,.02,0]} size={[.3,chef ? .16 : .095,.26]} color={color} />
    <Orb at={[0,-.035,.12]} size={[.3,.035,.2]} color={color} />
    {chef ? [-.13,0,.13].map(x=><Orb key={x} at={[x,.12,0]} size={[.12,.13,.15]} color={color}/>) : <Orb at={[.04,.115,-.015]} size={[.04,.04,.04]} color={color}/>}
  </group>;
}
function Star({ at, color, size = .09 }: { at: Vec3; color: string; size?: number }) {
  return <group position={at}>
    {[0,1,2,3,4].map(i=><Orb key={i} at={[Math.sin(i*Math.PI*.4)*size*.6,Math.cos(i*Math.PI*.4)*size*.6,0]} size={[size*.32,size*.66,size*.22]} rotate={[0,0,-i*Math.PI*.4]} color={color}/>)}
  </group>;
}
function Face({ blush = '#eeb0ad', muzzle = false, tongue = false }: { blush?: string; muzzle?: boolean; tongue?: boolean }) {
  const eyes = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    if (!eyes.current) return;
    const phase = clock.elapsedTime % 4.7;
    eyes.current.scale.y = reduced ? 1 : 1 - Math.sin(Math.max(0,(phase-4.48)/.22)*Math.PI)*.88;
  });
  return <group position={[0,0,.317]}>
    <group ref={eyes} position={[0,.025,0]}>
      {[-1,1].map(side=><Orb key={side} at={[side*.126,0,.008]} size={[.024,.030,.016]} color="#332821"/>)}
    </group>
    {[-1,1].map(side=><Orb key={side} at={[side*.225,-.085,-.042]} size={[.061,.04,.018]} color={blush}/>)}
    {muzzle && <Orb at={[0,-.092,.012]} size={[.083,.065,.024]} color="#ddbc95"/>}
    <Orb at={[0,-.051,.038]} size={[.023,.016,.014]} color="#332821"/>
    {[-1,1].map(side=><mesh key={side} position={[side*.024,-.066,.033]} rotation={[0,0,Math.PI]}>
      <torusGeometry args={[.024,.005,8,16,Math.PI]}/><meshStandardMaterial color="#332821" roughness={.7}/>
    </mesh>)}
    {tongue && <Orb at={[.01,-.096,.043]} size={[.015,.019,.009]} color="#db8c91"/>}
  </group>;
}

const palette: Record<string,[string,string,string]> = {
  yier:['#fff9f0','#fffdf6','#e9a4b4'], bubu:['#ba875c','#dfbc91','#e3bf65'],
  duoduo:['#d1e6e8','#f2f8f4','#79aab7'], tangtang:['#ebadc0','#fff1df','#c97188'],
  asong:['#b4845e','#f1d9af','#789271'], yueyue:['#b4a4c8','#efe9f0','#d5bd6e'],
  xiaoban:['#ddad70','#f4e4c3','#637e8b'], mimi:['#e5c784','#fff0c8','#bd829e'],
  qiaoqiao:['#e5e6f1','#fafafa','#a6a0c6'], tuantuan:['#f4dfc9','#fff1df','#d7a383'],
  huahua:['#d6b4c8','#f5e5e5','#7e9c87'], kaka:['#97aeb2','#d4e0dc','#bf8e56'],
};

function Accessory({ id, accent }: { id: string; accent: string }) {
  if (id === 'yier') return <Cap color={accent}/>;
  if (id === 'tangtang') return <Cap color="#fff9ed" chef/>;
  if (id === 'yueyue') return <group position={[0,.34,0]} rotation={[0,0,.12]}>
    <mesh><coneGeometry args={[.20,.44,32]}/><meshStandardMaterial color="#7d729c" roughness={.85}/></mesh>
    <Orb at={[0,-.20,0]} size={[.29,.035,.26]} color="#7d729c"/><Star at={[0,-.02,.15]} color={accent} size={.065}/>
  </group>;
  if (id === 'mimi') return <Star at={[.16,.36,.01]} color="#e6bc5c" size={.13}/>;
  if (id === 'huahua') return <group><Cap color="#819d88"/><Orb at={[.3,-.48,.16]} size={[.018,.19,.018]} color="#b78a61"/><Orb at={[.3,-.29,.16]} size={[.028,.055,.025]} color="#9f6877"/></group>;
  if (id === 'duoduo') return <group>
    {[-.2,0,.2].map((x,i)=><Orb key={x} at={[x,.24,0]} size={[.18,i===1?.16:.12,.22]} color="#f0f6f0"/>)}
    <mesh position={[.23,-.43,.21]} rotation={[0,0,-.2]}><boxGeometry args={[.16,.12,.045]}/><meshStandardMaterial color={accent}/></mesh>
  </group>;
  if (id === 'asong') return <group><Cap color={accent}/><Orb at={[.03,.29,.04]} size={[.035,.15,.05]} rotate={[0,0,-.6]} color="#a4b288"/></group>;
  if (id === 'xiaoban') return <group><Cap color={accent}/>{[-1,1].map(s=><mesh key={s} position={[s*.10,.17,.28]}><torusGeometry args={[.065,.017,10,24]}/><meshStandardMaterial color="#bc9563"/></mesh>)}</group>;
  if (id === 'kaka') return <group>{[-1,1].map(s=><Orb key={s} at={[s*.39,.04,0]} size={[.065,.12,.095]} color={accent}/>)}<Orb at={[0,.36,0]} size={[.025,.07,.025]} color={accent}/><Orb at={[0,.44,0]} size={[.046,.046,.046]} color="#d2917f"/></group>;
  if (id === 'tuantuan') return <group>{[-.13,-.065,0,.065,.13].map(x=><Orb key={x} at={[x,.29,0]} size={[.065,.10,.12]} color="#e3c6aa"/>)}</group>;
  if (id === 'qiaoqiao') return <Star at={[.22,.27,.17]} color="#c5b8d4" size={.07}/>;
  return null;
}

export function Figurine({ characterId = 'bubu' }: { characterId?: string }) {
  const [fur,belly,accent] = palette[characterId] ?? palette.bubu;
  const ghost = characterId === 'qiaoqiao';
  const robot = characterId === 'kaka';
  const bear = characterId === 'yier' || characterId === 'bubu';
  return <group position={[0,.035,0]}>
    <Orb at={[0,.32,0]} size={[.25,.31,.21]} color={fur}/>
    <Orb at={[0,.30,.178]} size={[.16,.20,.045]} color={belly}/>
    {[-1,1].map(s=><group key={s}>
      <Orb at={[s*.26,.36,.035]} size={[.095,.16,.105]} rotate={[0,0,s*.22]} color={fur}/>
      <Orb at={[s*.135,.075,.09]} size={[.12,.085,.15]} color={fur}/>
    </group>)}
    {ghost && [-.2,-.1,0,.1,.2].map(x=><Orb key={x} at={[x,.105,.04]} size={[.075,.09,.17]} color={fur}/>)}
    {characterId==='asong' ? <Orb at={[.19,.38,-.28]} size={[.19,.35,.19]} rotate={[0,0,-.35]} color="#a87952"/> : <Orb at={[0,.26,-.22]} size={[.075,.075,.075]} color={fur}/>}
    <group position={[0,.83,0]}>
      {!ghost && !robot && [-1,1].map(s=><group key={s} position={[s*.27,.245,-.035]}>
        <Orb at={[0,0,0]} size={[bear?.108:.10,bear?.11:.135,.085]} color={fur}/>
        <Orb at={[0,0,.06]} size={[.055,.06,.018]} color={bear?'#d0a28d':belly}/>
      </group>)}
      <Orb at={[0,0,0]} size={[.39,.34,.32]} color={fur}/>
      <Face blush={accent} muzzle={characterId==='bubu'||characterId==='asong'} tongue={characterId==='yier'}/>
      <Accessory id={characterId} accent={accent}/>
    </group>
    {characterId==='bubu' && <group position={[0,.51,.20]}><Orb at={[-.055,0,0]} size={[.065,.035,.025]} color="#81957d"/><Orb at={[.055,0,0]} size={[.065,.035,.025]} color="#81957d"/><Orb at={[0,0,.015]} size={[.03,.03,.025]} color="#71876c"/></group>}
  </group>;
}
