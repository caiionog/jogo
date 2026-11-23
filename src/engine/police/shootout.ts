/**
 * Troca de tiro (release 0.0.2): função pura com seed. Tática escolhida × Tiro × Capacidade atlética × sorte
 * (limitada). A força especial enfrenta situações mais perigosas. O texto do resultado é curto e não gráfico.
 */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { luckFactor } from '../character/talents';
import type { ShootoutOutcome, ShootoutTactic } from './types';

export const SHOOTOUT_OUTCOMES: readonly ShootoutOutcome[] = ['preso', 'fuga', 'colega_ferido', 'ferido', 'morte'];

/** Competência (0–100): Tiro pesa mais; atlética e luta (imobilizar) ajudam. */
export function shootoutSkill(state: GameState): number {
  const sk = state.fighter.skills;
  return state.police.shooting * 0.6 + state.character.stats.athletic * 0.3 + ((sk.grappling + sk.trocacao) / 2) * 0.1;
}

/** Quanto a sorte pode mexer em cada probabilidade (fração). Inclina, nunca decide sozinha. */
export const SHOOTOUT_LUCK = 0.2;

/** Probabilidades dos resultados (somam 1). */
export function shootoutOdds(state: GameState, tactic: ShootoutTactic): Record<ShootoutOutcome, number> {
  const k = shootoutSkill(state) / 100;
  const danger = state.police.career?.unit === 'especial' ? 2 : 1;
  const iq = state.character.stats.intelligence / 100;
  const base: Record<ShootoutTactic, Omit<Record<ShootoutOutcome, number>, 'fuga'>> = {
    avancar: { preso: 0.25 + k * 0.45, colega_ferido: 0.06, ferido: 0.12 * danger * (1.3 - k), morte: 0.012 * danger * (1.4 - k) },
    abrigar: { preso: 0.15 + k * 0.3, colega_ferido: 0.05, ferido: 0.05 * danger * (1.3 - k), morte: 0.004 * danger * (1.4 - k) },
    negociar: { preso: 0.15 + iq * 0.4, colega_ferido: 0.07, ferido: 0.04 * danger, morte: 0.003 * danger },
    recuar: { preso: 0.05, colega_ferido: 0.04, ferido: 0.02 * danger, morte: 0.002 * danger },
  };
  const b = base[tactic];
  const l = luckFactor(state) * SHOOTOUT_LUCK;
  const preso = b.preso * (1 + l);
  const colega_ferido = b.colega_ferido * (1 - l);
  const ferido = b.ferido * (1 - l);
  const morte = b.morte * (1 - l);
  const fuga = Math.max(0, 1 - preso - colega_ferido - ferido - morte);
  return { preso, fuga, colega_ferido, ferido, morte };
}

export function rollShootout(state: GameState, tactic: ShootoutTactic, rng: Rng): ShootoutOutcome {
  const odds = shootoutOdds(state, tactic);
  let r = rng.next();
  for (const o of SHOOTOUT_OUTCOMES) {
    r -= odds[o];
    if (r < 0) return o;
  }
  return 'fuga';
}

export function shootoutText(content: GameContent, outcome: ShootoutOutcome, rng: Rng): string {
  const pool = content.police.shootoutText[outcome];
  return pool.length ? rng.pick(pool) : '';
}
