/**
 * Transição de cena íntima (release 0.0.3). Toca NO LUGAR da cena: uma cama vista de frente, com o cobertor cobrindo
 * tudo (nenhuma parte de personagem existe no desenho), a luz do quarto apaga devagar e um coração surge, pulsa uma vez
 * e some. Nada se mexe no cobertor e não há som. Um toque pula. Com prefers-reduced-motion, mostra a versão estática
 * (só o coração parado sobre a cama) por ~1 s.
 *
 * A UI não decide nada aqui: a engine só grava a cena depois das guardas de idade e da opção "Conteúdo adulto".
 */
import { useEffect, useRef, useState } from 'react';
import type { IntimacyVariant } from '../../engine';

export type IntimacyStyle = 'pixel' | 'cartoon';

/** Duração da versão animada e da estática (ms). */
export const INTIMACY_ANIM_MS = 1500;
export const INTIMACY_STATIC_MS = 1000;

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

interface Scenery {
  wall: string;
  floor: string;
  frame: string;
  blanket: string;
  blanketFold: string;
  pillow: string;
  /** Largura da cama (de frente), no viewBox de 120 × 90. */
  bedW: number;
  headH: number;
}

const SCENERY: Record<IntimacyVariant, Scenery> = {
  casa: { wall: '#3a3150', floor: '#251e33', frame: '#6b4a32', blanket: '#5b6fa8', blanketFold: '#4a5c90', pillow: '#d9d3c4', bedW: 60, headH: 18 },
  hotel: { wall: '#2c3747', floor: '#1c2430', frame: '#4a3a2e', blanket: '#cfc8b8', blanketFold: '#b3ab99', pillow: '#ece7dc', bedW: 70, headH: 24 },
  simples: { wall: '#3a3a3e', floor: '#26262a', frame: '#5a5a60', blanket: '#6f7f6a', blanketFold: '#5e6d59', pillow: '#c9c6bd', bedW: 44, headH: 14 },
  casal: { wall: '#40303a', floor: '#2a1f27', frame: '#5e3b2c', blanket: '#8a3f52', blanketFold: '#743445', pillow: '#e2dbcd', bedW: 84, headH: 22 },
};

/** Retângulo: reto no pixel, arredondado e com contorno suave no cartoon. */
function Box({ x, y, w, h, fill, cartoon, r = 3 }: { x: number; y: number; w: number; h: number; fill: string; cartoon: boolean; r?: number }) {
  return cartoon ? <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke="#00000055" strokeWidth={1} /> : <rect x={x} y={y} width={w} height={h} fill={fill} />;
}

/** Detalhes do quarto por cenário (janela, quadro, abajures, criados-mudos). */
function Room({ v, sc, cartoon }: { v: IntimacyVariant; sc: Scenery; cartoon: boolean }) {
  const left = 60 - sc.bedW / 2;
  const right = 60 + sc.bedW / 2;
  return (
    <g data-part="quarto">
      <rect x={0} y={0} width={120} height={64} fill={sc.wall} />
      <rect x={0} y={64} width={120} height={26} fill={sc.floor} />
      {v === 'casa' && (
        <>
          <Box x={8} y={10} w={20} h={18} fill="#1d2a44" cartoon={cartoon} />
          <Box x={6} y={9} w={5} h={22} fill="#7a5a78" cartoon={cartoon} r={2} />
          <Box x={25} y={9} w={5} h={22} fill="#7a5a78" cartoon={cartoon} r={2} />
          <Box x={92} y={14} w={16} h={12} fill="#5a4a3a" cartoon={cartoon} />
          <Box x={94} y={16} w={12} h={8} fill="#2f4a3a" cartoon={cartoon} r={1} />
        </>
      )}
      {v === 'hotel' && (
        <>
          <Box x={46} y={6} w={28} h={12} fill="#5a4e3e" cartoon={cartoon} />
          <Box x={48} y={8} w={24} h={8} fill="#3d4f5e" cartoon={cartoon} r={1} />
          <Box x={left - 14} y={50} w={12} h={14} fill="#3e3128" cartoon={cartoon} />
          <Box x={right + 2} y={50} w={12} h={14} fill="#3e3128" cartoon={cartoon} />
          <Box x={left - 11} y={40} w={6} h={8} fill="#b8a27a" cartoon={cartoon} r={2} />
          <Box x={right + 5} y={40} w={6} h={8} fill="#b8a27a" cartoon={cartoon} r={2} />
        </>
      )}
      {v === 'simples' && <Box x={84} y={12} w={14} h={12} fill="#1f2b3a" cartoon={cartoon} />}
      {v === 'casal' && (
        <>
          <Box x={left - 12} y={50} w={10} h={14} fill="#3a2820" cartoon={cartoon} />
          <Box x={right + 2} y={50} w={10} h={14} fill="#3a2820" cartoon={cartoon} />
          <Box x={8} y={10} w={16} h={20} fill="#1d2440" cartoon={cartoon} />
          <Box x={96} y={10} w={16} h={20} fill="#1d2440" cartoon={cartoon} />
        </>
      )}
    </g>
  );
}

