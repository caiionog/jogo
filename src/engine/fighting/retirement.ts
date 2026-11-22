/**
 * Aposentadoria da luta (Etapa 6): voluntária (com evento de despedida), forçada por lesão, por veto médico
 * (dano cerebral) ou corte de contrato por derrotas; volta da aposentadoria por evento.
 */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { bumpFeat } from '../meta/feats';
import { currentRosterKey, leaveRankings } from './orgs';
import type { RetireReason } from './types';
import { PLAYER_ID } from './profile';

/** Está no ranking (ou é campeão) da categoria do contrato atual. */
function isRanked(state: GameState, content: GameContent): boolean {
  const key = currentRosterKey(state, content);
  const r = key ? state.world.rosters[key] : undefined;
  return !!r && (r.champion === PLAYER_ID || r.ranking.includes(PLAYER_ID));
}

/** Dano cerebral a partir do qual a comissão médica nega a licença. */
export const MEDICAL_VETO_BRAIN = 80;
/** Derrotas seguidas (com contrato) que fazem a liga cortar o contrato. */
export const CONTRACT_CUT_LOSSES = 6;
/** Derrotas seguidas que disparam o evento "hora de parar?". */
export const STOP_EVENT_LOSSES = 8;

export type RetireBlockReason = 'dead' | 'busy' | 'already' | 'never-fought';

export function hasFought(state: GameState): boolean {
  const f = state.fighter;
  return f.amateur.wins + f.amateur.losses + f.amateur.draws + f.pro.wins + f.pro.losses + f.pro.draws + f.bjj.wins + f.bjj.losses > 0;
}

export function retireBlockReason(state: GameState): RetireBlockReason | null {
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.fighter.retired) return 'already';
  if (!hasFought(state)) return 'never-fought';
  return null;
}

/** Ação "Aposentar": abre o evento de despedida (luta de despedida, cerimônia ou sair em silêncio). */
export function retire(state: GameState, content: GameContent): GameState {
  if (retireBlockReason(state) !== null) return state;
  const hook = content.fighting.hooks.farewellEventId;
  if (!hook) return completeRetirement(state, 'voluntaria');
  return { ...state, pendingEvents: [...state.pendingEvents, { eventId: hook, source: 'action' }] };
}

const REASON_TEXT: Record<RetireReason, string> = {
  voluntaria: 'Você pendurou as luvas',
  lesao: 'O corpo pediu para parar: você se aposentou por causa das lesões',
  medica: 'A comissão médica negou sua licença: carreira encerrada',
  derrotas: 'Depois de tantas derrotas, você decidiu parar',
};

/** Efetiva a aposentadoria: sai dos rankings, deixa cinturões vagos, encerra contrato e ofertas. */
export function completeRetirement(state: GameState, reason: RetireReason, extra?: string): GameState {
  if (state.fighter.retired) return state;
  const f = state.fighter;
  let s: GameState = state;
  if (f.orgId || f.titles.length) s = leaveRankings(s, () => true);
  s = {
    ...s,
    fighter: { ...s.fighter, retired: { age: s.character.age, reason, comebacks: (s.feats.comebacks ?? 0) }, offers: [], titles: [], orgId: null },
    economy: { ...s.economy, contract: null },
    flags: { ...s.flags, aposentado: true },
  };
  if (reason !== 'voluntaria') s = bumpFeat(s, 'forcedRetirements');
  if (!s.health.sequelae.length) s = bumpFeat(s, 'retiredHealthy');
  const pro = f.pro;
  s = appendLog(s, `${extra ? `${extra} ` : ''}${REASON_TEXT[reason]} aos ${s.character.age} anos (cartel profissional ${pro.wins}-${pro.losses}-${pro.draws}).`);
  return s;
}

/** Volta da aposentadoria (evento). Mais risco: o corpo já não é o mesmo. */
export function unretire(state: GameState): GameState {
  if (!state.fighter.retired) return state;
  let s: GameState = { ...state, fighter: { ...state.fighter, retired: null }, flags: { ...state.flags, aposentado: false } };
  s = bumpFeat(s, 'comebacks');
  return appendLog(s, 'Você anunciou a volta aos ringues!');
}

/**
 * Checagens de aposentadoria forçada (depois de cada luta e na virada do ano):
 * - dano cerebral ≥ 80 → veto médico (aposentadoria definitiva);
 * - 6 derrotas seguidas com contrato, fora do ranking → a liga corta o contrato (segue em ligas menores);
 * - 8 derrotas seguidas → evento "hora de parar?";
 * - nova sequela grave (joelho/coluna/ombro) a partir dos 30 → evento do médico recomendando parar.
 */
export function checkForcedRetirement(state: GameState, content: GameContent): GameState {
  let s = state;
  if (s.fighter.retired || !s.alive) return s;
  if (s.health.brainDamage >= MEDICAL_VETO_BRAIN && hasFought(s)) {
    return completeRetirement(s, 'medica', 'Os exames neurológicos assustaram os médicos.');
  }
  const losses = s.feats.curLosses ?? 0;
  if (losses >= CONTRACT_CUT_LOSSES && s.fighter.orgId && !isRanked(s, content)) {
    const org = content.fighting.orgs.find((o) => o.id === s.fighter.orgId);
    s = leaveRankings(s, () => true);
    s = { ...s, fighter: { ...s.fighter, orgId: null, titles: [] }, economy: { ...s.economy, contract: null } };
    s = bumpFeat(s, 'contractCuts');
    s = appendLog(s, `Depois de ${losses} derrotas seguidas, ${org?.name ?? 'a liga'} cortou seu contrato. Dá para recomeçar em eventos menores.`);
  }
  const hooks = content.fighting.hooks;
  const pend = (id: string | undefined) => (id ? { ...s, pendingEvents: [...s.pendingEvents, { eventId: id, source: 'auto' as const }] } : s);
  if (losses >= STOP_EVENT_LOSSES && s.flags.pensou_parar_derrotas !== losses && hooks.losingStreakEventId) {
    s = { ...pend(hooks.losingStreakEventId), flags: { ...s.flags, pensou_parar_derrotas: losses } };
  }
  const threatening = s.health.sequelae.filter((id) => content.health.sequelae.find((d) => d.id === id)?.careerThreatening).length;
  if (threatening > 0 && s.character.age >= 32 && Number(s.flags.medico_parar ?? 0) < threatening && hooks.doctorRetireEventId) {
    s = { ...pend(hooks.doctorRetireEventId), flags: { ...s.flags, medico_parar: threatening } };
  }
  return s;
}
