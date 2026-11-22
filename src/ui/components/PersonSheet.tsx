import { INTERACTION_COST, INTERACTION_LABEL, STAGE_LABEL, applicableInteractions, interactionBlockReason, relLabel } from '../../engine';
import type { GameState, InteractionKind, Person, Relation, TraitDef } from '../../engine';
import { useGameStore } from '../store';
import { Bar } from './fightUi';

const REASON: Record<string, string> = {
  'no-energy': 'Sem energia',
  'no-money': 'Sem dinheiro',
  busy: 'Resolva o evento',
  asked: 'Já pediu este ano',
  'too-young': 'Muito novo',
  'adult-off': 'Conteúdo adulto desligado',
  'not-applicable': '—',
  'person-dead': '—',
  dead: '—',
  stage: '—',
};

const DANGER: InteractionKind[] = ['argue', 'break_up', 'divorce'];

/** Folha deslizando de baixo com os dados da pessoa e as ações disponíveis. */
export default function PersonSheet({ game, person, rel, traits, onClose }: { game: GameState; person: Person; rel: Relation; traits: readonly TraitDef[]; onClose: () => void }) {
  const interact = useGameStore((s) => s.interact);
  const actions = person.alive ? applicableInteractions(game, person, rel) : [];
  const known = person.traits.slice(0, rel.revealed).map((t) => traits.find((d) => d.id === t)?.label ?? t);
  const hidden = person.traits.length - known.length;
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" role="dialog" aria-modal="true" aria-label={person.name} onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-slate-700 bg-slate-900 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        onClick={(e) => e.stopPropagation()}
        data-testid="person-sheet"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-700" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{person.name}</h2>
            <p className="text-xs text-slate-400">
              {relLabel(rel.type, person.sex)}
              {rel.romance ? ` · ${STAGE_LABEL[rel.romance.stage]}` : ''} · {person.alive ? `${person.age} ${person.age === 1 ? 'ano' : 'anos'}` : `faleceu aos ${person.deathAge ?? person.age} anos`}
              {person.job ? ` · ${person.job}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg px-2 py-1 text-slate-400" aria-label="Fechar">
            ✕
          </button>
        </div>

        {person.alive && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-slate-300">
              <span>Afeto</span>
              <span className="tabular-nums">{rel.affection}</span>
            </div>
            <Bar value={rel.affection} color={rel.affection >= 70 ? 'bg-emerald-500' : rel.affection >= 40 ? 'bg-amber-400' : 'bg-rose-500'} className="h-2" />
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {known.map((t) => (
            <span key={t} className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-200">
              {t}
            </span>
          ))}
          {hidden > 0 && <span className="rounded-full border border-dashed border-slate-600 px-2 py-0.5 text-slate-500">+{hidden} traço(s) — converse para descobrir</span>}
          {person.flags.interesse_luta && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-300">🥊 quer lutar</span>}
        </div>

        {rel.history.length > 0 && (
          <ul className="mt-3 flex flex-col gap-0.5 text-xs text-slate-400">
            {rel.history.map((h, i) => (
              <li key={i}>• {h}</li>
            ))}
          </ul>
        )}

        {actions.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2" data-testid="person-actions">
            {actions.map((kind) => {
              const reason = interactionBlockReason(game, person.id, kind);
              const cost = INTERACTION_COST[kind];
              return (
                <button
                  key={kind}
                  disabled={reason !== null}
                  onClick={() => interact(person.id, kind)}
                  className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left text-sm active:scale-[0.98] disabled:opacity-40 ${
                    DANGER.includes(kind) ? 'border-rose-800 bg-rose-500/5 text-rose-200' : 'border-slate-700 bg-slate-800/60'
                  }`}
                >
                  <span className="leading-tight">{INTERACTION_LABEL[kind]}</span>
                  <span className="text-[10px] text-slate-400">{reason ? REASON[reason] : cost ? `⚡ ${cost}` : 'grátis'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
