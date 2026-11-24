/**
 * Cabeça cartoon: contorno por superelipse (crânio arredondado + mandíbula pelo `faceShape`), orelhas e rosto
 * (olhos pelo formato e cor, sobrancelhas, nariz pela largura, boca pelo volume dos lábios e pela expressão,
 * bochechas, sardas, pintas, rugas e marcas da luta). Luz de cima à esquerda.
 */
import type { AvatarDescriptor } from '../../../engine';
import type { Head } from './body';
import { clamp, ellipse, lerp, n, smooth } from './geom';
import type { Pt } from './geom';
import { darken, luminance, mix, ramp } from './palette';
import type { Ramp } from './palette';
import type { Doc } from './svg';

/** Ponto do contorno da cabeça no ângulo θ (0 = topo, π/2 = direita, π = queixo), com folga `e`. */
export function headPt(h: Head, th: number, e = 0, eTop = e): [number, number] {
  const s = Math.sin(th);
  const c = -Math.cos(th);
  const sg = (v: number) => (v < 0 ? -1 : 1);
  if (c <= 0) {
    const k = 2 / h.nu;
    return [h.cx + (h.W + e) * sg(s) * Math.pow(Math.abs(s), k), h.cy - (h.Ht + eTop) * Math.pow(Math.abs(c), k)];
  }
  const k = 2 / h.nl;
  return [h.cx + (h.W + e) * sg(s) * Math.pow(Math.abs(s), k) * (1 - h.taper * c), h.cy + (h.Hb + e) * Math.pow(c, k)];
}

/** Meia-largura da cabeça numa altura y (busca no contorno). */
export function headHalfAt(h: Head, y: number): number {
  let best = h.W;
  let bd = Infinity;
  for (let i = 0; i <= 60; i++) {
    const p = headPt(h, (Math.PI * i) / 60);
    const dd = Math.abs(p[1] - y);
    if (dd < bd) {
      bd = dd;
      best = p[0] - h.cx;
    }
  }
  return best;
}

export function headPath(h: Head, e = 0): string {
  const pts: Pt[] = [];
  for (let i = 0; i < 40; i++) pts.push(headPt(h, (Math.PI * 2 * i) / 40, e));
  return smooth(pts);
}

export interface Face {
  eyeY: number;
  eyeDx: number;
  browY: number;
  noseY: number;
  mouthY: number;
  earY: number;
  s: number;
}

export function faceOf(h: Head): Face {
  const s = h.s;
  return { eyeY: h.cy + 5 * s, eyeDx: (12.6 + (h.W - 29) * 0.35) * s, browY: h.cy - 5.4 * s, noseY: h.cy + 17.5 * s, mouthY: h.cy + 26.5 * s, earY: h.cy + 8 * s, s };
}

export function drawEars(doc: Doc, h: Head, fc: Face, skin: Ramp, cauliflower: boolean): void {
  for (const side of [-1, 1] as const) {
    const x = h.cx + side * (headHalfAt(h, fc.earY) - 1.2);
    const y = fc.earY;
    const rx = 5.6 * fc.s;
    const ry = 8.6 * fc.s;
    const d = cauliflower
      ? smooth([[x, y - ry], [x + side * rx * 1.15, y - ry * 0.6], [x + side * rx * 1.3, y - ry * 0.05], [x + side * rx * 1.1, y + ry * 0.55], [x + side * rx * 0.5, y + ry * 0.95], [x - side * 2, y + ry * 0.6], [x - side * 2, y - ry * 0.6]])
      : smooth([[x, y - ry], [x + side * rx * 0.95, y - ry * 0.78], [x + side * rx, y + ry * 0.05], [x + side * rx * 0.55, y + ry * 0.8], [x, y + ry], [x - side * 2, y + ry * 0.4], [x - side * 2, y - ry * 0.5]]);
    doc.region(d, skin, { shift: [side * -1.5, -1.5], sw: 1.7 });
    doc.stroke(`M${n(x + side * 1)} ${n(y - ry * 0.55)}Q${n(x + side * rx * 0.75)} ${n(y - ry * 0.2)} ${n(x + side * 1.6)} ${n(y + ry * 0.45)}`, skin.line, 1.1, 0.55);
  }
}

