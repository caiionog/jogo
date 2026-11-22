/** Impostos: renda progressiva (faixas como dado) e imposto anual sobre imóveis. */
import type { TaxBracket } from './types';
import { toMoney } from './ledger';

/** Contribuição previdenciária fictícia sobre o salário (9%). */
export const PENSION_RATE = 0.09;
export const PROPERTY_TAX_RATE = 0.008;
export const INHERITANCE_TAX_RATE = 0.04;
/** Imposto sobre o ganho anual do índice (retido na aplicação). */
export const INDEX_GAIN_TAX = 0.15;

/** Imposto progressivo: cada faixa tributa só a parte da renda dentro dela. */
export function incomeTax(income: number, brackets: readonly TaxBracket[]): number {
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    const upper = b.upTo ?? Infinity;
    if (income <= lower) break;
    const slice = Math.min(income, upper) - lower;
    tax += slice * b.rate;
    lower = upper;
  }
  return toMoney(tax);
}
