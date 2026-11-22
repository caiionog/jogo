/** Conquistas e Hall da Fama (Etapa 6): avaliação pura; o armazenamento meta fica em `src/save/meta.ts`. */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { netWorth } from '../economy/worth';
import { metricValue } from './metrics';
import { MAX_HALL } from './types';
import type { AchievementDef, HallEntry, MetaState } from './types';

/** A condição da conquista vale para este estado? */
export function achievementMet(def: AchievementDef, state: GameState, meta: MetaState): boolean {
  if (def.onDeath && state.alive) return false;
  const v = metricValue(def.metric, state, meta);
  if (def.min !== undefined && v < def.min) return false;
  if (def.max !== undefined && v > def.max) return false;
  return true;
}

/**
 * Avalia todas as conquistas ainda bloqueadas. `at` é a data (ISO) vinda da UI. Nunca desbloqueia duas vezes.
 */
export function evaluateAchievements(state: GameState, meta: MetaState, content: GameContent, at: string): { meta: MetaState; unlocked: AchievementDef[] } {
  const unlocked: AchievementDef[] = [];
  let achievements = meta.achievements;
  for (const def of content.achievements) {
    if (achievements[def.id]) continue;
    if (!achievementMet(def, state, meta)) continue;
    achievements = { ...achievements, [def.id]: { at, life: state.character.name } };
    unlocked.push(def);
  }
  return unlocked.length ? { meta: { ...meta, achievements }, unlocked } : { meta, unlocked };
}

export function hallId(state: GameState): string {
  return `${state.seed}#${state.dynasty.generation}#${state.character.name}`;
}

/** Entrada do Hall da Fama para uma vida encerrada. */
export function hallEntry(state: GameState): HallEntry {
  const c = state.character;
  const f = state.fighter;
  const titles: string[] = [];
  if (state.feats.majorTitles) titles.push(`${state.feats.majorTitles}× Circuito Titã`);
  if (state.feats.regionalTitles) titles.push(`${state.feats.regionalTitles}× regional`);
  return {
    id: hallId(state),
    name: c.name,
    sex: c.sex,
    generation: state.dynasty.generation,
    dynasty: state.dynasty.surname,
    born: c.birthYear,
    died: c.death?.year ?? state.year,
    age: c.death?.age ?? c.age,
    cause: c.death?.cause ?? '—',
    score: state.ending?.score ?? 0,
    record: `${f.pro.wins}-${f.pro.losses}-${f.pro.draws}`,
    titles,
    netWorth: netWorth(state),
    summary: state.ending?.obituary.headline ?? '',
  };
}

/** Registra a vida encerrada no meta (uma vez): Hall da Fama (máx. 200, por nota) e estatísticas globais. */
export function recordLifeEnd(meta: MetaState, state: GameState): MetaState {
  if (state.alive) return meta;
  const entry = hallEntry(state);
  if (meta.hallOfFame.some((h) => h.id === entry.id)) return meta;
  const hallOfFame = [...meta.hallOfFame, entry].sort((a, b) => b.score - a.score).slice(0, MAX_HALL);
  const f = state.fighter;
  return {
    ...meta,
    hallOfFame,
    stats: {
      ...meta.stats,
      deaths: meta.stats.deaths + 1,
      generations: Math.max(meta.stats.generations, state.dynasty.generation),
      totalYears: meta.stats.totalYears + entry.age,
      totalFights: meta.stats.totalFights + f.pro.wins + f.pro.losses + f.pro.draws + f.amateur.wins + f.amateur.losses + f.amateur.draws,
      bestScore: Math.max(meta.stats.bestScore, entry.score),
    },
  };
}

/** Uma vida nova começou (nova vida ou herdeiro). */
export function recordLifeStart(meta: MetaState): MetaState {
  return { ...meta, stats: { ...meta.stats, lives: meta.stats.lives + 1 } };
}
