/**
 * Ícone do jogo no visual ativo: cartoon (SVG vetorial em `ui/icons/vector`) ou pixel art (grades de dados).
 * `size` é a largura em px; no modo pixel, é arredondada para escala inteira sobre as grades 16×16.
 * Cada visual é um chunk próprio (lazy); o fallback é uma caixa do mesmo tamanho.
 */
import { Suspense, lazy } from 'react';
import { useAvatarStyle } from '../avatar/style';

export type IconSet = 'market' | 'crime' | 'uniform' | 'faction';

const VectorIcon = lazy(() => import('./VectorIcon'));
const PixelIcon = lazy(() => import('./PixelIcon'));

export function GameIcon({ set, id, size = 32, colors, label }: { set: IconSet; id: string; size?: number; colors?: readonly [string, string]; label?: string }) {
  const style = useAvatarStyle();
  const box = style === 'pixel' ? Math.max(1, Math.round(size / 16)) * 16 : size;
  return (
    <Suspense fallback={<span aria-hidden className="inline-block shrink-0" style={{ width: box, height: box }} />}>
      {style === 'pixel' ? <PixelIcon set={set} id={id} size={size} label={label} {...(colors ? { colors } : {})} /> : <VectorIcon set={set} id={id} size={size} label={label} {...(colors ? { colors } : {})} />}
    </Suspense>
  );
}

export default GameIcon;
