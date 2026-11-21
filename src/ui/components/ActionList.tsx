import { useState } from 'react';
import { GAME_CONTENT } from '../../content';
import type { ActionDef, ClubBlockReason, GameState } from '../../engine';
import { actionBlockReason, clubBlockReason, isActionAvailable } from '../../engine';

const REASON: Record<string, string> = {
  'too-young': 'Muito novo',
  'too-old': 'Muito velho',
  'no-energy': 'Sem energia',
  'pending-event': 'Decida o evento',
  'not-enrolled': 'Fora da escola',
  'wrong-stage': 'Indisponível',
  'already-member': 'Você está aqui',
  dead: '—',
  unknown: '—',
};

interface Props {
  game: GameState;
  onAction: (id: string) => void;
  onJoinClub: (id: string) => void;
  onLeaveClub: () => void;
}

function ActionButton({ game, action, onAction }: { game: GameState; action: ActionDef; onAction: (id: string) => void }) {
  const reason = actionBlockReason(game, action);
  return (
    <button
      onClick={() => onAction(action.id)}
      disabled={reason !== null}
      title={action.description}
      className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2 py-3 active:scale-95 disabled:opacity-40"
    >
      <span className="text-2xl">{action.emoji}</span>
      <span className="text-center text-xs font-medium leading-tight">{action.label}</span>
      <span className="text-[10px] text-slate-400">{reason ? REASON[reason] : `⚡ ${action.energyCost}`}</span>
    </button>
  );
}

export default function ActionList({ game, onAction, onJoinClub, onLeaveClub }: Props) {
  const [clubsOpen, setClubsOpen] = useState(false);
  const visible = GAME_CONTENT.actions.filter((a) => isActionAvailable(game, a) || a.category === 'vida');
  const life = visible.filter((a) => a.category === 'vida');
  const school = visible.filter((a) => a.category === 'escola');
  const cur = game.education.current;
  const currentClub = cur?.club ? GAME_CONTENT.clubs.find((c) => c.id === cur.club) : undefined;
  const clubs = GAME_CONTENT.clubs.map((c) => ({ club: c, reason: clubBlockReason(game, c) as ClubBlockReason | null }));
  const anyClubAvailable = clubs.some((c) => c.reason !== 'too-young' && c.reason !== 'not-enrolled');
  const canLeave = !!currentClub && game.energy.current >= 1 && game.pendingEvents.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Vida</h2>
        <div className="grid grid-cols-3 gap-2">
          {life.map((a) => (
            <ActionButton key={a.id} game={game} action={a} onAction={onAction} />
          ))}
        </div>
      </section>

      {cur && (
        <section data-testid="school-actions">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Escola</h2>
          <div className="grid grid-cols-3 gap-2">
            {school.map((a) => (
              <ActionButton key={a.id} game={game} action={a} onAction={onAction} />
            ))}
            {anyClubAvailable && (
              <button
                onClick={() => setClubsOpen((v) => !v)}
                aria-expanded={clubsOpen}
                className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2 py-3 active:scale-95"
              >
                <span className="text-2xl">{currentClub?.emoji ?? '🏅'}</span>
                <span className="text-center text-xs font-medium leading-tight">Clube</span>
                <span className="text-[10px] text-slate-400">{currentClub ? currentClub.label : 'Nenhum'}</span>
              </button>
            )}
          </div>

          {clubsOpen && anyClubAvailable && (
            <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900 p-2">
              <p className="px-1 pb-2 text-[11px] text-slate-400">Entrar ou sair custa ⚡ 1. Clubes dão bônus no fim de cada ano letivo.</p>
              <ul className="flex flex-col gap-1">
                {clubs
                  .filter((c) => c.reason !== 'too-young')
                  .map(({ club, reason }) => (
                    <li key={club.id}>
                      <button
                        disabled={reason !== null}
                        onClick={() => {
                          onJoinClub(club.id);
                          setClubsOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm active:bg-slate-800 disabled:opacity-50"
                      >
                        <span>
                          {club.emoji} {club.label} {club.combat && <span className="text-[10px] text-rose-300">· luta</span>}
                        </span>
                        <span className="text-[11px] text-slate-400">{reason ? REASON[reason] : 'Entrar'}</span>
                      </button>
                    </li>
                  ))}
              </ul>
              {currentClub && (
                <button
                  disabled={!canLeave}
                  onClick={() => {
                    onLeaveClub();
                    setClubsOpen(false);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-rose-300 disabled:opacity-50"
                >
                  Sair do clube de {currentClub.label.toLowerCase()}
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
