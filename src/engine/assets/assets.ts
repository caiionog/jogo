import { cityDef, cityMultOf, ufDef } from '../geo';
/**
 * Bens: imóveis, veículos e luxo. O mercado do ano é calculado pelo seed (não ocupa o save).
 * Taxas de compra/venda garantem que comprar e vender no mesmo ano sempre dá prejuízo.
 */
import type { GameContent } from '../core/content';
import { createRng, seedToState } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { LOAN_TERMS, newLoan, priceInstallment } from '../economy/bank';
import { nextEcoId, post, toMoney } from '../economy/ledger';
import type { MarketYear } from '../economy/market';
import type { Asset, AssetDef, AssetKind } from '../economy/types';

/** Taxa paga na compra (sobre o preço). */
export const BUY_FEE: Record<AssetKind, number> = { imovel: 0.05, veiculo: 0.02, luxo: 0.0 };
/** Quanto do valor de mercado volta na venda. */
export const SELL_RECOVERY: Record<AssetKind, number> = { imovel: 0.94, veiculo: 0.85, luxo: 0.6 };
export const DEPRECIATION: Record<AssetKind, number> = { imovel: 0, veiculo: 0.12, luxo: 0.06 };
export const MAINTENANCE: Record<AssetKind, number> = { imovel: 0.01, veiculo: 0.03, luxo: 0 };
export const INSURANCE_RATE = 0.04;
export const RENT_YIELD = 0.05;
export const MIN_DOWN_PAYMENT = 0.2;
/** Parcela máxima do financiamento: 45% da renda do último ano. */
export const MAX_INSTALLMENT_SHARE = 0.45;

export interface Offer {
  id: string;
  defId: string;
  kind: AssetKind;
  name: string;
  price: number;
  /** Detalhes da vitrine (Etapa 8). */
  neighborhood?: string;
  size?: number;
  condition?: 'nova' | 'boa' | 'reformar';
  /** Aluguel anual estimado (imóveis). */
  rent?: number;
  /** Tendência do bairro (±% ao ano). */
  trend?: number;
  city?: string;
  uf?: string;
}

/** Lugar das ofertas (padrão: cidade atual). */
export interface MarketPlace {
  uf: string;
  city: string;
}

/** Valor máximo de item de luxo que menor de idade compra com o próprio dinheiro. */
export const TEEN_MAX_PRICE = 5000;
/** Reforma: custo sobre o valor e quanto valoriza. */
export const RENOVATION_COST = 0.08;
export const RENOVATION_GAIN = 0.12;
/** Desconto de quem compra para reformar; aluguel menor enquanto não reforma. */
export const NEEDS_RENOVATION_DISCOUNT = 0.15;
export const NEEDS_RENOVATION_RENT = 0.7;

export function cityMultiplier(state: GameState, content: GameContent): number {
  return cityMultOf(state, content);
}

/** O tipo de bem existe neste lugar? (casa de praia só no litoral; sítio fora da capital) */
export function availableAt(def: AssetDef, content: GameContent, place: MarketPlace): boolean {
  const uf = ufDef(content.geo, place.uf);
  if (def.where === 'litoral') return !!uf?.litoral;
  if (def.where === 'interior') return !!uf && uf.capital !== place.city;
  return true;
}

