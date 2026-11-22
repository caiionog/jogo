import { cityMultOf } from '../geo';
/** Empregos: requisitos, contratação, salário por nível, promoção, demissão e energia reservada. */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { seedToState } from '../core/rng';
import { cityDef } from '../geo';
import { meetFriend } from '../relationships/social';
import { stageOfGrade } from '../lifeStages/school';
import { post, toMoney } from './ledger';
import type { MarketYear } from './market';
import type { EducationLevel, JobDef } from './types';

export const EDUCATION_ORDER: readonly EducationLevel[] = ['nenhuma', 'fundamental', 'medio', 'superior'];
export const EDUCATION_LABEL: Record<EducationLevel, string> = {
  nenhuma: 'Sem escolaridade',
  fundamental: 'Fundamental completo',
  medio: 'Ensino médio completo',
  superior: 'Ensino superior',
};

/** Escolaridade derivada da Etapa 2. */
export function educationLevel(state: GameState): EducationLevel {
  const edu = state.education;
  if (state.flags.caminho_18 === 'faculdade' && edu.graduated && state.character.age >= 22) return 'superior';
  if (edu.graduated) return 'medio';
  const finishedFund = edu.history.some((h) => h.passed && h.gradeLabel === '9º ano') || (edu.current?.grade ?? 0) >= 12;
  return finishedFund ? 'fundamental' : 'nenhuma';
}

export function jobDef(content: GameContent, id: string | undefined): JobDef | undefined {
  return id ? content.economy.jobs.find((j) => j.id === id) : undefined;
}

/** Salário anual no nível (1–5), ajustado ao custo da cidade (`cityMult`). */
export function salaryOf(def: JobDef, level: number, cityMult = 1): number {
  const [lo, hi] = def.salary;
  // informal paga mais na hora (sem INSS e sem benefícios)
  const informal = def.formal === false ? 1.15 : 1;
  return toMoney((lo + ((hi - lo) * (Math.max(1, Math.min(5, level)) - 1)) / 4) * cityMult * informal);
}


export type JobBlockReason =
  | 'dead'
  | 'busy'
  | 'age'
  | 'education'
  | 'study'
  | 'cnh'
  | 'stats'
  | 'reputation'
  | 'fight'
  | 'current'
  | 'employed'
  | 'no-opening'
  | 'no-energy';

/** Requisitos de perfil (sem energia, vagas e emprego atual): usados nos cartões ✓/✗ da tela Carreiras. */
export function jobRequirementGaps(state: GameState, def: JobDef): JobBlockReason[] {
  const gaps: JobBlockReason[] = [];
  if (state.character.age < def.minAge) gaps.push('age');
  if (EDUCATION_ORDER.indexOf(educationLevel(state)) < EDUCATION_ORDER.indexOf(def.education)) gaps.push('education');
  const r = def.requires;
  if (r?.studying && !state.education.current) gaps.push('study');
  if (r?.schoolStages) {
    const cur = state.education.current;
    const stage = cur ? stageOfGrade(cur.grade) : undefined;
    const ok = (stage && (r.schoolStages as readonly string[]).includes(stage)) || (r.acceptGraduated && state.education.graduated);
    if (!ok) gaps.push('study');
  }
  if (r?.cnh && !state.flags.cnh) gaps.push('cnh');
  const st = state.character.stats;
  const m = def.minStats ?? {};
  if ((m.intelligence ?? 0) > st.intelligence || (m.athletic ?? 0) > st.athletic || (m.looks ?? 0) > st.looks) gaps.push('stats');
  if ((def.minReputation ?? 0) > state.fighter.reputation) gaps.push('reputation');
  if (def.fightReq) {
    const okBelt = def.fightReq.minBelt !== undefined && state.fighter.belt.rank >= def.fightReq.minBelt;
    const okWins = def.fightReq.minProWins !== undefined && state.fighter.pro.wins >= def.fightReq.minProWins;
    // alternativa: instrutor com Capacidade atlética alta (minStats.athletic) dispensa faixa/vitórias
    const okAthletic = def.minStats?.athletic === undefined && def.fightReq.minBelt !== undefined && st.athletic >= 70;
    if (!okBelt && !okWins && !okAthletic) gaps.push('fight');
  }
  return gaps;
}

/** Vagas abertas no ano (pela seed, cidade e ano): cidades grandes têm mais vagas. O emprego atual conta sempre. */
export function jobOpenings(state: GameState, content: GameContent): string[] {
  const rng = createRng(seedToState(`${state.seed}:vagas:${state.year}:${state.character.uf}:${state.character.city}`));
  const pop = cityDef(content.geo, state.character.uf, state.character.city)?.populacao ?? 200000;
  const p = pop >= 1_000_000 ? 0.85 : pop >= 300_000 ? 0.72 : 0.6;
  return content.economy.jobs.filter((j) => j.id === state.economy.job?.jobId || rng.chance(p)).map((j) => j.id);
}

