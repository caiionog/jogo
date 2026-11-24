/**
 * Colegas de farda (release 0.0.4): pessoas comuns (`Person`) com a flag `colega_farda` (e `policial`). Entram na turma
 * da academia e ao longo da carreira (até 3 ao mesmo tempo) e são o alvo dos eventos de colegas (`pol_colega_*`,
 * condição `relationship.personFlag: 'colega_farda'`). Quem sai da polícia continua com as amizades que fez.
 */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addRelation, createPerson, relationsOf, updateRelation, withHistory } from '../relationships/people';

export const MAX_COLLEAGUES = 3;

export function policeColleagues(state: GameState) {
  return relationsOf(state).filter((x) => x.person.flags.colega_farda);
}

function addColleague(state: GameState, rng: Rng, content: GameContent): GameState {
  const age = Math.max(18, state.character.age + rng.int(-3, 6));
  const [s, p] = createPerson(state, rng, content, { age, flags: { colega_farda: true, policial: true } });
  const where = state.police.career?.stage === 'formacao' ? 'na turma da academia' : 'no batalhão';
  return updateRelation(addRelation(s, p.id, 'conhecido', rng.int(40, 55)), p.id, (r) => withHistory(r, `Colega de farda ${where}.`));
}

/** Virada do ano: quem está na polícia ganha colegas até chegar a 3 (um por ano, 60% de chance). */
export function policeColleaguesYear(state: GameState, rng: Rng, content: GameContent): GameState {
  if (!state.police.career) return state;
  if (policeColleagues(state).length >= MAX_COLLEAGUES || !rng.chance(0.6)) return state;
  return addColleague(state, rng, content);
}
