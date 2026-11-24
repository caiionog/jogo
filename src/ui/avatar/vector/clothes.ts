/**
 * Roupas do cartoon, desenhadas a partir da mesma geometria do corpo (servem em todo tipo físico). Cada camada tem
 * peças com desenho próprio e um genérico na cor da peça. REGRA: o avatar é sempre renderizado vestido — sem parte de
 * cima nem inteira, entra uma camiseta; sem parte de baixo nem inteira, uma bermuda.
 */
import type { OutfitPiece } from '../../../engine';
import { CX, armPath, footPath, torsoSide } from './body';
import type { Fig } from './body';
import { along, ellipse, lerp, limb, mirror, n, poly, smooth } from './geom';
import type { Pt } from './geom';
import { contrast, mix, ramp } from './palette';
import type { Ramp } from './palette';
import type { Doc } from './svg';

type Sleeve = 'none' | 'short' | 'long' | 'puff';
type Neck = 'crew' | 'v' | 'scoop' | 'collar' | 'hood' | 'wrap';
interface TopStyle {
  sleeve: Sleeve;
  neck: Neck;
  buttons?: number;
  pocket?: 'chest' | 'kangaroo';
  emblem?: boolean;
  /** Folga (larga ou justa). */
  ease?: number;
  /** Barra mais alta (cropped). */
  short?: boolean;
}

const TOPS: Record<string, TopStyle> = {
  camiseta: { sleeve: 'short', neck: 'crew' },
  camiseta_listrada: { sleeve: 'short', neck: 'crew' },
  camiseta_estampa: { sleeve: 'short', neck: 'crew' },
  regata: { sleeve: 'none', neck: 'scoop' },
  regata_treino: { sleeve: 'none', neck: 'scoop', ease: 1.2 },
  polo: { sleeve: 'short', neck: 'collar', buttons: 2 },
  social: { sleeve: 'long', neck: 'collar', buttons: 5 },
  arara_social: { sleeve: 'long', neck: 'collar', buttons: 5 },
  xadrez: { sleeve: 'long', neck: 'collar', buttons: 5, pocket: 'chest' },
  blusa: { sleeve: 'puff', neck: 'scoop' },
  moletom: { sleeve: 'long', neck: 'hood', pocket: 'kangaroo', ease: 3.4 },
  cronos_moletom: { sleeve: 'long', neck: 'hood', pocket: 'kangaroo', ease: 3.4 },
  cropped: { sleeve: 'short', neck: 'crew', short: true, ease: 1.2 },
  rashguard: { sleeve: 'long', neck: 'crew', ease: 0.8 },
  uniforme: { sleeve: 'short', neck: 'crew', emblem: true },
  camisa_formatura: { sleeve: 'short', neck: 'crew', emblem: true },
  camiseta_uv: { sleeve: 'long', neck: 'crew' },
  farda_pm: { sleeve: 'short', neck: 'collar', buttons: 4, pocket: 'chest' },
  camisa_civil: { sleeve: 'short', neck: 'collar', buttons: 4 },
  farda_tatica: { sleeve: 'long', neck: 'crew', pocket: 'chest' },
  kimono_top: { sleeve: 'long', neck: 'wrap', ease: 3.2 },
};
const GENERIC_TOP: TopStyle = { sleeve: 'short', neck: 'crew' };

/** Estampas e listras (coordenadas da moldura: listras continuam do tronco para as mangas). */
function patternInner(p: OutfitPiece, r: Ramp, f: Fig, area: 'top' | 'bottom'): string {
  const c = contrast(p.color);
  if (p.pattern === 'listrado') {
    let s = '';
    for (let y = f.yNeck - 4; y < f.sole; y += 11) s += `<rect x="0" y="${n(y)}" width="200" height="4.2" fill="${c}" opacity="0.9"/>`;
    return s;
  }
  if (p.pattern === 'xadrez') {
    let s = '';
    for (let x = 4; x < 200; x += 13) s += `<rect x="${x}" y="0" width="5.5" height="420" fill="${r.shade}" opacity="0.6"/>`;
    for (let y = f.yNeck; y < f.sole; y += 13) s += `<rect x="0" y="${n(y)}" width="200" height="5.5" fill="${r.shade}" opacity="0.6"/>`;
    for (let x = 10; x < 200; x += 13) s += `<rect x="${x}" y="0" width="1" height="420" fill="${c}" opacity="0.35"/>`;
    return s;
  }
  if (p.pattern === 'estampa') {
    if (area === 'top') {
      const y = f.yChest + 8;
      return `<path d="${ellipse(CX, y, 9.5, 9.5)}" fill="${c}"/><path d="M${CX - 5} ${n(y + 2)}l3.4 -5.4 3 3.6 2.4 -2.4 3.4 4.2z" fill="${p.color}"/><circle cx="${CX + 3}" cy="${n(y - 3.6)}" r="1.6" fill="${p.color}"/>`;
    }
    let s = '';
    for (let i = 0; i < 26; i++) {
      const x = 52 + ((i * 37) % 96);
      const y = f.yHip - 6 + ((i * 23) % 90);
      s += `<path d="${ellipse(x, y, 2.6, 1.7)}" fill="${c}" opacity="0.85"/>`;
    }
    return s;
  }
  return '';
}

