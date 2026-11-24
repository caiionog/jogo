import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import type { AvatarDescriptor, Worn } from '../src/engine';
import { HAIR_STYLES, RACES, createRng, genesForRace, previewAvatar } from '../src/engine';
import { VectorAvatarRenderer, renderVectorSvg } from '../src/ui/avatar/vector';
import { abAdults } from '../src/ui/dev/samples';

const WORNS: Worn[] = [
  { cima: { id: 'camiseta', color: 1 }, baixo: { id: 'calca_jeans', color: 0 }, calcado: { id: 'tenis', color: 0 } },
  { cima: { id: 'social', color: 0 }, baixo: { id: 'calca_social', color: 0 }, calcado: { id: 'sapato', color: 0 }, agasalho: { id: 'terno', color: 0 } },
  { cima: { id: 'regata', color: 2 }, baixo: { id: 'shorts', color: 1 }, calcado: { id: 'chinelo', color: 0 } },
  { cima: { id: 'blusa', color: 0 }, baixo: { id: 'saia', color: 1 }, calcado: { id: 'bota', color: 0 } },
  { cima: { id: 'moletom', color: 1 }, baixo: { id: 'bermuda', color: 0 }, calcado: { id: 'tenis', color: 2 }, acessorio: { id: 'bone', color: 0 } },
];

function adults(): AvatarDescriptor[] {
  const out: AvatarDescriptor[] = [];
  for (let i = 0; i < 40; i++) {
    const race = RACES[i % RACES.length]!;
    const genes = genesForRace(createRng(900 + i), race);
    const sex = i % 2 ? 'F' : 'M';
    const a = { genes, race, facialHair: (['nenhuma', 'barba', 'bigode', 'cavanhaque', 'por_fazer', 'rala'] as const)[i % 6]!, hairStyle: HAIR_STYLES[i % HAIR_STYLES.length]! };
    out.push(previewAvatar(a, sex, 18 + (i * 7) % 42, C, { worn: WORNS[i % WORNS.length]!, fat: (i * 0.13) % 1, muscle: (i * 0.29) % 1 }));
  }
  return out;
}

const hasLayer = (svg: string, l: string) => svg.includes(`data-layer="${l}"`);

describe('avatar cartoon vetorial', () => {
  it('é determinístico (mesmo descriptor → mesmo SVG)', () => {
    for (const d of adults().slice(0, 10)) {
      expect(renderVectorSvg(d)).toBe(renderVectorSvg(structuredClone(d)));
      expect(VectorAvatarRenderer.snapshot(d)).toBe(VectorAvatarRenderer.snapshot(d));
    }
  });

  it('gera SVG válido com viewBox, sem NaN e sem imagens externas', () => {
    for (const d of adults()) {
      const img = VectorAvatarRenderer.render(d);
      expect(img.kind).toBe('svg');
      if (img.kind !== 'svg') continue;
      expect(img.svg.startsWith('<svg')).toBe(true);
      expect(img.svg).toMatch(/viewBox="0 0 200 420"/);
      expect(img.svg.endsWith('</svg>')).toBe(true);
      expect(img.svg).not.toMatch(/NaN|undefined|Infinity|<image|href="http/);
    }
  });

  it('sempre veste o avatar: parte de cima e de baixo (ou inteira)', () => {
    const list = [...adults(), ...abAdults().map((s) => s.d)];
    const naked = { ...list[0]!, outfit: {} };
    const onlyShoes = { ...list[1]!, outfit: { calcado: list[1]!.outfit.calcado! } };
    for (const d of [...list, naked, onlyShoes]) {
      const svg = renderVectorSvg(d);
      expect(hasLayer(svg, 'roupa-cima') || hasLayer(svg, 'roupa-inteira')).toBe(true);
      expect(hasLayer(svg, 'roupa-baixo') || hasLayer(svg, 'roupa-inteira')).toBe(true);
    }
    expect(hasLayer(renderVectorSvg(naked), 'roupa-cima')).toBe(true);
    expect(hasLayer(renderVectorSvg(naked), 'roupa-baixo')).toBe(true);
  });

  it('busto dentro da moldura e snapshot em data URL SVG', () => {
    for (const d of adults()) {
      const b = VectorAvatarRenderer.bust(d);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(200);
      expect(b.y + b.h).toBeLessThanOrEqual(420);
    }
    expect(VectorAvatarRenderer.snapshot(adults()[0]!)).toMatch(/^data:image\/svg\+xml/);
  });

  it('compõe um avatar em menos de 5 ms (média de 200)', () => {
    const list = adults();
    for (const d of list) renderVectorSvg(d); // aquecimento
    const t0 = performance.now();
    for (let i = 0; i < 200; i++) renderVectorSvg({ ...list[i % list.length]!, age: 18 + (i % 40) });
    const avg = (performance.now() - t0) / 200;
    console.log(`cartoon: ${avg.toFixed(2)} ms/avatar`);
    expect(avg).toBeLessThan(5);
  });
});
