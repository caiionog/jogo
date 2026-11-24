/** Saúde: lesões, sequelas, dano cerebral, doenças da velhice e hábitos (Etapa 6). */
import type { StatKey } from '../core/state';
import type { SkillDelta } from '../fighting/types';

export type InjuryZone = 'cabeca' | 'mao' | 'tronco' | 'joelho' | 'ombro' | 'coluna' | 'pele' | 'perna';
/** `tiro`: só troca de tiro (polícia); nunca sorteada em luta, treino ou eventos comuns. */
export type InjurySource = 'luta' | 'sparring' | 'treino' | 'evento' | 'tiro';
export type Treatment = 'none' | 'repouso' | 'fisio' | 'cirurgia';

/** Lesão do catálogo (conteúdo). */
export interface InjuryDef {
  id: string;
  name: string;
  /** 1 leve · 2 moderada · 3 grave · 4 gravíssima. */
  severity: 1 | 2 | 3 | 4;
  /** Tempo de recuperação em meses (sorteado na faixa). */
  months: [number, number];
  /** Custo base em R$ (× custo da cidade). */
  cost: { fisio: number; cirurgia?: number };
  /** Penalidade durante a recuperação (habilidades na luta e atributos). */
  effects: { skills?: SkillDelta; stats?: Partial<Record<StatKey, number>> };
  /** Cirurgia: chance de sucesso e fator no tempo. Só para lesões graves. */
  surgery?: { successChance: number; monthsFactor: number };
  /** Chance base de deixar sequela ao sarar (sem tratamento). */
  sequelaChance: number;
  sequelaId?: string;
  sources: readonly InjurySource[];
  zone: InjuryZone;
  /** Peso no sorteio (padrão 1). */
  weight?: number;
  /** Dano cerebral extra ao acontecer (concussão). */
  brainDamage?: number;
}

/** Sequela permanente. */
export interface SequelaDef {
  id: string;
  name: string;
  description: string;
  skills?: SkillDelta;
  stats?: Partial<Record<StatKey, number>>;
  /** Pesa na decisão médica de aposentadoria (joelho, coluna). */
  careerThreatening?: boolean;
}

/** Doença da velhice/crônica. */
export interface ConditionDef {
  id: string;
  name: string;
  /** Idade a partir da qual pode surgir. */
  minAge: number;
  /** Chance anual base (multiplicada pelos fatores de risco). */
  baseChance: number;
  /** Saúde perdida por ano (controlada: metade). */
  healthPerYear: number;
  /** Multiplicador no risco de morte (controlada: mais perto de 1). */
  deathMult: number;
  /** Custo anual do tratamento (R$, × cidade). */
  treatmentCost: number;
  /** Fatores de risco que pesam mais nessa doença. */
  risk: { brainDamage?: number; injuries?: number; lowStandard?: number; lowFitness?: number };
  /** Causa de morte exibida no obituário. */
  deathCause: string;
}

export interface HealthContent {
  injuries: readonly InjuryDef[];
  sequelae: readonly SequelaDef[];
  conditions: readonly ConditionDef[];
  /** Custos das ações de saúde (R$, × cidade). */
  actionCosts: { checkup: number; gym: number; diet: number };
  /** Evento disparado no diagnóstico de doença (vars: doenca, doenca_id). */
  diagnosisEventId?: string;
  /** Mapeia nomes de lesões antigas (Etapa 3) para ids do catálogo (migração). */
  legacyNames: Record<string, string>;
}

export interface ActiveInjury {
  id: string;
  defId: string;
  /** Gravidade copiada do catálogo (1–4). */
  severity: number;
  /** Meses que faltam para sarar. */
  months: number;
  treatment: Treatment;
  /** Agravada por lutar/treinar antes de sarar. */
  aggravated: boolean;
  /** Idade em que aconteceu. */
  age: number;
  source: InjurySource;
}

export interface ActiveCondition {
  defId: string;
  sinceAge: number;
  controlled: boolean;
}

export interface HealthState {
  injuries: ActiveInjury[];
  sequelae: string[];
  /** 0–100. OCULTO na UI (só pistas). */
  brainDamage: number;
  conditions: ActiveCondition[];
  habits: { gymYear: number; dietYear: number; checkupYear: number };
  /** Histórico de lesões (para obituário e conquistas), no máximo 30. */
  history: { age: number; defId: string; source: InjurySource; surgery?: boolean }[];
  nextId: number;
}

export function emptyHealth(): HealthState {
  return { injuries: [], sequelae: [], brainDamage: 0, conditions: [], habits: { gymYear: -1, dietYear: -1, checkupYear: -1 }, history: [], nextId: 1 };
}