/** Motivo pelo qual o personagem não pode se candidatar (null = pode). `replace`: aceita trocar o emprego atual. */
export function jobBlockReason(state: GameState, def: JobDef, content?: GameContent, opts: { replace?: boolean } = {}): JobBlockReason | null {
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'busy';
  if (state.economy.job?.jobId === def.id) return 'current';
  const gap = jobRequirementGaps(state, def)[0];
  if (gap) return gap;
  if (content && !jobOpenings(state, content).includes(def.id)) return 'no-opening';
  // um emprego por vez: trocar exige pedir demissão do atual
  if (state.economy.job && !opts.replace) return 'employed';
  // candidatar-se custa 1 de energia, e o emprego toma a energia anual dele já neste ano (devolve a do atual)
  const freed = opts.replace && state.economy.job && content ? jobEnergy(state, content) : 0;
  if (state.energy.current + freed < 1 + def.energy) return 'no-energy';
  return null;
}

/** Chance de contratação: requisitos com folga, inteligência, aparência e o ano econômico. */
export function hireChance(state: GameState, def: JobDef, market: MarketYear): number {
  const st = state.character.stats;
  const surplus = (st.intelligence - (def.minStats?.intelligence ?? 0)) / 200 + (st.looks - (def.minStats?.looks ?? 0)) / 400;
  return Math.min(0.95, Math.max(0.15, (def.hireChance ?? 0.6) + surplus - (market.kind === 'crise' ? 0.25 : 0)));
}

/** Cargo atual na escada (ex.: "Supervisor"), pelo nível 1–5. */
export function jobTitle(def: JobDef, level: number): string {
  const l = def.ladder;
  if (!l?.length) return def.title;
  return l[Math.min(l.length - 1, Math.floor(((Math.max(1, Math.min(5, level)) - 1) * l.length) / 5))]!;
}

/** Candidatar-se: chance pelos atributos e pelo ano econômico. Aprovado, começa no nível 1. */
export function applyForJob(state: GameState, jobId: string, content: GameContent, market: MarketYear, opts: { replace?: boolean } = {}): GameState {
  const def = jobDef(content, jobId);
  if (!def || jobBlockReason(state, def, content, opts) !== null) return state;
  const rng = createRng(state.rngState);
  let s: GameState = { ...state, energy: { ...state.energy, current: state.energy.current - 1 } };
  const o = (s.character.sex === 'M' ? 'o' : 'a');
  if (rng.chance(hireChance(s, def, market))) {
    if (s.economy.job) {
      const old = jobDef(content, s.economy.job.jobId);
      // devolve a energia reservada do emprego antigo
      s = { ...s, energy: { ...s.energy, current: s.energy.current + (old?.energy ?? 0) } };
      s = appendLog(s, `Você pediu demissão${old ? ` (${old.title.toLowerCase()})` : ''} para assumir a nova vaga.`);
    }
    s = {
      ...s,
      energy: { ...s.energy, current: s.energy.current - def.energy, reserved: def.energy },
      economy: { ...s.economy, job: { jobId, level: 1, performance: 50, years: 0 } },
    };
    s = appendLog(s, `Você foi contratad${o} como ${jobTitle(def, 1).toLowerCase()} (R$ ${salaryOf(def, 1, cityMultOf(s, content)).toLocaleString('pt-BR')}/ano${def.formal === false ? ', sem carteira' : ''}).`);
  } else {
    s = appendLog(s, `Você não passou na seleção para ${def.title.toLowerCase()}.`);
  }
  return { ...s, rngState: rng.state };
}

/** Conversar com os colegas: humor, um pouco de desempenho e chance de fazer amizade (1 de energia). */
export function talkToColleagues(state: GameState, content: GameContent): GameState {
  const job = state.economy.job;
  if (!job || state.energy.current < 1 || state.pendingEvents.length || state.activeFight) return state;
  const rng = createRng(state.rngState);
  let s: GameState = {
    ...state,
    energy: { ...state.energy, current: state.energy.current - 1 },
    character: { ...state.character, stats: addStats(state.character.stats, { happiness: 2 }) },
    economy: { ...state.economy, job: { ...job, performance: Math.min(100, job.performance + 3) } },
  };
  s = appendLog(s, 'Você trocou uma ideia com os colegas no intervalo.');
  if (rng.chance(0.35)) s = meetFriend({ ...s, rngState: rng.state }, rng, content, 'work');
  return { ...s, rngState: rng.state };
}

/** Carteira de motorista (gancho do motorista de aplicativo): 18+, R$ 3.000, pode reprovar. */
export const CNH_COST = 3000;

export function cnhBlockReason(state: GameState): 'age' | 'has' | 'no-money' | 'busy' | 'no-energy' | null {
  if (state.flags.cnh) return 'has';
  if (state.character.age < 18) return 'age';
  if (state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.energy.current < 1) return 'no-energy';
  if (state.money < CNH_COST) return 'no-money';
  return null;
}

