/**
 * Proporções do corpo cartoon a partir do descriptor (sexo, crescimento, gordura, musculatura, idade) e o desenho da
 * pele. Moldura de 200 × 420, pés na linha 410, centro em x = 100. Adulto: cabeça de ~75 numa figura de ~370.
 *
 * A pele é UMA peça só (tronco + pescoço + braços + pernas + pés, ver `Doc.group`): o contorno só aparece na silhueta
 * externa; as emendas que importam (borda de dentro do braço sobre o tronco, joelho, músculos) são dobras desenhadas
 * de propósito. Antebraços e mãos são redesenhados por cima das roupas do tronco (`drawFrontArm`), com o contorno
 * recortado logo abaixo do cotovelo, para a mão ficar sempre na frente da saia, do quadril e da barra do casaco.
 *
 * Fases contínuas: `growth` (bebê → adulto) e `elder` (postura, ombros, pele). Tipos físicos contínuos por `fat` e
 * `muscle`: ombros, trapézio, deltoide, bíceps, cintura em V, coxas e panturrilhas mudam de forma aos poucos.
 */
import type { AvatarDescriptor } from '../../../engine';
import { along, axisT, beyond, clamp, ellipse, lerp, limb, mirror, n, offsetAt, smooth, xAtY } from './geom';
import type { Node, Pt } from './geom';
import type { Ramp } from './palette';
import { clipped, fillEl, strokeEl } from './svg';
import type { Doc } from './svg';

export const VIEW_W = 200;
export const VIEW_H = 420;
export const CX = 100;
/** Deslocamento da luz na pele (o mesmo no corpo e nos antebraços da frente, para não ter emenda). */
export const SKIN_SHIFT: [number, number] = [-3.4, -1.6];
/** Espessura visível do contorno do corpo e das roupas. */
export const SW = 1.7;
/** Amostras do eixo do braço (o antebraço da frente usa as mesmas, para coincidir com o de trás). */
export const ARM_STEPS = 16;

export interface Head {
  cx: number;
  cy: number;
  /** Meia-largura do crânio. */
  W: number;
  /** Altura do centro ao topo e do centro ao queixo. */
  Ht: number;
  Hb: number;
  /** Expoentes da superelipse (topo e mandíbula) e afinamento para o queixo. */
  nu: number;
  nl: number;
  taper: number;
  crown: number;
  chin: number;
  /** Escala do rosto. */
  s: number;
  /** 0–1: rosto de bebê (olhos mais baixos e maiores). */
  baby: number;
}

export interface Fig {
  d: AvatarDescriptor;
  female: boolean;
  fat: number;
  muscle: number;
  elder: number;
  /** 1 no recém-nascido, 0 a partir dos ~3 anos. */
  baby: number;
  /** Dimorfismo sexual (0 na infância, 1 no adulto). */
  sexK: number;
  bs: number;
  ws: number;
  head: Head;
  sole: number;
  yAnkle: number;
  yKnee: number;
  yCrotch: number;
  yHip: number;
  yWaist: number;
  yChest: number;
  yArmpit: number;
  yShoulder: number;
  yNeck: number;
  neckTop: number;
  neck: number;
  trap: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  /** Barriga (meia-largura extra entre cintura e quadril; 0 sem barriga). */
  belly: number;
  bust: number;
  rDelt: number;
  arm: (side: -1 | 1) => Node[];
  leg: (side: -1 | 1) => Node[];
  /** t do cotovelo no eixo do braço e t do recorte do antebraço da frente. */
  tElbow: number;
  tFront: number;
  tKnee: number;
  /** Comprimento da mão. */
  hand: number;
  /** Borda de dentro do braço direito (para recortar as roupas sem manga). */
  armInnerR: Pt[];
}

