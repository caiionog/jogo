/**
 * Cores do avatar cartoon. Cada região tem uma rampa curta: base, UMA sombra suave (a mesma cor escurecida e um pouco
 * mais saturada, com o matiz puxado para o vermelho/roxo) e o contorno (bem mais escuro e colorido, nunca preto puro).
 * A mesma regra funciona do tom de pele mais claro ao mais escuro.
 */
import { clamp, lerp } from './geom';

type Hsl = [number, number, number];

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6);
  const num = parseInt(v, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (x: number) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function toHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex).map((x) => x / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function fromHsl([h, s, l]: Hsl): string {
  const hh = (((h % 360) + 360) % 360) / 360;
  if (s === 0) return rgbToHex([l * 255, l * 255, l * 255]);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    return u < 1 / 6 ? p + (q - p) * 6 * u : u < 1 / 2 ? q : u < 2 / 3 ? p + (q - p) * (2 / 3 - u) * 6 : p;
  };
  return rgbToHex([f(hh + 1 / 3) * 255, f(hh) * 255, f(hh - 1 / 3) * 255]);
}

/** Desloca o matiz em direção ao vermelho/roxo (sombra quente nas cores quentes, arroxeada nas frias). */
function towardShadow(h: number, amount: number): number {
  return h >= 20 && h < 200 ? h - amount : h >= 200 && h < 330 ? h + amount : h;
}

export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface Ramp {
  base: string;
  /** Sombra suave (uma por região). */
  shade: string;
  /** Contorno. */
  line: string;
  /** Brilho (só cabelo e detalhes). */
  light: string;
}

export function darken(hex: string, k: number, satUp = 0.06, hueShift = 6): string {
  const [h, s, l] = toHsl(hex);
  return fromHsl([towardShadow(h, hueShift), clamp(s + (s > 0.04 ? satUp : 0.02), 0, 0.85), clamp(l * k, 0, 1)]);
}

export function lighten(hex: string, k: number): string {
  const [h, s, l] = toHsl(hex);
  return fromHsl([h >= 20 && h < 200 ? h + 4 : h, s, clamp(l + (1 - l) * k, 0, 1)]);
}

const cache = new Map<string, Ramp>();

/** Rampa da região. `kind` ajusta a força da sombra (pele e cabelo um pouco mais suaves). */
export function ramp(hex: string, kind: 'skin' | 'hair' | 'cloth' = 'cloth'): Ramp {
  const key = kind + hex;
  const hit = cache.get(key);
  if (hit) return hit;
  const [h, s, l] = toHsl(hex);
  // sombra: escurece por multiplicação, mas garante um degrau mínimo para cores muito escuras
  const shadeL = clamp(Math.min(l * (kind === 'skin' ? 0.86 : 0.83), l - 0.045), 0.03, 1);
  const shade = fromHsl([towardShadow(h, kind === 'skin' ? 5 : 7), clamp(s + (s > 0.04 ? 0.07 : 0.02), 0, 0.85), shadeL]);
  let line: string;
  if (kind === 'skin') {
    // pele: contorno marrom-escuro e colorido (nunca preto puro); nas peles médias e escuras desce até ~7% de luz para
    // manter o contraste com a pele (≥ 3:1 até o tom 0,75 da rampa; no tom mais escuro, o limite físico é o preto)
    const lineL = l >= 0.62 ? clamp(l * 0.42, 0.09, 0.27) : lerp(0.068, 0.26, clamp((l - 0.4) / 0.22, 0, 1));
    line = fromHsl([towardShadow(h, 10), clamp(Math.max(s, 0.3) + 0.12, 0, 0.72), lineL]);
  } else {
    const lineL = clamp(l * 0.42, 0.09, kind === 'cloth' ? 0.3 : 0.27);
    line = fromHsl([towardShadow(h, 10), clamp(Math.max(s, 0.12) + 0.12, 0, 0.7), Math.min(lineL, Math.max(0.09, l - 0.12))]);
  }
  const light = fromHsl([h >= 20 && h < 200 ? h + 4 : h, s, clamp(l + (1 - l) * 0.28 + (l < 0.2 ? 0.1 : 0), 0, 1)]);
  const r: Ramp = { base: hex, shade, line, light };
  cache.set(key, r);
  return r;
}

/** Cor de contraste para listras e estampas. */
export function contrast(hex: string): string {
  return luminance(hex) > 0.35 ? darken(hex, 0.62, 0.05, 4) : mix(hex, '#f7f3ea', 0.78);
}

/** Razão de contraste WCAG entre duas cores. */
export function contrastRatio(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Pele com a idade: um pouco mais opaca (menos saturada) no idoso. */
export function agedSkin(hex: string, elder: number): string {
  if (elder <= 0) return hex;
  const [h, s, l] = toHsl(hex);
  return fromHsl([h, s * (1 - 0.28 * clamp(elder, 0, 1)), l * (1 - 0.03 * elder)]);
}