export function drawHead(doc: Doc, h: Head, skin: Ramp): void {
  // sombra suave do lado direito e embaixo do queixo
  const sh = smooth([
    [h.cx + h.W * 0.62, h.crown - 4],
    [h.cx + h.W + 4, h.crown - 4, 1],
    [h.cx + h.W + 4, h.chin + 6, 1],
    [h.cx - h.W, h.chin + 6, 1],
    [h.cx - h.W, h.chin + 0.6],
    [h.cx, h.chin - 2.4 * h.s],
    [h.cx + h.W * 0.6, h.cy + h.Hb * 0.55],
    [h.cx + h.W * 0.86, h.cy + 2],
    [h.cx + h.W * 0.8, h.cy - h.Ht * 0.6],
  ]);
  doc.region(headPath(h), skin, { shadeD: sh, sw: 2 });
}

type Exp = AvatarDescriptor['expression'];

/** Sobrancelhas: grossas no homem, finas e arqueadas na mulher; a expressão inclina. */
function brows(doc: Doc, d: AvatarDescriptor, fc: Face, h: Head, color: string): void {
  const female = d.sex === 'F';
  const t = (female ? 2.1 : 3.3) * fc.s;
  const ex = d.expression;
  for (const side of [-1, 1] as const) {
    const xi = h.cx + side * 5 * fc.s;
    const xo = h.cx + side * (fc.eyeDx + 7.5 * fc.s);
    let yi = fc.browY + 1;
    let yo = fc.browY + 1.2;
    if (ex === 'bravo') yi += 3.2;
    if (ex === 'triste') yi -= 2.6;
    if (ex === 'feliz') {
      yi -= 0.8;
      yo -= 0.8;
    }
    if (ex === 'cansado') yo += 1;
    const xm = lerp(xi, xo, 0.55);
    const ym = Math.min(yi, yo) - (female ? 2.6 : 1.8) * fc.s;
    const d1 = smooth([[xi, yi - t * 0.5], [xm, ym - t * 0.5], [xo, yo - t * 0.15], [xo - side * 0.6, yo + t * 0.25], [xm, ym + t * 0.5], [xi, yi + t * 0.55]], true, 0.9);
    doc.fill(d1, color);
  }
}

function eyeShape(shape: AvatarDescriptor['eyes']['shape'], s: number) {
  switch (shape) {
    case 'redondo':
      return { ex: 6.1 * s, up: 6.3 * s, lo: 5.4 * s, flat: false };
    case 'alongado':
      return { ex: 7.2 * s, up: 4.8 * s, lo: 3.8 * s, flat: false };
    case 'palpebra_lisa':
      return { ex: 6.6 * s, up: 4.3 * s, lo: 3.9 * s, flat: true };
    default:
      return { ex: 6.5 * s, up: 5.6 * s, lo: 4.4 * s, flat: false };
  }
}

