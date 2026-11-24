/**
 * Roupas do cartoon, desenhadas a partir da mesma geometria do corpo: servem em todo tipo físico e fase, e acompanham
 * a silhueta (ombro, deltoide, bíceps, cintura em V, barriga, coxas). Cada peça é uma união (tronco + mangas, ou as
 * duas pernas da calça) desenhada com `Doc.group`: contorno só por fora, dobras de propósito por dentro.
 *
 * Regras de sobreposição:
 * - toda peça tem folga ≥ 0 sobre o que cobre, então o contorno da peça de trás nunca vaza;
 * - o lado do tronco de uma peça é recortado na borda de dentro do braço (o braço fica na frente do tronco);
 * - antebraço e mão vêm por cima de tudo (ver `drawFrontArm`), com a parte de baixo das mangas compridas.
 *
 * REGRA: o avatar é sempre renderizado vestido — sem parte de cima nem inteira entra uma camiseta; sem parte de baixo
 * nem inteira, uma bermuda (ver `index.ts`). Roupas de banho cobrem com decência e não têm detalhe anatômico.
 */
import type { OutfitPiece } from '../../../engine';
import { ARM_STEPS, CX, SW, armInnerX, sideX, torsoSide } from './body';
import type { Fig, FrontSleeve } from './body';
import { along, axisT, clamp, ellipse, growAxis, lerp, limb, mirror, n, offsetAt, poly, smooth } from './geom';
import type { Node, Pt } from './geom';
import { contrast, mix, ramp } from './palette';
import type { Ramp } from './palette';
import { clipped, fillEl, strokeEl } from './svg';
import type { Doc } from './svg';

export const CLOTH_SHIFT: [number, number] = [-4.5, -2];

// ——— geometria comum ———

export interface SleeveGeom {
  t1: number;
  ease: number;
  flare?: number;
  puff?: number;
}

function sleeveAxis(f: Fig, side: -1 | 1, g: SleeveGeom): Node[] {
  const axis = growAxis(f.arm(side), g.ease, g.flare ?? 0);
  if (!g.puff) return axis;
  const ts = axisT(axis);
  return axis.map((p, i) => ({ ...p, r: p.r + g.puff! * Math.sin(Math.PI * clamp(ts[i]! / g.t1, 0, 1)) }));
}

export function sleeveD(f: Fig, side: -1 | 1, g: SleeveGeom, t0 = 0): string {
  return limb(sleeveAxis(f, side, g), t0, g.t1, 0, { capStart: t0 === 0, capEnd: false, grid: ARM_STEPS }).d;
}

/** Borda de dentro da manga, da axila ao punho (dobra: o braço fica na frente do corpo da peça). */
function sleeveInnerEdge(f: Fig, side: -1 | 1, g: SleeveGeom): string {
  // deslocada meia linha para dentro do corpo: coincide com o contorno do antebraço da frente
  const l = limb(sleeveAxis(f, side, g), 0.16, g.t1, SW / 2, { grid: ARM_STEPS });
  return smooth(side < 0 ? l.right : l.left, false);
}

/** Dobra da axila (onde a manga encontra o corpo da peça). */
function armpitFold(f: Fig, side: -1 | 1, ease: number): string {
  const x = CX + side * (f.chest + ease - 0.5);
  const y = f.yArmpit + 3;
  return `M${n(x - side * 5 * f.ws)} ${n(y - 7 * f.bs)}Q${n(x - side * 1)} ${n(y - 2)} ${n(x + side * 1.5)} ${n(y + 5 * f.bs)}`;
}

/** Linha atravessando o membro em t (barra, punho, costura). */
export function across(axis: Node[], t: number, grow: number): string {
  const p = along(axis, t);
  const r = p.r + grow;
  return `M${n(p.x - p.dy * r)} ${n(p.y + p.dx * r)}L${n(p.x + p.dy * r)} ${n(p.y - p.dx * r)}`;
}

export type NeckKind = 'crew' | 'scoop' | 'v' | 'collar' | 'wrap' | 'high' | 'boat';

function neckline(f: Fig, kind: NeckKind, e: number): { center: Pt; half: Pt[]; np: Pt } {
  const bs = f.bs;
  const y = f.yNeck;
  const fem = f.female ? f.sexK : 0;
  switch (kind) {
    case 'scoop': {
      const w = f.neck + 5 + fem * 2.5;
      return { center: [CX, y + (11 + fem * 4) * bs], half: [[CX + w * 0.7, y + 8.5 * bs]], np: [CX + w + e * 0.2, y - 0.4] };
    }
    case 'v':
      return { center: [CX, y + 15 * bs, 1], half: [], np: [CX + f.neck + 2.4 + e * 0.2, y - 1.2, 1] };
    case 'collar':
      return { center: [CX, y + 8 * bs, 1], half: [[CX + f.neck * 0.55, y + 2.4]], np: [CX + f.neck + 1, y - 2.6] };
    case 'wrap':
      return { center: [CX, f.yChest - 3 * bs, 1], half: [], np: [CX + f.neck + 2.6, y - 1.8, 1] };
    case 'high':
      return { center: [CX, y + 2.6 * bs], half: [[CX + f.neck * 0.72, y + 1.6 * bs]], np: [CX + f.neck + 1.3, y - 3] };
    case 'boat':
      return { center: [CX, y + 6.5 * bs], half: [[CX + f.neck + 3, y + 5 * bs]], np: [CX + f.neck + 8.5, y + 0.8] };
    default:
      return { center: [CX, y + 6.2 * bs], half: [[CX + f.neck * 0.74, y + 4.6 * bs]], np: [CX + f.neck + 1.9 + e * 0.25, y - 1.4] };
  }
}

/** y da linha do trapézio (lado direito) na posição x, com folga. */
function trapY(f: Fig, x: number, e: number): number {
  const T = torsoSide(f, e);
  const a = T[0]!;
  const b = T[1]!;
  const c = T[2]!;
  if (x <= b[0]) return lerp(a[1], b[1], clamp((x - a[0]) / (b[0] - a[0] || 1), 0, 1));
  return lerp(b[1], c[1], clamp((x - b[0]) / (c[0] - b[0] || 1), 0, 1));
}

export interface Cut {
  ease: number;
  hemY: number;
  neck: NeckKind;
  /** Alargamento na barra (evasê). */
  flare?: number;
  /** Sem manga: largura da alça. */
  sleeveless?: number;
  /** Recorta o lado na borda de dentro do braço (com esta folga extra); padrão: sem recorte (braço por trás). */
  armEase?: number;
  /** Barra própria (lado direito, do canto da barra até perto do centro); o último ponto pode ser o centro. */
  hem?: Pt[];
  /** Topo reto (biquíni, tomara que caia): y do topo no lugar do decote. */
  bandTop?: number;
}

/** Corpo de uma peça do tronco (lado direito construído e espelhado). */
export function torsoPiece(f: Fig, c: Cut): string {
  const e = c.ease;
  const nk = neckline(f, c.neck, e);
  const T = torsoSide(f, e);
  const armE = c.armEase;
  const flareAt = (y: number) => (c.flare && y > f.yWaist ? c.flare * Math.pow(clamp((y - f.yWaist) / (c.hemY - f.yWaist || 1), 0, 1), 1.4) : 0);
  const xAt = (y: number) => (armE === undefined ? sideX(f, y, e) + flareAt(y) : Math.min(sideX(f, y, e) + flareAt(y), armInnerX(f, y) - armE - 0.2));
  const R: Pt[] = [];
  let yStart: number;
  if (c.bandTop !== undefined) {
    const y = c.bandTop;
    R.push([xAt(y), y, 1]);
    yStart = y;
  } else if (c.sleeveless !== undefined) {
    const np = nk.np;
    const sx0 = np[0] + c.sleeveless;
    const sy0 = trapY(f, sx0, e) + 0.4;
    const yb = f.yArmpit + 5 * f.bs;
    const xb = xAt(yb);
    R.push([np[0], np[1], 1], [sx0, sy0, 1], [lerp(sx0, xb, 0.42) + 1.2, lerp(sy0, yb, 0.62)], [xb, yb]);
    yStart = yb;
  } else {
    R.push(nk.np, T[1]!, T[2]!, T[3]!);
    yStart = T[3]![1];
  }
  for (let y = yStart + 8; y < c.hemY - 3; y += 8) R.push([xAt(y), y]);
  R.push([xAt(c.hemY), c.hemY, 1]);
  const hem = c.hem ?? [[CX, c.hemY + 1.4]];
  const last = hem[hem.length - 1]!;
  const centerBottom: Pt = last[0] === CX ? last : [CX, c.hemY + 1.4];
  const right: Pt[] = [...nk.half, ...R, ...hem.filter((p) => p !== centerBottom)];
  const top: Pt[] = c.bandTop !== undefined ? [[CX, c.bandTop + 0.8]] : [nk.center];
  const rightNoTop = c.bandTop !== undefined ? [...R, ...hem.filter((p) => p !== centerBottom)] : right;
  return smooth([...top, ...rightNoTop, centerBottom, ...mirror(rightNoTop, CX)]);
}

// ——— estampas ———

