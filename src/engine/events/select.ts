import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { STAT_KEYS } from '../core/state';
import { stageOfGrade } from '../lifeStages/school';
import type { EventConditions, FightingConditions, GameEvent, SchoolResultTag, StatRange } from './types';
import type { GameContent } from '../core/content';
import { beltPromotionReady } from '../fighting/belts';
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
  if (c.injured !== undefined && (f.injury !== null) !== c.injured) return false;
  if (c.suspended !== undefined && (f.suspendedYears > 0) !== c.suspended) return false;
  if (!inRange(f.belt.rank, c.belt)) return false;
  if (!inRange(f.amateur.wins, c.amateurWins)) return false;
  if (!inRange(f.pro.wins, c.proWins)) return false;
  if (!inRange(f.reputation, c.reputation)) return false;
  if (c.champion !== undefined && (f.titles.length > 0) !== c.champion) return false;
  if (c.beltPromotionReady !== undefined && beltPromotionReady(state) !== c.beltPromotionReady) return false;
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

/** Verifica apenas as condições do evento (idade, atributos, flags, escola, luta, `once`). */
export function conditionsMet(state: GameState, event: GameEvent, content?: GameContent): boolean {
  const c = event.conditions;
  const { age, sex, stats } = state.character;
  if (event.once && state.firedEvents.includes(event.id)) return false;
  if (c.minAge !== undefined && age < c.minAge) return false;
  if (c.maxAge !== undefined && age > c.maxAge) return false;
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
  return true;
}

/** Elegível para o SORTEIO aleatório: trigger 'random', peso > 0 e condições atendidas. */
export function isEligible(state: GameState, event: GameEvent, content?: GameContent): boolean {
  if ((event.trigger ?? 'random') !== 'random') return false;
  if (event.weight <= 0) return false;
  return conditionsMet(state, event, content);
}

export function eligibleEvents(state: GameState, events: readonly GameEvent[], content?: GameContent): GameEvent[] {
  return events.filter((e) => isEligible(state, e, content));
}

/** Eventos 'auto' que devem entrar neste ano. */
export function autoEvents(state: GameState, events: readonly GameEvent[], content?: GameContent): GameEvent[] {
  return events.filter((e) => e.trigger === 'auto' && conditionsMet(state, e, content));
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
    const idx = rng.weightedIndex(pool.map((e) => e.weight));
    chosen.push(pool[idx] as GameEvent);
    pool.splice(idx, 1);
  }
  return chosen;
}