/** Ofertas do ano (determinísticas por seed + ano + cidade), com o preço ajustado ao custo de vida do lugar. */
export function marketOffers(state: GameState, content: GameContent, at?: MarketPlace): Offer[] {
  const place = at ?? { uf: state.character.uf, city: state.character.city };
  const here = place.uf === state.character.uf && place.city === state.character.city;
  const rng = createRng(seedToState(`${state.seed}:market:${state.year}:${here ? state.character.city : `${place.uf}/${place.city}`}`));
  const city = cityDef(content.geo, place.uf, place.city)?.custo ?? 1;
  const out: Offer[] = [];
  for (const def of content.economy.assets) {
    if (!availableAt(def, content, place)) continue;
    const n = def.kind === 'imovel' ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const [lo, hi] = def.price;
      const base = lo + rng.next() * (hi - lo);
      const variant = def.variants?.length ? rng.pick(def.variants) : '';
      const offer: Offer = { id: `${state.year}-${here ? '' : `${place.uf}-`}${def.id}-${i}`, defId: def.id, kind: def.kind, name: variant ? `${def.name} ${variant}` : def.name, price: 0, city: place.city, uf: place.uf };
      let price = def.kind === 'imovel' ? base * city : base;
      if (def.kind === 'imovel') {
        const roll = rng.next();
        offer.condition = roll < 0.2 ? 'nova' : roll < 0.75 ? 'boa' : 'reformar';
        if (offer.condition === 'reformar') price *= 1 - NEEDS_RENOVATION_DISCOUNT;
        if (offer.condition === 'nova') price *= 1.06;
        if (variant) offer.neighborhood = variant;
        if (def.size) offer.size = Math.round(def.size[0] + rng.next() * (def.size[1] - def.size[0]));
        offer.trend = Math.round((rng.next() - 0.45) * 0.03 * 1000) / 1000;
      }
      offer.price = toMoney(price / 100) * 100;
      if (def.kind === 'imovel' && !def.noRent) offer.rent = toMoney(offer.price * RENT_YIELD * (offer.condition === 'reformar' ? NEEDS_RENOVATION_RENT : 1));
      out.push(offer);
    }
  }
  return out.filter((o) => !state.economy.boughtOffers.includes(o.id));
}

export function buyCost(offer: Pick<Offer, 'price' | 'kind'>): number {
  return toMoney(offer.price * (1 + BUY_FEE[offer.kind]));
}

export function sellProceeds(asset: Pick<Asset, 'value' | 'kind'>): number {
  return toMoney(asset.value * SELL_RECOVERY[asset.kind]);
}

export interface FinancingQuote {
  downPayment: number;
  loan: number;
  years: number;
  rate: number;
  installment: number;
  totalCost: number;
}

/** Simulação de financiamento: entrada (≥ 20% + taxas), parcela e custo total com juros. */
export function financingQuote(offer: Offer, years: number, downShare = MIN_DOWN_PAYMENT): FinancingQuote | null {
  if (offer.kind === 'luxo') return null;
  const kind = offer.kind === 'imovel' ? 'imobiliario' : 'veiculo';
  const t = LOAN_TERMS[kind];
  const y = Math.max(1, Math.min(t.maxYears, years));
  const fee = buyCost(offer) - offer.price;
  const down = toMoney(offer.price * Math.max(MIN_DOWN_PAYMENT, downShare)) + fee;
  const loan = buyCost(offer) - down;
  const installment = priceInstallment(loan, t.rate, y);
  let balance = loan;
  let total = down;
  for (let i = 0; i < y; i++) {
    const interest = toMoney(balance * t.rate);
    const pay = i === y - 1 ? balance + interest : Math.min(installment, balance + interest);
    total += pay;
    balance = balance + interest - pay;
  }
  return { downPayment: down, loan, years: y, rate: t.rate, installment, totalCost: total };
}

export type BuyBlockReason = 'dead' | 'busy' | 'too-young' | 'no-money' | 'income' | 'credit' | 'not-found';

export function buyBlockReason(state: GameState, offer: Offer | undefined, financed: boolean, years = 20): BuyBlockReason | null {
  if (!offer) return 'not-found';
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length || state.activeFight) return 'busy';
  // menor de idade: só luxo barato, à vista, com o próprio dinheiro
  if (state.character.age < 18 && (financed || offer.kind !== 'luxo' || offer.price > TEEN_MAX_PRICE)) return 'too-young';
  if (!financed) return state.money >= buyCost(offer) ? null : 'no-money';
  const q = financingQuote(offer, years);
  if (!q) return 'not-found';
  // crédito negado com dívida em atraso ou falência recente
  if (state.economy.debt > 0 || state.flags.falencia) return 'credit';
  if (state.money < q.downPayment) return 'no-money';
  if (q.installment > state.economy.lastIncome * MAX_INSTALLMENT_SHARE) return 'income';
  return null;
}

