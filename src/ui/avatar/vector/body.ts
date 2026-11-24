/**
 * Proporções do corpo cartoon a partir do descriptor (sexo, crescimento, gordura, musculatura) e o desenho da pele:
 * pernas, tronco, pescoço, braços, mãos e pés. Moldura de 200 × 420, pés na linha 410, centro em x = 100.
 * Adulto: cabeça de ~75 numa figura de ~370 (1/5).
 */
import type { AvatarDescriptor } from '../../../engine';
import { along, clamp, ellipse, limb, lerp, mirror, smooth } from './geom';
import type { Node, Pt } from './geom';
import type { Ramp } from './palette';
import type { Doc } from './svg';

export const VIEW_W = 200;
export const VIEW_H = 420;
export const CX = 100;

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
}

export interface Fig {
  d: AvatarDescriptor;
  female: boolean;
  fat: number;
  muscle: number;
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
  neck: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  arm: (side: -1 | 1) => Node[];
  leg: (side: -1 | 1) => Node[];
  /** Comprimento da mão (para luvas/mangas). */
  hand: number;
}

export function figure(d: AvatarDescriptor): Fig {
  const g = clamp(d.growth, 0, 1);
  const female = d.sex === 'F';
  const fat = clamp(d.fat, 0, 1);
  const muscle = clamp(d.muscle, 0, 1);
  const hs = 0.8 + 0.2 * g; // cabeça
  const bs = 0.48 + 0.52 * g; // comprimentos do corpo
  const ws = 0.6 + 0.4 * g; // larguras do corpo
  const sole = 410;
  const yAnkle = sole - 17 * bs;
  const yKnee = yAnkle - 71 * bs;
  const yCrotch = yKnee - 70 * bs;
  const yHip = yCrotch - 16 * bs;
  const yWaist = yHip - 31 * bs;
  const yChest = yWaist - 33 * bs;
  const yArmpit = yChest - 14 * bs;
  const yShoulder = yArmpit - 24 * bs + d.elder * 3;
  const yNeck = yShoulder - 6 * bs;
  const chin = yNeck - 13 * bs;

  // rosto pelo formato (faceShape), sexo e gordura
  const shapes = {
    oval: { w: 0, hb: 0, ht: 0, nl: 2.0, taper: 0.14 },
    redondo: { w: 2, hb: -2, ht: 0, nl: 2.3, taper: 0.03 },
    quadrado: { w: 1, hb: 0, ht: 0, nl: 3.1, taper: 0.06 },
    coracao: { w: 1.5, hb: 0, ht: 0, nl: 1.8, taper: 0.27 },
    longo: { w: -2, hb: 4, ht: 1, nl: 2.1, taper: 0.13 },
  } as const;
  const fs = shapes[d.faceShape] ?? shapes.oval;
  const Hb = (40 + fs.hb) * hs;
  const Ht = (35 + fs.ht) * hs;
  const head: Head = {
    cx: CX,
    cy: chin - Hb,
    W: (29 + fs.w + (female ? -1.2 : 0.4) + fat * 3.2) * hs,
    Ht,
    Hb,
    nu: 2.15,
    nl: fs.nl + (female ? -0.1 : 0.45) + fat * 0.35,
    taper: clamp(fs.taper + (female ? 0.06 : 0) - fat * 0.08, 0, 0.4),
    crown: chin - Hb - Ht,
    chin,
    s: hs,
  };

  const M = !female;
  const neck = ((M ? 10.6 : 7.8) + muscle * (M ? 3.2 : 1.4) + fat * 2.6) * ws;
  const shoulder = ((M ? 43 : 36) + muscle * (M ? 9 : 5) + fat * 4) * ws;
  const chest = ((M ? 37 : 33) + muscle * (M ? 6 : 3) + fat * 9) * ws;
  const waist = ((M ? 30 : 25) + fat * (M ? 22 : 19) - muscle * 1) * ws;
  const hip = ((M ? 33 : 37) + fat * 13 + muscle * 1.5) * ws;

  const rS = ((M ? 8 : 7) + muscle * (M ? 4.6 : 2.8) + fat * 3.2) * ws;
  const rB = rS * (1 + muscle * 0.08);
  const rE = ((M ? 6.1 : 5.2) + muscle * 2 + fat * 2.6) * ws;
  const rF = rE * (1.02 + muscle * 0.08);
  const rW = ((M ? 4.7 : 4.0) + muscle * 0.9 + fat * 1.4) * ws;
  const arm = (side: -1 | 1): Node[] => {
    const xs = shoulder - rS * 0.82;
    const xe = Math.max(xs + 1.5, waist + 3 + rE + 1);
    const xw = Math.max(xe + 0.5, hip + 3.5 + rW + 1);
    const ys = yShoulder + 8 * bs;
    const ye = yWaist + 1 * bs;
    const yw = yCrotch - 5 * bs;
    return [
      { x: CX + side * xs, y: ys, r: rS },
      { x: CX + side * lerp(xs, xe, 0.45), y: lerp(ys, ye, 0.45), r: rB },
      { x: CX + side * xe, y: ye, r: rE },
      { x: CX + side * lerp(xe, xw, 0.35), y: lerp(ye, yw, 0.35), r: rF },
      { x: CX + side * xw, y: yw, r: rW },
    ];
  };
  const rT = hip / 2 - 0.4;
  const leg = (side: -1 | 1): Node[] => {
    const x0 = hip / 2 + 1.4;
    return [
      { x: CX + side * x0, y: yHip - 2, r: rT },
      { x: CX + side * (x0 + 0.2), y: lerp(yHip, yKnee, 0.45), r: rT * 0.88 },
      { x: CX + side * (x0 + 1.2), y: yKnee, r: rT * 0.6 },
      { x: CX + side * (x0 + 1.4), y: lerp(yKnee, yAnkle, 0.33), r: rT * (0.68 + muscle * 0.05) },
      { x: CX + side * (x0 + 1.6), y: yAnkle, r: (4.6 + fat * 1.4) * ws },
    ];
  };
  return { d, female, fat, muscle, head, sole, yAnkle, yKnee, yCrotch, yHip, yWaist, yChest, yArmpit, yShoulder, yNeck, neck, shoulder, chest, waist, hip, arm, leg, hand: 18.5 * ws };
}