export function patternInner(p: OutfitPiece, r: Ramp, f: Fig, area: 'top' | 'bottom'): string {
  const c = contrast(p.color);
  const k = 0.6 + 0.4 * f.bs;
  if (p.pattern === 'listrado') {
    let s = '';
    for (let y = f.yNeck - 4; y < f.sole; y += 11 * k) s += `<rect x="0" y="${n(y)}" width="200" height="${n(4.2 * k)}" fill="${c}" opacity="0.9"/>`;
    return s;
  }
  if (p.pattern === 'xadrez') {
    let s = '';
    const st = 13 * k;
    for (let x = 4; x < 200; x += st) s += `<rect x="${n(x)}" y="0" width="${n(5.5 * k)}" height="420" fill="${r.shade}" opacity="0.6"/>`;
    for (let y = f.yNeck; y < f.sole; y += st) s += `<rect x="0" y="${n(y)}" width="200" height="${n(5.5 * k)}" fill="${r.shade}" opacity="0.6"/>`;
    for (let x = 10; x < 200; x += st) s += `<rect x="${n(x)}" y="0" width="1" height="420" fill="${c}" opacity="0.35"/>`;
    for (let y = f.yNeck + 6; y < f.sole; y += st) s += `<rect x="0" y="${n(y)}" width="200" height="1" fill="${c}" opacity="0.3"/>`;
    return s;
  }
  if (p.pattern === 'estampa') {
    if (area === 'top') {
      const y = f.yChest + 8 * f.bs;
      const s = 0.6 + 0.4 * f.bs;
      return `<path d="${ellipse(CX, y, 9.5 * s, 9.5 * s)}" fill="${c}"/><path d="M${n(CX - 5 * s)} ${n(y + 2 * s)}l${n(3.4 * s)} ${n(-5.4 * s)} ${n(3 * s)} ${n(3.6 * s)} ${n(2.4 * s)} ${n(-2.4 * s)} ${n(3.4 * s)} ${n(4.2 * s)}z" fill="${p.color}"/><circle cx="${n(CX + 3 * s)}" cy="${n(y - 3.6 * s)}" r="${n(1.6 * s)}" fill="${p.color}"/>`;
    }
    // folhas/flores miúdas (bermuda de praia)
    let s = '';
    for (let i = 0; i < 30; i++) {
      const x = 48 + ((i * 37) % 104);
      const y = f.yHip - 14 + ((i * 23) % 96) * f.bs;
      s += i % 3 === 0 ? `<path d="${ellipse(x, y, 2.8, 2.8)}" fill="${c}" opacity="0.85"/><circle cx="${x}" cy="${n(y)}" r="1" fill="${p.color}"/>` : `<path d="M${x - 3} ${n(y + 1.5)}q3 -5 6 -1.5q-3 2.5 -6 1.5z" fill="${c}" opacity="0.8"/>`;
    }
    return s;
  }
  return '';
}

/** Brilho de tecido nobre (seda, cetim, couro, ouro). */
function sheen(f: Fig, r: Ramp, strong = 1): string {
  const s = f.bs;
  return (
    strokeEl(`M${n(CX - f.chest * 0.62)} ${n(f.yArmpit + 4 * s)}q${n(4 * s)} ${n(14 * s)} ${n(1.5 * s)} ${n(30 * s)}`, r.light, 3.2 * s, 0.55 * strong) +
    strokeEl(`M${n(CX - f.chest * 0.3)} ${n(f.yChest + 6 * s)}q${n(2 * s)} ${n(8 * s)} ${n(0.5 * s)} ${n(16 * s)}`, r.light, 2 * s, 0.4 * strong)
  );
}

/** Dobras do tecido sobre o corpo (busto discreto, peitoral, barriga, cintura). */
function bodyFolds(f: Fig, r: Ramp, ease: number, hemY: number): string {
  let s = '';
  const bs = f.bs;
  if (f.female && f.sexK > 0.3) {
    for (const side of [-1, 1] as const)
      s += strokeEl(`M${n(CX + side * f.chest * 0.8)} ${n(f.yChest + 2 * bs)}Q${n(CX + side * f.chest * 0.45)} ${n(f.yChest + 9 * bs)} ${n(CX + side * 4)} ${n(f.yChest + 3 * bs)}`, r.shade, 1.5, 0.75 * f.sexK);
  } else if (!f.female && f.muscle > 0.42 && ease < 3) {
    const k = clamp((f.muscle - 0.42) * 2.2, 0, 1) * f.sexK;
    for (const side of [-1, 1] as const)
      s += strokeEl(`M${n(CX + side * f.chest * 0.8)} ${n(f.yChest - 3 * bs)}Q${n(CX + side * f.chest * 0.42)} ${n(f.yChest + 5 * bs)} ${n(CX + side * 2)} ${n(f.yChest)}`, r.shade, 1.5, 0.35 + 0.55 * k);
    if (ease < 1.6 && k > 0.3) s += strokeEl(`M${CX} ${n(f.yChest - 8 * bs)}V${n(f.yChest + 2 * bs)}`, r.shade, 1.1, 0.5 * k);
  }
  if (f.fat > 0.5 && hemY > f.yWaist + 10) {
    const w = f.waist * 0.72;
    s += strokeEl(`M${n(CX - w)} ${n(f.yWaist + 12 * bs)}Q${n(CX)} ${n(f.yWaist + (20 + f.belly) * bs)} ${n(CX + w)} ${n(f.yWaist + 12 * bs)}`, r.shade, 1.6, 0.7);
  }
  // pregas na cintura (luz da esquerda: dobras do lado direito)
  const y = Math.min(hemY - 6, f.yWaist + 6 * bs);
  s += strokeEl(`M${n(CX + f.waist * 0.78 + ease)} ${n(y - 6 * bs)}l${n(-5 * bs)} ${n(3 * bs)}M${n(CX + f.waist * 0.82 + ease)} ${n(y + 1)}l${n(-4 * bs)} ${n(2.2 * bs)}`, r.shade, 1.2, 0.8);
  return s;
}

/** Costura da cava (da ponta do ombro à axila). */
function armholeSeam(f: Fig, r: Ramp, e: number): string {
  let s = '';
  for (const side of [-1, 1] as const) {
    const a: Pt = [CX + side * (f.shoulder - f.rDelt * 0.55 + e * 0.4), f.yShoulder - f.trap * 0.3];
    const b: Pt = [CX + side * (f.chest + 0.5 + e), f.yArmpit + 3];
    s += strokeEl(`M${n(a[0])} ${n(a[1])}Q${n(CX + side * (f.shoulder - f.rDelt * 1.05))} ${n(lerp(a[1], b[1], 0.6))} ${n(b[0])} ${n(b[1])}`, r.shade, 1.2, 0.85);
  }
  return s;
}

// ——— parte de cima ———

type Sleeve = 'none' | 'short' | 'cap' | 'puff' | 'long' | 'raglan';
interface TopStyle {
  sleeve: Sleeve;
  neck: NeckKind;
  ease?: number;
  hem?: 'hip' | 'crop' | 'long';
  buttons?: number;
  pockets?: 'chest1' | 'chest2' | 'kangaroo' | 'sleeve';
  emblem?: 'school' | 'grad' | 'patch';
  hood?: boolean;
  collar?: 'shirt' | 'polo' | 'mandarin';
  trim?: boolean;
  sheen?: boolean;
  epaulettes?: boolean;
  rib?: boolean;
  strap?: number;
  cuffs?: 'rib' | 'button' | 'plain';
  panels?: boolean;
  tag?: boolean;
}

const TOPS: Record<string, TopStyle> = {
  camiseta: { sleeve: 'short', neck: 'crew' },
  camiseta_listrada: { sleeve: 'short', neck: 'crew' },
  camiseta_estampa: { sleeve: 'short', neck: 'crew' },
  regata: { sleeve: 'none', neck: 'scoop', strap: 6 },
  regata_treino: { sleeve: 'none', neck: 'scoop', strap: 4.5, trim: true, ease: 1.4 },
  polo: { sleeve: 'short', neck: 'collar', collar: 'polo', buttons: 2 },
  social: { sleeve: 'long', neck: 'collar', collar: 'shirt', buttons: 5, cuffs: 'button' },
  arara_social: { sleeve: 'long', neck: 'collar', collar: 'shirt', buttons: 5, cuffs: 'button', sheen: true },
  xadrez: { sleeve: 'long', neck: 'collar', collar: 'shirt', buttons: 5, pockets: 'chest2', cuffs: 'button', ease: 2.6 },
  blusa: { sleeve: 'puff', neck: 'scoop' },
  moletom: { sleeve: 'long', neck: 'crew', hood: true, pockets: 'kangaroo', ease: 3.4, cuffs: 'rib', rib: true },
  cronos_moletom: { sleeve: 'long', neck: 'crew', hood: true, pockets: 'kangaroo', ease: 3.4, cuffs: 'rib', rib: true, sheen: true },
  cropped: { sleeve: 'short', neck: 'crew', hem: 'crop', ease: 1.4 },
  rashguard: { sleeve: 'long', neck: 'crew', ease: 0.6, panels: true, cuffs: 'plain' },
  uniforme: { sleeve: 'short', neck: 'crew', emblem: 'school', trim: true },
  camisa_formatura: { sleeve: 'short', neck: 'crew', emblem: 'grad' },
  camiseta_uv: { sleeve: 'long', neck: 'high', panels: true, cuffs: 'plain', ease: 1.4 },
  farda_pm: { sleeve: 'short', neck: 'collar', collar: 'shirt', buttons: 4, pockets: 'chest2', epaulettes: true, emblem: 'patch', tag: true },
  camisa_civil: { sleeve: 'short', neck: 'collar', collar: 'shirt', buttons: 4, pockets: 'chest1' },
  farda_tatica: { sleeve: 'long', neck: 'collar', collar: 'mandarin', pockets: 'sleeve', ease: 2.8, cuffs: 'plain', emblem: 'patch' },
  /** Parte de cima do macacão de presidiário (interno). */
  __macacao: { sleeve: 'short', neck: 'v', ease: 3, pockets: 'chest1' },
};
const GENERIC_TOP: TopStyle = { sleeve: 'short', neck: 'crew' };

/** Peças que ficam por dentro da calça comprida. */
const TUCKS = new Set(['social', 'arara_social', 'farda_pm', 'camisa_civil', 'farda_tatica']);
export function tucked(top: OutfitPiece | undefined, bottom: OutfitPiece | undefined): boolean {
  return !!top && !!bottom && TUCKS.has(top.id) && (bottom.id === 'calca_social' || bottom.id === 'calca_farda' || (top.id !== 'social' && top.id !== 'arara_social' && bottom.id === 'calca_jeans'));
}

