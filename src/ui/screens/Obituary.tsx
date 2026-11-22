import AvatarThumb from '../avatar/AvatarThumb';
import { personAvatar } from '../avatar/descriptors';
/** Tela de fim de vida (Etapa 6): obituário, nota da vida, partilha e "Continuar como filho(a)". */
import { useState } from 'react';
import { continuableHeirs } from '../../engine';
import { money } from '../components/ecoUi';
import { FamilyTree, HallOfFameScreen } from '../components/MetaScreens';
import { useGameStore } from '../store';

const PART_LABEL: Record<string, string> = { carreira: 'Carreira', riqueza: 'Riqueza', familia: 'Família', longevidade: 'Longevidade', felicidade: 'Felicidade' };
const PART_MAX: Record<string, number> = { carreira: 35, riqueza: 20, familia: 20, longevidade: 15, felicidade: 10 };

export default function Obituary({ onViewLife }: { onViewLife: () => void }) {
  const game = useGameStore((s) => s.game);
  const newLife = useGameStore((s) => s.newLife);
  const continueAsChild = useGameStore((s) => s.continueAsChild);
  const [hall, setHall] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  if (!game?.ending) return null;
  const e = game.ending;
  const heirs = continuableHeirs(game);
  const stars = Math.round(e.score / 20);
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]" data-testid="obituary">
      <header className="text-center">
        <p className="text-4xl" aria-hidden>
          🕯️
        </p>
        <h1 className="mt-2 text-xl font-bold" data-testid="obituary-headline">
          {e.obituary.headline}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {game.character.birthYear}–{e.year} · {e.cause}
        </p>
      </header>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-center" aria-label="Nota da vida">
        <p className="text-xs uppercase tracking-wide text-amber-200/80">Nota da vida</p>
        <p className="text-4xl font-bold tabular-nums text-amber-300" data-testid="life-score">
          {e.score}
        </p>
        <p className="text-lg" aria-label={`${stars} de 5 estrelas`}>
          {'★'.repeat(stars)}
          <span className="text-slate-700">{'★'.repeat(5 - stars)}</span>
        </p>
        <dl className="mt-3 grid grid-cols-5 gap-1 text-[10px]">
          {Object.entries(e.scoreParts).map(([k, v]) => (
            <div key={k}>
              <dt className="text-slate-400">{PART_LABEL[k] ?? k}</dt>
              <dd className="font-semibold tabular-nums">
                {v}/{PART_MAX[k] ?? '—'}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Obituário</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {e.obituary.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        {e.obituary.highlights.length > 0 && (
          <>
            <h3 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Momentos marcantes</h3>
            <ul className="flex flex-col gap-1 text-xs text-slate-300">
              {e.obituary.highlights.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4" data-testid="estate">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Herança {e.estate.byWill ? '(testamento)' : '(divisão padrão)'}</h2>
        <p className="text-xs text-slate-400">
          Espólio {money.format(e.estate.gross)} · imposto {money.format(e.estate.tax)}
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {e.heirs.length === 0 && <li className="text-slate-400">Sem herdeiros.</li>}
          {e.heirs.map((h) => (
            <li key={h.personId} className="flex justify-between gap-2">
              <span className="min-w-0 truncate">
                {h.name} <span className="text-xs text-slate-400">({h.relation})</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {h.share}% · {money.format(h.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <FamilyTree game={game} />

      <section className="flex flex-col gap-2">
        {heirs.length > 0 ? (
          <>
            <h2 className="text-sm font-semibold">Continuar como filho(a)</h2>
            {heirs.map((h) => (
              <button
                key={h.personId}
                data-testid="continue-heir"
                onClick={() => continueAsChild(h.personId)}
                className="flex min-h-14 items-center justify-between gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-left font-bold text-slate-950 active:scale-[0.98]"
              >
                <AvatarThumb d={(() => { const p = game.relationships.people.find((x) => x.id === h.personId); return p ? personAvatar(p) : null; })()} size={44} label={h.name} />
                <span className="flex-1">
                  {h.name}
                  <span className="block text-xs font-normal">
                    {h.age} anos · herda {money.format(h.amount)}
                  </span>
                </span>
                <span aria-hidden>→</span>
              </button>
            ))}
          </>
        ) : (
          <p className="rounded-xl bg-slate-900/60 px-3 py-3 text-sm text-slate-300">Sem filhos vivos, a dinastia {game.dynasty.surname} termina aqui.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button data-testid="open-hall" onClick={() => setHall(true)} className="min-h-12 rounded-xl border border-slate-600 text-sm">
            🏛️ Hall da Fama
          </button>
          <button onClick={onViewLife} className="min-h-12 rounded-xl border border-slate-600 text-sm">
            📜 Ver a vida
          </button>
        </div>
        {!confirmNew ? (
          <button data-testid="obituary-new-life" onClick={() => setConfirmNew(true)} className="min-h-12 rounded-xl bg-slate-200 font-bold text-slate-950">
            🔁 Nova vida
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmNew(false)} className="min-h-12 rounded-xl border border-slate-600 text-sm">
              Cancelar
            </button>
            <button onClick={() => void newLife()} className="min-h-12 rounded-xl bg-rose-500 text-sm font-bold text-slate-950">
              Começar do zero
            </button>
          </div>
        )}
      </section>
      {hall && <HallOfFameScreen onClose={() => setHall(false)} />}
    </main>
  );
}
