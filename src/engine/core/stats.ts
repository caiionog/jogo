import type { GameState, StatKey, Stats } from './state';
import { STAT_KEYS } from './state';

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export const clamp = (v: number, min = STAT_MIN, max = STAT_MAX): number =>
  Math.min(max, Math.max(min, Math.round(v)));

export function addStats(stats: Stats, delta: Partial<Record<StatKey, number>>): Stats {
  const out = { ...stats };
  for (const key of STAT_KEYS) {
    const d = delta[key];
    if (d !== undefined) out[key] = clamp(out[key] + d);
  }
  return out;
}

/** Adiciona uma linha ao log do ano atual (cria a entrada se não existir). */
export function appendLog(state: GameState, text: string): GameState {
  const log = state.log.slice();
  const last = log[log.length - 1];
  if (last && last.age === state.character.age) {
    log[log.length - 1] = { ...last, entries: [...last.entries, text] };
  } else {
    log.push({ age: state.character.age, year: state.year, entries: [text] });
  }
  return { ...state, log };
}
