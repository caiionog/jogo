/**
 * Gera fixtures de saves REAIS da versão atual do GameState (antes de mudar o formato).
 *   npx tsx scripts/gen-fixtures.ts            → src/save/__fixtures__/saves-v<STATE_VERSION>.json
 * Chaves: idades "5", "16", "25", "40", "60" (lutador com academia, lutas, emprego), "fim" (vida encerrada, se houver)
 * e "luta" (luta em andamento).
 * Usa só a API pública da engine; ajuste a política se a API mudar.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { GAME_CONTENT } from '../src/content';
import * as E from '../src/engine';
import type { GameState } from '../src/engine';

const C = GAME_CONTENT;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = E as any;

function drain(s: GameState): GameState {
  let g = s;
  for (let i = 0; i < 12 && g.pendingEvents.length; i++) {
    const p = g.pendingEvents[0]!;
    const ev = C.events.find((e) => e.id === p.eventId)!;
    const choice = ev.id === 'adult_path_18' ? (ev.choices.find((c) => c.id === 'fight') ?? ev.choices[0]!) : ev.choices[0]!;
    g = E.resolveEvent(g, ev.id, choice.id, C);
  }
  return g;
}

function tryTrain(s: GameState, wanted: string[]): GameState {
  // só os tipos de treino que existem nesta versão (tipo inválido corromperia o estado)
  const known: string[] = Array.isArray(api.TRAINING_KINDS) ? api.TRAINING_KINDS : Object.keys(api.TRAINING_COST ?? {});
  const kinds = wanted.filter((k) => known.includes(k));
  if (!kinds.length) return s;
  let g = s;
  for (let i = 0; i < 12; i++) {
    const before = JSON.stringify(g.fighter.skills) + g.fighter.sessionsThisYear;
    const k = kinds[i % kinds.length]!;
    g = api.trainFighter(g, k, C);
    if (JSON.stringify(g.fighter.skills) + g.fighter.sessionsThisYear === before) break;
  }
  return g;
}

function playYear(s0: GameState, age: number): GameState {
  let s = drain(s0);
  if (!s.fighter.gymId && age >= 6) {
    const gyms = api.gymsInCity(s, C).filter((g: { minAge: number }) => g.minAge <= age);
    if (gyms[0] && (age < 18 || s.money >= gyms[0].fee)) s = api.enterGym(s, gyms[0].id, C);
  }
  for (const o of s.fighter.offers.slice(0, 2)) {
    if (s.activeFight) break;
    const t = api.acceptOffer(s, o.id, {}, C);
    if (t === s || !t.activeFight) continue;
    s = drain(api.closeFight(api.autoFinishFight(t, C)));
  }
  if (age >= 19 && age <= 35 && !s.economy.job) {
    const jobs = (C.economy.jobs ?? []).filter((j: { minAge: number }) => j.minAge <= age);
    for (const j of jobs) {
      const t = api.applyJob(s, j.id, C);
      if (t.economy.job) { s = t; break; }
    }
  }
  s = tryTrain(s, ['grappling', 'jiujitsu', 'muaythai', 'trocacao', 'fisico']);
  return drain(s);
}

const out: Record<string, GameState> = {};
let s = E.newGame({ seed: `fx${E.STATE_VERSION}-0`, name: 'Fixture', sex: 'M', birthYear: 2004 }, C);
const ages = [5, 16, 25, 40, 60];
for (let age = 1; age <= 70; age++) {
  s = playYear(drain(E.advanceYear(s, C)), s.character.age + 1);
  if (s.character.death) { out.fim = s; break; }
  if (ages.includes(s.character.age)) out[String(s.character.age)] = s;
}
// luta em andamento (para migrar activeFight)
let f = E.newGame({ seed: `fx${E.STATE_VERSION}-luta`, name: 'Fixture Luta', sex: 'F', birthYear: 2000 }, C);
for (let i = 0; i < 26 && !f.activeFight; i++) {
  f = playYear(drain(E.advanceYear(f, C)), f.character.age + 1);
  const o = f.fighter.offers[0];
  if (o && f.character.age >= 18) {
    const t = api.acceptOffer(f, o.id, {}, C);
    if (t.activeFight) { f = t; break; }
  }
}
if (f.activeFight) out.luta = f;

mkdirSync('src/save/__fixtures__', { recursive: true });
const file = `src/save/__fixtures__/saves-v${E.STATE_VERSION}.json`;
writeFileSync(file, JSON.stringify(out));
console.log(file, Object.keys(out).map((k) => `${k}:${out[k]!.character.age}a`).join(' '), `${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
