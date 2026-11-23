/** Empresas: abrir, dedicar, gerente, expandir, vender; resultado anual e falência. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { nextEcoId, post, toMoney } from './ledger';
import type { MarketYear } from './market';
import type { Business, BusinessDef } from './types';
import { createRng, seedToState } from '../core/rng';
import { cityDef } from '../geo';

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
  const name = def.combat ? `Academia ${s.character.name.split(' ').slice(-1)[0]} Team` : def.open === 'franquia' ? `${def.name} (franquia)` : def.name;
  const b: Business = { id, defId, name, level: 1, cash: toMoney(def.startCost * OPEN_CASH_SHARE), reputation: 40, manager: false, dedicatedYear: -1, years: 0, lastProfit: 0, profits: [] };
  s = { ...s, economy: { ...s.economy, businesses: [...s.economy.businesses, b] } };
  if (def.combat) s = { ...s, flags: { ...s.flags, academia_propria: true } };
  s = { ...s, feats: { ...s.feats, businessesOpened: (s.feats?.businessesOpened ?? 0) + 1 } };
  return appendLog(s, `Você abriu ${def.combat ? 'a sua própria academia' : 'um negócio'}: ${name}.`);
}

// ---------------------------------------------------------------------------
// Mercado de empreendimentos (Etapa 8)
// ---------------------------------------------------------------------------

export type BusinessState = 'reforma' | 'regular' | 'fiel';

export interface BusinessOffer {
  id: string;
  defId: string;
  name: string;
  /** Preço pedido (R$), com o custo de vida do lugar. */
  price: number;
  level: number;
  /** Clientela/estado: precisa de reforma, regular, clientela fiel. */
  status: BusinessState;
  reputation: number;
  cash: number;
  /** Faturamento e lucro anuais estimados (ano normal, com gerente). */
  revenue: number;
  /** Lucro estimado com gerente contratado. */
  profit: number;
  /** Lucro estimado gerenciando de perto (sem gerente, com energia). */
  profitOwner: number;
  risk: 'baixo' | 'medio' | 'alto';
  city: string;
  uf: string;
}

/** Faturamento esperado (ano normal, dono com gerente). */
export function expectedRevenue(def: BusinessDef, level: number, reputation: number): number {
  return toMoney(def.revenue * level * (0.7 + reputation / 200));
}

/** Negócios existentes à venda na cidade (determinísticos por seed + ano + lugar). */
export function businessOffers(state: GameState, content: GameContent, at?: { uf: string; city: string }): BusinessOffer[] {
  const place = at ?? { uf: state.character.uf, city: state.character.city };
  const rng = createRng(seedToState(`${state.seed}:negocios:${state.year}:${place.uf}/${place.city}`));
  const mult = cityDef(content.geo, place.uf, place.city)?.custo ?? 1;
  const out: BusinessOffer[] = [];
  for (const def of content.economy.businesses) {
    if (!def.forSale || !rng.chance(0.8)) continue;
    const roll = rng.next();
    const status: BusinessState = roll < 0.3 ? 'reforma' : roll < 0.75 ? 'regular' : 'fiel';
    const reputation = status === 'reforma' ? rng.int(20, 35) : status === 'regular' ? rng.int(40, 55) : rng.int(65, 80);
    const level = status === 'fiel' && rng.chance(0.4) ? 2 : 1;
    const revenue = expectedRevenue(def, level, reputation);
    const profit = toMoney(revenue - def.cost * level - def.managerCost);
    const profitOwner = toMoney(revenue * 1.1 - def.cost * level);
    const factor = status === 'reforma' ? 0.7 : status === 'regular' ? 1 : 1.35;
    const price = toMoney((def.startCost * level * factor * mult * (0.9 + rng.next() * 0.25)) / 1000) * 1000;
    const name = def.saleNames?.length ? rng.pick(def.saleNames) : def.name;
    const id = `${state.year}-${place.uf}-${def.id}`;
    if (state.economy.boughtOffers.includes(id)) continue;
    out.push({ id, defId: def.id, name, price, level, status, reputation, cash: toMoney(def.startCost * OPEN_CASH_SHARE), revenue, profit, profitOwner, risk: def.risk ?? 'medio', city: place.city, uf: place.uf });
  }
  return out;
}

export function buyBusinessBlockReason(state: GameState, offer: BusinessOffer | undefined): BusinessBlockReason | null {
  if (!offer) return 'already';
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < 18) return 'too-young';
  if (state.money < offer.price) return 'no-money';
  return null;
}

