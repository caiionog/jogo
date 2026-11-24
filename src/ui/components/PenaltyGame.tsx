/**
 * Minigame do pênalti (release 0.0.4, fase 7). Toque no gol para mirar, toque de novo para parar a barra de força.
 * "Simular" deixa a habilidade decidir. O resultado vem da engine (`minigamePreview`), igual ao que será aplicado.
 * Com `prefers-reduced-motion`, a força vira um controle deslizante e a bola não anima.
 */
import { useEffect, useRef, useState } from 'react';
import type { GameState, PenaltyInput, PenaltyResult } from '../../engine';
import { PENALTY, minigamePreview } from '../../engine';
import { DsButton } from '../design/components';
import { useGameStore } from '../store';

const W = 320;
const H = 190;
const GX = 30;
const GY = 30;
const GW = 260;
const GH = 120;
const toPx = (x: number, y: number) => ({ px: GX + ((x + 1) / 2) * GW, py: GY + GH - y * GH });

const RESULT_TEXT: Record<PenaltyResult['outcome'], string> = {
  gol: 'GOOOL!',
  defesa: 'Defendeu!',
  fora: 'Pra fora!',
  trave: 'Na trave!',
};

function useReducedMotion(): boolean {
  const [r] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  return r;
}

export default function PenaltyGame({ game }: { game: GameState }) {
  const finish = useGameStore((s) => s.finishMinigame);
  const mg = game.minigame!;
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'aim' | 'power' | 'shot'>('aim');
  const [aim, setAim] = useState<{ x: number; y: number } | null>(null);
  const [power, setPower] = useState(0.5);
  const [input, setInput] = useState<PenaltyInput | null | undefined>(undefined);
  const [flying, setFlying] = useState(false);
  const raf = useRef<number | null>(null);

  // barra de força oscilando (sem animação com movimento reduzido)
  useEffect(() => {
    if (phase !== 'power' || reduced) return;
    const t0 = performance.now();
    const tick = (t: number) => {
      setPower(0.5 + 0.5 * Math.sin((t - t0) / 260));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [phase, reduced]);

  const result = input !== undefined ? minigamePreview<PenaltyResult>(game, input) : null;

  const shoot = (inp: PenaltyInput | null) => {
    setInput(inp);
    setPhase('shot');
    setFlying(false);
    requestAnimationFrame(() => setFlying(true));
  };

  const onGoalTap = (e: React.PointerEvent<SVGSVGElement>) => {
    if (phase === 'power') {
      shoot({ ...(aim ?? { x: 0, y: 0.3 }), power });
      return;
    }
    if (phase !== 'aim') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;
    const x = Math.max(-1.1, Math.min(1.1, ((sx - GX) / GW) * 2 - 1));
    const y = Math.max(0, Math.min(1.1, (GY + GH - sy) / GH));
    setAim({ x, y });
    if (!reduced) setPhase('power');
  };

  const shotPos = result ? toPx(result.shot.x, Math.min(1.15, result.shot.y)) : null;
  const ball = phase === 'shot' && flying && shotPos ? shotPos : { px: W / 2, py: H - 12 };
  const keeperZone = result?.keeperZone ?? -2;
  const keeperX = phase === 'shot' && flying && keeperZone >= 0 ? GX + ((keeperZone % 3) + 0.5) * (GW / 3) : W / 2;
  const keeperY = phase === 'shot' && flying && keeperZone >= 3 ? GY + 30 : GY + GH - 34;
  const aimPx = aim ? toPx(aim.x, aim.y) : null;
  const anim = reduced ? 'none' : 'all 0.7s cubic-bezier(.2,.8,.3,1)';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" role="dialog" aria-modal="true" aria-label={PENALTY.label} data-testid="penalty-game">
      <div className="w-full max-w-md rounded-t-[var(--ds-radius-lg)] bg-[var(--ds-bg)] p-4 sm:rounded-[var(--ds-radius-lg)]">
        <h2 className="text-lg font-semibold">{mg.context === 'jogo' ? 'Pênalti decisivo' : 'Treino de pênalti'}</h2>
        <p className="mb-2 text-sm text-[var(--ds-text-muted)]" data-testid="penalty-tutorial">{PENALTY.tutorial}</p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none rounded-[var(--ds-radius)] bg-[#15803d]" onPointerDown={onGoalTap} data-testid="penalty-goal">
          <rect x="0" y={GY + GH} width={W} height={H - GY - GH} fill="#166534" />
          <rect x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#ffffff" strokeWidth="5" />
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={GX + (i + 1) * (GW / 10)} y1={GY} x2={GX + (i + 1) * (GW / 10)} y2={GY + GH} stroke="#ffffff" strokeOpacity="0.18" />)}
          {Array.from({ length: 4 }, (_, i) => <line key={`h${i}`} x1={GX} y1={GY + (i + 1) * (GH / 5)} x2={GX + GW} y2={GY + (i + 1) * (GH / 5)} stroke="#ffffff" strokeOpacity="0.18" />)}
          {/* goleiro */}
          <g style={{ transition: anim, transform: `translate(${keeperX - 14}px, ${keeperY}px)` }}>
            <rect width="28" height="34" rx="6" fill="#facc15" />
            <circle cx="14" cy="-6" r="7" fill="#fcd34d" />
          </g>
          {aimPx && phase !== 'shot' && <circle cx={aimPx.px} cy={aimPx.py} r="9" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />}
          <circle cx={ball.px} cy={ball.py} r="8" fill="#ffffff" stroke="#111827" strokeWidth="1.5" style={{ transition: anim }} />
        </svg>
        {phase !== 'shot' && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-[var(--ds-text-muted)]">
              <span>{phase === 'aim' ? 'Toque no gol para mirar' : reduced ? 'Ajuste a força e chute' : 'Toque no gol para parar a força'}</span>
              <span>Força</span>
            </div>
            {reduced && phase === 'aim' && aim ? (
              <input type="range" min={0} max={100} value={Math.round(power * 100)} onChange={(e) => setPower(Number(e.target.value) / 100)} className="w-full" aria-label="Força do chute" />
            ) : (
              <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--ds-surface-2)]" aria-hidden>
                <div className="h-full rounded-full" style={{ width: `${power * 100}%`, background: power > 0.9 ? 'var(--ds-danger)' : power < 0.25 ? '#f59e0b' : 'var(--ds-accent)' }} />
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <DsButton testId="penalty-simulate" onClick={() => shoot(null)}>Simular</DsButton>
              <DsButton tone="primary" testId="penalty-shoot" disabled={!aim} onClick={() => shoot({ ...(aim ?? { x: 0, y: 0.3 }), power })}>Chutar</DsButton>
            </div>
          </div>
        )}
        {phase === 'shot' && result && (
          <div className="mt-3 text-center">
            <p className="text-2xl font-bold" data-testid="penalty-result">{RESULT_TEXT[result.outcome]}</p>
            <DsButton tone="primary" full testId="penalty-ok" onClick={() => finish(input ?? null)}>Continuar</DsButton>
          </div>
        )}
      </div>
    </div>
  );
}
