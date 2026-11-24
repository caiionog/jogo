/**
 * Avatar cartoon: só injeta o SVG do renderizador vetorial, escalável pela altura em px (`size`).
 * `bust` recorta cabeça e ombros.
 */
import { useMemo } from 'react';
import type { AvatarDescriptor } from '../../../engine';
import { VIEW_H, VIEW_W, renderVectorSvg, vectorBust } from './index';

export default function VectorAvatar({ d, size, bust = false, label, className = '' }: { d: AvatarDescriptor; size: number; bust?: boolean; label?: string; className?: string }) {
  const { svg, w, h } = useMemo(() => {
    const crop = bust ? vectorBust(d) : undefined;
    const raw = renderVectorSvg(d, {}, crop);
    // tamanho pelo contêiner
    return { svg: raw.replace(/ width="[\d.]+" height="[\d.]+"/, ' width="100%" height="100%"'), w: crop?.w ?? VIEW_W, h: crop?.h ?? VIEW_H };
  }, [d, bust]);
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
