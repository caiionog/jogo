import type { GameEvent, GameState, PendingEvent } from '../../engine';
import { formatText } from '../../engine';

interface Props {
  game: GameState;
  event: GameEvent;
  pending: PendingEvent;
  onChoose: (eventId: string, choiceId: string) => void;
}

const SOURCE_BADGE: Partial<Record<NonNullable<PendingEvent['source']>, { text: string; cls: string }>> = {
  followUp: { text: '↪ Continuação', cls: 'bg-sky-500/15 text-sky-300' },
  auto: { text: '★ Marco', cls: 'bg-violet-500/15 text-violet-300' },
  action: { text: '⚠ Consequência', cls: 'bg-rose-500/15 text-rose-300' },
};

export default function EventModal({ game, event, pending, onChoose }: Props) {
  const total = game.pendingEvents.length;
  const badge = pending.source ? SOURCE_BADGE[pending.source] : undefined;
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
          <span className="text-amber-400">Evento · {game.character.age} anos</span>
          {badge && (
            <span className={`rounded-full px-2 py-0.5 normal-case ${badge.cls}`} data-testid="event-badge">
              {badge.text}
            </span>
          )}
          {total > 1 && <span className="ml-auto text-slate-400 normal-case">+{total - 1} na fila</span>}
        </div>
        <p className="mt-2 text-lg leading-snug">{formatText(game, event.text, pending.vars)}</p>
        <div className="mt-4 flex flex-col gap-2">
          {event.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => onChoose(event.id, c.id)}
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-left active:scale-[0.98]"
            >
              {formatText(game, c.label, pending.vars)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
