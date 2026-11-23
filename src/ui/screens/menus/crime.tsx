/**
 * Atividades → Crime (release 0.0.2): delitos por categoria com o risco em palavras; menores (12–17) veem só os
 * leves. Procurado e reputação no crime nunca aparecem como número (só pistas). A tela final (ficha, processo) é
 * da fase 9.
 */
import { GAME_CONTENT as C } from '../../../content';
import type { CrimeBlockReason, CrimeTier, GameState } from '../../../engine';
import { crimeBlockReason, crimeRepHint, crimeRiskLabel, launderBlockReason, wantedHint } from '../../../engine';
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
      {adult && game.crime.dirty >= 1000 && (
        <ListGroup title="Dinheiro">
          <p className="text-sm">Você tem dinheiro que chama atenção. Gastar muito de uma vez pode levantar suspeitas.</p>
          <ListItem emoji="🧺" title="Lavar pelo seu negócio" subtitle="Custa uma parte e tem risco" disabled={!!laundry} reason={laundry === 'no-business' ? 'Precisa de um empreendimento (Bens → Mercado)' : laundry === 'tried' ? 'Só uma vez por ano' : 'Indisponível agora'} onClick={st.launderMoney} chevron={false} testId="crime-launder" />
        </ListGroup>
      )}
    </>
  );
}
