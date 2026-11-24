/**
 * Calçados e acessórios do cartoon. Os calçados envolvem o pé descalço da pele com folga (o contorno do pé nunca vaza)
 * e ficam por baixo da barra da calça, exceto o coturno (calça por dentro). Acessórios: faixa e prajied (graduação),
 * algemas nos pulsos, boné, boné da farda, capacete tático e óculos.
 */
import type { OutfitPiece } from '../../../engine';
import type { Fig, Head } from './body';
import { along, clamp, ellipse, limb, n, offsetAt, poly, smooth } from './geom';
import type { Pt } from './geom';
import { headPt } from './head';
import { contrast, mix, ramp } from './palette';
import { strokeEl } from './svg';
import type { Doc } from './svg';

/** Calçado em volta do pé (de `top` até a sola), com folga `g`. */
function shoePath(f: Fig, side: -1 | 1, g: number, top: number, toe = 1): string {
  const leg = f.leg(side);
  const a = along(leg, 1);
  const t = clamp(f.tKnee + ((top - f.yKnee) / (f.yAnkle - f.yKnee)) * (1 - f.tKnee), 0, 1);
  const p = along(leg, t);
  const x = a.x + side * 1.8;
  const w = (7.2 + f.fat * 1.4 + f.muscle * 0.5 + f.baby * 1.5) * f.ws * toe + g;
  const pts: Pt[] = [[p.x - p.r - g, top, 1], [p.x + p.r + g, top, 1]];
  if (top < f.yAnkle - 6) pts.push([a.x + a.r + g, f.yAnkle - 3]);
  pts.push([x + w + side * 0.6, f.sole - 7.5], [x + w * 0.74 + side * 1.2, f.sole + 0.6, 1], [x - w * 0.74 + side * 1.2, f.sole + 0.6, 1], [x - w + side * 0.6, f.sole - 7.5]);
  if (top < f.yAnkle - 6) pts.push([a.x - a.r - g, f.yAnkle - 3]);
  return smooth(pts);
}

function solePath(f: Fig, side: -1 | 1, g: number, h: number): string {
  const a = along(f.leg(side), 1);
  const x = a.x + side * 1.8 + side * 1.2;
  const w = (7.2 + f.fat * 1.4 + f.muscle * 0.5 + f.baby * 1.5) * f.ws + g;
  return smooth([[x - w - 0.3, f.sole - h, 1], [x + w + 0.3, f.sole - h, 1], [x + w * 0.92, f.sole + 1.4, 1], [x - w * 0.92, f.sole + 1.4, 1]]);
}

/** Botas de cano alto (coturno) vão depois da calça (calça por dentro). */
export const BOOTS_OVER_PANTS = new Set(['coturno']);

export function drawShoes(doc: Doc, f: Fig, p: OutfitPiece | undefined): void {
  const id = p?.id ?? 'descalco';
  if (id === 'descalco' || !p) return; // o pé descalço (com dedos) já está na pele
  const r = ramp(p.color);
  const bs = f.bs;
  for (const side of [-1, 1] as const) {
    const a = along(f.leg(side), 1);
    const x = a.x + side * 3;
    if (id === 'chinelo') {
      doc.region(solePath(f, side, 1.6, 2.6), r, { flat: true, sw: 1.1 });
      doc.stroke(`M${n(x - side * 0.5)} ${n(f.sole - 3)}L${n(x - 6 * f.ws)} ${n(f.sole - 9 * bs)}M${n(x - side * 0.5)} ${n(f.sole - 3)}L${n(x + 6 * f.ws)} ${n(f.sole - 9 * bs)}`, r.line, 3.2);
      doc.stroke(`M${n(x - side * 0.5)} ${n(f.sole - 3)}L${n(x - 6 * f.ws)} ${n(f.sole - 9 * bs)}M${n(x - side * 0.5)} ${n(f.sole - 3)}L${n(x + 6 * f.ws)} ${n(f.sole - 9 * bs)}`, r.base, 1.8);
      continue;
    }
    if (id === 'meia') {
      const top = f.yAnkle - 12 * bs;
      doc.group([shoePath(f, side, 1.2, top)], r, { shift: [-2, -1.5], sw: 1.4 });
      doc.stroke(`M${n(a.x - a.r - 2)} ${n(top + 3)}h${n(2 * a.r + 4)}`, r.shade, 1.4, 0.9);
      continue;
    }
    const boot = id === 'bota' || id === 'coturno';
    const top = id === 'coturno' ? f.yAnkle - 27 * bs : id === 'bota' ? f.yAnkle - 14 * bs : f.yAnkle - (id === 'sapato' ? 1 : 4) * bs;
    const g = boot ? 2.2 : 1.9;
    const soleC = id === 'tenis' ? ramp('#f4f1ea') : ramp(mix(p.color, '#000000', 0.4));
    doc.group([shoePath(f, side, g, top)], r, { shift: [-2.5, -2], sw: 1.6 });
    doc.group([solePath(f, side, g + 0.3, id === 'coturno' ? 5.5 : id === 'tenis' ? 4.6 : 3.4)], soleC, { flat: true, sw: 1.2 });
    if (id === 'tenis') {
      const c = contrast(p.color);
      doc.stroke(`M${n(x - 2.6)} ${n(f.yAnkle + 1)}h5.2M${n(x - 3)} ${n(f.yAnkle + 4)}h6M${n(x - 3.3)} ${n(f.yAnkle + 7)}h6.6`, c, 1.2, 0.9);
      doc.stroke(`M${n(x - side * 7 * f.ws)} ${n(f.sole - 6)}Q${n(x)} ${n(f.sole - 10)} ${n(x + side * 6.5 * f.ws)} ${n(f.sole - 5.5)}`, r.line, 0.9, 0.5);
    }
    if (id === 'sapato') {
      doc.fill(ellipse(x - 2.5 + side, f.sole - 7.5, 2.8, 1.3), '#ffffff', 0.4);
      doc.stroke(`M${n(x - 2.5)} ${n(f.yAnkle + 1.5)}h5`, r.line, 1, 0.6);
    }
    if (id === 'bota') {
      doc.stroke(`M${n(a.x - a.r - g + 1)} ${n(top + 4)}h${n(2 * (a.r + g) - 2)}`, r.line, 1, 0.5);
      doc.fill(ellipse(x - 2 + side, f.sole - 8, 2.2, 1.1), '#ffffff', 0.25);
    }
    if (id === 'coturno') {
      let d = '';
      for (let y = top + 4; y < f.yAnkle + 4; y += 4.2 * bs) d += `M${n(a.x - 3)} ${n(y)}l6 2.2M${n(a.x + 3)} ${n(y)}l-6 2.2`;
      doc.stroke(d, mix(p.color, '#8a8f98', 0.6), 0.9, 0.85);
      doc.stroke(`M${n(a.x - a.r - g + 1)} ${n(top + 2)}h${n(2 * (a.r + g) - 2)}`, r.line, 1, 0.5);
    }
  }
}

