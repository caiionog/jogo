/** Estados de cenário para `release-check.mjs` (release 0.0.1). npx tsx scripts/e2e/states.ts tmp/e2e-states.json */
import { writeFileSync } from 'node:fs';
import { GAME_CONTENT as C } from '../../src/content';
import { newGame } from '../../src/engine';
import type { GameState } from '../../src/engine';

const base = (seed: string, age: number, sex: 'M' | 'F' = 'M'): GameState => {
  const g = newGame({ seed, name: 'Teste', sex, birthYear: 2026 - age, uf: 'SP', city: 'São Paulo' }, C);
  return { ...g, year: 2026, money: 500000, character: { ...g.character, age, stats: { ...g.character.stats, health: 90, athletic: 60, intelligence: 70 } }, education: { ...g.education, current: null, graduated: age >= 18 } };
};
const states: Record<string, GameState> = {};
const f = base('e2e-faixas', 17);
states.faixas = { ...f, fighter: { ...f.fighter, gymId: 'sp_tatame_paulista', grades: { jiujitsu: { system: 'bjj_adulto', rank: 1, degree: 1, years: 1 } }, trainedThisYear: ['jiujitsu'] } };
const m = base('e2e-muay', 22, 'F');
states.muaythai = { ...m, fighter: { ...m.fighter, gymId: 'sp_muay_zona_leste', grades: { muaythai: { system: 'muaythai_fsbmt', rank: 3, degree: 0, years: 1 } }, trainedThisYear: ['muaythai'] } };
const fac = base('e2e-fac', 25);
states.faculdade = { ...fac, college: { ...fac.college, diplomas: ['fisioterapia'], examScore: 720, examYear: 2020 }, flags: { ...fac.flags, formado_fisioterapia: true } };
const cl = base('e2e-clube', 20);
states.clube = { ...cl, sportsClub: { clubId: 'clube_aquatico', sport: 'natacao', years: 2 } };
const n = base('e2e-noite', 22);
states.noite_off = { ...n, relationships: { ...n.relationships, settings: { ...n.relationships.settings, adultContent: false } } };
states.noite_on = { ...n, relationships: { ...n.relationships, settings: { ...n.relationships.settings, adultContent: true } } };
states.mercado = base('e2e-mercado', 30);
writeFileSync(process.argv[2] ?? 'tmp/e2e-states.json', JSON.stringify(states));
