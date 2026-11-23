/** Ficha criminal (release 0.0.2). A ficha de adulto é permanente; a de 12–17 anos não conta depois dos 18. */
import type { GameState } from '../core/state';

/** Tem condenação na ficha (bloqueia concurso e empregos que exigem ficha limpa). */
export function hasConviction(state: GameState): boolean {
  return state.crime.record.some((r) => r.kind === 'condenacao');
}

/** Tem qualquer registro de adulto (passagem ou condenação). */
export function hasRecord(state: GameState): boolean {
  return state.crime.record.length > 0;
}

/** Ligado a uma facção (atual ou flag de envolvimento). */
export function factionLinked(state: GameState): boolean {
  return !!state.crime.faction || !!state.flags.ex_faccao;
}
