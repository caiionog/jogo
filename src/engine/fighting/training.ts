import { talentMod } from '../character/talents';
import { addBrainDamage, addInjury, injuryVeto, pickInjury, sparringAggravation } from './injuries';
import type { InjuryDef } from '../health/types';
/** Treino de luta: ganhos com retornos decrescentes, curva de idade, academia e saúde. */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { addSkills } from './profile';
import { sessionsLeft, useSessions } from '../lifeStages/sessions';
import { meetFriend, socialTrainingBonus } from '../relationships/social';
import { ownGymBonus } from '../economy/business';
import type { GymDef, ModalityId, SkillKey, Skills } from './types';
import { ensureGrade, modalityDef } from './belts';

/**
 * Treinos (release 0.0.1): uma modalidade (jiu-jitsu, judô, wrestling → grappling; muay thai, boxe, kickboxing →
 * trocação), o treino físico (Capacidade atlética) e o sparring (os dois, com risco). Toda modalidade também dá um
 * pouco de Capacidade atlética. Modalidade e sparring só numa academia que os ofereça.
 */
export type TrainingKind = ModalityId | 'fisico' | 'sparring';
export const TRAINING_KINDS: readonly TrainingKind[] = ['jiujitsu', 'judo', 'wrestling', 'muaythai', 'boxe', 'kickboxing', 'fisico', 'sparring'];
export const isModality = (k: TrainingKind): k is ModalityId => k !== 'fisico' && k !== 'sparring';

/** Cada treino ocupa 1 das sessões de treino do ano (`limits.trainingSessions`). */
export const TRAINING_SESSIONS = 1;
export const TRAINING_MIN_AGE: Record<TrainingKind, number> = { jiujitsu: 4, judo: 4, wrestling: 6, muaythai: 7, boxe: 8, kickboxing: 10, fisico: 6, sparring: 12 };
/** Ganho base de Capacidade atlética do treino físico (as modalidades dão uma fração dele). */
export const FISICO_ATHLETIC_BASE = 3.4;
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

/**
 * Retornos decrescentes: quanto maior o valor, menor o ganho. As habilidades técnicas usam expoente 1,5; a
 * Capacidade atlética, 1 (o corpo responde mais rápido ao treino que a técnica).
 */
export function diminishing(skill: number, exponent = 1.5): number {
  return Math.pow(Math.max(0, 100 - skill) / 100, exponent);
}

/** Academia de uma modalidade só rende mais nela (×1,2); a mista, um pouco (×1,05). */
export function specialtyFactor(gym: GymDef | undefined, modality?: ModalityId): number {
  if (!gym || !modality || !gym.modalities.includes(modality)) return 1;
  return gym.modalities.length === 1 ? 1.2 : 1.05;
}

export interface GainContext {
  age: number;
  health: number;
  gym: GymDef | undefined;
  /** Potencial do lutador (padrão 1). */
  talent?: number;
  /** Modalidade treinada (bônus de academia especializada). */
  modality?: ModalityId;
}

/**
 * Fator por sessão: 10 sessões por ano rendem mais treinos que a energia antiga (treino custava 2). Provisório na
 * fase 1 da release 0.0.1 para manter o balanceamento; a fase 2 recalibra os ganhos.
 */
export const SESSION_GAIN = 0.45;
/** Multiplicador da experiência de luta (o camp ocupa sessões de treino; a luta devolve parte em aprendizado). */
export const FIGHT_XP = 1.5;

/** Ganho esperado (sem ruído) de uma sessão de treino de `base` pontos na habilidade. */
export function expectedGain(base: number, skill: SkillKey | 'athletic', current: number, ctx: GainContext): number {
  return SESSION_GAIN * base * (ctx.talent ?? 1) * coachFactor(ctx.gym) * ageFactor(ctx.age) * healthFactor(ctx.health) * diminishing(current, skill === 'athletic' ? 1 : 1.5) * specialtyFactor(ctx.gym, skill === 'athletic' ? undefined : ctx.modality);
}

export function gainFor(rng: Rng, base: number, skill: SkillKey | 'athletic', current: number, ctx: GainContext): number {
  return expectedGain(base, skill, current, ctx) * (0.8 + rng.next() * 0.4);
}

export function currentGym(state: GameState, content: GameContent): GymDef | undefined {
  const id = state.fighter.gymId;
  return id ? content.fighting.gyms.find((g) => g.id === id) : undefined;
}

export type TrainingBlockReason = 'dead' | 'busy' | 'too-young' | 'no-gym' | 'not-offered' | 'no-sessions' | 'injured' | 'retired';

export function trainingBlockReason(state: GameState, kind: TrainingKind, content: GameContent): TrainingBlockReason | null {
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'busy';
  if (state.character.age < TRAINING_MIN_AGE[kind]) return 'too-young';
  if (state.fighter.retired && kind === 'sparring') return 'retired';
  if (kind === 'sparring' && injuryVeto(state)) return 'injured';
  if (kind !== 'fisico') {
    const gym = currentGym(state, content);
    if (!gym) return 'no-gym';
    if (isModality(kind) && !gym.modalities.includes(kind)) return 'not-offered';
  }
  if (sessionsLeft(state, content) < TRAINING_SESSIONS) return 'no-sessions';
  return null;
}

/** Frase do treinador depois do treino (pista qualitativa do nível oculto). */
export function coachLine(rng: Rng, content: GameContent, kind: 'grappling' | 'trocacao' | 'fisico' | 'sparring', value: number): string | null {
  const lines = content.fighting.coachLines?.[kind];
  if (!lines || !rng.chance(0.55)) return null;
  const pool = value < 30 ? lines.low : value < 60 ? lines.mid : lines.high;
  return pool.length ? rng.pick(pool) : null;
}

