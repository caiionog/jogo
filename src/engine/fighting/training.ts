/** Treino de luta: ganhos com retornos decrescentes, curva de idade, academia e saúde. */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { addSkills } from './profile';
import type { GymDef, SkillKey, Skills } from './types';

export type TrainingKind = 'technique' | 'sparring' | 'conditioning' | 'bjj';
export const TECHNIQUE_SKILLS: readonly SkillKey[] = ['striking', 'wrestling', 'defense'];

export const TRAINING_COST: Record<TrainingKind, number> = { technique: 2, sparring: 2, conditioning: 1, bjj: 2 };
export const TRAINING_MIN_AGE: Record<TrainingKind, number> = { technique: 4, sparring: 12, conditioning: 6, bjj: 4 };
export const SPARRING_INJURY_CHANCE = 0.08;

/** Fator de idade: aprende pouco criança, pico 25–32, declínio depois. */
export function ageFactor(age: number): number {
  if (age < 10) return 0.55;
  if (age < 18) return 0.8;
  if (age < 25) return 0.95;
  if (age <= 32) return 1;
  if (age <= 36) return 0.75;
  return 0.45;
}

export function coachFactor(gym: GymDef | undefined): number {
  return gym ? 0.5 + (gym.coach / 100) * 0.8 : 0.45;
}

export function healthFactor(health: number): number {
  return 0.5 + health / 200;
}

/** Retornos decrescentes: quanto maior a habilidade, menor o ganho. */
export function diminishing(skill: number): number {
  return Math.pow(Math.max(0, 100 - skill) / 100, 1.5);
}

export function specialtyFactor(gym: GymDef | undefined, skill: SkillKey): number {
  if (!gym) return 1;
  if (gym.specialty === 'mma') return 1.1;
  if (gym.specialty === skill) return 1.25;
  if (gym.specialty === 'grappling' && skill === 'grappling') return 1.25;
  return 1;
}

export interface GainContext {
  age: number;
  health: number;
  gym: GymDef | undefined;
  /** Potencial do lutador (padrão 1). */
  talent?: number;
}

/** Ganho esperado (sem ruído) de uma sessão de treino de `base` pontos na habilidade. */
export function expectedGain(base: number, skill: SkillKey, current: number, ctx: GainContext): number {
  return base * (ctx.talent ?? 1) * coachFactor(ctx.gym) * ageFactor(ctx.age) * healthFactor(ctx.health) * diminishing(current) * specialtyFactor(ctx.gym, skill);
}

export function gainFor(rng: Rng, base: number, skill: SkillKey, current: number, ctx: GainContext): number {
  return expectedGain(base, skill, current, ctx) * (0.8 + rng.next() * 0.4);
}

export function currentGym(state: GameState, content: GameContent): GymDef | undefined {
  const id = state.fighter.gymId;
  return id ? content.fighting.gyms.find((g) => g.id === id) : undefined;
}

export type TrainingBlockReason = 'dead' | 'busy' | 'too-young' | 'no-energy' | 'injured' | 'bad-skill';

export function trainingBlockReason(state: GameState, kind: TrainingKind, skill?: SkillKey): TrainingBlockReason | null {
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'busy';
  if (state.character.age < TRAINING_MIN_AGE[kind]) return 'too-young';
  if (kind === 'sparring' && state.fighter.injury) return 'injured';
  if (kind === 'technique' && (!skill || !TECHNIQUE_SKILLS.includes(skill))) return 'bad-skill';
  if (state.energy.current < TRAINING_COST[kind]) return 'no-energy';
  return null;
}

const SKILL_TEXT: Record<SkillKey, string> = {
  striking: 'trocação',
  wrestling: 'wrestling',
  grappling: 'jiu-jitsu',
  defense: 'defesa',
  cardio: 'cardio',
  chin: 'queixo',
};

