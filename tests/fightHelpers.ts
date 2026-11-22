import { GAME_CONTENT } from '../src/content';
import type { GameState, Npc, Roster, Skills } from '../src/engine';
import { createRng, generateNpc, newGame } from '../src/engine';

/** Adulto de `age` anos, com habilidades e estado de luta sob medida. */
export function fighterGame(age = 22, skills: Partial<Skills> = {}, patch: Partial<GameState['fighter']> = {}, seed = 'luta'): GameState {
  const g = newGame({ seed, name: 'Kauã Teste', sex: 'M', birthYear: 2000 }, GAME_CONTENT);
  return {
    ...g,
    year: 2000 + age,
    character: { ...g.character, age, heightCm: 178, weightKg: 75, stats: { ...g.character.stats, health: 90 } },
    energy: { current: 8, max: 8 },
    fighter: { ...g.fighter, skills: { ...g.fighter.skills, ...skills }, ...patch },
  };
}

export function npc(id: string, level = 50): Npc {
  return { ...generateNpc(createRng(id.length * 7 + level), id, level, 'M', GAME_CONTENT), id };
}

export function roster(ranking: string[], champion: string | null, extra: string[] = []): Roster {
  return {
    orgId: 'arc',
    divisionId: 'm_meiomedio',
    npcs: [...ranking, ...(champion ? [champion] : []), ...extra].filter((x) => x !== 'player').map((id) => npc(id)),
    ranking,
    champion,
  };
}
