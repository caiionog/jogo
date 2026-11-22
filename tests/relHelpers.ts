import { GAME_CONTENT } from '../src/content';
import type { GameState, Person, RelType } from '../src/engine';
import { addRelation, createPerson, createRng, newGame } from '../src/engine';

export function life(seed = 'rel', opts: { adultContent?: boolean } = {}): GameState {
  return newGame({ seed, name: 'Kauã Ferreira', sex: 'M', birthYear: 2000, adultContent: opts.adultContent ?? false }, GAME_CONTENT);
}

/** Personagem de `age` anos com energia cheia. */
export function aged(age: number, seed = 'rel', opts: { adultContent?: boolean } = {}): GameState {
  const g = life(seed, opts);
  return { ...g, year: 2000 + age, character: { ...g.character, age }, energy: { current: 8, max: 8 }, money: 50000 };
}

/** Adiciona uma pessoa com relação, devolvendo o estado e a pessoa. */
export function withPerson(state: GameState, type: RelType, age: number, extra: { affection?: number; stage?: 'ficando' | 'namorando' | 'noivos' | 'casados'; sex?: 'M' | 'F'; traits?: string[] } = {}): [GameState, Person] {
  const rng = createRng(age * 31 + type.length);
  let [s, p] = createPerson(state, rng, GAME_CONTENT, { age, sex: extra.sex ?? 'F', ...(extra.traits ? { traits: extra.traits } : {}) });
  s = addRelation(s, p.id, type, extra.affection ?? 60, extra.stage ? { romance: { stage: extra.stage, since: state.character.age } } : {});
  return [s, p];
}
