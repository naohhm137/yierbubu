import { Environment, Lightformer } from '@react-three/drei';

/** Local photographic reflectors. No HDR/CDN request can break the scene. */
export function StudioLighting({ mobile = false, shadows = false }: { mobile?: boolean; shadows?: boolean }) {
  return <>
    <ambientLight intensity={.28} color="#fffdfa" />
    <hemisphereLight args={['#edf3f5', '#c9b9a6', .6]} />
    <directionalLight position={[4, 7, 5]} intensity={1.8} color="#fff9f1"
      castShadow={shadows} shadow-mapSize={[mobile ? 1024 : 2048, mobile ? 1024 : 2048]}
      shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6}
      shadow-camera-near={.5} shadow-camera-far={24} shadow-bias={-.0001} shadow-normalBias={.015} shadow-radius={3} />
    <directionalLight position={[-4, 3, 2]} intensity={.55} color="#e5eef5" />
    <directionalLight position={[1, 5, -4]} intensity={.85} color="#fff5da" />
    <Environment frames={1} resolution={mobile ? 128 : 256} environmentIntensity={.55}>
      <color attach="background" args={['#a2a5a1']} />
      <Lightformer form="rect" intensity={3} color="#fff6e8" scale={[5, 6, 1]} position={[4, 5, 3]} rotation={[0, -Math.PI / 3, 0]} />
      <Lightformer form="rect" intensity={1.3} color="#e6f0f7" scale={[4, 4, 1]} position={[-4, 3, 2]} rotation={[0, Math.PI / 3, 0]} />
      <Lightformer form="rect" intensity={2} color="#fff2d6" scale={[3, 5, 1]} position={[0, 4, -5]} rotation={[0, Math.PI, 0]} />
    </Environment>
  </>;
}
