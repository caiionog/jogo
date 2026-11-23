/**
 * Extrato: `post` é a ÚNICA forma de alterar `state.money`. Todo valor é inteiro.
 * Invariante: money − ledger.opening === Σ ledger.entries.
 */
import type { GameState } from '../core/state';
import type { EconomyState, LedgerCategory, YearSummary } from './types';

export const MAX_HISTORY_YEARS = 100;

/** Converte qualquer valor para dinheiro inteiro. */
export function toMoney(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.round(x);
}

export const CATEGORY_LABEL: Record<LedgerCategory, string> = {
  trabalho_informal: 'Trabalho informal',
  salario: 'Salário',
  luta: 'Bolsas de luta',
  patrocinio: 'Patrocínios',
  aluguel_recebido: 'Aluguéis recebidos',
  empresa: 'Empresas',
  juros: 'Juros e rendimentos',
  heranca: 'Herança',
  venda_bens: 'Venda de bens',
  credito: 'Crédito recebido',
  familia: 'Família e amigos',
  aplicacoes: 'Aplicações e resgates',
  impostos: 'Impostos',
  saude: 'Saúde',
  moradia: 'Moradia',
  padrao_vida: 'Padrão de vida',
  filhos: 'Filhos',
  academia: 'Academia',
  educacao: 'Educação e esporte',
  compras: 'Compras',
  parcelas: 'Parcelas',
  manutencao: 'Manutenção e seguros',
  agente: 'Empresário',
  pensao: 'Pensão',
  multas: 'Multas',
  eventos: 'Outros',
  crime: 'Dinheiro ilícito',
};

/** Categorias de renda tributável (imposto de renda). */
export const TAXABLE: readonly LedgerCategory[] = ['salario', 'luta', 'patrocinio', 'aluguel_recebido', 'empresa'];

export function emptyEconomy(money = 0, year = 0): EconomyState {
  return {
    ledger: { year, opening: toMoney(money), entries: [] },
    history: [],
    housing: 'pais',
    standard: 'simples',
    debt: 0,
    debtYears: 0,
    savings: 0,
    investments: 0,
    loans: [],
    nextId: 1,
    job: null,
    lastIncome: 0,
    agent: null,
    contract: null,
    sponsors: [],
    assets: [],
    boughtOffers: [],
    businesses: [],
    marriage: null,
    alimony: [],
    evadedTax: 0,
  };
}

/** Lança um valor (inteiro, com sinal) no dinheiro e no extrato do ano. */
export function post(state: GameState, cat: LedgerCategory, amount: number, label: string): GameState {
  const value = toMoney(amount);
  if (value === 0) return state;
  const eco = state.economy;
  // dinheiro de crime/propina vira "dinheiro sujo" (release 0.0.2)
  const crime = cat === 'crime' && value > 0 && state.crime ? { ...state.crime, dirty: state.crime.dirty + value } : state.crime;
  return {
    ...state,
    crime,
    money: state.money + value,
    economy: { ...eco, ledger: { ...eco.ledger, entries: [...eco.ledger.entries, { cat, amount: value, label }] } },
  };
}

export function ledgerTotals(state: GameState): Partial<Record<LedgerCategory, number>> {
  const totals: Partial<Record<LedgerCategory, number>> = {};
  for (const e of state.economy.ledger.entries) totals[e.cat] = (totals[e.cat] ?? 0) + e.amount;
  return totals;
}

export function ledgerSum(state: GameState): number {
  return state.economy.ledger.entries.reduce((t, e) => t + e.amount, 0);
}

/** Renda do extrato atual em categorias tributáveis (só entradas positivas). */
export function taxableIncome(state: GameState): number {
  return state.economy.ledger.entries.filter((e) => TAXABLE.includes(e.cat) && e.amount > 0).reduce((t, e) => t + e.amount, 0);
}

/** Arquiva o extrato do ano (só totais) e abre o do novo ano. */
export function archiveLedger(state: GameState, netWorth: number): GameState {
  const eco = state.economy;
  const summary: YearSummary = {
    year: eco.ledger.year,
    age: state.character.age,
    totals: ledgerTotals(state),
    closing: state.money,
    netWorth,
  };
  return {
    ...state,
    economy: {
      ...eco,
      history: [...eco.history, summary].slice(-MAX_HISTORY_YEARS),
      ledger: { year: state.year + 1, opening: state.money, entries: [] },
      boughtOffers: [],
    },
  };
}

export function nextEcoId(state: GameState, prefix: string): [GameState, string] {
  const id = `${prefix}${state.economy.nextId}`;
  return [{ ...state, economy: { ...state.economy, nextId: state.economy.nextId + 1 } }, id];
}
