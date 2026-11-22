/** Organizações: níveis, requisitos de entrada e contratos. */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { naturalDivision } from './body';
import { PLAYER_ID } from './profile';
import { removeFromRanking } from './ranking';
import type { DivisionDef, OrgDef, Tier } from './types';
import { TIER_ORDER } from './types';
import { ensureRoster, rosterKey } from './world';

export const tierIndex = (t: Tier) => TIER_ORDER.indexOf(t);

export function getOrg(content: GameContent, id: string | null | undefined): OrgDef | undefined {
  return id ? content.fighting.orgs.find((o) => o.id === id) : undefined;
}

export function playerDivision(state: GameState, content: GameContent): DivisionDef {
  return naturalDivision(state.character.sex, state.character.weightKg, content.fighting.divisions);
}

export type OrgBlockReason = 'age' | 'signing-age' | 'amateur-wins' | 'pro-wins' | 'reputation' | 'belt' | 'win-rate';

/** Motivo pelo qual o jogador ainda não atende aos requisitos (null = atende). */
export function orgRequirementGap(state: GameState, org: OrgDef): OrgBlockReason | null {
  const { age } = state.character;
  const f = state.fighter;
  const req = org.requirements;
  if (age < org.minAge || (org.maxAge !== undefined && age > org.maxAge)) return 'age';
  if (req.maxSigningAge !== undefined && age > req.maxSigningAge && f.orgId !== org.id) return 'signing-age';
  if (req.minAmateurWins !== undefined && f.amateur.wins < req.minAmateurWins) return 'amateur-wins';
  if (req.minProWins !== undefined && f.pro.wins < req.minProWins) return 'pro-wins';
  if (req.minReputation !== undefined && f.reputation < req.minReputation) return 'reputation';
  if (req.minBelt !== undefined && f.belt.rank < req.minBelt) return 'belt';
  if (req.minProWinRate !== undefined && recentProWinRate(state) < req.minProWinRate) return 'win-rate';
  return null;
}

/** Lutas profissionais consideradas na "fase recente". */
export const RECENT_PRO_FIGHTS = 10;

/** Aproveitamento (vitórias / lutas decididas) nas últimas lutas profissionais. */
export function recentProWinRate(state: GameState): number {
  const recent = state.fighter.history.filter((h) => h.pro && h.result !== 'D').slice(-RECENT_PRO_FIGHTS);
  if (recent.length === 0) return 0;
  return recent.filter((h) => h.result === 'W').length / recent.length;
}

export function meetsOrgRequirements(state: GameState, org: OrgDef): boolean {
  return orgRequirementGap(state, org) === null;
}

/** Pode receber proposta de contrato: atende aos requisitos e a organização é de nível acima do contrato atual. */
export function isOrgEligible(state: GameState, org: OrgDef, content: GameContent): boolean {
  if (!org.contract || !meetsOrgRequirements(state, org)) return false;
  const current = getOrg(content, state.fighter.orgId);
  if (current?.id === org.id) return false;
  if (state.fighter.injury || state.fighter.suspendedYears > 0) return false;
  return !current || tierIndex(org.tier) > tierIndex(current.tier);
}

/** Assina contrato: sai da organização anterior (deixando títulos vagos) e entra no elenco da nova. */
export function signWith(state: GameState, orgId: string, content: GameContent): GameState {
  const org = getOrg(content, orgId);
  if (!org || !org.contract || state.fighter.orgId === orgId) return state;
  let next = leaveRankings(state, (key) => !key.startsWith(`${orgId}:`));
  next = {
    ...next,
    fighter: {
      ...next.fighter,
      orgId,
      titles: next.fighter.titles.filter((t) => t.orgId === orgId),
      offers: next.fighter.offers.filter((o) => getOrg(content, o.orgId)?.contract !== true),
    },
  };
  next = ensureRoster(next, orgId, playerDivision(next, content).id, content);
  return appendLog(next, `Você assinou contrato com a ${org.name}!`);
}

/** Remove o jogador dos rankings cujas chaves satisfazem `filter` (títulos ficam vagos). */
export function leaveRankings(state: GameState, filter: (key: string) => boolean): GameState {
  const rosters = { ...state.world.rosters };
  for (const [key, r] of Object.entries(rosters)) {
    if (filter(key) && (r.champion === PLAYER_ID || r.ranking.includes(PLAYER_ID))) rosters[key] = removeFromRanking(r, PLAYER_ID);
  }
  return { ...state, world: { ...state.world, rosters } };
}

export function currentRosterKey(state: GameState, content: GameContent): string | null {
  const org = getOrg(content, state.fighter.orgId);
  if (!org || org.rankingSize === 0) return null;
  return rosterKey(org.id, playerDivision(state, content).id);
}
