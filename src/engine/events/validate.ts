import type { GameContent } from '../core/content';
import { STAT_KEYS } from '../core/state';
import { STAGE_ORDER } from '../lifeStages/school';
import type { Effects } from '../core/effects';
import type { GameEvent } from './types';
import { FIGHT_TEXT_KEYS } from '../fighting/types';

/**
 * Valida o conteúdo contra o schema (além do que o TypeScript garante).
 * Retorna a lista de erros; vazia = conteúdo válido.
 */
export function validateContent(content: GameContent): string[] {
  const errors: string[] = [];
  const eventIds = new Set<string>();
  const clubIds = new Set(content.clubs.map((c) => c.id));
  const allEventIds = new Set(content.events.map((e) => e.id));
  const fc = content.fighting;
  const orgIds = new Set(fc.orgs.map((o) => o.id));
  const gymIds = new Set(fc.gyms.map((g) => g.id));
  const traitIds = new Set(content.relationships.traits.map((t) => t.id));

  const checkEffects = (where: string, fx: Effects | undefined) => {
    if (!fx) return;
    for (const k of Object.keys(fx.stats ?? {})) {
      if (!(STAT_KEYS as readonly string[]).includes(k)) errors.push(`${where}: atributo desconhecido "${k}"`);
    }
    if (fx.school?.joinClub && !clubIds.has(fx.school.joinClub)) {
      errors.push(`${where}: clube inexistente "${fx.school.joinClub}"`);
    }
    const ff = fx.fighter;
    if (ff?.joinGym && !['local', 'best'].includes(ff.joinGym) && !gymIds.has(ff.joinGym)) errors.push(`${where}: academia inexistente "${ff.joinGym}"`);
    if (ff?.signWith && !orgIds.has(ff.signWith)) errors.push(`${where}: organização inexistente "${ff.signWith}"`);
    for (const k of Object.keys(ff?.skills ?? {})) {
      if (!['striking', 'wrestling', 'grappling', 'defense', 'cardio', 'chin'].includes(k)) errors.push(`${where}: habilidade desconhecida "${k}"`);
    }
    const so = fx.social;
    if (so?.pregnancyChance !== undefined && !(so.pregnancyChance > 0 && so.pregnancyChance <= 1)) errors.push(`${where}: pregnancyChance fora de (0,1]`);
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
    // relacionamentos
    const relTypes = ['pai', 'mae', 'irmao', 'amigo', 'parceiro', 'conjuge', 'ex', 'filho', 'treinador', 'rival', 'colega_treino'];
    for (const t of [...(c.relationship?.types ?? []), ...(c.hasRelation ?? []), ...(c.noRelation ?? [])]) if (!relTypes.includes(t)) errors.push(`${e.id}: tipo de relação inválido "${t}"`);
    for (const t of c.relationship?.traits ?? []) if (!traitIds.has(t)) errors.push(`${e.id}: traço inexistente "${t}"`);
    if (e.tags?.includes('adult')) {
      // regra obrigatória: eventos adultos só para 18+ (o motor também filtra por canHaveSexualContent)
      if ((c.minAge ?? 0) < 18) errors.push(`${e.id}: evento 'adult' precisa de minAge >= 18`);
      if (c.relationship && (c.relationship.personAge?.min ?? 0) < 18) errors.push(`${e.id}: evento 'adult' com pessoa-alvo precisa de personAge.min >= 18`);
    }
    if (!e.tags?.includes('adult') && c.maxAge !== undefined && c.maxAge < 18 && c.relationship?.types.some((t) => t === 'parceiro') && (c.relationship.personAge?.max ?? 99) > 17) {
      errors.push(`${e.id}: romance adolescente precisa limitar personAge a 14–17`);
    }
    if (c.fighting?.orgEligible && !orgIds.has(c.fighting.orgEligible)) errors.push(`${e.id}: organização inexistente "${c.fighting.orgEligible}"`);
    for (const o of c.fighting?.orgs ?? []) if (!orgIds.has(o)) errors.push(`${e.id}: organização inexistente "${o}"`);
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
  // --- luta ---
  const seenOrgs = new Set<string>();
  const divisionIds = new Set(fc.divisions.map((d) => d.id));
  if (divisionIds.size !== fc.divisions.length) errors.push('ids de categoria duplicados');
  for (const o of fc.orgs) {
    if (seenOrgs.has(o.id)) errors.push(`id de organização duplicado: ${o.id}`);
    seenOrgs.add(o.id);
    if (o.rounds < 1 || o.titleRounds < o.rounds) errors.push(`organização ${o.id}: rounds inválidos`);
    if (o.npcSkill[0] > o.npcSkill[1]) errors.push(`organização ${o.id}: npcSkill invertido`);
    if (o.maxAge !== undefined && o.maxAge < o.minAge) errors.push(`organização ${o.id}: maxAge < minAge`);
    if (o.rankingSize > 0 && !o.contract) errors.push(`organização ${o.id}: ranking exige contrato`);
  }
  const seenGyms = new Set<string>();
  for (const g of fc.gyms) {
    if (seenGyms.has(g.id)) errors.push(`id de academia duplicado: ${g.id}`);
    seenGyms.add(g.id);
    if (g.coach < 0 || g.coach > 100) errors.push(`academia ${g.id}: coach fora de 0–100`);
    if (g.city && !content.locations.some((l) => l.cities.includes(g.city as string))) errors.push(`academia ${g.id}: cidade inexistente "${g.city}"`);
  }
  for (const k of FIGHT_TEXT_KEYS) if (!fc.text[k]?.length) errors.push(`fightText: sem textos para "${k}"`);
  for (const w of ['standing', 'clinch', 'ground'] as const) if (!fc.text.strikes[w].length) errors.push(`fightText: sem golpes "${w}"`);
  if (!fc.text.submissions.length) errors.push('fightText: sem finalizações');
  if (fc.hooks.weightMissEventId && !allEventIds.has(fc.hooks.weightMissEventId)) errors.push(`hook: evento inexistente "${fc.hooks.weightMissEventId}"`);
  if (!fc.nicknames.length || !fc.injuries.length) errors.push('apelidos/lesões vazios');
  // relacionamentos
  if (traitIds.size !== content.relationships.traits.length) errors.push('ids de traço duplicados');
  for (const t of content.relationships.traits) for (const x of [...(t.likes ?? []), ...(t.dislikes ?? [])]) if (!traitIds.has(x)) errors.push(`traço ${t.id}: referência inexistente "${x}"`);
  for (const h of Object.values(content.relationships.hooks)) if (h && !allEventIds.has(h)) errors.push(`hook: evento inexistente "${h}"`);
  // efeitos com chance de gravidez/IST só em eventos 18+
  for (const e of content.events) {
    const fxs = e.choices.flatMap((ch) => [ch.effects, ch.risk?.effects]);
    if (fxs.some((fx) => fx?.social?.pregnancyChance || fx?.social?.ist) && (e.conditions.minAge ?? 0) < 18) errors.push(`${e.id}: gravidez/IST exige minAge >= 18`);
  }
  return errors;
}
