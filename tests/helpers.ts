import type { GameContent, GameEvent, GameState } from '../src/engine';
import { newGame } from '../src/engine';
import { GAME_CONTENT } from '../src/content';

export function makeGame(seed: string | number = 'teste', content: GameContent = GAME_CONTENT): GameState {
  return newGame({ seed, name: 'Teste', sex: 'M', birthYear: 2010 }, content);
}

export function withAge(state: GameState, age: number, health = state.character.stats.health): GameState {
  return {
    ...state,
    character: { ...state.character, age, stats: { ...state.character.stats, health } },
  };
}

export function makeEvent(id: string, partial: Partial<GameEvent> = {}): GameEvent {
  return {
    id,
    conditions: {},
    weight: 1,
    text: id,
    choices: [{ id: 'ok', label: 'Ok', resultText: `${id} resolvido` }],
    ...partial,
  };
}