export function figure(d: AvatarDescriptor): Fig {
  const g = clamp(d.growth, 0, 1);
  const female = d.sex === 'F';
  const baby = clamp(1 - g / 0.3, 0, 1);
  const sexK = clamp((g - 0.62) / 0.32, 0, 1);
  const sx = (m: number, w: number) => lerp((m + w) / 2, female ? w : m, sexK);
  const fat = clamp(d.fat, 0, 1);
  const muscle = clamp(d.muscle, 0, 1);
  const elder = clamp(d.elder, 0, 1);
  const hs = 0.8 + 0.2 * g + baby * 0.1; // cabeça
  const bs = (0.48 + 0.52 * g) * (1 - 0.14 * baby); // comprimentos do corpo
  const ws = 0.6 + 0.4 * g + baby * 0.04; // larguras do corpo
  const lb = bs * (1 - 0.3 * baby); // pernas do bebê mais curtas
  const sole = 410;
  const yAnkle = sole - 17 * lb;
  const yKnee = yAnkle - 71 * lb;
  const yCrotch = yKnee - 70 * lb;
  const yHip = yCrotch - 16 * bs;
  const yWaist = yHip - 31 * bs;
  const yChest = yWaist - 33 * bs;
  const yArmpit = yChest - 14 * bs;
  // idoso: ombros caídos e cabeça um pouco mais baixa (leve curvatura)
  const yShoulder = yArmpit - 24 * bs + elder * 6;
  const yNeck = yShoulder - 6 * bs;
  const chin = yNeck - 13 * bs * (1 - 0.45 * baby) + elder * 3.5;

  // rosto pelo formato (faceShape), sexo, gordura e idade
  const shapes = {
    oval: { w: 0, hb: 0, ht: 0, nl: 2.0, taper: 0.14 },
    redondo: { w: 2, hb: -2, ht: 0, nl: 2.3, taper: 0.03 },
    quadrado: { w: 1, hb: 0, ht: 0, nl: 3.1, taper: 0.06 },
    coracao: { w: 1.5, hb: 0, ht: 0, nl: 1.8, taper: 0.27 },
    longo: { w: -2, hb: 4, ht: 1, nl: 2.1, taper: 0.13 },
  } as const;
  const fs = shapes[d.faceShape] ?? shapes.oval;
  const kidFace = clamp(1 - g / 0.7, 0, 1);
  const Hb = (40 + fs.hb * (1 - kidFace * 0.6) - baby * 5 - kidFace * 2) * hs;
  const Ht = (35 + fs.ht + baby * 2) * hs;
  const head: Head = {
    cx: CX,
    cy: chin - Hb,
    W: (29 + fs.w + (female ? -1.2 : 0.4) * sexK + fat * 3.4 + baby * 2.5 + kidFace * 0.8) * hs,
    Ht,
    Hb,
    nu: 2.15,
    nl: lerp(fs.nl, 2.1, kidFace * 0.5) + ((female ? -0.1 : 0.45) * sexK) + fat * 0.4 + baby * 0.3,
    taper: clamp(fs.taper * (1 - kidFace * 0.4) + (female ? 0.06 : 0) - fat * 0.09 - baby * 0.06, 0, 0.4),
    crown: chin - Hb - Ht,
    chin,
    s: hs,
    baby,
  };

  // magreza: pouca gordura e pouco músculo afinam tudo (contínuo)
  const thin = clamp((0.32 - fat) / 0.3, 0, 1) * clamp(1 - muscle * 1.6, 0, 1) * (1 - baby);
  const neck = (sx(10.6, 7.9) - thin * 1.2 + muscle * sx(3.8, 1.2) + fat * 2.8 + baby * 1.5) * ws;
  const trap = (1.2 + muscle * sx(4.6, 1.4) + elder * 4) * bs;
  const shoulder0 = (sx(43.5, 36) - thin * 3.5 + muscle * sx(13, 8) + fat * 4 - elder * 2 + baby * 1) * ws;
  const chest = (sx(34, 30.5) - thin * 3 + muscle * sx(8, 3) + fat * 9 + baby * 2) * ws;
  const waist = (sx(30, 25.5) - thin * 2.5 + fat * sx(22, 18) - muscle * sx(3.5, 2.8) + baby * 6 + elder * 1.5) * ws;
  const hip = (sx(33, 37) - thin * 2.5 + fat * 12 + muscle * 1.5 + baby * 3) * ws;
  const belly = fat > 0.42 ? (fat - 0.42) * 14 * ws + baby * 2 : baby * 2;
  const bust = female ? sexK * (1.3 + fat * 1.2) : 0;

  // braços: deltoide, bíceps, cotovelo, antebraço, pulso
  const rD = (sx(9.4, 7.6) - thin * 1.6 + muscle * sx(7.5, 4.4) + fat * 3 + baby * 2.6) * ws;
  const rB = (sx(7.4, 6.1) - thin * 1.5 + muscle * sx(5.6, 3.4) + fat * 3.8 + baby * 2.8) * ws;
  const rE = (sx(5.5, 4.7) - thin * 0.6 + muscle * 1.4 + fat * 2.5 + baby * 3) * ws;
  const rF = (sx(6.3, 5.1) - thin * 1 + muscle * sx(3.2, 1.9) + fat * 2.4 + baby * 3.2) * ws;
  const rW = (sx(4.5, 3.8) + muscle * 0.9 + fat * 1.4 + baby * 1.8) * ws;
  // o braço pende ao lado do tronco: a borda de dentro encosta no peito na altura da axila
  const shoulder = Math.max(shoulder0, chest - 1.5 * ws + rD * 1.64);
  const xs = shoulder - rD * 0.74;
  const ys = yShoulder + rD * 0.95;
  const ye = yWaist + 1 * bs;
  const yw = yCrotch - (5 + baby * 8) * bs;
  const xe = Math.max(xs - 3, waist + belly * 0.5 + 4.5 * ws + rE);
  const xw = Math.max(xe + 0.5, hip + belly * 0.4 + 4.5 * ws + rW);
  const arm = (side: -1 | 1): Node[] => [
    { x: CX + side * xs, y: ys, r: rD },
    { x: CX + side * (xs + 0.8), y: lerp(ys, ye, 0.2), r: rD * 0.95 },
    { x: CX + side * lerp(xs, xe, 0.38), y: lerp(ys, ye, 0.38), r: lerp(rD, rB, 0.6) - muscle * 0.8 * ws },
    { x: CX + side * lerp(xs, xe, 0.62), y: lerp(ys, ye, 0.62), r: rB },
    { x: CX + side * xe, y: ye, r: rE },
    { x: CX + side * lerp(xe, xw, 0.26), y: lerp(ye, yw, 0.26), r: rF },
    { x: CX + side * xw, y: yw, r: rW },
  ];
  const tElbow = axisT(arm(1))[4]!;
  // pernas: coxa (quadríceps), joelho, panturrilha, tornozelo
  const x0 = hip * 0.5 + 1.2;
  const rT = hip * 0.5 + 0.2;
  const rK = (sx(8.8, 8.2) - thin * 1 + fat * 3 + muscle * 1.4 + baby * 4) * ws;
  const rC = (sx(9.8, 9.1) - thin * 1.6 + muscle * sx(4, 3.3) + fat * 3 + baby * 4.5) * ws;
  const rA = (sx(4.8, 4.3) + fat * 1.4 + muscle * 0.5 + baby * 1.5) * ws;
  const L = (t: number) => lerp(yHip, yKnee, t);
  const leg = (side: -1 | 1): Node[] => [
    { x: CX + side * x0, y: yHip - 6, r: rT },
    { x: CX + side * (x0 + 0.2), y: L(0.2), r: rT * 0.99 + muscle * 2 * ws },
    { x: CX + side * (x0 + 0.5), y: L(0.5), r: lerp(rT, rK, 0.4) + muscle * 3 * ws },
    { x: CX + side * (x0 + 0.9), y: L(0.82), r: lerp(rT, rK, 0.8) + muscle * 0.5 * ws },
    { x: CX + side * (x0 + 1.1), y: yKnee, r: rK },
    { x: CX + side * (x0 + 1.3), y: lerp(yKnee, yAnkle, 0.28), r: rC },
    { x: CX + side * (x0 + 1.5), y: lerp(yKnee, yAnkle, 0.64), r: lerp(rC, rA, 0.55) },
    { x: CX + side * (x0 + 1.6), y: yAnkle, r: rA },
  ];
  const tKnee = axisT(leg(1))[4]!;
  const armInnerR = limb(arm(1), 0, 1, 0, { steps: 12 }).left;
  return {
    d, female, fat, muscle, elder, baby, sexK, bs, ws, head, sole, yAnkle, yKnee, yCrotch, yHip, yWaist, yChest, yArmpit, yShoulder, yNeck,
    neckTop: head.cy + head.Hb * 0.45, neck, trap, shoulder, chest, waist, hip, belly, bust, rDelt: rD, arm, leg,
    tElbow, tFront: Math.floor((tElbow - 0.03) * ARM_STEPS) / ARM_STEPS, tKnee, hand: (19 + baby * 3) * ws, armInnerR,
  };
}

