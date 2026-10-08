import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const DISPLAY_HEIGHT = 1.6;

/** Keep authored transforms and shared resources; normalize only the new wrapper. */
export function createStudioInstance(source: THREE.Object3D, height = DISPLAY_HEIGHT) {
  const instance = clone(source);
  instance.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(instance);
  const actualHeight = bounds.max.y - bounds.min.y;
  if (!Number.isFinite(actualHeight) || actualHeight <= 0) {
    // Some GLTF exporters omit world matrices on the first frame. Keep the
    // authored scene visible while the renderer settles instead of blanking
    // the preview; the next mount will normalize it.
    instance.scale.setScalar(height / 2.6);
    instance.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        (object as THREE.Mesh).castShadow = true;
        (object as THREE.Mesh).receiveShadow = true;
      }
    });
    return instance;
  }
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = height / actualHeight;
  const model = new THREE.Group();
  model.add(instance);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  instance.traverse((object) => {
    if (!(object as THREE.Mesh).isMesh) return;
    const mesh = object as THREE.Mesh;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
  return model;
}

/**
 * Loads one authored GLB and clones it per player. The GLTF cache owns the
 * source scene; cloned meshes deliberately opt out of drei disposal so one
 * player unmounting cannot invalidate another player's shared resources.
 */
export function StudioModel({ characterId, active = false, dreaming = false }: { characterId: string; active?: boolean; dreaming?: boolean }) {
  const { scene, animations } = useGLTF(`/models/studio/${characterId}.glb`, false, false);
  const reduced = useReducedMotion();
  const { gl } = useThree();
  const model = useMemo(() => createStudioInstance(scene), [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  useEffect(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    model.traverse(object => {
      if (!(object as THREE.Mesh).isMesh) return;
      const material = (object as THREE.Mesh).material;
      for (const mat of Array.isArray(material) ? material : [material]) {
        const pbr = mat as THREE.MeshStandardMaterial;
        for (const texture of [pbr.map, pbr.normalMap, pbr.roughnessMap]) {
          if (texture) texture.anisotropy = anisotropy;
        }
      }
    });
  }, [gl, model]);
  useEffect(() => {
    if (!reduced) {
      for (const name of ['Idle', 'Blink']) {
        const clip = animations.find(item => item.name === name);
        if (clip) mixer.clipAction(clip).play();
      }
    }
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(model); };
  }, [animations, mixer, model, reduced]);
  useEffect(() => {
    const clip = animations.find(item => item.name === 'Celebrate');
    if (!clip || reduced || !active || dreaming) return;
    const action = mixer.clipAction(clip);
    action.reset().setLoop(THREE.LoopOnce, 1).fadeIn(.18).play();
    return () => { action.stop(); };
  }, [active, dreaming, reduced, animations, mixer]);
  useFrame((_, delta) => { if (!reduced) mixer.update(Math.min(delta, .05)); });
  return <primitive object={model} dispose={null} />;
}

export const studioModelHeight = DISPLAY_HEIGHT;
