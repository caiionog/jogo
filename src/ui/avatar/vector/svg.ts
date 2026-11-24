/**
 * Montagem do SVG em camadas.
 *
 * - `group` desenha VÁRIAS formas como uma peça só (corpo, roupa com mangas): primeiro o contorno de todas por baixo
 *   (traço com o dobro da espessura), depois os preenchimentos por cima. Assim o contorno só aparece na silhueta
 *   externa da união — nunca nas emendas internas (ombro × braço, quadril × perna, pulso × mão) — e, como o contorno
 *   fica todo do lado de fora, uma peça da frente com folga ≥ 0 esconde por completo o contorno da peça de trás.
 * - A sombra suave é a própria cor escurecida: a base vai deslocada para cima e para a esquerda dentro da união (luz de
 *   cima à esquerda), sobrando a sombra do lado direito e embaixo.
 * - `region` é a versão de uma forma só, com o traço centrado (detalhes pequenos: bolsos, golas, olhos).
 * Os ids dos clipPaths vêm do hash do descriptor: o mesmo descriptor gera o mesmo SVG, e dois avatares na mesma página
 * não disputam ids.
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
  /** Desenhos extras recortados pela região (estampas, listras, dobras), por cima da base. */
  inner?: string;
  /** Sem sombra. */
  flat?: boolean;
  opacity?: number;
}

export interface GroupOpts extends RegionOpts {
  /** Recorte do contorno (só desenha o contorno dentro deste caminho). */
  outlineClip?: string;
  /** Regra de preenchimento par-ímpar (formas com furo, como o capuz). */
  evenodd?: boolean;
  /** Formas extras só na passada da luz (a sombra fica igual à da peça de trás: antebraço da frente). */
  lightWith?: string[];
}

export class Doc {
  private defs: string[] = [];
  private out: string[] = [];
  private seq = 0;
  constructor(private readonly prefix: string) {}

  id(): string {
    return `${this.prefix}-${(this.seq++).toString(36)}`;
  }

  /** Recorte reutilizável; com várias formas, recorta pela união delas. */
  clip(d: string | string[], evenodd = false): string {
    const id = this.id();
    const list = typeof d === 'string' ? [d] : d;
    const rule = evenodd ? ' clip-rule="evenodd"' : '';
    this.defs.push(`<clipPath id="${id}">${list.map((p) => `<path d="${p}"${rule}/>`).join('')}</clipPath>`);
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

  /** Várias formas como uma peça só (ver o cabeçalho). */
  group(parts: string[], r: Ramp, o: GroupOpts = {}): void {
    const sw = o.sw ?? 1.7;
    const rule = o.evenodd ? ' fill-rule="evenodd"' : '';
    const paths = parts.map((d) => `<path d="${d}"/>`).join('');
    const op = o.opacity !== undefined ? ` opacity="${n(o.opacity)}"` : '';
    let s = `<g${op}>`;
    if (sw) {
      const oc = o.outlineClip ? ` clip-path="url(#${this.clip(o.outlineClip)})"` : '';
      s += `<g fill="${r.line}" stroke="${r.line}" stroke-width="${n(sw * 2)}" stroke-linejoin="round"${rule}${oc}>${paths}</g>`;
    }
    const needClip = !o.flat || !!o.inner;
    const id = needClip ? this.clip(parts, o.evenodd) : '';
    if (o.flat) {
      s += `<g fill="${r.base}"${rule}>${paths}</g>`;
      if (o.inner) s += `<g clip-path="url(#${id})">${o.inner}</g>`;
    } else if (o.shadeD) {
      s += `<g fill="${r.base}"${rule}>${paths}</g><g clip-path="url(#${id})"><path d="${o.shadeD}" fill="${r.shade}"/>${o.inner ?? ''}</g>`;
    } else {
      const [dx, dy] = o.shift ?? [-4, -3];
      const light = o.lightWith ? paths + o.lightWith.map((d) => `<path d="${d}"/>`).join('') : paths;
      s += `<g fill="${r.shade}"${rule}>${paths}</g><g clip-path="url(#${id})"><g fill="${r.base}" transform="translate(${n(dx)} ${n(dy)})"${rule}>${light}</g>${o.inner ?? ''}</g>`;
    }
    this.out.push(s + '</g>');
  }

  /** Uma forma, com o traço centrado na borda (detalhes). */
  region(d: string, r: Ramp, o: RegionOpts = {}): void {
    const sw = o.sw ?? 1.6;
    const op = o.opacity !== undefined ? ` opacity="${n(o.opacity)}"` : '';
    const line = sw ? `<path d="${d}" fill="none" stroke="${r.line}" stroke-width="${n(sw)}" stroke-linejoin="round"/>` : '';
    if (o.flat && !o.inner) {
      this.out.push(`<path d="${d}" fill="${r.base}"${sw ? ` stroke="${r.line}" stroke-width="${n(sw)}" stroke-linejoin="round"` : ''}${op}/>`);
      return;
    }
    const id = this.clip(d);
    let body: string;
    if (o.flat) body = `<path d="${d}" fill="${r.base}"/><g clip-path="url(#${id})">${o.inner ?? ''}</g>`;
    else if (o.shadeD) body = `<path d="${d}" fill="${r.base}"/><g clip-path="url(#${id})"><path d="${o.shadeD}" fill="${r.shade}"/>${o.inner ?? ''}</g>`;
    else {
      const [dx, dy] = o.shift ?? [-4, -3];
      body = `<path d="${d}" fill="${r.shade}"/><g clip-path="url(#${id})"><path d="${d}" fill="${r.base}" transform="translate(${n(dx)} ${n(dy)})"/>${o.inner ?? ''}</g>`;
    }
    this.out.push(`<g${op}>${body}${line}</g>`);
  }

  /** Traço solto (linhas do rosto, costuras). */
  stroke(d: string, color: string, w: number, opacity = 1, cap: 'round' | 'butt' = 'round'): void {
    this.out.push(strokeEl(d, color, w, opacity, cap));
  }

  fill(d: string, color: string, opacity = 1): void {
    this.out.push(fillEl(d, color, opacity));
  }

  svg(viewBox: string, attrs = ''): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${attrs}>${this.defs.length ? `<defs>${this.defs.join('')}</defs>` : ''}${this.out.join('')}</svg>`;
  }
}

/** Elemento de traço (para `inner`). */
export function strokeEl(d: string, color: string, w: number, opacity = 1, cap: 'round' | 'butt' = 'round'): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${n(w)}" stroke-linecap="${cap}" stroke-linejoin="round"${opacity < 1 ? ` opacity="${n(opacity)}"` : ''}/>`;
}

/** Elemento de preenchimento (para `inner`). */
export function fillEl(d: string, color: string, opacity = 1): string {
  return `<path d="${d}" fill="${color}"${opacity < 1 ? ` opacity="${n(opacity)}"` : ''}/>`;
}

/** Conteúdo recortado por um clipPath já definido. */
export function clipped(id: string, content: string): string {
  return `<g clip-path="url(#${id})">${content}</g>`;
}