function sleeveGeom(st: TopStyle, ease: number): SleeveGeom | null {
  switch (st.sleeve) {
    case 'none':
      return null;
    case 'cap':
      return { t1: 0.2, ease: ease + 0.8 };
    case 'puff':
      return { t1: 0.27, ease: ease + 1.2, puff: 2.6 };
    case 'short':
      return { t1: 0.35, ease: ease + 1.1, flare: 0.8 };
    default:
      return { t1: 0.975, ease: ease + 0.8 };
  }
}

export interface TopOpts {
  tucked?: boolean;
  /** Gravata (camisa com paletó). */
  tie?: boolean;
  /** Folga do braço por baixo (manga de outra peça). */
  armEase?: number;
}

/** Parte de cima: corpo + mangas numa peça; devolve a manga para o antebraço da frente. */
export function drawTop(doc: Doc, f: Fig, p: OutfitPiece, o: TopOpts = {}): FrontSleeve[] {
  const st = TOPS[p.id] ?? GENERIC_TOP;
  const r = ramp(p.color);
  const ease = st.ease ?? 2;
  const hemY = st.hem === 'crop' ? f.yWaist + 3 * f.bs : o.tucked ? f.yHip - 3 * f.bs : f.yHip + 9 * f.bs;
  const sg = sleeveGeom(st, ease);
  const body = torsoPiece(f, { ease, hemY, neck: st.neck, ...(st.sleeve === 'none' ? { sleeveless: (st.strap ?? 6) * f.ws } : {}), ...(o.armEase ? { armEase: o.armEase } : {}) });
  const parts = [body];
  if (sg) for (const side of [-1, 1] as const) parts.push(sleeveD(f, side, sg));
  const pat = patternInner(p, r, f, 'top');
  const bodyClip = doc.clip(body);
  let inner = p.pattern === 'estampa' ? '' : pat;
  if (p.pattern === 'estampa') inner += clipped(bodyClip, pat);
  if (sg) {
    for (const side of [-1, 1] as const) inner += clipped(bodyClip, strokeEl(sleeveInnerEdge(f, side, sg), r.line, SW, 1, 'butt'));
    inner += clipped(bodyClip, armholeSeam(f, r, ease));
  }
  inner += bodyFolds(f, r, ease, hemY);
  if (st.panels) {
    // painéis laterais em outra cor (rashguard, camiseta UV)
    const c2 = mix(p.color, contrast(p.color), 0.55);
    for (const side of [-1, 1] as const) {
      inner += fillEl(smooth([[CX + side * (f.chest - 3), f.yArmpit + 2], [CX + side * (f.chest + 9), f.yArmpit], [CX + side * (f.hip + 9), hemY + 2], [CX + side * (f.waist - 2), hemY + 2]]), c2, 0.9);
    }
  }
  if (st.sheen) inner += sheen(f, r);
  doc.group(parts, r, { shift: CLOTH_SHIFT, inner, sw: 1.7 });
  topDetails(doc, f, st, r, p, hemY, sg, o);
  if (!sg || sg.t1 < f.tFront + 0.05) return [];
  return [
    {
      path: (side, t0) => sleeveD(f, side, sg, t0),
      t1: sg.t1,
      ramp: r,
      shift: CLOTH_SHIFT,
      under: [body],
      ...(p.pattern === 'listrado' || p.pattern === 'xadrez' ? { inner: pat } : {}),
      details: (dd, side) => cuff(dd, f, side, sg, r, st.cuffs ?? 'plain', p),
    },
  ];
}

function cuff(doc: Doc, f: Fig, side: -1 | 1, sg: SleeveGeom, r: Ramp, kind: 'rib' | 'button' | 'plain', p: OutfitPiece): void {
  const axis = sleeveAxis(f, side, sg);
  if (kind === 'rib') {
    doc.stroke(across(axis, sg.t1 - 0.06, 0), r.line, 1, 0.55);
    for (const u of [-0.5, 0, 0.5]) {
      const a = offsetAt(axis, sg.t1 - 0.055, u);
      const b = offsetAt(axis, sg.t1 - 0.005, u);
      doc.stroke(`M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`, r.shade, 1, 0.9);
    }
  } else if (kind === 'button') {
    doc.stroke(across(axis, sg.t1 - 0.07, 0), r.line, 1, 0.5);
    const b = offsetAt(axis, sg.t1 - 0.035, side * 0.45);
    doc.fill(ellipse(b[0], b[1], 1.1, 1.1), mix(r.line, r.base, 0.4));
  } else {
    doc.stroke(across(axis, sg.t1 - 0.045, 0), r.line, 0.9, 0.4);
  }
  if (p.id === 'farda_tatica') {
    const a = along(axis, 0.3);
    doc.region(smooth([[a.x - 4, a.y - 3, 1], [a.x + 4, a.y - 3, 1], [a.x + 4, a.y + 4, 1], [a.x - 4, a.y + 4, 1]]), ramp(mix(p.color, '#000000', 0.1)), { flat: true, sw: 0.9 });
  }
}

function topDetails(doc: Doc, f: Fig, st: TopStyle, r: Ramp, p: OutfitPiece, hemY: number, sg: SleeveGeom | null, o: TopOpts): void {
  const line = r.line;
  const bs = f.bs;
  const nk = neckline(f, st.neck, st.ease ?? 2);
  // ribana da gola
  if (st.neck === 'crew' || st.neck === 'high') {
    const y0 = nk.np[1] + 2.2;
    const cy = 2 * (nk.center[1] + 2.2) - y0;
    doc.stroke(`M${n(2 * CX - nk.np[0] + 1.2)} ${n(y0)}Q${CX} ${n(cy)} ${n(nk.np[0] - 1.2)} ${n(y0)}`, line, 1, 0.45);
  }
  if (st.trim) {
    const c = p.id === 'uniforme' ? '#3a5f9e' : contrast(p.color);
    if (st.neck === 'crew') doc.stroke(`M${n(2 * CX - nk.np[0] + 0.4)} ${n(nk.np[1] + 1)}Q${CX} ${n(2 * (nk.center[1] + 1) - nk.np[1] - 1)} ${n(nk.np[0] - 0.4)} ${n(nk.np[1] + 1)}`, c, 2.2);
    if (st.sleeve === 'short' && sg) for (const side of [-1, 1] as const) doc.stroke(across(sleeveAxis(f, side, sg), sg.t1 - 0.03, -0.6), c, 2.2, 1, 'butt');
    if (st.sleeve === 'none') {
      // vivo na cava e no decote (regata de treino)
      const yb = f.yArmpit + 5 * bs;
      for (const side of [-1, 1] as const) {
        const sx0 = nk.np[0] + (st.strap ?? 6) * f.ws;
        const xb = Math.min(sideX(f, yb, st.ease ?? 2), armInnerX(f, yb)) - 1.4;
        const sy0 = trapY(f, sx0, st.ease ?? 2) + 1.6;
        const m = (x: number) => CX + side * (x - CX);
        doc.stroke(`M${n(m(sx0 - 0.6))} ${n(sy0)}Q${n(m(lerp(sx0, xb, 0.42)))} ${n(lerp(sy0, yb, 0.62))} ${n(m(xb))} ${n(yb)}`, c, 1.8, 0.95);
      }
      doc.stroke(`M${n(2 * CX - nk.np[0] + 1.4)} ${n(nk.np[1] + 1.4)}Q${CX} ${n(2 * (nk.center[1] + 1.2) - nk.np[1] - 1.4)} ${n(nk.np[0] - 1.4)} ${n(nk.np[1] + 1.4)}`, c, 1.8, 0.95);
    }
  }
  if (st.sleeve === 'short' && sg && !st.trim) for (const side of [-1, 1] as const) doc.stroke(across(sleeveAxis(f, side, sg), sg.t1 - 0.04, -0.4), line, 0.9, 0.4);
  if (st.sleeve === 'puff' && sg) for (const side of [-1, 1] as const) doc.stroke(across(sleeveAxis(f, side, sg), sg.t1 - 0.035, -0.6), line, 1, 0.5);
  if (st.buttons) {
    const top = nk.center[1] + 1;
    const bottom = Math.min(hemY, f.yHip) - 2;
    doc.stroke(`M${CX + 0.5} ${n(top)}L${CX + 0.5} ${n(st.buttons <= 2 ? top + 14 * bs : bottom)}`, line, 0.9, 0.45);
    const step = st.buttons <= 2 ? 6 * bs : (bottom - top - 4) / (st.buttons - 1);
    for (let i = 0; i < st.buttons; i++) doc.fill(ellipse(CX + 2.6, top + 3 + i * step, 1.15, 1.15), mix(r.line, r.base, 0.35));
  }
  if (st.pockets === 'chest1' || st.pockets === 'chest2') {
    for (const side of st.pockets === 'chest2' ? ([-1, 1] as const) : ([-1] as const)) {
      const x = CX + side * f.chest * 0.5;
      const y = f.yChest - 5 * bs;
      const w = 6 * f.ws;
      doc.region(poly([[x - w, y], [x + w, y], [x + w, y + 9 * bs], [x, y + 10.5 * bs], [x - w, y + 9 * bs]]), r, { flat: true, sw: 0.9 });
      doc.region(poly([[x - w - 0.6, y - 1], [x + w + 0.6, y - 1], [x + w + 0.6, y + 3 * bs], [x - w - 0.6, y + 3 * bs]]), ramp(mix(p.color, '#000000', 0.06)), { flat: true, sw: 0.9 });
    }
  }
  if (st.pockets === 'kangaroo') {
    const w = Math.min(f.waist, f.chest) * 0.62;
    const y = Math.min(f.yWaist + 6 * bs, hemY - 22 * bs);
    doc.region(smooth([[CX - w, y + 4, 1], [CX - w * 0.72, y - 4], [CX + w * 0.72, y - 4], [CX + w, y + 4, 1], [CX + w, y + 17 * bs, 1], [CX - w, y + 17 * bs, 1]]), r, { shift: [-2, -1.5], sw: 1.1 });
  }
  if (st.rib) doc.stroke(`M${n(CX - f.hip - 2)} ${n(hemY - 4 * bs)}L${n(CX + f.hip + 2)} ${n(hemY - 4 * bs)}`, line, 0.9, 0.45);
  if (st.emblem === 'school') {
    const x = CX - f.chest * 0.5;
    const y = f.yChest - 3 * bs;
    doc.region(poly([[x - 4, y - 4], [x + 4, y - 4], [x + 4, y + 1.5], [x, y + 5], [x - 4, y + 1.5]]), ramp('#3a5f9e'), { flat: true, sw: 0.9 });
    doc.fill(ellipse(x, y - 0.5, 1.6, 1.6), '#f2d27a');
  }
  if (st.emblem === 'grad') {
    // capelo estilizado no peito
    const x = CX;
    const y = f.yChest + 2 * bs;
    const c = contrast(p.color);
    doc.fill(poly([[x - 9, y], [x, y - 4.5], [x + 9, y], [x, y + 4.5]]), c);
    doc.fill(smooth([[x - 5.5, y + 2, 1], [x + 5.5, y + 2, 1], [x + 5.5, y + 6], [x, y + 8], [x - 5.5, y + 6]]), c);
    doc.stroke(`M${n(x + 6)} ${n(y)}v7`, c, 1.2);
    doc.fill(ellipse(x + 6, y + 8, 1.4, 1.6), c);
  }
  if (st.emblem === 'patch' && sg) {
    // brasão genérico na manga esquerda
    const a = along(sleeveAxis(f, -1, sg), Math.min(0.2, sg.t1 * 0.6));
    const c = p.id === 'farda_tatica' ? '#6b7280' : '#d9b24a';
    doc.region(poly([[a.x - 3.6, a.y - 4], [a.x + 3.6, a.y - 4], [a.x + 3.6, a.y + 1.5], [a.x, a.y + 5], [a.x - 3.6, a.y + 1.5]]), ramp(c), { flat: true, sw: 0.8 });
  }
  if (st.tag) doc.region(poly([[CX + f.chest * 0.25, f.yChest + 5 * bs], [CX + f.chest * 0.75, f.yChest + 5 * bs], [CX + f.chest * 0.75, f.yChest + 8 * bs], [CX + f.chest * 0.25, f.yChest + 8 * bs]]), ramp('#1d2230'), { flat: true, sw: 0.6 });
  if (st.epaulettes) {
    for (const side of [-1, 1] as const) {
      const a: Pt = [CX + side * (f.neck + 4), f.yNeck + 0.5];
      const b: Pt = [CX + side * (f.shoulder - f.rDelt * 0.35), f.yShoulder - f.trap * 0.4 + 2.5];
      const er = ramp(mix(p.color, '#000000', 0.1));
      doc.region(poly([[a[0], a[1] - 1.6], [b[0], b[1] - 2.2], [b[0], b[1] + 2.2], [a[0], a[1] + 1.8]]), er, { flat: true, sw: 0.9 });
      doc.fill(ellipse(a[0] + side * 1.5, a[1], 1, 1), '#d9b24a');
    }
  }
  if (o.tie) {
    const tr = ramp('#7a1d2b');
    const y0 = f.yNeck + 1;
    const y1 = f.yWaist + 2 * bs;
    doc.region(poly([[CX - 3, y0], [CX + 3, y0], [CX + 2, y0 + 5], [CX - 2, y0 + 5]]), tr, { flat: true, sw: 0.9 });
    doc.region(poly([[CX - 2, y0 + 5], [CX + 2, y0 + 5], [CX + 5, y1 - 4], [CX, y1 + 1], [CX - 5, y1 - 4]]), tr, { shift: [-1.5, 0], sw: 0.9 });
  }
  if (st.collar) collar(doc, f, p, st.collar);
  if (st.hood) hood(doc, f, r);
}

