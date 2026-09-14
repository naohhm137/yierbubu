import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Figurine } from './three/Figurine.js';

export default function CharacterPreview({ characterId }: { characterId: string }) {
  return (
    <div
      role="img"
      aria-label="可拖动旋转的角色 3D 预览"
      style={{
        height: 260,
        width: '100%',
        overflow: 'hidden',
        borderRadius: 20,
        background: '#faf5ed',
      }}
    >
      <Canvas
        camera={{ position: [0, 1.25, 3.3], fov: 36 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#faf5ed']} />
        <ambientLight intensity={1.4} color="#fff4e6" />
        <hemisphereLight intensity={1.1} color="#fffaf2" groundColor="#d9b99b" />
        <directionalLight position={[2.5, 3.5, 3]} intensity={2.2} color="#fff2dc" />
        <directionalLight position={[-2, 1.5, 1]} intensity={.8} color="#c6dcff" />
        <Figurine characterId={characterId} />
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={2.5}
          maxDistance={4.5}
          target={[0, .75, 0]}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>
      <p style={{ margin: '-2rem 0 0', position: 'relative', textAlign: 'center', color: '#755e53', fontSize: '.78rem', pointerEvents: 'none' }}>
        拖动查看角色 · 滚轮缩放
      </p>
    </div>
  );
}