/** Prajied: braçadeira nos dois braços (cor e ponta da graduação). */
export function drawPrajied(doc: Doc, f: Fig, p: OutfitPiece): void {
  const r = ramp(p.color);
  const tip = ramp(p.accent ?? p.color);
  for (const side of [-1, 1] as const) {
    const axis = f.arm(side);
    doc.group([limb(axis, 0.24, 0.31, 1.3, { steps: 3 }).d], r, { shift: [-1.5, -1], sw: 1.2 });
    const k = offsetAt(axis, 0.275, side * 1.05, 1.3);
    doc.group([poly([[k[0], k[1] - 1], [k[0] + side * 7 * f.ws, k[1] + 5 * f.bs], [k[0] + side * 4.5 * f.ws, k[1] + 7 * f.bs], [k[0] - side * 0.5, k[1] + 1.5]])], tip, { flat: true, sw: 1 });
    doc.fill(ellipse(k[0], k[1], 2.4, 2.2), r.base);
    doc.stroke(ellipse(k[0], k[1], 2.4, 2.2), r.line, 0.9);
  }
}

/** Algemas: argolas de metal nos pulsos com dois elos pendurados. */
export function drawCuffs(doc: Doc, f: Fig, side: -1 | 1): void {
  const metal = ramp('#9aa1ab');
  const axis = f.arm(side);
  doc.group([limb(axis, 0.935, 0.985, 1.8, { steps: 3 }).d], metal, { shift: [-1.5, -1], sw: 1.2 });
  doc.stroke(limb(axis, 0.95, 0.97, 1.8, { steps: 2 }).d, '#eef1f4', 0.8, 0.7);
  const k = offsetAt(axis, 0.97, -side * 1.1, 1.8);
  doc.stroke(`${ellipse(k[0] - side * 1.5, k[1] + 2.5, 1.6, 2.4)}${ellipse(k[0] - side * 2.5, k[1] + 6.5, 1.6, 2.4)}`, metal.line, 1.1);
}

/** Acessórios da cabeça (por cima do cabelo): óculos, boné, boné da farda e capacete tático. */
export function drawAccessoryHead(doc: Doc, f: Fig, p: OutfitPiece, eyeY: number, eyeDx: number, hairTop: number): void {
  const h = f.head;
  if (p.id === 'oculos') {
    const c = ramp(p.color);
    let d = '';
    const s = h.s;
    for (const side of [-1, 1] as const) {
      const x = h.cx + side * eyeDx;
      d += smooth([[x - 8.6 * s, eyeY - 5.4 * s], [x + 8.6 * s, eyeY - 5.6 * s], [x + 8 * s, eyeY + 5.4 * s], [x - 8 * s, eyeY + 5.4 * s]], true, 0.6);
    }
    doc.fill(d, '#dfeaf2', 0.22);
    doc.stroke(d, c.base, 1.9);
    doc.stroke(`M${n(h.cx - eyeDx + 8.5 * s)} ${n(eyeY - 2)}Q${h.cx} ${n(eyeY - 4.5)} ${n(h.cx + eyeDx - 8.5 * s)} ${n(eyeY - 2)}`, c.base, 1.6);
    for (const side of [-1, 1] as const) doc.stroke(`M${n(h.cx + side * (eyeDx + 8.4 * s))} ${n(eyeY - 3)}L${n(h.cx + side * (h.W - 0.5))} ${n(eyeY - 4)}`, c.base, 1.6);
    for (const side of [-1, 1] as const) doc.stroke(`M${n(h.cx + side * eyeDx - 5 * s)} ${n(eyeY - 2.5 * s)}l${n(2.6 * s)} ${n(-1.8 * s)}`, '#ffffff', 1.2, 0.7);
    return;
  }
  if (p.id === 'capacete') return helmet(doc, h, p, hairTop);
  if (p.id === 'bone' || p.id === 'bone_pm') cap(doc, h, p, hairTop);
}

