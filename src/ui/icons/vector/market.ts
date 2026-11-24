/** Ícones cartoon do Mercado: bens (cartão com o objeto) e empreendimentos (fachada com toldo e placa do ramo). */
import { BUSINESS_GLYPHS } from '../../../content/sprites/market/business';
import { ICON_FOR, MARKET_ICONS } from '../../../content/sprites/market';
import { ramp } from '../../avatar/vector/palette';
import { Canvas, ell, poly, rr, star } from './kit';

const CARD = rr(3, 3, 58, 58, 15);

function card(c: Canvas, tint: string): void {
  c.shape(CARD, tint, { shade: true, sh: 3 });
}

const GRASS = '#7fc060';
const SKY = '#cfe9f6';

function ground(c: Canvas, color = GRASS, y = 46): void {
  c.clip(CARD, () => {
    c.shape(rr(0, y, 64, 20, 0), color, { w: 2, shade: false });
  });
}

const BASE: Record<string, (c: Canvas) => void> = {
  casa(c) {
    card(c, SKY);
    ground(c, GRASS, 48);
    c.shape(rr(14, 31, 36, 20, 2), '#f2e5c6');
    c.shape(rr(40, 16, 6, 10, 1.5), '#b07a5a');
    c.shape(poly(9, 33, 32, 11, 55, 33), '#d8553c');
    c.shape(rr(19, 36, 9, 9, 2), '#8ec6e6');
    c.shape(rr(36, 38, 9, 13, 2.5), '#8a5a36');
    c.dot(ell(42, 45, 1, 1), '#f5d36b');
  },
  predio(c) {
    card(c, '#d9e4f2');
    ground(c, '#8fbf75', 52);
    c.shape(rr(19, 10, 26, 44, 3), '#b7c3d8');
    for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) c.shape(rr(24 + k * 11, 15 + r * 9, 7, 6, 1.5), (r + k) % 2 ? '#f6dc7a' : '#7d98c0', { w: 1.6, shade: false });
    c.shape(rr(28, 45, 9, 9, 2), '#6a4a34');
  },
  praia(c) {
    card(c, '#bfe6f5');
    c.shape(ell(46, 17, 7), '#ffd84d');
    c.clip(CARD, () => {
      c.shape(rr(0, 42, 64, 24, 0), '#f1d79a', { w: 2, shade: false });
      c.shape(rr(0, 36, 64, 9, 0), '#4fa6d8', { w: 2, shade: false });
    });
    c.line('M22 44V24', '#8a5a36', 2.6);
    c.shape('M10 26Q22 8 34 26Z', '#e5533e');
    c.stroke('M16 22Q20 15 22 14', '#ff9a85');
  },
  sitio(c) {
    card(c, SKY);
    ground(c, '#86c466', 44);
    c.shape(rr(40, 14, 4, 22, 2), '#8a5a36');
    c.shape(ell(42, 14, 11, 9), '#3f9a4a');
    c.shape(rr(10, 30, 26, 20, 2), '#c0452f');
    c.shape(poly(7, 32, 23, 17, 39, 32), '#8a2e1f');
    c.shape(rr(18, 38, 10, 12, 2), '#f1e3c4');
    c.stroke('M18 38L28 50M28 38L18 50', '#c0452f', 1.6);
    c.stroke('M8 56H56', '#5e9c45', 2);
  },
  terreno(c) {
    card(c, SKY);
    ground(c, '#8cc468', 38);
    c.stroke('M6 44Q32 40 58 46', '#6aa048', 2);
    for (let i = 0; i < 6; i++) c.shape(rr(8 + i * 9, 30, 4, 16, 1.5), '#c08a52', { w: 1.8, shade: false });
    c.line('M8 36H56M8 43H56', '#9a6a3c', 2);
    c.line('M44 31V12', '#6a4a34', 2.6);
    c.shape(rr(24, 8, 28, 14, 3.5), '#f4f1ea');
    c.shape(rr(28, 12, 20, 3.4, 1.5), '#d0443c', { w: 0, bare: true, shade: false });
    c.shape(rr(28, 17, 14, 2.6, 1.3), '#9aa3b2', { bare: true, shade: false });
  },
  carro(c) {
    card(c, '#f6e6c6');
    ground(c, '#b7bcc8', 48);
    c.shape('M12 40L17 28Q18 25 22 25H42Q46 25 48 28L53 40Z', '#e0483c');
    c.shape('M20 28H30V37H16Z', '#a9dcf2', { w: 1.8, shade: false });
    c.shape('M34 28H42L47 37H34Z', '#a9dcf2', { w: 1.8, shade: false });
    c.shape(rr(8, 37, 48, 11, 5), '#e0483c');
    c.dot(ell(52, 41, 2.2, 2.2), '#ffe27a');
    c.shape(ell(19, 48, 6), '#3d3a4a');
    c.shape(ell(45, 48, 6), '#3d3a4a');
    c.dot(ell(19, 48, 2.4, 2.4), '#c4c8d4');
    c.dot(ell(45, 48, 2.4, 2.4), '#c4c8d4');
  },
  moto(c) {
    card(c, '#dceaf8');
    ground(c, '#b7bcc8', 50);
    c.line('M44 20L48 30M44 20H52', '#8a8f9c', 2.6);
    c.shape('M20 38Q22 28 32 28H42L46 38Z', '#3274d6');
    c.shape(rr(18, 25, 14, 6, 3), '#3a3a48');
    c.shape(rr(30, 36, 18, 6, 3), '#8a8f9c');
    c.dot(ell(52, 33, 2, 2), '#ffe27a');
    c.shape(ell(16, 47, 8), '#3d3a4a');
    c.shape(ell(48, 47, 8), '#3d3a4a');
    c.dot(ell(16, 47, 3, 3), '#c4c8d4');
    c.dot(ell(48, 47, 3, 3), '#c4c8d4');
  },
  luxo(c) {
    card(c, '#fbeec2');
    c.shape(poly(18, 24, 24, 15, 40, 15, 46, 24, 32, 50), '#58c8e6');
    c.stroke('M18 24H46M24 15L28 24L32 15L36 24L40 15M28 24L32 50L36 24', '#e8fbff', 1.8);
    c.dot(poly(22, 24, 27, 17, 30, 17, 25, 24), '#bff0fb');
    c.shape(star(50, 14, 6, 2.2, 4), '#fff2a8');
    c.shape(star(13, 44, 4, 1.6, 4), '#fff2a8');
  },
};

