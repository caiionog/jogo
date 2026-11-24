import { divisionOf } from '../football/football';
import { crimeConditionsMet } from '../crime/plan';
import { policeConditionsMet } from '../police/events';
import { luckWeightMult, talentMod } from '../character/talents';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { STAT_KEYS } from '../core/state';
import { stageOfGrade } from '../lifeStages/school';
import type { EventConditions, FightingConditions, GameEvent, HealthConditions, LegacyConditions, RelationshipCondition, SchoolResultTag, StatRange } from './types';
import type { EventVars } from '../core/state';
import { adultContentAllowed, canHaveSexualContent } from '../relationships/guards';
import { childrenOf, civilStatus, currentPartner, relationsOf } from '../relationships/people';
import type { Person, Relation } from '../relationships/types';
import type { EconomyConditions } from './types';
import { netWorth } from '../economy/worth';
import { marketYear } from '../economy/market';
import { jobDef } from '../economy/jobs';
import type { GameContent } from '../core/content';
import { bjjRank, gradeReady } from '../fighting/belts';
import { getOrg, isOrgEligible, currentRosterKey } from '../fighting/orgs';
import { PLAYER_ID } from '../fighting/profile';
import { rankOf } from '../fighting/ranking';

const inRange = (v: number, r: StatRange | undefined) =>
  !r || ((r.min === undefined || v >= r.min) && (r.max === undefined || v <= r.max));

function schoolConditionsMet(state: GameState, c: EventConditions): boolean {
  const cur = state.education.current;
  const needsEnrollment = c.enrolled === true || c.schoolStages || c.school || c.schoolType || c.club;
  if (c.enrolled === false && cur) return false;
  if (!needsEnrollment) return true;
  if (!cur) return false;
  if (c.schoolStages && !c.schoolStages.includes(stageOfGrade(cur.grade))) return false;
  if (c.schoolType && cur.school.type !== c.schoolType) return false;
  if (c.school) {
    if (!inRange(cur.average, c.school.average)) return false;
    if (!inRange(cur.discipline, c.school.discipline)) return false;
    if (!inRange(cur.popularity, c.school.popularity)) return false;
  }
  if (c.club === 'any' && !cur.club) return false;
  if (c.club === 'none' && cur.club) return false;
  if (Array.isArray(c.club) && (!cur.club || !c.club.includes(cur.club))) return false;
  return true;
}

function schoolResultTags(state: GameState): SchoolResultTag[] {
  const r = state.education.lastResult;
  if (!r) return [];
  const tags: SchoolResultTag[] = [r.passed ? 'passed' : 'failed'];
  if (r.honors) tags.push('honors');
  if (r.graduated) tags.push('graduated');
  if (r.expelled) tags.push('expelled');
  return tags;
}

function fightingConditionsMet(state: GameState, c: FightingConditions, content?: GameContent): boolean {
  const f = state.fighter;
  if (c.contracted !== undefined && (f.orgId !== null) !== c.contracted) return false;
  if (c.orgs && (!f.orgId || !c.orgs.includes(f.orgId))) return false;
  if (c.hasGym !== undefined && (f.gymId !== null) !== c.hasGym) return false;
  if (c.injured !== undefined && (state.health.injuries.length > 0) !== c.injured) return false;
  if (c.suspended !== undefined && (f.suspendedYears > 0) !== c.suspended) return false;
  if (c.retired !== undefined && !!f.retired !== c.retired) return false;
  if (c.retiredYears && (!f.retired || !inRange(state.character.age - f.retired.age, c.retiredYears))) return false;
  if (c.lossStreak && !inRange(state.feats.curLosses ?? 0, c.lossStreak)) return false;
  if (!inRange(bjjRank(state), c.belt)) return false;
  if (!inRange(f.amateur.wins, c.amateurWins)) return false;
  if (!inRange(f.pro.wins, c.proWins)) return false;
  if (!inRange(f.reputation, c.reputation)) return false;
  if (c.champion !== undefined && (f.titles.length > 0) !== c.champion) return false;
  if (c.beltPromotionReady !== undefined && (!!content && gradeReady(state, 'jiujitsu', content)) !== c.beltPromotionReady) return false;
  if (c.gradeReady && !(content && gradeReady(state, c.gradeReady, content))) return false;
  if (c.hasFought !== undefined && (f.history.length > 0) !== c.hasFought) return false;
  // condições que dependem do conteúdo (organizações)
  if (c.tiers || c.orgEligible || c.ranked !== undefined || c.rankMax !== undefined) {
    if (!content) return false;
    if (c.tiers) {
      const tier = getOrg(content, f.orgId)?.tier ?? 'none';
      if (!c.tiers.includes(tier)) return false;
    }
    if (c.orgEligible) {
      const org = getOrg(content, c.orgEligible);
      if (!org || !isOrgEligible(state, org, content)) return false;
    }
    if (c.ranked !== undefined || c.rankMax !== undefined) {
      const key = currentRosterKey(state, content);
      const roster = key ? state.world.rosters[key] : undefined;
      const rank = roster ? rankOf(roster, PLAYER_ID) : null;
      if (c.ranked !== undefined && (rank !== null) !== c.ranked) return false;
      if (c.rankMax !== undefined && (rank === null || rank > c.rankMax)) return false;
    }
  }
  return true;
}

