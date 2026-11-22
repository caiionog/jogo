/** Morte (Etapa 6): risco anual por idade (curva de Gompertz) × saúde, doenças, dano cerebral e padrão de vida. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { conditionDef } from './aging';

/** Mortalidade base por idade (Gompertz): ~0,05% aos 30, ~0,7% aos 60, ~2,6% aos 75, ~10% aos 90, ~23% aos 100. */
export function baseMortality(age: number): number {
  if (age < 1) return 0.0005;
  return Math.min(0.95, 0.000035 * Math.exp(0.088 * age));
}

/** Risco anual de morte com todos os fatores. */
export function deathRisk(state: GameState, content: GameContent): number {
  const { age, stats } = state.character;
  if (stats.health <= 0) return 1;
  let p = baseMortality(age);
  if (stats.health < 15) p *= 4;
  else if (stats.health < 30) p *= 2;
  else if (stats.health < 50) p *= 1.25;
  else if (stats.health >= 80) p *= 0.75;
  for (const c of state.health.conditions) {
    const def = conditionDef(content, c.defId);
    if (def) p *= c.controlled ? 1 + (def.deathMult - 1) / 2 : def.deathMult;
  }
  // pancadas acumuladas cobram na velhice
  p *= 1 + state.health.brainDamage / 60;
  // lesões graves deixam o corpo mais frágil
  p *= 1 + state.health.sequelae.length * 0.08;
  if (age >= 18) {
    if (state.economy.standard === 'luxo') p *= 0.85;
    else if (state.economy.standard === 'simples') p *= 1.1;
  }
  return Math.min(0.95, p);
}

/** Causa provável: a doença mais pesada, ou causas naturais/complicações. */
export function deathCause(state: GameState, rng: Rng, content: GameContent): string {
  const defs = state.health.conditions.map((c) => conditionDef(content, c.defId)).filter((d) => d !== undefined);
  if (defs.length) {
    const total = defs.reduce((t, d) => t + d.deathMult, 0);
    let r = rng.next() * total;
    for (const d of defs) {
      r -= d.deathMult;
      if (r <= 0) return d.deathCause;
    }
    return defs[0]!.deathCause;
  }
  if (state.health.brainDamage > 60 && rng.chance(0.4)) return 'complicações neurológicas';
  if (state.character.age < 50) return state.character.stats.health <= 0 ? 'complicações de saúde' : 'um mal súbito';
  return 'causas naturais';
}

/** Sorteio anual (null = sobreviveu). Determinístico pelo RNG do estado. */
export function deathCheck(state: GameState, rng: Rng, content: GameContent): string | null {
  const p = deathRisk(state, content);
  if (p >= 1 || rng.chance(p)) return deathCause(state, rng, content);
  return null;
}
