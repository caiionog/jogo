/**
 * Pessoas da cidade (release 0.0.4): vizinhos do bairro e outros moradores gerados sob demanda pela engine. Puxar
 * conversa transforma o morador numa pessoa com relação (`meetResident`). A tela só lê e despacha.
 */
import { useMemo, useState } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import type { GameState, Resident } from '../../../engine';
import { cityResidents, homeNeighborhood, residentAge, residentAgeBlock } from '../../../engine';
import { ListGroup, ListItem } from '../../design/components';
import { useGameStore } from '../../store';

const REASON: Record<string, string> = {
  'too-young': 'Você ainda é pequeno(a) demais',
  'age-gap': 'Diferença de idade grande demais para puxar conversa',
  minor: 'Adultos não puxam conversa com menores desconhecidos',
};

const PAGE = 25;

export function PessoasCidadeScreen({ game }: { game: GameState }) {
  const meet = useGameStore((s) => s.meetResident);
  const [page, setPage] = useState(1);
  const metCount = Object.keys(game.population?.met ?? {}).length;
  const { home, near, others } = useMemo(() => {
    const all = cityResidents(game, C);
    const h = homeNeighborhood(game, C);
    return { home: h, near: all.filter((r) => r.neighborhood === h), others: all.filter((r) => r.neighborhood !== h) };
    // a lista só muda com o ano, a cidade e quem já foi conhecido
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.year, game.character.city, game.character.uf, metCount, game.seed]);
  const busy = !game.alive || game.pendingEvents.length > 0 || !!game.activeFight;

  const row = (r: Resident) => {
    const age = residentAge(game, r);
    const block = busy ? 'busy' : residentAgeBlock(game.character.age, age);
    return (
      <ListItem
        key={r.id}
        emoji={r.sex === 'M' ? '👨' : '👩'}
        title={r.name}
        subtitle={`${age} ${age === 1 ? 'ano' : 'anos'} · ${r.occupation} · ${r.neighborhood}${r.origin !== 'Brasil' ? ` · nasceu em ${r.origin}` : ''}`}
        disabled={!!block}
        reason={block === 'busy' ? 'Resolva o acontecimento pendente' : block ? REASON[block] : undefined}
        onClick={() => meet(r.id)}
        chevron={false}
        testId="resident"
      />
    );
  };

  return (
    <>
      <p className="text-sm text-[var(--ds-text-muted)]" data-testid="city-summary">
        Você mora no bairro {home}, em {game.character.city}. Toque em alguém para puxar conversa.
      </p>
      <ListGroup title={`Vizinhos (${near.length})`}>
        {near.length ? near.slice(0, PAGE).map(row) : <p className="text-sm text-[var(--ds-text-muted)]">Ninguém novo no seu bairro.</p>}
      </ListGroup>
      <ListGroup title={`Outros moradores (${others.length})`}>
        {others.slice(0, PAGE * page).map(row)}
        {others.length > PAGE * page && <ListItem emoji="➕" title="Mostrar mais" onClick={() => setPage(page + 1)} chevron={false} testId="residents-more" />}
      </ListGroup>
    </>
  );
}