function collar(doc: Doc, f: Fig, p: OutfitPiece, kind: 'shirt' | 'polo' | 'mandarin'): void {
  const lr = ramp(mix(p.color, '#ffffff', 0.1));
  const nw = f.neck;
  const y = f.yNeck;
  if (kind === 'mandarin') {
    doc.region(smooth([[CX - nw - 2, y - 5, 1], [CX + nw + 2, y - 5, 1], [CX + nw + 3, y + 1], [CX + 2, y + 4, 1], [CX - 2, y + 4, 1], [CX - nw - 3, y + 1]]), lr, { flat: true, sw: 1.1 });
    return;
  }
  const big = kind === 'shirt' ? 1 : 0.9;
  for (const side of [-1, 1] as const) {
    const d = poly([
      [CX + side * (nw + 1.2), y - 5],
      [CX + side * (nw + 7.5 * big), y + 1.5],
      [CX + side * (nw * 0.42 + 2.5), y + 9.5 * big],
      [CX + side * 0.6, y + 8],
      [CX + side * 1.5, y + 2.5],
      [CX + side * (nw - 1.5), y - 2],
    ]);
    doc.region(d, lr, { flat: true, sw: 1.1 });
  }
}

function hood(doc: Doc, f: Fig, r: Ramp): void {
  const nw = f.neck;
  const y = f.yNeck;
  const d = smooth([
    [CX - nw - 10, y - 2],
    [CX - nw - 3, y - 8],
    [CX + nw + 3, y - 8],
    [CX + nw + 10, y - 2],
    [CX + nw + 8.5, y + 4],
    [CX + 4, y + 11],
    [CX - 4, y + 11],
    [CX - nw - 8.5, y + 4],
  ]);
  const inner = smooth([[CX - nw - 2.5, y - 3], [CX, y + 6.5], [CX + nw + 2.5, y - 3], [CX + nw, y - 5], [CX - nw, y - 5]]);
  doc.group([`${d}${inner}`], r, { shift: [-2.5, -2], sw: 1.2, evenodd: true });
  doc.stroke(`M${n(CX - 4)} ${n(y + 9)}l-0.8 ${n(16 * f.bs)}M${n(CX + 4)} ${n(y + 9)}l0.8 ${n(15 * f.bs)}`, mix(r.base, '#f2efe8', 0.75), 1.4);
  doc.fill(ellipse(CX - 4.8, y + 9 + 16 * f.bs, 1.1, 1.6), mix(r.base, '#f2efe8', 0.75));
  doc.fill(ellipse(CX + 4.8, y + 9 + 15 * f.bs, 1.1, 1.6), mix(r.base, '#f2efe8', 0.75));
}

// ——— parte de baixo ———

interface BottomKind {
  len: number;
  ease: number;
  flare?: number;
  fly?: boolean;
  pockets?: boolean;
  crease?: boolean;
  cuff?: 'gather' | 'roll' | 'hem';
  cargo?: boolean;
  band?: 'contrast' | 'elastic' | 'plain';
  slit?: boolean;
  belt?: boolean;
  drawstring?: boolean;
  stripe?: boolean;
}
const BOTTOMS: Record<string, BottomKind> = {
  calca_jeans: { len: 1, ease: 2.2, fly: true, pockets: true, cuff: 'hem', band: 'plain' },
  calca_moletom: { len: 1, ease: 3.4, cuff: 'gather', band: 'elastic', drawstring: true },
  calca_social: { len: 1, ease: 2.6, crease: true, band: 'plain' },
  calca_farda: { len: 1, ease: 3.2, cargo: true, band: 'plain', belt: true },
  bermuda: { len: 0.5, ease: 3.0, pockets: true, cuff: 'roll', band: 'plain', fly: true },
  bermuda_praia: { len: 0.47, ease: 3.6, band: 'elastic', drawstring: true, slit: true },
  bermuda_infantil: { len: 0.47, ease: 3.2, band: 'elastic', drawstring: true },
  shorts: { len: 0.27, ease: 2.6, band: 'plain', cuff: 'hem' },
  shorts_luta: { len: 0.42, ease: 4, flare: 2.4, band: 'contrast', slit: true, stripe: true },
};
const GENERIC_BOTTOM: BottomKind = { len: 0.5, ease: 3, band: 'plain' };

/** Eixo da perna da calça: abaixo do joelho a perna fica reta (não marca a panturrilha). */
function pantLeg(f: Fig, side: -1 | 1, len: number, ease: number, flare: number): Node[] {
  const axis = growAxis(f.leg(side), ease, flare, 0.05);
  if (len < 0.6) return axis;
  const knee = axis[4]!.r;
  return axis.map((p, i) => (i >= 4 ? { ...p, r: Math.max(p.r, knee * (i === 4 ? 1 : 0.95)) } : p));
}

export function pantsPath(f: Fig, len: number, ease: number, opts: { flare?: number; top?: number } = {}): { d: string; hems: [Pt, Pt][]; yTop: number } {
  const L = limb(pantLeg(f, -1, len, ease, opts.flare ?? 0), 0, len, 0, { steps: 10 });
  const R = limb(pantLeg(f, 1, len, ease, opts.flare ?? 0), 0, len, 0, { steps: 10 });
  const yTop = opts.top ?? f.yHip - 12 * f.bs;
  const topHalf = sideX(f, yTop, ease) - CX;
  const cut = f.yCrotch + 3;
  const lOut = L.left.filter((p) => p[1] > yTop + 4);
  const rOut = R.right.filter((p) => p[1] > yTop + 4);
  const lIn = L.right.filter((p) => p[1] > cut);
  const rIn = R.left.filter((p) => p[1] > cut);
  const lo = L.left[L.left.length - 1]!;
  const li = L.right[L.right.length - 1]!;
  const ri = R.left[R.left.length - 1]!;
  const ro = R.right[R.right.length - 1]!;
  const crotchY = Math.min(f.yCrotch + 2, Math.min(lo[1], ro[1]) - 2);
  const pts: Pt[] = [
    [CX - topHalf, yTop, 1],
    ...lOut.slice(0, -1),
    [lo[0], lo[1], 1],
    [li[0], li[1], 1],
    ...[...lIn].reverse().slice(1),
    [CX, crotchY, 1],
    ...rIn.slice(0, -1),
    [ri[0], ri[1], 1],
    [ro[0], ro[1], 1],
    ...[...rOut].reverse().slice(1),
    [CX + topHalf, yTop, 1],
  ];
  return { d: smooth(pts), hems: [[lo, li], [ri, ro]], yTop };
}