function eyes(doc: Doc, d: AvatarDescriptor, fc: Face, h: Head, skin: Ramp, blink: boolean): void {
  const female = d.sex === 'F';
  const g = eyeShape(d.eyes.shape, fc.s);
  const ex: Exp = d.expression;
  const lash = mix(skin.line, '#1a1012', 0.6);
  const iris = ramp(d.eyes.color, 'cloth');
  for (const side of [-1, 1] as const) {
    const x = h.cx + side * fc.eyeDx;
    const y = fc.eyeY;
    const o = side; // lado de fora
    const hurt = ex === 'machucado' && side === -1;
    if (d.marks.blackEye && side === -1) doc.fill(ellipse(x + 0.5, y + 1, g.ex + 3.4, g.up + 3), '#6b3a6e', 0.42);
    if (blink) {
      doc.stroke(`M${n(x - g.ex)} ${n(y)}Q${n(x)} ${n(y + g.lo * 0.9)} ${n(x + g.ex)} ${n(y)}`, lash, 2.1);
      if (female) doc.stroke(`M${n(x + o * g.ex)} ${n(y)}l${n(o * 2.4)} ${n(-1.6)}`, lash, 1.3);
      continue;
    }
    // olho: cantos e curvas de cima e de baixo
    const xo = x + o * g.ex;
    const xi = x - o * g.ex;
    const topY = y - g.up;
    const upper = g.flat
      ? `M${n(xi)} ${n(y + 0.4)}C${n(lerp(xi, x, 0.4))} ${n(topY + 0.6)} ${n(lerp(x, xo, 0.5))} ${n(topY + 0.2)} ${n(xo)} ${n(y - 0.8)}`
      : `M${n(xi)} ${n(y + 0.3)}C${n(lerp(xi, x, 0.35))} ${n(topY - 1)} ${n(lerp(x, xo, 0.45))} ${n(topY - 1)} ${n(xo)} ${n(y - 0.4)}`;
    const lower = `C${n(lerp(x, xo, 0.5))} ${n(y + g.lo + 0.4)} ${n(lerp(xi, x, 0.5))} ${n(y + g.lo + 0.6)} ${n(xi)} ${n(y + 0.3)}`;
    const eyeD = `${upper}${lower}Z`;
    const id = doc.clip(eyeD);
    const ir = (g.flat ? 4.1 : 4.5) * fc.s;
    const ix = x - side * 0.3;
    const iy = y + 0.4;
    let inner = `<path d="${eyeD}" fill="#fbf8f2"/>`;
    inner += `<circle cx="${n(ix)}" cy="${n(iy)}" r="${n(ir)}" fill="${iris.base}"/>`;
    inner += `<path d="M${n(ix - ir)} ${n(iy)}A${n(ir)} ${n(ir)} 0 0 1 ${n(ix + ir)} ${n(iy)}Z" fill="${iris.shade}"/>`;
    inner += `<circle cx="${n(ix)}" cy="${n(iy)}" r="${n(ir * 0.48)}" fill="#1b1214"/>`;
    inner += `<circle cx="${n(ix - 1.5 * fc.s)}" cy="${n(iy - 1.7 * fc.s)}" r="${n(1.35 * fc.s)}" fill="#ffffff"/>`;
    inner += `<circle cx="${n(ix + 1.4 * fc.s)}" cy="${n(iy + 1.3 * fc.s)}" r="${n(0.6 * fc.s)}" fill="#ffffff" opacity="0.8"/>`;
    // pálpebras pela expressão
    const lidTop = (k: number, tilt: number) => {
      const yy = topY - 3 + (g.up + 3) * k;
      return `<path d="M${n(x - g.ex - 2)} ${n(topY - 6)}H${n(x + g.ex + 2)}V${n(yy + tilt * side)}L${n(x - g.ex - 2)} ${n(yy - tilt * side)}Z" fill="${skin.base}"/>`;
    };
    if (ex === 'feliz') inner += `<path d="${ellipse(x, y + g.lo + 3.6 * fc.s, g.ex + 2, 4.2 * fc.s)}" fill="${skin.base}"/>`;
    if (ex === 'cansado' || hurt) inner += lidTop(hurt ? 0.62 : 0.45, 0);
    if (ex === 'bravo') inner += lidTop(0.3, 1.6);
    if (ex === 'triste') inner += lidTop(0.22, -1.2);
    doc.raw(`<g clip-path="url(#${id})">${inner}</g>`);
    // traços: pálpebra de cima grossa, de baixo suave, dobra
    doc.stroke(upper, lash, (female ? 2.3 : 2.0) * fc.s);
    if (ex === 'feliz') doc.stroke(`M${n(x - g.ex + 0.6)} ${n(y + g.lo * 0.3)}Q${n(x)} ${n(y - 0.6)} ${n(x + g.ex - 0.6)} ${n(y + g.lo * 0.3)}`, skin.line, 1, 0.55);
    else doc.stroke(`M${n(xo)} ${n(y - 0.2)}${lower}`, skin.line, 0.9, 0.35);
    if (!g.flat) doc.stroke(`M${n(xi + o * 1.2)} ${n(topY - 1.6)}Q${n(x)} ${n(topY - 3.8)} ${n(xo - o * 0.5)} ${n(topY - 1.2)}`, skin.line, 0.9, 0.32);
    if (female) {
      doc.stroke(`M${n(xo - o * 0.4)} ${n(y - 0.8)}l${n(o * 2.6)} ${n(-1.9)}`, lash, 1.25);
      doc.stroke(`M${n(xo - o * 2.2)} ${n(topY + 0.6)}l${n(o * 1.8)} ${n(-2.2)}`, lash, 1.1);
    }
  }
}

