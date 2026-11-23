/**
 * Gera um GameState de cenário pela engine e grava em JSON (para injetar no IndexedDB nos testes com Playwright).
 *   npx tsx scripts/e2e/state.ts <cenário> <saída.json>
 * Cenários: lutador20 (20 anos, academia, emprego de meio período), crianca10 (10 anos, academia).
 */
import { writeFileSync } from 'node:fs';
import { GAME_CONTENT as C } from '../../src/content';
import * as E from '../../src/engine';
import type { GameState } from '../../src/engine';

function drain(s: GameState): GameState {
  let g = s;
  for (let i = 0; i < 12 && g.pendingEvents.length; i++) {
    const ev = C.events.find((e) => e.id === g.pendingEvents[0]!.eventId)!;
    g = E.resolveEvent(g, ev.id, ev.choices[0]!.id, C);
  }
  return g;
}

function grow(seed: string, age: number, opts: { job?: string } = {}): GameState {
  let s = E.newGame({ seed, name: 'Teste', sex: 'M', birthYear: 2026 - age }, C);
  while (s.character.age < age) {
    s = drain(E.advanceYear(drain(s), C));
    if (!s.fighter.gymId && s.character.age >= 6) {
      const g = E.gymsInCity(s, C)[0];
      if (g) s = E.enterGym(s, g.id, C);
    }
  }
  if (opts.job) s = { ...s, economy: { ...s.economy, job: { jobId: opts.job, level: 1, performance: 50, years: 0 } } };
  return drain(s);
}

const scenarios: Record<string, () => GameState> = {
  lutador20: () => grow('e2e-lutador', 20, { job: 'lanchonete' }),
  crianca10: () => grow('e2e-crianca', 10),
};
const [name = 'lutador20', out = 'tmp/e2e-state.json'] = process.argv.slice(2);
writeFileSync(out, JSON.stringify(scenarios[name]!()));
console.log(out);
