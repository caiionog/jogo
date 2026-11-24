/**
 * Minigames da release 0.0.4 (fase 7): escolhe a tela pelo tipo. Pênalti em `PenaltyGame`; finalização, passe,
 * goleiro e MMA aqui. Toda tela tem tutorial, "Simular" e versão sem animação (`prefers-reduced-motion`).
 * O resultado vem da engine (`minigamePreview`) e é o mesmo que `finishMinigame` aplica.
 */
import { useEffect, useRef, useState } from 'react';
import type { GameState, GoalieResult, MinigameInput, MmaAnswer, MmaInput, MmaResult, MmaSetup, PassResult, PassSetup, ShotResult, ShotSetup } from '../../engine';
import { GOALIE, MMA, PASS, SHOT, minigamePreview } from '../../engine';
import { DsButton } from '../design/components';
import { useGameStore } from '../store';
import PenaltyGame from './PenaltyGame';

function useReducedMotion(): boolean {
  const [r] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  return r;
}

/** Valor que vai e volta entre 0 e 1 enquanto `on` (sem animação: fica parado e o jogador usa o controle). */
function useOscillator(on: boolean, period = 1400): [number, (v: number) => void] {
  const [v, setV] = useState(0.5);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!on) return;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = ((t - t0) % period) / period;
      setV(p < 0.5 ? p * 2 : 2 - p * 2);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [on, period]);
  return [v, setV];
}

function Shell({ title, tutorial, children }: { title: string; tutorial: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" role="dialog" aria-modal="true" aria-label={title} data-testid="minigame">
      <div className="w-full max-w-md rounded-t-[var(--ds-radius-lg)] bg-[var(--ds-bg)] p-4 sm:rounded-[var(--ds-radius-lg)]">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mb-2 text-sm text-[var(--ds-text-muted)]" data-testid="minigame-tutorial">{tutorial}</p>
        {children}
      </div>
    </div>
  );
}

function Done({ text, success, onOk }: { text: string; success: boolean; onOk: () => void }) {
  return (
    <div className="mt-3 text-center">
      <p className={`text-2xl font-bold ${success ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-danger)]'}`} data-testid="minigame-result">{text}</p>
      <DsButton tone="primary" full testId="minigame-ok" onClick={onOk}>Continuar</DsButton>
    </div>
  );
}

export default function MinigameModal({ game }: { game: GameState }) {
  const mg = game.minigame!;
  if (mg.kind === 'penalty') return <PenaltyGame game={game} />;
  if (mg.kind === 'shot') return <ShotGame game={game} setup={mg.setup} />;
  if (mg.kind === 'pass') return <PassGame game={game} setup={mg.setup} />;
  if (mg.kind === 'goalie') return <GoalieGame game={game} />;
  return <MmaGame game={game} setup={mg.setup} />;
}

function useFinish(game: GameState) {
  const finish = useGameStore((s) => s.finishMinigame);
  const [input, setInput] = useState<MinigameInput | null | undefined>(undefined);
  const result = input !== undefined ? minigamePreview(game, input) : null;
  return { input, setInput, result, ok: () => finish(input ?? null) };
}

function ShotGame({ game, setup }: { game: GameState; setup: ShotSetup }) {
  const reduced = useReducedMotion();
  const { input, setInput, result, ok } = useFinish(game);
  const [pos, setPos] = useOscillator(input === undefined && !reduced, 1100);
  const r = result as ShotResult | null;
  const marker = r ? r.landed : pos;
  return (
    <Shell title={SHOT.label} tutorial={SHOT.tutorial}>
      <div className="relative h-14 w-full overflow-hidden rounded-[var(--ds-radius)] bg-[#15803d]" data-testid="shot-bar" onPointerDown={() => input === undefined && setInput({ at: pos })}>
        <div className="absolute inset-y-0 bg-[#4ade80]/70" style={{ left: `${(setup.gap - setup.width / 2) * 100}%`, width: `${setup.width * 100}%` }} />
        <div className="absolute inset-y-1 w-2 rounded bg-white shadow" style={{ left: `calc(${marker * 100}% - 4px)` }} />
      </div>
      {reduced && input === undefined && <input type="range" min={0} max={100} value={Math.round(pos * 100)} onChange={(e) => setPos(Number(e.target.value) / 100)} className="mt-2 w-full" aria-label="Posição do chute" />}
      {input === undefined ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <DsButton testId="minigame-simulate" onClick={() => setInput(null)}>Simular</DsButton>
          <DsButton tone="primary" testId="minigame-go" onClick={() => setInput({ at: pos })}>Chutar</DsButton>
        </div>
      ) : (
        r && <Done text={r.success ? 'No canto! GOL!' : 'Não entrou.'} success={r.success} onOk={ok} />
      )}
    </Shell>
  );
}