/** Compra um negócio que já existe: herda nível, clientela e um pouco de caixa. */
export function buyBusiness(state: GameState, offerId: string, content: GameContent, at?: { uf: string; city: string }): GameState {
  const offer = businessOffers(state, content, at).find((o) => o.id === offerId);
  const def = offer ? businessDef(content, offer.defId) : undefined;
  if (!offer || !def || buyBusinessBlockReason(state, offer) !== null) return state;
  let s: GameState;
  let id: string;
  [s, id] = nextEcoId(state, 'b');
  s = post(s, 'empresa', -offer.price, `Compra: ${offer.name}`);
  const b: Business = { id, defId: def.id, name: offer.name, level: offer.level, cash: offer.cash, reputation: offer.reputation, manager: false, dedicatedYear: -1, years: 0, lastProfit: 0, profits: [] };
  s = { ...s, economy: { ...s.economy, businesses: [...s.economy.businesses, b], boughtOffers: [...s.economy.boughtOffers, offer.id] } };
  if (def.combat) s = { ...s, flags: { ...s.flags, academia_propria: true } };
  s = { ...s, feats: { ...s.feats, businessesOpened: (s.feats?.businessesOpened ?? 0) + 1 } };
  return appendLog(s, `Você comprou ${offer.name} em ${offer.city} por R$ ${offer.price.toLocaleString('pt-BR')}.`);
}

/** Renomear o negócio (só o nome muda). */
export function renameBusiness(state: GameState, id: string, name: string): GameState {
  const n = name.trim().slice(0, 40);
  if (!n || !state.economy.businesses.some((b) => b.id === id)) return state;
  return update(state, id, (b) => ({ ...b, name: n }));
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
  if (!state.economy.businesses.some((b) => businessDef(content, b.defId)?.combat)) return 0;
  // academia da família herdada: +5% por geração (máx. +20%)
  const gens = state.feats?.gymGenerations ?? 0;
  return 0.1 + Math.min(content.legacy.gymBonusMax, gens * content.legacy.gymBonusPerGen);
}

/** Fechamento: receita, custo, dividendos e falência. */
export function businessYear(state: GameState, rng: Rng, content: GameContent, market: MarketYear): GameState {
  let s = state;
  for (const b of state.economy.businesses) {
    const def = businessDef(content, b.defId);
    if (!def) continue;
    const dedicated = b.dedicatedYear === state.year;
    const care = dedicated ? 1.1 : b.manager ? 1 : 0.75;
    const ownerRep = def.combat ? s.fighter.reputation / 250 : 0;
    const revenue = def.revenue * b.level * (0.7 + b.reputation / 200 + ownerRep) * market.businessMult * (0.72 + rng.next() * 0.56) * care;
    const cost = def.cost * b.level + (b.manager ? def.managerCost : 0);
    const profit = toMoney(revenue - cost);
    let cash = b.cash + profit;
    const dividend = profit > 0 ? toMoney(profit * DIVIDEND_SHARE) : 0;
    cash -= dividend;
    if (dividend) s = post(s, 'empresa', dividend, `Lucro: ${b.name}`);
    if (cash < 0 && s.money >= -cash && (b.lastProfit >= 0 || b.years < 2)) {
      // o dono cobre um ano ruim do próprio bolso (fica no extrato); dois anos seguidos no vermelho (depois dos 2
      // primeiros anos, de carência) ou sem dinheiro para cobrir, o negócio quebra
      const cover = -cash;
      s = post(s, 'empresa', -cover, `Cobriu o prejuízo: ${b.name}`);
      s = appendLog(s, `Você tirou R$ ${cover.toLocaleString('pt-BR')} do bolso para cobrir o prejuízo de ${b.name}.`);
      cash = 0;
    }
    if (cash < 0) {
      s = { ...s, economy: { ...s.economy, businesses: s.economy.businesses.filter((x) => x.id !== b.id) } };
      if (def.combat) {
        const flags = { ...s.flags };
        delete flags.academia_propria;
        s = { ...s, flags };
      }
      s = { ...s, flags: { ...s.flags, empresa_faliu: (Number(s.flags.empresa_faliu) || 0) + 1 } };
      const scrap = toMoney(def.startCost * b.level * 0.25);
      if (scrap > 0) s = post(s, 'empresa', scrap, `Venda dos equipamentos: ${b.name}`);
      s = appendLog(s, `${def.combat ? 'Sua academia' : `Sua empresa (${b.name})`} faliu.${scrap > 0 ? ` A venda dos equipamentos rendeu R$ ${scrap.toLocaleString('pt-BR')}.` : ''}`);
      continue;
    }
    const reputation = Math.max(0, Math.min(100, b.reputation + (profit > 0 ? 2 : -3) + (dedicated ? 2 : 0)));
    s = update(s, b.id, (x) => ({ ...x, cash, reputation, years: x.years + 1, lastProfit: profit, profits: [...x.profits, profit].slice(-5) }));
    if (def.combat) s = { ...s, fighter: { ...s.fighter, reputation: Math.min(100, s.fighter.reputation + 1) } };
  }
  return s;
}