/** Executa um treino de luta. Estado inalterado se bloqueado. */
export function trainFighter(state: GameState, kind: TrainingKind, content: GameContent): GameState {
  if (trainingBlockReason(state, kind, content) !== null) return state;
  const rng = createRng(state.rngState);
  const gym = currentGym(state, content);
  // companheiros de treino próximos e treinador querido rendem um treino melhor
  const ctx: GainContext = { age: state.character.age, health: state.character.stats.health, gym, talent: state.fighter.talent * (1 + socialTrainingBonus(state) + ownGymBonus(state, content) + talentMod(state, content, 'trainingGain')) };
  const sk = state.fighter.skills;
  const delta: Partial<Skills> = {};
  const g = (base: number, k: SkillKey, modality?: ModalityId) => {
    delta[k] = (delta[k] ?? 0) + gainFor(rng, base, k, sk[k], { ...ctx, modality });
  };
  const athletic = state.character.stats.athletic;
  // atributos visíveis são inteiros: ganho fracionário vira +1 com a probabilidade da fração (RNG com seed)
  const athleticGain = (base: number) => {
    const g = gainFor(rng, base, 'athletic', athletic, ctx);
    const whole = Math.floor(g);
    return whole + (rng.chance(g - whole) ? 1 : 0);
  };
  let next: GameState = useSessions(state, TRAINING_SESSIONS);
  let text = '';
  let injury: InjuryDef | undefined;
  const where = gym ? `na ${gym.name}` : state.character.sex === 'M' ? 'sozinho' : 'sozinha';
  let coachValue = 0;
  let coachKey: 'grappling' | 'trocacao' | 'fisico' | 'sparring' = 'fisico';

  if (isModality(kind)) {
    const mod = modalityDef(content, kind)!;
    g(mod.base, mod.skill, kind);
    // toda modalidade também condiciona o corpo (menos que o treino físico)
    const ath = athleticGain(FISICO_ATHLETIC_BASE * mod.athletic);
    next = { ...next, character: { ...next.character, stats: addStats(next.character.stats, { athletic: ath }) } };
    next = ensureGrade(next, kind, content);
    if (!next.fighter.trainedThisYear.includes(kind)) next = { ...next, fighter: { ...next.fighter, trainedThisYear: [...next.fighter.trainedThisYear, kind] } };
    text = `Você treinou ${mod.label.toLowerCase()} ${where}.`;
    coachValue = sk[mod.skill];
    coachKey = mod.skill;
  } else if (kind === 'fisico') {
    const gain = Math.max(1, athleticGain(FISICO_ATHLETIC_BASE));
    next = { ...next, character: { ...next.character, stats: addStats(next.character.stats, { athletic: gain, health: 1 }) } };
    text = 'Você fez um treino físico puxado.';
    coachValue = athletic;
    if (state.character.stats.health < 50 && rng.chance(OVERTRAINING_INJURY_CHANCE * talentMod(state, content, 'injuryChanceMult'))) injury = pickInjury(rng, content, 'treino');
  } else {
    g(2.8, 'grappling');
    g(3.2, 'trocacao');
    next = { ...next, character: { ...next.character, stats: addStats(next.character.stats, { athletic: Math.max(0.5, athleticGain(2)), health: -1 }) } };
    text = 'Você fez sparring pesado com os colegas de equipe.';
    coachValue = (sk.grappling + sk.trocacao) / 2;
    coachKey = 'sparring';
    if (rng.chance(SPARRING_INJURY_CHANCE * talentMod(state, content, 'injuryChanceMult'))) injury = pickInjury(rng, content, 'sparring');
    // pancadas de treino também contam (pouco) no dano cerebral; lesionado pode agravar
    next = addBrainDamage(next, 0.15);
    next = sparringAggravation(next, rng, content);
  }

  next = { ...next, fighter: { ...next.fighter, skills: addSkills(next.fighter.skills, delta) } };
  const line = coachLine(rng, content, coachKey, coachValue);
  next = appendLog(next, line ? `${text} ${line}` : text);
  // na academia dá para conhecer companheiros de treino
  if (gym && state.character.age >= 6 && rng.chance(0.12)) next = meetFriend(next, rng, content, 'gym');
  if (injury) next = addInjury(next, rng, content, injury, kind === 'sparring' ? 'sparring' : 'treino');
  return { ...next, rngState: rng.state };
}

/** Experiência de luta: pequenos ganhos no que foi usado (com retornos decrescentes). */
/** `grapplingRules`: luta só de agarre (sem trocação). */
export function fightExperience(state: GameState, rng: Rng, content: GameContent, grapplingRules: boolean): Skills {
  const gym = currentGym(state, content);
  const ctx: GainContext = { age: state.character.age, health: state.character.stats.health, gym, talent: state.fighter.talent };
  const sk = state.fighter.skills;
  // uma luta (com o camp) ensina mais que uma sessão comum
  const delta: Partial<Skills> = { grappling: gainFor(rng, FIGHT_XP * (grapplingRules ? 3 : 2), 'grappling', sk.grappling, ctx) };
  if (!grapplingRules) delta.trocacao = gainFor(rng, FIGHT_XP * 3, 'trocacao', sk.trocacao, ctx);
  return addSkills(sk, delta);
}

/** Declínio técnico anual a partir dos 36 (o físico cai pela Capacidade atlética; o queixo, por `chinOf`). */
export function ageDecline(skills: Skills, age: number, rng: Rng): Skills {
  if (age < 36) return skills;
  const k = age < 40 ? 1 : 2;
  return addSkills(skills, { trocacao: -rng.int(0, 1) * k, grappling: -rng.int(0, 1) * (k - 1) });
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