export function getDriversLicense(state: GameState): GameState {
  if (cnhBlockReason(state) !== null) return state;
  const rng = createRng(state.rngState);
  let s = post(state, 'compras', -CNH_COST, 'Autoescola e exames da CNH');
  s = { ...s, energy: { ...s.energy, current: s.energy.current - 1 } };
  const pass = rng.chance(0.55 + s.character.stats.intelligence / 300);
  s = pass ? appendLog({ ...s, flags: { ...s.flags, cnh: true } }, 'Você passou no exame de direção e tirou a CNH!') : appendLog(s, 'Você reprovou na prova prática do Detran. Dá para tentar de novo.');
  return { ...s, rngState: rng.state };
}

export const WORK_HARD_COST = 1;

export function workHard(state: GameState): GameState {
  const job = state.economy.job;
  if (!job || state.energy.current < WORK_HARD_COST || state.pendingEvents.length || state.activeFight) return state;
  const rng = createRng(state.rngState);
  const gain = rng.int(8, 15);
  const s: GameState = {
    ...state,
    rngState: rng.state,
    energy: { ...state.energy, current: state.energy.current - WORK_HARD_COST },
    economy: { ...state.economy, job: { ...job, performance: Math.min(100, job.performance + gain) } },
  };
  return appendLog(s, 'Você trabalhou duro e o chefe percebeu.');
}

export function askRaise(state: GameState, content: GameContent): GameState {
  const job = state.economy.job;
  const def = jobDef(content, job?.jobId);
  if (!job || !def || state.flags.pediu_aumento === state.year || state.pendingEvents.length || state.activeFight) return state;
  const rng = createRng(state.rngState);
  let s: GameState = { ...state, rngState: rng.state, flags: { ...state.flags, pediu_aumento: state.year } };
  if (job.level < 5 && rng.chance((job.performance / 100) * 0.6)) {
    s = { ...s, economy: { ...s.economy, job: { ...job, level: job.level + 1 } } };
    return appendLog(s, `Aumento aprovado! Agora você ganha R$ ${salaryOf(def, job.level + 1, cityMultOf(s, content)).toLocaleString('pt-BR')}/ano.`);
  }
  s = { ...s, economy: { ...s.economy, job: { ...job, performance: Math.max(0, job.performance - 5) } } };
  return appendLog(s, 'O pedido de aumento foi negado.');
}

export function quitJob(state: GameState, content: GameContent): GameState {
  const def = jobDef(content, state.economy.job?.jobId);
  if (!def || state.activeFight) return state;
  const s: GameState = { ...state, energy: { ...state.energy, reserved: 0 }, economy: { ...state.economy, job: null } };
  return appendLog(s, `Você pediu demissão (${def.title.toLowerCase()}).`);
}

/** Energia anual reservada pelo emprego atual. */
export function jobEnergy(state: GameState, content: GameContent): number {
  return jobDef(content, state.economy.job?.jobId)?.energy ?? 0;
}

/** Fechamento do ano: salário, promoção, demissão e desempenho voltando à média. */
export function jobYear(state: GameState, rng: Rng, content: GameContent, market: MarketYear): GameState {
  const job = state.economy.job;
  const def = jobDef(content, job?.jobId);
  if (!job || !def) return state;
  let s = post(state, def.formal === false ? 'trabalho_informal' : 'salario', salaryOf(def, job.level, cityMultOf(state, content)), `${def.formal === false ? 'Trabalho' : 'Salário'}: ${jobTitle(def, job.level)}`);
  if (def.yearlyEffects) s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, def.yearlyEffects) } };
  let next = { ...job, years: job.years + 1 };
  if (next.performance >= 75 && next.level < 5 && rng.chance(0.4)) {
    next = { ...next, level: next.level + 1 };
    const title = jobTitle(def, next.level);
    s = appendLog(s, title !== jobTitle(def, job.level) ? `Você foi promovid${s.character.sex === 'M' ? 'o' : 'a'} a ${title.toLowerCase()}!` : `Você ganhou um aumento (${def.title}, nível ${next.level}).`);
  }
  const fired = (next.performance < 25 && rng.chance(0.5)) || rng.chance(market.layoffRisk);
  if (fired) {
    s = { ...s, economy: { ...s.economy, job: null } };
    return appendLog(s, market.kind === 'crise' && next.performance >= 25 ? `A crise chegou: você foi demitid${s.character.sex === 'M' ? 'o' : 'a'} num corte em massa.` : `Você foi demitid${s.character.sex === 'M' ? 'o' : 'a'} por baixo desempenho.`);
  }
  next = { ...next, performance: Math.round(next.performance + (50 - next.performance) * 0.3) };
  return { ...s, economy: { ...s.economy, job: next } };
}