/** Pessoas que satisfazem a condição de relacionamento do evento (alvos possíveis). */
export function matchingTargets(state: GameState, event: GameEvent): { person: Person; rel: Relation }[] {
  const c: RelationshipCondition | undefined = event.conditions.relationship;
  if (!c) return [];
  const adult = event.tags?.includes('adult');
  return relationsOf(state, c.types).filter(({ person, rel }) => {
    if (!inRange(rel.affection, c.affection)) return false;
    if (!inRange(person.age, c.personAge)) return false;
    if (c.traits && !c.traits.some((t) => person.traits.includes(t))) return false;
    if (c.stages && (!rel.romance || !c.stages.includes(rel.romance.stage))) return false;
    if (c.sameGym !== undefined && (!!state.fighter.gymId && person.flags.academia === state.fighter.gymId) !== c.sameGym) return false;
    if (c.personFlag && !person.flags[c.personFlag]) return false;
    if (c.personFlagNone && person.flags[c.personFlagNone]) return false;
    // evento adulto: a pessoa-alvo também precisa ter 18+
    if (adult && !canHaveSexualContent(state.character, person)) return false;
    return true;
  });
}

function relationshipConditionsMet(state: GameState, event: GameEvent, vars?: EventVars): boolean {
  const c = event.conditions;
  if (c.hasRelation && relationsOf(state, c.hasRelation).length === 0) return false;
  if (c.noRelation && relationsOf(state, c.noRelation).length > 0) return false;
  if (c.civilStatus && !c.civilStatus.includes(civilStatus(state))) return false;
  if (c.children && !inRange(childrenOf(state).length, c.children)) return false;
  if (c.partnerAge) {
    const p = currentPartner(state);
    if (!p || !inRange(p.person.age, c.partnerAge)) return false;
  }
  if (c.relationship) {
    const targets = matchingTargets(state, event);
    if (vars?.pessoa_id) return targets.some((t) => t.person.id === vars.pessoa_id);
    if (targets.length === 0) return false;
  }
  return true;
}

/**
 * Regra de conteúdo adulto: eventos com a tag 'adult' só passam com a opção ligada, personagem 18+
 * e, havendo parceiro(a) atual, parceiro(a) 18+ (canHaveSexualContent).
 */
export function adultTagAllowed(state: GameState, event: GameEvent): boolean {
  if (!event.tags?.includes('adult')) return true;
  if (!adultContentAllowed(state)) return false;
  const p = currentPartner(state);
  return !p || canHaveSexualContent(state.character, p.person);
}

function economyConditionsMet(state: GameState, c: EconomyConditions, content?: GameContent): boolean {
  const e = state.economy;
  if (!inRange(state.money, c.money)) return false;
  if (c.netWorth && !inRange(netWorth(state), c.netWorth)) return false;
  if (!inRange(e.debt, c.debt)) return false;
  if (c.employed !== undefined && (e.job !== null) !== c.employed) return false;
  if (c.jobs && (!e.job || !c.jobs.includes(e.job.jobId))) return false;
  if (c.jobCategory) {
    const def = content ? jobDef(content, e.job?.jobId) : undefined;
    if (!def || !c.jobCategory.includes(def.category)) return false;
  }
  if (c.hasAsset && !e.assets.some((a) => c.hasAsset!.includes(a.kind))) return false;
  if (c.ownsBusiness !== undefined && (e.businesses.length > 0) !== c.ownsBusiness) return false;
  if (c.businessDefs && !e.businesses.some((b) => c.businessDefs!.includes(b.defId))) return false;
  if (c.econYear && !c.econYear.includes(marketYear(state.seed, state.year).kind)) return false;
  if (c.hasSponsor !== undefined && (e.sponsors.length > 0) !== c.hasSponsor) return false;
  if (c.hasAgent !== undefined && (e.agent !== null) !== c.hasAgent) return false;
  if (c.hasLoan !== undefined && (e.loans.length > 0) !== c.hasLoan) return false;
  if (c.housing && !c.housing.includes(e.housing)) return false;
  if (c.evadedTax !== undefined && (e.evadedTax > 0) !== c.evadedTax) return false;
  if (c.invested !== undefined && (e.investments > 0) !== c.invested) return false;
  if (c.rentingOut !== undefined && e.assets.some((a) => a.rented) !== c.rentingOut) return false;
  return true;
}

