/** Renda da luta: empresário, contrato com a liga e patrocínios (com cláusulas). */
import { fameAsRep } from '../fame/fame';
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { post, toMoney } from './ledger';
import type { SponsorDef } from './types';

export const AGENT_PURSE_BONUS = 0.2;
export const AGENT_CUT = 0.15;
export const CONTRACT_FIGHTS = 4;

export function hireAgent(state: GameState, rng: Rng, content: GameContent): GameState {
  if (state.economy.agent) return state;
  const name = rng.pick(content.economy.agents);
  const s = { ...state, economy: { ...state.economy, agent: { name, cut: AGENT_CUT } } };
  return appendLog(s, `${name} agora é seu empresário (${Math.round(AGENT_CUT * 100)}% de comissão).`);
}

export function fireAgent(state: GameState): GameState {
  if (!state.economy.agent) return state;
  return appendLog({ ...state, economy: { ...state.economy, agent: null } }, `Você dispensou o empresário ${state.economy.agent.name}.`);
}

/** Multiplicador das bolsas (empresário negocia mais). */
export function purseMultiplier(state: GameState): number {
  return state.economy.agent ? 1 + AGENT_PURSE_BONUS : 1;
}

/** Lança a bolsa da luta e a comissão do empresário. */
export function payFightPurse(state: GameState, earnings: number, label: string): GameState {
  let s = post(state, 'luta', earnings, label);
  const agent = s.economy.agent;
  if (agent && earnings > 0) s = post(s, 'agente', -toMoney(earnings * agent.cut), `Comissão: ${agent.name}`);
  return s;
}

/** Contrato com a liga ao assinar (organizações com ranking). */
export function startContract(state: GameState, orgId: string, basePurse: number): GameState {
  return { ...state, economy: { ...state.economy, contract: { orgId, fightsLeft: CONTRACT_FIGHTS, basePurse: toMoney(basePurse), wins: 0, losses: 0 } } };
}

/** Conta uma luta no contrato e renova ao fim (bolsa base sobe com bom aproveitamento). */
export function countContractFight(state: GameState, orgId: string, result: 'W' | 'L' | 'D'): GameState {
  const c = state.economy.contract;
  if (!c || c.orgId !== orgId) return state;
  const next = { ...c, fightsLeft: c.fightsLeft - 1, wins: c.wins + (result === 'W' ? 1 : 0), losses: c.losses + (result === 'L' ? 1 : 0) };
  if (next.fightsLeft > 0) return { ...state, economy: { ...state.economy, contract: next } };
  const good = next.wins / Math.max(1, next.wins + next.losses) >= 0.6;
  const basePurse = toMoney(c.basePurse * (good ? 1.3 : 0.9));
  const s = { ...state, economy: { ...state.economy, contract: { orgId, fightsLeft: CONTRACT_FIGHTS, basePurse, wins: 0, losses: 0 } } };
  return appendLog(s, `Contrato renovado por mais ${CONTRACT_FIGHTS} lutas: bolsa base de R$ ${basePurse.toLocaleString('pt-BR')}${good ? ' (aumento!)' : ' (redução)'}.`);
}

export function sponsorDef(content: GameContent, id: string): SponsorDef | undefined {
  return content.economy.sponsors.find((x) => x.id === id);
}

/** Patrocinadores disponíveis para a reputação atual (que ainda não patrocinam). */
export function eligibleSponsors(state: GameState, content: GameContent): SponsorDef[] {
  const have = new Set(state.economy.sponsors.map((x) => x.sponsorId));
  return content.economy.sponsors.filter((x) => x.minReputation <= fameAsRep(state) && !have.has(x.id)).sort((a, b) => b.amount - a.amount);
}

export function signSponsor(state: GameState, content: GameContent, id?: string): GameState {
  if (state.fighter.suspendedYears > 0) return state;
  const def = id ? sponsorDef(content, id) : eligibleSponsors(state, content)[0];
  if (!def || state.economy.sponsors.some((x) => x.sponsorId === def.id)) return state;
  const s = { ...state, economy: { ...state.economy, sponsors: [...state.economy.sponsors, { sponsorId: def.id, yearsLeft: def.years, amount: def.amount }] } };
  return appendLog(s, `Você fechou patrocínio com a ${def.brand}: R$ ${def.amount.toLocaleString('pt-BR')} por ano durante ${def.years} anos.`);
}

/** Derrotas seguidas no fim do histórico. */
export function lossStreak(state: GameState): number {
  let n = 0;
  for (let i = state.fighter.history.length - 1; i >= 0; i--) {
    const r = state.fighter.history[i]!.result;
    if (r === 'L') n++;
    else if (r === 'W') break;
  }
  return n;
}

/** Cláusulas: derrotas seguidas e escândalos cancelam patrocínios. */
export function checkSponsorClauses(state: GameState, content: GameContent, scandal = false): GameState {
  const streak = lossStreak(state);
  let s = state;
  const keep = [];
  for (const deal of s.economy.sponsors) {
    const def = sponsorDef(content, deal.sponsorId);
    if (!def) continue;
    if (streak >= def.maxLossStreak) s = appendLog(s, `A ${def.brand} cancelou o patrocínio depois de ${streak} derrotas seguidas.`);
    else if (scandal && def.scandal) s = appendLog(s, `A ${def.brand} rompeu o contrato por causa do escândalo.`);
    else keep.push(deal);
  }
  return { ...s, economy: { ...s.economy, sponsors: keep } };
}

/** Fechamento: paga os patrocínios e conta os anos restantes. */
export function sponsorsYear(state: GameState, content: GameContent): GameState {
  let s = state;
  if (s.fighter.suspendedYears > 0) s = checkSponsorClauses(s, content, true);
  const keep = [];
  for (const deal of s.economy.sponsors) {
    const def = sponsorDef(content, deal.sponsorId);
    s = post(s, 'patrocinio', deal.amount, `Patrocínio: ${def?.brand ?? deal.sponsorId}`);
    if (deal.yearsLeft > 1) keep.push({ ...deal, yearsLeft: deal.yearsLeft - 1 });
    else s = appendLog(s, `O contrato de patrocínio com a ${def?.brand ?? deal.sponsorId} terminou.`);
  }
  return { ...s, economy: { ...s.economy, sponsors: keep } };
}
