import type { GameState } from '../core/state';
import { businessValue } from './business';

/** Patrimônio líquido = dinheiro + aplicações + bens + empresas − dívidas − saldo devedor dos empréstimos. */
export function netWorth(state: GameState): number {
  const e = state.economy;
  const assets = e.assets.reduce((t, a) => t + a.value, 0);
  const biz = e.businesses.reduce((t, b) => t + businessValue(b), 0);
  const loans = e.loans.reduce((t, l) => t + l.balance, 0);
  return state.money + e.savings + e.investments + assets + biz - e.debt - loans;
}