/** Verifica apenas as condições do evento (idade, atributos, flags, escola, luta, relações, economia, `once`). */
export function conditionsMet(state: GameState, event: GameEvent, content?: GameContent, vars?: EventVars): boolean {
  if (!adultTagAllowed(state, event)) return false;
  const c = event.conditions;
  const { age, sex, stats } = state.character;
  if (event.once && state.firedEvents.includes(event.id)) return false;
  if (c.minAge !== undefined && age < c.minAge) return false;
  if (c.maxAge !== undefined && age > c.maxAge) return false;
  if (c.sportsClub !== undefined) {
    const m = state.sportsClub;
    if (c.sportsClub === false ? !!m : !m || (c.sportsClub.sports && !c.sportsClub.sports.includes(m.sport))) return false;
  }
  if (c.exchange !== undefined) {
    const ex = state.exchange && state.exchange.year === state.year ? state.exchange : null;
    if (c.exchange === false ? !!ex : !ex || (c.exchange.programs && !c.exchange.programs.includes(ex.programId))) return false;
  }
  if (c.college) {
    const cur = state.college?.current;
    if (c.college.enrolled !== undefined && (cur?.status === 'cursando') !== c.college.enrolled) return false;
    if (c.college.courses && !(cur && c.college.courses.includes(cur.courseId))) return false;
    if (c.college.diploma && !c.college.diploma.some((d) => state.college?.diplomas.includes(d))) return false;
  }
  if (c.fame && !inRange(state.character.fame ?? 0, c.fame)) return false;
  if (c.football) {
    const f = state.football;
    if (!f) return false;
    const fc = c.football;
    if (fc.stage && !fc.stage.includes(f.stage)) return false;
    if (fc.position && !fc.position.includes(f.position)) return false;
    if (fc.contracted !== undefined && !!f.contract !== fc.contracted) return false;
    if (fc.hasOffer !== undefined && f.offers.length > 0 !== fc.hasOffer) return false;
    if (fc.minRating !== undefined && (f.history.at(-1)?.rating ?? 0) < fc.minRating) return false;
    if (fc.division) {
      const div = content ? divisionOf(state, content, f.clubId) : 'D';
      if (!fc.division.includes(div)) return false;
    }
  }
  if (c.love) {
    const rom = state.relationships.relations.filter((r) => r.romance);
    if (c.love.affair !== undefined && rom.some((r) => r.romance?.secret) !== c.love.affair) return false;
    if (c.love.openRelationship !== undefined && rom.some((r) => r.romance?.open) !== c.love.openRelationship) return false;
    if (c.love.casualPregnancy !== undefined && !!state.relationships.pregnancy?.casual !== c.love.casualPregnancy) return false;
    if (c.love.usedApp !== undefined && (Number(state.flags.usou_app ?? -99) >= state.year - 1) !== c.love.usedApp) return false;
  }
  if (c.talent) {
    const t = state.character.talents?.find((x) => x.id === c.talent!.id);
    if (!t || (c.talent.revealed !== undefined && t.revealed !== c.talent.revealed)) return false;
  }
  if (c.sex !== undefined && sex !== c.sex) return false;
  if (c.stats) {
    for (const key of STAT_KEYS) {
      if (!inRange(stats[key], c.stats[key])) return false;
    }
  }
  if (c.flagsAll?.some((f) => !state.flags[f])) return false;
  if (c.flagsNone?.some((f) => state.flags[f])) return false;
  if (!schoolConditionsMet(state, c)) return false;
  if (c.schoolResult) {
    const tags = schoolResultTags(state);
    if (!c.schoolResult.some((t) => tags.includes(t))) return false;
  }
  if (c.fighting && !fightingConditionsMet(state, c.fighting, content)) return false;
  if (!relationshipConditionsMet(state, event, vars)) return false;
  if (c.economy && !economyConditionsMet(state, c.economy, content)) return false;
  if (c.health && !healthConditionsMet(state, c.health)) return false;
  if (c.legacy && !legacyConditionsMet(state, c.legacy)) return false;
  if (c.police && !policeConditionsMet(state, c.police)) return false;
  if (c.crime && !crimeConditionsMet(state, c.crime, content)) return false;
  return true;
}

