/** Estados de cenário da release 0.0.3 (navegador): npx tsx scripts/e2e/states003.ts tmp/s003 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { GAME_CONTENT as C } from '../../src/content';
import { addRelation, createPerson, createRng, newGame, targetVars } from '../../src/engine';
import type { GameState, Person } from '../../src/engine';

const out = process.argv[2] ?? 'tmp/s003';
mkdirSync(out, { recursive: true });

function base(age: number, seed: string, sex: 'M' | 'F', adultContent: boolean): GameState {
  const g = newGame({ seed, name: 'Teste', sex, birthYear: 2026 - age, uf: 'SP', city: 'São Paulo', adultContent }, C);
  return { ...g, year: 2026, money: 20000, character: { ...g.character, age, stats: { ...g.character.stats, health: 90, happiness: 70 } }, economy: { ...g.economy, ledger: { year: 2026, opening: 20000, entries: [] } }, pendingEvents: [] };
}
function friends(s0: GameState, ages: number[]): GameState {
  let s = s0;
  const rng = createRng(77);
  for (const a of ages) {
    let p: Person;
    [s, p] = createPerson(s, rng, C, { age: a });
    s = addRelation(s, p.id, 'amigo', 72);
  }
  return s;
}
// amigos em idades diferentes (com evento de grupo garantido)
const FR = { ...C.friends, groupEventChance: 1 };
void FR;
writeFileSync(`${out}/adulto-amigos.json`, JSON.stringify(friends(base(25, 'e2e-am2', 'M', false), [24, 26, 27, 25, 28, 23])));
writeFileSync(`${out}/crianca-amigos.json`, JSON.stringify(friends(base(9, 'e2e-cr', 'F', false), [9, 10, 8])));
writeFileSync(`${out}/teen-amigos.json`, JSON.stringify(friends(base(15, 'e2e-tn', 'F', false), [15, 16, 14])));
// casal adulto com o evento da noite romântica pendente
for (const on of [true, false]) {
  let s = base(28, `e2e-in-${on}`, 'F', on);
  let p: Person;
  [s, p] = createPerson(s, createRng(5), C, { age: 29, sex: 'M' });
  s = addRelation(s, p.id, 'parceiro', 80, { romance: { stage: 'namorando', since: 26 } });
  s = { ...s, pendingEvents: [{ eventId: 'adult_night_with_partner', source: 'random', vars: targetVars(p, 'Namorado') }] };
  writeFileSync(`${out}/intimo-${on ? 'on' : 'off'}.json`, JSON.stringify(s));
}
console.log(out);
