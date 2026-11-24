/**
 * Renderizador cartoon vetorial (release 0.0.3; visual padrão do jogo). Consome o mesmo `AvatarDescriptor` da pixel
 * art e devolve um SVG completo em camadas (`data-layer`), montado por paths em código. Determinístico: nada de
 * aleatório, e os ids internos vêm do hash do descriptor.
 *
 * Ordem das camadas: sombra no chão → cabelo de trás → pele (uma peça só) → calçado → parte de baixo → inteira / parte
 * de cima (corpo + mangas) → [parte de cima por dentro da calça: a calça vem depois] → coturno → agasalho →
 * acessórios do corpo → antebraços e mãos (por cima de tudo, com a parte de baixo das mangas) → rabo de cavalo →
 * orelhas → cabeça → rosto → barba → mechas → franja/topo → acessórios da cabeça.
 *
 * REGRA: sempre vestido. Sem parte de cima nem inteira → camiseta; sem parte de baixo nem inteira → bermuda.
 */
import type { AvatarDescriptor, OutfitPiece } from '../../../engine';
import type { AvatarRenderer, Crop } from '../renderer';
import type { RenderOptions } from '../pixel/render';
import { CX, VIEW_H, VIEW_W, drawFrontArm, drawGroundShadow, drawSkin, figure } from './body';
import type { FrontSleeve } from './body';
import { drawBelt, drawBottom, drawObiBelt, drawOuter, drawTop, drawWhole, tucked } from './clothes';
import { n } from './geom';
import { hairPlan } from './hair';
import { drawBeard, drawEars, drawFace, drawHead, faceOf } from './head';
import { agedSkin, ramp } from './palette';
import { Doc } from './svg';
import { BOOTS_OVER_PANTS, drawAccessoryHead, drawCuffs, drawPrajied, drawShoes } from './wear';

export { VIEW_H, VIEW_W };

function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Peças de reserva: o avatar nunca aparece sem roupa. */
export const FALLBACK_TOP: OutfitPiece = { id: 'camiseta', color: '#e9e4d8', pattern: 'liso' };
export const FALLBACK_BOTTOM: OutfitPiece = { id: 'bermuda', color: '#4f6d8f', pattern: 'liso' };

/** Roupa efetivamente desenhada (com as reservas): sempre parte de cima + de baixo, ou inteira. */
export function wornLayers(d: AvatarDescriptor): { inteira?: OutfitPiece; cima?: OutfitPiece; baixo?: OutfitPiece } {
  const o = d.outfit;
  if (o.inteira) return { inteira: o.inteira };
  return { cima: o.cima ?? FALLBACK_TOP, baixo: o.baixo ?? FALLBACK_BOTTOM };
}

const LONG_SLEEVE_EASE: Record<string, number> = { social: 2.8, arara_social: 2.8, xadrez: 3.4, moletom: 4.2, cronos_moletom: 4.2, rashguard: 1.4, camiseta_uv: 2.2, farda_tatica: 3.6 };

