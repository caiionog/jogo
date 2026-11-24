/**
 * Avatar cartoon: só injeta o SVG do renderizador vetorial, escalável pela altura em px (`size`).
 * `bust` recorta cabeça e ombros. `animate`: respiração em 2 quadros e piscar, como no pixel art, só sem
 * `prefers-reduced-motion`.
 */
import { useEffect, useMemo, useState } from 'react';
import type { AvatarDescriptor } from '../../../engine';
import { VIEW_H, VIEW_W, renderVectorSvg, vectorBust } from './index';

function reducedMotion(): boolean {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export default function VectorAvatar({ d, size, bust = false, animate = false, label, className = '' }: { d: AvatarDescriptor; size: number; bust?: boolean; animate?: boolean; label?: string; className?: string }) {
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
  const { svg, w, h } = useMemo(() => {
    const crop = bust ? vectorBust(d) : undefined;
    const raw = renderVectorSvg(d, { frame, blink }, crop);
    // tamanho pelo contêiner
    return { svg: raw.replace(/ width="[\d.]+" height="[\d.]+"/, ' width="100%" height="100%"'), w: crop?.w ?? VIEW_W, h: crop?.h ?? VIEW_H };
  }, [d, bust, frame, blink]);
  return (
    <div
      role="img"
      aria-label={label ?? 'Avatar'}
      className={`inline-block shrink-0 ${className}`}
      style={{ height: size, width: Math.round((size * w) / h) }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
