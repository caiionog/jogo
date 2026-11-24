/** Avatar em pixel art (chunk à parte: só carrega quando o visual 'pixel' está ativo). */
import { useEffect, useMemo, useState } from 'react';
import type { AvatarDescriptor } from '../../engine';
import PixelCanvas from './pixel/PixelCanvas';
import { bustCrop, renderAvatar } from './pixel/render';

function reducedMotion(): boolean {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export default function PixelArtAvatar({ d, scale, bust = false, animate = false, label, className = '' }: { d: AvatarDescriptor; scale: number; bust?: boolean; animate?: boolean; label?: string; className?: string }) {
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
  // o renderizador de pixel art sempre devolve `kind: 'pixel'`
  const img = useMemo(() => renderAvatar(d, { frame, blink }), [d, frame, blink]);
  const crop = bust ? bustCrop(d) : undefined;
  return <PixelCanvas img={img} scale={scale} label={label ?? 'Avatar'} className={className} {...(crop ? { crop } : {})} />;
}