/** Cinto com fivela. */
export function drawBelt(doc: Doc, f: Fig, y: number, ease: number, color = '#3a2a20'): void {
  const w = sideX(f, y + 2, ease) - CX + 0.6;
  const h = 4.2 * f.bs + 1;
  doc.region(smooth([[CX - w, y, 1], [CX + w, y, 1], [CX + w, y + h, 1], [CX - w, y + h, 1]]), ramp(color), { flat: true, sw: 1 });
  doc.region(smooth([[CX - 3.5, y - 0.8, 1], [CX + 3.5, y - 0.8, 1], [CX + 3.5, y + h + 0.8, 1], [CX - 3.5, y + h + 0.8, 1]]), ramp('#c9a54a'), { flat: true, sw: 0.9 });
}

export function drawBottom(doc: Doc, f: Fig, p: OutfitPiece, o: { belt?: boolean } = {}): void {
  const r = ramp(p.color);
  if (p.id === 'saia') return skirt(doc, f, p, r);
  if (p.id === 'sunga') return brief(doc, f, r, p);
  const k = BOTTOMS[p.id] ?? GENERIC_BOTTOM;
  const pp = pantsPath(f, k.len, k.ease, k.flare ? { flare: k.flare } : {});
  const bs = f.bs;
  let inner = patternInner(p, r, f, 'bottom');
  // dobras: virilha, joelho (calça comprida)
  for (const side of [-1, 1] as const) {
    const a = along(f.leg(side), 0.1);
    inner += strokeEl(`M${n(CX + side * 3)} ${n(f.yCrotch - 2)}Q${n(a.x)} ${n(f.yCrotch - 6 * bs)} ${n(a.x + side * a.r * 0.6)} ${n(f.yCrotch - 12 * bs)}`, r.shade, 1.2, 0.8);
    if (k.len >= 1) {
      const kn = along(f.leg(side), f.tKnee);
      inner += strokeEl(`M${n(kn.x - 4)} ${n(kn.y - 2)}q4 2.2 8 -1M${n(kn.x - 3)} ${n(kn.y + 3)}q3 1.5 6 -0.5`, r.shade, 1.2, 0.85);
    }
    if (k.stripe) {
      const a0 = offsetAt(growAxis(f.leg(side), k.ease, k.flare ?? 0, 0.05), 0.02, side * 0.92);
      const a1 = offsetAt(growAxis(f.leg(side), k.ease, k.flare ?? 0, 0.05), k.len, side * 0.92);
      inner += strokeEl(`M${n(a0[0])} ${n(a0[1])}L${n(a1[0])} ${n(a1[1])}`, contrast(p.color), 3.2, 0.9);
    }
    if (k.cargo) {
      const c = along(f.leg(side), 0.48);
      const cx = c.x + side * c.r * 0.35;
      inner += `<path d="${smooth([[cx - 6, c.y - 6, 1], [cx + 6, c.y - 6, 1], [cx + 6, c.y + 8, 1], [cx - 6, c.y + 8, 1]])}" fill="${r.shade}" opacity="0.55"/>`;
      inner += strokeEl(`M${n(cx - 6.5)} ${n(c.y - 3)}h13`, r.line, 0.9, 0.6);
    }
  }
  doc.group([pp.d], r, { shift: [-4, -1.2], inner, sw: 1.7 });
  const yTop = pp.yTop;
  const half = sideX(f, yTop, k.ease) - CX;
  if (k.band === 'contrast') doc.region(smooth([[CX - half, yTop - 0.5, 1], [CX + half, yTop - 0.5, 1], [CX + half + 0.2, yTop + 6 * bs, 1], [CX - half - 0.2, yTop + 6 * bs, 1]]), ramp(contrast(p.color)), { flat: true, sw: 1 });
  else doc.stroke(`M${n(CX - half + 1)} ${n(yTop + 4.5 * bs)}L${n(CX + half - 1)} ${n(yTop + 4.5 * bs)}`, r.line, 0.9, 0.5);
  if (k.band === 'elastic') doc.stroke(`M${n(CX - half + 2)} ${n(yTop + 2.2 * bs)}L${n(CX + half - 2)} ${n(yTop + 2.2 * bs)}`, r.shade, 1, 0.9);
  if (k.drawstring) doc.stroke(`M${CX - 2} ${n(yTop + 4.6 * bs)}q-1 6 -3 ${n(10 * bs)}M${CX + 2} ${n(yTop + 4.6 * bs)}q1 6 3 ${n(9 * bs)}`, mix(r.base, '#f2efe8', 0.75), 1.3);
  if (k.fly) doc.stroke(`M${CX + 1} ${n(yTop + 5 * bs)}Q${CX + 4} ${n(f.yCrotch - 5)} ${CX + 0.5} ${n(f.yCrotch - 1)}`, r.line, 0.9, 0.5);
  if (k.pockets)
    for (const side of [-1, 1] as const) doc.stroke(`M${n(CX + side * (half - 8 * f.ws))} ${n(yTop + 5 * bs)}Q${n(CX + side * (half - 6 * f.ws))} ${n(yTop + 12 * bs)} ${n(CX + side * (half + 0.5))} ${n(yTop + 13 * bs)}`, r.line, 0.9, 0.5);
  if (k.crease)
    for (const side of [-1, 1] as const) {
      const a = along(f.leg(side), 0.14);
      const b = along(f.leg(side), 0.985);
      doc.stroke(`M${n(a.x)} ${n(a.y + 4)}L${n(b.x)} ${n(b.y)}`, r.shade, 1.1, 0.9);
    }
  for (const [a, b] of pp.hems) {
    if (k.cuff === 'roll') doc.stroke(`M${n(a[0] + 0.6)} ${n(a[1] - 4.5)}L${n(b[0] - 0.6)} ${n(b[1] - 4.5)}`, r.line, 1, 0.55);
    else if (k.cuff === 'hem' && k.len < 1) doc.stroke(`M${n(a[0] + 1)} ${n(a[1] - 3)}L${n(b[0] - 1)} ${n(b[1] - 3)}`, r.line, 0.8, 0.45);
    else if (k.cuff === 'gather') doc.stroke(`M${n(a[0] + 1)} ${n(a[1] - 5)}L${n(b[0] - 1)} ${n(b[1] - 5)}`, r.line, 0.9, 0.5);
  }
  if (k.slit)
    for (const [a, b] of pp.hems) {
      const outer = a[0] < CX ? a : b;
      const sgn = outer[0] < CX ? 1 : -1;
      doc.stroke(`M${n(outer[0] + sgn * 0.8)} ${n(outer[1] - 0.5)}l${n(sgn * 2.4)} ${n(-7 * bs)}`, r.line, 1, 0.7);
    }
  if (o.belt || k.belt) drawBelt(doc, f, yTop - 0.5, k.ease, p.id === 'calca_farda' ? '#1b1d22' : '#3a2a20');
}

/** Sunga (só 18+ pela engine; aqui, sempre com a camiseta de reserva por cima). */
function brief(doc: Doc, f: Fig, r: Ramp, p: OutfitPiece): void {
  const yTop = f.yHip - 7 * f.bs;
  const half = sideX(f, yTop, 1.4) - CX;
  const legY = f.yCrotch + 5 * f.bs;
  const d = smooth([
    [CX - half, yTop, 1],
    [CX + half, yTop, 1],
    [CX + f.hip + 1.6, f.yHip + 4 * f.bs],
    [CX + f.hip * 0.86, legY, 1],
    [CX + 5, legY + 2],
    [CX - 5, legY + 2],
    [CX - f.hip * 0.86, legY, 1],
    [CX - f.hip - 1.6, f.yHip + 4 * f.bs],
  ]);
  doc.group([d], r, { shift: [-3, -1.5], sw: 1.6, inner: strokeEl(`M${n(CX - half)} ${n(yTop + 3)}H${n(CX + half)}`, r.line, 0.9, 0.5) });
  void p;
}

function skirt(doc: Doc, f: Fig, p: OutfitPiece, r: Ramp): void {
  const yTop = f.yHip - 14 * f.bs;
  const top = sideX(f, yTop, 2) - CX;
  const hemY = f.yKnee - 4 * f.bs;
  const hem = f.hip + 13 * f.ws + f.fat * 4;
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
  const pleats = strokeEl(`M${n(CX - hem * 0.45)} ${n(hemY + 1.5)}L${n(CX - f.hip * 0.4)} ${n(f.yHip + 10)}M${n(CX + hem * 0.15)} ${n(hemY + 2.8)}L${n(CX + f.hip * 0.12)} ${n(f.yHip + 12)}M${n(CX + hem * 0.62)} ${n(hemY + 1)}L${n(CX + f.hip * 0.58)} ${n(f.yHip + 10)}`, r.shade, 1.4, 0.9);
  doc.group([d], r, { shift: [-5, -1.5], inner: patternInner(p, r, f, 'bottom') + pleats, sw: 1.7 });
  doc.stroke(`M${n(CX - top + 1)} ${n(yTop + 5 * f.bs)}L${n(CX + top - 1)} ${n(yTop + 5 * f.bs)}`, r.line, 0.9, 0.45);
}

// ——— inteira ———

