import type { Effects } from '../core/effects';
import type { ClubId, SchoolStage, SchoolType, Sex, StatKey } from '../core/state';
import type { Tier } from '../fighting/types';

export interface StatRange {
  min?: number;
  max?: number;
}

export type SchoolResultTag = 'passed' | 'failed' | 'honors' | 'graduated' | 'expelled';

export interface EventConditions {
  minAge?: number;
  maxAge?: number;
  sex?: Sex;
  stats?: Partial<Record<StatKey, StatRange>>;
  /** Todas estas flags precisam estar presentes (truthy). */
  flagsAll?: string[];
  /** Nenhuma destas flags pode estar presente (truthy). */
  flagsNone?: string[];

  // --- escola ---
  /** true: precisa estar matriculado; false: precisa estar fora da escola. */
  enrolled?: boolean;
  /** Fase escolar atual (implica estar matriculado). */
  schoolStages?: SchoolStage[];
  schoolType?: SchoolType;
  /** Faixas de nota média, disciplina e popularidade (implica estar matriculado). */
  school?: { average?: StatRange; discipline?: StatRange; popularity?: StatRange };
  /** Lista de clubes aceitos, 'any' (qualquer clube) ou 'none' (sem clube). */
  club?: ClubId[] | 'any' | 'none';
  /** Resultado do último fim de ano letivo (basta uma tag bater). */
  schoolResult?: SchoolResultTag[];

  // --- carreira de luta ---
  fighting?: FightingConditions;
}

export interface FightingConditions {
  /** Organização do contrato atual. */
  orgs?: string[];
  /** Nível da organização do contrato ('none' = sem contrato). */
  tiers?: (Tier | 'none')[];
  contracted?: boolean;
  /** Está no ranking (ou é campeão) da categoria atual. */
  ranked?: boolean;
  /** Posição máxima no ranking (1 = #1; o campeão conta como 0). */
  rankMax?: number;
  champion?: boolean;
  /** Faixa de jiu-jitsu: 0 branca … 4 preta. */
  belt?: StatRange;
  amateurWins?: StatRange;
  proWins?: StatRange;
  reputation?: StatRange;
  hasGym?: boolean;
  injured?: boolean;
  suspended?: boolean;
  /** Atende aos requisitos e pode receber proposta desta organização. */
  orgEligible?: string;
  beltPromotionReady?: boolean;
  /** Já lutou alguma vez (qualquer cartel). */
  hasFought?: boolean;
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

/**
 * Como o evento entra no ano:
 * - 'random' (padrão): sorteado por peso entre os elegíveis.
 * - 'auto': entra sempre que elegível (marcos: formatura, reprovação...). Use com `once` ou condições restritivas.
 * - 'followUp': nunca sorteado; só quando agendado por `effects.followUps`.
 */
export type EventTrigger = 'random' | 'auto' | 'followUp';

export interface GameEvent {
  id: string;
  conditions: EventConditions;
  /** Peso relativo no sorteio (> 0 para eventos 'random'). */
  weight: number;
  trigger?: EventTrigger;
  /** Se true, só acontece uma vez por vida. */
  once?: boolean;
  /** Texto com placeholders: {name}, {city}, {escola}, {da_escola}, {na_escola}, {colega}, {professor}, {clube}, {o/a}. */
  text: string;
  choices: EventChoice[];
}
