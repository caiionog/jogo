/** Telas de meta-progressão (Etapa 6): Conquistas, Hall da Fama e árvore genealógica. */
import { GAME_CONTENT } from '../../content';
import { BELTS, metricValue, relationsOf } from '../../engine';
import type { GameState, MetaState } from '../../engine';
import { useGameStore } from '../store';
import { money } from './ecoUi';
import Sheet from './Sheet';

const C = GAME_CONTENT;

export function AchievementsScreen({ onClose }: { onClose: () => void }) {
  const meta = useGameStore((s) => s.meta);
  const game = useGameStore((s) => s.game);
  const total = C.achievements.length;
  const done = C.achievements.filter((a) => meta.achievements[a.id]).length;
  return (
    <Sheet title="Conquistas" onClose={onClose} testId="achievements-screen" full>
      <p className="text-sm text-[var(--ds-text)]" data-testid="achievements-progress">
        {done} de {total} desbloqueadas
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ds-surface-2)]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="h-full bg-amber-400" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-2">
        {C.achievements.map((a) => {
          const got = meta.achievements[a.id];
          const hidden = a.secret && !got;
          const progress = !got && game && a.min && a.min > 1 && !a.onDeath ? Math.min(a.min, Math.max(0, metricValue(a.metric, game, meta))) : null;
          return (
            <li key={a.id} className={`flex items-center gap-3 rounded-xl border p-3 ${got ? 'border-amber-500/40 bg-amber-500/10' : 'border-[var(--ds-border)] bg-[var(--ds-bg)]'}`} data-testid={got ? 'ach-unlocked' : 'ach-locked'}>
              <span className={`text-2xl ${got ? '' : 'opacity-40 grayscale'}`} aria-hidden>
                {hidden ? '❓' : a.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${got ? 'text-amber-200' : 'text-[var(--ds-text)]'}`}>{hidden ? 'Conquista secreta' : a.name}</p>
                <p className="text-[11px] text-[var(--ds-text-muted)]">{hidden ? '???' : a.description}</p>
                {got && <p className="text-[10px] text-amber-300/80">com {got.life} · {new Date(got.at).toLocaleDateString('pt-BR')}</p>}
                {progress !== null && a.min && progress > 0 && a.min <= 1000 && (
                  <p className="text-[10px] text-[var(--ds-text-muted)]">
                    Progresso: {Math.floor(progress)}/{a.min}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

export function HallOfFameScreen({ onClose }: { onClose: () => void }) {
  const meta = useGameStore((s) => s.meta);
  return (
    <Sheet title="Hall da Fama" onClose={onClose} testId="hall-screen" full>
      <Stats meta={meta} />
      {meta.hallOfFame.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ds-text-muted)]">Nenhuma vida encerrada ainda. Quando um personagem morre, ele entra aqui.</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2" data-testid="hall-list">
          {meta.hallOfFame.map((h, i) => (
            <li key={h.id} className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg)] p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-semibold">
                  {i + 1}. {h.name}
                </p>
                <span className="shrink-0 text-sm font-bold tabular-nums text-amber-300">{h.score} pts</span>
              </div>
              <p className="text-[11px] text-[var(--ds-text-muted)]">
                {h.born}–{h.died} · {h.age} anos · {h.generation}ª geração {h.dynasty} · {h.cause}
              </p>
              <p className="text-[11px] text-[var(--ds-text-muted)]">
                Cartel {h.record}
                {h.titles.length ? ` · ${h.titles.join(', ')}` : ''} · patrimônio {money.format(h.netWorth)}
              </p>
              {h.summary && <p className="mt-1 text-xs text-[var(--ds-text)]">{h.summary}</p>}
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}

function Stats({ meta }: { meta: MetaState }) {
  const s = meta.stats;
  const items = [
    ['Vidas', s.lives],
    ['Mortes', s.deaths],
    ['Maior geração', s.generations],
    ['Anos vividos', s.totalYears],
    ['Lutas', s.totalFights],
    ['Melhor nota', s.bestScore],
  ] as const;
  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-xl bg-[var(--ds-bg)] px-1 py-2">
          <dt className="text-[10px] text-[var(--ds-text-muted)]">{k}</dt>
          <dd className="text-base font-bold tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Árvore simples: antepassados jogados (do fundador até você) e seus filhos. */
export function FamilyTree({ game }: { game: GameState }) {
  const d = game.dynasty;
  const kids = relationsOf(game, ['filho'], false);
  const levels: { gen: number; label: string; rows: { name: string; detail: string; me?: boolean; dead?: boolean }[] }[] = [];
  for (const m of d.members) {
    levels.push({
      gen: m.gen,
      label: `${m.gen}ª geração`,
      rows: [{ name: m.name, detail: `${m.born}–${m.died} · ${m.record !== '0-0-0' ? `cartel ${m.record}` : 'sem lutas pro'}${m.titles.length ? ` · ${m.titles.length} título(s)` : ''}${m.belt ? ` · faixa ${BELTS[m.belt]}` : ''} · nota ${m.score}`, dead: true }],
    });
  }
  const c = game.character;
  levels.push({ gen: d.generation, label: `${d.generation}ª geração (você)`, rows: [{ name: c.name, detail: `${c.birthYear}${game.alive ? ` · ${c.age} anos` : `–${c.death?.year ?? game.year}`}`, me: true, dead: !game.alive }] });
  if (kids.length) {
    levels.push({
      gen: d.generation + 1,
      label: `${d.generation + 1}ª geração`,
      rows: kids.map((k) => ({ name: k.person.name, detail: `${k.person.age} anos${k.person.alive ? '' : ' · falecido(a)'}${k.person.flags.lutador_mirim ? ' · 🥋' : ''}`, dead: !k.person.alive })),
    });
  }
  return (
    <section className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-3" data-testid="family-tree">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-muted)]">Família {d.surname}</h2>
      <ol className="flex flex-col gap-1">
        {levels.map((l, i) => (
          <li key={l.gen}>
            <p className="text-[10px] uppercase tracking-wide text-[var(--ds-text-muted)]">{l.label}</p>
            <ul className="flex flex-col gap-1" style={{ paddingLeft: `${Math.min(i, 4) * 10}px` }}>
              {l.rows.map((r) => (
                <li key={r.name} className={`rounded-lg px-2 py-1.5 text-sm ${r.me ? 'border border-emerald-600/60 bg-emerald-500/10' : 'bg-[var(--ds-bg)]'}`}>
                  <span className={r.dead ? 'text-[var(--ds-text)]' : ''}>
                    {r.dead ? '✝ ' : ''}
                    {r.name}
                  </span>
                  <span className="block text-[11px] text-[var(--ds-text-muted)]">{r.detail}</span>
                </li>
              ))}
            </ul>
            {i < levels.length - 1 && <p className="pl-3 text-xs text-[var(--ds-text-muted)]" aria-hidden>│</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
