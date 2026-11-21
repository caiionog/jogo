import { GAME_CONTENT } from '../../content';
import { actionBlockReason } from '../../engine';
import type { GameState } from '../../engine';

const REASON: Record<string, string> = {
  'too-young': 'Muito novo',
  'too-old': 'Muito velho',
  'no-energy': 'Sem energia',
  'pending-event': 'Decida o evento',
  dead: '—',
  unknown: '—',
};

export default function ActionList({ game, onAction }: { game: GameState; onAction: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {GAME_CONTENT.actions.map((a) => {
        const reason = actionBlockReason(game, a);
        return (
          <button
            key={a.id}
            onClick={() => onAction(a.id)}
            disabled={reason !== null}
            title={a.description}
            className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2 py-3 active:scale-95 disabled:opacity-40"
          >
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-center text-xs font-medium leading-tight">{a.label}</span>
            <span className="text-[10px] text-slate-400">{reason ? REASON[reason] : `⚡ ${a.energyCost}`}</span>
          </button>
        );
      })}
    </div>
  );
}
