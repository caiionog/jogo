/**
 * Queixo oculto (Etapa 8): não é treinável. Vem de uma base inata (`fighter.chinBase`), cai depois dos 32 anos e com
 * o dano cerebral (Etapa 6), com um piso dado pela saúde.
 */
import { seedToState, createRng } from '../core/rng';
import type { GameState } from '../core/state';
import { skillRating } from './profile';
import type { Npc } from './types';

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export function chinValue(base: number, age: number, brainDamage: number, health: number): number {
  const ageF = age <= 32 ? 1 : Math.max(0.55, 1 - (age - 32) * 0.025);
  const floor = 5 + health * 0.1;
  return Math.round(clamp(base * ageF - brainDamage * 0.25, floor, 100) * 10) / 10;
}

export function chinOf(state: GameState): number {
  return chinValue(state.fighter.chinBase, state.character.age, state.health?.brainDamage ?? 0, state.character.stats.health);
}

export function npcChin(n: Pick<Npc, 'chinBase'> & { age?: number }): number {
  return chinValue(n.chinBase, n.age ?? 28, 0, 85);
}

/** Nível geral do jogador (oculto). */
export function playerRating(state: GameState): number {
  return skillRating(state.fighter.skills, state.character.stats.athletic, chinOf(state));
}

export type CoachWord = 'Iniciante' | 'Promissor' | 'Sólido' | 'Elite';
/** Imprecisão máxima proposital da avaliação do treinador (pontos de nível). */
export const COACH_NOISE = 6;

export function coachWord(value: number): CoachWord {
  return value < 30 ? 'Iniciante' : value < 50 ? 'Promissor' : value < 72 ? 'Sólido' : 'Elite';
}

/**
 * Avaliação do treinador em palavras, com um erro determinístico de até ±COACH_NOISE que muda a cada ano
 * (o jogador nunca sabe o número exato).
 */
export function coachAssessment(state: GameState, skill?: 'grappling' | 'trocacao'): CoachWord {
  const rng = createRng(seedToState(`${state.seed}:coach:${state.year}:${skill ?? 'geral'}`));
  const noise = (rng.next() * 2 - 1) * COACH_NOISE;
  const base = skill ? state.fighter.skills[skill] : playerRating(state);
  return coachWord(base + noise);
}
