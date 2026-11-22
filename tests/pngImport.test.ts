import { describe, expect, it } from 'vitest';
import { GENERATED_BODIES } from '../src/content/sprites/body/generated';
import { png } from '../scripts/pixel-preview';
import { KEY, decodePng, pngToShape } from '../scripts/sprites/png-to-grid';

describe('pipeline Aseprite: PNG com cores-chave → grade', () => {
  it('ida e volta: grade → PNG → grade é idêntica', () => {
    const body = GENERATED_BODIES['adulto_F_atletico']!;
    const color = Object.fromEntries(Object.entries(KEY).map(([hex, r]) => [r, hex]));
    const rgba = new Uint8ClampedArray(32 * 63 * 4);
    body.shape.slice(0, 63).forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const hex = color[ch];
        if (!hex) return;
        const o = (y * 32 + x) * 4;
        rgba.set([parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4), 16), 255], o);
      }),
    );
    expect(pngToShape(decodePng(png(32, 63, rgba)))).toEqual([...body.shape]);
  });
});