/** Contorno do tronco (lado direito da imagem, da base do pescoço ao quadril), com folga `e`. */
export function torsoSide(f: Fig, e = 0): Pt[] {
  const pts: Pt[] = [
    [CX + f.neck + 3.4 + e * 0.5, f.yNeck + 0.6 - e * 0.55],
    [CX + lerp(f.neck, f.shoulder, 0.5) + e * 0.2, f.yShoulder - f.trap + 2.6 - e],
    [CX + f.shoulder - f.rDelt * 0.5 + e * 0.6, f.yShoulder + 2.6 - e * 0.7],
    [CX + f.chest + 1.6 + e, f.yArmpit + 2],
    [CX + f.chest + e + f.bust, f.yChest],
    [CX + f.waist + e, f.yWaist],
  ];
  if (f.belly > 0.4) pts.push([CX + Math.max(f.waist, f.hip * 0.97) + f.belly + e, lerp(f.yWaist, f.yHip, 0.55)]);
  pts.push([CX + f.hip + e, f.yHip]);
  return pts;
}

/** x do lado direito do tronco (com folga) na altura y. */
export function sideX(f: Fig, y: number, e = 0): number {
  const pts = torsoSide(f, e);
  if (y >= f.yHip) return CX + f.hip + e;
  return xAtY(pts, y) ?? CX + f.hip + e;
}

