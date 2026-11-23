/** Atividades → Clube esportivo e Intercâmbio (release 0.0.1). */
import { GAME_CONTENT as C } from '../../../content';
import type { GameState, SportId } from '../../../engine';
import { usesThisYear, venueBlockReason, clubTrainBlockReason, clubsInCity, exchangeBlockReason, onExchange, parentsShare, sportsClubBlockReason, sportsClubDef } from '../../../engine';
import { ListGroup, ListItem } from '../../design/components';
import { money } from '../../components/ecoUi';
import { useGameStore } from '../../store';
import { SPORT_LABEL } from '../../../content/sportsClubs';
import { modalityLabel } from '../../text/fight';
import { TrainingMeter } from '../Life';
import { sessionsBreakdown, sessionsLeft, sessionsReserved } from '../../../engine';

const CLUB_REASON: Record<string, string> = { busy: 'Indisponível agora', 'too-young': 'Muito novo(a)', 'other-city': 'Outra cidade', 'no-sport': '—', current: 'Você já treina aqui', 'no-money': 'Dinheiro insuficiente' };
const EX_REASON: Record<string, string> = {
  busy: 'Indisponível agora',
  'too-young': 'A partir dos 16 anos',
  'needs-parents': 'Precisa da autorização dos pais (até os 18)',
  job: 'Seu emprego de tempo integral não deixa: peça licença ou demissão',
  'no-money': 'Dinheiro insuficiente',
  already: 'Você já está em intercâmbio',
};

export function ClubeScreen({ game }: { game: GameState }) {
  const st = useGameStore();
  const m = game.sportsClub;
  const club = sportsClubDef(C, m?.clubId);
  const tr = clubTrainBlockReason(game, C);
  return (
    <>
      <TrainingMeter left={sessionsLeft(game, C)} reserved={sessionsReserved(game, C)} limit={C.limits.trainingSessions} notes={sessionsBreakdown(game, C).map((p) => p.text)} />
      {m && club ? (
        <ListGroup title="Seu clube">
          <p className="text-sm" data-testid="club-current">{club.name} · {SPORT_LABEL[m.sport]} · {m.years} {m.years === 1 ? 'ano' : 'anos'} de clube</p>
          <ListItem emoji="🏅" title={`Treinar ${SPORT_LABEL[m.sport]?.toLowerCase()}`} subtitle="1 sessão · Capacidade atlética e amizades" disabled={!!tr} reason={tr === 'no-sessions' ? 'Sem sessões de treino livres neste ano' : 'Indisponível agora'} onClick={st.trainAtClub} chevron={false} testId="club-train" />
          <ListItem emoji="🚪" title="Sair do clube" tone="danger" onClick={st.leaveSportsClub} chevron={false} />
        </ListGroup>
      ) : null}
      <ListGroup title="Clubes da cidade">
        {clubsInCity(game, C).flatMap((c) =>
          c.sports.map((sp) => {
            const r = sportsClubBlockReason(game, c.id, sp as SportId, C);
            return <ListItem key={`${c.id}:${sp}`} emoji="🏟️" title={`${c.name} — ${SPORT_LABEL[sp]}`} subtitle={`${money.format(c.fee)}/ano${game.character.age < 18 ? ' (pais pagam)' : ''} · a partir de ${c.minAge} anos`} disabled={!!r} reason={r ? CLUB_REASON[r] : undefined} onClick={() => st.joinSportsClub(c.id, sp as SportId)} chevron={false} testId={`club-${c.id}-${sp}`} />;
          }),
        )}
      </ListGroup>
    </>
  );
}

export function IntercambioScreen({ game }: { game: GameState }) {
  const st = useGameStore();
  const age = game.character.age;
  const ex = onExchange(game) ? C.exchangePrograms.find((p) => p.id === game.exchange!.programId) : undefined;
  return (
    <>
      {ex && <p className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm" data-testid="exchange-current">✈️ Você está em {ex.city} ({ex.country}), na {ex.academy}. Treine {modalityLabel(ex.modality).toLowerCase()} nas suas sessões: o grande salto vem no fim do ano.</p>}
      <p className="text-sm text-[var(--ds-text-muted)]">Um ano treinando numa academia de referência no exterior. Você continua morando no Brasil; a escola fica em pausa e o emprego de tempo integral precisa de licença.</p>
      {age >= 16 && age < 18 && game.flags.autorizacao_intercambio !== game.year && <ListItem emoji="👪" title="Pedir autorização aos pais" subtitle="Uma vez por ano; eles podem pagar parte da viagem" onClick={st.askParentsForExchange} chevron={false} testId="exchange-parents" />}
      {game.economy.job && game.flags.licenca !== game.year && <ListItem emoji="📝" title="Pedir licença do trabalho por um ano" subtitle="Sem salário no ano; a chance depende do seu desempenho" onClick={st.askJobLeave} chevron={false} testId="exchange-leave" />}
      <ListGroup title="Programas">
        {C.exchangePrograms.map((p) => {
          const r = exchangeBlockReason(game, p.id, C);
          const share = parentsShare(game, p.cost);
          return <ListItem key={p.id} emoji="✈️" title={`${p.country}: ${modalityLabel(p.modality)}`} subtitle={`${p.academy} (${p.city}) · ${money.format(p.cost)}${share ? ` · pais pagam ${money.format(share)}` : ''}`} disabled={!!r} reason={r ? EX_REASON[r] : undefined} onClick={() => st.startExchange(p.id)} chevron={false} testId={`exchange-${p.id}`} />;
        })}
      </ListGroup>
    </>
  );
}

const VENUE_REASON: Record<string, string> = { busy: 'Resolva o acontecimento pendente', 'too-young': 'Só para maiores de 18', 'too-old': 'Isso já não é para a sua idade', 'adult-off': 'Ative "Conteúdo adulto" nas configurações', 'no-money': 'Dinheiro insuficiente' };

/** Atividades → Lazer → Sair à noite. Locais adultos só aparecem (desabilitados com o motivo) para quem tem 18+. */
export function NoiteScreen({ game }: { game: GameState }) {
  const st = useGameStore();
  const age = game.character.age;
  const n = usesThisYear(game, 'noite');
  const venues = C.venues.filter((v) => (v.maxAge === undefined || age <= v.maxAge) && (!v.adult || (age >= 18 && game.relationships.settings.adultContent)));
  return (
    <>
      {n > 0 && <p className="text-sm text-[var(--ds-text-muted)]">Você já saiu {n}× este ano: cada saída rende um pouco menos de diversão.</p>}
      {venues.map((v) => {
        const r = venueBlockReason(game, v.id, C);
        return <ListItem key={v.id} emoji={v.emoji} title={v.label} subtitle={age >= 18 ? `${money.format(v.cost)} · algo sempre acontece` : 'Algo sempre acontece'} disabled={!!r} reason={r ? VENUE_REASON[r] : undefined} onClick={() => st.goOut(v.id)} chevron={false} testId={`venue-${v.id}`} />;
      })}
    </>
  );
}
