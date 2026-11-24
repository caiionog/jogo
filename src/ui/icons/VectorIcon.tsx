/** Ícone cartoon (SVG vetorial). Chunk à parte, carregado só no visual 'cartoon'. */
import { crimeIconSvg, factionIconSvg, marketIconSvg, uniformIconSvg } from './vector';
import type { IconSet } from './GameIcon';

const svgCache = new Map<string, string>();

export function iconSvg(set: IconSet, id: string, colors?: readonly [string, string]): string {
  const key = `${set}:${id}:${colors?.join(',') ?? ''}`;
  const hit = svgCache.get(key);
  if (hit) return hit;
  const svg = set === 'market' ? marketIconSvg(id) : set === 'crime' ? crimeIconSvg(id) : set === 'uniform' ? uniformIconSvg(id) : factionIconSvg(id, colors ?? ['#4a4f5a', '#8a8f9a']);
  svgCache.set(key, svg);
  return svg;
}

export default function VectorIcon({ set, id, size, colors, label }: { set: IconSet; id: string; size: number; colors?: readonly [string, string]; label?: string }) {
  const svg = iconSvg(set, id, colors);
  return (
    <span
      className="inline-block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
