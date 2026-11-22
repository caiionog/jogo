/** Faixas de jiu-jitsu: branca → azul → roxa → marrom → preta. */
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';

export const BELTS = ['branca', 'azul', 'roxa', 'marrom', 'preta'] as const;
export const BELT_EMOJI = ['⬜', '🟦', '🟪', '🟫', '⬛'] as const;

export interface BeltRequirement {
  minAge: number;
  /** Anos treinando jiu-jitsu na faixa anterior. */
  years: number;
  jiujitsu: number;
}

/** BELT_REQUIREMENTS[n] = requisito para chegar à faixa n. */
export const BELT_REQUIREMENTS: readonly (BeltRequirement | null)[] = [
  null,
  { minAge: 16, years: 2, jiujitsu: 35 },
  { minAge: 16, years: 2, jiujitsu: 50 },
  { minAge: 18, years: 2, jiujitsu: 65 },
  { minAge: 19, years: 1, jiujitsu: 78 },
];

export function beltPromotionReady(state: GameState): boolean {
  const { belt, skills } = state.fighter;
  const req = BELT_REQUIREMENTS[belt.rank + 1];
  if (!req) return false;
  return state.character.age >= req.minAge && belt.years >= req.years && skills.jiujitsu >= req.jiujitsu;
}

/** Promove para a próxima faixa se os requisitos forem atendidos. */
export function promoteBelt(state: GameState): GameState {
  if (!beltPromotionReady(state)) return state;
  const rank = state.fighter.belt.rank + 1;
  const next: GameState = {
    ...state,
    fighter: { ...state.fighter, belt: { rank, years: 0 }, reputation: Math.min(100, state.fighter.reputation + 2) },
  };
  return appendLog(next, `Você recebeu a faixa ${BELTS[rank]} de jiu-jitsu!`);
}