/** x da borda de dentro do braço direito na altura y (Infinity onde não há braço). */
export function armInnerX(f: Fig, y: number): number {
  const p = f.armInnerR;
  if (y < p[0]![1] + 4 || y > p[p.length - 1]![1]) return Infinity;
  return xAtY(p, y) ?? Infinity;
}

/** Pele do tronco com o pescoço (a parte de cima fica escondida pela cabeça). */
export function torsoPath(f: Fig): string {
  const right: Pt[] = [
    [CX + f.neck, f.neckTop, 1],
    [CX + f.neck, f.yNeck - 4],
    ...torsoSide(f),
    [CX + f.hip - 0.6, f.yCrotch - 4],
    [CX + 1.5, f.yCrotch + 1, 1],
  ];
  return smooth([...right, ...mirror(right, CX)]);
}

export function armPath(f: Fig, side: -1 | 1, t0 = 0, t1 = 1, grow = 0): string {
  return limb(f.arm(side), t0, t1, grow, { capStart: t0 === 0, capEnd: false, grid: ARM_STEPS }).d;
}

export function legPath(f: Fig, side: -1 | 1): string {
  return limb(f.leg(side), 0, 1, 0, { capEnd: false, steps: 12 }).d;
}

/** Mão relaxada ao lado do corpo: palma em "luva" com o polegar para a frente (lado de dentro). */
export function handPaths(f: Fig, side: -1 | 1): { palm: string; thumb: string; folds: string } {
  const w = along(f.arm(side), 1);
  const s = f.ws;
  const hw = w.r * 1.16 + 0.8 * s;
  const L = f.hand;
  const x = w.x + side * 0.6;
  const y = w.y - 3;
  const P = (u: number, v: number): Pt => [x + side * u * hw, y + v * L];
  const palm = smooth([P(-0.92, 0), P(-1.04, 0.4), P(-0.78, 0.86), P(-0.18, 1.0), P(0.42, 0.96), P(0.92, 0.72), P(1.06, 0.36), P(0.95, 0)]);
  const thumb = smooth([P(-0.7, 0.16), P(-1.32, 0.38), P(-1.22, 0.62), P(-0.9, 0.7), P(-0.5, 0.55)]);
  const a = P(-0.55, 0.64);
  const b = P(-0.42, 0.32);
  const f1 = P(0.02, 0.7);
  const f2 = P(0.06, 0.93);
  const f3 = P(0.48, 0.64);
  const f4 = P(0.5, 0.86);
  const folds = `M${n(a[0])} ${n(a[1])}Q${n(b[0] + side * 1)} ${n(b[1] + 3)} ${n(b[0])} ${n(b[1])}M${n(f1[0])} ${n(f1[1])}L${n(f2[0])} ${n(f2[1])}M${n(f3[0])} ${n(f3[1])}L${n(f4[0])} ${n(f4[1])}`;
  return { palm, thumb, folds };
}

/** Pé de frente (descalço); `grow` alarga para calçados. */
export function footPath(f: Fig, side: -1 | 1, grow = 0, top?: number): string {
  const a = along(f.leg(side), 1);
  const x = a.x + side * 1.8;
  const y0 = top ?? f.yAnkle - 5;
  const w = (7.2 + f.fat * 1.4 + f.muscle * 0.5 + f.baby * 1.5) * f.ws + grow;
  return smooth([
    [a.x - a.r - grow * 0.6, y0],
    [a.x + a.r + grow * 0.6, y0],
    [x + w + side * 0.6, f.sole - 7.5],
    [x + w * 0.72 + side * 1.2, f.sole + grow * 0.3, 1],
    [x - w * 0.72 + side * 1.2, f.sole + grow * 0.3, 1],
    [x - w + side * 0.6, f.sole - 7.5],
  ]);
}

