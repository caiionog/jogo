/**
 * Cores e rampas da pixel art (Etapa 8).
 * Cada cor base vira uma rampa de 4 tons com hue shifting: as sombras puxam para o vermelho/roxo e as luzes para o
 * amarelo (nunca só escurecer/clarear). Índices: 0 contorno (sel-out) · 1 sombra · 2 base · 3 luz.
 */
export type Rgb = [number, number, number];
export type Ramp = [Rgb, Rgb, Rgb, Rgb];

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? ((G - B) / d + (G < B ? 6 : 0)) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Gira o matiz `h` em direção a `target` em no máximo `deg` graus (pelo caminho mais curto). */
function towards(h: number, target: number, deg: number): number {
  let d = ((target - h + 540) % 360) - 180;
  d = clamp(d, -deg, deg);
  return (h + d + 360) % 360;
}

export interface RampOptions {
  /** Quanto o matiz gira na sombra (graus). */
  shadowShift?: number;
  /** Quanto o matiz gira na luz (graus). */
  lightShift?: number;
  /** Teto de saturação do contorno e da sombra (pele: mais baixo, para não estourar em vermelho). */
  satCap?: number;
}

/** Rampa de 4 tons a partir de uma cor base. Funciona de tons muito claros a muito escuros. */
export function makeRamp(hex: string, opts: RampOptions = {}): Ramp {
  const base = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(base);
  const ss = opts.shadowShift ?? 14;
  const ls = opts.lightShift ?? 10;
  // sombras: para o carmim/roxo (≈ 330°); luzes: para o amarelo (≈ 55°)
  const shadowHue = towards(h, 330, ss);
  const outlineHue = towards(h, 320, ss * 1.6);
  const lightHue = towards(h, 55, ls);
  // deltas proporcionais à luminosidade: tons claros não estouram em vermelho; escuros não viram preto chapado
  const cap = opts.satCap ?? 1;
  const shadow = hslToRgb(shadowHue, clamp(Math.min(s + 0.06, 0.62 + s * 0.3, cap), 0, 1), clamp(l * 0.8 - 0.02, 0.05, 1));
  const outline = hslToRgb(outlineHue, clamp(Math.min(s + 0.04, 0.5 + s * 0.25, cap * 0.85), 0, 1), clamp(l * 0.55 - 0.03, 0.04, 1));
  const light = hslToRgb(lightHue, clamp(s * 0.95, 0, 1), clamp(l + (1 - l) * 0.24, 0, 0.97));
  return [outline, shadow, base, light];
}