function topBody(f: Fig, st: TopStyle, hemY: number, ease: number): string {
  const nw = f.neck;
  const y0 = f.yNeck - 1;
  const right = torsoSide(f, ease).slice(1);
  const hem = Math.max(f.hip, f.waist) + ease + 1.5;
  const sideR: Pt[] = st.sleeve === 'none'
    ? [
        [CX + nw + (f.female ? 6 : 9), y0 - 0.5, 1],
        [CX + Math.min(f.shoulder - 9, nw + (f.female ? 11 : 15)), f.yShoulder + 0.5, 1],
        [CX + f.shoulder - 11, f.yArmpit - 6],
        [CX + f.chest + 0.5 + ease, f.yArmpit + 6],
        ...right.slice(3).filter((p) => p[1] < hemY - 2),
      ]
    : [[CX + nw + 3.5, y0, 1], ...right.filter((p) => p[1] < hemY - 2)];
  sideR.push([CX + hem, hemY, 1]);
  const neckPts = (): Pt[] => {
    const a = sideR[0]!;
    switch (st.neck) {
      case 'v':
      case 'wrap':
        return [[CX, f.yNeck + 15, 1]];
      case 'collar':
        return [[CX, f.yNeck + 10, 1]];
      case 'scoop':
        return [[lerp(CX, a[0], 0.6), f.yNeck + (f.female ? 13 : 9)], [CX, f.yNeck + (f.female ? 17 : 12)], [lerp(CX, 2 * CX - a[0], 0.6), f.yNeck + (f.female ? 13 : 9)]];
      default:
        return [[CX + nw * 0.7, f.yNeck + 4.5], [CX, f.yNeck + 6.5], [CX - nw * 0.7, f.yNeck + 4.5]];
    }
  };
  // contorno: decote (direita → esquerda), lado esquerdo descendo, barra, lado direito subindo
  return smooth([...neckPts(), ...mirror(sideR, CX).reverse(), ...[...sideR].reverse()]);
}

function sleevePath(f: Fig, side: -1 | 1, s: Sleeve, ease: number): string | null {
  if (s === 'none') return null;
  if (s === 'puff') return limb(f.arm(side), 0.02, 0.27, ease + 3.6, { capStart: true }).d;
  if (s === 'short') return limb(f.arm(side), 0.1, 0.38, ease + 2, { capStart: true }).d;
  return armPath(f, side, 0.1, 0.985, ease + 1.4);
}

/** Linha de costura atravessando o membro em t. */
function across(axis: ReturnType<Fig['arm']>, t: number, grow: number): string {
  const p = along(axis, t);
  const r = p.r + grow;
  return `M${n(p.x - p.dy * r)} ${n(p.y + p.dx * r)}L${n(p.x + p.dy * r)} ${n(p.y - p.dx * r)}`;
}

export function drawTop(doc: Doc, f: Fig, p: OutfitPiece, opts: { layerArms: (doc: Doc) => void }): void {
  const st = TOPS[p.id] ?? GENERIC_TOP;
  const r = ramp(p.color);
  const ease = st.ease ?? 2;
  const hemY = st.short ? f.yWaist + 4 : f.yHip + 9;
  const inner = patternInner(p, r, f, 'top');
  const body = topBody(f, st, hemY, ease);
  // braços e mangas por baixo do corpo da peça: a cava fica por cima, como uma costura
  opts.layerArms(doc);
  for (const side of [-1, 1] as const) {
    const sl = sleevePath(f, side, st.sleeve, ease);
    if (!sl) continue;
    doc.region(sl, r, { shift: [-3, -1.5], inner: p.pattern === 'estampa' ? '' : inner });
    const axis = f.arm(side);
    if (st.sleeve === 'short') doc.stroke(across(axis, 0.33, ease + 2), r.line, 0.9, 0.45);
    if (st.sleeve === 'long') {
      doc.stroke(across(axis, st.neck === 'hood' ? 0.9 : 0.93, ease + 1.4), r.line, 1, 0.55);
      if (st.neck === 'collar') doc.stroke(`M${n(along(axis, 0.6).x - side * 1)} ${n(along(axis, 0.6).y)}l${n(side * 1.5)} 6`, r.line, 0.8, 0.35);
    }
    if (st.sleeve === 'puff') doc.stroke(across(axis, 0.22, ease + 3.6), r.line, 0.9, 0.4);
  }
  doc.region(body, r, { shift: [-6, -2], inner });
  details(doc, f, st, r, p, hemY);
  if (st.neck === 'hood') hood(doc, f, r);
  if (st.neck === 'collar') collar(doc, f, p);
}

