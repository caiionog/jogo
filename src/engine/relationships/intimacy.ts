/**
 * Cena íntima (release 0.0.3): transição de cenário depois de um momento a dois. Só cenário; nenhum detalhe.
 * Grava `state.scene = { kind: 'intimo' }` SOMENTE quando `canHaveSexualContentWith` (→ `adultContentAllowed` →
 * `canHaveSexualContent`: os dois com 18+ e a opção "Conteúdo adulto" ligada) permite.
 */
import type { GameState, IntimacyVariant } from '../core/state';
import { netWorth } from '../economy/worth';
import { canHaveSexualContentWith } from './guards';
import { civilStatus } from './people';
import type { Person } from './types';

/** Patrimônio a partir do qual a cena vai para um hotel. */
export const INTIMACY_HOTEL_NET_WORTH = 1_000_000;

/**
 * Cenário da cena íntima (determinístico): casado(a) com casa própria → 'casal'; padrão de vida luxo ou patrimônio
 * alto → 'hotel'; mora de aluguel ou com os pais → 'simples'; senão 'casa'.
 */
export function intimacyVariant(state: GameState): IntimacyVariant {
  const housing = state.economy.housing;
  if (civilStatus(state) === 'casado' && housing === 'propria') return 'casal';
  if (state.economy.standard === 'luxo' || netWorth(state) >= INTIMACY_HOTEL_NET_WORTH) return 'hotel';
  if (housing === 'aluguel' || housing === 'pais') return 'simples';
  return 'casa';
}

/** Grava a cena `intimo` com a pessoa, se as guardas permitirem; senão devolve o estado igual. */
export function recordIntimacy(state: GameState, person: Person | undefined): GameState {
  if (!person || !canHaveSexualContentWith(state, person)) return state;
  const prev = state.scene?.kind === 'intimo' ? state.scene.seq : 0;
  return { ...state, scene: { kind: 'intimo', year: state.year, variant: intimacyVariant(state), seq: prev + 1 } };
}
