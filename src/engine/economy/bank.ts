/** Banco: poupança, índice de mercado e empréstimos (tabela Price, inteiros). */
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { nextEcoId, post, toMoney } from './ledger';
import { INDEX_NAME } from './market';
import type { Loan, LoanKind } from './types';

export const LOAN_TERMS: Record<LoanKind, { rate: number; maxYears: number; label: string }> = {
  pessoal: { rate: 0.18, maxYears: 5, label: 'Empréstimo pessoal' },
  imobiliario: { rate: 0.09, maxYears: 20, label: 'Financiamento imobiliário' },
  veiculo: { rate: 0.12, maxYears: 5, label: 'Financiamento de veículo' },
};
export const DEBT_RATE = 0.35;
export const INDEX_WITHDRAW_FEE = 0.005;

/** Parcela anual fixa (tabela Price), arredondada para inteiro. */
export function priceInstallment(principal: number, rate: number, years: number): number {
  if (years <= 0) return principal;
  if (rate === 0) return Math.ceil(principal / years);
  return Math.ceil((principal * rate) / (1 - Math.pow(1 + rate, -years)));
}

/** Custo total de um empréstimo (soma das parcelas, com a última ajustada). */
export function loanTotalCost(principal: number, rate: number, years: number): number {
  let balance = principal;
  const inst = priceInstallment(principal, rate, years);
  let total = 0;
  for (let y = 0; y < years; y++) {
    const interest = toMoney(balance * rate);
    const pay = y === years - 1 ? balance + interest : Math.min(inst, balance + interest);
    total += pay;
    balance = balance + interest - pay;
  }
  return total;
}

export function newLoan(state: GameState, kind: LoanKind, principal: number, years: number, label?: string, assetId?: string): [GameState, Loan] {
  const t = LOAN_TERMS[kind];
  const y = Math.max(1, Math.min(t.maxYears, Math.round(years)));
  const p = toMoney(principal);
  let s: GameState;
  let id: string;
  [s, id] = nextEcoId(state, 'l');
  const loan: Loan = {
    id,
    kind,
    label: label ?? t.label,
    principal: p,
    rate: t.rate,
    years: y,
    installment: priceInstallment(p, t.rate, y),
    yearsLeft: y,
    balance: p,
    ...(assetId ? { assetId } : {}),
  };
  s = { ...s, economy: { ...s.economy, loans: [...s.economy.loans, loan] } };
  return [s, loan];
}

/** Cobra a parcela anual de cada empréstimo (juros + amortização). Última parcela quita exatamente. */
export function payLoans(state: GameState): GameState {
  let s = state;
  const loans: Loan[] = [];
  for (const l of s.economy.loans) {
    const interest = toMoney(l.balance * l.rate);
    const pay = l.yearsLeft <= 1 ? l.balance + interest : Math.min(l.installment, l.balance + interest);
    s = post(s, 'parcelas', -pay, `Parcela: ${l.label}`);
    const balance = l.balance + interest - pay;
    if (l.yearsLeft > 1 && balance > 0) loans.push({ ...l, balance, yearsLeft: l.yearsLeft - 1 });
    else s = appendLog(s, `Você quitou: ${l.label}.`);
  }
  return { ...s, economy: { ...s.economy, loans } };
}

/** Quita um empréstimo antes do prazo (paga o saldo devedor). */
export function payOffLoan(state: GameState, loanId: string): GameState {
  const l = state.economy.loans.find((x) => x.id === loanId);
  if (!l || state.money < l.balance) return state;
  let s = post(state, 'parcelas', -l.balance, `Quitação antecipada: ${l.label}`);
  s = { ...s, economy: { ...s.economy, loans: s.economy.loans.filter((x) => x.id !== loanId) } };
  return appendLog(s, `Você quitou antecipadamente: ${l.label}.`);
}

/** Limite de crédito: 2× a renda do último ano + 30% do patrimônio (menos o que já deve). */
export function creditLimit(state: GameState, netWorth: number): number {
  const owed = state.economy.loans.reduce((t, l) => t + l.balance, 0) + state.economy.debt;
  return Math.max(0, toMoney(state.economy.lastIncome * 2 + Math.max(0, netWorth) * 0.3 - owed));
}

export function takePersonalLoan(state: GameState, amount: number, years: number, netWorth: number): GameState {
  const a = toMoney(amount);
  if (a <= 0 || a > creditLimit(state, netWorth) || state.character.age < 18) return state;
  const [s, loan] = newLoan(state, 'pessoal', a, years);
  return appendLog(post(s, 'credito', a, 'Empréstimo pessoal'), `Você pegou um empréstimo de R$ ${a.toLocaleString('pt-BR')} em ${loan.years} parcelas anuais.`);
}

// --- poupança e índice ---

export function deposit(state: GameState, amount: number, where: 'savings' | 'investments'): GameState {
  const a = toMoney(amount);
  if (a <= 0 || a > state.money) return state;
  const s = post(state, 'aplicacoes', -a, where === 'savings' ? 'Depósito na poupança' : `Aplicação no ${INDEX_NAME}`);
  return { ...s, economy: { ...s.economy, [where]: s.economy[where] + a } };
}

export function withdraw(state: GameState, amount: number, where: 'savings' | 'investments'): GameState {
  const a = Math.min(toMoney(amount), state.economy[where]);
  if (a <= 0) return state;
  const fee = where === 'investments' ? toMoney(a * INDEX_WITHDRAW_FEE) : 0;
  const s = post(state, 'aplicacoes', a - fee, where === 'savings' ? 'Saque da poupança' : `Resgate do ${INDEX_NAME}`);
  return { ...s, economy: { ...s.economy, [where]: s.economy[where] - a } };
}

/** Paga (parte da) dívida automática com o dinheiro disponível. */
export function payDebt(state: GameState, amount: number): GameState {
  const a = Math.min(toMoney(amount), state.economy.debt, state.money);
  if (a <= 0) return state;
  const s = post(state, 'parcelas', -a, 'Pagamento da dívida');
  const debt = s.economy.debt - a;
  return { ...s, economy: { ...s.economy, debt, debtYears: debt === 0 ? 0 : s.economy.debtYears } };
}
