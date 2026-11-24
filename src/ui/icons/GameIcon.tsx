/**
 * Ícone do jogo no visual ativo: cartoon (SVG vetorial em `ui/icons/vector`) ou pixel art (grades de dados).
 * `size` é a largura em px; no modo pixel, é arredondada para escala inteira sobre as grades 16×16.
 */
import { CRIME_ICONS, UNIFORM_ICONS, factionIcon } from '../../content/sprites/crimeIcons';
import { ICON_FOR, MARKET_ICONS } from '../../content/sprites/market';
import { useAvatarStyle } from '../avatar/style';
import PixelCanvas from '../avatar/pixel/PixelCanvas';
import { renderIcon } from '../avatar/pixel/icon';
import { crimeIconSvg, factionIconSvg, marketIconSvg, uniformIconSvg } from './vector';

export type IconSet = 'market' | 'crime' | 'uniform' | 'faction';

const svgCache = new Map<string, string>();

export function iconSvg(set: IconSet, id: string, colors?: readonly [string, string]): string {
  const key = `${set}:${id}:${colors?.join(',') ?? ''}`;
  const hit = svgCache.get(key);
  if (hit) return hit;
  const svg = set === 'market' ? marketIconSvg(id) : set === 'crime' ? crimeIconSvg(id) : set === 'uniform' ? uniformIconSvg(id) : factionIconSvg(id, colors ?? ['#4a4f5a', '#8a8f9a']);
  svgCache.set(key, svg);
  return svg;
}

function pixelSprite(set: IconSet, id: string, colors?: readonly [string, string]) {
  if (set === 'market') return MARKET_ICONS[ICON_FOR[id] ?? id] ?? MARKET_ICONS[id] ?? MARKET_ICONS.loja;
  if (set === 'crime') return CRIME_ICONS[id];
  if (set === 'uniform') return UNIFORM_ICONS[id];
  return factionIcon(id, colors ?? ['#4a4f5a', '#8a8f9a']);
}

export function GameIcon({ set, id, size = 32, colors, label }: { set: IconSet; id: string; size?: number; colors?: readonly [string, string]; label?: string }) {
  const style = useAvatarStyle();
  if (style === 'pixel') {
    const sprite = pixelSprite(set, id, colors);
    if (!sprite) return null;
    return <PixelCanvas img={renderIcon(sprite)} scale={Math.max(1, Math.round(size / 16))} label={label ?? ''} className="shrink-0" />;
  }
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

export default GameIcon;