/** Executa um treino de luta. Estado inalterado se bloqueado. */
export function trainFighter(state: GameState, kind: TrainingKind, skill: SkillKey | undefined, content: GameContent): GameState {
  if (trainingBlockReason(state, kind, skill) !== null) return state;
  const rng = createRng(state.rngState);
  const gym = currentGym(state, content);
  const ctx: GainContext = { age: state.character.age, health: state.character.stats.health, gym, talent: state.fighter.talent };
  const sk = state.fighter.skills;
  const delta: Partial<Skills> = {};
  const g = (base: number, k: SkillKey) => {
    delta[k] = (delta[k] ?? 0) + gainFor(rng, base, k, sk[k], ctx);
  };
  let next: GameState = { ...state, energy: { ...state.energy, current: state.energy.current - TRAINING_COST[kind] } };
  let text = '';
  let injury: string | null = null;

  switch (kind) {
    case 'technique': {
      const k = skill as SkillKey;
      g(7, k);
      if (k !== 'defense') g(1.5, 'defense');
      text = `Você treinou ${SKILL_TEXT[k]} ${gym ? `na ${gym.name}` : 'sozinho(a)'}.`;
      break;
    }
    case 'sparring': {
      const picks = rng.chance(0.5) ? (['striking', 'wrestling'] as const) : (['striking', 'grappling'] as const);
      for (const k of picks) g(7 * 1.6 * 0.6, k);
      g(5, 'defense');
      g(2.5, 'chin');
      next = { ...next, character: { ...next.character, stats: addStats(next.character.stats, { health: -1 }) } };
      text = 'Você fez sparring pesado com os colegas de equipe.';
      if (rng.chance(SPARRING_INJURY_CHANCE)) injury = rng.pick(content.fighting.injuries);
      break;
    }
    case 'conditioning': {
      g(8, 'cardio');
      next = { ...next, character: { ...next.character, stats: addStats(next.character.stats, { fitness: 2, health: 1 }) } };
      text = 'Você fez um treino puxado de condicionamento.';
      break;
    }
    case 'bjj': {
      g(7, 'grappling');
      g(1.5, 'defense');
      next = { ...next, fighter: { ...next.fighter, trainedBjjThisYear: true } };
      text = 'Você treinou jiu-jitsu no tatame.';
      break;
    }
  }

  next = { ...next, fighter: { ...next.fighter, skills: addSkills(next.fighter.skills, delta) } };
  next = appendLog(next, text.replace('sozinho(a)', state.character.sex === 'M' ? 'sozinho' : 'sozinha'));
  if (injury) {
    next = {
      ...next,
      fighter: { ...next.fighter, injury: { name: injury, yearsLeft: 1 } },
      character: { ...next.character, stats: addStats(next.character.stats, { health: -8 }) },
    };
    next = appendLog(next, `Você se machucou no sparring: ${injury}. Sem lutas por um ano.`);
  }
  return { ...next, rngState: rng.state };
}

/** Experiência de luta: pequenos ganhos em tudo que foi usado (com retornos decrescentes). */
export function fightExperience(state: GameState, rng: Rng, content: GameContent, grappling: boolean): Skills {
  const gym = currentGym(state, content);
  const ctx: GainContext = { age: state.character.age, health: state.character.stats.health, gym, talent: state.fighter.talent };
  const sk = state.fighter.skills;
  const keys: SkillKey[] = grappling ? ['grappling', 'wrestling', 'cardio'] : ['striking', 'wrestling', 'grappling', 'defense', 'cardio'];
  const delta: Partial<Skills> = {};
  for (const k of keys) delta[k] = gainFor(rng, 2.5, k, sk[k], ctx);
  return addSkills(sk, delta);
}

/** Declínio físico anual a partir dos 33 (cardio e queixo primeiro). */
export function ageDecline(skills: Skills, age: number, rng: Rng): Skills {
  if (age < 33) return skills;
  const k = age < 36 ? 1 : 2;
  return addSkills(skills, {
    cardio: -rng.int(1, 2) * k,
    chin: -rng.int(0, 2) * k,
    striking: -rng.int(0, 1) * (k - 1),
    wrestling: -rng.int(0, 1) * (k - 1),
  });
}
