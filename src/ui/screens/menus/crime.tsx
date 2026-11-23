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
import { useGameStore } from '../../store';

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
                  emoji={c.emoji}
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
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: f.colors[0], outline: `2px solid ${f.colors[1]}` }} aria-hidden />
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
              <ListItem key={lv} emoji="💊" title={label} subtitle={`Lucro anual alto · risco ${lv === 'pequeno' ? 'alto' : 'muito alto'} de apreensão, prisão e morte`} disabled={!!r} reason={r === 'already' ? 'É o seu nível atual' : r === 'rep' ? 'Ninguém te leva a sério para isso ainda' : 'Indisponível agora'} onClick={() => st.setTrafficking(lv)} chevron={false} testId={`crime-trafico-${lv}`} />
            );
          })}
          {game.crime.trafficking && <ListItem emoji="✋" title="Largar o tráfico" onClick={() => st.setTrafficking(null)} chevron={false} testId="crime-trafico-stop" />}
          <p className="text-xs text-[var(--ds-text-muted)]">Referência: um ano no nível pequeno rende em torno de R$ {TRAFFICKING.pequeno.profit.toLocaleString('pt-BR')} — quando não dá errado.</p>
        </ListGroup>
      )}
      {adult && game.crime.dirty >= 1000 && (
        <ListGroup title="Dinheiro">
          <p className="text-sm">Você tem dinheiro que chama atenção. Gastar muito de uma vez pode levantar suspeitas.</p>
          <ListItem emoji="🧺" title="Lavar pelo seu negócio" subtitle="Custa uma parte e tem risco" disabled={!!laundry} reason={laundry === 'no-business' ? 'Precisa de um empreendimento (Bens → Mercado)' : laundry === 'tried' ? 'Só uma vez por ano' : 'Indisponível agora'} onClick={st.launderMoney} chevron={false} testId="crime-launder" />
        </ListGroup>
      )}
    </>
  );
}
