/**
 * Montagem do SVG em camadas. `region` desenha uma forma com a sombra suave (a base deslocada para cima e para a
 * esquerda dentro da própria forma: a luz vem de cima à esquerda) e o contorno por cima.
 * Os ids dos clipPaths vêm do hash do descriptor: o mesmo descriptor gera o mesmo SVG, e dois avatares diferentes na
 * mesma página não disputam ids.
 */
import { n } from './geom';
import type { Ramp } from './palette';

export interface RegionOpts {
  /** Deslocamento da base (luz): a sombra aparece do lado oposto. Padrão [-4, -3]. */
  shift?: [number, number];
  /** Sombra com forma própria (no lugar do deslocamento), recortada pela região. */
  shadeD?: string;
  /** Espessura do contorno (0 = sem contorno). */
  sw?: number;
  /** Desenhos extras recortados pela região (estampas, listras), por cima da base. */
  inner?: string;
  /** Sem sombra. */
  flat?: boolean;
  opacity?: number;
}

export class Doc {
  private defs: string[] = [];
  private out: string[] = [];
  private seq = 0;
  constructor(private readonly prefix: string) {}

  id(): string {
    return `${this.prefix}-${(this.seq++).toString(36)}`;
  }

  /** Recorte reutilizável (ex.: íris dentro do olho). */
  clip(d: string): string {
    const id = this.id();
    this.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    return id;
  }

  raw(s: string): void {
    this.out.push(s);
  }

  open(layer: string, extra = ''): void {
    this.out.push(`<g data-layer="${layer}"${extra}>`);
  }

  close(): void {
    this.out.push('</g>');
  }

  region(d: string, r: Ramp, o: RegionOpts = {}): void {
    const sw = o.sw ?? 1.9;
    const op = o.opacity !== undefined ? ` opacity="${n(o.opacity)}"` : '';
    if (o.flat && !o.inner) {
      this.out.push(`<path d="${d}" fill="${r.base}"${sw ? ` stroke="${r.line}" stroke-width="${n(sw)}" stroke-linejoin="round"` : ''}${op}/>`);
      return;
    }
    const id = this.clip(d);
    let body: string;
    if (o.flat) body = `<path d="${d}" fill="${r.base}"/>`;
    else if (o.shadeD) body = `<path d="${d}" fill="${r.base}"/><g clip-path="url(#${id})"><path d="${o.shadeD}" fill="${r.shade}"/>`;
    else {
      const [dx, dy] = o.shift ?? [-4, -3];
      body = `<path d="${d}" fill="${r.shade}"/><g clip-path="url(#${id})"><path d="${d}" fill="${r.base}" transform="translate(${n(dx)} ${n(dy)})"/>`;
    }
    if (!o.flat) body += `${o.inner ?? ''}</g>`;
    else if (o.inner) body += `<g clip-path="url(#${id})">${o.inner}</g>`;
    this.out.push(`<g${op}>${body}${sw ? `<path d="${d}" fill="none" stroke="${r.line}" stroke-width="${n(sw)}" stroke-linejoin="round"/>` : ''}</g>`);
  }

  /** Traço solto (linhas do rosto, costuras). */
  stroke(d: string, color: string, w: number, opacity = 1, cap: 'round' | 'butt' = 'round'): void {
    this.out.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${n(w)}" stroke-linecap="${cap}" stroke-linejoin="round"${opacity < 1 ? ` opacity="${n(opacity)}"` : ''}/>`);
  }

  fill(d: string, color: string, opacity = 1): void {
    this.out.push(`<path d="${d}" fill="${color}"${opacity < 1 ? ` opacity="${n(opacity)}"` : ''}/>`);
  }

  svg(viewBox: string, attrs = ''): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${attrs}>${this.defs.length ? `<defs>${this.defs.join('')}</defs>` : ''}${this.out.join('')}</svg>`;
  }
}
