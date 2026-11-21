import type { Effects } from '../core/effects';
import type { Sex, StatKey } from '../core/state';

export interface StatRange {
  min?: number;
  max?: number;
}

export interface EventConditions {
  minAge?: number;
  maxAge?: number;
  sex?: Sex;
  stats?: Partial<Record<StatKey, StatRange>>;
  /** Todas estas flags precisam estar presentes (truthy). */
  flagsAll?: string[];
  /** Nenhuma destas flags pode estar presente (truthy). */
  flagsNone?: string[];
}

export interface EventRisk {
  /** Probabilidade (0–1) de o resultado alternativo acontecer. */
  chance: number;
  effects?: Effects;
  resultText: string;
}

export interface EventChoice {
  id: string;
  label: string;
  effects?: Effects;
  resultText: string;
  /** Resultado alternativo sorteado pelo RNG (substitui effects/resultText). */
  risk?: EventRisk;
}

export interface GameEvent {
  id: string;
  conditions: EventConditions;
  /** Peso relativo no sorteio (> 0). */
  weight: number;
  /** Se true, só acontece uma vez por vida. */
  once?: boolean;
  text: string;
  choices: EventChoice[];
}
