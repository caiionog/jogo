import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { bodySprite } from '../src/content/sprites/body';
import { CLOTHING_RULES } from '../src/content/sprites/clothes';
import type { AvatarDescriptor, Worn } from '../src/engine';
import { BUILDS, HAIR_STYLES, createRng, genesForRace, previewAvatar, RACES } from '../src/engine';
import { pixelHash, renderAvatar } from '../src/ui/avatar/pixel/render';
import { hexToRgb } from '../src/ui/avatar/pixel/color';
import { MARKET_ICONS } from '../src/content/sprites/market';
import { generateBody } from '../src/ui/avatar/pixel/bodygen';

const STAGES = [[1, 'bebe'], [8, 'crianca'], [15, 'adolescente'], [30, 'adulto'], [72, 'idoso']] as const;
const FB = { magro: [0.12, 0.15], medio: [0.35, 0.3], atletico: [0.3, 0.5], musculoso: [0.2, 0.8], acima: [0.8, 0.3] } as const;
const look = (seed: number, race = RACES[seed % 5]!) => ({ genes: genesForRace(createRng(seed), race), race, facialHair: 'barba' as const });
const wornFor = (layerPiece: string): Worn => {
  const o = C.outfits.find((x) => x.id === layerPiece)!;
  const base: Worn = { cima: { id: 'camiseta', color: 1 }, baixo: { id: 'calca_jeans', color: 0 }, calcado: { id: 'tenis', color: 0 } };
  if (o.layer === 'inteira') return { inteira: { id: o.id, color: 0 }, calcado: { id: 'tenis', color: 0 } };
  return { ...base, [o.layer]: { id: o.id, color: 0 } };
};

