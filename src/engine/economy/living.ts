import { addFame } from '../fame/fame';
import { cityMultOf } from '../geo';
/** Custo de vida, moradia, mesada e dívida (cheque especial, falência). */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { relationsOf } from '../relationships/people';
import { DEBT_RATE, INDEX_WITHDRAW_FEE } from './bank';
import { post, toMoney } from './ledger';
import type { Housing, LivingStandard } from './types';

export const STANDARD: Record<LivingStandard, { cost: number; rent: number; happiness: number; label: string }> = {
  simples: { cost: 15000, rent: 11000, happiness: 0, label: 'Simples' },
  confortavel: { cost: 36000, rent: 24000, happiness: 3, label: 'Confortável' },
  luxo: { cost: 110000, rent: 55000, happiness: 6, label: 'Luxo' },
};
export const HOUSING_LABEL: Record<Housing, string> = { pais: 'Com os pais', aluguel: 'Aluguel', propria: 'Casa própria' };
export const BANKRUPTCY_YEARS = 3;
/** Dívida mínima para a falência por tempo (dívidas pequenas viram só cobrança). */
export const BANKRUPTCY_MIN_DEBT = 25000;

export function cityCost(state: GameState, content: GameContent): number {
  return cityMultOf(state, content);
}

export function livingCost(state: GameState, content: GameContent): { standard: number; rent: number } {
  if (state.character.age < 18) return { standard: 0, rent: 0 };
  const st = STANDARD[state.economy.standard];
  const city = cityCost(state, content);
  const housing = state.economy.housing;
  return {
    standard: toMoney(st.cost * city * (housing === 'pais' ? 0.5 : 1)),
    rent: housing === 'aluguel' ? toMoney(st.rent * city) : 0,
  };
}

export function setStandard(state: GameState, standard: LivingStandard): GameState {
  if (state.character.age < 18) return state;
  return { ...state, economy: { ...state.economy, standard } };
}

export function setHousing(state: GameState, housing: Housing): GameState {
  if (state.character.age < 18) return state;
  if (housing === 'propria' && !state.economy.assets.some((a) => a.home)) return state;
  const parentsAlive = relationsOf(state, ['pai', 'mae']).length > 0;
  if (housing === 'pais' && !parentsAlive) return state;
  const assets = housing === 'propria' ? state.economy.assets : state.economy.assets.map((a) => ({ ...a, home: false }));
  return { ...state, economy: { ...state.economy, housing, assets } };
}

/** Mesada (até 18): vem do patrimônio real dos pais. */
export function allowance(state: GameState): number {
  const age = state.character.age;
  if (age < 10 || age >= 18) return 0;
  const wealth = relationsOf(state, ['pai', 'mae']).reduce((t, x) => t + (x.person.wealth ?? 0), 0);
  return Math.min(6000, toMoney(wealth * 0.004));
}

/** Fechamento do custo de vida. */
export function livingYear(state: GameState, content: GameContent): GameState {
  let s = state;
  const age = s.character.age;
  if (age < 18) {
    const a = allowance(s);
    return a ? post(s, 'familia', a, 'Mesada dos pais') : s;
  }
  // sem casa própria marcada, volta para o aluguel
  if (s.economy.housing === 'propria' && !s.economy.assets.some((x) => x.home)) s = { ...s, economy: { ...s.economy, housing: 'aluguel' } };
  if (s.economy.housing === 'pais' && relationsOf(s, ['pai', 'mae']).length === 0) s = { ...s, economy: { ...s.economy, housing: 'aluguel' } };
  const cost = livingCost(s, content);
  s = post(s, 'padrao_vida', -cost.standard, `Padrão de vida: ${STANDARD[s.economy.standard].label}`);
  if (cost.rent) s = post(s, 'moradia', -cost.rent, 'Aluguel');
  const st = STANDARD[s.economy.standard];
  let happy = st.happiness;
  if (s.economy.housing === 'pais' && age > 25) happy -= 1;
  const delta: { happiness: number; looks?: number } = { happiness: happy };
  if (s.economy.standard === 'luxo') delta.looks = 1;
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, delta) } };
  if (s.economy.standard === 'luxo') s = addFame(s, 1);
  return s;
}

