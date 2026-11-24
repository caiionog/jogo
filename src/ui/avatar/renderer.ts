/**
 * Interface do renderizador de avatar (Etapa 8). O PixelAvatarRenderer consome o mesmo AvatarDescriptor da engine;
 * um renderizador futuro (ex.: sprites PNG de artista) só precisa implementar esta interface.
 */
import type { AvatarDescriptor } from '../../engine';
import { bustCrop, renderAvatar } from './pixel/render';
import type { PixelImage, RenderOptions } from './pixel/render';

export interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Saída de um renderizador (release 0.0.3): buffer RGBA de pixel art ou um SVG completo (string), com a moldura do
 * corpo inteiro em unidades do próprio renderizador.
 */
export type AvatarImage = { kind: 'pixel'; img: PixelImage } | { kind: 'svg'; svg: string; w: number; h: number };

/** Visual dos personagens (preferência do jogador; teste A/B da release 0.0.3). */
export type AvatarStyle = 'pixel' | 'cartoon';

export interface AvatarRenderer {
  kind: 'pixel' | 'vector';
  /** Corpo inteiro. `opts.frame`/`opts.blink`: respiração e piscar (animação leve). */
  render(d: AvatarDescriptor, opts?: RenderOptions): AvatarImage;
  /** Recorte do busto (cabeça e ombros), nas unidades da imagem de `render`. */
  bust(d: AvatarDescriptor): Crop;
  /** Imagem estática do busto (dataURL PNG ou SVG), para miniaturas em cache; '' quando não dá para gerar. */
  snapshot(d: AvatarDescriptor): string;
}

function toDataUrl(img: PixelImage, crop: Crop): string {
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = crop.w;
  c.height = crop.h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), -crop.x, -crop.y);
  return c.toDataURL('image/png');
}

export const PixelAvatarRenderer: AvatarRenderer = {
  kind: 'pixel',
  render: (d, opts) => ({ kind: 'pixel', img: renderAvatar(d, opts) }),
  bust: (d) => bustCrop(d),
  snapshot: (d) => toDataUrl(renderAvatar(d), bustCrop(d)),
};