/** Contorno do tronco (lado direito da imagem, de cima para baixo), com folga `e`. */
export function torsoSide(f: Fig, e = 0): Pt[] {
  const belly = Math.max(f.waist, f.hip * 0.96) + e;
  const pts: Pt[] = [
    [CX + f.neck + 1 + e * 0.6, f.yNeck - 1],
    [CX + f.shoulder - 9, f.yShoulder + 1 - e * 0.3],
    [CX + f.shoulder + e, f.yShoulder + 10],
    [CX + f.chest + 1.5 + e, f.yArmpit + 2],
    [CX + f.chest + e + (f.female ? 1.5 : 0), f.yChest],
    [CX + f.waist + e, f.yWaist],
  ];
  if (f.fat > 0.5) pts.push([CX + belly + f.fat * 2.5, lerp(f.yWaist, f.yHip, 0.55)]);
  pts.push([CX + f.hip + e, f.yHip]);
  return pts;
}

/** Pele do tronco e pescoço. */
export function drawTorso(doc: Doc, f: Fig, skin: Ramp): void {
  const right = torsoSide(f);
  const bottom = f.yCrotch;
  const d = smooth([...right, [CX + f.hip, bottom, 1], [CX - f.hip, bottom, 1], ...mirror(right, CX)]);
  doc.region(d, skin, { shift: [-5, -2] });
}