/** SVG do corpo inteiro (viewBox 0 0 200 420). */
export function renderVectorSvg(d: AvatarDescriptor, opts: RenderOptions = {}, viewBox?: Crop): string {
  const key = hash(JSON.stringify(d) + (opts.frame ? 'f' : '') + (opts.blink ? 'b' : ''));
  const doc = new Doc(`va${key}`);
  const f = figure(d);
  const skin = ramp(agedSkin(d.skin, d.elder), 'skin');
  const hair = ramp(d.hair.color, 'hair');
  const o = d.outfit;
  const plan = hairPlan(d, f, hair);
  // respiração: a cabeça e o cabelo descem 1 unidade no segundo quadro
  const breathe = opts.frame ? ` transform="translate(0 ${n(1.1)})"` : '';
  const worn = wornLayers(d);
  const shoes = o.calcado;
  const bootsLate = !!shoes && BOOTS_OVER_PANTS.has(shoes.id);

  drawGroundShadow(doc, f);
  doc.open('cabelo-tras', breathe);
  plan.back(doc);
  doc.close();

  doc.open('corpo');
  drawSkin(doc, f, skin);
  doc.close();
  if (!bootsLate) {
    doc.open('calcado');
    drawShoes(doc, f, shoes);
    doc.close();
  }

  let sleeves: FrontSleeve[] = [];
  let armEase = 0;
  const belt = o.acessorio?.id === 'faixa' ? o.acessorio : undefined;
  if (worn.inteira) {
    doc.open('roupa-inteira');
    sleeves = drawWhole(doc, f, worn.inteira, { belt });
    doc.close();
    armEase = sleeves.length ? 4.4 : 0;
  } else {
    const top = worn.cima!;
    const bottom = worn.baixo!;
    const tuck = tucked(top, bottom);
    const withTie = (o.agasalho?.id === 'terno' || o.agasalho?.id === 'cronos_terno') && (top.id === 'social' || top.id === 'arara_social');
    if (!tuck) {
      doc.open('roupa-baixo');
      drawBottom(doc, f, bottom);
      doc.close();
    }
    doc.open('roupa-cima');
    sleeves = drawTop(doc, f, top, { tucked: tuck, tie: withTie });
    doc.close();
    armEase = LONG_SLEEVE_EASE[top.id] ?? (sleeves.length ? 3 : 0);
    if (tuck) {
      doc.open('roupa-baixo');
      drawBottom(doc, f, bottom, { belt: true });
      doc.close();
    }
  }
  if (bootsLate) {
    doc.open('calcado');
    drawShoes(doc, f, shoes);
    doc.close();
  }
  if (o.agasalho) {
    doc.open('agasalho');
    sleeves = [...sleeves, ...drawOuter(doc, f, o.agasalho, { armEase })];
    doc.close();
  }
  if (o.acessorio && (o.acessorio.id === 'prajied' || (o.acessorio.id === 'faixa' && !(worn.inteira?.id === 'kimono')))) {
    doc.open('acessorio');
    if (o.acessorio.id === 'prajied') drawPrajied(doc, f, o.acessorio);
    else drawObiBelt(doc, f, o.acessorio, 3);
    doc.close();
  }
  doc.open('maos');
  for (const side of [-1, 1] as const) {
    drawFrontArm(doc, f, side, skin, sleeves);
    if (o.acessorio?.id === 'algemas') drawCuffs(doc, f, side);
  }
  doc.close();

  doc.open('cabeca', breathe);
  plan.mid(doc);
  drawEars(doc, f.head, faceOf(f.head), skin, d.marks.cauliflowerEar);
  drawHead(doc, f.head, skin);
  doc.close();
  doc.open('rosto', breathe);
  drawFace(doc, d, f.head, skin, d.hair.color, !!opts.blink);
  drawBeard(doc, d, f.head, hair);
  doc.close();
  doc.open('cabelo', breathe);
  plan.locks(doc);
  plan.front(doc);
  doc.close();
  if (o.acessorio && (o.acessorio.id === 'oculos' || o.acessorio.id === 'bone' || o.acessorio.id === 'bone_pm' || o.acessorio.id === 'capacete')) {
    const fc = faceOf(f.head);
    doc.open('acessorio-cabeca', breathe);
    drawAccessoryHead(doc, f, o.acessorio, fc.eyeY, fc.eyeDx, plan.top);
    doc.close();
  }
  void drawBelt;
  const vb = viewBox ?? { x: 0, y: 0, w: VIEW_W, h: VIEW_H };
  return doc.svg(`${n(vb.x)} ${n(vb.y)} ${n(vb.w)} ${n(vb.h)}`, ` width="${n(vb.w)}" height="${n(vb.h)}" data-avatar="cartoon"`);
}

/** Busto: cabeça e ombros (proporção 8:7, como o da pixel art). */
export function vectorBust(d: AvatarDescriptor): Crop {
  const f = figure(d);
  const h = f.head;
  const big = d.hair.style === 'black_power' ? 10 : d.hair.style === 'coque' ? 8 : 0;
  const top = Math.max(0, h.crown - (16 + big) * h.s);
  const hgt = f.yShoulder + 24 * f.bs + 6 - top;
  const w = (hgt * 8) / 7;
  const x = Math.max(0, Math.min(VIEW_W - w, CX - w / 2));
  return { x: Math.round(x * 10) / 10, y: Math.round(top * 10) / 10, w: Math.round(w * 10) / 10, h: Math.round(hgt * 10) / 10 };
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const VectorAvatarRenderer: AvatarRenderer = {
  kind: 'vector',
  render: (d, opts) => ({ kind: 'svg', svg: renderVectorSvg(d, opts), w: VIEW_W, h: VIEW_H }),
  bust: (d) => vectorBust(d),
  snapshot: (d) => svgDataUrl(renderVectorSvg(d, {}, vectorBust(d))),
};