/** Coração: em pixels (retângulos) ou em curva. */
function Heart({ cartoon }: { cartoon: boolean }) {
  const fill = 'var(--ds-danger, #e11d48)';
  if (cartoon) return <path d="M60 30 C 52 24, 46 18, 52 13 C 56 10, 59 12, 60 15 C 61 12, 64 10, 68 13 C 74 18, 68 24, 60 30 Z" style={{ fill }} stroke="#00000055" strokeWidth={1} />;
  // grade 7 × 6 de 2 px, centrada em x = 60
  const rows = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  return (
    <>
      {rows.flatMap((row, j) => [...row].map((c, i) => (c === 'X' ? <rect key={`${i}-${j}`} x={53 + i * 2} y={12 + j * 2} width={2} height={2} style={{ fill }} /> : null)))}
    </>
  );
}

export function IntimacyScene({ variant, style, animated }: { variant: IntimacyVariant; style: IntimacyStyle; animated: boolean }) {
  const sc = SCENERY[variant];
  const cartoon = style === 'cartoon';
  const left = 60 - sc.bedW / 2;
  const top = 64 - 10 - sc.headH; // topo da cabeceira
  const pillowW = sc.bedW >= 70 ? (sc.bedW - 12) / 2 : sc.bedW - 12;
  const pillows = sc.bedW >= 70 ? [left + 4, left + 8 + pillowW] : [left + 6];
  return (
    <svg
      viewBox="0 0 120 90"
      className="h-auto w-full max-w-[22rem]"
      shapeRendering={cartoon ? 'geometricPrecision' : 'crispEdges'}
      role="img"
      aria-label="Quarto com a luz apagando"
      data-style={style}
    >
      <Room v={variant} sc={sc} cartoon={cartoon} />
      <g data-part="cama">
        <Box x={left} y={top} w={sc.bedW} h={sc.headH + 6} fill={sc.frame} cartoon={cartoon} r={4} />
        <Box x={left - 2} y={58} w={sc.bedW + 4} h={12} fill={sc.frame} cartoon={cartoon} r={2} />
        <rect x={left} y={70} width={3} height={6} fill={sc.frame} />
        <rect x={left + sc.bedW - 3} y={70} width={3} height={6} fill={sc.frame} />
      </g>
      <g data-part="travesseiro">
        {pillows.map((x) => (
          <Box key={x} x={x} y={top + sc.headH - 4} w={pillowW} h={7} fill={sc.pillow} cartoon={cartoon} r={3} />
        ))}
      </g>
      {/* cobertor parado, cobrindo todo o colchão (sem relevo nem movimento) */}
      <g data-part="cobertor">
        <Box x={left - 1} y={top + sc.headH + 2} w={sc.bedW + 2} h={64 - (top + sc.headH + 2) + 4} fill={sc.blanket} cartoon={cartoon} r={3} />
        <rect x={left - 1} y={top + sc.headH + 2} width={sc.bedW + 2} height={3} fill={sc.blanketFold} />
      </g>
      <rect data-part="luz" x={0} y={0} width={120} height={90} fill="#05030a" className={animated ? 'ds-intimacy-dim' : undefined} opacity={animated ? undefined : 0.55} />
      <g data-part="coracao" className={animated ? 'ds-intimacy-heart' : undefined}>
        <Heart cartoon={cartoon} />
      </g>
    </svg>
  );
}

export default function IntimacyTransition({ variant, style = 'pixel', onDone }: { variant: IntimacyVariant; style?: IntimacyStyle; onDone: () => void }) {
  const [reduced] = useState(prefersReducedMotion);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btn.current?.focus();
    const t = setTimeout(() => done.current(), reduced ? INTIMACY_STATIC_MS : INTIMACY_ANIM_MS);
    return () => clearTimeout(t);
  }, [reduced]);
  return (
    <div className="fixed inset-0 z-[70] mx-auto flex w-full max-w-md items-center justify-center bg-[#05030a]" data-testid={reduced ? 'intimacy-static' : 'intimacy-anim'}>
      <IntimacyScene variant={variant} style={style} animated={!reduced} />
      <button ref={btn} type="button" aria-label="Pular" data-testid="intimacy-skip" onClick={() => done.current()} className="absolute inset-0 h-full w-full cursor-pointer bg-transparent">
        <span className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 right-0 text-center text-xs text-[#b9b3c9]">Toque para pular</span>
      </button>
    </div>
  );
}
