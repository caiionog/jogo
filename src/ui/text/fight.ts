/** Textos de luta para a UI (release 0.0.1): modalidades das academias e graduações. */
import { GAME_CONTENT as C } from '../../content';
import type { GameState, GymDef, ModalityId } from '../../engine';
import { gradeText } from '../../engine';

export function modalityLabel(id: ModalityId): string {
  return C.fighting.modalities.find((m) => m.id === id)?.label ?? id;
}

/** "jiu-jitsu, muay thai" (minúsculas, na ordem da academia). */
export function gymModalitiesText(g: GymDef): string {
  return g.modalities.map((m) => modalityLabel(m).toLowerCase()).join(', ');
}

/** "faixa azul (2 graus) de jiu-jitsu" ou null se não pratica a modalidade. */
export function gradeLine(game: GameState, id: ModalityId): string | null {
  const t = gradeText(C, game.fighter.grades[id]);
  return t ? `${t} de ${modalityLabel(id).toLowerCase()}` : null;
}

/** Resumo curto das graduações ("faixa azul de jiu-jitsu · prajied vermelho de muay thai") ou "sem graduação". */
export function gradesSummary(game: GameState): string {
  const parts = (Object.keys(game.fighter.grades) as ModalityId[]).map((id) => gradeLine(game, id)).filter(Boolean);
  return parts.length ? parts.join(' · ') : 'sem graduação';
}
