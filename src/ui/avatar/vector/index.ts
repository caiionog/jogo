/**
 * Renderizador cartoon vetorial (release 0.0.3). Consome o mesmo `AvatarDescriptor` da pixel art e devolve um SVG
 * completo em camadas (`data-layer`), montado por paths em código. Determinístico: nada de aleatório, e os ids internos
 * vêm do hash do descriptor.
 *
 * Ordem das camadas: sombra no chão → cabelo de trás → pernas → calçado → tronco e pescoço → parte de baixo / inteira
 * → parte de cima (com braços e mangas) → mãos → agasalho → acessórios do corpo → rabo de cavalo → orelhas → cabeça →
 * rosto → barba → mechas → franja/topo → acessórios da cabeça.
 */
import type { AvatarDescriptor, OutfitPiece } from '../../../engine';
import type { AvatarRenderer, Crop } from '../renderer';
import type { RenderOptions } from '../pixel/render';
import { CX, VIEW_H, VIEW_W, drawArms, drawGroundShadow, drawHands, drawLegs, drawNeck, drawTorso, figure } from './body';
import { drawAccessoryBody, drawAccessoryHead, drawBottom, drawOuter, drawShoes, drawTop, drawWhole } from './clothes';
import { n } from './geom';
import { hairPlan } from './hair';
import { drawBeard, drawEars, drawFace, drawHead, faceOf } from './head';
import { ramp } from './palette';
import { Doc } from './svg';

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
const FALLBACK_TOP: OutfitPiece = { id: 'camiseta', color: '#e9e4d8', pattern: 'liso' };
const FALLBACK_BOTTOM: OutfitPiece = { id: 'bermuda', color: '#4f6d8f', pattern: 'liso' };

/** SVG do corpo inteiro (viewBox 0 0 200 420). */
export function renderVectorSvg(d: AvatarDescriptor, opts: RenderOptions = {}, viewBox?: Crop): string {
  const key = hash(JSON.stringify(d) + (opts.frame ? 'f' : '') + (opts.blink ? 'b' : ''));
  const doc = new Doc(`va${key}`);
  const f = figure(d);
  const skin = ramp(d.skin, 'skin');
  const hair = ramp(d.hair.color, 'hair');
  const o = d.outfit;
  const plan = hairPlan(d, f, hair);
  const breathe = opts.frame ? ` transform="translate(0 ${n(1.2)})"` : '';

  drawGroundShadow(doc, f);
  doc.open('cabelo-tras', breathe);
  plan.back(doc);
  doc.close();

  doc.open('corpo');
  drawLegs(doc, f, skin);
  doc.close();
  doc.open('calcado');
  drawShoes(doc, f, o.calcado, skin);
  doc.close();

  doc.open('tronco', breathe);
  drawTorso(doc, f, skin);
  doc.close();

  const arms = (dd: Doc) => {
    dd.close();
    dd.open('bracos', breathe);
    drawArms(dd, f, skin);
    dd.close();
  };
  // inteira (vestido, kimono…) cobre cima e baixo; senão, cada parte com sua reserva
  if (o.inteira) {
    doc.open('roupa-inteira', breathe);
    drawWhole(doc, f, o.inteira, (dd) => {
      arms(dd);
      dd.open('roupa-inteira', breathe);
    });
    doc.close();
  } else {
    doc.open('roupa-baixo');
    drawBottom(doc, f, o.baixo ?? FALLBACK_BOTTOM);
    doc.close();
    doc.open('roupa-cima', breathe);
    drawTop(doc, f, o.cima ?? FALLBACK_TOP, {
      layerArms: (dd) => {
        arms(dd);
        dd.open('roupa-cima', breathe);
      },
    });
    doc.close();
  }
  doc.open('maos', breathe);
  drawHands(doc, f, skin);
  doc.close();
  if (o.agasalho) {
    doc.open('agasalho', breathe);
    drawOuter(doc, f, o.agasalho);
    doc.close();
  }
  if (o.acessorio) {
    doc.open('acessorio', breathe);
    drawAccessoryBody(doc, f, o.acessorio);
    doc.close();
  }

  doc.open('cabeca', breathe);
  plan.mid(doc);
  drawNeck(doc, f, skin);
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
  if (o.acessorio) {
    const fc = faceOf(f.head);
    doc.open('acessorio-cabeca', breathe);
    drawAccessoryHead(doc, f, o.acessorio, fc.eyeY, fc.eyeDx, f.head.crown - 6);
    doc.close();
  }
  const vb = viewBox ?? { x: 0, y: 0, w: VIEW_W, h: VIEW_H };
  return doc.svg(`${n(vb.x)} ${n(vb.y)} ${n(vb.w)} ${n(vb.h)}`, ` width="${n(vb.w)}" height="${n(vb.h)}" data-avatar="cartoon"`);
}

/** Busto: cabeça e ombros (proporção 8:7, como o da pixel art). */
export function vectorBust(d: AvatarDescriptor): Crop {
  const f = figure(d);
  const h = f.head;
  const top = h.crown - 22 * h.s;
  const hgt = f.yShoulder + 26 - top;
  const w = (hgt * 8) / 7;
  return { x: Math.round((CX - w / 2) * 10) / 10, y: Math.round(top * 10) / 10, w: Math.round(w * 10) / 10, h: Math.round(hgt * 10) / 10 };
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
