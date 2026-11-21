import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { STAT_KEYS } from '../core/state';
import { stageOfGrade } from '../lifeStages/school';
import type { EventConditions, GameEvent, SchoolResultTag, StatRange } from './types';

const inRange = (v: number, r: StatRange | undefined) =>
  !r || ((r.min === undefined || v >= r.min) && (r.max === undefined || v <= r.max));

function schoolConditionsMet(state: GameState, c: EventConditions): boolean {
  const cur = state.education.current;
  const needsEnrollment = c.enrolled === true || c.schoolStages || c.school || c.schoolType || c.club;
  if (c.enrolled === false && cur) return false;
  if (!needsEnrollment) return true;
  if (!cur) return false;
  if (c.schoolStages && !c.schoolStages.includes(stageOfGrade(cur.grade))) return false;
  if (c.schoolType && cur.school.type !== c.schoolType) return false;
  if (c.school) {
    if (!inRange(cur.average, c.school.average)) return false;
    if (!inRange(cur.discipline, c.school.discipline)) return false;
    if (!inRange(cur.popularity, c.school.popularity)) return false;
  }
  if (c.club === 'any' && !cur.club) return false;
  if (c.club === 'none' && cur.club) return false;
  if (Array.isArray(c.club) && (!cur.club || !c.club.includes(cur.club))) return false;
  return true;
}

function schoolResultTags(state: GameState): SchoolResultTag[] {
  const r = state.education.lastResult;
  if (!r) return [];
  const tags: SchoolResultTag[] = [r.passed ? 'passed' : 'failed'];
  if (r.honors) tags.push('honors');
  if (r.graduated) tags.push('graduated');
  if (r.expelled) tags.push('expelled');
  return tags;
}

/** Verifica apenas as condições do evento (idade, atributos, flags, escola, `once`). */
export function conditionsMet(state: GameState, event: GameEvent): boolean {
  const c = event.conditions;
  const { age, sex, stats } = state.character;
  if (event.once && state.firedEvents.includes(event.id)) return false;
  if (c.minAge !== undefined && age < c.minAge) return false;
  if (c.maxAge !== undefined && age > c.maxAge) return false;
  if (c.sex !== undefined && sex !== c.sex) return false;
  if (c.stats) {
    for (const key of STAT_KEYS) {
      if (!inRange(stats[key], c.stats[key])) return false;
    }
  }
  if (c.flagsAll?.some((f) => !state.flags[f])) return false;
  if (c.flagsNone?.some((f) => state.flags[f])) return false;
  if (!schoolConditionsMet(state, c)) return false;
  if (c.schoolResult) {
    const tags = schoolResultTags(state);
    if (!c.schoolResult.some((t) => tags.includes(t))) return false;
  }
  return true;
}

/** Elegível para o SORTEIO aleatório: trigger 'random', peso > 0 e condições atendidas. */
export function isEligible(state: GameState, event: GameEvent): boolean {
  if ((event.trigger ?? 'random') !== 'random') return false;
  if (event.weight <= 0) return false;
  return conditionsMet(state, event);
}

export function eligibleEvents(state: GameState, events: readonly GameEvent[]): GameEvent[] {
  return events.filter((e) => isEligible(state, e));
}

/** Eventos 'auto' que devem entrar neste ano. */
export function autoEvents(state: GameState, events: readonly GameEvent[]): GameEvent[] {
  return events.filter((e) => e.trigger === 'auto' && conditionsMet(state, e));
}

/** Sorteia até `count` eventos elegíveis, ponderados por peso, sem repetição. */
export function selectEvents(
  state: GameState,
  events: readonly GameEvent[],
  count: number,
  rng: Rng,
): GameEvent[] {
  const pool = eligibleEvents(state, events);
  const chosen: GameEvent[] = [];
  while (chosen.length < count && pool.length > 0) {
    const idx = rng.weightedIndex(pool.map((e) => e.weight));
    chosen.push(pool[idx] as GameEvent);
    pool.splice(idx, 1);
  }
  return chosen;
}
