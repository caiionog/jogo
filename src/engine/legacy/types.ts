/** Legado (Etapa 6): dinastia, testamento, fim de vida e obituário. */
import type { Sex } from '../core/state';

export interface DynastyMember {
  name: string;
  sex: Sex;
  gen: number;
  born: number;
  died: number;
  ageAtDeath: number;
  cause: string;
  score: number;
  /** Cartel profissional "V-D-E". */
  record: string;
  titles: string[];
  belt: number;
  peakRep: number;
  children: string[];
  /** Nome do filho(a) que continuou a história. */
  heir?: string;
}

export interface Dynasty {
  generation: number;
  surname: string;
  founderYear: number;
  /** Resumo das gerações jogadas (antepassados). */
  members: DynastyMember[];
}

export interface Will {
  /** personId → porcentagem (0–100). */
  shares: Record<string, number>;
  year: number;
}

export interface HeirShare {
  personId: string;
  name: string;
  relation: string;
  age: number;
  share: number;
  /** Valor líquido recebido (após imposto). */
  amount: number;
  canContinue: boolean;
}

export interface Obituary {
  headline: string;
  lines: string[];
  highlights: string[];
}

export interface LifeEnding {
  age: number;
  year: number;
  cause: string;
  score: number;
  /** Componentes da nota (para a tela de fim). */
  scoreParts: Record<string, number>;
  obituary: Obituary;
  estate: { gross: number; tax: number; net: number; byWill: boolean };
  heirs: HeirShare[];
}

export interface LegacyContent {
  /** Divisão sem testamento: parte do cônjuge quando há filhos (o resto vai aos filhos). */
  defaultSplit: { spouseWithChildren: number };
  inheritanceTax: number;
  /** Reputação inicial do herdeiro = min(máx., pico ÷ divisor). */
  famousRepDivisor: number;
  famousRepMax: number;
  /** Bônus extra de treino na academia da família por geração (máx.). */
  gymBonusPerGen: number;
  gymBonusMax: number;
}

export function emptyDynasty(surname: string, founderYear: number): Dynasty {
  return { generation: 1, surname, founderYear, members: [] };
}
