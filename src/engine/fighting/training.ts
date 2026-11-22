import { addBrainDamage, addInjury, injuryVeto, pickInjury, sparringAggravation } from './injuries';
import type { InjuryDef } from '../health/types';
/** Treino de luta: ganhos com retornos decrescentes, curva de idade, academia e saúde. */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { addSkills } from './profile';
import { meetFriend, socialTrainingBonus } from '../relationships/social';
import { ownGymBonus } from '../economy/business';
import type { GymDef, SkillKey, Skills } from './types';

/** Treinos da Etapa 8: jiu-jitsu, trocação, físico (Capacidade atlética) e sparring (os dois, com risco). */
export type TrainingKind = 'jiujitsu' | 'trocacao' | 'fisico' | 'sparring';
export const TRAINING_KINDS: readonly TrainingKind[] = ['jiujitsu', 'trocacao', 'fisico', 'sparring'];

export const TRAINING_COST: Record<TrainingKind, number> = { jiujitsu: 2, trocacao: 2, fisico: 1, sparring: 2 };
export const TRAINING_MIN_AGE: Record<TrainingKind, number> = { jiujitsu: 4, trocacao: 4, fisico: 6, sparring: 12 };
/** Treino físico com saúde < 50: chance de lesão por excesso. */
export const OVERTRAINING_INJURY_CHANCE = 0.1;
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

/** Retornos decrescentes: quanto maior o valor, menor o ganho. */
export function diminishing(skill: number): number {
  return Math.pow(Math.max(0, 100 - skill) / 100, 1.5);
}