function nose(doc: Doc, d: AvatarDescriptor, fc: Face, h: Head, skin: Ramp): void {
  const w = (3.6 + d.noseWidth * 3.4) * fc.s * (d.sex === 'F' ? 0.92 : 1);
  const y = fc.noseY;
  const x = h.cx + (d.marks.brokenNose ? 0.8 : 0);
  // sombra do lado direito do nariz (luz da esquerda)
  doc.fill(smooth([[x + 1.2, fc.eyeY + 2], [x + 2.6, y - 6], [x + w + 0.6, y - 1.5], [x + w - 0.5, y + 1.2], [x + 1, y - 3.5]], true, 0.8), skin.shade, 0.85);
  doc.stroke(`M${n(x - w)} ${n(y - 2.4)}C${n(x - w - 1.8)} ${n(y + 0.8)} ${n(x - 2.4)} ${n(y + 2.2)} ${n(x)} ${n(y + 1.2)}C${n(x + 2.4)} ${n(y + 2.2)} ${n(x + w + 1.8)} ${n(y + 0.8)} ${n(x + w)} ${n(y - 2.4)}`, skin.line, 1.45, 0.78);
  if (d.marks.brokenNose) doc.stroke(`M${n(x - 1)} ${n(fc.eyeY + 3)}l2.2 4l-1.6 4`, skin.line, 1.1, 0.6);
}

