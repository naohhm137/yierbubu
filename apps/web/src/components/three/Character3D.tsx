import React, { useRef, useMemo, Suspense, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Character } from '@yierbubu/shared';

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

/* ============================================================
   绮捐嚧鏉愯川 鈥?姣涚粧sheen + 娆¤〃闈㈡暎灏?+ 娓呮紗
   ============================================================ */
function FurMaterial({ color, sheen = 0.7 }: { color: string; sheen?: number }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.65}
      clearcoat={0.12}
      clearcoatRoughness={0.55}
      sheen={sheen}
      sheenColor={new THREE.Color(color).offsetHSL(0, 0.08, 0.18)}
      sheenRoughness={0.8}
    />
  );
}

function SkinMaterial({ color }: { color: string }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.45}
      clearcoat={0.25}
      clearcoatRoughness={0.4}
      sheen={0.35}
      sheenColor={new THREE.Color(color).offsetHSL(0, 0.1, 0.15)}
    />
  );
}

/* ============================================================
   绮捐嚧鐪肩潧 鈥?鐪肩櫧+铏硅啘+鐬冲瓟+鍙屽眰楂樺厜+鐪煎簳鍙嶅厜
   ============================================================ */
function CuteEye({ position, size = 0.07, blink = 0 }: { position: [number, number, number]; size?: number; blink?: number }) {
  const scaleY = 1 - blink * 0.9;
  return (
    <group position={position} scale={[1, scaleY, 1]}>
      {/* 鐪肩櫧 */}
      <mesh position={[0, 0, 0.002]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.12} clearcoat={0.9} clearcoatRoughness={0.08} />
      </mesh>
      {/* 铏硅啘 */}
      <mesh position={[0, -size * 0.08, size * 0.55]}>
        <sphereGeometry args={[size * 0.58, 24, 24]} />
        <meshPhysicalMaterial color="#2d1810" roughness={0.1} clearcoat={0.95} clearcoatRoughness={0.05} />
      </mesh>
      {/* 鐬冲瓟 */}
      <mesh position={[0, -size * 0.08, size * 0.85]}>
        <sphereGeometry args={[size * 0.32, 16, 16]} />
        <meshStandardMaterial color="#0a0503" roughness={0.06} />
      </mesh>
      {/* 涓婚珮鍏?*/}
      <mesh position={[-size * 0.18, size * 0.25, size * 1.05]}>
        <sphereGeometry args={[size * 0.2, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* 娆￠珮鍏?*/}
      <mesh position={[size * 0.22, -size * 0.2, size * 0.98]}>
        <sphereGeometry args={[size * 0.1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      {/* 鐪煎簳鍙嶅厜 */}
      <mesh position={[0, -size * 0.38, size * 0.85]}>
        <sphereGeometry args={[size * 0.08, 8, 8]} />
        <meshBasicMaterial color="#ffb3c6" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* 鑵孩 鈥?canvas寰勫悜娓愬彉 */
function Blush({ position, color = '#ff9eb5', size = 0.075 }: { position: [number, number, number]; color?: string; size?: number }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color + 'dd');
    g.addColorStop(0.4, color + '88');
    g.addColorStop(0.75, color + '33');
    g.addColorStop(1, color + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, [color]);
  return (
    <mesh position={position}>
      <circleGeometry args={[size, 32]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/* ============================================================
   涓€浜?鈥?鐪熸鐨?D浜哄舰妯″瀷锛堝熀浜庡師鍨嬬簿纭瘮渚嬶級
   浜屽ご韬細澶уご灏忚韩浣擄紝榛戝渾鑰虫湹锛岄粦铦磋澏棰嗙粨锛岀矇鑵孩锛屽悙鑸?
   ============================================================ */
function YierModel({ blink }: { blink: number }) {
  return (
    <group>
      {/* 韬綋 鈥?灏忚€屽渾锛堜簩澶磋韩锛岃韩浣撴洿灏忥級 */}
      <group position={[0, 0.3, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 48, 48]} />
          <FurMaterial color="#f8f4ee" />
        </mesh>
        {/* 鑲氱毊 */}
        <mesh position={[0, -0.02, 0.15]}>
          <sphereGeometry args={[0.13, 32, 32]} />
          <SkinMaterial color="#fffaf5" />
        </mesh>
      </group>

      {/* 宸︽墜 鈥?鏇村皬 */}
      <mesh position={[-0.24, 0.34, 0.07]} castShadow>
        <sphereGeometry args={[0.08, 24, 24]} />
        <FurMaterial color="#f8f4ee" />
      </mesh>
      {/* 鍙虫墜 */}
      <mesh position={[0.24, 0.34, 0.07]} castShadow>
        <sphereGeometry args={[0.08, 24, 24]} />
        <FurMaterial color="#f8f4ee" />
      </mesh>

      {/* 宸﹁剼 */}
      <mesh position={[-0.11, 0.07, 0.08]} castShadow>
        <sphereGeometry args={[0.095, 24, 24]} />
        <meshPhysicalMaterial color="#2a2a2a" roughness={0.4} clearcoat={0.3} />
      </mesh>
      {/* 鍙宠剼 */}
      <mesh position={[0.11, 0.07, 0.08]} castShadow>
        <sphereGeometry args={[0.095, 24, 24]} />
        <meshPhysicalMaterial color="#2a2a2a" roughness={0.4} clearcoat={0.3} />
      </mesh>

      {/* 灏忓熬宸?*/}
      <mesh position={[0, 0.28, -0.2]} castShadow>
        <sphereGeometry args={[0.06, 20, 20]} />
        <FurMaterial color="#f8f4ee" />
      </mesh>

      {/* 澶撮儴 鈥?闈炲父澶х殑鍦嗭紙浜屽ご韬紝澶村崰2/3锛?*/}
      <group position={[0, 0.78, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.4, 64, 64]} />
          <FurMaterial color="#f8f4ee" sheen={0.75} />
        </mesh>

        {/* 宸﹁€?鈥?榛戣壊瀹炲績鍦嗭紝鏇撮潬杩戝ご椤?*/}
        <mesh position={[-0.26, 0.32, -0.03]} castShadow>
          <sphereGeometry args={[0.115, 32, 32]} />
          <meshPhysicalMaterial color="#1f1f1f" roughness={0.5} clearcoat={0.2} sheen={0.4} />
        </mesh>
        {/* 鍙宠€?*/}
        <mesh position={[0.26, 0.32, -0.03]} castShadow>
          <sphereGeometry args={[0.115, 32, 32]} />
          <meshPhysicalMaterial color="#1f1f1f" roughness={0.5} clearcoat={0.2} sheen={0.4} />
        </mesh>

        {/* 鐪肩潧 鈥?鏇村皬锛岄棿璺濇洿澶?*/}
        <CuteEye position={[-0.14, 0.07, 0.35]} size={0.06} blink={blink} />
        <CuteEye position={[0.14, 0.07, 0.35]} size={0.06} blink={blink} />

        {/* 鑵孩 鈥?鏇村ぇ */}
        <Blush position={[-0.23, -0.05, 0.32]} color="#ff9eb5" size={0.08} />
        <Blush position={[0.23, -0.05, 0.32]} color="#ff9eb5" size={0.08} />

        {/* 榧诲瓙 */}
        <mesh position={[0, -0.01, 0.38]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#1f1f1f" roughness={0.25} />
        </mesh>

        {/* 鍢村反 鈥?鍚愯垖 */}
        <group position={[0, -0.11, 0.36]}>
          <mesh>
            <torusGeometry args={[0.042, 0.014, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#3d1f10" roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.02, 0.012]}>
            <sphereGeometry args={[0.024, 16, 16]} />
            <meshPhysicalMaterial color="#ff8fa3" roughness={0.35} clearcoat={0.4} />
          </mesh>
        </group>
      </group>

      {/* 澶磋韩琛旀帴 鈥?鑴栧瓙 */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <FurMaterial color="#f8f4ee" />
      </mesh>

      {/* 榛戣壊铦磋澏棰嗙粨 鈥?鏇撮珮浣嶇疆锛岄潬杩戝ご搴曢儴 */}
      <group position={[0, 0.54, 0.18]}>
        <mesh position={[-0.075, 0, 0]} rotation={[0, 0, 0.45]} castShadow>
          <sphereGeometry args={[0.065, 24, 24]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.28} clearcoat={0.65} clearcoatRoughness={0.2} />
        </mesh>
        <mesh position={[0.075, 0, 0]} rotation={[0, 0, -0.45]} castShadow>
          <sphereGeometry args={[0.065, 24, 24]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.28} clearcoat={0.65} clearcoatRoughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.25} clearcoat={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   甯冨竷 鈥?鐪熸鐨?D浜哄舰妯″瀷
   妫曡壊灏忕唺锛屾鑰虫湹锛岄粍鑵孩锛屾俯鍜屽井绗?
   ============================================================ */
function BubuModel({ blink }: { blink: number }) {
  return (
    <group>
      {/* 韬綋 */}
      <group position={[0, 0.3, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.21, 48, 48]} />
          <FurMaterial color="#b8895a" />
        </mesh>
        {/* 鑲氱毊 */}
        <mesh position={[0, -0.02, 0.15]}>
          <sphereGeometry args={[0.14, 32, 32]} />
          <SkinMaterial color="#d4a574" />
        </mesh>
      </group>

      {/* 宸︽墜 */}
      <mesh position={[-0.25, 0.34, 0.07]} castShadow>
        <sphereGeometry args={[0.082, 24, 24]} />
        <FurMaterial color="#b8895a" />
      </mesh>
      {/* 鍙虫墜 */}
      <mesh position={[0.25, 0.34, 0.07]} castShadow>
        <sphereGeometry args={[0.082, 24, 24]} />
        <FurMaterial color="#b8895a" />
      </mesh>

      {/* 宸﹁剼 */}
      <mesh position={[-0.11, 0.07, 0.08]} castShadow>
        <sphereGeometry args={[0.098, 24, 24]} />
        <FurMaterial color="#9a7040" />
      </mesh>
      {/* 鍙宠剼 */}
      <mesh position={[0.11, 0.07, 0.08]} castShadow>
        <sphereGeometry args={[0.098, 24, 24]} />
        <FurMaterial color="#9a7040" />
      </mesh>

      {/* 灏忓熬宸?*/}
      <mesh position={[0, 0.28, -0.21]} castShadow>
        <sphereGeometry args={[0.065, 20, 20]} />
        <FurMaterial color="#b8895a" />
      </mesh>

      {/* 澶撮儴 */}
      <group position={[0, 0.78, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.4, 64, 64]} />
          <FurMaterial color="#b8895a" sheen={0.75} />
        </mesh>

        {/* 宸﹁€?鈥?妫曡壊鍦嗚€筹紝鍐呰€虫祬鑹?*/}
        <group position={[-0.27, 0.28, -0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.125, 32, 32]} />
            <FurMaterial color="#9a7040" />
          </mesh>
          <mesh position={[0, -0.02, 0.05]}>
            <sphereGeometry args={[0.07, 20, 20]} />
            <SkinMaterial color="#d4a574" />
          </mesh>
        </group>
        {/* 鍙宠€?*/}
        <group position={[0.27, 0.28, -0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.125, 32, 32]} />
            <FurMaterial color="#9a7040" />
          </mesh>
          <mesh position={[0, -0.02, 0.05]}>
            <sphereGeometry args={[0.07, 20, 20]} />
            <SkinMaterial color="#d4a574" />
          </mesh>
        </group>

        {/* 鐪肩潧 */}
        <CuteEye position={[-0.14, 0.07, 0.35]} size={0.06} blink={blink} />
        <CuteEye position={[0.14, 0.07, 0.35]} size={0.06} blink={blink} />

        {/* 榛勮壊鑵孩 鈥?鏇村ぇ */}
        <Blush position={[-0.23, -0.05, 0.32]} color="#ffd54f" size={0.085} />
        <Blush position={[0.23, -0.05, 0.32]} color="#ffd54f" size={0.085} />

        {/* 鍢村懆娴呰壊 鈥?鏇村悎閫傜殑澶у皬 */}
        <mesh position={[0, -0.09, 0.32]}>
          <sphereGeometry args={[0.09, 28, 28]} />
          <SkinMaterial color="#d4a574" />
        </mesh>

        {/* 榧诲瓙 */}
        <mesh position={[0, -0.02, 0.38]}>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshStandardMaterial color="#4a3020" roughness={0.25} />
        </mesh>

        {/* 寰瑧鍢?*/}
        <mesh position={[0, -0.12, 0.36]}>
          <torusGeometry args={[0.044, 0.014, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#3d1f10" roughness={0.35} />
        </mesh>
      </group>

      {/* 澶磋韩琛旀帴 鈥?鑴栧瓙 */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <FurMaterial color="#b8895a" />
      </mesh>
    </group>
  );
}

/* ============================================================
   閫氱敤閰嶈3D妯″瀷 鈥?鐢ˋI鐢熸垚鐨?D娓叉煋鍥句綔涓烘闈紝鏈夊帤搴︾殑绔嬩綋鐗?
   锛堥厤瑙掔敤绔嬩綋鐗岋紝涓昏鐢ㄧ湡姝?D浜哄舰锛?
   ============================================================ */
function SupportCharacter({ characterId }: { characterId: string }) {
  const palette: Record<string, [string,string,string]> = {
    duoduo:['#b8d8f0','#eaf7ff','#8ac8ed'], tangtang:['#ffc8d8','#fff0f5','#ef7fa8'],
    asong:['#8bc34a','#dff2b8','#5e8e43'], yueyue:['#9575cd','#e6dafa','#d8c6ff'],
    xiaoban:['#ffb74d','#fff0cf','#e58e2f'], mimi:['#f48fb1','#ffe1ea','#ffd64a'],
    qiaoqiao:['#e0e8f8','#ffffff','#bca8ed'], tuantuan:['#ffd8d8','#fff0e6','#ff8c9a'],
    huahua:['#ba68c8','#f0d7f5','#f0a9ff'], kaka:['#b87333','#f1d0aa','#e4b15f'],
  };
  const [fur, belly, accent] = palette[characterId] ?? palette.duoduo;
  return <group>
    <mesh position={[0,0.29,0]} scale={[.28,.34,.24]} castShadow receiveShadow><sphereGeometry args={[1,28,20]}/><FurMaterial color={fur} sheen={.45}/></mesh>
    <mesh position={[0,.10,.205]} scale={[.14,.16,.035]}><sphereGeometry args={[1,20,14]}/><SkinMaterial color={belly}/></mesh>
    {([-1,1] as const).map(side=><group key={side} position={[side*.23,.37,0]}><mesh scale={[.12,.14,.11]} castShadow><sphereGeometry args={[1,20,16]}/><FurMaterial color={fur} sheen={.35}/></mesh><mesh position={[0,-.005,.09]} scale={[.062,.078,.018]}><sphereGeometry args={[1,16,12]}/><SkinMaterial color={belly}/></mesh></group>)}
    {([-1,1] as const).map(side=><mesh key={side} position={[side*.12,.03,.13]} scale={[.15,.11,.17]} castShadow><sphereGeometry args={[1,20,16]}/><FurMaterial color={fur} sheen={.45}/></mesh>)}
    <mesh position={[0,.29,-.24]} scale={[.09,.09,.09]} castShadow><sphereGeometry args={[1,16,12]}/><FurMaterial color={fur} sheen={.4}/></mesh>
    <mesh position={[0,.74,0]} scale={[.40,.36,.34]} castShadow receiveShadow><sphereGeometry args={[1,32,24]}/><FurMaterial color={fur} sheen={.55}/></mesh>
    {([-1,1] as const).map(side=><group key={side}><CuteEye position={[side*.14,.05,.30]} size={.054}/><Blush position={[side*.22,-.06,.285]} color={accent} size={.064}/></group>)}
    <mesh position={[0,-.015,.335]} scale={[.034,.026,.024]}><sphereGeometry args={[1,14,12]}/><meshStandardMaterial color="#36231e" roughness={.3}/></mesh>
    <mesh position={[0,-.095,.32]}><torusGeometry args={[.036,.010,10,20,Math.PI]}/><meshStandardMaterial color="#36231e" roughness={.3}/></mesh>
    <mesh position={[0,1.08,.02]} scale={[.10,.06,.04]} castShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={accent} roughness={.55}/></mesh>
  </group>;
}
/* 鍙€夋嫨鐩爣 鈥?鑴夊啿缁胯壊鍏夌幆 */
function TargetableRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 0.5 + Math.sin(t * 4) * 0.3;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
  });
  return (
    <mesh ref={ref} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.38, 0.52, 48]} />
      <meshBasicMaterial color="#4caf50" transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* 瑙掕壊妯″瀷璺敱 */
function CharacterModel({ characterId, blink }: { characterId?: string; blink: number }) {
  if (characterId === 'yier') return <YierModel blink={blink} />;
  if (characterId === 'bubu') return <BubuModel blink={blink} />;
  if (characterId) return <SupportCharacter characterId={characterId} />;
  return <BubuModel blink={blink} />;
}

/* ============================================================
   涓荤粍浠?
   ============================================================ */
export function Character3D({
  character,
  position,
  rotation,
  playerName,
  vitality = 4,
  friendship = 0,
  isActive = false,
  isDreaming = false,
  isTargetable = false,
}: Character3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const blink = 0;

  // 鐪ㄧ溂鍔ㄧ敾
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // 鍛煎惛鍔ㄧ敾 鈥?鏇村井濡?
    const breathe = 1 + Math.sin(t * 1.5 + position[0] * 1.5) * 0.006;
    const pressScale = pressed ? 0.95 : 1;
    groupRef.current.scale.setScalar(breathe * pressScale);
    // 婕傛诞 鈥?鏇村井濡欙紝鍩虹浣嶇疆璁╄剼鎺ヨЕ妗岄潰
    groupRef.current.position.y = position[1] - 0.06 + Math.sin(t * 1.1 + position[0] * 2) * 0.008;
    if (isActive) {
      groupRef.current.rotation.z = Math.sin(t * 2) * 0.012;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <Suspense fallback={null}>
        <group scale={0.82}>
          <Float speed={0.6} rotationIntensity={0.015} floatIntensity={0.03}>
            <CharacterModel characterId={character?.id} blink={blink} />
          </Float>
        </group>
      </Suspense>

      {/* 鍚嶅瓧鐗?*/}
      {playerName && (
        <Billboard position={[0, 1.22, 0]}>
          <mesh>
            <planeGeometry args={[0.85, 0.17]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
          <Text
            position={[0, 0, 0.005]}
            fontSize={0.072}
            color={isActive ? '#1565c0' : '#5d4037'}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.78}
            fontWeight="bold"
          >
            {playerName}
          </Text>
        </Billboard>
      )}

      {/* 娲诲姏蹇冨績 */}
      <Billboard position={[-0.14, 1.38, 0]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[i * 0.085, 0, 0]}>
            <sphereGeometry args={[0.03, 10, 10]} />
            <meshBasicMaterial color={i < vitality ? '#ff5252' : '#e0e0e0'} />
          </mesh>
        ))}
      </Billboard>

      {/* 鍙嬫儏鍊?*/}
      {friendship > 0 && (
        <Billboard position={[0.17, 1.38, 0]}>
          {Array.from({ length: Math.min(friendship, 6) }).map((_, i) => (
            <mesh key={i} position={[i * 0.07, 0, 0]}>
              <sphereGeometry args={[0.024, 8, 8]} />
              <meshBasicMaterial color="#ff80ab" />
            </mesh>
          ))}
        </Billboard>
      )}

      {/* 娲昏穬鍏夌幆 */}
      {isActive && (
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 48]} />
          <meshBasicMaterial color="#2196f3" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 鍙€夋嫨鐩爣鍏夌幆 鈥?鑴夊啿缁胯壊 */}
      {isTargetable && (
        <TargetableRing />
      )}

      {/* 姊﹀鐘舵€?*/}
      {isDreaming && (
        <Billboard position={[0.3, 1.5, 0]}>
          <Text fontSize={0.1} color="#9575cd" anchorX="center" fontWeight="bold">馃挙</Text>
        </Billboard>
      )}
    </group>
  );
}
