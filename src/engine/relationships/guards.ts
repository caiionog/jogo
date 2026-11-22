/**
 * Guardas de idade para romance e conteúdo adulto. ÚNICA fonte da verdade:
 * toda ação, evento ou efeito sexual DEVE passar por `canHaveSexualContent`.
 */
import type { GameState } from '../core/state';

export const MIN_DATING_AGE = 14;
export const ADULT_AGE = 18;
export const TEEN_MAX_AGE_GAP = 2;

/** Pode namorar (romance não sexual a partir dos 14). */
export function canDate(age: number): boolean {
  return age >= MIN_DATING_AGE;
}

/**
 * Faixa de idade permitida para um parceiro:
 * - personagem 14–17 → parceiro 14–17 e no máximo 2 anos de diferença (nunca adultos);
 * - personagem 18+ → parceiro 18+.
 */
export function isValidPartnerAge(charAge: number, partnerAge: number): boolean {
  if (!canDate(charAge) || !canDate(partnerAge)) return false;
  const charAdult = charAge >= ADULT_AGE;
  const partnerAdult = partnerAge >= ADULT_AGE;
  if (charAdult !== partnerAdult) return false;
  if (!charAdult) return Math.abs(charAge - partnerAge) <= TEEN_MAX_AGE_GAP;
  return true;
}

/** Noivado e casamento: os dois com 18+. */
export function canMarry(charAge: number, partnerAge: number): boolean {
  return charAge >= ADULT_AGE && partnerAge >= ADULT_AGE;
}

/** Conteúdo sexual: SOMENTE quando as duas pessoas têm 18 anos ou mais (e estão vivas). */
export function canHaveSexualContent(
  character: { age: number; alive?: boolean },
  partner: { age: number; alive?: boolean },
): boolean {
  if (character.alive === false || partner.alive === false) return false;
  return character.age >= ADULT_AGE && partner.age >= ADULT_AGE;
}

/** Conteúdo adulto liberado: opção ligada, personagem 18+ e (se houver) parceiro 18+. */
export function adultContentAllowed(state: GameState, partner?: { age: number; alive?: boolean }): boolean {
  if (!state.relationships.settings.adultContent) return false;
  if (state.character.age < ADULT_AGE || !state.alive) return false;
  return partner ? canHaveSexualContent(state.character, partner) : true;
}
