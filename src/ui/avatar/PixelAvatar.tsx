/**
 * Avatar em pixel art: corpo inteiro (perfil, guarda-roupa, criação) ou busto (topo da tela principal).
 * Animação leve (respiração em 2 quadros e piscar) só quando `animate`, respeitando prefers-reduced-motion.
 */
import { useEffect, useMemo, useState } from 'react';
import type { AvatarDescriptor } from '../../engine';
import PixelCanvas from './pixel/PixelCanvas';
import { PixelAvatarRenderer as R } from './renderer';
import { renderAvatar } from './pixel/render';
import { useAvatarStyle } from './style';
import VectorAvatar from './vector/VectorAvatar';

/** Altura do corpo inteiro em pixel art. */
const PIXEL_H = 64;

function reducedMotion(): boolean {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Avatar do visual ativo (release 0.0.3): cartoon vetorial (padrão) ou pixel art. Mantém o nome e a API (`scale` em
 * pixels de arte) para não mexer nos chamadores; no cartoon a altura na tela é a mesma do pixel art.
 */
export default function PixelAvatar(props: { d: AvatarDescriptor; scale: number; bust?: boolean; animate?: boolean; label?: string; className?: string }) {
  const style = useAvatarStyle();
  if (style === 'cartoon') {
    const { d, scale, bust = false, animate = false, label, className = '' } = props;
    const h = (bust ? R.bust(d).h : PIXEL_H) * scale;
    return <VectorAvatar d={d} size={h} bust={bust} animate={animate} label={label ?? 'Avatar'} className={className} />;
  }
  return <PixelArtAvatar {...props} />;
}

function PixelArtAvatar({ d, scale, bust = false, animate = false, label, className = '' }: { d: AvatarDescriptor; scale: number; bust?: boolean; animate?: boolean; label?: string; className?: string }) {
  const [frame, setFrame] = useState<0 | 1>(0);
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!animate || reducedMotion()) return;
    const breathe = setInterval(() => setFrame((f) => (f ? 0 : 1)), 900);
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        schedule();
      }, 3000 + Math.random() * 3000);
    };
    schedule();
    return () => {
      clearInterval(breathe);
      clearTimeout(t);
    };
  }, [animate]);
  // o renderizador de pixel art sempre devolve `kind: 'pixel'`
  const img = useMemo(() => renderAvatar(d, { frame, blink }), [d, frame, blink]);
  const crop = bust ? R.bust(d) : undefined;
  return <PixelCanvas img={img} scale={scale} label={label ?? 'Avatar'} className={className} {...(crop ? { crop } : {})} />;
}
