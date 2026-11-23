/**
 * Planejamento dos delitos graves (release 0.0.2): etapas ABSTRATAS de escolha — equipe, alvo, momento e, na hora,
 * seguir ou abortar. Cada etapa é um evento (`content.crime.planEvents`); a engine enfileira a próxima. O resultado
 * sai do RNG com sorte, atlética, inteligência, reputação no crime e a qualidade (oculta) da equipe.
 * Também ficam aqui as condições e os efeitos `crime` dos eventos.
 */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { clamp100, crimeAllowed, crimeBlockReason, crimeDef, runCrime } from './crimes';
import { arrest } from './arrest';
import type { CrimePlan } from './types';

export function startPlan(state: GameState, crimeId: string, content: GameContent): GameState {
  const def = crimeDef(content, crimeId);
  if (!def?.plan || crimeBlockReason(state, crimeId, content) !== null) return state;
  const s: GameState = { ...state, crime: { ...state.crime, plan: { crimeId } } };
  return { ...s, pendingEvents: [...s.pendingEvents, { eventId: content.crime.planEvents[0], source: 'action' }] };
}

export interface CrimeConditions {
  wanted?: { min?: number; max?: number };
  rep?: { min?: number; max?: number };
  dirty?: { min?: number; max?: number };
  /** Tem (true) ou não (false) ficha criminal de adulto. */
  record?: boolean;
  juvenile?: boolean;
  planning?: boolean;
  /** Em facção (true), fora (false) ou numa destas. */
  faction?: boolean | string[];
  trafficking?: boolean;
  /** Já cometeu algum delito. */
  committed?: boolean;
}

export interface CrimeEffects {
  wanted?: number;
  rep?: number;
  planTeam?: NonNullable<CrimePlan['team']>;
  planTarget?: NonNullable<CrimePlan['target']>;
  planTime?: NonNullable<CrimePlan['time']>;
  /** Hora H: true executa, false aborta. */
  planGo?: boolean;
  /** Ser pego por causa do evento (passa pela justiça). */
  arrest?: string;
  /** Some o dinheiro sujo (fração), ex.: apreensão. */
  seizeDirty?: number;
}

const inR = (v: number, r?: { min?: number; max?: number }) => !r || (v >= (r.min ?? -Infinity) && v <= (r.max ?? Infinity));

export function crimeConditionsMet(state: GameState, c: CrimeConditions): boolean {
  const k = state.crime;
  if (!inR(k.wanted, c.wanted) || !inR(k.rep, c.rep) || !inR(k.dirty, c.dirty)) return false;
  if (c.record !== undefined && (k.record.length > 0) !== c.record) return false;
  if (c.juvenile !== undefined && (k.juvenile.length > 0) !== c.juvenile) return false;
  if (c.planning !== undefined && !!k.plan !== c.planning) return false;
  if (c.faction !== undefined) {
    if (Array.isArray(c.faction)) {
      if (!k.faction || !c.faction.includes(k.faction.id)) return false;
    } else if (!!k.faction !== c.faction) return false;
  }
  if (c.trafficking !== undefined && !!k.trafficking !== c.trafficking) return false;
  if (c.committed !== undefined && ((k.committed ?? 0) > 0) !== c.committed) return false;
  // regra de menores: condição de facção/tráfico/delito grave nunca vale abaixo dos 18
  if ((c.faction || c.trafficking || c.planning) && !crimeAllowed(state, 'faccao')) return false;
  return true;
}

const TEAM_Q: Record<NonNullable<CrimePlan['team']>, [number, number]> = { amigos: [20, 55], conhecidos: [35, 70], profissionais: [60, 92] };

export function applyCrimeEffects(state: GameState, fx: CrimeEffects, rng: Rng, content: GameContent): GameState {
  let s = state;
  if (fx.wanted) s = { ...s, crime: { ...s.crime, wanted: clamp100(s.crime.wanted + fx.wanted) } };
  if (fx.rep) s = { ...s, crime: { ...s.crime, rep: clamp100(s.crime.rep + fx.rep) } };
  if (fx.seizeDirty) s = { ...s, crime: { ...s.crime, dirty: Math.round(s.crime.dirty * (1 - fx.seizeDirty)) } };
  if (fx.arrest) s = arrest(s, fx.arrest, rng, content, 'evento');
  const plan = s.crime.plan;
  if (!plan) return s;
  const ev = content.crime.planEvents;
  const setPlan = (p: CrimePlan, next?: string): GameState => {
    const x: GameState = { ...s, crime: { ...s.crime, plan: p } };
    return next ? { ...x, pendingEvents: [...x.pendingEvents, { eventId: next, source: 'followUp' }] } : x;
  };
  if (fx.planTeam) {
    const [lo, hi] = TEAM_Q[fx.planTeam];
    // profissionais não levam a sério quem não tem nome no crime
    const q = rng.int(lo, hi) - (fx.planTeam === 'profissionais' && s.crime.rep < 30 ? 25 : 0);
    s = setPlan({ ...plan, team: fx.planTeam, teamQuality: Math.max(5, q) }, ev[1]);
  } else if (fx.planTarget) s = setPlan({ ...plan, target: fx.planTarget }, ev[2]);
  else if (fx.planTime) s = setPlan({ ...plan, time: fx.planTime }, ev[3]);
  else if (fx.planGo !== undefined) {
    const def = crimeDef(content, plan.crimeId);
    if (!fx.planGo || !def || !crimeAllowed(s, def)) {
      s = { ...s, crime: { ...s.crime, plan: null, wanted: clamp100(s.crime.wanted + 3) } };
      return appendLog(s, 'Você abortou o plano. A equipe se dispersou.');
    }
    s = runCrime(s, def, rng, content, plan);
  }
  return s;
}
