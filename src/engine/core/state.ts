/** Tipos do estado do jogo. Tudo aqui deve ser JSON puro (sem classes, Date, Map, funções). */

export const STAT_KEYS = [
  'health',
  'happiness',
  'intelligence',
  'looks',
  'strength',
  'fitness',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export type Sex = 'M' | 'F';

export interface Character {
  name: string;
  sex: Sex;
  age: number;
  birthYear: number;
  country: string;
  city: string;
  stats: Stats;
}

export interface Energy {
  current: number;
  max: number;
}

export type FlagValue = boolean | number | string;

export interface LogYear {
  age: number;
  year: number;
  entries: string[];
}

export interface PendingEvent {
  eventId: string;
}

export interface GameState {
  version: number;
  seed: string;
  rngState: number;
  /** Ano corrente no calendário do jogo. */
  year: number;
  character: Character;
  money: number;
  energy: Energy;
  flags: Record<string, FlagValue>;
  /** Ids de eventos que já aconteceram (para `once`). */
  firedEvents: string[];
  /** Eventos sorteados aguardando decisão do jogador. */
  pendingEvents: PendingEvent[];
  /** Histórico ano a ano. O último item é o ano atual. */
  log: LogYear[];
  alive: boolean;
}

export const STATE_VERSION = 1;
