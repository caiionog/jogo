/** Pop-ups centrais (Etapa 8): evento do ano (com o NPC envolvido) e resultado curto da escolha. */
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { GameEvent, GameState, PendingEvent } from '../../engine';
import { formatText } from '../../engine';
import AvatarThumb from '../avatar/AvatarThumb';
import { personAvatar } from '../avatar/descriptors';
import type { Outcome } from '../store';
import { STAT_SHORT } from '../store';
import { money } from '../components/ecoUi';

const SOURCE_BADGE: Partial<Record<NonNullable<PendingEvent['source']>, string>> = { followUp: '↪ Continuação', auto: '★ Marco', action: '⚠ Consequência' };

function Overlay({ children, label, testId }: { children: React.ReactNode; label: string; testId: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="ds-anim-pop w-full max-w-sm rounded-[var(--ds-radius-lg)] border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5 shadow-xl" data-testid={testId}>
        {children}
      </div>
    </div>
  );
}

export function EventModal({ game, event, pending, onChoose }: { game: GameState; event: GameEvent; pending: PendingEvent; onChoose: (eventId: string, choiceId: string) => void }) {
  const total = game.pendingEvents.length;
  const badge = pending.source ? SOURCE_BADGE[pending.source] : undefined;
  const person = pending.vars?.pessoa_id ? game.relationships.people.find((p) => p.id === pending.vars!.pessoa_id) : undefined;
  return (
    <Overlay label="Acontecimento" testId="event-modal">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--ds-warning)]">
        <span className="ds-pixel-title">Idade {game.character.age}</span>
        {badge && <span className="rounded-full bg-[var(--ds-surface-2)] px-2 py-0.5 normal-case text-[var(--ds-text-muted)]" data-testid="event-badge">{badge}</span>}
        {total > 1 && <span className="ml-auto normal-case text-[var(--ds-text-muted)]">+{total - 1} na fila</span>}
      </div>
      <div className="mt-3 flex items-start gap-3">
        {person && <AvatarThumb d={personAvatar(person)} size={56} label={person.name} className="rounded-xl" />}
        <p className="text-[17px] leading-snug">{formatText(game, event.text, pending.vars)}</p>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {event.choices.map((c) => (
          <button key={c.id} type="button" onClick={() => onChoose(event.id, c.id)} className="min-h-12 rounded-[var(--ds-radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)] px-4 py-3 text-left active:scale-[0.98]" data-testid="event-choice">
            {formatText(game, c.label, pending.vars)}
          </button>
        ))}
      </div>
    </Overlay>
  );
}

export function ResultModal({ outcome, onClose }: { outcome: Outcome; onClose: () => void }) {
  return (
    <Overlay label="Resultado" testId="result-modal">
      <div className="flex flex-col gap-2">
        {outcome.lines.length ? outcome.lines.map((l, i) => <p key={i} className="leading-snug">{l}</p>) : <p>Feito.</p>}
      </div>
      {(outcome.deltas.length > 0 || outcome.money !== 0) && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Mudanças">
          {outcome.deltas.map((d) => (
            <li key={d.key} className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold ${d.delta > 0 ? 'bg-[color-mix(in_srgb,var(--ds-accent)_15%,transparent)] text-[var(--ds-accent)]' : 'bg-[color-mix(in_srgb,var(--ds-danger)_15%,transparent)] text-[var(--ds-danger)]'}`}>
              {d.delta > 0 ? <ArrowUp size={14} aria-hidden /> : <ArrowDown size={14} aria-hidden />}
              {STAT_SHORT[d.key]} {d.delta > 0 ? '+' : '−'}
              {Math.abs(d.delta)}
            </li>
          ))}
          {outcome.money !== 0 && (
            <li className={`rounded-full px-2 py-1 text-sm font-semibold ${outcome.money > 0 ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-danger)]'}`}>
              {outcome.money > 0 ? '+' : '−'}
              {money.format(Math.abs(outcome.money))}
            </li>
          )}
        </ul>
      )}
      <button type="button" onClick={onClose} className="mt-4 min-h-12 w-full rounded-[var(--ds-radius)] bg-[var(--ds-accent)] font-bold text-[var(--ds-accent-ink)]" data-testid="result-ok" autoFocus>
        Continuar
      </button>
    </Overlay>
  );
}
