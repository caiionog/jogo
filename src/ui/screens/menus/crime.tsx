/**
 * Atividades → Crime (release 0.0.2): delitos por categoria com o risco em palavras; menores (12–17) veem só os
 * leves. Procurado e reputação no crime nunca aparecem como número (só pistas). A tela final (ficha, processo) é
 * da fase 9.
 */
import { GAME_CONTENT as C } from '../../../content';
import type { CrimeBlockReason, CrimeTier, GameState } from '../../../engine';
import { TRAFFICKING, crimeBlockReason, crimeRepHint, crimeRiskLabel, factionDef, factionRankTitle, launderBlockReason, traffickingBlockReason, wantedHint } from '../../../engine';
import type { TraffickingLevel } from '../../../engine';
import { ListGroup, ListItem } from '../../design/components';
import { GameIcon } from '../../icons/GameIcon';

function SpriteIcon({ set, id, colors, size = 2 }: { set: 'crime' | 'faction'; id: string; colors?: readonly [string, string]; size?: number }) {
  return <GameIcon set={set} id={id} colors={colors} size={size * 16} />;
}
import { useGameStore } from '../../store';
import { useNav } from '../../nav';

const TIER: { tier: CrimeTier; title: string }[] = [
  { tier: 'leve', title: 'Leves' },
  { tier: 'medio', title: 'Médios (18+)' },
  { tier: 'grave', title: 'Graves (18+)' },
];

const REASON: Record<CrimeBlockReason, string> = {
  dead: '—',
  busy: 'Resolva o acontecimento pendente',
  age: 'Só a partir dos 18 anos',
  prison: 'Indisponível na prisão',
  rep: 'Ninguém te leva a sério para isso ainda',
  planning: 'Você já está planejando um golpe',
  tried: 'Você já fez isso demais este ano',
};

export function CrimeScreen({ game }: { game: GameState }) {
  const st = useGameStore();
  const nav = useNav();
  const adult = game.character.age >= 18;
  const hints = [wantedHint(game.crime.wanted, game.character.sex), crimeRepHint(game.crime.rep, game.character.sex)].filter(Boolean);
  const laundry = launderBlockReason(game);
  return (
    <>
      <p className="text-sm text-[var(--ds-text-muted)]">Crime pode dar dinheiro rápido, mas cada delito aumenta o risco de prisão, ferimento e de perder tudo o que você construiu.</p>
      {hints.length > 0 && (
        <div className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm" data-testid="crime-hints">
          {hints.map((h) => (
            <p key={h}>{h}</p>
          ))}
        </div>
      )}
      {TIER.filter((t) => adult || t.tier === 'leve').map((t) => (
        <ListGroup key={t.tier} title={t.title}>
          {C.crime.crimes
            .filter((c) => c.tier === t.tier)
            .map((c) => {
              const r = crimeBlockReason(game, c.id, C);
              return (
                <ListItem
                  key={c.id}
                  leading={<SpriteIcon set="crime" id={c.id} />}
                  title={c.label}
                  subtitle={`Risco: ${crimeRiskLabel(c)}${c.plan ? ' · planejamento em etapas' : ''}`}
                  disabled={!!r}
                  reason={r ? REASON[r] : undefined}
                  onClick={() => (c.plan ? st.startPlan(c.id) : st.commitCrime(c.id))}
                  chevron={!!c.plan}
                  testId={`crime-${c.id}`}
                />
              );
            })}
        </ListGroup>
      ))}
      {adult && game.crime.faction && (() => {
        const f = factionDef(C, game.crime.faction.id)!;
        return (
          <ListGroup title="Facção">
            <div className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm" data-testid="crime-faction">
              <p className="flex items-center gap-2 font-semibold">
                <SpriteIcon set="faction" id={f.id} colors={f.colors} />
                {f.name} · {factionRankTitle(game, C)}
              </p>
              <p className="text-xs text-[var(--ds-text-muted)]">Símbolo: {f.symbol}. Regras: {f.rules.join(' ')}</p>
              {game.crime.faction.debt > 0 && <p className="text-[var(--ds-danger)]">Você está devendo à facção.</p>}
            </div>
            <ListItem emoji="🚪" title="Tentar sair da facção" subtitle="Ninguém sai fácil" tone="danger" disabled={game.pendingEvents.length > 0} reason="Resolva o acontecimento pendente" onClick={st.tryLeaveFaction} chevron={false} testId="crime-leave-faction" />
          </ListGroup>
        );
      })()}
      {adult && (
        <ListGroup title="Tráfico de drogas">
          {(['pequeno', 'medio', 'grande'] as TraffickingLevel[]).map((lv) => {
            const r = traffickingBlockReason(game, lv);
            const label = { pequeno: 'Pequeno envolvimento', medio: 'Envolvimento médio', grande: 'Esquema grande' }[lv];
            return (
              <ListItem key={lv} leading={<SpriteIcon set="crime" id="trafico" />} title={label} subtitle={`Lucro anual alto · risco ${lv === 'pequeno' ? 'alto' : 'muito alto'} de apreensão, prisão e morte`} disabled={!!r} reason={r === 'already' ? 'É o seu nível atual' : r === 'rep' ? 'Ninguém te leva a sério para isso ainda' : 'Indisponível agora'} onClick={() => st.setTrafficking(lv)} chevron={false} testId={`crime-trafico-${lv}`} />
            );
          })}
          {game.crime.trafficking && <ListItem emoji="✋" title="Largar o tráfico" onClick={() => st.setTrafficking(null)} chevron={false} testId="crime-trafico-stop" />}
          <p className="text-xs text-[var(--ds-text-muted)]">Referência: um ano no nível pequeno rende em torno de R$ {TRAFFICKING.pequeno.profit.toLocaleString('pt-BR')} — quando não dá errado.</p>
        </ListGroup>
      )}
      <ListItem emoji="📁" title="Ficha" subtitle="Ficha criminal e situação na justiça" onClick={() => nav.push('ficha')} testId="crime-ficha" />
      {adult && game.crime.dirty >= 1000 && (
        <ListGroup title="Dinheiro">
          <p className="text-sm">Você tem dinheiro que chama atenção. Gastar muito de uma vez pode levantar suspeitas.</p>
          <ListItem emoji="🧺" title="Lavar pelo seu negócio" subtitle="Custa uma parte e tem risco" disabled={!!laundry} reason={laundry === 'no-business' ? 'Precisa de um empreendimento (Bens → Mercado)' : laundry === 'tried' ? 'Só uma vez por ano' : 'Indisponível agora'} onClick={st.launderMoney} chevron={false} testId="crime-launder" />
        </ListGroup>
      )}
    </>
  );
}