export function drawWhole(doc: Doc, f: Fig, p: OutfitPiece, o: { belt?: OutfitPiece | undefined } = {}): FrontSleeve[] {
  const r = ramp(p.color);
  switch (p.id) {
    case 'vestido':
    case 'vestido_festa':
      dress(doc, f, p, r);
      return [];
    case 'kimono':
      return kimono(doc, f, p, r, o.belt);
    case 'macacao':
      return overalls(doc, f, p, r);
    case 'uniforme_presidiario':
      return jumpsuit(doc, f, p, r);
    case 'biquini':
      bikini(doc, f, r);
      return [];
    case 'maio':
    case 'maio_infantil':
      swimsuit(doc, f, r, p.id === 'maio_infantil');
      return [];
    case 'body':
      onesie(doc, f, r);
      return [];
    default: {
      // genérico: calça + camiseta na cor da peça
      drawBottom(doc, f, { ...p, id: 'calca_jeans' });
      return drawTop(doc, f, { ...p, id: 'camiseta' });
    }
  }
}

function dress(doc: Doc, f: Fig, p: OutfitPiece, r: Ramp): void {
  const party = p.id === 'vestido_festa';
  const bs = f.bs;
  const hemY = party ? f.yAnkle - 12 * bs : f.yKnee + 2 * bs;
  const hemW = f.hip + (party ? 17 : 14) * f.ws + f.fat * 4;
  const hem: Pt[] = [[CX + hemW * 0.55, hemY + 3], [CX, hemY + 3.6]];
  const body = torsoPiece(f, { ease: 1.8, hemY, neck: party ? 'boat' : 'scoop', sleeveless: (party ? 4 : 5.5) * f.ws, flare: hemW - f.hip - 1.8, hem });
  let inner = patternInner(p, r, f, 'top') + bodyFolds(f, r, 1.8, f.yWaist);
  inner += strokeEl(`M${n(CX - hemW * 0.5)} ${n(hemY + 1)}L${n(CX - f.hip * 0.45)} ${n(f.yHip + 8)}M${n(CX + hemW * 0.1)} ${n(hemY + 2.5)}L${n(CX + f.hip * 0.08)} ${n(f.yHip + 10)}M${n(CX + hemW * 0.62)} ${n(hemY + 1)}L${n(CX + f.hip * 0.55)} ${n(f.yHip + 8)}`, r.shade, 1.4, 0.9);
  if (party) inner += sheen(f, r, 0.8) + strokeEl(`M${n(CX - f.hip * 0.7)} ${n(f.yHip + 20 * bs)}q-3 ${n(40 * bs)} -1 ${n(90 * bs)}`, r.light, 2.6, 0.4);
  doc.group([body], r, { shift: [-5, -2], inner, sw: 1.7 });
  // cintura marcada (faixa)
  const sash = ramp(party ? mix(p.color, '#ffffff', 0.25) : mix(p.color, '#000000', 0.12));
  const w = sideX(f, f.yWaist, 1.8) - CX;
  doc.region(smooth([[CX - w, f.yWaist - 3, 1], [CX + w, f.yWaist - 3, 1], [CX + w + 0.2, f.yWaist + 3, 1], [CX - w - 0.2, f.yWaist + 3, 1]]), sash, { flat: true, sw: 0.9 });
  if (party) doc.fill(ellipse(CX - w * 0.55, f.yWaist, 3.2, 2.6), sash.light);
}

function kimono(doc: Doc, f: Fig, p: OutfitPiece, r: Ramp, belt: OutfitPiece | undefined): FrontSleeve[] {
  const bs = f.bs;
  const pants = pantsPath(f, 0.93, 3.6);
  doc.group([pants.d], r, { shift: [-4, -1.2], sw: 1.7 });
  const ease = 3.4;
  const hemY = f.yHip + 16 * bs;
  const sg: SleeveGeom = { t1: 0.86, ease: ease + 1, flare: 3 };
  const body = torsoPiece(f, { ease, hemY, neck: 'wrap' });
  const parts = [body, sleeveD(f, -1, sg), sleeveD(f, 1, sg)];
  const bodyClip = doc.clip(body);
  let inner = '';
  for (const side of [-1, 1] as const) inner += clipped(bodyClip, strokeEl(sleeveInnerEdge(f, side, sg), r.line, SW, 1, 'butt'));
  inner += bodyFolds(f, r, ease, hemY);
  // tecido trançado (textura discreta)
  for (let y = f.yArmpit; y < hemY; y += 7) inner += strokeEl(`M${n(CX - f.chest - 6)} ${n(y)}H${n(CX + f.chest + 6)}`, r.shade, 0.6, 0.35);
  doc.group(parts, r, { shift: CLOTH_SHIFT, inner, sw: 1.7 });
  // lapelas: a esquerda do personagem (direita da imagem) por cima
  const lap = ramp(mix(p.color, '#000000', 0.08));
  const nkR: Pt = [CX + f.neck + 2.6, f.yNeck - 1.8];
  const nkL: Pt = [CX - f.neck - 2.6, f.yNeck - 1.8];
  const cross: Pt = [CX, f.yChest - 3 * bs];
  const w = 5.2 * f.ws;
  const band = (a: Pt, b: Pt, ext: number) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = (-dy / l) * w;
    const ny = (dx / l) * w;
    const bb: Pt = [b[0] + (dx / l) * ext, b[1] + (dy / l) * ext];
    return poly([[a[0], a[1]], [bb[0], bb[1]], [bb[0] - nx, bb[1] - ny], [a[0] - nx, a[1] - ny]]);
  };
  doc.region(band(nkL, cross, 2), lap, { flat: true, sw: 1.2 });
  doc.region(band(nkR, [CX - 6 * f.ws, f.yWaist + 4 * bs], 0).replace(/Z$/, 'Z'), lap, { flat: true, sw: 1.2 });
  doc.stroke(`M${n(CX - 6 * f.ws)} ${n(f.yWaist + 4 * bs)}Q${n(CX - 8 * f.ws)} ${n(f.yHip)} ${n(CX - 6 * f.ws)} ${n(hemY + 1)}`, r.line, 1.3, 0.7);
  drawObiBelt(doc, f, belt ?? { id: 'faixa', color: p.color === '#f7f5f0' ? '#f1f1ee' : '#f1f1ee', pattern: 'liso' }, ease);
  return [{ path: (side, t0) => sleeveD(f, side, sg, t0), t1: sg.t1, ramp: r, shift: CLOTH_SHIFT, under: [body], details: (dd, side) => dd.stroke(across(sleeveAxis(f, side, sg), sg.t1 - 0.05, 0), r.line, 1, 0.5) }];
}

/** Faixa de jiu-jitsu/judô na cor da graduação, com a listra (faixas infantis) e o nó com as pontas. */
export function drawObiBelt(doc: Doc, f: Fig, p: OutfitPiece, ease = 3.4): void {
  const r = ramp(p.color);
  const bs = f.bs;
  const y = f.yWaist + 8 * bs;
  const h = 6.4 * bs + 1;
  const w = sideX(f, y, ease) - CX + 1.2;
  const stripe = p.accent;
  const sY = y - h * 0.17;
  const sH = h * 0.34;
  const bandD = smooth([[CX - w, y - h / 2, 1], [CX + w, y - h / 2, 1], [CX + w + 0.3, y + h / 2, 1], [CX - w - 0.3, y + h / 2, 1]]);
  const inStripe = stripe ? `<rect x="0" y="${n(sY)}" width="200" height="${n(sH)}" fill="${stripe}"/>` : '';
  doc.group([bandD], r, { shift: [-2, -1.2], sw: 1.2, inner: inStripe });
  // pontas (caindo em V) e nó
  const tails = [
    poly([[CX - 2.5, y + 1], [CX - 8.5 * f.ws, y + 19 * bs], [CX - 3 * f.ws, y + 21 * bs], [CX + 1.5, y + 2]]),
    poly([[CX + 1, y + 1], [CX + 5 * f.ws, y + 20 * bs], [CX + 10.5 * f.ws, y + 18 * bs], [CX + 4, y + 1]]),
  ];
  const tailStripe = stripe
    ? strokeEl(`M${n(CX - 1)} ${n(y + 2)}L${n(CX - 5.8 * f.ws)} ${n(y + 20 * bs)}`, stripe, 2 * bs + 0.4) + strokeEl(`M${n(CX + 2.5)} ${n(y + 2)}L${n(CX + 7.7 * f.ws)} ${n(y + 19 * bs)}`, stripe, 2 * bs + 0.4)
    : '';
  doc.group(tails, r, { shift: [-1.5, -1], sw: 1.1, inner: tailStripe });
  const knot = smooth([[CX - 5, y - h / 2 - 0.6], [CX + 5, y - h / 2 - 0.6], [CX + 5.5, y + h / 2 + 0.6], [CX - 5.5, y + h / 2 + 0.6]]);
  doc.group([knot], r, { shift: [-1.5, -1], sw: 1.1, inner: stripe ? `<rect x="0" y="${n(sY)}" width="200" height="${n(sH)}" fill="${stripe}"/>` : '' });
  doc.stroke(`M${n(CX - 3)} ${n(y - h / 2 + 0.5)}l2 ${n(h - 1)}M${n(CX + 1.5)} ${n(y - h / 2 + 0.5)}l2 ${n(h - 1)}`, r.line, 0.8, 0.5);
}