/** Dedos do pé descalço. */
export function toes(f: Fig, side: -1 | 1): string {
  const a = along(f.leg(side), 1);
  const x = a.x + side * 1.8 + side * 1.2;
  const w = (7.2 + f.fat * 1.4 + f.baby * 1.5) * f.ws;
  let d = '';
  for (const u of [-0.42, -0.08, 0.26]) d += `M${n(x + u * w * side)} ${n(f.sole - 0.4)}v-2.6`;
  return d;
}

/** Dobras e músculos da pele (dentro da união do corpo; a roupa cobre o que não aparece). */
function skinInner(doc: Doc, f: Fig, skin: Ramp, torsoClip: string): string {
  const h = f.head;
  const sh = skin.shade;
  let s = '';
  // sombra do queixo no pescoço (a forma da mandíbula, deslocada para baixo)
  const jaw: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const th = lerp(Math.PI / 2 + 0.25, (Math.PI * 3) / 2 - 0.25, i / 10);
    jaw.push([h.cx + Math.sin(th) * h.W * 0.9 * (1 - h.taper * Math.max(0, -Math.cos(th))), h.cy - Math.cos(th) * h.Hb + 5.5 * h.s]);
  }
  s += fillEl(smooth([[h.cx - h.W, h.cy], [h.cx + h.W, h.cy], ...jaw]), sh);
  // clavículas (só aparecem com decote aberto)
  if (f.baby < 0.5) {
    for (const side of [-1, 1] as const) {
      const a = CX + side * (f.neck + 1.5);
      const b = CX + side * (f.neck + 15 * f.ws);
      s += strokeEl(`M${n(a)} ${n(f.yNeck + 6)}Q${n((a + b) / 2)} ${n(f.yNeck + 8)} ${n(b)} ${n(f.yNeck + 4.2)}`, sh, 1.3, 0.9);
    }
    if (f.elder > 0.25) s += strokeEl(`M${n(CX - f.neck * 0.5)} ${n(f.yNeck - 8)}l1.5 5M${n(CX + f.neck * 0.5)} ${n(f.yNeck - 8)}l-1.5 5`, skin.line, 0.9, 0.35 * f.elder + 0.1);
  }
  // braços: borda de dentro sobre o tronco (dobra), deltoide e bíceps
  const ml = clamp(0.25 + f.muscle * 0.75, 0, 1);
  for (const side of [-1, 1] as const) {
    const axis = f.arm(side);
    const inner = limb(axis, 0.17, 0.6, 0, { steps: 6 });
    const edge = side < 0 ? inner.right : inner.left;
    s += clipped(torsoClip, strokeEl(smooth(edge, false), skin.line, SW * 1.1));
    if (f.baby < 0.6) {
      const o1 = offsetAt(axis, 0.34, side * 0.98);
      const c1 = offsetAt(axis, 0.24, side * 0.1);
      const m1 = offsetAt(axis, 0.31, side * 0.6);
      s += strokeEl(`M${n(o1[0])} ${n(o1[1])}Q${n(m1[0])} ${n(m1[1])} ${n(c1[0])} ${n(c1[1])}`, sh, 1.5 * f.ws, 0.35 + ml * 0.55);
      if (f.muscle > 0.25) {
        const b0 = offsetAt(axis, 0.36, -side * 0.55);
        const b1 = offsetAt(axis, 0.5, -side * 0.62);
        const b2 = offsetAt(axis, 0.58, -side * 0.35);
        s += strokeEl(`M${n(b0[0])} ${n(b0[1])}Q${n(b1[0])} ${n(b1[1])} ${n(b2[0])} ${n(b2[1])}`, sh, 1.3 * f.ws, ml * 0.8);
      }
    }
  }
  // pernas: joelho, quadríceps e panturrilha
  for (const side of [-1, 1] as const) {
    const axis = f.leg(side);
    const k = along(axis, f.tKnee + 0.015);
    const kw = k.r * 0.5;
    s += strokeEl(`M${n(k.x - kw)} ${n(k.y + 1)}q${n(kw)} ${n(2.4 * f.bs)} ${n(kw * 2)} 0`, sh, 1.3, 0.9);
    if (f.baby < 0.6) {
      const q0 = offsetAt(axis, 0.3, -side * 0.5);
      const q1 = offsetAt(axis, f.tKnee - 0.06, -side * 0.55);
      const q2 = offsetAt(axis, f.tKnee - 0.02, -side * 0.15);
      s += strokeEl(`M${n(q0[0])} ${n(q0[1])}Q${n(q1[0])} ${n(q1[1])} ${n(q2[0])} ${n(q2[1])}`, sh, 1.3 * f.ws, 0.3 + ml * 0.5);
      const c0 = offsetAt(axis, f.tKnee + 0.08, side * 0.55);
      const c1 = offsetAt(axis, f.tKnee + 0.2, side * 0.72);
      const c2 = offsetAt(axis, f.tKnee + 0.3, side * 0.42);
      s += strokeEl(`M${n(c0[0])} ${n(c0[1])}Q${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])}`, sh, 1.3 * f.ws, 0.3 + ml * 0.5);
    }
    s += strokeEl(toes(f, side), skin.line, 0.9, 0.5);
  }
  void doc;
  return s;
}

