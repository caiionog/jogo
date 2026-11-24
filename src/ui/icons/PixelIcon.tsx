/** Ícone em pixel art (grades de dados). Chunk à parte, carregado só no visual 'pixel'. */
import { CRIME_ICONS, UNIFORM_ICONS, factionIcon } from '../../content/sprites/crimeIcons';
import { ICON_FOR, MARKET_ICONS } from '../../content/sprites/market';
import PixelCanvas from '../avatar/pixel/PixelCanvas';
import { renderIcon } from '../avatar/pixel/icon';
import type { IconSet } from './GameIcon';

function pixelSprite(set: IconSet, id: string, colors?: readonly [string, string]) {
  if (set === 'market') return MARKET_ICONS[ICON_FOR[id] ?? id] ?? MARKET_ICONS[id] ?? MARKET_ICONS.loja;
  if (set === 'crime') return CRIME_ICONS[id];
  if (set === 'uniform') return UNIFORM_ICONS[id];
  return factionIcon(id, colors ?? ['#4a4f5a', '#8a8f9a']);
}

export default function PixelIcon({ set, id, size, colors, label }: { set: IconSet; id: string; size: number; colors?: readonly [string, string]; label?: string }) {
  const sprite = pixelSprite(set, id, colors);
  if (!sprite) return null;
  return <PixelCanvas img={renderIcon(sprite)} scale={Math.max(1, Math.round(size / 16))} label={label ?? ''} className="shrink-0" />;
}
