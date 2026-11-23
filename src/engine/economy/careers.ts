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
export type RequirementKey = 'age' | 'education' | 'study' | 'cnh' | 'stats' | 'reputation' | 'fight' | 'degree' | 'license';
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
  if (def.requires?.degree) list.push('degree');
  if (def.requires?.license) list.push('license');
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

export type NextStepTarget = 'academia' | 'treino' | 'ofertas' | 'ranking';

/** Nome da organização com a sigla explicada: "Liga Fronteira MMA (LFM)". */
function orgName(o: OrgDef): string {
  return o.short && o.short !== o.name ? `${o.name} (${o.short})` : o.name;
}

/**
 * Próximo passo da carreira de luta em uma frase objetiva + para onde o botão leva (release 0.0.1, tela central).
 * Nunca cita números de habilidade.
 */
export function fighterNextStepText(state: GameState, content: GameContent): { text: string; target: NextStepTarget | null } {
  const { stage, nextOrg, gap } = fighterNextStep(state, content);
  const f = state.fighter;
  const hasOffers = f.offers.length > 0;
  if (stage === 'aposentado') return { text: 'Você está aposentado(a). A volta só acontece por convite (com reputação alta, alguém pode te chamar).', target: null };
  if (stage === 'sem_academia') return { text: 'Entre numa academia: é lá que você treina as modalidades e recebe convites para lutar.', target: 'academia' };
  if (f.titles.length) return { text: 'Você é campeã(o)! Defenda o cinturão nas ofertas do ano.', target: 'ofertas' };
  if (!nextOrg) return { text: 'Você está na liga principal. Vença no ranking até chegar ao top 3 e disputar o cinturão.', target: 'ranking' };
  const r = nextOrg.requirements;
  const name = orgName(nextOrg);
  const fightOrTrain: NextStepTarget = hasOffers ? 'ofertas' : 'treino';
  switch (gap) {
    case 'age':
      return {
        text: hasOffers
          ? `Dispute os campeonatos da sua idade (veja as ofertas) e continue treinando: a ${name} só chama a partir dos ${nextOrg.minAge} anos.`
          : `Continue treinando: a ${name} só chama a partir dos ${nextOrg.minAge} anos.`,
        target: fightOrTrain,
      };
    case 'amateur-wins': {
      const n = Math.max(1, (r.minAmateurWins ?? 0) - f.amateur.wins);
      return { text: `Vença mais ${n} ${n === 1 ? 'luta amadora' : 'lutas amadoras'} para receber convites profissionais da ${name}.`, target: fightOrTrain };
    }
    case 'pro-wins': {
      const n = Math.max(1, (r.minProWins ?? 0) - f.pro.wins);
      return { text: `Vença mais ${n} ${n === 1 ? 'luta profissional' : 'lutas profissionais'} para a ${name} te notar.`, target: fightOrTrain };
    }
    case 'reputation':
      return { text: `Ganhe nome: vitórias (principalmente por finalização ou nocaute) aumentam sua reputação até a ${name} te notar.`, target: fightOrTrain };
    case 'belt':
      return { text: `Chegue à faixa ${['branca', 'azul', 'roxa', 'marrom', 'preta'][r.minBelt ?? 0]} no jiu-jitsu (adulto) para entrar na ${name}.`, target: 'treino' };
    case 'win-rate':
      return { text: `Engate uma sequência de vitórias: a ${name} olha o seu aproveitamento recente.`, target: fightOrTrain };
    case 'signing-age':
      return { text: `A ${name} não contrata mais na sua idade. Brilhe onde você está: suba no ranking e dispute o cinturão.`, target: 'ranking' };
    default:
      return { text: `Requisitos da ${name} atendidos: a proposta deve chegar na virada do ano.`, target: fightOrTrain };
  }
}