function details(doc: Doc, f: Fig, st: TopStyle, r: Ramp, p: OutfitPiece, hemY: number): void {
  const line = r.line;
  if (st.neck === 'crew' || st.neck === 'hood') doc.stroke(`M${n(CX - f.neck - 3)} ${n(f.yNeck)}Q${n(CX)} ${n(f.yNeck + 10)} ${n(CX + f.neck + 3)} ${n(f.yNeck)}`, line, 1, 0.5);
  if (st.buttons) {
    doc.stroke(`M${CX} ${n(f.yNeck + 10)}L${CX} ${n(hemY - 1)}`, line, 0.9, 0.45);
    const step = (Math.min(hemY, f.yHip) - f.yNeck - 16) / Math.max(1, st.buttons - 1);
    const count = st.buttons;
    for (let i = 0; i < count; i++) doc.fill(ellipse(CX + 2.4, f.yNeck + 15 + i * (count > 2 ? step : 6), 1.15, 1.15), mix(r.line, r.base, 0.35));
  }
  if (st.pocket === 'chest') {
    const x = CX - f.chest * 0.52;
    const y = f.yChest - 4;
    doc.region(poly([[x - 6, y], [x + 6, y], [x + 6, y + 9], [x, y + 11], [x - 6, y + 9]]), r, { flat: true, sw: 0.9, inner: '' });
    doc.stroke(`M${n(x - 6)} ${n(y + 2.4)}H${n(x + 6)}`, line, 0.8, 0.45);
  }
  if (st.pocket === 'kangaroo') {
    const w = Math.min(f.waist, f.chest) * 0.62;
    const y = f.yWaist + 6;
    doc.region(smooth([[CX - w, y + 4, 1], [CX - w * 0.72, y - 4], [CX + w * 0.72, y - 4], [CX + w, y + 4, 1], [CX + w, y + 18, 1], [CX - w, y + 18, 1]]), r, { shift: [-2, -1.5], sw: 1.1 });
  }
  if (st.emblem) doc.fill(ellipse(CX - f.chest * 0.5, f.yChest - 2, 3.6, 3.6), contrast(p.color));
  // curvas do corpo por baixo do tecido
  if (f.female) {
    for (const side of [-1, 1] as const) doc.stroke(`M${n(CX + side * f.chest * 0.82)} ${n(f.yChest + 3)}Q${n(CX + side * f.chest * 0.45)} ${n(f.yChest + 11)} ${n(CX + side * 4)} ${n(f.yChest + 4)}`, r.shade, 1.6, 0.9);
  } else if (f.muscle > 0.55 && (st.ease ?? 2) < 2.5) {
    for (const side of [-1, 1] as const) doc.stroke(`M${n(CX + side * f.chest * 0.78)} ${n(f.yChest - 2)}Q${n(CX + side * f.chest * 0.4)} ${n(f.yChest + 6)} ${n(CX + side * 2.5)} ${n(f.yChest + 1)}`, r.shade, 1.5, 0.85);
  }
  if (f.fat > 0.55) doc.stroke(`M${n(CX - f.waist * 0.75)} ${n(f.yWaist + 16)}Q${n(CX)} ${n(f.yWaist + 26)} ${n(CX + f.waist * 0.75)} ${n(f.yWaist + 16)}`, r.shade, 1.6, 0.8);
  // dobras na barra
  doc.stroke(`M${n(CX - f.hip * 0.5)} ${n(hemY - 3)}l2 -7M${n(CX + f.hip * 0.62)} ${n(hemY - 2)}l-1.6 -6`, r.shade, 1.3, 0.8);
}

