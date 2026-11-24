/**
 * Kit de desenho dos ícones cartoon (release 0.0.3): formas em paths num viewBox 64×64, contorno escuro colorido
 * derivado da própria cor (nunca preto puro), cor chapada com UMA sombra suave por forma (crescente na borda de baixo
 * e da direita, luz de cima à esquerda). Tudo puro e determinístico: a mesma chave gera a mesma string.
 */
import { ramp } from '../../avatar/vector/palette';

export interface ShapeOpts {
  /** Sombra suave (padrão ligada). */
  shade?: boolean;
  /** Espessura do contorno. */
  w?: number;
  /** Cor do contorno (padrão: derivada da cor). */
  line?: string;
  /** Sem contorno. */
  bare?: boolean;
  /** Espessura da sombra. */
  sh?: number;
}

const n = (v: number) => String(Math.round(v * 100) / 100);

export const rr = (x: number, y: number, w: number, h: number, r = 3): string => {
  const k = Math.min(r, w / 2, h / 2);
  return `M${n(x + k)} ${n(y)}H${n(x + w - k)}A${n(k)} ${n(k)} 0 0 1 ${n(x + w)} ${n(y + k)}V${n(y + h - k)}A${n(k)} ${n(k)} 0 0 1 ${n(x + w - k)} ${n(y + h)}H${n(x + k)}A${n(k)} ${n(k)} 0 0 1 ${n(x)} ${n(y + h - k)}V${n(y + k)}A${n(k)} ${n(k)} 0 0 1 ${n(x + k)} ${n(y)}Z`;
};

export const ell = (cx: number, cy: number, rx: number, ry = rx): string =>
  `M${n(cx - rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)}Z`;

export const poly = (...pts: number[]): string => {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) d += `${i === 0 ? 'M' : 'L'}${n(pts[i]!)} ${n(pts[i + 1]!)}`;
  return `${d}Z`;
};

export const star = (cx: number, cy: number, R: number, r: number, points = 5): string => {
  const pts: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const rad = i % 2 === 0 ? R : r;
    pts.push(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  return poly(...pts);
};

export class Canvas {
  private out: string[] = [];
  private count = 0;
  private readonly prefix: string;

  constructor(key: string) {
    this.prefix = `i${key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  private id(): string {
    return `${this.prefix}-${this.count++}`;
  }

  /** Forma preenchida com contorno e sombra suave. */
  shape(d: string, fill: string, o: ShapeOpts = {}): this {
    const r = ramp(fill);
    const w = o.w ?? 2.4;
    const stroke = o.bare ? 'none' : (o.line ?? r.line);
    if (o.shade === false || r.shade === fill) {
      this.out.push(`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
      return this;
    }
    const id = this.id();
    const off = o.sh ?? 2.6;
    this.out.push(
      `<clipPath id="${id}"><path d="${d}"/></clipPath>`,
      `<path d="${d}" fill="${r.shade}"/>`,
      `<g clip-path="url(#${id})"><path d="${d}" fill="${fill}" transform="translate(${-off} ${-off})"/></g>`,
      `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`,
    );
    return this;
  }

  /** Traço grosso com contorno (cabides, garfos, cordas). */
  line(d: string, color: string, w = 3.4): this {
    const r = ramp(color);
    this.out.push(
      `<path d="${d}" fill="none" stroke="${r.line}" stroke-width="${w + 2.4}" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
    return this;
  }

  /** Detalhe fino sem contorno (brilhos, rachaduras). */
  stroke(d: string, color: string, w = 1.6): this {
    this.out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
    return this;
  }

  /** Só o contorno de uma forma. */
  outline(d: string, color: string, w = 2.4): this {
    this.out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`);
    return this;
  }

  dot(d: string, fill: string): this {
    this.out.push(`<path d="${d}" fill="${fill}"/>`);
    return this;
  }

  open(transform: string): this {
    this.out.push(`<g transform="${transform}">`);
    return this;
  }

  close(): this {
    this.out.push('</g>');
    return this;
  }

  /** Desenha dentro do recorte de uma forma. */
  clip(d: string, fn: () => void): this {
    const id = this.id();
    this.out.push(`<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">`);
    fn();
    this.out.push('</g>');
    return this;
  }

  svg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" focusable="false">${this.out.join('')}</svg>`;
  }
}