/**
 * Dívida: saldo negativo vira cheque especial (35% a.a.); juros acumulam; dívida longa pesa na
 * felicidade e na saúde; acima do limite (ou mais de 3 anos) → falência pessoal com perda de bens.
 * `liquidate` vende bens/empresas/aplicações (injetado para evitar dependência circular).
 */
export function debtYear(state: GameState, liquidate: (s: GameState) => GameState): GameState {
  let s = state;
  // antes de virar dívida, o banco cobre o saldo negativo com a poupança (resgate automático)
  if (s.money < 0 && s.economy.savings > 0) {
    const cover = Math.min(s.economy.savings, -s.money);
    s = post(s, 'aplicacoes', cover, 'Resgate automático da poupança');
    s = { ...s, economy: { ...s.economy, savings: s.economy.savings - cover } };
  }
  // depois, resgata do índice (com a taxa de resgate)
  if (s.money < 0 && s.economy.investments > 0) {
    const gross = Math.min(s.economy.investments, toMoney(-s.money / (1 - INDEX_WITHDRAW_FEE)) + 1);
    const net = toMoney(gross * (1 - INDEX_WITHDRAW_FEE));
    s = post(s, 'aplicacoes', net, 'Resgate automático do índice');
    s = { ...s, economy: { ...s.economy, investments: s.economy.investments - gross } };
  }
  // juros sobre a dívida que já existia
  if (s.economy.debt > 0) s = { ...s, economy: { ...s.economy, debt: s.economy.debt + toMoney(s.economy.debt * DEBT_RATE) } };
  if (s.money < 0) {
    const owed = -s.money;
    s = post(s, 'credito', owed, 'Cheque especial (saldo negativo)');
    s = { ...s, economy: { ...s.economy, debt: s.economy.debt + owed } };
    s = appendLog(s, `Seu saldo ficou negativo: R$ ${owed.toLocaleString('pt-BR')} viraram dívida no cheque especial (35% ao ano).`);
  }
  // usa o dinheiro que sobrou para abater a dívida
  if (s.economy.debt > 0 && s.money > 0) {
    const pay = Math.min(s.money, s.economy.debt);
    s = post(s, 'parcelas', -pay, 'Pagamento automático da dívida');
    s = { ...s, economy: { ...s.economy, debt: s.economy.debt - pay } };
  }
  if (s.economy.debt <= 0) return { ...s, economy: { ...s.economy, debt: 0, debtYears: 0 } };
  const debtYears = s.economy.debtYears + 1;
  s = { ...s, economy: { ...s.economy, debtYears } };
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -(2 + Math.min(8, debtYears * 2)), health: debtYears >= 3 && s.economy.debt > BANKRUPTCY_MIN_DEBT ? -1 : 0 }) } };
  // falência: dívida grande por 2+ anos, ou qualquer dívida por mais de 3 anos
  const limit = Math.max(60000, s.economy.lastIncome * 3);
  if ((debtYears >= 2 && s.economy.debt > limit) || (debtYears > BANKRUPTCY_YEARS && s.economy.debt > BANKRUPTCY_MIN_DEBT)) s = bankruptcy(s, liquidate);
  return s;
}

function bankruptcy(state: GameState, liquidate: (s: GameState) => GameState): GameState {
  let s = liquidate(state);
  const pay = Math.min(Math.max(0, s.money), s.economy.debt);
  if (pay > 0) s = post(s, 'parcelas', -pay, 'Pagamento da dívida (falência)');
  // renegociação: metade do que sobrou continua sendo devida (sem juros acumulados)
  const remaining = toMoney((s.economy.debt - pay) / 2);
  s = {
    ...s,
    economy: { ...s.economy, debt: remaining, debtYears: 0 },
    flags: { ...s.flags, falencia: (Number(s.flags.falencia) || 0) + 1 },
    character: { ...s.character, stats: addStats(s.character.stats, { happiness: -15 }) },
  };
  s = addFame(s, -5);
  return appendLog(s, 'Falência pessoal: seus bens foram vendidos para pagar as dívidas e o resto foi renegociado.');
}
