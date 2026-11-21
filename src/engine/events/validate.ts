import type { GameContent } from '../core/content';
import { STAT_KEYS } from '../core/state';
import { STAGE_ORDER } from '../lifeStages/school';
import type { Effects } from '../core/effects';
import type { GameEvent } from './types';

/**
 * Valida o conteúdo contra o schema (além do que o TypeScript garante).
 * Retorna a lista de erros; vazia = conteúdo válido.
 */
export function validateContent(content: GameContent): string[] {
  const errors: string[] = [];
  const eventIds = new Set<string>();
  const clubIds = new Set(content.clubs.map((c) => c.id));
  const allEventIds = new Set(content.events.map((e) => e.id));

  const checkEffects = (where: string, fx: Effects | undefined) => {
    if (!fx) return;
    for (const k of Object.keys(fx.stats ?? {})) {
      if (!(STAT_KEYS as readonly string[]).includes(k)) errors.push(`${where}: atributo desconhecido "${k}"`);
    }
    if (fx.school?.joinClub && !clubIds.has(fx.school.joinClub)) {
      errors.push(`${where}: clube inexistente "${fx.school.joinClub}"`);
    }
    for (const f of fx.followUps ?? []) {
      if (!allEventIds.has(f.eventId)) errors.push(`${where}: followUp para evento inexistente "${f.eventId}"`);
      if (!Number.isInteger(f.delayYears) || f.delayYears < 0) errors.push(`${where}: delayYears inválido`);
    }
  };

  const checkEvent = (e: GameEvent) => {
    if (!e.id) errors.push('evento sem id');
    if (eventIds.has(e.id)) errors.push(`id de evento duplicado: ${e.id}`);
    eventIds.add(e.id);
    const trigger = e.trigger ?? 'random';
    if (trigger === 'random' && !(e.weight > 0)) errors.push(`${e.id}: evento aleatório precisa de peso > 0`);
    if (!e.text.trim()) errors.push(`${e.id}: texto vazio`);
    if (e.choices.length === 0) errors.push(`${e.id}: sem escolhas`);
    const c = e.conditions;
    if (c.minAge !== undefined && c.maxAge !== undefined && c.minAge > c.maxAge) errors.push(`${e.id}: minAge > maxAge`);
    for (const s of c.schoolStages ?? []) if (!STAGE_ORDER.includes(s)) errors.push(`${e.id}: fase escolar inválida "${s}"`);
    if (Array.isArray(c.club)) for (const id of c.club) if (!clubIds.has(id)) errors.push(`${e.id}: clube inexistente "${id}"`);
    const choiceIds = new Set<string>();
    for (const ch of e.choices) {
      if (choiceIds.has(ch.id)) errors.push(`${e.id}: escolha duplicada ${ch.id}`);
      choiceIds.add(ch.id);
      if (!ch.label.trim() || !ch.resultText.trim()) errors.push(`${e.id}/${ch.id}: label ou resultado vazio`);
      checkEffects(`${e.id}/${ch.id}`, ch.effects);
      if (ch.risk) {
        if (!(ch.risk.chance > 0 && ch.risk.chance < 1)) errors.push(`${e.id}/${ch.id}: risk.chance fora de (0,1)`);
        checkEffects(`${e.id}/${ch.id}/risk`, ch.risk.effects);
      }
    }
  };

  content.events.forEach(checkEvent);

  const actionIds = new Set<string>();
  for (const a of content.actions) {
    if (actionIds.has(a.id)) errors.push(`id de ação duplicado: ${a.id}`);
    actionIds.add(a.id);
    if (!(a.energyCost > 0)) errors.push(`ação ${a.id}: custo de energia deve ser > 0`);
    if (a.logTexts.length === 0) errors.push(`ação ${a.id}: sem textos de log`);
    checkEffects(`ação ${a.id}`, a.effects);
    if (a.risk) {
      if (!(a.risk.chance > 0 && a.risk.chance < 1)) errors.push(`ação ${a.id}: risk.chance fora de (0,1)`);
      checkEffects(`ação ${a.id}/risk`, a.risk.effects);
    }
  }

  const seenClubs = new Set<string>();
  for (const club of content.clubs) {
    if (seenClubs.has(club.id)) errors.push(`id de clube duplicado: ${club.id}`);
    seenClubs.add(club.id);
    checkEffects(`clube ${club.id}`, club.joinEffects);
    checkEffects(`clube ${club.id}`, club.yearlyEffects);
  }
  return errors;
}
