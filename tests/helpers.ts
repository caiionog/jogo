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

import type { Enrollment } from '../src/engine';
import { createRng, createEnrollment, resolveEvent, advanceYear } from '../src/engine';

/** Personagem com idade e matrícula (série = idade - 3) prontos para teste. */
export function enrolledGame(age = 10, patch: Partial<Enrollment> = {}, seed: string | number = 'escola'): GameState {
  const g = withAge(makeGame(seed), age);
  const enrollment = { ...createEnrollment(createRng(1), g, GAME_CONTENT, Math.max(0, age - 3)), ...patch };
  return {
    ...g,
    energy: { current: 6, max: 6 },
    education: { ...g.education, current: enrollment },
  };
}

/** Resolve todos os eventos pendentes escolhendo sempre a primeira opção. */
export function resolveAllFirst(state: GameState, content: GameContent = GAME_CONTENT): GameState {
  let s = state;
  while (s.pendingEvents.length > 0) {
    const ev = content.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
    s = resolveEvent(s, ev.id, ev.choices[0]!.id, content);
  }
  return s;
}

/** Avança N anos resolvendo eventos com a primeira opção. */
export function playYears(state: GameState, years: number, content: GameContent = GAME_CONTENT): GameState {
  let s = state;
  for (let i = 0; i < years; i++) s = resolveAllFirst(advanceYear(s, content), content);
  return s;
}

/** Conteúdo sem eventos, para isolar a lógica escolar. */
export const NO_EVENTS: GameContent = { ...GAME_CONTENT, events: [] };
