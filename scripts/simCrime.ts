/**
 * Balanceamento da polícia e do crime (release 0.0.2). Chamado no fim do `npm run sim` (ou sozinho:
    `SIM_CRIME_N=200 npx tsx scripts/simCrime.ts`). Três perfis: neutro (escolhas aleatórias), policial e criminoso.
 */
import { GAME_CONTENT } from '../src/content';
import {
  advanceYear,
  commitCrime,
  createRng,
  crimeBlockReason,
  newGame,
  policeCourse,
  policeExamBlockReason,
  policeWorkHard,
  prisonAction,
  resolveEvent,
  salaryOf,
  shootingRange,
  specialBlockReason,
  startPlan,
  startTrafficking,
  takePoliceExam,
  trySpecialCourse,
} from '../src/engine';
import type { GameState, Rng } from '../src/engine';

const C = GAME_CONTENT;
const P = Number(process.env.SIM_CRIME_N ?? process.argv[6] ?? 150);
const avg = (a: number[]) => (a.length ? a.reduce((t, v) => t + v, 0) / a.length : NaN);
const pct = (n: number, d: number) => `${d ? ((n / d) * 100).toFixed(1) : '—'}%`;

type Policy = (ev: string, ids: string[], rng: Rng) => string;

const PREFER: Record<string, string> = {
  justica_delegacia: 'silencio', justica_defesa: 'publico', justica_julgamento: 'julgar',
  crime_plano_equipe: 'conhecidos', crime_plano_alvo: 'medio', crime_plano_momento: 'noite', crime_plano_hora: 'seguir',
  pol_especial_1: 'seguir', pol_especial_2: 'seguir', pol_especial_3: 'seguir', prisao_fuga: 'recusar',
};

function drain(s0: GameState, rng: Rng, policy: Policy): GameState {
  let s = s0;
  for (let i = 0; i < 12 && s.pendingEvents.length && s.alive; i++) {
    const ev = C.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
    s = resolveEvent(s, ev.id, policy(ev.id, ev.choices.map((c) => c.id), rng), C);
  }
  return s;
}

const neutral: Policy = (ev, ids, rng) => (PREFER[ev] && ids.includes(PREFER[ev]!) ? PREFER[ev]! : rng.pick(ids));
const copPolicy: Policy = (ev, ids, rng) => {
  if (ev === 'pol_propina') return rng.chance(0.85) ? 'recusar' : 'aceitar';
  if (ev === 'pol_colega_corrupto') return rng.chance(0.9) ? (rng.chance(0.5) ? 'denunciar' : 'ignorar') : 'participar';
  if (ev.startsWith('crime_')) return ids.includes('recusar') ? 'recusar' : ids.includes('nao') ? 'nao' : ids[ids.length - 1]!;
  return neutral(ev, ids, rng);
};
const crookPolicy: Policy = (ev, ids, rng) => {
  if (ev === 'crime_faccao_convite' || ev === 'crime_faccao_convite_amigo' || ev === 'prisao_recrutamento' || ev === 'crime_convite_turma') return 'aceitar';
  if (ev === 'crime_faccao_missao') return 'cumprir';
  if (ev === 'prisao_reintegracao') return rng.chance(0.5) ? 'antigos' : 'programa';
  return neutral(ev, ids, rng);
};

/** Bota a escolaridade e a idade adulta com escolhas aleatórias. */
function grow(seed: string, toAge: number, rng: Rng, policy: Policy): GameState {
  let s = newGame({ seed, name: 'Sim', sex: rng.chance(0.5) ? 'M' : 'F' }, C);
  while (s.alive && s.character.age < toAge) s = drain(advanceYear(drain(s, rng, policy), C), rng, policy);
  return s;
}

// ---------------------------------------------------------------------------
// neutro: vidas comuns até os 40
// ---------------------------------------------------------------------------
let nCrime = 0;
let nArrest = 0;
for (let i = 0; i < P; i++) {
  const rng = createRng(70000 + i);
  const s = grow(`neutro-${i}`, 40, rng, neutral);
  if ((s.crime.committed ?? 0) > 0 || s.crime.juvenile.length > 0) nCrime++;
  if (s.crime.record.length > 0) nArrest++;
}

