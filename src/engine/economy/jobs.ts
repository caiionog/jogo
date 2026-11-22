/** Empregos: requisitos, contratação, salário por nível, promoção, demissão e energia reservada. */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
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
  return toMoney((lo + ((hi - lo) * (Math.max(1, Math.min(5, level)) - 1)) / 4) * cityMult);
}

/** Multiplicador da cidade do personagem (custo de vida e salários). */
export function cityMultOf(state: GameState, content: GameContent): number {
  return content.economy.cityCost[state.character.city] ?? 1;
}

export type JobBlockReason = 'dead' | 'busy' | 'age' | 'education' | 'stats' | 'reputation' | 'fight' | 'current' | 'no-energy';

/** Motivo pelo qual o personagem não pode se candidatar (null = pode). */
export function jobBlockReason(state: GameState, def: JobDef): JobBlockReason | null {
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'busy';
  if (state.economy.job?.jobId === def.id) return 'current';
  if (state.character.age < def.minAge) return 'age';
  if (EDUCATION_ORDER.indexOf(educationLevel(state)) < EDUCATION_ORDER.indexOf(def.education)) return 'education';
  const st = state.character.stats;
  const m = def.minStats ?? {};
  if ((m.intelligence ?? 0) > st.intelligence || (m.strength ?? 0) > st.strength || (m.looks ?? 0) > st.looks) return 'stats';
  if ((def.minReputation ?? 0) > state.fighter.reputation) return 'reputation';
  if (def.fightReq) {
    const okBelt = def.fightReq.minBelt !== undefined && state.fighter.belt.rank >= def.fightReq.minBelt;
    const okWins = def.fightReq.minProWins !== undefined && state.fighter.pro.wins >= def.fightReq.minProWins;
    if (!okBelt && !okWins) return 'fight';
  }
  // candidatar-se custa 1 de energia, e o emprego toma a energia anual dele já neste ano
  if (state.energy.current < 1 + def.energy) return 'no-energy';
  return null;
}

/** Candidatar-se: chance pelos atributos e pelo ano econômico. Aprovado, começa no nível 1. */
export function applyForJob(state: GameState, jobId: string, content: GameContent, market: MarketYear): GameState {
  const def = jobDef(content, jobId);
  if (!def || jobBlockReason(state, def) !== null) return state;
  const rng = createRng(state.rngState);
  let s: GameState = { ...state, energy: { ...state.energy, current: state.energy.current - 1 } };
  const st = s.character.stats;
  const surplus = (st.intelligence - (def.minStats?.intelligence ?? 0)) / 200 + (st.looks - (def.minStats?.looks ?? 0)) / 400;
  const chance = Math.min(0.95, Math.max(0.15, 0.6 + surplus - (market.kind === 'crise' ? 0.25 : 0)));
  if (rng.chance(chance)) {
    if (s.economy.job) s = appendLog(s, `Você pediu demissão para assumir a nova vaga.`);
    s = {
      ...s,
      energy: { ...s.energy, current: s.energy.current - def.energy, reserved: def.energy },
      economy: { ...s.economy, job: { jobId, level: 1, performance: 50, years: 0 } },
    };
    s = appendLog(s, `Você foi contratad${s.character.sex === 'M' ? 'o' : 'a'} como ${def.title.toLowerCase()} (R$ ${salaryOf(def, 1, cityMultOf(s, content)).toLocaleString('pt-BR')}/ano).`);
  } else {
    s = appendLog(s, `Você não passou na seleção para ${def.title.toLowerCase()}.`);
  }
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
  let s = post(state, 'salario', salaryOf(def, job.level, cityMultOf(state, content)), `Salário: ${def.title}`);
  let next = { ...job, years: job.years + 1 };
  if (next.performance >= 75 && next.level < 5 && rng.chance(0.4)) {
    next = { ...next, level: next.level + 1 };
    s = appendLog(s, `Você foi promovid${s.character.sex === 'M' ? 'o' : 'a'}! (${def.title}, nível ${next.level})`);
  }
  const fired = (next.performance < 25 && rng.chance(0.5)) || rng.chance(market.layoffRisk);
  if (fired) {
    s = { ...s, economy: { ...s.economy, job: null } };
    return appendLog(s, market.kind === 'crise' && next.performance >= 25 ? `A crise chegou: você foi demitid${s.character.sex === 'M' ? 'o' : 'a'} num corte em massa.` : `Você foi demitid${s.character.sex === 'M' ? 'o' : 'a'} por baixo desempenho.`);
  }
  next = { ...next, performance: Math.round(next.performance + (50 - next.performance) * 0.3) };
  return { ...s, economy: { ...s.economy, job: next } };
}