function healthConditionsMet(state: GameState, c: HealthConditions): boolean {
  const h = state.health;
  if (c.injured !== undefined && (h.injuries.length > 0) !== c.injured) return false;
  if (c.sequela && !c.sequela.some((x) => h.sequelae.includes(x))) return false;
  if (!inRange(h.brainDamage, c.brainDamage)) return false;
  if (c.conditions === 'any' && !h.conditions.length) return false;
  if (Array.isArray(c.conditions) && !c.conditions.some((x) => h.conditions.some((y) => y.defId === x))) return false;
  if (!inRange(state.character.stats.health, c.healthStat)) return false;
  if (c.hasVehicle !== undefined && state.economy.assets.some((a) => a.kind === 'veiculo') !== c.hasVehicle) return false;
  return true;
}

function legacyConditionsMet(state: GameState, c: LegacyConditions): boolean {
  if (!inRange(state.dynasty.generation, c.generation)) return false;
  const parent = state.dynasty.members.at(-1);
  if (c.parentChampion !== undefined && (!!parent && parent.titles.length > 0) !== c.parentChampion) return false;
  if (c.inheritedGym !== undefined && !!state.flags.academia_herdada !== c.inheritedGym) return false;
  return true;
}

/** Elegível para o SORTEIO aleatório: trigger 'random', peso > 0 e condições atendidas. */
export function isEligible(state: GameState, event: GameEvent, content?: GameContent): boolean {
  if ((event.trigger ?? 'random') !== 'random') return false;
  if (event.weight <= 0) return false;
  // atrás das grades (fechado/semiaberto), só eventos da prisão são sorteados (release 0.0.2)
  if (state.prison && state.prison.regime !== 'aberto' && event.conditions.crime?.imprisoned !== true) return false;
  // intervalo de repetição (release 0.0.1): um evento sorteado não volta antes de `cooldownYears` anos
  const last = state.eventLastAge?.[event.id];
  const cooldown = event.cooldownYears ?? content?.limits.eventCooldown ?? 0;
  if (last !== undefined && state.character.age - last < cooldown) return false;
  return conditionsMet(state, event, content);
}

export function eligibleEvents(state: GameState, events: readonly GameEvent[], content?: GameContent): GameEvent[] {
  return events.filter((e) => isEligible(state, e, content));
}

/** Eventos 'auto' que devem entrar neste ano. */
export function autoEvents(state: GameState, events: readonly GameEvent[], content?: GameContent): GameEvent[] {
  return events.filter((e) => e.trigger === 'auto' && !autoOnCooldown(state, e) && conditionsMet(state, e, content));
}

/**
 * Release 0.0.4: um evento 'auto' com `cooldownYears` não volta antes desse intervalo (sem o campo, não há intervalo:
 * o evento precisa se limitar por `once`, `schoolResult` ou por uma flag que todas as escolhas resolvem).
 */
export function autoOnCooldown(state: GameState, event: GameEvent): boolean {
  if (!event.cooldownYears) return false;
  const last = state.eventLastAge?.[event.id];
  return last !== undefined && state.character.age - last < event.cooldownYears;
}

/**
 * Peso de um evento no sorteio do ano: o peso do conteúdo × sorte (eventos bons/ruins, com limite) × pavio curto
 * (eventos de briga). Sem conteúdo, o peso puro.
 */
export function eventWeight(state: GameState, e: GameEvent, content?: GameContent): number {
  if (!content) return e.weight;
  let w = e.weight * luckWeightMult(state, e.tone, content);
  if (e.tags?.includes('briga')) w *= talentMod(state, content, 'fightEventMult');
  return w;
}

/** Sorteia até `count` eventos elegíveis, ponderados por peso, sem repetição. */
export function selectEvents(
  state: GameState,
  events: readonly GameEvent[],
  count: number,
  rng: Rng,
  content?: GameContent,
): GameEvent[] {
  const pool = eligibleEvents(state, events, content);
  const chosen: GameEvent[] = [];
  while (chosen.length < count && pool.length > 0) {
    const idx = rng.weightedIndex(pool.map((e) => eventWeight(state, e, content)));
    chosen.push(pool[idx] as GameEvent);
    pool.splice(idx, 1);
  }
  return chosen;
}
