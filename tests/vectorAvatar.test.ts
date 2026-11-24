import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import type { AvatarDescriptor, AvatarOutfit, OutfitPiece, Worn } from '../src/engine';
import { BUILDS, HAIR_STYLES, RACES, createRng, deriveAvatar, genesForRace, outfitFitsAge, previewAvatar } from '../src/engine';
import { VectorAvatarRenderer, renderVectorSvg, vectorBust, wornLayers } from '../src/ui/avatar/vector';
import { contrastRatio, luminance, ramp } from '../src/ui/avatar/vector/palette';
import { skinRgb, rgbHex } from '../src/engine/character/appearance/genes';
import { abAdults, npcs, outfitGallery, phases, physiques, uniformsBeach } from '../src/ui/dev/samples';
import { makeGame, withAge } from './helpers';

const WORNS: Worn[] = [
  { cima: { id: 'camiseta', color: 1 }, baixo: { id: 'calca_jeans', color: 0 }, calcado: { id: 'tenis', color: 0 } },
  { cima: { id: 'social', color: 0 }, baixo: { id: 'calca_social', color: 0 }, calcado: { id: 'sapato', color: 0 }, agasalho: { id: 'terno', color: 0 } },
  { cima: { id: 'regata', color: 2 }, baixo: { id: 'shorts', color: 1 }, calcado: { id: 'chinelo', color: 0 } },
  { cima: { id: 'blusa', color: 0 }, baixo: { id: 'saia', color: 1 }, calcado: { id: 'bota', color: 0 } },
  { cima: { id: 'moletom', color: 1 }, baixo: { id: 'bermuda', color: 0 }, calcado: { id: 'tenis', color: 2 }, acessorio: { id: 'bone', color: 0 } },
];
const HAIR_TYPES = ['liso', 'ondulado', 'cacheado', 'crespo'] as const;
const STAGE_AGES = [0, 1, 2, 5, 8, 11, 13, 15, 17, 18, 25, 35, 50, 59, 62, 72, 85, 95];
const ADULT_SWIM = new Set(C.outfits.filter((o) => o.context === 'praia' && o.minAge >= 18).map((o) => o.id));

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

