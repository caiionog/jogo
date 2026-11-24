/**
 * Ícones cartoon do crime, da polícia e das facções. Crime = medalhão com anel na cor da gravidade; farda = escudo;
 * facção = brasão redondo nas cores dela. Só símbolos neutros (nada de arma, método ou substância específica).
 */
import { CRIME_GLYPHS, FACTION_GLYPHS, UNIFORM_GLYPHS } from '../../../content/sprites/crimeIcons';
import { ramp } from '../../avatar/vector/palette';
import { Canvas, ell, poly, rr, star } from './kit';

type G = (c: Canvas) => void;

const RING = { leve: '#e8b932', medio: '#dc7c2c', grave: '#c23a34' } as const;
const PAPER = '#f8f1de';

function medallion(c: Canvas, ring: string, bg = PAPER): void {
  c.shape(ell(32, 32, 29), ring, { sh: 3.4 });
  c.shape(ell(32, 32, 21), bg, { sh: 2.4 });
}

const sym = (fn: G): G => (c) => {
  c.open('translate(32 32) scale(1.12)');
  fn(c);
  c.close();
};

const CRIME: Record<string, G> = {
  pichacao: sym((c) => {
    c.stroke('M-13 -2Q-9 -9 -5 -3T-6 6', '#3a8fe0', 2.6);
    c.dot(ell(-11, 7, 1.2, 1.2), '#3a8fe0');
    c.shape(rr(-2, -3, 11, 16, 3), '#d9dee8');
    c.shape(rr(-0.5, -4, 8, 6, 2), '#3a8fe0', { w: 1.8, shade: false });
    c.shape(rr(1, -9, 5, 6, 1.6), '#4d5361');
    c.dot(ell(-4, -6, 0.9, 0.9), '#3a8fe0');
    c.dot(ell(-7, -9, 0.9, 0.9), '#3a8fe0');
  }),
  furto_loja: sym((c) => {
    c.line('M-4 -3V-7Q0 -12 4 -7V-3', '#8a5a36', 1.8);
    c.shape('M-9 -3H9L11 11Q11 13 9 13H-9Q-11 13 -11 11Z', '#e0679a');
    c.shape(rr(-4, 2, 8, 4, 2), '#fbf6e6', { w: 1.6, shade: false });
  }),
  briga_rua: sym((c) => {
    c.shape(rr(-9, -5, 18, 16, 6), '#f0b88a');
    for (let i = 0; i < 4; i++) c.shape(ell(-6.2 + i * 4.1, -5, 2.4), '#f0b88a', { w: 1.8, shade: false });
    c.stroke('M-6 -1V3M-2 -1V3M2 -1V3', '#a8683e', 1.3);
    c.shape(ell(-8, 5, 3, 4), '#f0b88a', { w: 1.8, shade: false });
    c.stroke('M11 -9L14 -12M12 -3H15M11 3L14 6', '#d0443c', 1.6);
  }),
  dano_patrimonio: sym((c) => {
    c.shape(rr(-11, -11, 22, 22, 3), '#a9dcf2');
    c.stroke('M-1 -11L1 -3L-5 2L2 5L0 11', '#f8fdff', 1.8);
    c.stroke('M1 -3L8 -6M2 5L9 6', '#f8fdff', 1.5);
    c.dot(poly(-11, -11, -5, -11, -11, -5), '#e8f7fd');
  }),
  furto_carro: sym((c) => {
    c.shape(ell(-5, -4, 6.4), '#c8ced8');
    c.dot(ell(-5, -4, 2.4, 2.4), PAPER);
    c.line('M-1 0L10 11', '#c8ced8', 4);
    c.shape(poly(6, 7, 10, 3, 12, 5, 8, 9), '#c8ced8', { w: 1.8, shade: false });
    c.shape(poly(9, 10, 13, 6, 14, 8, 10, 12), '#c8ced8', { w: 1.8, shade: false });
  }),
  receptacao: sym((c) => {
    c.shape(rr(-11, -6, 22, 17, 2.5), '#d49a52');
    c.shape(poly(-11, -6, -8, -11, 8, -11, 11, -6), '#e6b872');
    c.shape(rr(-2.5, -11, 5, 22, 0), '#f0d9a2', { bare: true, shade: false });
    c.shape(rr(2, 3, 8, 6, 1.5), '#fbf6e6', { w: 1.6, shade: false });
  }),
  estelionato: sym((c) => {
    c.shape(rr(-10, -12, 18, 24, 2.5), '#fbf6e6');
    c.stroke('M-6 -7H4M-6 -3H4M-6 1H0', '#9aa3b2', 1.6);
    c.shape(ell(5, 7, 5), '#d0443c', { w: 1.8 });
    c.shape(star(5, 7, 3, 1.3, 5), '#fbe0dc', { w: 0, bare: true, shade: false });
  }),
  agressao: sym((c) => {
    c.shape(star(0, 0, 14, 7, 8), '#e8452e');
    c.shape(star(0, 0, 7.5, 3.8, 8), '#ffd24d', { w: 1.8, shade: false });
  }),
  assalto_pedestre: sym((c) => {
    c.shape(rr(-6.5, -12, 13, 24, 3.6), '#2f3340');
    c.shape(rr(-4.3, -8.6, 8.6, 14, 1.6), '#8fc3df', { w: 1.2, shade: false });
    c.dot(ell(0, 9, 1.2, 1.2), '#aab2c0');
    c.stroke('M10 -5Q13 0 10 5M13 -8Q18 0 13 8', '#d0443c', 1.8);
  }),
  assalto_comercio: sym((c) => {
    c.shape(rr(-11, -11, 22, 22, 3), '#bfe3f4');
    c.shape(rr(-11, 3, 22, 3, 0), '#9a6a3c', { shade: false });
    c.shape(rr(-7, -4, 7, 7, 1.8), '#e0679a', { w: 1.8, shade: false });
    c.shape(ell(5, -0.5, 3.4), '#f2c14e', { w: 1.8, shade: false });
    c.stroke('M-8 -9L-5 -6', '#ffffff', 1.5);
  }),
  assalto_joalheria: sym((c) => {
    c.shape(poly(-11, -4, -6, -10, 6, -10, 11, -4, 0, 11), '#58c8e6');
    c.stroke('M-11 -4H11M-6 -10L-3 -4L0 -10L3 -4L6 -10M-3 -4L0 11L3 -4', '#e8fbff', 1.5);
  }),
  assalto_banco: sym((c) => {
    c.shape(rr(-12, -11, 24, 22, 4), '#9aa3b2');
    c.shape(ell(0, 0, 7.5), '#c8ced8', { w: 1.8 });
    c.shape(ell(0, 0, 3), '#e8b64a', { w: 1.6, shade: false });
    c.stroke('M0 -6.5V-3M0 3V6.5M-6.5 0H-3M3 0H6.5', '#4d5361', 1.5);
    c.shape(rr(-14, 9, 5, 3, 1), '#5a606e', { w: 1.2, shade: false });
  }),
  sequestro: sym((c) => {
    c.shape('M-13 -7Q-13 -9 -11 -9H5Q8 -9 10 -5L13 0V8H-13Z', '#e9eaee');
    c.shape(rr(5, -6, 5, 6, 1.2), '#8fc3df', { w: 1.4, shade: false });
    c.shape(rr(-9, -6, 10, 5, 1.2), '#8fc3df', { w: 1.4, shade: false });
    c.shape(ell(-7, 8, 3.2), '#3d3a4a', { w: 1.8, shade: false });
    c.shape(ell(7, 8, 3.2), '#3d3a4a', { w: 1.8, shade: false });
  }),
  trafico: sym((c) => {
    c.open('translate(0 -2) rotate(-35)');
    c.shape('M-10 0V-4Q-10 -8 -6 -8H0V8H-6Q-10 8 -10 4Z', '#f8f1de');
    c.shape('M0 -8H6Q10 -8 10 -4V4Q10 8 6 8H0Z', '#d0443c');
    c.close();
    c.shape(rr(-11, 5, 11, 7, 1.8), '#e6b872', { w: 1.8, shade: false });
    c.stroke('M-5.5 5V12', '#a8742e', 1.2);
  }),
};

