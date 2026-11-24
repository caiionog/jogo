/**
 * Esporte profissional: futebol (release 0.0.4, fase 6). Peneira, clube, contrato, última temporada, títulos,
 * propostas e treino. As habilidades são ocultas: a tela mostra só a pista do treinador e do potencial.
 */
import { useState } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import type { FootballClubDef, FootballPosition, GameState } from '../../../engine';
import { POSITIONS, POSITION_LABEL, clubDef, divisionOf, footballHint, footballOfferBlockReason, footballTrainBlockReason, leagueOf, potentialHint, tryoutBlockReason, tryoutChance } from '../../../engine';
import { DsButton, ListGroup, ListItem } from '../../design/components';
import { money } from '../../components/ecoUi';
import { useGameStore } from '../../store';

/** Escudo procedural: um brasão com as duas cores do clube e as iniciais (nenhum escudo real). */
export function Crest({ club, size = 40 }: { club: FootballClubDef | undefined; size?: number }) {
  const [a, b] = club?.colors ?? ['#64748b', '#e2e8f0'];
  const initials = (club?.name ?? '?').split(' ').filter((w) => w.length > 2 && w[0] === w[0]!.toUpperCase()).map((w) => w[0]).join('').slice(0, 3);
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 40 46" role="img" aria-label={`Escudo do ${club?.name ?? 'clube'}`}>
      <path d="M20 1 L38 7 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V7 Z" fill={a} stroke="currentColor" strokeOpacity="0.35" />
      <path d="M20 1 L38 7 V22 C38 34 30 41 20 45 Z" fill={b} opacity="0.85" />
      <rect x="6" y="18" width="28" height="9" rx="2" fill="#0f172a" opacity="0.55" />
      <text x="20" y="25" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff" fontFamily="system-ui, sans-serif">{initials || '?'}</text>
    </svg>
  );
}

const TRYOUT_REASON: Record<string, string> = {
  busy: 'Resolva o acontecimento pendente',
  age: 'Peneiras dos 10 aos 23 anos',
  tried: 'Você já fez uma peneira este ano',
  prison: 'Indisponível na prisão',
  fighter: 'Você tem contrato como lutador',
  already: 'Você já está no futebol',
};
const DIV_LABEL = (d: string) => (d === 'X' ? 'exterior' : `Divisão ${d}`);

export function FutebolScreen({ game }: { game: GameState }) {
  const st = useGameStore();
  const [pos, setPos] = useState<FootballPosition>('MEI');
  const f = game.football;
  if (!f) {
    const r = tryoutBlockReason(game);
    return (
      <>
        <p className="text-sm text-[var(--ds-text-muted)]">Para virar profissional, passe numa peneira e suba da base. Clube esportivo de futebol ajuda.</p>
        <ListGroup title="Posição">
          <div className="flex flex-wrap gap-2" data-testid="positions">
            {POSITIONS.map((p) => (
              <button key={p} type="button" aria-pressed={pos === p} onClick={() => setPos(p)} className={`min-h-[44px] rounded-full border px-3 text-sm ${pos === p ? 'border-[var(--ds-accent)] font-semibold' : 'border-[var(--ds-border)]'}`}>
                {POSITION_LABEL[p]}
              </button>
            ))}
          </div>
        </ListGroup>
        <ListItem emoji="⚽" title="Fazer uma peneira" subtitle={`Uma por ano · chance ${tryoutChance(game) >= 0.5 ? 'boa' : tryoutChance(game) >= 0.25 ? 'razoável' : 'pequena'}`} disabled={!!r} reason={r ? TRYOUT_REASON[r] : undefined} onClick={() => st.footballTryout(pos)} chevron={false} testId="football-tryout" />
      </>
    );
  }
  const club = clubDef(C, f.clubId);
  const div = divisionOf(game, C, f.clubId);
  const league = leagueOf(C, f.clubId);
  const last = f.history.at(-1);
  const tr = footballTrainBlockReason(game, C);
  return (
    <>
      <div className="flex items-center gap-3 rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3" data-testid="football-card">
        <Crest club={club} size={44} />
        <div className="text-sm">
          <p className="font-semibold">{club?.name}</p>
          <p className="text-[var(--ds-text-muted)]">
            {league ? league.name : DIV_LABEL(div)} · {POSITION_LABEL[f.position]} · {f.stage === 'base' ? 'categoria de base' : f.stage === 'aposentado' ? 'aposentado(a)' : f.contract ? `contrato: ${f.contract.years} ${f.contract.years === 1 ? 'ano' : 'anos'}, ${money.format(f.contract.salary)}/ano` : 'sem clube'}
          </p>
          {club?.mascot ? <p className="text-xs text-[var(--ds-text-muted)]">{club.colorNames} · mascote: {club.mascot}</p> : null}
        </div>
      </div>
      <ListGroup title="O que dizem de você">
        <p className="text-sm" data-testid="football-hint">{footballHint(f)}</p>
        <p className="text-xs text-[var(--ds-text-muted)]">{potentialHint(f)}</p>
      </ListGroup>
      {last && (
        <ListGroup title={`Temporada ${last.year}`}>
          <p className="text-sm" data-testid="football-season">
            {last.apps} jogos · {last.goals} gols · {last.assists} assistências · nota {last.rating.toLocaleString('pt-BR')} · {last.division === 'X' ? `${last.place}º lugar` : `${last.place}º na Divisão ${last.division}`}
          </p>
          {last.titles.length > 0 && <p className="text-sm">🏆 {last.titles.join(' · ')}</p>}
        </ListGroup>
      )}
      {f.offers.length > 0 && (
        <ListGroup title="Propostas">
          {f.offers.map((o) => {
            const c = clubDef(C, o.clubId);
            const lg = leagueOf(C, o.clubId);
            const r = footballOfferBlockReason(game, o.clubId);
            return (
              <ListItem key={o.clubId} right={<Crest club={c} size={26} />} title={c?.name ?? o.clubId} subtitle={`${lg ? lg.name : DIV_LABEL(divisionOf(game, C, o.clubId))} · ${o.years} ${o.years === 1 ? 'ano' : 'anos'} · ${money.format(o.salary)}/ano`} disabled={!!r} reason="Resolva o acontecimento pendente" onClick={() => st.acceptFootballOffer(o.clubId)} chevron={false} testId="football-offer" />
            );
          })}
          <p className="text-xs text-[var(--ds-text-muted)]">As propostas vencem na virada do ano.</p>
        </ListGroup>
      )}
      {f.stage !== 'aposentado' && (
        <ListGroup title="Rotina">
          <ListItem emoji="🏃" title="Treino extra" subtitle="Gasta 1 sessão de treino do ano; rende menos a cada repetição" disabled={!!tr} reason={tr === 'sessions' ? 'Sem sessões de treino livres este ano' : 'Indisponível agora'} onClick={st.trainFootball} chevron={false} testId="football-train" />
          {f.stage === 'pro' && <DsButton tone="danger" full testId="football-retire" onClick={st.retireFootball}>Pendurar as chuteiras</DsButton>}
        </ListGroup>
      )}
      <ListGroup title="Carreira">
        <p className="text-sm">{f.history.length} temporadas · {f.history.reduce((t, h) => t + h.goals, 0)} gols · {f.caps} jogos pela {C.football.competitions.selecao}</p>
        {f.titles.length > 0 && <p className="text-xs text-[var(--ds-text-muted)]">Títulos: {f.titles.join(' · ')}</p>}
      </ListGroup>
    </>
  );
}