// ---------------------------------------------------------------------------
// policial: concurso dos 18 aos 25, trabalha com afinco, estande, curso; tenta a força especial
// ---------------------------------------------------------------------------
const cop = { became: 0, entryAge: [] as number[], special: 0, tried: 0, deaths: 0, exonerated: 0, rankEnd: [] as number[], years: [] as number[], cops: 0 };
for (let i = 0; i < P; i++) {
  const rng = createRng(80000 + i);
  let s = grow(`pol-${i}`, 18, rng, copPolicy);
  let entered = false;
  for (let y = 0; y < 47 && s.alive; y++) {
    s = drain(s, rng, copPolicy);
    if (!s.police.career && s.character.age <= 30 && !s.police.past.length) {
      const track = policeExamBlockReason(s, 'civil_investigador', C) === null && rng.chance(0.4) ? 'civil_investigador' : 'pm_praca';
      if (policeExamBlockReason(s, track, C) === null) s = takePoliceExam(s, track, C);
      if (s.police.career && !entered) {
        entered = true;
        cop.became++;
        cop.entryAge.push(s.character.age);
      }
    }
    if (s.police.career) {
      s = policeWorkHard(policeWorkHard(s, C), C);
      s = shootingRange(shootingRange(s, C), C);
      s = policeCourse(s, C);
      if (specialBlockReason(s, C) === null && rng.chance(0.4)) {
        cop.tried++;
        s = drain(trySpecialCourse(s, C), rng, copPolicy);
        if (s.police.career?.unit === 'especial') cop.special++;
      }
    }
    s = drain(advanceYear(s, C), rng, copPolicy);
  }
  if (entered) {
    cop.cops++;
    if ((s.feats.mortoEmServico ?? 0) > 0) cop.deaths++;
    if (s.police.past.some((p) => p.reason === 'exoneracao' || p.reason === 'demissao')) cop.exonerated++;
    const last = s.police.career ?? s.police.past.at(-1);
    if (last) cop.rankEnd.push(last.rank);
  }
}

// ---------------------------------------------------------------------------
// criminoso: a partir dos 18, 2 delitos por ano (o maior que der), facção, tráfico
// ---------------------------------------------------------------------------
const crook = { prison: 0, deaths: 0, deathAge: [] as number[], sentences: [] as number[], recid: 0, faction: 0, badEnd: 0, income: [] as number[], careerYears: [] as number[] };
const order = [...C.crime.crimes].reverse();
for (let i = 0; i < P; i++) {
  const rng = createRng(90000 + i);
  let s = grow(`crime-${i}`, 18, rng, crookPolicy);
  let years = 0;
  for (let y = 0; y < 52 && s.alive; y++) {
    s = drain(s, rng, crookPolicy);
    if (s.prison && s.prison.regime !== 'aberto') {
      for (const a of ['trabalhar', 'estudar', 'quieto'] as const) s = prisonAction(s, a, C);
    } else if (s.character.age < 60) {
      years++;
      for (let k = 0; k < 2 && s.alive && !s.pendingEvents.length; k++) {
        const def = order.find((c) => crimeBlockReason(s, c.id, C) === null);
        if (!def) break;
        s = def.plan ? drain(startPlan(s, def.id, C), rng, crookPolicy) : drain(commitCrime(s, def.id, C), rng, crookPolicy);
      }
      if (s.alive && !s.crime.trafficking && s.crime.rep >= 25) s = startTrafficking(s, 'medio');
      else if (s.alive && !s.crime.trafficking && s.crime.rep >= 5) s = startTrafficking(s, 'pequeno');
    }
    if (!s.alive) break;
    s = drain(advanceYear(s, C), rng, crookPolicy);
  }
  const convictions = s.crime.record.filter((r) => r.kind === 'condenacao');
  if (convictions.some((r) => (r.years ?? 0) > 1)) crook.prison++;
  if (convictions.length >= 2) crook.recid++;
  for (const r of convictions) crook.sentences.push(r.years ?? 0);
  if (s.flags.ex_faccao) crook.faction++;
  if (!s.alive) {
    crook.deathAge.push(s.character.age);
    if (s.character.death && !/velhice|doen|natural/i.test(s.character.death.cause)) crook.deaths++;
  } else crook.deathAge.push(s.character.age);
  if (!s.alive || convictions.length > 0) crook.badEnd++;
  crook.income.push((s.crime.earned ?? 0) / Math.max(1, years));
  crook.careerYears.push(years);
}
const caixa = C.economy.jobs.find((j) => j.id === 'caixa')!;

console.log(`\n=== Polícia e crime (release 0.0.2): ${P} vidas por perfil ===`);
console.log(`Neutro (até 40)  | cometeu algum delito ${pct(nCrime, P)} | ficha de adulto ${pct(nArrest, P)}`);
console.log(`Policial         | virou policial ${pct(cop.became, P)} | idade média de entrada ${avg(cop.entryAge).toFixed(1)} | tentaram a força especial ${cop.tried} → entraram ${pct(cop.special, cop.cops)} dos policiais | mortes em serviço ${pct(cop.deaths, cop.cops)} | exonerados/demitidos ${pct(cop.exonerated, cop.cops)} | posto final médio ${avg(cop.rankEnd).toFixed(2)}`);
console.log(`Criminoso        | preso (pena > 1 ano) ${pct(crook.prison, P)} | pena média ${avg(crook.sentences).toFixed(1)} anos | reincidência (2+ condenações) ${pct(crook.recid, P)} | passou por facção ${pct(crook.faction, P)} | morte violenta ${pct(crook.deaths, P)} | idade final média ${avg(crook.deathAge).toFixed(1)}`);
console.log(`Crime × emprego  | renda média do crime ${Math.round(avg(crook.income)).toLocaleString('pt-BR')}/ano × caixa ${salaryOf(caixa, 1).toLocaleString('pt-BR')}/ano | terminou mal (prisão, morte ou ficha) ${pct(crook.badEnd, P)}`);
