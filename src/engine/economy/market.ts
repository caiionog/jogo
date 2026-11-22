/**
 * Ano econômico global: derivado de seed + ano (RNG próprio), independente das escolhas do jogador.
 * Determina o retorno do índice, a valorização dos imóveis, o lucro das empresas e o risco de desemprego.
 */
import { createRng, seedToState } from '../core/rng';
import type { EconYearKind } from './types';

export interface MarketYear {
  kind: EconYearKind;
  /** Retorno anual do índice Bolsa Titã 100 (ex.: 0.07). */
  indexReturn: number;
  /** Valorização dos imóveis no ano. */
  propertyGrowth: number;
  /** Multiplicador da receita das empresas. */
  businessMult: number;
  /** Chance extra de demissão. */
  layoffRisk: number;
  /** Rendimento da poupança. */
  savingsRate: number;
}

export const INDEX_NAME = 'Índice Bolsa Titã 100';

export function marketYear(seed: string, year: number): MarketYear {
  const rng = createRng(seedToState(`${seed}:eco:${year}`));
  const r = rng.next();
  const kind: EconYearKind = r < 0.15 ? 'crise' : r < 0.3 ? 'boom' : 'normal';
  const between = (a: number, b: number) => a + rng.next() * (b - a);
  if (kind === 'crise') {
    return { kind, indexReturn: between(-0.28, -0.06), propertyGrowth: between(-0.08, 0), businessMult: 0.75, layoffRisk: 0.12, savingsRate: 0.01 };
  }
  if (kind === 'boom') {
    return { kind, indexReturn: between(0.12, 0.3), propertyGrowth: between(0.04, 0.1), businessMult: 1.2, layoffRisk: 0.01, savingsRate: 0.03 };
  }
  return { kind, indexReturn: between(-0.07, 0.12), propertyGrowth: between(-0.01, 0.04), businessMult: 1, layoffRisk: 0.03, savingsRate: 0.02 };
}

export const ECON_LABEL: Record<EconYearKind, string> = { normal: 'Ano normal', crise: 'Crise econômica', boom: 'Economia aquecida' };
