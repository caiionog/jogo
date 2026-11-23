/**
 * Crime e justiça (release 0.0.2). Fases 4–7 preenchem as regras; a fase 2 cria o formato (save v15).
 * `wanted` e `rep` são OCULTOS (a UI mostra só pistas).
 */

export type CrimeTier = 'leve' | 'medio' | 'grave';

/** Registro na ficha criminal. `passagem` = detido sem condenação; `condenacao` = sentença transitada. */
export interface RecordEntry {
  age: number;
  year: number;
  /** Id do delito ou motivo ('briga', 'corrupcao'…). */
  crime: string;
  kind: 'passagem' | 'condenacao';
  /** Pena em anos (condenação). */
  years?: number;
}

export interface CrimeState {
  /** Nível de procurado 0–100 (oculto). */
  wanted: number;
  /** Reputação no crime 0–100 (oculta). */
  rep: number;
  /** Quanto do dinheiro é "sujo" (R$, nunca acima do saldo). */
  dirty: number;
  /** Ficha criminal (adulto, permanente). */
  record: RecordEntry[];
  /** Passagens de 12–17 anos (não contam depois dos 18). */
  juvenile: RecordEntry[];
  /** Facção (fase 5). */
  faction: { id: string; rank: number; years: number; debt: number } | null;
  /** Tráfico (fase 5). */
  trafficking: { level: 'pequeno' | 'medio' | 'grande'; years: number } | null;
}

export function emptyCrime(): CrimeState {
  return { wanted: 0, rep: 0, dirty: 0, record: [], juvenile: [], faction: null, trafficking: null };
}

/** Pena em andamento (fase 7). */
export interface PrisonState {
  facility: string;
  regime: 'fechado' | 'semiaberto' | 'aberto';
  sentence: number;
  served: number;
  remission: number;
  behavior: number;
  protection: boolean;
  wing: 'comum' | 'especial';
  kind: 'adulto' | 'internacao';
}
