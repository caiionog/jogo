import type { Rng } from '../core/rng';
import type { Character, Sex, Stats } from '../core/state';
import type { Location } from '../core/content';

export interface CharacterInput {
  name: string;
  sex: Sex;
}

export function randomStats(rng: Rng): Stats {
  return {
    health: rng.int(70, 100),
    happiness: rng.int(60, 100),
    intelligence: rng.int(20, 90),
    looks: rng.int(20, 95),
    strength: rng.int(5, 20),
    fitness: rng.int(5, 25),
  };
}

export function createCharacter(
  rng: Rng,
  input: CharacterInput,
  locations: readonly Location[],
  birthYear: number,
): Character {
  const loc = rng.pick(locations);
  const name = input.name.trim() || 'Sem Nome';
  const character: Character = {
    name,
    sex: input.sex,
    age: 0,
    birthYear,
    country: loc.country,
    city: rng.pick(loc.cities),
    familyWealth: 0,
    stats: randomStats(rng),
  };
  // sorteado por último para não alterar a sequência dos demais sorteios
  return { ...character, familyWealth: rng.int(0, 100) };
}