/** SVG bem formado: tags equilibradas, sem NaN, sem referência externa, ids de recorte definidos. */
function expectValidSvg(svg: string, label = ''): void {
  expect(svg.startsWith('<svg'), label).toBe(true);
  expect(svg.endsWith('</svg>'), label).toBe(true);
  expect(svg, label).not.toMatch(/NaN|undefined|Infinity|null|<image|href="http/);
  const stack: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
    const [, close, tag, self] = m;
    if (self) continue;
    if (close) expect(stack.pop(), `${label} </${tag}>`).toBe(tag);
    else stack.push(tag!);
  }
  expect(stack, label).toEqual([]);
  const defined = new Set([...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) expect(defined.has(m[1]), `${label} #${m[1]}`).toBe(true);
}

function base(sex: 'M' | 'F', age: number, seed = 1): AvatarDescriptor {
  const race = RACES[seed % RACES.length]!;
  return previewAvatar({ genes: genesForRace(createRng(seed), race), race, facialHair: 'nenhuma' }, sex, age, C, { expression: 'neutro' });
}
const piece = (id: string, color = 0): OutfitPiece => {
  const o = C.outfits.find((x) => x.id === id)!;
  return { id, color: o.colors[Math.min(color, o.colors.length - 1)]!, pattern: o.pattern ?? 'liso' };
};

describe('avatar cartoon vetorial', () => {
  it('é determinístico (mesmo descriptor → mesmo SVG, busto e snapshot)', () => {
    for (const d of [...adults().slice(0, 10), ...phases('M').map((p) => p.d), ...uniformsBeach().map((s) => s.d)]) {
      expect(renderVectorSvg(d)).toBe(renderVectorSvg(structuredClone(d)));
      expect(renderVectorSvg(d, { frame: 1, blink: true })).toBe(renderVectorSvg(structuredClone(d), { frame: 1, blink: true }));
      expect(VectorAvatarRenderer.snapshot(d)).toBe(VectorAvatarRenderer.snapshot(structuredClone(d)));
      expect(vectorBust(d)).toEqual(vectorBust(structuredClone(d)));
    }
  });

  it('gera SVG válido (viewBox, tags equilibradas, recortes definidos, sem NaN nem imagens externas)', () => {
    for (const d of [...adults(), ...npcs(), ...abAdults().map((s) => s.d)]) {
      const img = VectorAvatarRenderer.render(d);
      expect(img.kind).toBe('svg');
      if (img.kind !== 'svg') continue;
      expect(img.svg).toMatch(/viewBox="0 0 200 420"/);
      expectValidSvg(img.svg);
    }
  });

  it('cobre fases × sexos × tipos físicos × estilos e tipos de cabelo sem erro', () => {
    let n = 0;
    for (const age of STAGE_AGES)
      for (const sex of ['M', 'F'] as const)
        for (const [bi, build] of BUILDS.entries())
          for (const [hi, style] of HAIR_STYLES.entries()) {
            const type = HAIR_TYPES[(hi + bi) % HAIR_TYPES.length]!;
            const b = base(sex, age, hi + bi * 13 + age);
            const fm: Record<(typeof BUILDS)[number], [number, number]> = { magro: [0.1, 0.1], medio: [0.35, 0.3], atletico: [0.3, 0.55], musculoso: [0.2, 0.85], acima: [0.85, 0.3] };
            const [fat, muscle] = fm[build];
            const d: AvatarDescriptor = { ...b, fat, muscle, hair: { ...b.hair, style, type, baldness: age > 50 && hi % 3 === 0 ? 0.9 : b.hair.baldness }, facialHair: age >= 16 && sex === 'M' ? (['barba', 'bigode', 'cavanhaque', 'rala', 'por_fazer'] as const)[hi % 5]! : 'nenhuma', marks: { scar: hi % 2 === 0, brokenNose: hi % 3 === 0, cauliflowerEar: hi % 4 === 0, blackEye: hi % 5 === 0 } };
            const svg = renderVectorSvg(d);
            expectValidSvg(svg, `${age} ${sex} ${build} ${style} ${type}`);
            n++;
          }
    expect(n).toBe(STAGE_AGES.length * 2 * BUILDS.length * HAIR_STYLES.length);
  }, 30_000); // ~2.160 avatares: com a suíte inteira em paralelo passa de 5 s

  it('desenha TODAS as peças do catálogo em adultos e cada peça permitida em menores', () => {
    const minors = [1, 4, 8, 12, 15, 17];
    for (const o of C.outfits) {
      const p = piece(o.id);
      const withPiece = (d: AvatarDescriptor): AvatarDescriptor => ({ ...d, outfit: { ...d.outfit, [o.layer]: p, ...(o.layer === 'inteira' ? { cima: undefined, baixo: undefined } : {}) } as AvatarOutfit });
      const adultsList = [base('M', 30, 3), base('F', 30, 4), { ...base('M', 40, 5), fat: 0.9 }, { ...base('F', 26, 6), muscle: 0.9, fat: 0.15 }, base('M', 80, 7)];
      for (const d of adultsList) {
        const svg = renderVectorSvg(withPiece(d));
        expectValidSvg(svg, o.id);
        expect(svg.length).toBeGreaterThan(2000);
      }
      for (const age of minors) {
        if (!outfitFitsAge(o, age)) continue;
        for (const sex of ['M', 'F'] as const) expectValidSvg(renderVectorSvg(withPiece(base(sex, age, age))), `${o.id} ${age}`);
      }
    }
    // faixa com listra (infantil) e prajied com ponta, que não são peças do guarda-roupa
    const kid = base('M', 9, 2);
    expectValidSvg(renderVectorSvg({ ...kid, outfit: { inteira: piece('kimono'), acessorio: { id: 'faixa', color: '#8f949c', pattern: 'liso', accent: '#f1f1ee' } } }));
    expectValidSvg(renderVectorSvg({ ...base('M', 25), outfit: { cima: piece('regata_treino'), baixo: piece('shorts_luta'), acessorio: { id: 'prajied', color: '#2f5fb3', pattern: 'liso', accent: '#e3a72f' } } }));
    // a galeria da /dev/avatars cobre o catálogo inteiro
    expect(outfitGallery().length).toBeGreaterThanOrEqual(C.outfits.length);
  });

  it('nunca renderiza sem roupa: toda combinação tem parte de cima + de baixo, ou inteira', () => {
    const layers = ['cima', 'baixo', 'inteira', 'calcado', 'agasalho', 'acessorio'] as const;
    const pool: Record<(typeof layers)[number], string[]> = { cima: [], baixo: [], inteira: [], calcado: [], agasalho: [], acessorio: [] };
    for (const o of C.outfits) pool[o.layer].push(o.id);
    const list = [...adults(), ...abAdults().map((s) => s.d), ...npcs()];
    let k = 0;
    for (const d of list) {
      // todas as 64 combinações de camadas presentes/ausentes
      for (let mask = 0; mask < 64; mask += 1 + (k++ % 3)) {
        const outfit: AvatarOutfit = {};
        layers.forEach((l, i) => {
          if (mask & (1 << i)) outfit[l] = piece(pool[l][(k + i) % pool[l].length]!);
        });
        const dd = { ...d, outfit };
        const w = wornLayers(dd);
        expect(!!w.inteira || (!!w.cima && !!w.baixo)).toBe(true);
        const svg = renderVectorSvg(dd);
        expect(hasLayer(svg, 'corpo')).toBe(true);
        expect(hasLayer(svg, 'roupa-cima') || hasLayer(svg, 'roupa-inteira')).toBe(true);
        expect(hasLayer(svg, 'roupa-baixo') || hasLayer(svg, 'roupa-inteira')).toBe(true);
      }
    }
    const naked = { ...list[0]!, outfit: {} };
    expect(hasLayer(renderVectorSvg(naked), 'roupa-cima')).toBe(true);
    expect(hasLayer(renderVectorSvg(naked), 'roupa-baixo')).toBe(true);
    // a sunga sozinha ganha a camiseta de reserva por cima
    const sunga = renderVectorSvg({ ...list[0]!, outfit: { baixo: piece('sunga') } });
    expect(hasLayer(sunga, 'roupa-cima')).toBe(true);
  });

  it('roupa de banho adulta nunca aparece em menor de 18 derivado pela engine (praia aos 10, 15 e 25)', () => {
    for (const sex of ['M', 'F'] as const) {
      for (const age of [10, 15, 17, 18, 25]) {
        for (let seed = 0; seed < 6; seed++) {
          let g = withAge(makeGame(`praia-vetor-${sex}-${seed}`), age);
          g = { ...g, character: { ...g.character, sex }, scene: { kind: 'praia', year: g.year } };
          const d = deriveAvatar(g, C);
          const ids = Object.values(d.outfit).map((p) => p?.id).filter(Boolean) as string[];
          const svg = renderVectorSvg(d);
          expectValidSvg(svg);
          if (age < 18) for (const id of ids) expect(ADULT_SWIM.has(id), `${age} ${sex} ${id}`).toBe(false);
          if (age === 25) expect(ids.some((id) => ADULT_SWIM.has(id))).toBe(true);
          const w = wornLayers(d);
          expect(!!w.inteira || (!!w.cima && !!w.baixo)).toBe(true);
        }
      }
    }
  });

  it('contorno da pele legível nos tons extremos (razão de contraste pela palette)', () => {
    const tones = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75];
    for (const t of tones)
      for (const u of [-1, 0, 1]) {
        const skin = rgbHex(skinRgb(t, u));
        const r = ramp(skin, 'skin');
        expect(contrastRatio(r.line, skin), `${t} ${u}`).toBeGreaterThanOrEqual(3);
        expect(r.line).not.toBe('#000000');
      }
    // no tom mais escuro o contorno continua mais escuro que a pele (não existe 3:1 abaixo dela: o limite é o preto)
    // e separa o corpo do fundo claro do avatar com folga
    for (const u of [-1, 0, 1]) {
      const skin = rgbHex(skinRgb(1, u));
      const r = ramp(skin, 'skin');
      expect(luminance(r.line)).toBeLessThan(luminance(skin));
      expect(contrastRatio(r.line, skin)).toBeGreaterThanOrEqual(1.3);
      expect(contrastRatio(r.line, '#e8e2d6')).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(ramp(rgbHex(skinRgb(0, u)), 'skin').line, '#e8e2d6')).toBeGreaterThanOrEqual(3);
    }
  });

  it('busto dentro da moldura em todas as fases e snapshot em data URL SVG', () => {
    for (const d of [...adults(), ...phases('M').map((p) => p.d), ...phases('F').map((p) => p.d), ...physiques('M', 'treino').map((p) => p.d)]) {
      const b = VectorAvatarRenderer.bust(d);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(200);
      expect(b.y + b.h).toBeLessThanOrEqual(420);
      expect(b.w / b.h).toBeCloseTo(8 / 7, 1);
      const snap = VectorAvatarRenderer.snapshot(d);
      expect(snap).toMatch(/^data:image\/svg\+xml/);
      expect(decodeURIComponent(snap.split(',')[1]!)).toContain(`viewBox="${b.x} ${b.y} ${b.w} ${b.h}"`);
    }
  });

  it('compõe um avatar em menos de 5 ms (média de 300, fases e roupas variadas)', () => {
    const list = [...adults(), ...uniformsBeach().map((s) => s.d), ...phases('F').map((p) => p.d)];
    for (const d of list) renderVectorSvg(d); // aquecimento
    const t0 = performance.now();
    for (let i = 0; i < 300; i++) renderVectorSvg({ ...list[i % list.length]!, expression: i % 2 ? 'feliz' : 'neutro' });
    const avg = (performance.now() - t0) / 300;
    console.log(`cartoon: ${avg.toFixed(2)} ms/avatar`);
    expect(avg).toBeLessThan(5);
  });
});
