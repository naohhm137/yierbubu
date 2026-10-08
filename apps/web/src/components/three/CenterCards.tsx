import type { PublicRoomView } from '@yierbubu/shared';
import { CARD_SURFACE } from './tableSpace';
import { PrintedFace } from './PrintedFace';

export function CenterCards({ room }: { room: PublicRoomView }) {
  return <group position={[0, CARD_SURFACE, 0]}>
    {[{ x: -.8, title: '牌库', color: '#d6b890', count: 4 }, { x: .8, title: '弃牌', color: '#a8b79a', count: 3 }].map(pile =>
      <group key={pile.title} position={[pile.x, 0, .3]} rotation={[0, pile.x > 0 ? -.2 : .2, 0]}>
        {Array.from({ length: pile.count }, (_, i) => <mesh key={i} position={[0, i * .014, 0]} castShadow>
          <boxGeometry args={[.45, .018, .65]} /><meshStandardMaterial color={pile.color} roughness={.8} />
        </mesh>)}
        <group position={[0, pile.count * .014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <PrintedFace title={pile.title} color={pile.color} width={.42} height={.62} />
        </group>
      </group>
    )}
    {Array.from({ length: Math.min(room.wishFragments, 4) }, (_, i) => <mesh key={i} position={[(i - 1.5) * .16, .08, -.14]} rotation={[0, 0, Math.PI / 4]}>
      <octahedronGeometry args={[.055, 0]} /><meshStandardMaterial color="#dfba71" metalness={1} roughness={.35} />
    </mesh>)}
  </group>;
}