function mouth(doc: Doc, d: AvatarDescriptor, fc: Face, h: Head, skin: Ramp): void {
  const female = d.sex === 'F';
  const lv = clamp(d.lipVolume, 0, 1);
  const w = (8.2 + lv * 1.6 - (female ? 0.4 : 0)) * fc.s;
  const x = h.cx;
  const y = fc.mouthY;
  const lip = female ? darken(mix(skin.base, '#c4545e', 0.42), 0.94) : mix(skin.base, skin.shade, 0.55);
  const lipR = ramp(lip, 'skin');
  const tu = (1.3 + lv * 1.9) * fc.s * (female ? 1.1 : 0.85);
  const tl = (2.0 + lv * 2.6) * fc.s * (female ? 1.1 : 0.85);
  const ex = d.expression;
  if (ex === 'feliz') {
    // sorriso aberto: dentes em cima, língua embaixo
    const top = y - 1.2;
    const dd = `M${n(x - w - 1)} ${n(top - 1.2)}Q${n(x)} ${n(top + 1.4)} ${n(x + w + 1)} ${n(top - 1.2)}Q${n(x + w * 0.55)} ${n(y + 8.4 * fc.s)} ${n(x)} ${n(y + 8.6 * fc.s)}Q${n(x - w * 0.55)} ${n(y + 8.4 * fc.s)} ${n(x - w - 1)} ${n(top - 1.2)}Z`;
    const id = doc.clip(dd);
    doc.raw(`<path d="${dd}" fill="#5b2a31"/><g clip-path="url(#${id})"><rect x="${n(x - w - 2)}" y="${n(top - 3)}" width="${n(2 * w + 4)}" height="${n(5.4 * fc.s)}" fill="#fbf8f2"/><path d="${ellipse(x + 1, y + 8.6 * fc.s, w * 0.6, 3.4 * fc.s)}" fill="#d9707a"/></g>`);
    doc.stroke(dd, skin.line, 1.5, 0.95);
    if (female) doc.stroke(`M${n(x - w * 0.5)} ${n(y + 9.8 * fc.s)}Q${n(x)} ${n(y + 11 * fc.s)} ${n(x + w * 0.5)} ${n(y + 9.8 * fc.s)}`, lipR.shade, 1.4, 0.7);
    return;
  }
  // boca fechada: curva da expressão
  const k = ex === 'triste' ? 2.2 : ex === 'bravo' ? 1.2 : ex === 'cansado' || ex === 'machucado' ? 0.5 : -1.4; // cantos (+ = para baixo)
  const mid = ex === 'triste' ? -0.6 : ex === 'bravo' ? 0 : ex === 'neutro' ? 1.4 : 0.6;
  const mw = ex === 'bravo' || ex === 'cansado' ? w * 0.82 : w;
  const L: [number, number] = [x - mw, y + k];
  const R: [number, number] = [x + mw, y + k];
  const line = ex === 'machucado'
    ? `M${n(L[0])} ${n(L[1])}Q${n(x - mw * 0.4)} ${n(y - 1)} ${n(x)} ${n(y + 0.6)}Q${n(x + mw * 0.4)} ${n(y + 1.8)} ${n(R[0])} ${n(R[1] - 0.6)}`
    : `M${n(L[0])} ${n(L[1])}Q${n(x)} ${n(y + mid + (k < 0 ? 1.6 : 0))} ${n(R[0])} ${n(R[1])}`;
  // lábios: de cima (arco de cupido) e de baixo, por volume
  const upper = `M${n(L[0])} ${n(L[1])}C${n(x - mw * 0.6)} ${n(y - tu * 0.9)} ${n(x - 2)} ${n(y - tu * 1.25)} ${n(x)} ${n(y - tu * 0.75)}C${n(x + 2)} ${n(y - tu * 1.25)} ${n(x + mw * 0.6)} ${n(y - tu * 0.9)} ${n(R[0])} ${n(R[1])}Q${n(x)} ${n(y + mid + (k < 0 ? 1.6 : 0))} ${n(L[0])} ${n(L[1])}Z`;
  const lower = `M${n(L[0])} ${n(L[1])}Q${n(x)} ${n(y + mid + (k < 0 ? 1.6 : 0))} ${n(R[0])} ${n(R[1])}C${n(x + mw * 0.6)} ${n(y + tl + 1.6 + k * 0.2)} ${n(x - mw * 0.6)} ${n(y + tl + 1.6 + k * 0.2)} ${n(L[0])} ${n(L[1])}Z`;
  doc.fill(upper, lipR.shade, female ? 1 : 0.55);
  doc.fill(lower, lipR.base, female ? 1 : 0.5);
  if (female) doc.stroke(`M${n(x - mw * 0.3)} ${n(y + tl * 0.55)}Q${n(x)} ${n(y + tl * 0.75)} ${n(x + mw * 0.3)} ${n(y + tl * 0.55)}`, '#ffffff', 1, 0.35);
  doc.stroke(line, skin.line, 1.6, 0.92);
  if (ex === 'neutro' || ex === 'cansado') {
    doc.stroke(`M${n(L[0] - 0.8)} ${n(L[1] - 0.8)}q0.8 1 0.2 1.9`, skin.line, 0.9, 0.4);
    doc.stroke(`M${n(R[0] + 0.8)} ${n(R[1] - 0.8)}q-0.8 1 -0.2 1.9`, skin.line, 0.9, 0.4);
  }
}

