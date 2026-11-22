/** Altura, peso e categoria de peso. */
import type { Rng } from '../core/rng';
import type { Character, GameState, Sex, Stats } from '../core/state';
import type { DivisionDef } from './types';

/** Fração da altura adulta por idade (0–17); 18+ = 1. */
const GROWTH = [0.29, 0.43, 0.5, 0.55, 0.59, 0.63, 0.67, 0.7, 0.73, 0.76, 0.79, 0.82, 0.86, 0.9, 0.94, 0.97, 0.985, 0.995];

/** Altura adulta-alvo ~ normal (M 176±7, F 164±6). */
export function randomAdultHeight(rng: Rng, sex: Sex): number {
  const g = (rng.next() + rng.next() + rng.next() - 1.5) * 2;
  return Math.round(sex === 'M' ? 176 + g * 7 : 164 + g * 6);
}

export function heightAt(age: number, adultHeightCm: number): number {
  return Math.round(adultHeightCm * (GROWTH[age] ?? 1));
}

/** IMC por idade, força, condicionamento e biotipo. */
export function bmiAt(age: number, stats: Pick<Stats, 'strength' | 'fitness'>, build: number): number {
  let bmi: number;
  if (age <= 12) bmi = 16 + age * 0.1;
  else if (age < 18) bmi = 17.2 + (age - 12) * 0.75;
  else {
    bmi = 21.5 + (stats.strength - 30) / 25;
    bmi += stats.fitness < 40 ? (40 - stats.fitness) / 12 : -(stats.fitness - 40) / 40;
    if (age > 30) bmi += (age - 30) * 0.08;
  }
  return Math.min(34, Math.max(14, bmi + build * 0.8));
}

export function bodyFor(age: number, c: Pick<Character, 'adultHeightCm' | 'build' | 'stats'>): { heightCm: number; weightKg: number } {
  const heightCm = heightAt(age, c.adultHeightCm);
  const weightKg = Math.round(bmiAt(age, c.stats, c.build) * (heightCm / 100) ** 2 * 10) / 10;
  return { heightCm, weightKg };
}

export function updateBody(state: GameState): GameState {
  const c = state.character;
  return { ...state, character: { ...c, ...bodyFor(c.age, c) } };
}

/** Categoria natural: a menor cujo limite comporta ~92% do peso de caminhada. */
export function naturalDivision(sex: Sex, weightKg: number, divisions: readonly DivisionDef[]): DivisionDef {
  const mine = divisions.filter((d) => d.sex === sex).sort((a, b) => a.limitKg - b.limitKg);
  if (mine.length === 0) throw new Error(`Sem categorias para o sexo ${sex}`);
  return mine.find((d) => d.limitKg >= weightKg * 0.92) ?? (mine[mine.length - 1] as DivisionDef);
}
