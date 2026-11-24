/** Ícones cartoon vetoriais (release 0.0.3): SVG válido, determinístico, único por grupo e sem contorno preto puro. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { CRIME_ICONS, UNIFORM_ICONS } from '../src/content/sprites/crimeIcons';
import { ICON_FOR, MARKET_ICONS } from '../src/content/sprites/market';
import { BUSINESS_GLYPHS } from '../src/content/sprites/market/business';
import { crimeIconSvg, factionIconSvg, marketIconSvg, uniformIconSvg } from '../src/ui/icons/vector';

function valid(id: string, svg: string): void {
  expect(svg.startsWith('<svg'), id).toBe(true);
  expect(svg, id).toContain('viewBox=');
  expect(svg, id).not.toMatch(/NaN|undefined|Infinity/);
  expect(svg, id).not.toMatch(/<image|href=|xlink|<script/i);
  expect(svg.toLowerCase(), id).not.toMatch(/#000(000)?(?![0-9a-f])/);
  expect(svg, id).not.toMatch(/(?:stroke|fill)="(?:black|rgb\(0, ?0, ?0\))"/);
}

function group(name: string, items: [string, () => string][]): void {
  it(`${name}: válido, determinístico e todos diferentes`, () => {
    const seen = new Map<string, string>();
    for (const [id, make] of items) {
      const svg = make();
      valid(`${name}:${id}`, svg);
      expect(make(), id).toBe(svg);
      expect(seen.get(svg), `${id} repete ${seen.get(svg)}`).toBeUndefined();
      seen.set(svg, id);
    }
    expect(seen.size).toBe(items.length);
  });
}

describe('ícones cartoon', () => {
  group('mercado', Object.keys(MARKET_ICONS).map((k) => [k, () => marketIconSvg(k)]));
  it('todo id de ICON_FOR e de negócio resolve', () => {
    for (const [id, key] of Object.entries(ICON_FOR)) expect(marketIconSvg(id), id).toBe(marketIconSvg(key));
    for (const id of Object.keys(BUSINESS_GLYPHS)) expect(MARKET_ICONS[id], id).toBeDefined();
  });
  group('crime', Object.keys(CRIME_ICONS).map((k) => [k, () => crimeIconSvg(k)]));
  it('crime cobre todos os delitos e o tráfico', () => {
    for (const c of C.crime.crimes) expect(CRIME_ICONS[c.id], c.id).toBeDefined();
    expect(CRIME_ICONS.trafico).toBeDefined();
  });
  group('fardas', Object.keys(UNIFORM_ICONS).map((k) => [k, () => uniformIconSvg(k)]));
  group('facções', C.crime.factions.map((f) => [f.id, () => factionIconSvg(f.id, f.colors)]));
  it('facções mudam com as cores', () => {
    expect(factionIconSvg('liga', ['#1f7a3a', '#111111'])).not.toBe(factionIconSvg('liga', ['#e07b1a', '#4a2a0a']));
  });
});
