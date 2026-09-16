import { Suspense, useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { getCharacter } from '@yierbubu/shared';
import { StudioModel } from './three/StudioModel.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { useDeviceQuality } from '../hooks/useDeviceQuality.js';

type PreviewAction = 'left' | 'right' | 'up' | 'down' | 'in' | 'out' | 'reset';
type PreviewStatus = 'loading' | 'ready' | 'failed';
type ControlsRef = RefObject<OrbitControlsImpl>;

const buttonStyle: CSSProperties = {
  minWidth: 42, minHeight: 42, padding: '6px 10px', borderRadius: 12,
  border: '1px solid #cbb9a4', color: '#493b31', background: '#fffaf0',
  fontSize: 15, cursor: 'pointer',
};

function StudioPortrait({ characterId, label }: { characterId: string; label: string }) {
  const [source, setSource] = useState<'portrait' | 'avatar' | 'unavailable'>('portrait');
  const character = getCharacter(characterId);
  if (source === 'unavailable') return <div style={{ display: 'grid', height: '100%', placeItems: 'center', color: '#755e53' }}>{label}</div>;
  return <img
    src={source === 'portrait' ? `/studio/portraits/${characterId}.webp` : character?.avatar}
    alt={`${label}角色立绘`}
    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
    onError={() => setSource(current => current === 'portrait' && character?.avatar ? 'avatar' : 'unavailable')}
  />;
}

function PreviewUnavailable({ characterId, label, onFail }: { characterId: string; label: string; onFail: () => void }) {
  useEffect(onFail, [onFail]);
  return <StudioPortrait characterId={characterId} label={label} />;
}

function PreviewLifecycle({ controls, onFail }: { controls: ControlsRef; onFail: () => void }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    camera.position.set(0, 1.12, 3.4);
    controls.current?.target.set(0, .8, 0);
    controls.current?.update();
    controls.current?.saveState();
    const canvas = gl.domElement;
    const contextLost = (event: Event) => { event.preventDefault(); onFail(); };
    canvas.addEventListener('webglcontextlost', contextLost);
    return () => canvas.removeEventListener('webglcontextlost', contextLost);
  }, [camera, gl, controls, onFail]);
  return null;
}

function LoadedFigure({ characterId, mobile, onReady }: { characterId: string; mobile: boolean; onReady: () => void }) {
  // This component commits only once its child GLB has resolved in Suspense.
  useEffect(onReady, [onReady]);
  return <>
    <StudioModel characterId={characterId} />
    <ContactShadows key={characterId} position={[0, .003, 0]} scale={3.6}
      opacity={.3} blur={2.6} far={2.2} resolution={mobile ? 128 : 256} frames={1} />
  </>;
}

function PreviewScene({ characterId, controls, reduced, mobile, onReady, onFail }: {
  characterId: string; controls: ControlsRef; reduced: boolean; mobile: boolean;
  onReady: () => void; onFail: () => void;
}) {
  return <>
    <color attach="background" args={['#f3e8dc']} />
    <ambientLight intensity={1.15} color="#fff8ee" />
    <hemisphereLight args={['#fffaf4', '#cdb9a2', 1.1]} />
    <directionalLight position={[2.8, 4.5, 3.2]} intensity={2.2} color="#fff0dc" />
    <directionalLight position={[-2.5, 2.2, 1.5]} intensity={.75} color="#d9e4f4" />
    <directionalLight position={[-1, 3, -2]} intensity={1.15} color="#fff9ef" />
    <Suspense fallback={null}>
      <LoadedFigure characterId={characterId} mobile={mobile} onReady={onReady} />
    </Suspense>
    <OrbitControls ref={controls} enablePan={false} enableZoom
      minDistance={mobile ? 2.7 : 2.25} maxDistance={mobile ? 4.2 : 4.8}
      minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 1.9} target={[0, .8, 0]}
      enableDamping={!reduced} dampingFactor={.08} />
    <PreviewLifecycle controls={controls} onFail={onFail} />
  </>;
}

