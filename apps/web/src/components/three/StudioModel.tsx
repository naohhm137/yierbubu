import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';

const DISPLAY_HEIGHT = 1.6;

/** Keep authored transforms and shared resources; normalize only the new wrapper. */
export function createStudioInstance(source: THREE.Object3D, height = DISPLAY_HEIGHT) {
  const instance = clone(source);
  instance.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(instance);
  const actualHeight = bounds.max.y - bounds.min.y;
  if (!Number.isFinite(actualHeight) || actualHeight <= 0) {
    throw new Error('角色模型没有有效尺寸');
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
export function StudioModel({ characterId }: { characterId: string }) {
  const { scene } = useGLTF(`/models/studio/${characterId}.glb`, false, false);
  const model = useMemo(() => createStudioInstance(scene), [scene]);
  return <primitive object={model} dispose={null} />;
}

export const studioModelHeight = DISPLAY_HEIGHT;