/** Compra à vista ou financiada. */
export function buyAsset(state: GameState, offerId: string, content: GameContent, opts: { financed?: boolean; years?: number; place?: MarketPlace } = {}): GameState {
  const offer = marketOffers(state, content, opts.place).find((o) => o.id === offerId);
  const financed = !!opts.financed && offer?.kind !== 'luxo';
  const years = opts.years ?? (offer?.kind === 'imovel' ? 20 : 5);
  if (!offer || buyBlockReason(state, offer, financed, years) !== null) return state;
  let s: GameState;
  let id: string;
  [s, id] = nextEcoId(state, 'a');
  const cost = buyCost(offer);
  let loanId: string | undefined;
  if (financed) {
    const q = financingQuote(offer, years)!;
    s = post(s, 'compras', -q.downPayment, `Entrada: ${offer.name}`);
    const kind = offer.kind === 'imovel' ? 'imobiliario' : 'veiculo';
    const [s2, loan] = newLoan(s, kind, q.loan, years, `Financiamento: ${offer.name}`, id);
    s = s2;
    loanId = loan.id;
  } else {
    s = post(s, 'compras', -cost, `Compra: ${offer.name}`);
  }
  const asset: Asset = {
    id,
    kind: offer.kind,
    catalogId: offer.defId,
    name: offer.name,
    value: offer.price,
    paid: cost,
    boughtYear: s.year,
    ...(loanId ? { loanId } : {}),
    ...(offer.condition ? { condition: offer.condition } : {}),
    ...(offer.trend !== undefined ? { trend: offer.trend } : {}),
    ...(offer.city ? { city: offer.city, uf: offer.uf } : {}),
  };
  s = { ...s, economy: { ...s.economy, assets: [...s.economy.assets, asset], boughtOffers: [...s.economy.boughtOffers, offer.id] } };
  const article = assetDef(content, offer.defId)?.article ?? 'um';
  const name = /^.[a-zà-ú]/.test(offer.name) ? offer.name[0]!.toLowerCase() + offer.name.slice(1) : offer.name;
  const where = offer.city ? ` em ${offer.city}` : '';
  return appendLog(s, `Você comprou ${article} ${name}${where} por R$ ${offer.price.toLocaleString('pt-BR')}${financed ? ' (financiado)' : ''}.`);
}

/** Venda: recebe o valor menos a taxa e quita o financiamento vinculado. */
export function sellAsset(state: GameState, assetId: string, ratio?: number): GameState {
  const asset = state.economy.assets.find((a) => a.id === assetId);
  if (!asset || state.activeFight) return state;
  const proceeds = ratio !== undefined ? toMoney(asset.value * ratio) : sellProceeds(asset);
  let s = post(state, 'venda_bens', proceeds, `Venda: ${asset.name}`);
  const loan = asset.loanId ? s.economy.loans.find((l) => l.id === asset.loanId) : undefined;
  if (loan) {
    s = post(s, 'parcelas', -loan.balance, `Quitação do financiamento: ${asset.name}`);
    s = { ...s, economy: { ...s.economy, loans: s.economy.loans.filter((l) => l.id !== loan.id) } };
  }
  s = { ...s, economy: { ...s.economy, assets: s.economy.assets.filter((a) => a.id !== assetId) } };
  if (asset.home) s = { ...s, economy: { ...s.economy, housing: 'aluguel' } };
  return appendLog(s, `Você vendeu ${asset.name} por R$ ${proceeds.toLocaleString('pt-BR')}.`);
}

function updateAsset(state: GameState, id: string, fn: (a: Asset) => Asset): GameState {
  return { ...state, economy: { ...state.economy, assets: state.economy.assets.map((a) => (a.id === id ? fn(a) : a)) } };
}

/** Morar no imóvel (vira a casa própria; deixa de estar alugado). */
export function setHome(state: GameState, assetId: string): GameState {
  const asset = state.economy.assets.find((a) => a.id === assetId);
  if (!asset || asset.kind !== 'imovel' || asset.catalogId === 'sala_comercial') return state;
  let s: GameState = { ...state, economy: { ...state.economy, assets: state.economy.assets.map((a) => ({ ...a, home: a.id === assetId, ...(a.id === assetId ? { rented: false } : {}) })), housing: 'propria' } };
  s = appendLog(s, `Você se mudou para ${asset.name}.`);
  return s;
}

export function setRented(state: GameState, assetId: string, rented: boolean, content?: GameContent): GameState {
  const asset = state.economy.assets.find((a) => a.id === assetId);
  if (!asset || asset.kind !== 'imovel' || (rented && asset.home)) return state;
  if (rented && content && assetDef(content, asset.catalogId)?.noRent) return state;
  return updateAsset(state, assetId, (a) => ({ ...a, rented }));
}

