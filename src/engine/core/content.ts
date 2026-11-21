import type { Effects } from './effects';
import type { GameEvent } from '../events/types';

/** Ação anual que gasta energia (treinar, estudar...). Definida como dado em src/content. */
export interface ActionDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
  energyCost: number;
  minAge: number;
  maxAge?: number;
  effects: Effects;
  /** Variação aleatória (+0..variance) somada a cada atributo positivo dos efeitos. */
  variance?: number;
  /** Textos possíveis para o log (um é sorteado). */
  logTexts: string[];
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
}