function overalls(doc: Doc, f: Fig, p: OutfitPiece, r: Ramp): FrontSleeve[] {
  // camiseta clara por baixo (o macacão jeans nunca aparece sobre a pele nua)
  const tee = drawTop(doc, f, { id: 'camiseta', color: '#ece6da', pattern: 'liso' });
  const pp = pantsPath(f, 1, 2.8, { top: f.yWaist - 2 * f.bs });
  const bs = f.bs;
  const bibTop = f.yChest - 6 * bs;
  const bw = f.chest * 0.55;
  const bib = smooth([[CX - bw, bibTop, 1], [CX + bw, bibTop, 1], [CX + bw + 1, f.yWaist + 2, 1], [CX - bw - 1, f.yWaist + 2, 1]]);
  const straps: string[] = [];
  for (const side of [-1, 1] as const) {
    const a: Pt = [CX + side * (bw - 1), bibTop + 1];
    const b: Pt = [CX + side * (f.neck + 6 * f.ws), f.yNeck + 1];
    const sw = 3.6 * f.ws;
    straps.push(poly([[a[0] - sw, a[1]], [b[0] - sw, b[1]], [b[0] + sw, b[1] - 1], [a[0] + sw, a[1]]]));
  }
  let inner = '';
  for (const side of [-1, 1] as const) {
    const kn = along(f.leg(side), f.tKnee);
    inner += strokeEl(`M${n(kn.x - 4)} ${n(kn.y - 2)}q4 2.2 8 -1`, r.shade, 1.2, 0.85);
  }
  doc.group([pp.d, bib, ...straps], r, { shift: [-4, -1.2], sw: 1.7, inner });
  doc.region(smooth([[CX - bw * 0.55, bibTop + 5 * bs, 1], [CX + bw * 0.55, bibTop + 5 * bs, 1], [CX + bw * 0.55, bibTop + 14 * bs], [CX, bibTop + 16 * bs], [CX - bw * 0.55, bibTop + 14 * bs]]), r, { flat: true, sw: 0.9 });
  for (const side of [-1, 1] as const) doc.fill(ellipse(CX + side * (bw - 1), bibTop + 2.5, 1.7, 1.7), '#d9b24a');
  void p;
  return tee;
}

function jumpsuit(doc: Doc, f: Fig, p: OutfitPiece, r: Ramp): FrontSleeve[] {
  const pp = pantsPath(f, 1, 3.2, { top: f.yWaist });
  doc.group([pp.d], r, { shift: [-4, -1.2], sw: 1.7, inner: (() => { let s = ''; for (const side of [-1, 1] as const) { const kn = along(f.leg(side), f.tKnee); s += strokeEl(`M${n(kn.x - 4)} ${n(kn.y - 2)}q4 2.2 8 -1`, r.shade, 1.2, 0.85); } return s; })() });
  const s = drawTop(doc, f, { ...p, id: '__macacao' }, { tucked: false });
  // zíper central do macacão e número genérico
  doc.stroke(`M${CX} ${n(f.yNeck + 15 * f.bs)}V${n(f.yCrotch - 4)}`, r.line, 1, 0.55);
  doc.region(smooth([[CX + f.chest * 0.2, f.yChest - 1, 1], [CX + f.chest * 0.75, f.yChest - 1, 1], [CX + f.chest * 0.75, f.yChest + 5 * f.bs, 1], [CX + f.chest * 0.2, f.yChest + 5 * f.bs, 1]]), ramp('#f4efe2'), { flat: true, sw: 0.7 });
  doc.stroke(`M${n(CX + f.chest * 0.28)} ${n(f.yChest + 2.2 * f.bs)}h${n(f.chest * 0.4)}`, '#3a3a46', 1.1, 0.8);
  return s;
}

/** Biquíni (só 18+): top esportivo largo e calcinha de cintura média; nada de detalhe anatômico. */
function bikini(doc: Doc, f: Fig, r: Ramp): void {
  const bs = f.bs;
  const top = torsoPiece(f, { ease: 1.2, hemY: f.yChest + 7 * bs, neck: 'scoop', bandTop: f.yArmpit - 3 * bs });
  const straps: string[] = [];
  for (const side of [-1, 1] as const) {
    const a: Pt = [CX + side * f.chest * 0.55, f.yArmpit - 2 * bs];
    const b: Pt = [CX + side * (f.neck + 5 * f.ws), f.yNeck + 0.5];
    const w = 2.4 * f.ws;
    straps.push(poly([[a[0] - w, a[1]], [b[0] - w, b[1]], [b[0] + w, b[1]], [a[0] + w, a[1]]]));
  }
  doc.group([top, ...straps], r, { shift: [-3, -1.5], sw: 1.6, inner: strokeEl(`M${CX} ${n(f.yArmpit - 2 * bs)}V${n(f.yChest + 6 * bs)}`, r.shade, 1.4, 0.7) });
  briefBottom(doc, f, r, f.yHip - 8 * bs);
}

function briefBottom(doc: Doc, f: Fig, r: Ramp, yTop: number): void {
  const half = sideX(f, yTop, 1.4) - CX;
  const legY = f.yCrotch + 8 * f.bs;
  const d = smooth([
    [CX - half, yTop, 1],
    [CX + half, yTop, 1],
    [CX + f.hip + 1.6, f.yHip + 4 * f.bs],
    [CX + f.hip * 0.95, legY, 1],
    [CX + 6, legY + 2.5],
    [CX - 6, legY + 2.5],
    [CX - f.hip * 0.95, legY, 1],
    [CX - f.hip - 1.6, f.yHip + 4 * f.bs],
  ]);
  doc.group([d], r, { shift: [-3, -1.5], sw: 1.6 });
}

function swimsuit(doc: Doc, f: Fig, r: Ramp, kid: boolean): void {
  const bs = f.bs;
  const legY = f.yCrotch + (kid ? 8 : 7) * bs;
  const hem: Pt[] = [[CX + f.hip + 1.6, f.yHip + 4 * bs], [CX + f.hip * 0.95, legY, 1], [CX + 6, legY + 2.5], [CX, legY + 2.6]];
  const body = torsoPiece(f, { ease: 1.2, hemY: f.yHip + 2 * bs, neck: kid ? 'crew' : 'scoop', sleeveless: (kid ? 6.5 : 5) * f.ws, hem });
  const inner = bodyFolds(f, r, 1.2, f.yWaist) + (kid ? '' : strokeEl(`M${n(CX - f.waist - 2)} ${n(f.yWaist)}Q${CX} ${n(f.yWaist + 3)} ${n(CX + f.waist + 2)} ${n(f.yWaist)}`, contrast(r.base), 2.4, 0.6));
  doc.group([body], r, { shift: [-4, -1.5], sw: 1.6, inner });
  if (kid) {
    // babadinho na cintura
    const w = sideX(f, f.yHip - 2, 1.2) - CX + 3;
    const y = f.yHip - 2;
    let d = `M${n(CX - w)} ${n(y)}`;
    for (let i = 0; i < 6; i++) d += `q${n(w / 6)} ${n(6 * bs)} ${n(w / 3)} 0`;
    doc.region(`${d}L${n(CX + w)} ${n(y - 4 * bs)}L${n(CX - w)} ${n(y - 4 * bs)}Z`, ramp(mix(r.base, '#ffffff', 0.25)), { flat: true, sw: 1 });
  }
}

function onesie(doc: Doc, f: Fig, r: Ramp): void {
  const bs = f.bs;
  const legY = f.yCrotch + 4 * bs;
  const hem: Pt[] = [[CX + f.hip + 1.6, f.yHip + 2 * bs], [CX + f.hip * 0.9, legY - 2, 1], [CX + 5, legY + 2], [CX, legY + 2.4]];
  const sg: SleeveGeom = { t1: 0.3, ease: 2.6 };
  const body = torsoPiece(f, { ease: 2, hemY: f.yHip, neck: 'crew', hem });
  let inner = '';
  for (const side of [-1, 1] as const) inner += strokeEl(armpitFold(f, side, 2), r.shade, 1.4, 0.9);
  doc.group([body, sleeveD(f, -1, sg), sleeveD(f, 1, sg)], r, { shift: [-3.5, -1.5], sw: 1.7, inner });
  // botões de pressão e estampa de bichinho
  for (const u of [-3, 0, 3]) doc.fill(ellipse(CX + u, legY - 1, 0.9, 0.9), mix(r.line, r.base, 0.4));
  const c = mix(r.base, '#ffffff', 0.55);
  doc.fill(ellipse(CX, f.yChest + 4 * bs, 5, 4.4), c);
  doc.fill(ellipse(CX - 3.6, f.yChest + 0.6 * bs, 1.8, 1.8), c);
  doc.fill(ellipse(CX + 3.6, f.yChest + 0.6 * bs, 1.8, 1.8), c);
  for (const side of [-1, 1] as const) doc.stroke(across(sleeveAxis(f, side, sg), sg.t1 - 0.04, -0.4), r.line, 0.9, 0.4);
}

// ——— agasalho ———

