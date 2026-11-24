/**
 * Carreiras exclusivas (release 0.0.4): lutador profissional (contrato com organização) é carreira de tempo integral.
 * Com contrato, não dá para ter emprego comum (só os ligados à luta), prestar concurso, entrar na polícia nem jogar
 * futebol profissional. Assinar com uma organização encerra essas outras carreiras.
 */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { jobDef } from '../economy/jobs';
import { leavePolice } from '../police/career';

export function isProFighter(state: GameState): boolean {
  return !!state.fighter.orgId && !state.fighter.retired;
}

/** Antes de assinar com uma organização: sai do emprego comum, do futebol e da polícia. */
export function leaveOtherCareersForFighting(state: GameState, content: GameContent): GameState {
  let s = state;
  if (s.police.career) s = leavePolice(appendLog(s, 'Você pediu exoneração da polícia para lutar profissionalmente.'), 'pedido', content);
  const def = jobDef(content, s.economy.job?.jobId);
  if (s.economy.job && def?.category !== 'luta') s = appendLog({ ...s, economy: { ...s.economy, job: null } }, `Você deixou o emprego${def ? ` (${def.title.toLowerCase()})` : ''} para lutar profissionalmente.`);
  if (s.football && s.football.stage !== 'aposentado') s = appendLog({ ...s, football: { ...s.football, stage: 'aposentado', contract: null, offers: [] } }, 'Você largou o futebol para seguir na luta.');
  return s;
}
