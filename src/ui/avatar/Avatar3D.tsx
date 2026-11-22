/**
 * Canvas 3D ao vivo (chunk "avatar3d", carregado sob demanda). Um só por tela.
 * frameloop="demand": parado não desenha nada; só redesenha quando o descriptor muda (com transição de ~500 ms)
 * ou quando o jogador gira o busto na tela cheia.
 */
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { AvatarDescriptor } from '../../engine';
import { addLights, buildBust, bustFrame, disposeBust, frameCamera, frameCenter } from './bust';
import { lerpDescriptor } from './lerp';

const TRANSITION_MS = 500;

function useTransition(target: AvatarDescriptor): AvatarDescriptor {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const shownRef = useRef(target);
  shownRef.current = shown;
  useEffect(() => {
    from.current = shownRef.current;
    if (from.current === target) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / TRANSITION_MS);
      const e = t * t * (3 - 2 * t);
      setShown(lerpDescriptor(from.current, target, e));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

function Bust({ d, orbit }: { d: AvatarDescriptor; orbit: boolean }) {
  const shown = useTransition(d);
  const group = useMemo(() => buildBust(shown), [shown]);
  const { camera, scene, invalidate } = useThree();
  useEffect(() => () => disposeBust(group), [group]);
  // enquadra pela altura do busto (bebê → adulto)
  const frame = bustFrame(group);
  useEffect(() => {
    if (!orbit) frameCamera(camera as THREE.PerspectiveCamera, frame);
    invalidate();
  }, [camera, frame.top, frame.bottom, frame.shoulderY, orbit, invalidate]);
  useEffect(() => {
    if (scene.userData.lit) return;
    addLights(scene);
    scene.userData.lit = true;
  }, [scene]);
  return (
    <>
      <primitive object={group} />
      {orbit && (
        <OrbitControls
          target={[0, frameCenter(frame), 0]}
          enablePan={false}
          minDistance={(frame.top - frame.bottom) * 1.2}
          maxDistance={(frame.top - frame.bottom) * 3.2}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.62}
          enableDamping={false}
        />
      )}
    </>
  );
}

export default function Avatar3D({ d, orbit = false, className = '', onReady }: { d: AvatarDescriptor; orbit?: boolean; className?: string; onReady?: () => void }) {
  return (
    <Canvas
      className={className}
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      camera={{ fov: 26, near: 0.1, far: 20, position: [0, 1, orbit ? 5 : 4.2] }}
      onCreated={({ camera }) => {
        if (orbit) {
          const f = bustFrame(buildBustFrameOnly(d));
          frameCamera(camera as THREE.PerspectiveCamera, f, 1.5);
        }
        onReady?.();
      }}
    >
      <Bust d={d} orbit={orbit} />
    </Canvas>
  );
}

/** Só para o enquadramento inicial da tela cheia. */
function buildBustFrameOnly(d: AvatarDescriptor): THREE.Group {
  const g = buildBust(d);
  disposeBust(g);
  return g;
}
