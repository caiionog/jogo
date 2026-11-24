/**
 * Balanceamento da release 0.0.4 (`npm run sim` chama no fim; ou `SIM004_N=60 npx tsx scripts/sim004.ts`):
 * futebol (quem tenta a peneira todo ano dos 10 aos 17), fama, concursos públicos e app de namoro.
 * Só engine + conteúdo; eventos resolvidos com a primeira opção.
 */
import { GAME_CONTENT as C } from '../src/content';
import type { GameState } from '../src/engine';
import { acceptFootballOffer, advanceYear, appLike, appCards, civilExamJobs, newGame, resolveEvent, takeCivilExam, tryout } from '../src/engine';

const N = Number(process.env.SIM004_N ?? 60);
const drain = (s: GameState): GameState => {
  let x = s;
  for (let i = 0; x.pendingEvents.length && i < 20; i++) {
    const e = C.events.find((ev) => ev.id === x.pendingEvents[0]!.eventId)!;
    x = resolveEvent(x, e.id, e.choices[0]!.id, C);
  }
  return x;
};
const avg = (a: number[]) => (a.length ? a.reduce((t, v) => t + v, 0) / a.length : 0);

// --- futebol ---
const fut = { pros: 0, abroad: 0, divA: 0, selecao: 0, peak: [] as number[], titles: [] as number[], money: [] as number[], fame: [] as number[] };
for (let i = 0; i < N; i++) {
  let s = newGame({ name: 'Sim', sex: i % 2 ? 'M' : 'F', seed: `sim004-fut-${i}` } as never, C);
  for (let a = 0; a < 45 && s.alive; a++) {
    if (!s.football && a >= 10 && a <= 17) s = tryout(s, 'ATA', C);
    s = drain(advanceYear(drain(s), C));
    const f = s.football;
    if (f && f.offers.length) {
      const best = [...f.offers].sort((x, y) => y.salary - x.salary)[0]!;
      if (!f.contract || best.salary > f.contract.salary * 1.2) s = acceptFootballOffer(s, best.clubId, C);
    }
  }
  const f = s.football;
  fut.fame.push(s.character.fame);
  if (!f?.history.length) continue;
  fut.pros++;
  if (f.history.some((h) => h.division === 'X')) fut.abroad++;
  if (f.history.some((h) => h.division === 'A')) fut.divA++;
  if (f.caps) fut.selecao++;
  fut.peak.push(Math.max(...f.history.map((h) => h.rating)));
  fut.titles.push(f.titles.length);
  fut.money.push(s.money);
}
console.log(`\n=== Release 0.0.4: ${N} vidas por perfil ===`);
console.log(`Futebol: profissionais ${((fut.pros / N) * 100).toFixed(0)}% · Divisão A ${fut.divA} · exterior ${fut.abroad} · Seleção ${fut.selecao} · nota de pico ${avg(fut.peak).toFixed(2)} · títulos/carreira ${avg(fut.titles).toFixed(1)} · dinheiro aos 45 R$ ${Math.round(avg(fut.money)).toLocaleString('pt-BR')} · fama aos 45 ${avg(fut.fame).toFixed(0)}`);

// --- concursos: tenta um cargo de nível médio por ano dos 18 aos 30 ---
let approved = 0;
const ageApproved: number[] = [];
const civil = civilExamJobs(C).find((j) => j.id === 'agente_administrativo')!;
for (let i = 0; i < N; i++) {
  let s = newGame({ name: 'Sim', sex: i % 2 ? 'M' : 'F', seed: `sim004-civ-${i}` } as never, C);
  for (let a = 0; a < 31 && s.alive; a++) {
    if (a >= 18 && s.economy.job?.jobId !== civil.id) s = takeCivilExam(s, civil.id, C);
    if (s.economy.job?.jobId === civil.id) { approved++; ageApproved.push(s.character.age); break; }
    s = drain(advanceYear(drain(s), C));
  }
}
console.log(`Concurso (agente administrativo, uma tentativa por ano dos 18 aos 30): aprovados ${((approved / N) * 100).toFixed(0)}% · idade média da aprovação ${avg(ageApproved).toFixed(1)}`);

// --- app de namoro: 6 curtidas por ano dos 18 aos 30, solteiro ---
let matches = 0;
let likes = 0;
for (let i = 0; i < N; i++) {
  let s = newGame({ name: 'Sim', sex: i % 2 ? 'M' : 'F', seed: `sim004-app-${i}` } as never, C);
  for (let a = 0; a < 31 && s.alive; a++) {
    if (a >= 18) for (const c of appCards(s, C).slice(0, 6)) {
      const before = s.relationships.people.length;
      s = appLike(s, c.id, C);
      likes++;
      if (s.relationships.people.length > before) matches++;
    }
    s = drain(advanceYear(drain(s), C));
  }
}
console.log(`App de namoro: ${likes} curtidas · match ${((matches / Math.max(1, likes)) * 100).toFixed(0)}%`);