/** Luminância relativa (WCAG). */
function lum([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

describe('avatar em pixel art', () => {
  it('determinismo: o mesmo descriptor gera exatamente os mesmos pixels', () => {
    const d = previewAvatar(look(3), 'M', 30, C);
    expect(pixelHash(renderAvatar(d))).toBe(pixelHash(renderAvatar(structuredClone(d))));
    expect(pixelHash(renderAvatar(d))).not.toBe(pixelHash(renderAvatar({ ...d, skin: '#5a3a28' })));
  });

  it('há grade para todas as fases × sexos × tipos físicos, com âncoras dentro da moldura', () => {
    for (const [, stage] of STAGES) for (const sex of ['M', 'F'] as const) for (const b of BUILDS) {
      const body = bodySprite(stage, sex, b);
      expect(body.shape).toHaveLength(64);
      for (const row of body.shape) expect(row).toHaveLength(32);
      for (const [x, y] of Object.values(body.anchors)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(64);
      }
    }
    // a grade gerada bate com o gerador (arquivo atualizado)
    expect(bodySprite('crianca', 'F', 'acima').shape).toEqual(generateBody('crianca', 'F', 'acima').shape);
  });

  it('cobertura: fase × sexo × tipo × cabelo × roupa renderiza sem erro e sem camada faltando', () => {
    const pieces = C.outfits.filter((o) => o.layer !== 'acessorio' && o.id !== 'descalco').map((o) => o.id);
    let n = 0;
    for (const [age] of STAGES) for (const sex of ['M', 'F'] as const) for (const b of BUILDS) for (let h = 0; h < HAIR_STYLES.length; h += 3) {
      const piece = pieces[(n * 7) % pieces.length]!;
      const o = C.outfits.find((x) => x.id === piece)!;
      const d: AvatarDescriptor = { ...previewAvatar({ ...look(n), hairStyle: HAIR_STYLES[(h + n) % HAIR_STYLES.length] }, sex, age, C, { fat: FB[b][0], muscle: FB[b][1], worn: wornFor(piece) }) };
      n++;
      const mats = new Map<string, number>();
      const img = renderAvatar(d, { inspect: (m) => mats.set(m, (mats.get(m) ?? 0) + 1) });
      expect(img.data.length).toBe(32 * 64 * 4);
      expect(mats.get('pele') ?? 0).toBeGreaterThan(10);
      // toda peça vestida (que a idade permite) com regra de cobertura aparece
      for (const [layer, p] of Object.entries(d.outfit)) {
        if (!p || !CLOTHING_RULES[p.id]?.cover.length) continue;
        expect(mats.get(`roupa_${layer}`) ?? 0, `${p.id} @${age}`).toBeGreaterThan(0);
      }
      void o;
    }
    expect(n).toBeGreaterThan(150);
  });

  it('encaixe: os pixels de roupa ficam dentro da silhueta do corpo (margem de 2 px)', () => {
    for (const [age, stage] of STAGES) for (const b of BUILDS) for (const piece of C.outfits.filter((o) => o.layer !== 'acessorio' && o.minAge <= age && o.maxAge >= age).map((o) => o.id)) {
      const d = previewAvatar(look(7), 'F', age, C, { fat: FB[b][0], muscle: FB[b][1], worn: wornFor(piece) });
      const body = bodySprite(stage, d.sex, d.build);
      const inBody = (x: number, y: number) => {
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = body.shape[y + dy]?.[x + dx]; if (c && c !== '.') return true; }
        return false;
      };
      renderAvatar(d, { inspect: (m, x, y) => { if (m.startsWith('roupa_')) expect(inBody(x, y), `${piece} ${stage} ${b} (${x},${y})`).toBe(true); } });
    }
  });

  it('paleta: no máximo 48 cores distintas por avatar', () => {
    let max = 0;
    for (let i = 0; i < 60; i++) {
      const d = previewAvatar({ ...look(i), hairStyle: HAIR_STYLES[i % HAIR_STYLES.length] }, i % 2 ? 'F' : 'M', [8, 30, 70][i % 3]!, C, { worn: wornFor(['camiseta_listrada', 'xadrez', 'vestido', 'moletom', 'kimono'][i % 5]!) });
      const img = renderAvatar({ ...d, marks: { scar: true, brokenNose: true, cauliflowerEar: true, blackEye: true }, freckles: 0.8, moles: 0.7 });
      const set = new Set<number>();
      for (let k = 0; k < img.data.length; k += 4) if (img.data[k + 3]) set.add((img.data[k]! << 16) | (img.data[k + 1]! << 8) | img.data[k + 2]!);
      max = Math.max(max, set.size);
    }
    expect(max).toBeLessThanOrEqual(48);
  });

  it('contorno legível sobre o fundo do avatar nos tons de pele extremos', () => {
    const bg = lum(hexToRgb('#cfc8ba'));
    for (const tone of [0, 1]) {
      const a = look(1);
      const d = previewAvatar({ ...a, genes: { ...a.genes, skinTone: tone } }, 'M', 30, C, { worn: { cima: { id: 'regata', color: 0 }, baixo: { id: 'shorts', color: 0 }, calcado: { id: 'chinelo', color: 0 } } });
      const img = renderAvatar(d);
      const alpha = (x: number, y: number) => (x < 0 || y < 0 || x >= 32 || y >= 64 ? 0 : img.data[(y * 32 + x) * 4 + 3]!);
      const ratios: number[] = [];
      for (let y = 0; y < 63; y++) for (let x = 0; x < 32; x++) {
        const i = (y * 32 + x) * 4;
        if (img.data[i + 3] !== 255) continue;
        if (alpha(x - 1, y) && alpha(x + 1, y) && alpha(x, y - 1) && alpha(x, y + 1)) continue;
        ratios.push(contrast(lum([img.data[i]!, img.data[i + 1]!, img.data[i + 2]!]), bg));
      }
      const avg = ratios.reduce((t, r) => t + r, 0) / ratios.length;
      expect(avg, `tom ${tone}`).toBeGreaterThan(2.2);
    }
  });

  it('desempenho: compor um avatar leva menos de 5 ms', () => {
    const ds = Array.from({ length: 40 }, (_, i) => previewAvatar({ ...look(i), hairStyle: HAIR_STYLES[i % HAIR_STYLES.length] }, i % 2 ? 'F' : 'M', 30, C));
    for (const d of ds) renderAvatar(d); // aquecimento
    const t0 = performance.now();
    for (let k = 0; k < 5; k++) for (const d of ds) renderAvatar(d);
    const per = (performance.now() - t0) / (ds.length * 5);
    expect(per).toBeLessThan(5);
  });

  it('ícones do Mercado: 16×16 e cores definidas na paleta', () => {
    for (const [name, icon] of Object.entries(MARKET_ICONS)) {
      expect(icon.grid, name).toHaveLength(16);
      for (const row of icon.grid) {
        expect(row).toHaveLength(16);
        for (const ch of row) if (ch !== '.') expect(icon.palette[ch], `${name}:${ch}`).toBeDefined();
      }
    }
  });

  it('toda roupa do catálogo tem regra de pixel art', () => {
    for (const o of C.outfits) expect(CLOTHING_RULES[o.id], o.id).toBeDefined();
  });
});