function collar(doc: Doc, f: Fig, p: OutfitPiece): void {
  const lr = ramp(mix(p.color, '#ffffff', 0.12));
  for (const side of [-1, 1] as const) {
    const d = poly([
      [CX + side * (f.neck + 1.5), f.yNeck - 5],
      [CX + side * (f.neck + 7), f.yNeck + 1.5],
      [CX + side * (f.neck * 0.45 + 2), f.yNeck + 9],
      [CX + side * 0.5, f.yNeck + 10.5],
      [CX + side * 2, f.yNeck + 3],
      [CX + side * (f.neck - 1.5), f.yNeck - 2],
    ]);
    doc.region(d, lr, { flat: true, sw: 1.1 });
  }
}

function hood(doc: Doc, f: Fig, r: Ramp): void {
  const nw = f.neck;
  const d = smooth([
    [CX - nw - 9, f.yNeck - 3],
    [CX - nw - 2, f.yNeck - 7],
    [CX + nw + 2, f.yNeck - 7],
    [CX + nw + 9, f.yNeck - 3],
    [CX + nw + 8, f.yNeck + 3],
    [CX + 4, f.yNeck + 11],
    [CX - 4, f.yNeck + 11],
    [CX - nw - 8, f.yNeck + 3],
  ]);
  const inner = smooth([[CX - nw - 3, f.yNeck - 3], [CX, f.yNeck + 6.5], [CX + nw + 3, f.yNeck - 3], [CX + nw, f.yNeck - 4.8], [CX - nw, f.yNeck - 4.8]]);
  doc.region(`${d}${inner}`, r, { shift: [-2.5, -2], sw: 1.3 });
  doc.stroke(`M${n(CX - 4)} ${n(f.yNeck + 9)}l-0.8 16M${n(CX + 4)} ${n(f.yNeck + 9)}l0.8 15`, mix(r.base, '#f2efe8', 0.75), 1.4);
}

// ——— parte de baixo ———

type BottomKind = { len: number; ease: number; cuff?: boolean; crease?: boolean; fly?: boolean };
const BOTTOMS: Record<string, BottomKind> = {
  calca_jeans: { len: 1, ease: 2.4, fly: true },
  calca_moletom: { len: 1, ease: 3.6, cuff: true },
  calca_social: { len: 1, ease: 2.8, crease: true },
  calca_farda: { len: 1, ease: 3, cuff: true },
  bermuda: { len: 0.5, ease: 3.2 },
  bermuda_praia: { len: 0.46, ease: 3.6 },
  bermuda_infantil: { len: 0.46, ease: 3.2 },
  shorts: { len: 0.27, ease: 2.6 },
  shorts_luta: { len: 0.4, ease: 3.8 },
  sunga: { len: 0.08, ease: 1.4 },
};
const GENERIC_BOTTOM: BottomKind = { len: 0.5, ease: 3 };

/** Eixo da perna da calça: abaixo do joelho a perna fica reta (não marca a panturrilha). */
function pantLeg(f: Fig, side: -1 | 1, len: number): ReturnType<Fig['leg']> {
  const axis = f.leg(side);
  if (len < 0.6) return axis;
  const knee = axis[2]!.r;
  return axis.map((p, i) => (i >= 2 ? { ...p, r: Math.max(p.r, knee * (i === 2 ? 1 : 0.94)) } : p));
}

export function pantsPath(f: Fig, len: number, ease: number): { d: string; hems: [Pt, Pt][] } {
  const L = limb(pantLeg(f, -1, len), 0, len, ease, { steps: 9 });
  const R = limb(pantLeg(f, 1, len), 0, len, ease, { steps: 9 });
  const yTop = f.yHip - 12;
  const topHalf = Math.max(f.waist * 0.6 + f.hip * 0.4, f.hip * 0.96) + ease;
  const cut = f.yCrotch + 3;
  const lOut = L.left;
  const lIn = L.right.filter((p) => p[1] > cut);
  const rIn = R.left.filter((p) => p[1] > cut);
  const rOut = R.right;
  const lo = lOut[lOut.length - 1]!;
  const li = L.right[L.right.length - 1]!;
  const ri = R.left[R.left.length - 1]!;
  const ro = rOut[rOut.length - 1]!;
  const crotchY = Math.min(f.yCrotch + 2, Math.min(lo[1], ro[1]) - 2);
  const pts: Pt[] = [
    [CX - topHalf, yTop, 1],
    ...lOut.slice(1, -1),
    [lo[0], lo[1], 1],
    [li[0], li[1], 1],
    ...[...lIn].reverse().slice(1),
    [CX, crotchY, 1],
    ...rIn.slice(0, -1),
    [ri[0], ri[1], 1],
    [ro[0], ro[1], 1],
    ...[...rOut].reverse().slice(1, -1),
    [CX + topHalf, yTop, 1],
  ];
  return { d: smooth(pts), hems: [[lo, li], [ri, ro]] };
}