function business(c: Canvas, awning: string, glyph?: (c: Canvas) => void): void {
  card(c, '#f2e6cf');
  c.shape(rr(10, 36, 44, 22, 3), '#e9dcc0');
  c.shape(rr(14, 47, 17, 9, 2), '#9fd0e8', { w: 1.8, shade: false });
  c.shape(rr(37, 46, 10, 12, 2.5), '#7a5238');
  c.shape(rr(10, 7, 44, 27, 7), '#fbf6e6');
  glyph?.(c);
  const stripes = (): void => {
    c.shape('M7 33H57V42' + Array.from({ length: 6 }, (_, i) => `A4.17 4.17 0 0 1 ${57 - 8.33 * (i + 1)} 42`).join('') + 'Z', '#fdf6ea', { shade: false, bare: true });
    for (let i = 0; i < 6; i += 2) c.shape(rr(7 + i * 8.33, 31, 8.33, 14, 0), awning, { bare: true, shade: false });
  };
  c.clip('M7 33H57V42' + Array.from({ length: 6 }, (_, i) => `A4.17 4.17 0 0 1 ${57 - 8.33 * (i + 1)} 42`).join('') + 'Z', stripes);
  const edge = 'M7 33H57V42' + Array.from({ length: 6 }, (_, i) => `A4.17 4.17 0 0 1 ${57 - 8.33 * (i + 1)} 42`).join('') + 'Z';
  c.outline(edge, ramp(awning).line);
}

/** Símbolos do ramo: caixa de ±10 em torno do centro (32, 21) da placa. */
type G = (c: Canvas) => void;
const T = { cx: 32, cy: 21 };
const at = (fn: G): G => (c) => {
  c.open(`translate(${T.cx} ${T.cy})`);
  fn(c);
  c.close();
};

