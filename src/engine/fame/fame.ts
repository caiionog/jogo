/**
 * Fama (release 0.0.4): `character.fame` (0–100) é o atributo único de fama da pessoa, dentro e fora do esporte.
 * `fighter.reputation` continua sendo só o prestígio dentro do esporte (ranking, organizações, ofertas). Quem lê
 * "o quanto o público conhece você" (patrocínios, romance, empregos, empresário, escândalos) lê `fame`.
 * O esporte alimenta a fama: todo ano a fama sobe em direção à reputação de quem ainda luta, e cai devagar
 * (esquecimento) quando nada a sustenta.
 */
import type { GameState } from '../core/state';

export const FAME_MAX = 100;
/** Parte da reputação esportiva que vira fama (um campeão regional não é tão famoso quanto um astro da TV). */
export const SPORT_FAME_SHARE = 0.8;

export function fameOf(state: GameState): number {
  return state.character.fame ?? 0;
}

/** Soma (ou tira) fama, limitada a 0–100 e inteira. */
export function addFame(state: GameState, delta: number): GameState {
  if (!delta) return state;
  const fame = Math.max(0, Math.min(FAME_MAX, Math.round(fameOf(state) + delta)));
  return { ...state, character: { ...state.character, fame } };
}

/** Fama que o esporte sustenta: reputação × 0,8 enquanto a pessoa luta; metade disso depois de aposentada. */
export function sportFame(state: GameState): number {
  const rep = state.fighter.reputation;
  return Math.round(rep * SPORT_FAME_SHARE * (state.fighter.retired ? 0.5 : 1));
}

/**
 * Virada do ano: abaixo do que o esporte sustenta, a fama sobe metade da distância; acima, cai 4% ao ano
 * (no mínimo 1 ponto), sem passar do piso esportivo. Sem RNG.
 */
export function fameYear(state: GameState): GameState {
  const fame = fameOf(state);
  const floor = sportFame(state);
  if (fame < floor) return addFame(state, Math.ceil((floor - fame) / 2));
  if (fame > floor) return addFame(state, -Math.min(fame - floor, Math.max(1, Math.round(fame * 0.04))));
  return state;
}

/**
 * Fama na escala da reputação esportiva (fama ÷ 0,8, até 100), para os limites que já existiam em reputação
 * (patrocinadores, vagas com `minReputation`, romance): quem só tem a fama do esporte fica no mesmo lugar, e quem é
 * famoso por outro caminho também conta.
 */
export function fameAsRep(state: GameState): number {
  return Math.min(FAME_MAX, Math.round(fameOf(state) / SPORT_FAME_SHARE));
}