export function specialtyFactor(gym: GymDef | undefined, skill: SkillKey | 'athletic'): number {
  if (!gym) return 1;
  if (gym.specialty === 'mma') return 1.1;
  if (gym.specialty === skill) return 1.25;
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
export function expectedGain(base: number, skill: SkillKey | 'athletic', current: number, ctx: GainContext): number {
  return base * (ctx.talent ?? 1) * coachFactor(ctx.gym) * ageFactor(ctx.age) * healthFactor(ctx.health) * diminishing(current) * specialtyFactor(ctx.gym, skill);
}

export function gainFor(rng: Rng, base: number, skill: SkillKey | 'athletic', current: number, ctx: GainContext): number {
  return expectedGain(base, skill, current, ctx) * (0.8 + rng.next() * 0.4);
}

export function currentGym(state: GameState, content: GameContent): GymDef | undefined {
  const id = state.fighter.gymId;
  return id ? content.fighting.gyms.find((g) => g.id === id) : undefined;
}

export type TrainingBlockReason = 'dead' | 'busy' | 'too-young' | 'no-energy' | 'injured' | 'retired';

export function trainingBlockReason(state: GameState, kind: TrainingKind): TrainingBlockReason | null {
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'busy';
  if (state.character.age < TRAINING_MIN_AGE[kind]) return 'too-young';
  if (state.fighter.retired && kind === 'sparring') return 'retired';
  if (kind === 'sparring' && injuryVeto(state)) return 'injured';
  if (state.energy.current < TRAINING_COST[kind]) return 'no-energy';
  return null;
}

/** Frase do treinador depois do treino (pista qualitativa do nível oculto). */
export function coachLine(rng: Rng, content: GameContent, kind: TrainingKind, value: number): string | null {
  const lines = content.fighting.coachLines?.[kind];
  if (!lines || !rng.chance(0.55)) return null;
  const pool = value < 30 ? lines.low : value < 60 ? lines.mid : lines.high;
  return pool.length ? rng.pick(pool) : null;
}

/** Executa um treino de luta. Estado inalterado se bloqueado. */
export function trainFighter(state: GameState, kind: TrainingKind, content: GameContent): GameState {
  if (trainingBlockReason(state, kind) !== null) return state;
  const rng = createRng(state.rngState);
  const gym = currentGym(state, content);
  // companheiros de treino próximos e treinador querido rendem um treino melhor
  const ctx: GainContext = { age: state.character.age, health: state.character.stats.health, gym, talent: state.fighter.talent * (1 + socialTrainingBonus(state) + ownGymBonus(state, content)) };
  const sk = state.fighter.skills;
  const delta: Partial<Skills> = {};
  const g = (base: number, k: SkillKey) => {
    delta[k] = (delta[k] ?? 0) + gainFor(rng, base, k, sk[k], ctx);
  };
  const athletic = state.character.stats.athletic;
  const athleticGain = (base: number) => Math.round(gainFor(rng, base, 'athletic', athletic, ctx) * 10) / 10;
  let next: GameState = { ...state, energy: { ...state.energy, current: state.energy.current - TRAINING_COST[kind] } };
  let text = '';
  let injury: InjuryDef | undefined;
  const where = gym ? `na ${gym.name}` : state.character.sex === 'M' ? 'sozinho' : 'sozinha';
  let coachValue = 0;

  switch (kind) {
    case 'jiujitsu': {
      g(3.5, 'jiujitsu');
      next = { ...next, fighter: { ...next.fighter, trainedBjjThisYear: true } };
      text = `Você treinou jiu-jitsu ${where}.`;
      coachValue = sk.jiujitsu;
      break;
    }
    case 'trocacao': {
      g(4, 'trocacao');
      text = `Você treinou trocação ${where}.`;
      coachValue = sk.trocacao;
      break;
    }
    case 'fisico': {
      const gain = Math.max(1, athleticGain(3.6));
      next = { ...next, character: { ...next.character, stats: addStats(next.character.stats, { athletic: gain, health: 1 }) } };
      text = 'Você fez um treino físico puxado.';
      coachValue = athletic;
      if (state.character.stats.health < 50 && rng.chance(OVERTRAINING_INJURY_CHANCE)) injury = pickInjury(rng, content, 'treino');
      break;
    }
    case 'sparring': {
      g(2.8, 'jiujitsu');
      g(3.2, 'trocacao');
      next = { ...next, character: { ...next.character, stats: addStats(next.character.stats, { athletic: Math.max(0.5, athleticGain(2)), health: -1 }) } };
      text = 'Você fez sparring pesado com os colegas de equipe.';
      coachValue = (sk.jiujitsu + sk.trocacao) / 2;
      if (rng.chance(SPARRING_INJURY_CHANCE)) injury = pickInjury(rng, content, 'sparring');
      // pancadas de treino também contam (pouco) no dano cerebral; lesionado pode agravar
      next = addBrainDamage(next, 0.15);
      next = sparringAggravation(next, rng, content);
      break;
    }
  }

  next = { ...next, fighter: { ...next.fighter, skills: addSkills(next.fighter.skills, delta), sessionsThisYear: (next.fighter.sessionsThisYear ?? 0) + 1 } };
  const line = coachLine(rng, content, kind, coachValue);
  next = appendLog(next, line ? `${text} ${line}` : text);
  // na academia dá para conhecer companheiros de treino
  if (gym && state.character.age >= 6 && rng.chance(0.12)) next = meetFriend(next, rng, content, 'gym');
  if (injury) next = addInjury(next, rng, content, injury, kind === 'sparring' ? 'sparring' : 'treino');
  return { ...next, rngState: rng.state };
}

/** Experiência de luta: pequenos ganhos no que foi usado (com retornos decrescentes). */
export function fightExperience(state: GameState, rng: Rng, content: GameContent, grappling: boolean): Skills {
  const gym = currentGym(state, content);
  const ctx: GainContext = { age: state.character.age, health: state.character.stats.health, gym, talent: state.fighter.talent };
  const sk = state.fighter.skills;
  const delta: Partial<Skills> = { jiujitsu: gainFor(rng, grappling ? 3 : 2, 'jiujitsu', sk.jiujitsu, ctx) };
  if (!grappling) delta.trocacao = gainFor(rng, 3, 'trocacao', sk.trocacao, ctx);
  return addSkills(sk, delta);
}

/** Declínio técnico anual a partir dos 36 (o físico cai pela Capacidade atlética; o queixo, por `chinOf`). */
export function ageDecline(skills: Skills, age: number, rng: Rng): Skills {
  if (age < 36) return skills;
  const k = age < 40 ? 1 : 2;
  return addSkills(skills, { trocacao: -rng.int(0, 1) * k, jiujitsu: -rng.int(0, 1) * (k - 1) });
}

/** Virada do ano: carga de treino (média móvel) e declínio físico depois dos 33. */
export function trainingYear(state: GameState, rng: Rng): GameState {
  const f = state.fighter;
  const load = Math.round((f.trainingLoad * 0.55 + Math.min(1, (f.sessionsThisYear ?? 0) / 4) * 0.45) * 100) / 100;
  let s: GameState = { ...state, fighter: { ...f, trainingLoad: load, sessionsThisYear: 0 } };
  const age = s.character.age;
  // sedentarismo e idade tiram Capacidade atlética; quem treina segura melhor
  const loss = (age >= 33 ? (age < 40 ? 1 : age < 55 ? 2 : 3) : 0) + (load < 0.15 && age >= 16 ? 1 : 0) - (load > 0.6 ? 1 : 0);
  if (loss > 0) s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { athletic: -rng.int(Math.max(0, loss - 1), loss) }) } };
  return s;
}
