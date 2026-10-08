import type { Scene } from '@yierbubu/shared';
import { TABLE_SURFACE } from './tableSpace';
import { PrintedFace } from './PrintedFace';

/** A stable, two-sided printed scene card, clear from every orbit angle. */
export function SceneCardDisplay({ scene }: { scene: Scene }) {
  return <group position={[0, TABLE_SURFACE + .26, -.52]}>
    <mesh castShadow><boxGeometry args={[.38, .46, .032]} /><meshStandardMaterial color="#f6eddf" roughness={.8} /></mesh>
    {[0, Math.PI].map(angle => <group key={angle} rotation={[0, angle, 0]}>
      <group position={[0, 0, .017]}><PrintedFace title={scene.name} text={scene.rule} color={scene.color || '#e4d3b1'} width={.35} height={.43} /></group>
    </group>)}
    <mesh position={[0, -.245, 0]}><boxGeometry args={[.46, .032, .16]} /><meshStandardMaterial color="#a0815e" roughness={.65} /></mesh>
  </group>;
}