function crimeCanvas(id: string): Canvas {
  const kind = CRIME_GLYPHS[id]?.kind ?? 'leve';
  const c = new Canvas(`c_${id}`);
  medallion(c, kind === 'leve' || kind === 'medio' || kind === 'grave' ? RING[kind] : RING.leve);
  (CRIME[id] ?? CRIME.pichacao!)(c);
  return c;
}

export const CRIME_KEYS: readonly string[] = Object.keys(CRIME_GLYPHS);
export const UNIFORM_KEYS: readonly string[] = Object.keys(UNIFORM_GLYPHS);
export const FACTION_KEYS: readonly string[] = Object.keys(FACTION_GLYPHS);

const cache = new Map<string, string>();
const memo = (key: string, make: () => string): string => {
  const hit = cache.get(key);
  if (hit) return hit;
  const v = make();
  cache.set(key, v);
  return v;
};

export const crimeIconSvg = (id: string): string => memo(`c:${id}`, () => crimeCanvas(id).svg());

const SHIELD = 'M32 5L54 12V31Q54 49 32 59Q10 49 10 31V12Z';
const SHIELD_IN = 'M32 11L48 16V31Q48 44 32 52Q16 44 16 31V16Z';
const GOLD = '#f0c24a';

const UNIFORM: Record<string, { body: string; emblem: G }> = {
  pm: {
    body: '#5f7350',
    emblem: (c) => {
      c.shape(star(32, 28, 11, 4.8, 5), GOLD);
      c.line('M22 40L32 45L42 40', GOLD, 2.6);
    },
  },
  civil: {
    body: '#2e3a5c',
    emblem: (c) => {
      c.shape(ell(30, 29, 8.5), '#dbeaf6', { w: 2.6 });
      c.stroke('M25 25Q27 22 30 22', '#ffffff', 1.6);
      c.line('M36 35L43 43', GOLD, 4);
    },
  },
  especial: {
    body: '#3c424e',
    emblem: (c) => {
      c.line('M22 36L32 26L42 36', GOLD, 3.2);
      c.line('M22 44L32 34L42 44', '#c8ced8', 3.2);
      c.shape(star(32, 20, 4.4, 2, 5), GOLD, { w: 1.6, shade: false });
    },
  },
};

