/**
 * Treino além do limite do ano (release 0.0.2: treino invisível). O limite de sessões continua na engine, mas o
 * treino não é mais bloqueado: acima dele a sessão não rende, o jogador recebe um aviso em palavras e, a partir da
 * 2ª tentativa extra, corre um pequeno risco de lesão leve por excesso.
 */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { luckRiskChance } from '../character/talents';
import { sessionsBreakdown, sessionsLeft, sessionsReserved, useSessions } from '../lifeStages/sessions';
import { addInjury } from './injuries';

export type OvertrainCause = 'limit' | 'job' | 'college' | 'business';

export interface OvertrainContent {
  text: Record<OvertrainCause, readonly string[]>;
  injuryIds: readonly string[];
  /** Chance de lesão pela ordem da tentativa extra (1ª, 2ª, 3ª em diante). */
  injuryChance: readonly number[];
  /** `{lesao}` = nome da lesão. */
  injuryText: string;
}

/** O ano já não tem sessão livre: o próximo treino é "a mais". */
export function isOvertraining(state: GameState, content: GameContent, sessions = 1): boolean {
  return sessionsLeft(state, content) < sessions;
}

/** Quantas tentativas extras já foram feitas no ano (0 enquanto há sessões livres). */
export function overtrainExtras(state: GameState, content: GameContent): number {
  return Math.max(0, state.fighter.sessionsThisYear + sessionsReserved(state, content) - content.limits.trainingSessions);
}

/** Por que o tempo acabou: o que mais ocupa as sessões do ano, ou o próprio limite. */
export function overtrainCause(state: GameState, content: GameContent): OvertrainCause {
  const parts = sessionsBreakdown(state, content);
  if (!parts.length) return 'limit';
  const top = parts.reduce((a, b) => (b.sessions > a.sessions ? b : a));
  return top.kind === 'emprego' ? 'job' : top.kind === 'faculdade' ? 'college' : 'business';
}

export function overtrainInjuryChance(extraIndex: number, content: GameContent): number {
  const t = content.fighting.overtrain?.injuryChance ?? [];
  return t[Math.min(extraIndex - 1, t.length - 1)] ?? 0;
}

/**
 * Uma sessão a mais: conta no ano (sem ganho), registra o aviso e talvez uma lesão leve. `extraIndex` é 1 na
 * primeira tentativa extra.
 */
export function overtrainSession(state: GameState, rng: Rng, content: GameContent): GameState {
  const oc = content.fighting.overtrain;
  const extraIndex = overtrainExtras(state, content) + 1;
  const cause = overtrainCause(state, content);
  const pool = oc?.text[cause]?.length ? oc.text[cause] : (oc?.text.limit ?? []);
  let s = useSessions(state, 1);
  let text = pool.length ? rng.pick(pool) : 'Você treinou demais este ano. Seu corpo precisa descansar para evoluir.';
  const base = overtrainInjuryChance(extraIndex, content);
  if (oc && base > 0 && rng.chance(luckRiskChance(state, base, 'bad', content))) {
    const defs = content.health.injuries.filter((d) => oc.injuryIds.includes(d.id));
    const def = defs.length ? rng.pick(defs) : undefined;
    if (def) {
      s = addInjury(s, rng, content, def, 'treino');
      text = `${text} ${oc.injuryText.replace('{lesao}', def.name)}`;
    }
  }
  // o aviso fica por último no log (é a linha que vira o toast do resultado)
  s = appendLog(s, text);
  return s;
}