export function setInsured(state: GameState, assetId: string, insured: boolean): GameState {
  const asset = state.economy.assets.find((a) => a.id === assetId);
  if (!asset || asset.kind !== 'veiculo') return state;
  return updateAsset(state, assetId, (a) => ({ ...a, insured }));
}

export type RenovateBlockReason = 'not-found' | 'busy' | 'already' | 'no-money';

export function renovationCost(asset: Asset): number {
  return toMoney(asset.value * RENOVATION_COST);
}

export function renovateBlockReason(state: GameState, assetId: string): RenovateBlockReason | null {
  const a = state.economy.assets.find((x) => x.id === assetId);
  if (!a || a.kind !== 'imovel') return 'not-found';
  if (state.pendingEvents.length || state.activeFight) return 'busy';
  if (a.renovatedYear === state.year) return 'already';
  if (state.money < renovationCost(a)) return 'no-money';
  return null;
}

/** Reformar: custo de 8% do valor, valoriza 12% e o imóvel fica "bom" (aluguel cheio). Uma vez por ano. */
export function renovateAsset(state: GameState, assetId: string): GameState {
  if (renovateBlockReason(state, assetId) !== null) return state;
  const a = state.economy.assets.find((x) => x.id === assetId)!;
  const cost = renovationCost(a);
  let s = post(state, 'manutencao', -cost, `Reforma: ${a.name}`);
  s = updateAsset(s, assetId, (x) => ({ ...x, value: toMoney(x.value * (1 + RENOVATION_GAIN)), condition: x.condition === 'reformar' ? 'boa' : 'nova', renovatedYear: s.year }));
  return appendLog(s, `Você reformou ${a.name} (R$ ${cost.toLocaleString('pt-BR')}).`);
}

export function assetDef(content: GameContent, id: string): AssetDef | undefined {
  return content.economy.assets.find((d) => d.id === id);
}

/** Fechamento do ano dos bens: aluguel, manutenção, seguro, felicidade/status, valorização/depreciação. */
export function assetsYear(state: GameState, rng: Rng, content: GameContent, market: MarketYear): GameState {
  let s = state;
  let happiness = 0;
  let reputation = 0;
  for (const a of s.economy.assets) {
    const def = assetDef(content, a.catalogId);
    if (a.rented) {
      if (rng.chance(0.15)) s = appendLog(s, `${a.name} ficou sem inquilino este ano.`);
      else s = post(s, 'aluguel_recebido', a.value * RENT_YIELD * (a.condition === 'reformar' ? NEEDS_RENOVATION_RENT : 1), `Aluguel: ${a.name}`);
    }
    const maint = toMoney(a.value * MAINTENANCE[a.kind]);
    if (maint) s = post(s, 'manutencao', -maint, `Manutenção: ${a.name}`);
    if (a.insured) s = post(s, 'manutencao', -a.value * INSURANCE_RATE, `Seguro: ${a.name}`);
    happiness += def?.happiness ?? 0;
    reputation += def?.reputation ?? 0;
  }
  // valorização e depreciação (depois das cobranças do ano)
  s = {
    ...s,
    economy: {
      ...s.economy,
      assets: s.economy.assets.map((a) => {
        const growth = a.kind === 'imovel' ? market.propertyGrowth + (a.trend ?? 0) + (rng.next() - 0.5) * 0.04 : -DEPRECIATION[a.kind];
        return { ...a, value: Math.max(0, toMoney(a.value * (1 + growth))) };
      }),
    },
  };
  if (happiness) s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: Math.min(8, happiness) }) } };
  if (reputation) s = { ...s, fighter: { ...s.fighter, reputation: Math.min(100, s.fighter.reputation + Math.min(3, reputation)) } };
  return s;
}

export function propertyValue(state: GameState): number {
  return state.economy.assets.filter((a) => a.kind === 'imovel').reduce((t, a) => t + a.value, 0);
}

/** Remove um bem sem pagar nada (roubo sem seguro, perda total). */
export function loseAsset(state: GameState, assetId: string, reason: string): GameState {
  const asset = state.economy.assets.find((a) => a.id === assetId);
  if (!asset) return state;
  const s = { ...state, economy: { ...state.economy, assets: state.economy.assets.filter((a) => a.id !== assetId) } };
  return appendLog(s, `${reason}: você perdeu ${asset.name}.`);
}