function PassGame({ game, setup }: { game: GameState; setup: PassSetup }) {
  const reduced = useReducedMotion();
  const { input, setInput, result, ok } = useFinish(game);
  const [lane, setLane] = useState<number | null>(null);
  const [power, setPower] = useOscillator(lane !== null && input === undefined && !reduced, 1500);
  const r = result as PassResult | null;
  const TEXT: Record<PassResult['outcome'], string> = { certo: 'Passe perfeito!', cortado: 'Cortaram o passe!', forte: 'Forte demais!', fraco: 'Fraco demais!' };
  return (
    <Shell title={PASS.label} tutorial={PASS.tutorial}>
      <svg viewBox="0 0 300 160" className="w-full rounded-[var(--ds-radius)] bg-[#15803d]" data-testid="pass-field">
        <circle cx="150" cy="150" r="9" fill="#facc15" />
        {setup.lanes.map((l, i) => {
          const x = 50 + i * 100;
          const y = 140 - l.distance * 120;
          return (
            <g key={i} onPointerDown={() => input === undefined && setLane(i)} style={{ cursor: 'pointer' }} data-testid={`pass-lane-${i}`}>
              <line x1="150" y1="150" x2={x} y2={y} stroke="#ffffff" strokeOpacity={lane === i ? 0.9 : 0.25} strokeWidth="3" strokeDasharray="6 5" />
              <circle cx={x} cy={y} r="11" fill={lane === i ? '#facc15' : '#fde68a'} stroke="#111827" />
              <circle cx={x + (l.marker < 0.5 ? 30 : 14) * (i === 2 ? -1 : 1)} cy={y + 6} r="9" fill="#ef4444" opacity={0.4 + l.marker * 0.6} />
            </g>
          );
        })}
      </svg>
      {input === undefined && (
        <>
          <div className="mt-2 flex justify-between text-xs text-[var(--ds-text-muted)]">
            <span>{lane === null ? 'Toque num companheiro' : reduced ? 'Ajuste a força' : 'Toque em Passar para parar a força'}</span>
            <span>Força</span>
          </div>
          {reduced && lane !== null ? (
            <input type="range" min={0} max={100} value={Math.round(power * 100)} onChange={(e) => setPower(Number(e.target.value) / 100)} className="w-full" aria-label="Força do passe" />
          ) : (
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--ds-surface-2)]" aria-hidden><div className="h-full rounded-full bg-[var(--ds-accent)]" style={{ width: `${power * 100}%` }} /></div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <DsButton testId="minigame-simulate" onClick={() => setInput(null)}>Simular</DsButton>
            <DsButton tone="primary" testId="minigame-go" disabled={lane === null} onClick={() => setInput({ lane: lane ?? 0, power })}>Passar</DsButton>
          </div>
        </>
      )}
      {r && <Done text={TEXT[r.outcome]} success={r.success} onOk={ok} />}
    </Shell>
  );
}

const ZONE_NAMES = ['baixo à esquerda', 'baixo no meio', 'baixo à direita', 'alto à esquerda', 'alto no meio', 'alto à direita'];

function GoalieGame({ game }: { game: GameState }) {
  const { input, setInput, result, ok } = useFinish(game);
  const setup = game.minigame!.setup as unknown as { tellZone: number };
  const r = result as GoalieResult | null;
  return (
    <Shell title={GOALIE.label} tutorial={GOALIE.tutorial}>
      <p className="mb-2 text-sm" data-testid="goalie-tell">O batedor olhou para o canto {ZONE_NAMES[setup.tellZone]}.</p>
      <div className="grid grid-cols-3 gap-1 rounded-[var(--ds-radius)] border-4 border-white bg-[#15803d] p-1" data-testid="goalie-goal">
        {[3, 4, 5, 0, 1, 2].map((z) => (
          <button
            key={z}
            type="button"
            disabled={input !== undefined}
            onClick={() => setInput({ zone: z })}
            aria-label={`Pular ${ZONE_NAMES[z]}`}
            className={`min-h-[52px] rounded text-xs font-semibold ${r && r.shotZone === z ? 'bg-white text-[#111827]' : 'bg-[#166534] text-white'}`}
            data-testid={`goalie-zone-${z}`}
          >
            {r && r.shotZone === z ? '⚽' : ''}
          </button>
        ))}
      </div>
      {input === undefined ? (
        <div className="mt-3"><DsButton full testId="minigame-simulate" onClick={() => setInput(null)}>Simular</DsButton></div>
      ) : (
        r && <Done text={r.outcome === 'defesa' ? 'DEFENDEU!' : r.outcome === 'fora' ? 'Pra fora! Ufa.' : 'Gol do adversário.'} success={r.success} onOk={ok} />
      )}
    </Shell>
  );
}

const ATTACK_TELL: Record<string, string> = { jab: 'ombro da frente se mexe (parece um jab)', chute: 'quadril gira (parece um chute)', queda: 'abaixa o nível (parece uma queda)' };
const ANSWERS: { id: MmaAnswer; label: string }[] = [{ id: 'esquiva', label: 'Esquivar' }, { id: 'bloqueio', label: 'Bloquear' }, { id: 'sprawl', label: 'Sprawl' }];

function MmaGame({ game, setup }: { game: GameState; setup: MmaSetup }) {
  const { input, setInput, result, ok } = useFinish(game);
  const [answers, setAnswers] = useState<MmaAnswer[]>([]);
  const r = result as MmaResult | null;
  const round = answers.length;
  const pick = (a: MmaAnswer) => {
    const next = [...answers, a];
    setAnswers(next);
    if (next.length === 3) setInput({ answers: next as MmaInput['answers'] });
  };
  return (
    <Shell title={MMA.label} tutorial={MMA.tutorial}>
      {input === undefined ? (
        <>
          <p className="text-sm" data-testid="mma-round">Troca {round + 1} de 3: o parceiro {ATTACK_TELL[setup.tells[round]!]}.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {ANSWERS.map((a) => <DsButton key={a.id} testId={`mma-${a.id}`} onClick={() => pick(a.id)}>{a.label}</DsButton>)}
          </div>
          <div className="mt-2"><DsButton full testId="minigame-simulate" onClick={() => setInput(null)}>Simular</DsButton></div>
        </>
      ) : (
        r && (
          <>
            <p className="text-center text-sm" data-testid="mma-rounds">{r.rounds.map((w, i) => `Troca ${i + 1}: ${w ? 'você' : 'parceiro'}`).join(' · ')}</p>
            <Done text={r.success ? `Venceu ${r.won} de 3!` : `Perdeu: ${r.won} de 3.`} success={r.success} onOk={ok} />
          </>
        )
      )}
    </Shell>
  );
}