export function drawBottom(doc: Doc, f: Fig, p: OutfitPiece): void {
  const r = ramp(p.color);
  if (p.id === 'saia') return skirt(doc, f, p, r);
  const k = BOTTOMS[p.id] ?? GENERIC_BOTTOM;
  if (p.id === 'sunga') {
    const yTop = f.yHip - 4;
    const d = smooth([[CX - f.hip - 1.2, yTop, 1], [CX + f.hip + 1.2, yTop, 1], [CX + f.hip * 0.98, f.yCrotch - 2], [CX + 6, f.yCrotch + 5, 1], [CX - 6, f.yCrotch + 5, 1], [CX - f.hip * 0.98, f.yCrotch - 2]]);
    doc.region(d, r, { shift: [-3, -1.5] });
    return;
  }
  const pp = pantsPath(f, k.len, k.ease);
  doc.region(pp.d, r, { shift: [-4, -1], inner: patternInner(p, r, f, 'bottom') });
  // detalhes: braguilha, vinco, punho, barra
  if (k.fly) doc.stroke(`M${CX + 1} ${n(f.yHip - 2)}Q${CX + 4} ${n(f.yCrotch - 4)} ${CX + 0.5} ${n(f.yCrotch)}`, r.line, 0.9, 0.5);
  if (k.crease) for (const side of [-1, 1] as const) {
    const a = along(f.leg(side), 0.12);
    const b = along(f.leg(side), 0.98);
    doc.stroke(`M${n(a.x)} ${n(a.y + 6)}L${n(b.x)} ${n(b.y)}`, r.shade, 1.1, 0.9);
  }
  for (const [a, b] of pp.hems) {
    if (k.len >= 1) continue;
    doc.stroke(`M${n(a[0] + 1)} ${n(a[1] - 3)}L${n(b[0] - 1)} ${n(b[1] - 3)}`, r.line, 0.8, 0.45);
  }
  if (k.cuff) for (const side of [-1, 1] as const) {
    const a = along(f.leg(side), 0.95);
    doc.stroke(`M${n(a.x - a.r - k.ease + 1)} ${n(a.y)}L${n(a.x + a.r + k.ease - 1)} ${n(a.y)}`, r.line, 0.9, 0.5);
  }
  // dobras do joelho nas calças compridas
  if (k.len >= 1) for (const side of [-1, 1] as const) {
    const kn = along(f.leg(side), 0.55);
    doc.stroke(`M${n(kn.x - 4)} ${n(kn.y - 2)}q4 2 8 -1`, r.shade, 1.2, 0.85);
  }
}

function skirt(doc: Doc, f: Fig, p: OutfitPiece, r: Ramp): void {
  const yTop = f.yHip - 14;
  const top = Math.max(f.waist * 0.5 + f.hip * 0.5, f.hip * 0.94) + 2;
  const hemY = f.yKnee - 4;
  const hem = f.hip + 13 + f.fat * 4;
  const d = smooth([
    [CX - top, yTop, 1],
    [CX + top, yTop, 1],
    [CX + f.hip + 2.5, f.yHip + 4],
    [CX + hem, hemY - 1, 1],
    [CX + hem * 0.5, hemY + 2.5],
    [CX, hemY + 3],
    [CX - hem * 0.5, hemY + 2.5],
    [CX - hem, hemY - 1, 1],
    [CX - f.hip - 2.5, f.yHip + 4],
  ]);
  doc.region(d, r, { shift: [-5, -1.5], inner: patternInner(p, r, f, 'bottom') });
  doc.stroke(`M${n(CX - hem * 0.45)} ${n(hemY + 1.5)}L${n(CX - f.hip * 0.4)} ${n(f.yHip + 10)}M${n(CX + hem * 0.15)} ${n(hemY + 2.8)}L${n(CX + f.hip * 0.12)} ${n(f.yHip + 12)}M${n(CX + hem * 0.62)} ${n(hemY + 1)}L${n(CX + f.hip * 0.58)} ${n(f.yHip + 10)}`, r.shade, 1.3, 0.9);
}

// ——— inteira ———

