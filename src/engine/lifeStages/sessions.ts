/**
 * Sessões de treino (release 0.0.1: substituem a energia).
 *
 * - O ano tem `limits.trainingSessions` (10) sessões, compartilhadas entre as modalidades de luta, o treino físico,
 *   o sparring e os camps de luta. O gasto fica em `fighter.sessionsThisYear` (zerado no início do ano de luta).
 * - Emprego (4 tempo integral / 2 meio período ou estágio), faculdade (2) e "gerenciar de perto" (2) ocupam parte
 *   delas: `sessionsReserved`.
 * - As demais atividades não têm limite, mas cada repetição no mesmo ano rende menos (`repeatMultiplier`):
 *   o contador vive em `GameState.yearUses` (zerado no `advanceYear`).
 */
import type { GameContent } from '../core/content';
import type { Effects } from '../core/effects';
import type { GameState, StatKey } from '../core/state';

export interface LimitsConfig {
  trainingSessions: number;
  repeatMultipliers: readonly number[];
  sessionsByJob: { fullTime: number; partTime: number };
  collegeSessions: number;
  businessDedicateSessions: number;
  minActivityAge: number;
}

export interface ReservedPart {
  kind: 'emprego' | 'faculdade' | 'empresa';
  sessions: number;
  /** Frase pronta para a UI ("Seu emprego ocupa 4 sessões de treino"). */
  text: string;
}

function plural(n: number): string {
  return `${n} ${n === 1 ? 'sessão' : 'sessões'} de treino`;
}

/** O que ocupa sessões de treino neste ano. */
export function sessionsBreakdown(state: GameState, content: GameContent): ReservedPart[] {
  const parts: ReservedPart[] = [];
  const job = state.economy.job;
  if (job) {
    const def = content.economy.jobs.find((j) => j.id === job.jobId);
    const n = def?.trainingSessions ?? 0;
    if (n > 0) parts.push({ kind: 'emprego', sessions: n, text: `Seu emprego ocupa ${plural(n)}` });
  }
  const dedicated = state.economy.businesses.filter((b) => b.dedicatedYear === state.year).length;
  if (dedicated > 0) {
    const n = dedicated * content.limits.businessDedicateSessions;
    parts.push({ kind: 'empresa', sessions: n, text: `Gerenciar de perto ocupa ${plural(n)}` });
  }
  return parts;
}

export function sessionsReserved(state: GameState, content: GameContent): number {
  return sessionsBreakdown(state, content).reduce((t, p) => t + p.sessions, 0);
}

/** Sessões de treino ainda livres neste ano (nunca negativo). */
export function sessionsLeft(state: GameState, content: GameContent): number {
  return Math.max(0, content.limits.trainingSessions - sessionsReserved(state, content) - state.fighter.sessionsThisYear);
}

/** Sessões que o personagem pode usar neste ano (limite − reservadas), para o "Treinos: 7/10". */
export function sessionsAvailable(state: GameState, content: GameContent): number {
  return Math.max(0, content.limits.trainingSessions - sessionsReserved(state, content));
}

/** Gasta `n` sessões (o chamador já conferiu `sessionsLeft`). */
export function useSessions(state: GameState, n: number): GameState {
  return { ...state, fighter: { ...state.fighter, sessionsThisYear: state.fighter.sessionsThisYear + n } };
}

/** Quantas vezes a atividade `key` já foi feita neste ano. */
export function usesThisYear(state: GameState, key: string): number {
  return state.yearUses[key] ?? 0;
}

/** Multiplicador da próxima repetição de `key` neste ano (1 na primeira vez). */
export function repeatMultiplier(state: GameState, key: string, content: GameContent): number {
  const m = content.limits.repeatMultipliers;
  const n = usesThisYear(state, key);
  return m[Math.min(n, m.length - 1)] ?? 1;
}

/** Registra mais um uso de `key` neste ano. */
export function bumpUse(state: GameState, key: string): GameState {
  return { ...state, yearUses: { ...state.yearUses, [key]: usesThisYear(state, key) + 1 } };
}

/** Escala um ganho positivo pelo multiplicador (mantém pelo menos 1 quando havia ganho e o multiplicador > 0). */
export function scaleGain(value: number, mult: number): number {
  if (value <= 0 || mult >= 1) return value;
  const v = Math.round(value * mult);
  return v === 0 && mult > 0.15 ? 1 : v;
}

/** Aplica o retorno decrescente aos efeitos POSITIVOS de atributos e média escolar (custos e perdas ficam iguais). */
export function scalePositiveEffects(effects: Effects, mult: number): Effects {
  if (mult >= 1) return effects;
  const out: Effects = { ...effects };
  if (effects.stats) {
    const stats: Partial<Record<StatKey, number>> = {};
    for (const [k, v] of Object.entries(effects.stats) as [StatKey, number][]) stats[k] = scaleGain(v, mult);
    out.stats = stats;
  }
  if (effects.school) {
    const sc = { ...effects.school };
    for (const k of ['average', 'popularity'] as const) if (typeof sc[k] === 'number') sc[k] = scaleGain(sc[k]!, mult);
    out.school = sc;
  }
  return out;
}

/** Bebês só avançam o ano: nenhuma atividade antes de `limits.minActivityAge`. */
export function tooYoungForActivities(state: GameState, content: GameContent): boolean {
  return state.character.age < content.limits.minActivityAge;
}
