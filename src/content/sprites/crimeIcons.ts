/**
 * Ícones 16×16 de delitos, fardas e facções (release 0.0.2), na direção de arte do Mercado: a mesma BASE (medalhão
 * com contorno escuro colorido e anel na cor da categoria) e um GLIFO 8×8 próprio no centro. Símbolos de facção são
 * inventados (serpente no cadeado, corvo, sol partido, onda) — nada de marcas reais.
 */
import type { IconSprite } from './market';

const OUT = '#2a2238';

/** Glifo 8×8: `k` cor principal, `K` detalhe, `.` fundo. */
interface Glyph {
  rows: readonly [string, string, string, string, string, string, string, string];
  k: string;
  K: string;
}

const RING = { leve: '#e0b030', medio: '#d0742a', grave: '#b8322e', farda: '#2f5fb3', faccao: '#4a4f5a' } as const;
type Kind = keyof typeof RING;

function badge(g: Glyph, kind: Kind, bg = '#f6efdc', ring: string = RING[kind]): IconSprite {
  const base = [
    '.....oooooo.....',
    '...oorrrrrroo...',
    '..orrrrrrrrrro..',
    '.orrbbbbbbbbrro.',
    '.orbbbbbbbbbbro.',
    'orrbbbbbbbbbbrro',
    'orbbbbbbbbbbbbro',
    'orbbbbbbbbbbbbro',
    'orbbbbbbbbbbbbro',
    'orbbbbbbbbbbbbro',
    'orrbbbbbbbbbbrro',
    '.orbbbbbbbbbbro.',
    '.orrbbbbbbbbrro.',
    '..orrrrrrrrrro..',
    '...oorrrrrroo...',
    '.....oooooo.....',
  ];
  const grid = base.map((row, y) => {
    if (y < 4 || y > 11) return row;
    const gr = g.rows[y - 4]!;
    return row.slice(0, 4) + [...gr].map((ch, i) => (ch === '.' ? row[4 + i] : ch)).join('') + row.slice(12);
  });
  return { grid, palette: { o: OUT, r: ring, b: bg, k: g.k, K: g.K } };
}