export function drawWhole(doc: Doc, f: Fig, p: OutfitPiece, layerArms: (doc: Doc) => void): void {
  const r = ramp(p.color);
  if (p.id === 'vestido' || p.id === 'vestido_festa') return dress(doc, f, p, r, layerArms);
  // genérico: parte de cima e calça na cor da peça (macacão, kimono, uniforme…)
  const kimono = p.id === 'kimono';
  const pants = pantsPath(f, kimono ? 0.93 : 1, 3);
  doc.region(pants.d, r, { shift: [-4, -1] });
  const top: OutfitPiece = { ...p, id: kimono ? 'kimono_top' : p.id === 'uniforme_presidiario' ? 'camiseta' : 'camiseta_uv' };
  if (kimono) {
    TOPS.kimono_top = TOPS.kimono_top ?? { sleeve: 'long', neck: 'wrap', ease: 3.2 };
  }
  drawTop(doc, f, top, { layerArms });
  if (kimono) {
    const lap = ramp(mix(p.color, '#000000', 0.06));
    for (const side of [-1, 1] as const) doc.stroke(`M${n(CX + side * (f.neck + 3))} ${n(f.yNeck - 2)}L${n(CX - side * 4)} ${n(f.yWaist + 8)}`, lap.line, 3.2, 0.25);
  }
}

function dress(doc: Doc, f: Fig, p: OutfitPiece, r: Ramp, layerArms: (doc: Doc) => void): void {
  const party = p.id === 'vestido_festa';
  const hemY = party ? f.yAnkle - 14 : f.yKnee + 2;
  const hem = f.hip + (party ? 20 : 15) + f.fat * 4;
  const nw = f.neck;
  const right: Pt[] = [
    [CX + nw + 5, f.yNeck - 0.5, 1],
    [CX + nw + 10, f.yShoulder + 1, 1],
    [CX + f.shoulder - 11, f.yArmpit - 5],
    [CX + f.chest + 2, f.yArmpit + 6],
    [CX + f.chest + 2.5, f.yChest],
    [CX + f.waist + 1.5, f.yWaist],
    [CX + f.hip + 3, f.yHip],
    [CX + hem, hemY - 1, 1],
  ];
  const left = mirror(right, CX).reverse();
  const d = smooth([[CX + nw * 0.7, f.yNeck + 10], [CX, f.yNeck + 15], [CX - nw * 0.7, f.yNeck + 10], ...left, [CX - hem * 0.5, hemY + 3], [CX, hemY + 3.5], [CX + hem * 0.5, hemY + 3], ...[...right].reverse()]);
  layerArms(doc);
  doc.region(d, r, { shift: [-6, -2], inner: patternInner(p, r, f, 'top') });
  for (const side of [-1, 1] as const) doc.stroke(`M${n(CX + side * f.chest * 0.82)} ${n(f.yChest + 3)}Q${n(CX + side * f.chest * 0.45)} ${n(f.yChest + 11)} ${n(CX + side * 4)} ${n(f.yChest + 4)}`, r.shade, 1.6, 0.9);
  // cintura marcada e pregas da saia
  const sash = ramp(party ? mix(p.color, '#ffffff', 0.25) : r.shade);
  doc.region(smooth([[CX - f.waist - 2, f.yWaist - 3, 1], [CX + f.waist + 2, f.yWaist - 3, 1], [CX + f.waist + 2.2, f.yWaist + 3, 1], [CX - f.waist - 2.2, f.yWaist + 3, 1]]), sash, { flat: true, sw: 0.9 });
  doc.stroke(`M${n(CX - hem * 0.5)} ${n(hemY + 1)}L${n(CX - f.hip * 0.45)} ${n(f.yHip + 8)}M${n(CX + hem * 0.1)} ${n(hemY + 2.5)}L${n(CX + f.hip * 0.08)} ${n(f.yHip + 10)}M${n(CX + hem * 0.6)} ${n(hemY + 1)}L${n(CX + f.hip * 0.55)} ${n(f.yHip + 8)}`, r.shade, 1.4, 0.9);
}

// ——— agasalho ———

