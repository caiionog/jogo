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
export function limb(axis: Node[], t0: number, t1: number, grow = 0, opts: { capStart?: boolean; capEnd?: boolean; steps?: number; grid?: number } = {}) {
  const steps = opts.steps ?? 7;
  const a: Pt[] = [];
  const b: Pt[] = [];
  // `grid`: amostras nos múltiplos de 1/grid (dois trechos do mesmo membro coincidem ponto a ponto)
  const ts: number[] = [];
  if (opts.grid) {
    ts.push(t0);
    for (let k = Math.floor(t0 * opts.grid) + 1; k / opts.grid < t1 - 1e-6; k++) if (k / opts.grid - t0 > 0.25 / opts.grid) ts.push(k / opts.grid);
    ts.push(t1);
  } else for (let i = 0; i <= steps; i++) ts.push(lerp(t0, t1, i / steps));
  for (const t of ts) {
    const p = along(axis, t);
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
  // pontas arredondadas (meio círculo aproximado por 3 pontos)
  const cap = (p: typeof s, sign: number, k: number): Pt[] => {
    const r = (p.r + grow) * k;
    const nx = -p.dy;
    const ny = p.dx;
    const side = nx < 0 ? 1 : -1;
    const c = 0.72;
    return [
      [p.x + sign * p.dx * r * c + nx * r * c * side * sign, p.y + sign * p.dy * r * c + ny * r * c * side * sign],
      [p.x + sign * p.dx * r, p.y + sign * p.dy * r],
      [p.x + sign * p.dx * r * c - nx * r * c * side * sign, p.y + sign * p.dy * r * c - ny * r * c * side * sign],
    ];
  };
  const startCap: Pt[] = opts.capStart ? cap(s, -1, 0.92) : [];
  const endCap: Pt[] = opts.capEnd ? cap(e, 1, 0.8) : [];
  const aa = a.map((p, i): Pt => (!opts.capStart && i === 0) || (!opts.capEnd && i === a.length - 1) ? [p[0], p[1], 1] : p);
  const bb = b.map((p, i): Pt => (!opts.capStart && i === 0) || (!opts.capEnd && i === b.length - 1) ? [p[0], p[1], 1] : p);
  pts.push(...startCap, ...aa, ...endCap, ...[...bb].reverse());
  return { left: a, right: b, d: smooth(pts) };
}

/** Comprimento acumulado (0–1) de cada nó do eixo. */
export function axisT(axis: Node[]): number[] {
  const acc = [0];
  let total = 0;
  for (let i = 1; i < axis.length; i++) {
    total += Math.hypot(axis[i]!.x - axis[i - 1]!.x, axis[i]!.y - axis[i - 1]!.y);
    acc.push(total);
  }
  return acc.map((v) => (total ? v / total : 0));
}

/** Eixo com folga: `ease` constante + `flare` crescendo até a ponta (mangas largas). */
export function growAxis(axis: Node[], ease: number, flare = 0, flareFrom = 0.3): Node[] {
  const ts = axisT(axis);
  return axis.map((p, i) => ({ ...p, r: p.r + ease + flare * clamp((ts[i]! - flareFrom) / (1 - flareFrom), 0, 1) }));
}

/**
 * Ponto deslocado da linha do eixo em t: `u` em raios, positivo para a direita da imagem (para um membro que desce).
 */
export function offsetAt(axis: Node[], t: number, u: number, grow = 0): [number, number] {
  const p = along(axis, t);
  const r = (p.r + grow) * u;
  return [p.x + p.dy * r, p.y - p.dx * r];
}

/** x de uma polilinha (ordenada por y) na altura y; `undefined` fora do intervalo. */
export function xAtY(pts: Pt[], y: number): number | undefined {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    if ((y >= a[1] && y <= b[1]) || (y <= a[1] && y >= b[1])) {
      const u = b[1] === a[1] ? 0 : (y - a[1]) / (b[1] - a[1]);
      return lerp(a[0], b[0], u);
    }
  }
  return undefined;
}

/** Quadrilátero além da linha perpendicular ao eixo em t (recorte do contorno do antebraço da frente). */
export function beyond(axis: Node[], t: number, reach = 70): string {
  const p = along(axis, t);
  const nx = p.dy;
  const ny = -p.dx;
  const a: Pt = [p.x + nx * reach, p.y + ny * reach];
  const b: Pt = [p.x - nx * reach, p.y - ny * reach];
  const far = 260;
  return poly([a, b, [b[0] + p.dx * far, b[1] + p.dy * far], [a[0] + p.dx * far, a[1] + p.dy * far]]);
}

/** Caminho aberto e suave por uma polilinha. */
export function openSmooth(pts: Pt[]): string {
  return smooth(pts, false);
}
