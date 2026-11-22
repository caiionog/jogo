import type { Effects } from './effects';
import type { GameEvent } from '../events/types';
import type { ClubId, SchoolStage } from './state';
import type { FightingContent } from '../fighting/types';

/** Risco de uma ação: efeitos ADICIONAIS aplicados com probabilidade `chance`. */
export interface ActionRisk {
  chance: number;
  effects?: Effects;
  logText: string;
}

export type ActionCategory = 'vida' | 'escola';

/** Ação anual que gasta energia (treinar, estudar...). Definida como dado em src/content. */
export interface ActionDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
  category: ActionCategory;
  energyCost: number;
  minAge: number;
  maxAge?: number;
  requires?: {
    /** Exige estar matriculado em uma escola. */
    enrolled?: boolean;
    schoolStages?: SchoolStage[];
  };
  effects: Effects;
  /** Variação aleatória (+0..variance) somada a cada atributo positivo dos efeitos. */
  variance?: number;
  /** Textos possíveis para o log (um é sorteado). */
  logTexts: string[];
  risk?: ActionRisk;
}

/** Clube ou time escolar. */
export interface ClubDef {
  id: ClubId;
  label: string;
  emoji: string;
  /** Fase escolar mínima para participar. */
  minStage: SchoolStage;
  /** Clubes de luta alimentam a carreira de luta (Etapa 3). */
  combat: boolean;
  joinText: string;
  joinEffects: Effects;
  /** Aplicado no fim de cada ano letivo em que o personagem participou. */
  yearlyEffects: Effects;
}

export interface NamePools {
  male: readonly string[];
  female: readonly string[];
  surnames: readonly string[];
  publicSchoolPrefixes: readonly string[];
  privateSchoolPrefixes: readonly string[];
  schoolNames: readonly string[];
}

export interface Location {
  country: string;
  cities: string[];
}

/**
 * Pacote de conteúdo injetado na engine. A engine não importa src/content diretamente:
 * recebe este objeto, o que facilita testes com conteúdo sob medida.
 */
export interface GameContent {
  actions: readonly ActionDef[];
  events: readonly GameEvent[];
  locations: readonly Location[];
  clubs: readonly ClubDef[];
  names: NamePools;
  fighting: FightingContent;
}