export function drawOuter(doc: Doc, f: Fig, p: OutfitPiece): void {
  const r = ramp(p.color);
  const ease = 4.2;
  const suit = p.id === 'terno' || p.id === 'cronos_terno';
  const vest = p.id === 'colete_pm' || p.id === 'colete_civil';
  const hemY = f.yHip + (suit ? 14 : 10);
  const right = torsoSide(f, ease).slice(1).filter((pt) => pt[1] < hemY - 2);
  const hem = Math.max(f.hip, f.waist) + ease + 1.5;
  for (const side of [-1, 1] as const) {
    const sideR: Pt[] = [[CX + f.neck + 3, f.yNeck - 2, 1], ...right, [CX + hem, hemY, 1]];
    const s = side > 0 ? sideR : sideR.map((q): Pt => (q[2] ? [2 * CX - q[0], q[1], 1] : [2 * CX - q[0], q[1]]));
    const front: Pt[] = suit
      ? [[CX + side * 3, hemY, 1], [CX + side * 2, f.yWaist - 4, 1], [CX + side * (f.neck * 0.7 + 7), f.yChest - 6, 1], [CX + side * (f.neck + 1), f.yNeck + 1, 1]]
      : [[CX + side * 6, hemY, 1], [CX + side * 6, f.yNeck + 6, 1]];
    const pts: Pt[] = [...s, ...front];
    doc.region(smooth(pts), r, { shift: [side > 0 ? -5 : -3, -2] });
    if (suit) doc.region(poly([[CX + side * (f.neck + 1), f.yNeck + 1], [CX + side * (f.neck * 0.7 + 7), f.yChest - 6], [CX + side * (f.neck + 9), f.yChest - 14], [CX + side * (f.neck + 4), f.yNeck - 1]]), ramp(mix(p.color, '#000000', 0.12)), { flat: true, sw: 1 });
    else if (!vest) doc.stroke(`M${n(CX + side * 6)} ${n(f.yNeck + 6)}L${n(CX + side * 6)} ${n(hemY)}`, mix(r.base, '#d8d4cc', 0.5), 0.9, 0.7);
  }
  if (suit) doc.fill(ellipse(CX + 3.4, f.yWaist - 1, 1.5, 1.5), r.line);
  if (!vest) for (const side of [-1, 1] as const) {
    doc.region(armPath(f, side, 0, 0.965, ease), r, { shift: [-3, -1.5] });
    doc.stroke(across(f.arm(side), 0.92, ease), r.line, 1, 0.55);
  }
}

// ——— calçados ———

export function drawShoes(doc: Doc, f: Fig, p: OutfitPiece | undefined, skin: Ramp): void {
  const id = p?.id ?? 'descalco';
  for (const side of [-1, 1] as const) {
    const a = along(f.leg(side), 1);
    const x = a.x + side * 2.5;
    const w = (8.6 + f.fat * 1.4) * (f.hand / 18.5);
    if (id === 'descalco' || id === 'chinelo' || id === 'meia') {
      const foot = footPath(f, side);
      doc.region(foot, id === 'meia' && p ? ramp(p.color) : skin, { shift: [-2, -1.5], sw: 1.6 });
      doc.stroke(`M${n(x - w * 0.5 + side * 1.5)} ${n(f.sole - 1.5)}v-2.2M${n(x - w * 0.1 + side * 1.5)} ${n(f.sole - 1)}v-2.4M${n(x + w * 0.3 + side * 1.5)} ${n(f.sole - 1)}v-2.2`, skin.line, 0.8, 0.45);
      if (id === 'chinelo' && p) {
        const r = ramp(p.color);
        doc.region(smooth([[x - w - 1 + side, f.sole - 2.2, 1], [x + w + 1 + side, f.sole - 2.2, 1], [x + w + 1 + side, f.sole + 1.6, 1], [x - w - 1 + side, f.sole + 1.6, 1]]), r, { flat: true, sw: 1 });
        doc.stroke(`M${n(x - w * 0.7 + side)} ${n(f.sole - 4)}L${n(x + side)} ${n(f.sole - 9)}L${n(x + w * 0.7 + side)} ${n(f.sole - 4)}`, r.base, 2.2);
      }
      continue;
    }
    const r = ramp(p!.color);
    const boot = id === 'bota' || id === 'coturno';
    const dress = id === 'sapato';
    const top = boot ? f.yAnkle - 24 : f.yAnkle - (dress ? 1 : 3);
    const shaft = a.r + 3.5;
    const d = smooth([
      [x - side * 2.5 - shaft, top, 1],
      [x - side * 2.5 + shaft, top, 1],
      [x + w + side * 0.5, f.sole - 8],
      [x + w * 0.85 + side * 1.5, f.sole - 1, 1],
      [x - w * 0.85 + side * 1.5, f.sole - 1, 1],
      [x - w + side * 0.5, f.sole - 8],
    ]);
    doc.region(d, r, { shift: [-2.5, -2], sw: 1.7 });
    // sola
    const soleC = id === 'tenis' ? ramp('#f4f1ea') : ramp(mix(p!.color, '#000000', 0.35));
    doc.region(smooth([[x - w - 0.4 + side * 1.2, f.sole - 4.2, 1], [x + w + 0.4 + side * 1.2, f.sole - 4.2, 1], [x + w * 0.9 + side * 1.5, f.sole + 1.4], [x - w * 0.9 + side * 1.5, f.sole + 1.4]]), soleC, { flat: true, sw: 1.3 });
    if (id === 'tenis') doc.stroke(`M${n(x - 3 + side)} ${n(f.yAnkle + 4)}h6M${n(x - 3.4 + side)} ${n(f.yAnkle + 7.5)}h6.8`, contrast(p!.color), 1.2, 0.9);
    if (dress) doc.fill(ellipse(x - 2.5 + side, f.sole - 9, 2.6, 1.3), '#ffffff', 0.35);
    if (boot) doc.stroke(`M${n(x - side * 2.5 - shaft + 1)} ${n(top + 6)}h${n(shaft * 2 - 2)}`, r.line, 0.9, 0.5);
  }
}