export function drawOuter(doc: Doc, f: Fig, p: OutfitPiece, under: { armEase: number }): FrontSleeve[] {
  const r = ramp(p.color);
  const bs = f.bs;
  const id = p.id;
  const vest = id === 'colete_pm' || id === 'colete_civil';
  if (vest) {
    ballisticVest(doc, f, p, r, under.armEase);
    return [];
  }
  const suit = id === 'terno' || id === 'cronos_terno';
  const robe = id === 'roupao' || id === 'saida_praia';
  const coat = id === 'casaco';
  const leather = id === 'arara_jaqueta';
  const ease = robe ? 5 : 4.4;
  const hemY = robe ? f.yKnee - (id === 'saida_praia' ? 2 : 6) * bs : coat ? f.yCrotch + 34 * bs : suit ? f.yCrotch + 2 * bs : f.yHip + 7 * bs;
  const sg: SleeveGeom = robe ? { t1: id === 'saida_praia' ? 0.8 : 0.9, ease: ease + 1.2, flare: 3.4 } : { t1: suit ? 0.955 : 0.975, ease: ease + 0.6 + under.armEase * 0.3 };
  // painéis da frente: aberto até a barra (jaqueta, casaco, saída de praia) ou fechado na cintura (terno, roupão)
  const closeY = suit ? f.yWaist - 2 * bs : id === 'roupao' ? f.yWaist + 4 * bs : null;
  const gap = id === 'saida_praia' ? 10 * f.ws : coat ? 3.5 : leather || id === 'jaqueta' ? 2.2 : 0;
  const lapelY = suit ? f.yChest - 2 * bs : id === 'roupao' ? f.yChest + 2 * bs : coat ? f.yChest - 6 * bs : f.yNeck + 8 * bs;
  const T = torsoSide(f, ease);
  const panels: string[] = [];
  for (const side of [-1, 1] as const) {
    const sideR: Pt[] = [[CX + f.neck + 2.2, f.yNeck - 2.2, 1], T[1]!, T[2]!, T[3]!];
    for (let y = T[3]![1] + 8; y < hemY - 3; y += 8) sideR.push([sideX(f, y, ease) + (y > f.yHip ? (y - f.yHip) * (robe ? 0.12 : 0.04) : 0), y]);
    const xh = sideX(f, hemY, ease) + (hemY > f.yHip ? (hemY - f.yHip) * (robe ? 0.12 : 0.04) : 0);
    sideR.push([xh, hemY, 1]);
    const front: Pt[] = closeY !== null
      ? [[CX - 4, hemY + 1, 1], [CX - 3, closeY + 6, 1], [CX + 1.5, closeY, 1], [CX + f.neck * 0.5 + 6, lapelY - 4], [CX + f.neck + 0.6, f.yNeck + 1, 1]]
      : [[CX + gap, hemY + 1, 1], [CX + gap, lapelY + 4, 1], [CX + gap + f.neck * 0.6, lapelY - 6], [CX + f.neck + 0.6, f.yNeck + 1, 1]];
    const pts: Pt[] = [...sideR, ...front];
    const sidePts = side > 0 ? pts : pts.map((q): Pt => (q[2] ? [2 * CX - q[0], q[1], 1] : [2 * CX - q[0], q[1]]));
    panels.push(smooth(sidePts));
  }
  const sleeves = [sleeveD(f, -1, sg), sleeveD(f, 1, sg)];
  const unionClip = doc.clip(panels);
  let inner = '';
  for (const side of [-1, 1] as const) inner += clipped(unionClip, strokeEl(sleeveInnerEdge(f, side, sg), r.line, SW, 1, 'butt'));
  inner += clipped(unionClip, armholeSeam(f, r, ease));
  if (leather || id === 'roupao' || id === 'cronos_terno') inner += sheen(f, r, leather ? 1 : 0.8);
  if (f.fat > 0.5) inner += strokeEl(`M${n(CX + f.waist * 0.5)} ${n(f.yWaist + 14 * bs)}q${n(f.waist * 0.4)} 4 ${n(f.waist * 0.6)} -2`, r.shade, 1.5, 0.7);
  doc.group([...panels, ...sleeves], r, { shift: CLOTH_SHIFT, inner, sw: 1.7 });
  // borda da frente da peça de baixo do traspasse (terno, roupão)
  if (closeY !== null) doc.stroke(`M${n(CX + 1.5)} ${n(closeY)}L${n(CX + 3)} ${n(closeY + 6)}L${n(CX + 4)} ${n(hemY + 1)}`, r.line, 1.4, 0.75);
  // lapelas
  const lap = ramp(mix(p.color, id === 'roupao' ? '#ffffff' : '#000000', id === 'roupao' ? 0.18 : 0.1));
  for (const side of [-1, 1] as const) {
    const m = (x: number) => CX + side * (x - CX);
    if (suit || coat || id === 'roupao') {
      const fx = closeY !== null ? CX + 1.5 : CX + gap;
      const fy = closeY ?? lapelY + 4;
      doc.region(poly([[m(CX + f.neck + 0.6), f.yNeck + 1], [m(fx), fy], [m(CX + f.neck * 0.5 + 6 + (id === 'roupao' ? 5 : 0)), lapelY - 4], [m(CX + f.neck + 8.5), lapelY - 14 * bs], [m(CX + f.neck + 4), f.yNeck - 1.5]]), lap, { flat: true, sw: 1 });
    } else if (id === 'jaqueta' || leather) {
      doc.region(poly([[m(CX + f.neck + 1), f.yNeck - 4], [m(CX + f.neck + 9), f.yNeck + 2], [m(CX + gap + f.neck * 0.6 + 2), lapelY - 2], [m(CX + gap + 0.5), lapelY + 3], [m(CX + f.neck - 1), f.yNeck - 1]]), lap, { flat: true, sw: 1 });
    }
  }
  // fecho, botões, bolsos, barra
  if (id === 'jaqueta' || leather) {
    for (const side of [-1, 1] as const) doc.stroke(`M${n(CX + side * (gap + 1.6))} ${n(lapelY + 4)}V${n(hemY - 1)}`, mix(r.base, '#d8d4cc', 0.55), 1, 0.8);
    doc.stroke(`M${n(CX - f.hip - ease)} ${n(hemY - 5 * bs)}H${n(CX - gap)}M${n(CX + gap)} ${n(hemY - 5 * bs)}H${n(CX + f.hip + ease)}`, r.line, 0.9, 0.5);
    for (const side of [-1, 1] as const) doc.stroke(`M${n(CX + side * f.chest * 0.42)} ${n(f.yWaist + 2 * bs)}l${n(side * 2)} ${n(10 * bs)}`, r.line, 1, 0.55);
  }
  if (suit) {
    doc.fill(ellipse(CX + 2.6, closeY! + 4, 1.5, 1.5), r.line);
    for (const side of [-1, 1] as const) doc.stroke(`M${n(CX + side * f.waist * 0.45)} ${n(f.yHip - 2 * bs)}h${n(side * 10 * f.ws)}`, r.line, 1.1, 0.6);
    doc.stroke(`M${n(CX + f.chest * 0.35)} ${n(f.yChest - 4 * bs)}h${n(8 * f.ws)}`, r.line, 1, 0.55);
    if (id === 'cronos_terno') doc.fill(poly([[CX + f.chest * 0.38, f.yChest - 4 * bs], [CX + f.chest * 0.38 + 3, f.yChest - 8 * bs], [CX + f.chest * 0.38 + 5.5, f.yChest - 4.5 * bs], [CX + f.chest * 0.38 + 8, f.yChest - 7.5 * bs], [CX + f.chest * 0.38 + 8, f.yChest - 4 * bs]]), '#e3b52f');
  }
  if (coat) {
    for (const k of [0, 1, 2]) doc.fill(ellipse(CX + gap + 3, lapelY + 8 + k * 16 * bs, 1.5, 1.5), r.line);
    for (const side of [-1, 1] as const) doc.stroke(`M${n(CX + side * f.hip * 0.55)} ${n(f.yHip + 6 * bs)}h${n(side * 11 * f.ws)}`, r.line, 1.1, 0.6);
  }
  if (id === 'roupao' || id === 'saida_praia') {
    // faixa amarrada na cintura
    const y = f.yWaist + 4 * bs;
    const w = sideX(f, y, ease) - CX + 0.5;
    const br = ramp(id === 'roupao' ? mix(p.color, '#000000', 0.15) : mix(p.color, '#c9a57a', 0.4));
    doc.region(smooth([[CX - w, y - 2.4, 1], [CX + w, y - 2.4, 1], [CX + w, y + 2.6, 1], [CX - w, y + 2.6, 1]]), br, { flat: true, sw: 1 });
    doc.region(poly([[CX + 4, y + 1], [CX + 1, y + 18 * bs], [CX + 5, y + 19 * bs], [CX + 7, y + 1]]), br, { flat: true, sw: 0.9 });
    doc.region(poly([[CX + 6, y + 1], [CX + 10, y + 16 * bs], [CX + 13, y + 15 * bs], [CX + 8.5, y]]), br, { flat: true, sw: 0.9 });
  }
  return [
    {
      path: (side, t0) => sleeveD(f, side, sg, t0),
      t1: sg.t1,
      ramp: r,
      shift: CLOTH_SHIFT,
      under: panels,
      details: (dd, side) => dd.stroke(across(sleeveAxis(f, side, sg), sg.t1 - (robe ? 0.06 : 0.07), 0), r.line, 1, 0.55),
    },
  ];
}

/** Colete balístico (PM, força especial) e colete preto com distintivo (Civil): sem mangas, por cima da camisa. */
function ballisticVest(doc: Doc, f: Fig, p: OutfitPiece, r: Ramp, armEase: number): void {
  const bs = f.bs;
  const civil = p.id === 'colete_civil';
  const hemY = f.yHip - (civil ? 0 : 2) * bs;
  const body = torsoPiece(f, { ease: armEase + 1.2, hemY, neck: civil ? 'v' : 'crew', sleeveless: (civil ? 6 : 8) * f.ws, armEase: armEase + 0.4 });
  let inner = '';
  if (!civil) {
    // placas, alças e bolsos
    inner += strokeEl(`M${n(CX - f.chest * 0.75)} ${n(f.yArmpit + 6 * bs)}H${n(CX + f.chest * 0.75)}`, r.line, 1, 0.5);
    for (let i = -2; i <= 2; i++) {
      const x = CX + i * f.chest * 0.32;
      inner += `<rect x="${n(x - 5.5 * f.ws)}" y="${n(f.yWaist - 2 * bs)}" width="${n(11 * f.ws)}" height="${n(12 * bs)}" rx="1.5" fill="${r.shade}" stroke="${r.line}" stroke-width="0.8"/>`;
    }
    inner += `<rect x="0" y="${n(f.yChest - 2 * bs)}" width="200" height="${n(3.2 * bs)}" fill="#9aa0a6" opacity="0.55"/>`;
  } else {
    inner += strokeEl(`M${CX} ${n(f.yNeck + 15 * bs)}V${n(hemY)}`, r.line, 1, 0.6);
  }
  doc.group([body], r, { shift: [-3.5, -1.5], sw: 1.7, inner });
  // distintivo (estrela/escudo genérico dourado) no peito esquerdo do personagem
  const bx = CX + f.chest * 0.45;
  const by = f.yChest - 4 * bs;
  const s = 4.6 * f.ws;
  const star: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const rr = i % 2 ? s * 0.45 : s;
    star.push([bx + Math.cos(a) * rr, by + Math.sin(a) * rr]);
  }
  doc.region(poly(star), ramp('#d9b24a'), { flat: true, sw: 0.8 });
  doc.fill(ellipse(bx, by, s * 0.32, s * 0.32), '#a8812a');
}
