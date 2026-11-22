import { GAME_CONTENT } from '../src/content';
import type { GameState } from '../src/engine';

/** Coloca uma lesão do catálogo no estado (sem log/efeitos), para testes. */
export function withInjury(state: GameState, defId: string, months = 12, extra: Partial<GameState['health']['injuries'][number]> = {}): GameState {
  const def = GAME_CONTENT.health.injuries.find((d) => d.id === defId)!;
  const inj = { id: `t${state.health.nextId}`, defId, severity: def.severity, months, treatment: 'none' as const, aggravated: false, age: state.character.age, source: 'luta' as const, ...extra };
  return { ...state, health: { ...state.health, injuries: [...state.health.injuries, inj], nextId: state.health.nextId + 1 } };
}

export const noInjuries = (s: GameState): GameState => ({ ...s, health: { ...s.health, injuries: [] } });
