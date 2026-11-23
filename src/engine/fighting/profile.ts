import { chinOf } from './chin';
import type { GameState } from '../core/state';
import type { CareerRecord, FighterProfile, FighterSnapshot, SkillDelta, Skills, World } from './types';
import { SKILL_KEYS } from './types';

export const PLAYER_ID = 'player';

export function emptyRecord(): CareerRecord {
  return { wins: 0, losses: 0, draws: 0, winsBy: { KO: 0, SUB: 0, DEC: 0 }, lossesBy: { KO: 0, SUB: 0, DEC: 0 } };
}

export function baseSkills(level = 5): Skills {
  return { grappling: level, trocacao: level };
}

export function newFighterProfile(skills: Skills = baseSkills(), talent = 1, chinBase = 55): FighterProfile {
  return {
    skills,
    chinBase,
    trainingLoad: 0,
    sessionsThisYear: 0,
    talent,
    grades: {},
    reputation: 0,
    gymId: null,
    amateur: emptyRecord(),
    pro: emptyRecord(),
    bjj: emptyRecord(),
    orgId: null,
    titles: [],
    titlesWon: 0,
    winStreak: 0,
    retired: null,
    suspendedYears: 0,
    history: [],
    trainedThisYear: [],
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

/**
 * "Nível" geral do lutador (0–100), na mesma escala da Etapa 3: trocação e grappling pesam mais, físico e queixo
 * completam. Usado no matchmaking, na elegibilidade das ligas e na avaliação do treinador (nunca exibido).
 */
export function skillRating(s: Skills, athletic: number, chin: number): number {
  return s.trocacao * 0.36 + s.grappling * 0.36 + athletic * 0.14 + chin * 0.14;
}

/** Aplica um SkillDelta ao estado: habilidades ocultas, Capacidade atlética (visível) e queixo inato. */
export function applySkillDelta(state: GameState, d: SkillDelta): GameState {
  const { athletic, chin, ...skills } = d;
  let s: GameState = { ...state, fighter: { ...state.fighter, skills: addSkills(state.fighter.skills, skills) } };
  if (athletic) s = { ...s, character: { ...s.character, stats: { ...s.character.stats, athletic: Math.max(0, Math.min(100, s.character.stats.athletic + athletic)) } } };
  if (chin) s = { ...s, fighter: { ...s.fighter, chinBase: clampSkill(s.fighter.chinBase + chin) } };
  return s;
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
    skills: { ...state.fighter.skills },
    athletic: c.stats.athletic,
    // queixo derivado: base inata, idade, dano cerebral (oculto) e saúde
    chin: chinOf(state),
    sizeEdge,
    startStamina,
  };
}

export function recordText(r: { wins: number; losses: number; draws: number } | { w: number; l: number; d: number }): string {
  const [w, l, d] = 'wins' in r ? [r.wins, r.losses, r.draws] : [r.w, r.l, r.d];
  return `${w}-${l}-${d}`;
}