/** Pele do corpo inteiro numa peça só. */
export function drawSkin(doc: Doc, f: Fig, skin: Ramp): void {
  const torso = torsoPath(f);
  const torsoClip = doc.clip(torso);
  const parts = [torso];
  for (const side of [-1, 1] as const) parts.push(armPath(f, side), legPath(f, side), footPath(f, side));
  doc.group(parts, skin, { shift: SKIN_SHIFT, inner: skinInner(doc, f, skin, torsoClip), sw: SW });
}

/** Camada de manga a redesenhar na frente (antebraço), de dentro para fora. */
export interface FrontSleeve {
  path: (side: -1 | 1, t0: number) => string;
  /** t onde a manga termina (punho). */
  t1: number;
  ramp: Ramp;
  shift: [number, number];
  inner?: string;
  /** Detalhes por cima (punho, botão). */
  details?: (doc: Doc, side: -1 | 1) => void;
  /** Corpo da mesma peça (entra só na luz, para a sombra coincidir com a da peça inteira). */
  under?: string[];
}

/** Antebraço e mão por cima das roupas do tronco (contorno recortado abaixo do cotovelo: sem emenda). */
export function drawFrontArm(doc: Doc, f: Fig, side: -1 | 1, skin: Ramp, sleeves: FrontSleeve[]): void {
  const axis = f.arm(side);
  const t0 = f.tFront;
  const armLen = Math.hypot(axis[axis.length - 1]!.x - axis[0]!.x, axis[axis.length - 1]!.y - axis[0]!.y);
  const clip = beyond(axis, t0 + (SW * 1.6) / armLen);
  const hand = handPaths(f, side);
  const fo0 = offsetAt(axis, t0 + 0.04, side * 0.85);
  const fo1 = offsetAt(axis, 0.8, side * 0.3);
  const fore = f.muscle > 0.3 && f.baby < 0.5 ? strokeEl(`M${n(fo0[0])} ${n(fo0[1])}Q${n(offsetAt(axis, 0.72, side * 0.8)[0])} ${n(offsetAt(axis, 0.72, side * 0.8)[1])} ${n(fo1[0])} ${n(fo1[1])}`, skin.shade, 1.3 * f.ws, 0.3 + f.muscle * 0.5) : '';
  // sob uma manga que desce além do recorte, a pele começa um pouco abaixo (sem borda de pele sob a borda da manga)
  const covered = sleeves.some((sl) => sl.t1 > t0 + 0.08);
  doc.group([armPath(f, side, covered ? t0 + 0.05 : t0, 1), hand.palm, hand.thumb], skin, { shift: SKIN_SHIFT, outlineClip: clip, sw: SW, inner: fore, lightWith: [torsoPath(f)] });
  doc.stroke(hand.folds, skin.line, 1, 0.55);
  for (const sl of sleeves) {
    if (sl.t1 <= t0 + 0.02) continue;
    doc.group([sl.path(side, t0)], sl.ramp, { shift: sl.shift, outlineClip: clip, sw: SW, ...(sl.inner ? { inner: sl.inner } : {}), ...(sl.under ? { lightWith: sl.under } : {}) });
    sl.details?.(doc, side);
  }
}

export function drawGroundShadow(doc: Doc, f: Fig): void {
  doc.fill(ellipse(CX, f.sole + 1, f.hip + 18, 6), '#1c1714', 0.13);
}
