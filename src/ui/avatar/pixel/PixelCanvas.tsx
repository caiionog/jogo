/** Mostra um PixelImage num <canvas> ampliado por escala inteira, sem suavização. */
import { useEffect, useRef } from 'react';
import type { PixelImage } from './render';

export default function PixelCanvas({ img, scale, className = '', label, crop }: { img: PixelImage; scale: number; className?: string; label?: string; crop?: { x: number; y: number; w: number; h: number } }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c = crop ?? { x: 0, y: 0, w: img.w, h: img.h };
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const data = new ImageData(new Uint8ClampedArray(img.data), img.w, img.h);
    ctx.clearRect(0, 0, c.w, c.h);
    ctx.putImageData(data, -c.x, -c.y);
  }, [img, c.x, c.y, c.w, c.h]);
  const s = Math.max(1, Math.round(scale));
  return (
    <canvas
      ref={ref}
      width={c.w}
      height={c.h}
      role="img"
      aria-label={label ?? 'Avatar'}
      className={className}
      style={{ width: c.w * s, height: c.h * s, imageRendering: 'pixelated' }}
    />
  );
}