const FRECKLES: [number, number][] = [
  [-15, -1], [-11, 1.5], [-18, 2.5], [-13, 4.5], [-8, 3], [-16.5, 6], [-10, 6.5],
  [15, -1], [11, 1.5], [18, 2.5], [13, 4.5], [8, 3], [16.5, 6], [10, 6.5], [-4, 0], [4, 0.5],
];

function skinDetails(doc: Doc, d: AvatarDescriptor, fc: Face, h: Head, skin: Ramp): void {
  const female = d.sex === 'F';
  const blush = mix(skin.base, '#e2686d', 0.5);
  const bo = (female ? 0.34 : 0.16) + (d.expression === 'feliz' ? 0.1 : 0);
  for (const side of [-1, 1] as const) doc.fill(ellipse(h.cx + side * (fc.eyeDx + 4.5 * fc.s), fc.noseY + 1, 5.6 * fc.s, 3.2 * fc.s), blush, bo);
  const nf = Math.round(clamp(d.freckles, 0, 1) * FRECKLES.length);
  const fcol = darken(skin.base, 0.72, 0.1, 6);
  for (let i = 0; i < nf; i++) {
    const p = FRECKLES[i]!;
    doc.fill(ellipse(h.cx + p[0] * fc.s, fc.noseY - 6 + p[1] * fc.s, 0.85, 0.75), fcol, 0.7);
  }
  const MOLES: [number, number][] = [[14, fc.mouthY + 2], [-19, fc.eyeY + 9], [7, fc.mouthY + 8]];
  const nm = Math.round(clamp(d.moles, 0, 1) * MOLES.length);
  for (let i = 0; i < nm; i++) {
    const p = MOLES[i]!;
    doc.fill(ellipse(h.cx + p[0] * fc.s, p[1], 1.05, 1.05), darken(skin.base, 0.5, 0.1, 8), 0.85);
  }
  const wr = clamp(d.wrinkles, 0, 1);
  if (wr > 0.18) {
    const o = clamp((wr - 0.18) * 1.4, 0, 0.6);
    for (const side of [-1, 1] as const) {
      const xo = h.cx + side * (fc.eyeDx + 8 * fc.s);
      doc.stroke(`M${n(xo)} ${n(fc.eyeY - 1)}l${n(side * 2.6)} -1.2M${n(xo)} ${n(fc.eyeY + 1.4)}l${n(side * 2.8)} 0.6`, skin.line, 0.8, o);
      doc.stroke(`M${n(h.cx + side * 6.5 * fc.s)} ${n(fc.noseY - 1)}Q${n(h.cx + side * 11 * fc.s)} ${n(fc.noseY + 5)} ${n(h.cx + side * 10.4 * fc.s)} ${n(fc.mouthY + 3)}`, skin.line, 0.9, o * 0.7);
    }
    if (wr > 0.42) doc.stroke(`M${n(h.cx - 9)} ${n(fc.browY - 7)}q9 -2 18 0M${n(h.cx - 6)} ${n(fc.browY - 3.6)}q6 -1.4 12 0`, skin.line, 0.8, o * 0.8);
  }
  if (d.marks.scar) doc.stroke(`M${n(h.cx + fc.eyeDx + 1)} ${n(fc.browY - 4)}l-2.4 7.5`, mix(skin.base, '#f2c4c0', 0.6), 1.5, 0.95);
}

export function drawFace(doc: Doc, d: AvatarDescriptor, h: Head, skin: Ramp, hairColor: string, blink: boolean): void {
  const fc = faceOf(h);
  skinDetails(doc, d, fc, h, skin);
  const browC = mix(darken(hairColor, 0.8, 0.05, 4), skin.line, luminance(hairColor) > 0.25 ? 0.45 : 0.15);
  brows(doc, d, fc, h, browC);
  eyes(doc, d, fc, h, skin, blink);
  nose(doc, d, fc, h, skin);
  mouth(doc, d, fc, h, skin);
}