const CRIME_LABEL = (id: string) => C.crime.crimes.find((c) => c.id === id)?.label ?? ({ trafico: 'Tráfico de drogas', briga: 'Briga', corrupcao: 'Corrupção', excesso: 'Excesso no uso da força', fuga: 'Fuga', investigacao: 'Investigação' } as Record<string, string>)[id] ?? id;

/** Ficha criminal e situação na justiça (release 0.0.2). */
export function FichaScreen({ game }: { game: GameState }) {
  const { record, juvenile, case: cs } = game.crime;
  const p = game.prison;
  return (
    <>
      <ListGroup title="Situação">
        <div className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm" data-testid="ficha-status">
          {p ? (
            <p>Cumprindo pena: {p.sentence} anos em regime {p.regime} · {p.facility}</p>
          ) : cs ? (
            <p>Processo em andamento: {CRIME_LABEL(cs.crimeId)} · {cs.lawyer === 'particular' || cs.lawyer === 'proprio' ? 'advogado particular' : cs.lawyer === 'publico' ? 'Defensoria Pública' : 'sem defesa ainda'}{cs.free ? ' · respondendo em liberdade' : ''}</p>
          ) : (
            <p>Nenhum processo em andamento.</p>
          )}
          {game.flags.foragido ? <p className="text-[var(--ds-danger)]">Você é considerad{game.character.sex === 'M' ? 'o' : 'a'} foragid{game.character.sex === 'M' ? 'o' : 'a'}.</p> : null}
        </div>
      </ListGroup>
      <ListGroup title="Ficha criminal">
        {record.length === 0 ? (
          <p className="text-sm" data-testid="ficha-limpa">Ficha limpa.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm" data-testid="ficha-registros">
            {record.map((r, i) => (
              <li key={i} className="rounded-lg bg-[var(--ds-surface)] px-3 py-2">
                {r.age} anos · {CRIME_LABEL(r.crime)} · {r.kind === 'condenacao' ? (r.years ? `condenação (${r.years} ${r.years === 1 ? 'ano' : 'anos'})` : 'condenação (pena alternativa)') : 'passagem pela polícia'}
              </li>
            ))}
          </ul>
        )}
        {record.some((r) => r.kind === 'condenacao') && <p className="text-xs text-[var(--ds-text-muted)]">Com condenação na ficha, concursos públicos e empregos que exigem ficha limpa ficam fechados.</p>}
        {juvenile.length > 0 && <p className="text-xs text-[var(--ds-text-muted)]">Passagens antes dos 18 não contam na ficha de adulto.</p>}
      </ListGroup>
    </>
  );
}
