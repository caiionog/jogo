/**
 * Geometria do avatar cartoon (release 0.0.3): pontos, curvas suaves (Catmull-Rom → Bézier) e membros por eixo.
 * Tudo puro e determinístico; os números saem com 1 casa decimal para o SVG ficar curto e estável.
 */

/** Ponto; o terceiro elemento `1` marca uma quina (a curva não suaviza ali). */
export type Pt = [number, number] | [number, number, 1];

export const n = (v: number): string => {
  const r = Math.round(v * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Caminho suave passando por todos os pontos (tensão 1 = Catmull-Rom). */
export function smooth(pts: Pt[], closed = true, tension = 1): string {
  const len = pts.length;
  if (len < 2) return '';
  const at = (i: number): Pt => (closed ? pts[((i % len) + len) % len]! : pts[clamp(i, 0, len - 1)]!);
  const first = pts[0]!;
  let d = `M${n(first[0])} ${n(first[1])}`;
  const segs = closed ? len : len - 1;
  const k = tension / 6;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = p1[2] ? [p1[0], p1[1]] : [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = p2[2] ? [p2[0], p2[1]] : [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${n(c1[0]!)} ${n(c1[1]!)} ${n(c2[0]!)} ${n(c2[1]!)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

/** Polígono reto. */
export function poly(pts: Pt[], closed = true): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${n(p[0])} ${n(p[1])}`).join('') + (closed ? 'Z' : '');
}

/** Espelha pontos no eixo vertical x = cx (e inverte a ordem, para continuar o contorno). */
export function mirror(pts: Pt[], cx: number): Pt[] {
  return pts.map((p): Pt => (p[2] ? [2 * cx - p[0], p[1], 1] : [2 * cx - p[0], p[1]])).reverse();
}

export function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${n(cx - rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)}Z`;
}

/** Nó do eixo de um membro: posição e raio (meia-largura). */
export interface Node {
  x: number;
  y: number;
  r: number;
}

/** Ponto e raio no eixo, com t de 0 a 1 pelo comprimento. */
export function along(axis: Node[], t: number): Node & { dx: number; dy: number } {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < axis.length; i++) {
    const a = axis[i - 1]!;
    const b = axis[i]!;
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    lens.push(l);
    total += l;
  }
  let goal = clamp(t, 0, 1) * total;
  for (let i = 0; i < lens.length; i++) {
    const l = lens[i]!;
    if (goal <= l || i === lens.length - 1) {
      const a = axis[i]!;
      const b = axis[i + 1]!;
      const u = l ? clamp(goal / l, 0, 1) : 0;
      return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), r: lerp(a.r, b.r, u), dx: (b.x - a.x) / (l || 1), dy: (b.y - a.y) / (l || 1) };
    }
    goal -= l;
  }
  const last = axis[axis.length - 1]!;
  return { ...last, dx: 0, dy: 1 };
}

/**
 * Contorno de um trecho de membro [t0, t1], com folga `grow` (roupa). `capStart`/`capEnd`: ponta arredondada.
 * Devolve as duas bordas (esquerda e direita da imagem, de cima para baixo) e o caminho fechado.
 */
export function limb(axis: Node[], t0: number, t1: number, grow = 0, opts: { capStart?: boolean; capEnd?: boolean; steps?: number } = {}) {
  const steps = opts.steps ?? 7;
  const a: Pt[] = [];
  const b: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const p = along(axis, lerp(t0, t1, i / steps));
    const r = p.r + grow;
    // normal à direção (dx, dy)
    const nx = -p.dy;
    const ny = p.dx;
    const side = nx < 0 ? 1 : -1; // mantém `a` sempre à esquerda da imagem
    a.push([p.x + nx * r * side, p.y + ny * r * side]);
    b.push([p.x - nx * r * side, p.y - ny * r * side]);
  }
  const s = along(axis, t0);
  const e = along(axis, t1);
  const pts: Pt[] = [];
  const startCap: Pt[] = opts.capStart ? [[s.x - s.dx * (s.r + grow) * 0.85, s.y - s.dy * (s.r + grow) * 0.85]] : [];
  const endCap: Pt[] = opts.capEnd ? [[e.x + e.dx * (e.r + grow) * 0.7, e.y + e.dy * (e.r + grow) * 0.7]] : [];
  const aa = a.map((p, i): Pt => (!opts.capStart && i === 0) || (!opts.capEnd && i === a.length - 1) ? [p[0], p[1], 1] : p);
  const bb = b.map((p, i): Pt => (!opts.capStart && i === 0) || (!opts.capEnd && i === b.length - 1) ? [p[0], p[1], 1] : p);
  pts.push(...startCap, ...aa, ...endCap, ...[...bb].reverse());
  return { left: a, right: b, d: smooth(pts) };
}
