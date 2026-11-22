import { GAME_CONTENT } from '../src/content';
import type { GameState } from '../src/engine';
import { ledgerSum, newGame } from '../src/engine';

/** Adulto com dinheiro, energia e extrato coerente (opening = money). */
export function adult(age = 30, money = 100000, seed = 'eco'): GameState {
  const g = newGame({ seed, name: 'Ana Economia', sex: 'F', birthYear: 1990 }, GAME_CONTENT);
  return {
    ...g,
    year: 1990 + age,
    money,
    // Goiânia: multiplicador de custo de vida 1,00 (valores dos testes sem ajuste de cidade)
    character: { ...g.character, uf: 'GO', city: 'Goiânia', age, stats: { ...g.character.stats, intelligence: 80, athletic: 60, looks: 60, health: 90 } },
    energy: { current: 8, max: 8, reserved: 0 },
    education: { ...g.education, graduated: true },
    economy: { ...g.economy, ledger: { year: 1990 + age, opening: money, entries: [] }, housing: 'aluguel', lastIncome: 80000 },
  };
}

/** Invariante do extrato: money − opening === Σ lançamentos, e dinheiro inteiro. */
export function ledgerOk(s: GameState): boolean {
  return Number.isInteger(s.money) && s.money - s.economy.ledger.opening === ledgerSum(s) && s.economy.ledger.entries.every((e) => Number.isInteger(e.amount));
}
