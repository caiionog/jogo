/** Empresas: abrir, dedicar, gerente, expandir, vender; resultado anual e falência. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { nextEcoId, post, toMoney } from './ledger';
import type { MarketYear } from './market';
import type { Business, BusinessDef } from './types';

export const DEDICATE_COST = 2;
export const OPEN_CASH_SHARE = 0.2;
export const DIVIDEND_SHARE = 0.5;
export const MAX_LEVEL = 5;

export function businessDef(content: GameContent, id: string): BusinessDef | undefined {
  return content.economy.businesses.find((b) => b.id === id);
}

export function expandCost(def: BusinessDef, level: number): number {
  return toMoney(def.startCost * 0.6 * level);
}

/** Valor estimado de venda: caixa + 3× o lucro médio recente (nunca negativo). */
export function businessValue(b: Business): number {
  const recent = b.profits.slice(-3);
  const avg = recent.length ? recent.reduce((t, x) => t + x, 0) / recent.length : 0;
  return Math.max(0, toMoney(b.cash + 3 * Math.max(0, avg)));
}

export type BusinessBlockReason = 'dead' | 'busy' | 'too-young' | 'no-money' | 'no-energy' | 'max-level' | 'already';

export function openBlockReason(state: GameState, def: BusinessDef | undefined): BusinessBlockReason | null {
  if (!def) return 'already';
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < 18) return 'too-young';
  if (state.money < def.startCost) return 'no-money';
  return null;
}

export function openBusiness(state: GameState, defId: string, content: GameContent): GameState {
  const def = businessDef(content, defId);
  if (!def || openBlockReason(state, def) !== null) return state;
  let s: GameState;
  let id: string;
  [s, id] = nextEcoId(state, 'b');
  s = post(s, 'empresa', -def.startCost, `Abertura: ${def.name}`);
  const name = def.combat ? `Academia ${s.character.name.split(' ').slice(-1)[0]} Team` : def.name;
  const b: Business = { id, defId, name, level: 1, cash: toMoney(def.startCost * OPEN_CASH_SHARE), reputation: 40, manager: false, dedicatedYear: -1, years: 0, lastProfit: 0, profits: [] };
  s = { ...s, economy: { ...s.economy, businesses: [...s.economy.businesses, b] } };
  if (def.combat) s = { ...s, flags: { ...s.flags, academia_propria: true } };
  return appendLog(s, `Você abriu ${def.combat ? 'a sua própria academia' : 'um negócio'}: ${name}.`);
}

function update(state: GameState, id: string, fn: (b: Business) => Business): GameState {
  return { ...state, economy: { ...state.economy, businesses: state.economy.businesses.map((b) => (b.id === id ? fn(b) : b)) } };
}

export function dedicate(state: GameState, id: string): GameState {
  const b = state.economy.businesses.find((x) => x.id === id);
  if (!b || b.dedicatedYear === state.year || state.energy.current < DEDICATE_COST || state.pendingEvents.length || state.activeFight) return state;
  const s = update({ ...state, energy: { ...state.energy, current: state.energy.current - DEDICATE_COST } }, id, (x) => ({ ...x, dedicatedYear: state.year }));
  return appendLog(s, `Você se dedicou de perto à ${b.name} este ano.`);
}

export function setManager(state: GameState, id: string, manager: boolean): GameState {
  if (!state.economy.businesses.some((b) => b.id === id)) return state;
  return update(state, id, (b) => ({ ...b, manager }));
}

export function expandBusiness(state: GameState, id: string, content: GameContent): GameState {
  const b = state.economy.businesses.find((x) => x.id === id);
  const def = b ? businessDef(content, b.defId) : undefined;
  if (!b || !def || b.level >= MAX_LEVEL) return state;
  const cost = expandCost(def, b.level);
  if (state.money < cost) return state;
  const s = update(post(state, 'empresa', -cost, `Expansão: ${b.name}`), id, (x) => ({ ...x, level: x.level + 1 }));
  return appendLog(s, `Você expandiu ${b.name} (nível ${b.level + 1}).`);
}

export function injectCash(state: GameState, id: string, amount: number): GameState {
  const a = toMoney(amount);
  if (a <= 0 || a > state.money || !state.economy.businesses.some((b) => b.id === id)) return state;
  return update(post(state, 'empresa', -a, 'Aporte no caixa da empresa'), id, (b) => ({ ...b, cash: b.cash + a }));
}

export function sellBusiness(state: GameState, id: string, price?: number): GameState {
  const b = state.economy.businesses.find((x) => x.id === id);
  if (!b || state.activeFight) return state;
  const value = price ?? toMoney(businessValue(b) * 0.9);
  let s = post(state, 'venda_bens', value, `Venda: ${b.name}`);
  s = { ...s, economy: { ...s.economy, businesses: s.economy.businesses.filter((x) => x.id !== id) } };
  if (!s.economy.businesses.some((x) => x.defId === b.defId)) {
    const flags = { ...s.flags };
    if (b.defId === 'academia') delete flags.academia_propria;
    s = { ...s, flags };
  }
  return appendLog(s, `Você vendeu ${b.name} por R$ ${value.toLocaleString('pt-BR')}.`);
}

/** Bônus de treino por treinar na própria academia. */
export function ownGymBonus(state: GameState, content: GameContent): number {
  return state.economy.businesses.some((b) => businessDef(content, b.defId)?.combat) ? 0.1 : 0;
}

/** Fechamento: receita, custo, dividendos e falência. */
export function businessYear(state: GameState, rng: Rng, content: GameContent, market: MarketYear): GameState {
  let s = state;
  for (const b of state.economy.businesses) {
    const def = businessDef(content, b.defId);
    if (!def) continue;
    const dedicated = b.dedicatedYear === state.year;
    const care = dedicated ? 1.15 : b.manager ? 1 : 0.75;
    const ownerRep = def.combat ? s.fighter.reputation / 250 : 0;
    const revenue = def.revenue * b.level * (0.7 + b.reputation / 200 + ownerRep) * market.businessMult * (0.8 + rng.next() * 0.4) * care;
    const cost = def.cost * b.level + (b.manager ? def.managerCost : 0);
    const profit = toMoney(revenue - cost);
    let cash = b.cash + profit;
    const dividend = profit > 0 ? toMoney(profit * DIVIDEND_SHARE) : 0;
    cash -= dividend;
    if (dividend) s = post(s, 'empresa', dividend, `Lucro: ${b.name}`);
    if (cash < 0) {
      s = { ...s, economy: { ...s.economy, businesses: s.economy.businesses.filter((x) => x.id !== b.id) } };
      if (def.combat) {
        const flags = { ...s.flags };
        delete flags.academia_propria;
        s = { ...s, flags };
      }
      s = { ...s, flags: { ...s.flags, empresa_faliu: (Number(s.flags.empresa_faliu) || 0) + 1 } };
      s = appendLog(s, `${def.combat ? 'Sua academia' : `Sua empresa (${b.name})`} faliu.`);
      continue;
    }
    const reputation = Math.max(0, Math.min(100, b.reputation + (profit > 0 ? 2 : -3) + (dedicated ? 2 : 0)));
    s = update(s, b.id, (x) => ({ ...x, cash, reputation, years: x.years + 1, lastProfit: profit, profits: [...x.profits, profit].slice(-5) }));
    if (def.combat) s = { ...s, fighter: { ...s.fighter, reputation: Math.min(100, s.fighter.reputation + 1) } };
  }
  return s;
}
