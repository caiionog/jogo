/** Ícones de delitos, fardas e facções (release 0.0.2): 16×16, paleta completa e todos diferentes. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { CRIME_ICONS, UNIFORM_ICONS, factionIcon } from '../src/content/sprites/crimeIcons';
import type { IconSprite } from '../src/content/sprites/market';

const check = (id: string, icon: IconSprite) => {
  expect(icon.grid, id).toHaveLength(16);
  for (const row of icon.grid) {
    expect(row, id).toHaveLength(16);
    for (const ch of row) if (ch !== '.') expect(icon.palette[ch], `${id}:${ch}`).toBeDefined();
  }
};

describe('ícones do crime e da polícia', () => {
  it('cada delito, farda e facção tem ícone próprio e único', () => {
    const all: [string, IconSprite][] = [
      ...C.crime.crimes.map((c) => [c.id, CRIME_ICONS[c.id]!] as [string, IconSprite]),
      ['trafico', CRIME_ICONS.trafico!],
      ...Object.entries(UNIFORM_ICONS),
      ...C.crime.factions.map((f) => [f.id, factionIcon(f.id, f.colors)!] as [string, IconSprite]),
    ];
    expect(all).toHaveLength(C.crime.crimes.length + 1 + 3 + C.crime.factions.length);
    const seen = new Set<string>();
    for (const [id, icon] of all) {
      expect(icon, id).toBeDefined();
      check(id, icon);
      const sig = icon.grid.join('') + JSON.stringify(icon.palette);
      expect(seen.has(sig), `${id} repete outro ícone`).toBe(false);
      seen.add(sig);
    }
  });
});
