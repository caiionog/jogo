/** Rasteriza um ícone de grade + paleta num PixelImage (mesmo motor de exibição do avatar). */
import type { IconSprite } from '../../../content/sprites/market';
import { hexToRgb } from './color';
import type { PixelImage } from './compose';

const cache = new Map<IconSprite, PixelImage>();

export function renderIcon(icon: IconSprite): PixelImage {
  const hit = cache.get(icon);
  if (hit) return hit;
  const h = icon.grid.length;
  const w = icon.grid[0]?.length ?? 0;
  const data = new Uint8ClampedArray(w * h * 4);
  icon.grid.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const hex = icon.palette[row[x] ?? '.'];
      if (!hex) continue;
      const [r, g, b] = hexToRgb(hex);
      data.set([r, g, b, 255], (y * w + x) * 4);
    }
  });
  const img = { w, h, data };
  cache.set(icon, img);
  return img;
}
