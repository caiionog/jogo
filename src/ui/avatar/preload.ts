/** Pré-carrega os chunks do visual ativo (avatar + ícones + miniaturas) para a primeira tela já os ter. */
import type { AvatarStyle } from './renderer';

export function preloadVisual(style: AvatarStyle): Promise<unknown> {
  return Promise.all(
    style === 'cartoon'
      ? [import('./vector/VectorAvatar'), import('./vector'), import('../icons/VectorIcon')]
      : [import('./PixelArtAvatar'), import('./renderer'), import('../icons/PixelIcon')],
  ).catch(() => undefined);
}