/** Barba e bigode no tom do cabelo. */
export function drawBeard(doc: Doc, d: AvatarDescriptor, h: Head, hair: Ramp): void {
  const kind = d.facialHair;
  if (kind === 'nenhuma') return;
  const fc = faceOf(h);
  const s = fc.s;
  const y0 = fc.earY + (d.facialHair === 'barba' ? 1 : -2) * s;
  const outer: Pt[] = [];
  // lado esquerdo (costeleta) → queixo → lado direito
  const thTop = Math.PI / 2 + 0.12;
  for (let i = 0; i <= 14; i++) {
    const th = lerp(Math.PI * 2 - thTop, thTop, i / 14);
    const c = Math.abs(Math.cos(th));
    const p = headPt(h, th, (kind === 'barba' ? 1.2 + c * 3.5 : 0.4 + c * 1.2) * s);
    outer.push(p);
  }
  // borda de dentro: bochecha → canto da boca → embaixo do lábio
  const xi = (side: number, k: number) => h.cx + side * k * s;
  const innerR: Pt[] = [
    [headPt(h, thTop, -4.5 * s)[0], y0 + 1],
    [xi(1, 16), fc.noseY + 4],
    [xi(1, 11.5), fc.mouthY - 1],
    [xi(1, 6), fc.mouthY + 4.5 * s],
    [h.cx, fc.mouthY + 5.5 * s],
  ];
  const innerL = innerR.slice(0, -1).map((p): Pt => [2 * h.cx - p[0], p[1]]).reverse();
  const full = smooth([...outer, ...innerR, ...innerL]);
  const must = smooth([
    [h.cx - 11.5 * s, fc.mouthY + 0.5],
    [h.cx - 8 * s, fc.noseY + 2.8],
    [h.cx, fc.noseY + 2.4],
    [h.cx + 8 * s, fc.noseY + 2.8],
    [h.cx + 11.5 * s, fc.mouthY + 0.5],
    [h.cx + 6 * s, fc.mouthY - 2.2],
    [h.cx, fc.mouthY - 2.8],
    [h.cx - 6 * s, fc.mouthY - 2.2],
  ]);
  if (kind === 'por_fazer') {
    doc.fill(full, hair.base, 0.13);
    doc.fill(must, hair.base, 0.13);
    return;
  }
  if (kind === 'rala') {
    doc.fill(full, hair.base, 0.42);
    doc.fill(must, hair.base, 0.48);
    return;
  }
  if (kind === 'barba') {
    doc.region(full, hair, { shift: [-3, -3], sw: 1.5 });
    doc.region(must, hair, { shift: [-1.5, -1.5], sw: 1.3 });
    // textura: pequenos tufos
    doc.stroke(`M${n(h.cx - 7)} ${n(h.chin - 1)}l1 2.4M${n(h.cx + 4)} ${n(h.chin)}l-0.8 2.4M${n(h.cx - 16 * s)} ${n(fc.mouthY + 2)}l1.2 2.2M${n(h.cx + 15 * s)} ${n(fc.mouthY + 2)}l-1.2 2.2`, hair.line, 0.9, 0.5);
    return;
  }
  doc.region(must, hair, { shift: [-1.5, -1.5], sw: 1.3 });
  if (kind === 'cavanhaque') {
    const goat = smooth([
      [h.cx - 8 * s, fc.mouthY + 4],
      [h.cx, fc.mouthY + 3.4],
      [h.cx + 8 * s, fc.mouthY + 4],
      [h.cx + 6.5 * s, h.chin - 1],
      [h.cx, h.chin + 2.2],
      [h.cx - 6.5 * s, h.chin - 1],
    ]);
    doc.region(goat, hair, { shift: [-1.5, -1.5], sw: 1.3 });
  }
}
