/** Ações econômicas prontas para a UI (calculam o ano econômico e o patrimônio quando preciso). */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { takePersonalLoan } from './bank';
import { applyForJob } from './jobs';
import { marketYear } from './market';
import { netWorth } from './worth';

export function currentMarket(state: GameState) {
  return marketYear(state.seed, state.year);
}

export function applyJob(state: GameState, jobId: string, content: GameContent): GameState {
  return applyForJob(state, jobId, content, currentMarket(state));
}

export function personalLoan(state: GameState, amount: number, years: number): GameState {
  return takePersonalLoan(state, amount, years, netWorth(state));
}