// ——— acessórios ———

export function drawAccessoryBody(doc: Doc, f: Fig, p: OutfitPiece): void {
  if (p.id === 'faixa') {
    const r = ramp(p.color);
    const y = f.yWaist + 9;
    const w = Math.max(f.waist, f.hip * 0.9) + 4;
    doc.region(smooth([[CX - w, y - 3.2, 1], [CX + w, y - 3.2, 1], [CX + w, y + 3.2, 1], [CX - w, y + 3.2, 1]]), r, { flat: true, sw: 1.2 });
    if (p.accent) doc.fill(poly([[CX + w * 0.5, y - 3], [CX + w * 0.5 + 6, y - 3], [CX + w * 0.5 + 6, y + 3], [CX + w * 0.5, y + 3]]), p.accent);
    doc.region(smooth([[CX - 5, y - 4], [CX + 5, y - 4], [CX + 5, y + 4], [CX - 5, y + 4]]), r, { flat: true, sw: 1.2 });
    doc.region(poly([[CX - 3, y + 3], [CX - 8, y + 20], [CX - 3, y + 21], [CX + 1, y + 4]]), r, { flat: true, sw: 1.1 });
    doc.region(poly([[CX + 2, y + 3], [CX + 5, y + 19], [CX + 10, y + 18], [CX + 4, y + 3]]), r, { flat: true, sw: 1.1 });
  }
}

/** Acessórios da cabeça (por cima do cabelo): óculos e boné. */
export function drawAccessoryHead(doc: Doc, f: Fig, p: OutfitPiece, eyeY: number, eyeDx: number, hairTop: number): void {
  const h = f.head;
  if (p.id === 'oculos') {
    const c = ramp(p.color);
    let d = '';
    for (const side of [-1, 1] as const) {
      const x = h.cx + side * eyeDx;
      d += smooth([[x - 8.5, eyeY - 5.5], [x + 8.5, eyeY - 5.5], [x + 8, eyeY + 5.5], [x - 8, eyeY + 5.5]], true, 0.6);
    }
    doc.fill(d, '#dfeaf2', 0.22);
    doc.stroke(d, c.base, 1.8);
    doc.stroke(`M${n(h.cx - eyeDx + 8.5)} ${n(eyeY - 2)}Q${h.cx} ${n(eyeY - 4.5)} ${n(h.cx + eyeDx - 8.5)} ${n(eyeY - 2)}`, c.base, 1.6);
  }
  if (p.id === 'bone' || p.id === 'bone_pm' || p.id === 'capacete') {
    const r = ramp(p.color);
    const band = h.crown + h.Ht * 0.5;
    const top = Math.min(hairTop, h.crown) - 2;
    const w = h.W + 3.5;
    doc.region(smooth([[h.cx - w, band + 2, 1], [h.cx - w + 1, band - 10], [h.cx - w * 0.55, top + 3], [h.cx, top], [h.cx + w * 0.55, top + 3], [h.cx + w - 1, band - 10], [h.cx + w, band + 2, 1]]), r, { shift: [-4, -3] });
    doc.region(smooth([[h.cx - w - 1, band + 1], [h.cx, band + 2.5], [h.cx + w + 1, band + 1], [h.cx + w * 0.75, band + 7], [h.cx, band + 9.5], [h.cx - w * 0.75, band + 7]]), ramp(mix(p.color, '#000000', 0.12)), { shift: [-2, -1.5], sw: 1.5 });
    doc.fill(ellipse(h.cx, top + 1.4, 2.2, 1.2), r.line);
  }
}

