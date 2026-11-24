import { useState } from 'react';
import PixelAvatar from '../avatar/PixelAvatar';
import AvatarThumb from '../avatar/AvatarThumb';
import { personAvatar } from '../avatar/descriptors';
import { INTERACTION_LABEL, STAGE_LABEL, applicableInteractions, interactionBlockReason, relLabel } from '../../engine';
import type { GameState, InteractionKind, Person, Relation, TraitDef } from '../../engine';
import { useGameStore } from '../store';
import { Bar } from './fightUi';

const REASON: Record<string, string> = {
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
  const [profile, setProfile] = useState(false);
  const actions = person.alive ? applicableInteractions(game, person, rel) : [];
  const known = person.traits.slice(0, rel.revealed).map((t) => traits.find((d) => d.id === t)?.label ?? t);
  const hidden = person.traits.length - known.length;
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" role="dialog" aria-modal="true" aria-label={person.name} onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-[var(--ds-border)] bg-[var(--ds-surface)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        onClick={(e) => e.stopPropagation()}
        data-testid="person-sheet"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--ds-surface-2)]" />
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={() => setProfile(true)} aria-label={`Ver o perfil de ${person.name}`} className="shrink-0 rounded-2xl" data-testid="person-avatar">
            <AvatarThumb d={personAvatar(person, rel.affection)} size={72} dim={!person.alive} label={person.name} className="rounded-2xl" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{person.name}</h2>
            <p className="text-xs text-[var(--ds-text-muted)]">
              {relLabel(rel.type, person.sex)}
              {rel.romance ? ` · ${STAGE_LABEL[rel.romance.stage]}` : ''} · {person.alive ? `${person.age} ${person.age === 1 ? 'ano' : 'anos'}` : `faleceu aos ${person.deathAge ?? person.age} anos`}
              {person.job ? ` · ${person.job}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg px-2 py-1 text-[var(--ds-text-muted)]" aria-label="Fechar">
            ✕
          </button>
        </div>

        <button type="button" onClick={() => setProfile(true)} className="mt-2 min-h-11 rounded-lg px-3 text-sm font-semibold text-emerald-400" data-testid="person-profile">
          👤 Ver perfil
        </button>
        {profile && <PersonProfile person={person} rel={rel} known={known} onClose={() => setProfile(false)} />}

        {person.alive && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-[var(--ds-text)]">
              <span>Afeto</span>
              <span className="tabular-nums">{rel.affection}</span>
            </div>
            <Bar value={rel.affection} color={rel.affection >= 70 ? 'bg-emerald-500' : rel.affection >= 40 ? 'bg-amber-400' : 'bg-rose-500'} className="h-2" />
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {known.map((t) => (
            <span key={t} className="rounded-full bg-[var(--ds-surface-2)] px-2 py-0.5 text-[var(--ds-text)]">
              {t}
            </span>
          ))}
          {hidden > 0 && <span className="rounded-full border border-dashed border-[var(--ds-border)] px-2 py-0.5 text-[var(--ds-text-muted)]">+{hidden} traço(s) — converse para descobrir</span>}
          {person.flags.interesse_luta && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-300">🥊 quer lutar</span>}
        </div>

        {rel.history.length > 0 && (
          <ul className="mt-3 flex flex-col gap-0.5 text-xs text-[var(--ds-text-muted)]">
            {rel.history.map((h, i) => (
              <li key={i}>• {h}</li>
            ))}
          </ul>
        )}

        {actions.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2" data-testid="person-actions">
            {actions.map((kind) => {
              const reason = interactionBlockReason(game, person.id, kind);
              return (
                <button
                  key={kind}
                  disabled={reason !== null}
                  onClick={() => interact(person.id, kind)}
                  className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left text-sm active:scale-[0.98] disabled:opacity-40 ${
                    DANGER.includes(kind) ? 'border-rose-800 bg-rose-500/5 text-rose-200' : 'border-[var(--ds-border)] bg-[var(--ds-surface-2)]'
                  }`}
                >
                  <span className="leading-tight">{INTERACTION_LABEL[kind]}</span>
                  <span className="text-[10px] text-[var(--ds-text-muted)]">{reason ? REASON[reason] : 'repetir no ano rende menos'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Perfil do NPC: corpo inteiro em pixel art, idade, relação, profissão e traços já descobertos (release 0.0.1). */
function PersonProfile({ person, rel, known, onClose }: { person: Person; rel: Relation; known: string[]; onClose: () => void }) {
  const d = personAvatar(person, rel.affection);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={`Perfil de ${person.name}`} onClick={onClose} data-testid="person-profile-view">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--ds-surface)] p-4 text-[var(--ds-text)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-end gap-4">
          <div className="rounded-2xl bg-[var(--ds-avatar-bg)] p-2">{d ? <PixelAvatar d={d} scale={4} animate label={`Avatar de ${person.name}`} /> : <span className="block h-64 w-32" />}</div>
          <dl className="flex-1 text-sm">
            <dt className="font-semibold">{person.name}</dt>
            <dd className="text-[var(--ds-text-muted)]">{relLabel(rel.type, person.sex)}</dd>
            <dd className="text-[var(--ds-text-muted)]">{person.alive ? `${person.age} ${person.age === 1 ? 'ano' : 'anos'}` : `Faleceu aos ${person.deathAge ?? person.age} anos`}</dd>
            {person.job && <dd className="text-[var(--ds-text-muted)]">{person.job}</dd>}
            <dd className="mt-2">{known.length ? known.join(', ') : 'Personalidade ainda desconhecida'}</dd>
          </dl>
        </div>
        <button type="button" onClick={onClose} className="mt-4 min-h-11 w-full rounded-lg bg-[var(--ds-accent)] font-semibold text-[var(--ds-on-accent,#fff)]" data-testid="person-profile-close">
          Fechar
        </button>
      </div>
    </div>
  );
}
