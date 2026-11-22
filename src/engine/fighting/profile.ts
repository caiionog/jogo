import type { GameState } from '../core/state';
import type { CareerRecord, FighterProfile, FighterSnapshot, Skills, World } from './types';
import { SKILL_KEYS } from './types';

export const PLAYER_ID = 'player';

export function emptyRecord(): CareerRecord {
  return { wins: 0, losses: 0, draws: 0, winsBy: { KO: 0, SUB: 0, DEC: 0 }, lossesBy: { KO: 0, SUB: 0, DEC: 0 } };
}

export function baseSkills(level = 5): Skills {
  return { striking: level, wrestling: level, grappling: level, defense: level, cardio: level + 5, chin: 50 };
}

export function newFighterProfile(skills: Skills = baseSkills(), talent = 1): FighterProfile {
  return {
    skills,
    talent,
    belt: { rank: 0, years: 0 },
    reputation: 0,
    gymId: null,
    amateur: emptyRecord(),
    pro: emptyRecord(),
    bjj: emptyRecord(),
    orgId: null,
    titles: [],
    titlesWon: 0,
    winStreak: 0,
    injury: null,
    suspendedYears: 0,
    history: [],
    trainedBjjThisYear: false,
    offers: [],
    nextOfferId: 1,
    proDebutAge: null,
    majorDebutAge: null,
  };
}

export function emptyWorld(): World {
  return { rosters: {}, nextNpcId: 1 };
}

export const clampSkill = (v: number) => Math.min(100, Math.max(0, Math.round(v * 10) / 10));

export function addSkills(skills: Skills, delta: Partial<Skills>): Skills {
  const out = { ...skills };
  for (const k of SKILL_KEYS) {
    const d = delta[k];
    if (d !== undefined) out[k] = clampSkill(out[k] + d);
  }
  return out;
}

/** Média ponderada das habilidades (0–100), usada como "nível" do lutador. */
export function skillRating(s: Skills): number {
  return s.striking * 0.2 + s.wrestling * 0.17 + s.grappling * 0.17 + s.defense * 0.18 + s.cardio * 0.14 + s.chin * 0.14;
}

/** Nome curto do jogador para a narração (primeiro nome). */
export function shortName(full: string): string {
  return full.split(' ')[0] ?? full;
}

export function playerSnapshot(state: GameState, sizeEdge: number, startStamina = 100): FighterSnapshot {
  const c = state.character;
  return {
    id: PLAYER_ID,
    name: shortName(c.name),
    fullName: c.name,
    skills: state.fighter.skills,
    strength: c.stats.strength,
    fitness: c.stats.fitness,
    sizeEdge,
    startStamina,
  };
}

export function recordText(r: { wins: number; losses: number; draws: number } | { w: number; l: number; d: number }): string {
  const [w, l, d] = 'wins' in r ? [r.wins, r.losses, r.draws] : [r.w, r.l, r.d];
  return `${w}-${l}-${d}`;
}