export function drawNeck(doc: Doc, f: Fig, skin: Ramp): void {
  const h = f.head;
  const top = h.chin - 16 * h.s;
  const nw = f.neck;
  const d = smooth([
    [CX - nw, top, 1],
    [CX + nw, top, 1],
    [CX + nw, f.yNeck - 4],
    [CX + nw + 5, f.yNeck + 3],
    [CX + nw + 7, f.yNeck + 8, 1],
    [CX - nw - 7, f.yNeck + 8, 1],
    [CX - nw - 5, f.yNeck + 3],
    [CX - nw, f.yNeck - 4],
  ]);
  // sombra do queixo sobre o pescoço
  const sh = smooth([
    [CX - nw - 8, top - 4, 1],
    [CX + nw + 8, top - 4, 1],
    [CX + nw + 8, h.chin + 2],
    [CX + nw * 0.4, h.chin + 7.5],
    [CX - nw * 0.4, h.chin + 7],
    [CX - nw - 8, h.chin + 1],
  ]);
  doc.region(d, skin, { shadeD: sh, sw: 1.7 });
}

/** Perna inteira (pele). */
export function drawLegs(doc: Doc, f: Fig, skin: Ramp): void {
  for (const side of [-1, 1] as const) {
    const l = limb(f.leg(side), 0, 1, 0, { capEnd: false, steps: 9 });
    doc.region(l.d, skin, { shift: [-3.5, -1] });
  }
}

/** Braço (pele) até o punho. */
export function armPath(f: Fig, side: -1 | 1, t0 = 0, t1 = 1, grow = 0, capStart = true): string {
  return limb(f.arm(side), t0, t1, grow, { capStart, capEnd: false, steps: 8 }).d;
}

export function drawArms(doc: Doc, f: Fig, skin: Ramp): void {
  for (const side of [-1, 1] as const) doc.region(armPath(f, side), skin, { shift: [-3, -1] });
}

/** Mão relaxada ao lado do corpo, com o polegar para a frente. */
export function handPath(f: Fig, side: -1 | 1): { d: string; thumb: string; fingers: string } {
  const w = along(f.arm(side), 1);
  const s = f.hand / 18.5;
  const hw = (5.6 + f.fat * 1.4 + f.muscle * 0.8) * s * (f.female ? 0.93 : 1);
  const x = w.x + side * 0.6;
  const y = w.y - 2;
  const L = f.hand;
  const d = smooth([
    [x - hw, y],
    [x - hw - 1, y + L * 0.45],
    [x - hw * 0.65, y + L * 0.86],
    [x, y + L],
    [x + hw * 0.65, y + L * 0.86],
    [x + hw + 1, y + L * 0.45],
    [x + hw, y],
  ]);
  const ix = x - side * hw; // lado de dentro (polegar)
  const thumb = `M${ix + side * 1.5} ${y + L * 0.28}Q${ix + side * 4.5} ${y + L * 0.5} ${ix + side * 3} ${y + L * 0.7}`;
  const fingers = `M${x - side * 1} ${y + L * 0.62}L${x - side * 0.6} ${y + L * 0.92}M${x + side * 2.2} ${y + L * 0.6}L${x + side * 2.6} ${y + L * 0.86}`;
  return { d, thumb, fingers };
}

export function drawHands(doc: Doc, f: Fig, skin: Ramp): void {
  for (const side of [-1, 1] as const) {
    const h = handPath(f, side);
    doc.region(h.d, skin, { shift: [-2.5, -1.5], sw: 1.7 });
    doc.stroke(h.thumb, skin.line, 1.2, 0.7);
    doc.stroke(h.fingers, skin.line, 0.9, 0.45);
  }
}

/** Pé descalço (de frente). */
export function footPath(f: Fig, side: -1 | 1, grow = 0): string {
  const a = along(f.leg(side), 1);
  const x = a.x + side * 2.5;
  const top = f.yAnkle - 3;
  const w = (7.5 + f.fat * 1.5) * (f.hand / 18.5) + grow;
  return smooth([
    [x - w * 0.6, top],
    [x + w * 0.6, top],
    [x + w + side * 1, f.sole - 6],
    [x + w * 0.8 + side * 1.5, f.sole],
    [x - w * 0.8 + side * 1.5, f.sole],
    [x - w + side * 1, f.sole - 6],
  ]);
}

export function drawGroundShadow(doc: Doc, f: Fig): void {
  doc.fill(ellipse(CX, f.sole + 1, f.hip + 18, 6), '#1c1714', 0.13);
}