export function uniformIconSvg(id: string): string {
  return memo(`u:${id}`, () => {
    const u = UNIFORM[id] ?? UNIFORM.pm!;
    const c = new Canvas(`u_${id}`);
    c.shape(SHIELD, u.body, { sh: 3.4 });
    c.outline(SHIELD_IN, GOLD, 2);
    u.emblem(c);
    return c.svg();
  });
}

const FACTION: Record<string, (c: Canvas, k: string, K: string) => void> = {
  liga: (c, k, K) => {
    c.line('M23 31V25Q23 17 32 17Q41 17 41 25V31', '#aab2c0', 3.2);
    c.shape(rr(19, 30, 26, 19, 5), K);
    c.dot(ell(32, 38, 2.6, 2.6), '#efe9dc');
    c.dot(rr(31, 38, 2, 5, 1), '#efe9dc');
    c.line('M16 46Q22 36 29 41T47 28', k, 4.2);
    c.shape(ell(47, 27, 3.6, 3), k, { w: 1.8, shade: false });
    c.dot(ell(48, 26, 0.9, 0.9), '#efe9dc');
  },
  cla: (c, k, K) => {
    c.shape('M32 29Q27 20 13 22Q19 27 16 36Q24 33 29 40L32 46L35 40Q40 33 48 36Q45 27 51 22Q37 20 32 29Z', K);
    c.shape(ell(32, 27, 5), k);
    c.shape(poly(36, 26, 42, 28, 36, 30), '#e8b64a', { w: 1.6, shade: false });
    c.dot(ell(33.5, 26, 1, 1), '#efe9dc');
  },
  ordem: (c, k, K) => {
    c.clip(rr(0, 0, 32, 64, 0), () => {
      c.shape(ell(32, 31, 10.5), k);
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 2 + (i - 1.5) * 0.62 + 0.0;
        c.line(`M${32 + Math.cos(a) * 14} ${31 + Math.sin(a) * 14}L${32 + Math.cos(a) * 18} ${31 + Math.sin(a) * 18}`, k, 3);
      }
    });
    c.clip(rr(32, 0, 32, 64, 0), () => {
      c.shape(ell(34, 34, 10.5), K);
    });
    c.stroke('M32 14V50', '#efe9dc', 2.4);
  },
  mare: (c, k, K) => {
    c.shape('M16 46C15 33 22 21 33 20C41 19 47 24 46 31C44 28 40 28 37 30C34 33 35 41 40 46Z', k);
    c.dot(ell(40, 24, 2.2, 1.6), '#efe9dc');
    c.dot(ell(33, 26, 1.4, 1.1), '#efe9dc');
    c.shape(rr(14, 45, 36, 6, 3), K);
  },
};

export function factionIconSvg(id: string, colors: readonly [string, string]): string {
  return memo(`f:${id}:${colors[0]}:${colors[1]}`, () => {
    const k = colors[0];
    const K = colors[1] === '#111111' ? '#3a3f4a' : colors[1];
    const c = new Canvas(`f_${id}_${colors[0]}_${colors[1]}`);
    c.shape(ell(32, 32, 29), k, { sh: 3.4 });
    c.shape(ell(32, 32, 22), '#efe9dc', { sh: 2.4, line: ramp(k).line });
    (FACTION[id] ?? FACTION.liga!)(c, k, K);
    return c.svg();
  });
}
