import type { Effects } from '../core/effects';
import type { ClubId, SchoolStage, SchoolType, Sex, StatKey } from '../core/state';
import type { Tier } from '../fighting/types';
import type { CivilStatus, RelType, RomanceStage, TraitId } from '../relationships/types';
import type { AssetKind, EconYearKind, Housing, JobCategory } from '../economy/types';

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

  // --- relacionamentos ---
  /** Escolhe uma pessoa-alvo ({pessoa}) entre as relações que batem; o evento só acontece se houver alguma. */
  relationship?: RelationshipCondition;
  /** Existe ao menos uma relação (viva) destes tipos. */
  hasRelation?: RelType[];
  /** Não existe relação (viva) destes tipos. */
  noRelation?: RelType[];
  civilStatus?: CivilStatus[];
  /** Número de filhos (vivos). */
  children?: StatRange;
  /** Idade do(a) parceiro(a) romântico(a) atual (exige ter parceiro). */
  partnerAge?: StatRange;

  // --- economia ---
  economy?: EconomyConditions;
}

export interface EconomyConditions {
  money?: StatRange;
  netWorth?: StatRange;
  debt?: StatRange;
  employed?: boolean;
  jobs?: string[];
  jobCategory?: JobCategory[];
  /** Possui ao menos um bem de algum destes tipos. */
  hasAsset?: AssetKind[];
  ownsBusiness?: boolean;
  businessDefs?: string[];
  econYear?: EconYearKind[];
  hasSponsor?: boolean;
  hasAgent?: boolean;
  hasLoan?: boolean;
  housing?: Housing[];
  /** Tem imposto sonegado pendente. */
  evadedTax?: boolean;
  /** Tem dinheiro investido no índice. */
  invested?: boolean;
  /** Algum imóvel alugado para terceiros. */
  rentingOut?: boolean;
}

export interface RelationshipCondition {
  types: RelType[];
  affection?: StatRange;
  /** Basta um destes traços. */
  traits?: TraitId[];
  /** Idade da pessoa-alvo. */
  personAge?: StatRange;
  stages?: RomanceStage[];
  /** A pessoa treina na mesma academia do personagem. */
  sameGym?: boolean;
  /** Flag da pessoa-alvo que precisa estar presente. */
  personFlag?: string;
}

/** Tags de evento. 'adult' = conteúdo adulto (só 18+, com a opção ligada; ver guards.ts). */
export type EventTag = 'adult';

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
  tags?: EventTag[];
  /** Texto com placeholders: {name}, {city}, {escola}, {da_escola}, {na_escola}, {colega}, {professor}, {clube}, {o/a}. */
  text: string;
  choices: EventChoice[];
}
