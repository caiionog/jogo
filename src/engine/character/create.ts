import type { Appearance } from './appearance/genes';
import { lookRng, randomAppearance, ufOrDefault } from './appearance/inherit';
import type { Rng } from '../core/rng';
import type { Character, Sex, Stats } from '../core/state';
import type { GeoContent } from '../geo/types';
import { pickBirthplace } from '../geo';
import { bodyFor, randomAdultHeight } from '../fighting/body';

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
    athletic: rng.int(5, 22),
  };
}

export function createCharacter(
  rng: Rng,
  input: CharacterInput,
  geo: GeoContent,
  birthYear: number,
  place?: { uf: string; city: string },
  appearance?: Appearance,
): Character {
  // nascimento no Brasil: UF pelo peso populacional, depois a cidade (ou o local escolhido na criação)
  const loc = place ?? pickBirthplace(rng, geo);
  const name = input.name.trim() || 'Sem Nome';
  const character: Character = {
    name,
    sex: input.sex,
    age: 0,
    birthYear,
    country: 'Brasil',
    uf: loc.uf,
    city: loc.city,
    familyWealth: 0,
    heightCm: 0,
    weightKg: 0,
    adultHeightCm: 0,
    build: 0,
    stats: randomStats(rng),
    appearance: undefined as unknown as Appearance,
  };
  // sorteados por último para não alterar a sequência dos demais sorteios
  const familyWealth = rng.int(0, 100);
  const adultHeightCm = randomAdultHeight(rng, input.sex);
  const build = rng.int(-2, 2);
  // aparência: escolhida na criação ou sorteada pela cor ou raça da UF de nascimento (Etapa 7)
  const look = appearance ?? randomAppearance(lookRng(rng), ufOrDefault(geo, loc.uf), input.sex);
  const withBody = { ...character, familyWealth, adultHeightCm, build, appearance: look };
  return { ...withBody, ...bodyFor(0, withBody) };
}
