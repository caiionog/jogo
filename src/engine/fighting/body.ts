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

/** Alimentação (release 0.0.4): mexe no IMC a partir dos 12 anos e na saúde do ano (`eatingYear`). */
export type Eating = 'normal' | 'saudavel' | 'besteira' | 'restrita';
export const EATING_BMI: Record<Eating, number> = { normal: 0, saudavel: -0.7, besteira: 1.8, restrita: -1.6 };

/** IMC por idade, Capacidade atlética, biotipo e alimentação (sedentário engorda; atleta fica mais seco). */
export function bmiAt(age: number, stats: Pick<Stats, 'athletic'>, build: number, eating: Eating = 'normal'): number {
  let bmi: number;
  if (age <= 12) bmi = 16 + age * 0.1;
  else if (age < 18) bmi = 17.2 + (age - 12) * 0.75;
  else {
    bmi = 22.4 + (stats.athletic < 40 ? (40 - stats.athletic) / 11 : -(stats.athletic - 40) / 70);
    if (age > 30) bmi += (age - 30) * 0.08;
  }
  return Math.min(34, Math.max(14, bmi + build * 0.8 + (age >= 12 ? EATING_BMI[eating] : 0)));
}

export function bodyFor(age: number, c: Pick<Character, 'adultHeightCm' | 'build' | 'stats'> & { eating?: Eating }): { heightCm: number; weightKg: number } {
  const heightCm = heightAt(age, c.adultHeightCm);
  const weightKg = Math.round(bmiAt(age, c.stats, c.build, c.eating) * (heightCm / 100) ** 2 * 10) / 10;
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

export type EatingBlockReason = 'busy' | 'too-young';

/** A partir dos 12 anos o personagem escolhe a alimentação (antes, come o que a família põe na mesa). */
export function eatingBlockReason(state: GameState): EatingBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < 12) return 'too-young';
  return null;
}

export function setEating(state: GameState, eating: Eating): GameState {
  if (eatingBlockReason(state) !== null || (state.character.eating ?? 'normal') === eating) return state;
  return updateBody({ ...state, character: { ...state.character, eating } });
}

/** Efeito anual da alimentação: saudável +1 saúde; besteira −1 saúde e +1 felicidade; restrita −1 felicidade (e −2 saúde se a saúde já estiver baixa). */
export function eatingYear(state: GameState): GameState {
  const e = state.character.eating ?? 'normal';
  if (e === 'normal' || state.character.age < 12) return state;
  const st = state.character.stats;
  const d = e === 'saudavel' ? { health: 1 } : e === 'besteira' ? { health: -1, happiness: 1 } : { happiness: -1, ...(st.health < 50 ? { health: -2 } : {}) };
  const stats = { ...st };
  for (const [k, v] of Object.entries(d)) stats[k as keyof Stats] = Math.max(0, Math.min(100, stats[k as keyof Stats] + v));
  return { ...state, character: { ...state.character, stats } };
}