const GLYPH: Record<string, G> = {
  lanchonete_bairro: at((c) => {
    c.shape(rr(-9.5, 5, 19, 5, 2.5), '#e3a24a');
    c.shape(rr(-10, 0.5, 20, 4.5, 2.2), '#6b3a22');
    c.shape('M-10 -1Q-8 1 -6 -1T-2 -1T2 -1T6 -1T10 -1V1H-10Z', '#6cc04a', { w: 1.6, shade: false });
    c.shape('M-9.5 -2Q-9.5 -10 0 -10Q9.5 -10 9.5 -2Z', '#eaaa52');
    c.dot(ell(-3, -6, 0.9, 0.6), '#fff2c8');
    c.dot(ell(2.5, -7, 0.9, 0.6), '#fff2c8');
    c.dot(ell(5.5, -4.5, 0.9, 0.6), '#fff2c8');
  }),
  acaiteria: at((c) => {
    c.shape(ell(0, -3, 10, 5.5), '#7b3a9e');
    c.dot(ell(-3, -5, 3, 1.4), '#b36fd0');
    c.dot(ell(3.5, -3, 3.6, 1.3), '#e8d4f2');
    c.shape('M-10 -3H10Q10 8 0 9.5Q-10 8 -10 -3Z', '#f4eef8');
    c.shape('M-9 0H9Q8 7 0 8.5Q-8 7 -9 0Z', '#b78bd0', { shade: false, bare: true });
    c.line('M6 -6L11 -12', '#e5a04a', 2);
  }),
  pizzaria: at((c) => {
    c.shape('M-10 -7Q0 -13 10 -7L0 11Z', '#f2c14e');
    c.shape('M-10 -7Q0 -13 10 -7L9 -4Q0 -9 -9 -4Z', '#c98a3a', { shade: false });
    c.shape(ell(-2, -1, 2.4), '#d0382e', { w: 1.6, shade: false });
    c.shape(ell(3, 2, 2), '#d0382e', { w: 1.6, shade: false });
    c.shape(ell(-0.5, 6, 1.5), '#d0382e', { w: 1.4, shade: false });
  }),
  padaria: at((c) => {
    c.shape(rr(-10.5, -6, 21, 15, 7), '#dfa14f');
    c.line('M-5 -4L-3 3M0 -5L2 2M5 -4L7 3', '#f4d391', 1.6);
  }),
  barbearia: at((c) => {
    const body = rr(-5, -10, 10, 20, 4);
    c.shape(body, '#f4f1ea');
    c.clip(body, () => {
      for (let i = -2; i < 5; i++) c.shape(poly(-8, -14 + i * 7, 8, -14 + i * 7 - 7, 8, -14 + i * 7 - 2, -8, -14 + i * 7 + 5), i % 2 ? '#d0443c' : '#3a6fc4', { bare: true, shade: false });
    });
    c.outline(body, '#4a2a3a');
    c.shape(rr(-6.5, -12, 13, 3, 1.5), '#9aa3b2');
    c.shape(rr(-6.5, 9, 13, 3, 1.5), '#9aa3b2');
  }),
  salao_beleza: at((c) => {
    c.line('M-4 -2L5 -10M4 -2L-5 -10', '#b9c0cc', 3);
    c.line('M-1 -4L-6 5M1 -4L6 5', '#9aa3b2', 2.4);
    c.shape(ell(-6, 6, 4), '#ee7bb0');
    c.shape(ell(6, 6, 4), '#ee7bb0');
    c.dot(ell(-6, 6, 1.6, 1.6), '#fbf6e6');
    c.dot(ell(6, 6, 1.6, 1.6), '#fbf6e6');
  }),
  lava_jato: at((c) => {
    c.shape('M0 -11Q9 -1 9 4A9 9 0 0 1 -9 4Q-9 -1 0 -11Z', '#3b8fe0');
    c.dot(ell(-3.5, 3, 1.8, 3.4), '#bfe0fb');
    c.shape(ell(8, -5, 2.4), '#e8f6ff', { w: 1.4, shade: false });
    c.shape(ell(-9, -3, 1.6), '#e8f6ff', { w: 1.2, shade: false });
  }),
  mercadinho: at((c) => {
    c.line('M-11 -9H-7L-4 4H8', '#4d5361', 2.4);
    c.shape('M-6.5 -5H10L8 3H-4.5Z', '#e8b64a');
    c.stroke('M-1 -4V2M4 -4V2', '#fdeaa8', 1.4);
    c.shape(ell(-2, 8, 2), '#4d5361', { w: 1.4, shade: false });
    c.shape(ell(7, 8, 2), '#4d5361', { w: 1.4, shade: false });
  }),
  farmacia: at((c) => {
    c.shape('M-3.5 -10H3.5V-3.5H10V3.5H3.5V10H-3.5V3.5H-10V-3.5H-3.5Z', '#2fae6e', { w: 2.4 });
    c.stroke('M-1.5 -7.5V-1M-7 -1.5H-1', '#8fe0b4', 1.6);
  }),
  loja_roupas: at((c) => {
    c.line('M0 -5Q0 -9 3 -9Q6 -9 5.5 -6Q5 -4 0 -3', '#9aa3b2', 2);
    c.shape('M0 -3L10 6Q11 9 8 9H-8Q-11 9 -10 6Z', '#e0679a');
    c.stroke('M-5 6H5', '#f7b7d1', 1.4);
  }),
  roupa: at((c) => {
    c.shape('M-4 -9Q0 -5 4 -9L10 -6L8 -0.5L5 -2V9H-5V-2L-8 -0.5L-10 -6Z', '#d6453d');
    c.shape(ell(0, 1, 2.3), '#f4efe4', { w: 1.4, shade: false });
  }),
  suplementos: at((c) => {
    c.shape(rr(-7, -11, 14, 5, 2), '#2f3340');
    c.shape(rr(-8.5, -7, 17, 17, 4), '#e0a82e');
    c.shape(rr(-6, -3, 12, 8, 2), '#fbf3da', { w: 1.4, shade: false });
    c.stroke('M-3 1H3', '#e0a82e', 1.8);
  }),
  oficina: at((c) => {
    c.open('rotate(-45)');
    c.shape(rr(-2.6, -2, 5.2, 14, 2.6), '#aab2c0');
    c.shape(ell(0, -6, 6.4), '#aab2c0');
    c.shape(rr(-2.6, -14, 5.2, 8, 0), '#fbf6e6', { bare: true, shade: false });
    c.close();
    c.shape(ell(0, 0, 1.4), '#fbf6e6', { w: 0, bare: true, shade: false });
  }),
  academia_luta: at((c) => {
    c.shape('M-8 -3Q-9 -11 0 -11Q9 -11 9 -3Q10 2 7 4V6H-6V3Q-9 1 -8 -3Z', '#d03a34');
    c.shape(ell(-6, -1, 3, 4), '#e8605a', { w: 1.6, shade: false });
    c.shape(rr(-6.5, 5, 14, 6, 2), '#f4f1ea');
  }),
  academia: at((c) => {
    c.line('M-8 0H8', '#9aa3b2', 3);
    c.shape(rr(-11, -7, 5, 14, 2), '#4d5361');
    c.shape(rr(6, -7, 5, 14, 2), '#4d5361');
    c.shape(rr(-6.5, -4.5, 3, 9, 1.4), '#7a8392', { w: 1.8, shade: false });
    c.shape(rr(3.5, -4.5, 3, 9, 1.4), '#7a8392', { w: 1.8, shade: false });
  }),
  pet_shop: at((c) => {
    c.shape(ell(0, 4, 6.5, 5.4), '#9a6a44');
    c.shape(ell(-7, -2.5, 2.6, 3.2), '#9a6a44');
    c.shape(ell(-2.6, -7.5, 2.6, 3.4), '#9a6a44');
    c.shape(ell(2.6, -7.5, 2.6, 3.4), '#9a6a44');
    c.shape(ell(7, -2.5, 2.6, 3.2), '#9a6a44');
  }),
  sorveteria: at((c) => {
    c.shape(poly(-6, 0, 6, 0, 0, 11.5), '#e2ae60');
    c.stroke('M-3 3L2 8M3 3L-2 8', '#a8742e', 1.2);
    c.shape(ell(0, -1, 7), '#f08bb2');
    c.shape(ell(0, -7, 5.4), '#fbe9c8');
    c.shape(ell(1.5, -12, 1.8), '#d0382e', { w: 1.3, shade: false });
  }),
  food_truck: at((c) => {
    c.shape(rr(-11, -7, 15, 14, 3), '#e8b030');
    c.shape('M4 -3H8Q10 -3 11 0L12 5V7H4Z', '#e8b030');
    c.shape(rr(-8, -4, 9, 5, 1.5), '#f9e9b8', { w: 1.6, shade: false });
    c.shape(ell(-6, 8, 3), '#3d3a4a', { w: 1.8, shade: false });
    c.shape(ell(7, 8, 3), '#3d3a4a', { w: 1.8, shade: false });
  }),
  grafica: at((c) => {
    c.shape(rr(-6, -11, 12, 8, 1.5), '#fbf6e6');
    c.shape(rr(-11, -4, 22, 10, 3.5), '#6a7384');
    c.shape(rr(-6, 3, 12, 8, 1.5), '#fbf6e6');
    c.stroke('M-3 6.5H3M-3 9H1', '#9aa3b2', 1.2);
    c.dot(ell(7, -0.5, 1.2, 1.2), '#7be0a0');
  }),
  loja_celulares: at((c) => {
    c.shape(rr(-6, -11, 12, 22, 3.5), '#2f3340');
    c.shape(rr(-4, -8, 8, 13, 1.5), '#8fc3df', { w: 1.2, shade: false });
    c.dot(ell(0, 8, 1.1, 1.1), '#aab2c0');
    c.stroke('M-2 -5L2 -1', '#eaf6ff', 1.2);
  }),
  pousada: at((c) => {
    c.shape(rr(-11, -8, 4, 18, 1.6), '#7a5238');
    c.shape(rr(-8, 0, 19, 6, 2), '#8ec6e6');
    c.shape(rr(-7, -3.5, 7, 4.5, 2.2), '#fbf6e6', { w: 1.6, shade: false });
    c.shape(rr(8, 3, 3, 7, 1.2), '#7a5238', { w: 1.6, shade: false });
  }),
  bar: at((c) => {
    c.line('M7 -4Q13 -4 12 1Q11 6 6 6', '#e8f1f8', 2.2);
    c.shape(rr(-8, -4, 15, 15, 3), '#e8a52e');
    c.shape(rr(-8, -4, 15, 4, 0), '#f6d27a', { bare: true, shade: false });
    c.shape(ell(-5, -6, 3.2), '#fdfbf4', { w: 1.6, shade: false });
    c.shape(ell(0, -8, 3.8), '#fdfbf4', { w: 1.6, shade: false });
    c.shape(ell(5, -6, 3), '#fdfbf4', { w: 1.6, shade: false });
  }),
  estudio_tatuagem: at((c) => {
    c.open('rotate(40)');
    c.shape(rr(-3, -11, 6, 13, 2.6), '#4d5361');
    c.shape(rr(-2, 2, 4, 4, 1), '#aab2c0', { w: 1.6, shade: false });
    c.line('M0 6V10', '#9aa3b2', 1.2);
    c.close();
    c.shape('M-8 5Q-5 0 -5 3A3 3 0 0 1 -11 3Q-11 1 -8 5Z', '#d0382e', { w: 1.6, shade: false });
  }),
  restaurante: at((c) => {
    c.shape(ell(0, 1, 8.5), '#fbf6e6');
    c.shape(ell(0, 1, 5), '#e8dfc8', { shade: false, w: 1.4 });
    c.line('M-12 -10V10M-14 -10V-4Q-14 -2 -12 -2Q-10 -2 -10 -4V-10', '#aab2c0', 1.6);
    c.line('M12 10V-10Q9 -8 9 -2V2H12', '#aab2c0', 1.8);
  }),
  __loja: at((c) => {
    c.shape(star(0, 0, 10, 4.4), '#f2b632');
  }),
};

const BUILD_COLORS = (id: string): string => BUSINESS_GLYPHS[id]?.awning ?? '#d8553c';

/** Ícones do Mercado por chave de `MARKET_ICONS` (casa, predio…, ids de negócio). */
export const MARKET_KEYS: readonly string[] = Object.keys(MARKET_ICONS);

const cache = new Map<string, string>();

export function marketIconSvg(key: string): string {
  const k = MARKET_ICONS[key] ? key : (ICON_FOR[key] ?? 'loja');
  const hit = cache.get(k);
  if (hit) return hit;
  const c = new Canvas(`m_${k}`);
  const base = BASE[k];
  if (base) base(c);
  else if (k === 'loja') business(c, '#e0563f', GLYPH.__loja);
  else business(c, BUILD_COLORS(k), GLYPH[k] ?? GLYPH.__loja);
  const svg = c.svg();
  cache.set(k, svg);
  return svg;
}
