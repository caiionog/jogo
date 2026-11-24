/**
 * Avatar do visual ativo (release 0.0.3): cartoon vetorial (padrão) ou pixel art. Mantém o nome e a API (`scale` em
 * pixels de arte) para não mexer nos chamadores; no cartoon a altura na tela é a mesma do pixel art.
 * Cada visual vive num chunk próprio (React.lazy); o do visual ativo é pré-carregado no início (`preload.ts`), e o
 * fallback é uma caixa do mesmo tamanho, sem spinner.
 */
import { Suspense, lazy } from 'react';
import type { AvatarDescriptor } from '../../engine';
import { useAvatarStyle } from './style';

const VectorAvatar = lazy(() => import('./vector/VectorAvatar'));
const PixelArtAvatar = lazy(() => import('./PixelArtAvatar'));

/** Altura do corpo inteiro e do busto em pixels de arte (o busto em pixel art é sempre 28×28). */
const PIXEL_H = 64;
const PIXEL_W = 32;
const BUST = 28;

export default function PixelAvatar(props: { d: AvatarDescriptor; scale: number; bust?: boolean; animate?: boolean; label?: string; className?: string }) {
  const style = useAvatarStyle();
  const { d, scale, bust = false, animate = false, label, className = '' } = props;
  if (style === 'cartoon') {
    const h = (bust ? BUST : PIXEL_H) * scale;
    // busto: largura = altura × 8/7; corpo inteiro: moldura 200×420
    const w = Math.round(bust ? (h * 8) / 7 : (h * 200) / 420);
    return (
      <Suspense fallback={<div aria-hidden className={`inline-block shrink-0 ${className}`} style={{ height: h, width: w }} />}>
        <VectorAvatar d={d} size={h} bust={bust} animate={animate} label={label ?? 'Avatar'} className={className} />
      </Suspense>
    );
  }
  const s = Math.max(1, Math.round(scale));
  const w = (bust ? BUST : PIXEL_W) * s;
  const h = (bust ? BUST : PIXEL_H) * s;
  return (
    <Suspense fallback={<div aria-hidden className={`inline-block shrink-0 ${className}`} style={{ height: h, width: w }} />}>
      <PixelArtAvatar d={d} scale={scale} bust={bust} animate={animate} label={label} className={className} />
    </Suspense>
  );
}