export const CRIME_GLYPHS: Readonly<Record<string, { kind: Kind; g: Glyph }>> = {
  pichacao: { kind: 'leve', g: { k: '#3a6fb4', K: '#c23a3a', rows: ['......kk', '.....kk.', '....kk..', '...KK...', '..KK....', '.KK.....', 'KK......', '........'] } },
  furto_loja: { kind: 'leve', g: { k: '#d05a8a', K: '#6b4a34', rows: ['..KKKK..', '.K....K.', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', '.kkkkkk.', '........'] } },
  briga_rua: { kind: 'leve', g: { k: '#e0a070', K: '#8a5a3a', rows: ['.kkkk...', 'kkkkkk..', 'kKkKkk..', 'kkkkkkk.', '.kkkkkk.', '..kkkk..', '..KKK...', '........'] } },
  dano_patrimonio: { kind: 'leve', g: { k: '#8a8f9a', K: '#4a4f5a', rows: ['........', '..kkk...', '.kkkkk..', 'kkKkkkk.', 'kkkkKkk.', '.kkkkkk.', '..kkkk..', '........'] } },
  furto_carro: { kind: 'medio', g: { k: '#c23a3a', K: '#2a2f3a', rows: ['........', '..kkkk..', '.kKKKKk.', 'kkkkkkkk', 'kkkkkkkk', '.KK..KK.', '........', '........'] } },
  receptacao: { kind: 'medio', g: { k: '#b0742c', K: '#5c3a1e', rows: ['........', 'kkkkkkkk', 'kKkkkkKk', 'kkkKKkkk', 'kkkkkkkk', 'kKkkkkKk', 'kkkkkkkk', '........'] } },
  estelionato: { kind: 'medio', g: { k: '#f3eee4', K: '#3a3f4a', rows: ['kkkkkk..', 'kKKKKk..', 'kkkkkkk.', 'kKKKkkk.', 'kkkkkkk.', 'kKKkKkk.', 'kkkkkKK.', '.....KK.'] } },
  agressao: { kind: 'medio', g: { k: '#c23a3a', K: '#f3eee4', rows: ['.kkkkkk.', 'kkkkkkkk', 'kKkKkKkk', 'kkkkkkkk', 'kkkkkkkk', '.kkkkkk.', '..kkkk..', '..kkkk..'] } },
  assalto_pedestre: { kind: 'grave', g: { k: '#2a2f3a', K: '#8fc3df', rows: ['..kkkk..', '..kKKk..', '..kKKk..', '..kKKk..', '..kKKk..', '..kkkk..', '...kk...', '........'] } },
  assalto_comercio: { kind: 'grave', g: { k: '#2f8a3f', K: '#f3eee4', rows: ['kkkkkkkk', 'kKkKkKkK', 'kkkkkkkk', '.KKKKKK.', '.KkkKKK.', '.KkkKKK.', '.KkkKKK.', '........'] } },
  assalto_joalheria: { kind: 'grave', g: { k: '#4fb3d9', K: '#f3eee4', rows: ['.kkkkkk.', 'kKkkkkKk', 'kkkkkkkk', '.kkkkkk.', '..kkkk..', '...kk...', '........', '........'] } },
  assalto_banco: { kind: 'grave', g: { k: '#8a8f9a', K: '#e8b64a', rows: ['...kk...', '..kkkk..', '.kkkkkk.', 'kkkkkkkk', '.k.kk.k.', '.k.kk.k.', 'kkkkkkkk', 'KKKKKKKK'] } },
  sequestro: { kind: 'grave', g: { k: '#4a4f5a', K: '#e8b64a', rows: ['........', 'kkkkkkk.', 'kKKkkkkk', 'kKKkkkkk', 'kkkkkkkk', '.KK...KK', '........', '........'] } },
  trafico: { kind: 'grave', g: { k: '#f3eee4', K: '#c23a3a', rows: ['........', '..KKKk..', '.KKKKkk.', '.KKKKkk.', '.KKKKkk.', '..KKKk..', '........', '........'] } },
};

export const UNIFORM_GLYPHS: Readonly<Record<string, Glyph>> = {
  pm: { k: '#5b6b4e', K: '#e8b64a', rows: ['..kkkk..', '.kkkkkk.', 'KKKKKKKK', '........', '..kKKk..', '.kkKKkk.', '.kkkkkk.', '.kkkkkk.'] },
  civil: { k: '#14161f', K: '#e8b64a', rows: ['...KK...', '..KKKK..', '.KKkkKK.', '.KkKKkK.', '.KKkkKK.', '..KKKK..', '...KK...', '........'] },
  especial: { k: '#1f2328', K: '#8a8f9a', rows: ['..kkkk..', '.kkkkkk.', 'kkkkkkkk', 'kKKKKKKk', 'kk....kk', '........', '..kkkk..', '.kkkkkk.'] },
};

export const FACTION_GLYPHS: Readonly<Record<string, Omit<Glyph, 'k' | 'K'> & { k?: string; K?: string }>> = {
  liga: { rows: ['..kkkk..', '.k....k.', '.k....k.', 'KKKKKKKK', 'KKkkkkKK', 'KKkKKkKK', 'KKkkkkKK', 'KKKKKKKK'] }, // serpente no cadeado
  cla: { rows: ['K......K', 'KK....KK', 'KKK..KKK', '.KKkkKK.', '..kkkk..', '...kk...', '..k..k..', '........'] }, // corvo de asas abertas
  ordem: { rows: ['k..k....', '.kk.....', 'kkkk.KKK', 'kkkk.KKK', 'kkkk.KKK', '.kk.....', 'k..k....', '........'] }, // sol cortado ao meio
  mare: { rows: ['........', '....kkk.', '...k...k', '..k.....', '.k..KK..', 'k..KKKK.', 'KKKKKKKK', 'KKKKKKKK'] }, // onda quebrando
};

export const CRIME_ICONS: Readonly<Record<string, IconSprite>> = Object.fromEntries(Object.entries(CRIME_GLYPHS).map(([id, { kind, g }]) => [id, badge(g, kind)]));
export const UNIFORM_ICONS: Readonly<Record<string, IconSprite>> = Object.fromEntries(Object.entries(UNIFORM_GLYPHS).map(([id, g]) => [id, badge(g, 'farda')]));

/** Ícone da facção nas cores dela (anel na 2ª cor, glifo na 1ª). */
export function factionIcon(id: string, colors: readonly [string, string]): IconSprite | undefined {
  const g = FACTION_GLYPHS[id];
  if (!g) return undefined;
  return badge({ rows: g.rows, k: colors[0], K: colors[1] === '#111111' ? '#3a3f4a' : colors[1] }, 'faccao', '#efe9dc', colors[0]);
}
