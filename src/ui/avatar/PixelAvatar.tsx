/**
 * Avatar em pixel art: corpo inteiro (perfil, guarda-roupa, criação) ou busto (topo da tela principal).
 * Animação leve (respiração em 2 quadros e piscar) só quando `animate`, respeitando prefers-reduced-motion.
 */
import { useEffect, useMemo, useState } from 'react';
import type { AvatarDescriptor } from '../../engine';
import PixelCanvas from './pixel/PixelCanvas';
import { PixelAvatarRenderer as R } from './renderer';

function reducedMotion(): boolean {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export default function PixelAvatar({ d, scale, bust = false, animate = false, label, className = '' }: { d: AvatarDescriptor; scale: number; bust?: boolean; animate?: boolean; label?: string; className?: string }) {
  const [frame, setFrame] = useState<0 | 1>(0);
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!animate || reducedMotion()) return;
    const breathe = setInterval(() => setFrame((f) => (f ? 0 : 1)), 900);
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        schedule();
      }, 3000 + Math.random() * 3000);
    };
    schedule();
    return () => {
      clearInterval(breathe);
      clearTimeout(t);
    };
  }, [animate]);
  const img = useMemo(() => R.render(d, { frame, blink }), [d, frame, blink]);
  const crop = bust ? R.bust(d) : undefined;
  return <PixelCanvas img={img} scale={scale} label={label ?? 'Avatar'} className={className} {...(crop ? { crop } : {})} />;
}
