import type { FlagValue, GameState, StatKey } from './state';
import { addStats } from './stats';

/** Efeito declarativo, usado por ações e escolhas de eventos. */
export interface Effects {
  stats?: Partial<Record<StatKey, number>>;
  money?: number;
  setFlags?: Record<string, FlagValue>;
  clearFlags?: string[];
}

export function applyEffects(state: GameState, effects: Effects | undefined): GameState {
  if (!effects) return state;
  let flags = state.flags;
  if (effects.setFlags || effects.clearFlags) {
    flags = { ...flags, ...effects.setFlags };
    for (const f of effects.clearFlags ?? []) delete flags[f];
  }
  return {
    ...state,
    money: state.money + (effects.money ?? 0),
    flags,
    character: effects.stats
      ? { ...state.character, stats: addStats(state.character.stats, effects.stats) }
      : state.character,
  };
}

/** Substitui placeholders simples no texto ({name}, {city}). */
export function formatText(state: GameState, text: string): string {
  return text
    .replaceAll('{name}', state.character.name)
    .replaceAll('{city}', state.character.city);
}
