/**
 * App de namoro (release 0.0.4): cartões do ano com filtros de idade e intenção, curtir ou pular. Ex-amizades com o
 * botão de reatar. A tela só lê a engine e despacha ações.
 */
import { useState } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import type { AppFilters, AppIntent, GameState } from '../../../engine';
import { APP_LIKES_PER_YEAR, appCards, appLikeBlockReason, exFriends, reconnectBlockReason, usesThisYear } from '../../../engine';
import { DsButton, ListGroup, ListItem } from '../../design/components';
import { useGameStore } from '../../store';

const INTENT: Record<AppIntent, string> = { casual: 'Algo casual', serio: 'Relação séria', amizade: 'Só amizade' };
const APP_REASON: Record<string, string> = {
  'not-adult': 'O app é só para maiores de 18',
  busy: 'Resolva o acontecimento pendente',
  taken: 'Você já está com alguém',
  limit: 'Chega de curtidas por este ano',
};

export function AppNamoroScreen({ game }: { game: GameState }) {
  const like = useGameStore((s) => s.appLike);
  const skip = useGameStore((s) => s.appSkip);
  const [filters, setFilters] = useState<AppFilters>({});
  const cards = appCards(game, C, filters);
  const card = cards[0];
  const left = Math.max(0, APP_LIKES_PER_YEAR - usesThisYear(game, 'app:curtidas'));
  const block = card ? appLikeBlockReason(game, card.id, C) : null;
  const traitLabel = (id: string) => C.relationships.traits.find((t) => t.id === id)?.label ?? id;
  const ages: [number, number][] = [[18, 25], [26, 35], [36, 50], [51, 99]];
  return (
    <>
      <ListGroup title="Filtros">
        <div className="flex flex-wrap gap-2" data-testid="app-filters">
          <Chip on={filters.minAge === undefined} onClick={() => setFilters({ ...filters, minAge: undefined, maxAge: undefined })}>Qualquer idade</Chip>
          {ages.map(([a, b]) => (
            <Chip key={a} on={filters.minAge === a} onClick={() => setFilters({ ...filters, minAge: a, maxAge: b })}>{b === 99 ? `${a}+` : `${a}–${b}`}</Chip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip on={!filters.intent} onClick={() => setFilters({ ...filters, intent: undefined })}>Tudo</Chip>
          {(Object.keys(INTENT) as AppIntent[]).map((k) => (
            <Chip key={k} on={filters.intent === k} onClick={() => setFilters({ ...filters, intent: k })}>{INTENT[k]}</Chip>
          ))}
        </div>
      </ListGroup>
      <p className="text-sm text-[var(--ds-text-muted)]">Curtidas restantes este ano: {left}</p>
      {card ? (
        <div className="rounded-[var(--ds-radius)] border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4" data-testid="app-card">
          <p className="text-lg font-semibold">{card.name}, {card.age}</p>
          <p className="text-sm text-[var(--ds-text-muted)]">a {card.km} km · procura: {INTENT[card.intent].toLowerCase()}</p>
          <p className="mt-2 text-sm">{card.traits.map(traitLabel).join(' · ')}</p>
          {block && <p className="mt-2 text-sm text-[var(--ds-danger)]">{APP_REASON[block] ?? 'Indisponível agora'}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <DsButton testId="app-skip" onClick={() => skip(card.id)}>Pular</DsButton>
            <DsButton tone="primary" testId="app-like" disabled={!!block} onClick={() => like(card.id)}>Curtir</DsButton>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--ds-text-muted)]" data-testid="app-empty">Sem perfis novos com esses filtros este ano.</p>
      )}
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-[44px] rounded-full border px-3 text-sm ${on ? 'border-[var(--ds-accent)] bg-[color-mix(in_srgb,var(--ds-accent)_15%,transparent)] font-semibold' : 'border-[var(--ds-border)]'}`}
    >
      {children}
    </button>
  );
}

const RECONNECT_REASON: Record<string, string> = {
  busy: 'Resolva o acontecimento pendente',
  tried: 'Você já tentou este ano',
  full: 'Sua lista de pessoas está cheia',
};

export function ExAmizades({ game }: { game: GameState }) {
  const reconnect = useGameStore((s) => s.reconnectExFriend);
  const list = exFriends(game);
  if (!list.length) return null;
  return (
    <ListGroup title="Ex-amizades">
      {list.slice(0, 10).map((a) => {
        const r = reconnectBlockReason(game, a.person!.id);
        const years = a.endedAge !== undefined ? game.character.age - a.endedAge : 0;
        return (
          <ListItem
            key={a.person!.id}
            emoji="🕰️"
            title={a.name}
            subtitle={`${a.note}${years > 0 ? ` · há ${years} ${years === 1 ? 'ano' : 'anos'}` : ''} · tentar reatar`}
            disabled={!!r}
            reason={r ? RECONNECT_REASON[r] : undefined}
            onClick={() => reconnect(a.person!.id)}
            chevron={false}
            testId="ex-friend"
          />
        );
      })}
    </ListGroup>
  );
}