function cap(doc: Doc, h: Head, p: OutfitPiece, hairTop: number): void {
  const r = ramp(p.color);
  const band = h.crown + h.Ht * 0.52;
  const top = Math.min(hairTop, h.crown) - 2.5 * h.s;
  const w = h.W + 3.5 * h.s;
  doc.group([smooth([[h.cx - w, band + 2, 1], [h.cx - w + 1, band - 10 * h.s], [h.cx - w * 0.55, top + 3], [h.cx, top], [h.cx + w * 0.55, top + 3], [h.cx + w - 1, band - 10 * h.s], [h.cx + w, band + 2, 1]])], r, {
    shift: [-4, -3],
    sw: 1.7,
    inner: strokeEl(`M${n(h.cx - w * 0.42)} ${n(band)}Q${n(h.cx - w * 0.35)} ${n(top + 8)} ${n(h.cx)} ${n(top + 0.5)}M${n(h.cx + w * 0.42)} ${n(band)}Q${n(h.cx + w * 0.35)} ${n(top + 8)} ${n(h.cx)} ${n(top + 0.5)}`, r.line, 0.9, 0.45),
  });
  const visor = ramp(mix(p.color, '#000000', 0.14));
  doc.group([smooth([[h.cx - w - 1, band + 1], [h.cx, band + 2.5], [h.cx + w + 1, band + 1], [h.cx + w * 0.78, band + 7 * h.s], [h.cx, band + 9.5 * h.s], [h.cx - w * 0.78, band + 7 * h.s]])], visor, { shift: [-2, -1.5], sw: 1.5 });
  doc.fill(ellipse(h.cx, top + 1.4, 2.2, 1.2), r.line);
  if (p.id === 'bone_pm') {
    // emblema genérico (escudo dourado) na frente
    const y = band - 9 * h.s;
    doc.region(poly([[h.cx - 4.5, y - 4.5], [h.cx + 4.5, y - 4.5], [h.cx + 4.5, y + 1], [h.cx, y + 5], [h.cx - 4.5, y + 1]]), ramp('#d9b24a'), { flat: true, sw: 0.9 });
    doc.fill(ellipse(h.cx, y - 0.5, 1.6, 1.6), '#8a6a1f');
  }
}

function helmet(doc: Doc, h: Head, p: OutfitPiece, hairTop: number): void {
  const r = ramp(p.color);
  const rim = h.crown + h.Ht * 0.62;
  const top = Math.min(hairTop, h.crown) - 4.5 * h.s;
  const w = h.W + 6 * h.s;
  const d = smooth([[h.cx - w, rim + 4, 1], [h.cx - w - 0.5, rim - 12 * h.s], [h.cx - w * 0.6, top + 4], [h.cx, top], [h.cx + w * 0.6, top + 4], [h.cx + w + 0.5, rim - 12 * h.s], [h.cx + w, rim + 4, 1], [h.cx, rim + 1.5]]);
  doc.group([d], r, { shift: [-4, -3], sw: 1.8, inner: strokeEl(`M${n(h.cx - w)} ${n(rim - 2)}Q${h.cx} ${n(rim - 6)} ${n(h.cx + w)} ${n(rim - 2)}`, r.light, 1.4, 0.5) });
  // trilhos laterais e suporte frontal
  for (const side of [-1, 1] as const) doc.region(smooth([[h.cx + side * (w - 4), rim - 12, 1], [h.cx + side * (w + 1.5), rim - 12, 1], [h.cx + side * (w + 1.5), rim - 2, 1], [h.cx + side * (w - 4), rim - 2, 1]]), ramp(mix(p.color, '#5b6470', 0.4)), { flat: true, sw: 1 });
  doc.region(smooth([[h.cx - 5, top + 6, 1], [h.cx + 5, top + 6, 1], [h.cx + 5, top + 12, 1], [h.cx - 5, top + 12, 1]]), ramp(mix(p.color, '#5b6470', 0.4)), { flat: true, sw: 1 });
  // jugular (tira do queixo)
  const a = headPt(h, Math.PI / 2 + 0.25, 0.5);
  const b = headPt(h, Math.PI - 0.35, 0.5);
  for (const side of [-1, 1] as const) doc.stroke(`M${n(h.cx + side * (a[0] - h.cx))} ${n(rim + 2)}L${n(h.cx + side * (b[0] - h.cx))} ${n(b[1])}`, mix(p.color, '#000000', 0.2), 1.6, 0.9);
}