function Preview({ characterId }: { characterId: string }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const reduced = useReducedMotion();
  const { isMobile } = useDeviceQuality();
  const [status, setStatus] = useState<PreviewStatus>('loading');
  const hintId = useId();
  const label = getCharacter(characterId)?.name ?? '角色';
  const onReady = useCallback(() => setStatus('ready'), []);
  const onFail = useCallback(() => setStatus('failed'), []);

  const nudge = (action: PreviewAction) => {
    const control = controls.current;
    if (!control || status !== 'ready') return;
    if (action === 'reset') { control.reset(); return; }
    if (action === 'left' || action === 'right') {
      control.setAzimuthalAngle(control.getAzimuthalAngle() + (action === 'left' ? -.25 : .25));
    } else if (action === 'up' || action === 'down') {
      control.setPolarAngle(control.getPolarAngle() + (action === 'up' ? -.12 : .12));
    } else {
      const distance = Math.max(control.minDistance, Math.min(control.maxDistance, control.getDistance() * (action === 'in' ? .88 : 1.12)));
      control.object.position.sub(control.target).setLength(distance).add(control.target);
    }
    control.update();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey || status !== 'ready') return;
    const actions: Record<string, PreviewAction> = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      '+': 'in', '=': 'in', '-': 'out', Home: 'reset',
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    nudge(action);
  };
  const buttons: { action: PreviewAction; text: string; label: string }[] = [
    { action: 'left', text: '↶', label: '向左旋转' }, { action: 'right', text: '↷', label: '向右旋转' },
    { action: 'in', text: '＋', label: '放大角色' }, { action: 'out', text: '－', label: '缩小角色' },
    { action: 'reset', text: '复位', label: '重置角色视角' },
  ];
  return <div role="region" aria-label={`${label}的三维角色预览`} aria-describedby={hintId}
    tabIndex={0} onKeyDown={onKeyDown}
    style={{ height: isMobile ? 340 : 480, width: '100%', overflow: 'hidden', borderRadius: 24,
      background: '#f3e8dc', position: 'relative', outlineOffset: 4 }}>
    {status === 'failed' ? <StudioPortrait characterId={characterId} label={label} /> :
      <ErrorBoundary fallback={<PreviewUnavailable characterId={characterId} label={label} onFail={onFail} />}>
        <Canvas camera={{ position: [0, 1.12, 3.4], fov: 34, near: .1, far: 20 }}
          frameloop="demand" dpr={[1, isMobile ? 1.25 : 1.75]}
          gl={{ antialias: !isMobile, alpha: false, powerPreference: 'low-power' }}
          fallback={<PreviewUnavailable characterId={characterId} label={label} onFail={onFail} />}>
          <PreviewScene characterId={characterId} controls={controls} reduced={reduced}
            mobile={isMobile} onReady={onReady} onFail={onFail} />
        </Canvas>
      </ErrorBoundary>}
    {status === 'loading' && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: '#f3e8dc' }}>
      <StudioPortrait characterId={characterId} label={label} />
    </div>}
    <div role="group" aria-label="预览视角控制" style={{ position: 'absolute', left: 12, right: 12, bottom: 34, display: 'flex', gap: 6, justifyContent: 'center' }}>
      {buttons.map(button => <button key={button.action} type="button" aria-label={button.label} title={button.label}
        disabled={status !== 'ready'} onClick={() => nudge(button.action)}
        style={{ ...buttonStyle, opacity: status === 'ready' ? 1 : .45, cursor: status === 'ready' ? 'pointer' : 'default' }}>
        {button.text}
      </button>)}
    </div>
    <p id={hintId} role="status" style={{ position: 'absolute', left: 8, right: 8, bottom: 9, margin: 0, textAlign: 'center', color: '#755e53', fontSize: 12, pointerEvents: 'none' }}>
      {status === 'loading' ? '正在加载三维角色…' : status === 'failed' ? '三维预览暂不可用，已显示角色立绘' : '拖动旋转 · 滚轮或双指缩放 · 方向键 / Home'}
    </p>
  </div>;
}

export default function CharacterPreview({ characterId }: { characterId: string }) {
  return <Preview key={characterId} characterId={characterId} />;
}
