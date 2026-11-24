import { useEffect, useRef, useState } from 'react';
import { GAME_CONTENT } from '../../content';
import { DECISION_TEXT, aiStrategy, getOrg } from '../../engine';
import type { ActiveFight, Strategy } from '../../engine';
import { useGameStore } from '../store';
import { Bar, money } from './fightUi';

/** Intervalo entre lances por velocidade de narração (configuração do app). */
const REVEAL_MS = { lenta: 1100, normal: 650, rapida: 220 } as const;

const CORNER: { id: Strategy; label: string; hint: string; emoji: string }[] = [
  { id: 'pressure', label: 'Pressionar', hint: 'mais volume e dano, mais cansaço', emoji: '🔥' },
  { id: 'safe', label: 'Lutar seguro', hint: 'defesa e contra-ataque', emoji: '🛡️' },
  { id: 'ground', label: 'Levar para o chão', hint: 'quedas e finalizações', emoji: '🤼' },
];

const METHOD: Record<string, string> = { KO: 'Nocaute', TKO: 'Nocaute técnico', SUB: 'Finalização', DOC: 'Interrupção médica', DEC: 'Decisão' };

export default function FightScreen({ af }: { af: ActiveFight }) {
  const chooseCorner = useGameStore((s) => s.chooseCorner);
  const skipFight = useGameStore((s) => s.skipFight);
  const closeFight = useGameStore((s) => s.closeFight);
  const speed = useGameStore((s) => s.meta.settings.fightSpeed);
  const { fight, offer } = af;
  const [shown, setShown] = useState(1);
  const logRef = useRef<HTMLDivElement>(null);
  const total = fight.log.length;
  const revealing = shown < total;

  // revela a narração lance a lance
  useEffect(() => {
    if (!revealing) return;
    const t = setTimeout(() => setShown((n) => n + 1), REVEAL_MS[speed]);
    return () => clearTimeout(t);
  }, [shown, revealing, speed]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const last = fight.log[Math.min(shown, total) - 1];
  const stamina = last?.stamina ?? [100, 100];
  const damage = last?.damage ?? [0, 0];
  const round = last?.round ?? 1;
  const org = getOrg(GAME_CONTENT, offer.orgId);
  const suggestion = aiStrategy(fight, 0);
  const result = fight.result;
  const [me, op] = fight.fighters;

  return (
    <div className="fixed inset-0 z-30 flex justify-center bg-[var(--ds-bg)]" role="dialog" aria-modal="true" data-testid="fight-screen">
      <div className="flex h-dvh w-full max-w-md flex-col">
        <header className="border-b border-[var(--ds-border)] px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <p className="text-center text-[11px] uppercase tracking-widest text-[var(--ds-text-muted)]">
            {org?.short} {offer.title && '· 🏆 Disputa de cinturão'} · Round {round}/{fight.rounds}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className={i === 1 ? 'text-right' : ''}>
                <p className={`truncate text-sm font-bold ${i === 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{(i === 0 ? me : op).fullName}</p>
                <div className="mt-1 flex flex-col gap-1" data-testid={`bars-${i}`}>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--ds-text-muted)]">
                    <span className="w-12 shrink-0">Estamina</span>
                    <Bar value={stamina[i]!} color="bg-yellow-400" className="h-2 flex-1" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--ds-text-muted)]">
                    <span className="w-12 shrink-0">Dano</span>
                    <Bar value={damage[i]!} color="bg-rose-500" className="h-2 flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </header>

        <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-3" data-testid="fight-log">
          <ul className="flex flex-col gap-2">
            {fight.log.slice(0, shown).map((l, i) => (
              <li
                key={i}
                className={`text-sm leading-snug ${
                  l.kind === 'round_start' || l.kind === 'round_end'
                    ? 'pt-1 text-center text-xs font-semibold text-amber-300'
                    : ['ko', 'tko', 'sub_win', 'knockdown', 'doctor', 'decision', 'draw'].includes(l.kind)
                      ? 'font-bold text-[var(--ds-text)]'
                      : l.actor === 0
                        ? 'text-emerald-200'
                        : l.actor === 1
                          ? 'text-rose-200'
                          : 'text-[var(--ds-text)]'
                }`}
              >
                {l.text}
              </li>
            ))}
          </ul>
        </div>

        <footer className="border-t border-[var(--ds-border)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {revealing ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShown(total)} className="rounded-xl border border-[var(--ds-border)] py-3 text-sm">
                ⏭ Pular
              </button>
              <button
                onClick={() => {
                  skipFight();
                  setShown(Number.MAX_SAFE_INTEGER);
                }}
                className="rounded-xl border border-[var(--ds-border)] py-3 text-sm"
              >
                ⏩ Simular tudo
              </button>
            </div>
          ) : fight.phase === 'break' ? (
            <div data-testid="corner">
              <p className="mb-2 text-center text-xs text-[var(--ds-text-muted)]">
                Intervalo · o córner sugere: <b className="text-[var(--ds-text)]">{CORNER.find((c) => c.id === suggestion)?.label}</b>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CORNER.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => chooseCorner(c.id)}
                    className={`flex flex-col items-center rounded-xl border px-1 py-2 text-center active:scale-95 ${
                      c.id === suggestion ? 'border-emerald-500 bg-emerald-500/10' : 'border-[var(--ds-border)] bg-[var(--ds-surface)]'
                    }`}
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-xs font-semibold">{c.label}</span>
                    <span className="text-[10px] leading-tight text-[var(--ds-text-muted)]">{c.hint}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  skipFight();
                  setShown(Number.MAX_SAFE_INTEGER);
                }}
                className="mt-2 w-full text-xs text-[var(--ds-text-muted)] underline"
              >
                Simular o resto da luta
              </button>
            </div>
          ) : result ? (
            <div data-testid="fight-result">
              <p className={`text-center text-xl font-black ${result.winner === 0 ? 'text-emerald-400' : result.winner === 1 ? 'text-rose-400' : 'text-[var(--ds-text)]'}`}>
                {result.winner === 0 ? 'VITÓRIA!' : result.winner === 1 ? 'DERROTA' : 'EMPATE'}
              </p>
              <p className="text-center text-sm text-[var(--ds-text)]">
                {METHOD[result.method]}
                {result.method === 'DEC' ? ` ${DECISION_TEXT[result.decisionType ?? 'unanimous']}` : ` no ${result.round}º round`}
                {af.earnings ? ` · ${money.format(af.earnings)}` : ''}
              </p>
              {result.method === 'DEC' && offer.rules === 'mma' && (
                <p className="mt-1 text-center text-[11px] text-[var(--ds-text-muted)]">Juízes: {result.totals.map(([a, b]) => `${a}-${b}`).join(' · ')}</p>
              )}
              {af.summary && <p className="mt-2 text-center text-xs text-[var(--ds-text-muted)]">{af.summary}</p>}
              <button onClick={closeFight} className="mt-3 w-full rounded-xl bg-emerald-500 py-3 font-bold text-[var(--ds-accent-ink)]">
                Continuar
              </button>
            </div>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
