/**
 * Seleção de carreira (Etapa 8): categorias, cartões com requisitos ✓/✗, escada de cargos e a carreira de lutador
 * como carreira especial. Só dados — os textos ficam na UI.
 */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { cityMultOf } from '../geo';
import { getOrg, orgRequirementGap, tierIndex } from '../fighting/orgs';
import type { OrgBlockReason } from '../fighting/orgs';
import type { OrgDef } from '../fighting/types';
import { jobBlockReason, jobDef, jobRequirementGaps, jobTitle, salaryOf } from './jobs';
import type { JobBlockReason } from './jobs';
import type { JobDef } from './types';

export type CareerCategory = 'aprendiz' | 'meio_periodo' | 'integral';

export function careerCategoryOf(def: JobDef): CareerCategory {
  return def.category === 'aprendiz' ? 'aprendiz' : def.category === 'meio_periodo' ? 'meio_periodo' : 'integral';
}

/** Requisito individual para os cartões (✓ atendido / ✗ com o motivo). */
export type RequirementKey = 'age' | 'education' | 'study' | 'cnh' | 'stats' | 'reputation' | 'fight';
export interface Requirement {
  key: RequirementKey;
  ok: boolean;
}

export interface LadderStep {
  title: string;
  levels: [number, number];
  salary: [number, number];
  current: boolean;
}

export interface CareerCard {
  def: JobDef;
  /** Salário anual (R$) no início e no topo, já com o custo da cidade. */
  salary: [number, number];
  requirements: Requirement[];
  /** Bloqueio para se candidatar agora (com troca de emprego permitida); null = pode. */
  blocked: JobBlockReason | null;
  current: boolean;
  /** Cargo atual (se já estiver nesta carreira). */
  title: string;
  ladder: LadderStep[];
}

export function jobRequirements(state: GameState, def: JobDef): Requirement[] {
  const gaps = new Set(jobRequirementGaps(state, def));
  const list: RequirementKey[] = ['age'];
  if (def.education !== 'nenhuma') list.push('education');
  if (def.requires?.studying || def.requires?.schoolStages) list.push('study');
  if (def.requires?.cnh) list.push('cnh');
  if (def.minStats && Object.keys(def.minStats).length) list.push('stats');
  if (def.minReputation) list.push('reputation');
  if (def.fightReq) list.push('fight');
  return list.map((key) => ({ key, ok: !gaps.has(key) }));
}

/** Escada de cargos com a faixa de níveis e de salário de cada degrau. */
export function careerLadder(state: GameState, def: JobDef, content: GameContent): LadderStep[] {
  const mult = cityMultOf(state, content);
  const cur = state.economy.job?.jobId === def.id ? state.economy.job.level : null;
  const steps: LadderStep[] = [];
  for (let level = 1; level <= 5; level++) {
    const title = jobTitle(def, level);
    const last = steps.at(-1);
    if (last && last.title === title) {
      last.levels[1] = level;
      last.salary[1] = salaryOf(def, level, mult);
    } else steps.push({ title, levels: [level, level], salary: [salaryOf(def, level, mult), salaryOf(def, level, mult)], current: false });
  }
  if (cur) for (const s of steps) s.current = cur >= s.levels[0] && cur <= s.levels[1];
  return steps;
}

export function careerCard(state: GameState, content: GameContent, jobId: string): CareerCard | null {
  const def = jobDef(content, jobId);
  if (!def) return null;
  const mult = cityMultOf(state, content);
  const current = state.economy.job?.jobId === def.id;
  return {
    def,
    salary: [salaryOf(def, 1, mult), salaryOf(def, 5, mult)],
    requirements: jobRequirements(state, def),
    blocked: jobBlockReason(state, def, content, { replace: true }),
    current,
    title: current ? jobTitle(def, state.economy.job!.level) : jobTitle(def, 1),
    ladder: careerLadder(state, def, content),
  };
}

/** Cartões de uma categoria, na ordem de idade mínima e salário. */
export function careersIn(state: GameState, content: GameContent, cat: CareerCategory): CareerCard[] {
  return content.economy.jobs
    .filter((j) => careerCategoryOf(j) === cat)
    .slice()
    .sort((a, b) => a.minAge - b.minAge || a.salary[0] - b.salary[0])
    .map((j) => careerCard(state, content, j.id)!)
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// carreira de lutador
// ---------------------------------------------------------------------------

export type FighterStage = 'sem_academia' | 'aluno' | 'amador' | 'pro_regional' | 'liga_principal' | 'aposentado';
export const FIGHTER_STAGES: readonly FighterStage[] = ['sem_academia', 'aluno', 'amador', 'pro_regional', 'liga_principal'];

export function fighterStage(state: GameState, content: GameContent): FighterStage {
  const f = state.fighter;
  if (f.retired) return 'aposentado';
  const org = getOrg(content, f.orgId);
  if (org?.tier === 'major') return 'liga_principal';
  if (org?.tier === 'regional' || f.pro.wins + f.pro.losses > 0) return 'pro_regional';
  if (f.amateur.wins + f.amateur.losses + f.amateur.draws > 0) return 'amador';
  return f.gymId ? 'aluno' : 'sem_academia';
}

/** Próximo degrau: a organização com contrato logo acima e o que falta (motivo), ou null. */
export function fighterNextStep(state: GameState, content: GameContent): { stage: FighterStage; nextOrg: OrgDef | null; gap: OrgBlockReason | null } {
  const stage = fighterStage(state, content);
  const current = getOrg(content, state.fighter.orgId);
  const next =
    content.fighting.orgs
      .filter((o) => o.contract && (!current || tierIndex(o.tier) > tierIndex(current.tier)))
      .sort((a, b) => tierIndex(a.tier) - tierIndex(b.tier) || (a.requirements.minReputation ?? 0) - (b.requirements.minReputation ?? 0))[0] ?? null;
  return { stage, nextOrg: next, gap: next ? orgRequirementGap(state, next) : null };
}
