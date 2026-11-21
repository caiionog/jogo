import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { STAT_KEYS } from '../core/state';
import type { GameEvent } from './types';

export function isEligible(state: GameState, event: GameEvent): boolean {
  const c = event.conditions;
  const { age, sex, stats } = state.character;
  if (event.weight <= 0) return false;
  if (event.once && state.firedEvents.includes(event.id)) return false;
  if (c.minAge !== undefined && age < c.minAge) return false;
  if (c.maxAge !== undefined && age > c.maxAge) return false;
  if (c.sex !== undefined && sex !== c.sex) return false;
  if (c.stats) {
    for (const key of STAT_KEYS) {
      const range = c.stats[key];
      if (!range) continue;
      if (range.min !== undefined && stats[key] < range.min) return false;
      if (range.max !== undefined && stats[key] > range.max) return false;
    }
  }
  if (c.flagsAll?.some((f) => !state.flags[f])) return false;
  if (c.flagsNone?.some((f) => state.flags[f])) return false;
  return true;
}

export function eligibleEvents(state: GameState, events: readonly GameEvent[]): GameEvent[] {
  return events.filter((e) => isEligible(state, e));
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
