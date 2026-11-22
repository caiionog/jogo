/** Renderizador oculto compartilhado das miniaturas (parte do chunk 3D). */
import * as THREE from 'three';
import type { AvatarDescriptor } from '../../engine';
import { addLights, buildBust, bustFrame, disposeBust, frameCamera } from './bust';

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 20);

export function snapshot(d: AvatarDescriptor, size: number): string {
  if (!renderer) {
    const canvas = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    addLights(scene);
  }
  const px = Math.round(size * Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(px, px, false);
  const bust = buildBust(d);
  scene!.add(bust);
  frameCamera(camera, bustFrame(bust), 1.06, true);
  renderer.render(scene!, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene!.remove(bust);
  disposeBust(bust);
  return url;
}
