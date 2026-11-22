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

export interface AvatarRenderer {
  /** Corpo inteiro (32×64) como buffer RGBA. */
  render(d: AvatarDescriptor, opts?: RenderOptions): PixelImage;
  /** Recorte do busto (cabeça e ombros). */
  bust(d: AvatarDescriptor): Crop;
  /** Imagem estática (dataURL PNG) do busto, para miniaturas em cache; '' sem canvas. */
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
  render: (d, opts) => renderAvatar(d, opts),
  bust: (d) => bustCrop(d),
  snapshot: (d) => toDataUrl(renderAvatar(d), bustCrop(d)),
};
