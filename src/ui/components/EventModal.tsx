import type { GameEvent, GameState } from '../../engine';
import { formatText } from '../../engine';

interface Props {
  game: GameState;
  event: GameEvent;
  onChoose: (eventId: string, choiceId: string) => void;
}

export default function EventModal({ game, event, onChoose }: Props) {
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Evento · {game.character.age} anos</p>
        <p className="mt-2 text-lg leading-snug">{formatText(game, event.text)}</p>
        <div className="mt-4 flex flex-col gap-2">
          {event.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => onChoose(event.id, c.id)}
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-left active:scale-[0.98]"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
