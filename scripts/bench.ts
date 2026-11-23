/**
 * Performance: tempo de "Avançar ano" com um save de 80 anos de jogo (Etapa 6).
 *   npm run bench            → mede na engine (Node) e grava tmp/save-80.json para o teste no navegador
 * Meta: < 100 ms por ano num celular médio (no navegador, use throttling de CPU 4× como referência).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { GAME_CONTENT as C } from '../src/content';
import { acceptOffer, advanceYear, autoFinishFight, closeFight, createRng, enterGym, gymsInCity, newGame, resolveEvent, sessionsLeft, trainFighter } from '../src/engine';
import type { GameState, Rng } from '../src/engine';

function drain(s: GameState, rng: Rng): GameState {
  let g = s;
  for (let i = 0; i < 10 && g.pendingEvents.length; i++) {
    const ev = C.events.find((e) => e.id === g.pendingEvents[0]!.eventId)!;
    g = resolveEvent(g, ev.id, (ev.id === 'adult_path_18' ? ev.choices.find((c) => c.id === 'fight') : undefined)?.id ?? rng.pick(ev.choices).id, C);
  }
  return g;
}

/** Vida de lutador até `age` (para ter um save "pesado": mundo, rankings, pessoas, histórico). */
function buildSave(age: number): GameState {
  for (let seed = 0; seed < 50; seed++) {
    const rng = createRng(seed + 1);
    let s = newGame({ seed: `bench-${seed}`, name: 'Bench Lutador', sex: 'M' }, C);
    s = { ...s, flags: { ...s.flags, gostaDeLuta: true } };
    while (s.alive && s.character.age < age) {
      s = drain(advanceYear(s, C), rng);
      if (!s.fighter.gymId && s.character.age >= 6) {
        const g = gymsInCity(s, C)[0];
        if (g) s = enterGym(s, g.id, C);
      }
      for (const o of s.fighter.offers.slice()) if (sessionsLeft(s, C) >= o.campSessions + 1) s = drain(closeFight(autoFinishFight(acceptOffer(s, o.id, {}, C), C)), rng);
      for (let k = 0; k < 6 && sessionsLeft(s, C) > 0; k++) s = trainFighter(s, k % 2 ? 'jiujitsu' : 'trocacao', C);
    }
    if (s.alive && s.character.age >= age) return s;
  }
  throw new Error('nenhuma vida chegou à idade pedida');
}

const save = buildSave(80);
mkdirSync('tmp', { recursive: true });
writeFileSync('tmp/save-80.json', JSON.stringify(save));
const runs = 40;
const times: number[] = [];
for (let i = 0; i < runs; i++) {
  const s = { ...save, rngState: save.rngState + i };
  const t0 = performance.now();
  advanceYear(s, C);
  times.push(performance.now() - t0);
}
times.sort((a, b) => a - b);
const kb = JSON.stringify(save).length / 1024;
console.log(`Save de 80 anos: ${kb.toFixed(0)} KB · log ${save.log.length} anos · pessoas ${save.relationships.people.length} · elencos ${Object.keys(save.world.rosters).length}`);
console.log(`advanceYear (Node, ${runs} execuções): mediana ${times[runs >> 1]!.toFixed(2)} ms · p95 ${times[Math.floor(runs * 0.95)]!.toFixed(2)} ms · máx ${times[runs - 1]!.toFixed(2)} ms`);
