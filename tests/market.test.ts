import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { GameState } from '../src/engine';
import {
  LOAN_TERMS, buyAsset, buyBlockReason, buyBusiness, businessOffers, cityDef, closeEconomicYear, createRng, financingQuote,
  marketOffers, priceInstallment, renameBusiness, renovateAsset, sellAsset, sellBusiness, setRented, toMoney,
} from '../src/engine';
import { adult, ledgerOk } from './ecoHelpers';

const C = GAME_CONTENT;
const inCity = (s: GameState, uf: string, city: string): GameState => ({ ...s, character: { ...s.character, uf, city } });

describe('mercado de bens (Etapa 8)', () => {
  it('ofertas determinísticas pelo seed e coerentes com a UF: casa de praia só no litoral, sítio fora da capital', () => {
    const sp = inCity(adult(30), 'SP', 'Santos');
    expect(marketOffers(sp, C)).toEqual(marketOffers(sp, C));
    expect(marketOffers(sp, C).some((o) => o.defId === 'casa_praia')).toBe(true);
    expect(marketOffers(sp, C).some((o) => o.defId === 'sitio')).toBe(true);
    const go = inCity(adult(30), 'GO', 'Goiânia');
    expect(marketOffers(go, C).some((o) => o.defId === 'casa_praia')).toBe(false);
    expect(marketOffers(go, C).some((o) => o.defId === 'sitio')).toBe(false); // capital
    const mg = inCity(adult(30), 'MG', 'Uberlândia');
    expect(marketOffers(mg, C).some((o) => o.defId === 'casa_praia')).toBe(false);
    // ver ofertas de outra cidade sem se mudar
    expect(marketOffers(go, C, { uf: 'BA', city: 'Salvador' }).some((o) => o.defId === 'casa_praia')).toBe(true);
  });

  it('preço dos imóveis usa o multiplicador de custo de vida da cidade', () => {
    for (const [uf, city] of [['SP', 'São Paulo'], ['PI', 'Teresina'], ['GO', 'Goiânia']] as const) {
      const mult = cityDef(C.geo, uf, city)!.custo;
      for (const o of marketOffers(inCity(adult(30), uf, city), C).filter((x) => x.kind === 'imovel')) {
        const def = C.economy.assets.find((d) => d.id === o.defId)!;
        expect(o.price).toBeGreaterThanOrEqual(Math.floor(def.price[0] * mult * 0.85) - 100);
        expect(o.price).toBeLessThanOrEqual(Math.ceil(def.price[1] * mult * 1.06) + 100);
      }
    }
  });

  it('bloqueios: idade (menor só luxo barato), dinheiro e crédito', () => {
    const teen = { ...adult(16, 10000), character: { ...adult(16).character, age: 16 } };
    const offers = marketOffers(teen, C);
    const cheap = offers.find((o) => o.defId === 'bone_grife')!;
    expect(buyBlockReason(teen, cheap, false)).toBeNull();
    expect(buyBlockReason(teen, offers.find((o) => o.kind === 'imovel'), false)).toBe('too-young');
    expect(buyBlockReason(teen, offers.find((o) => o.defId === 'relogio'), false)).toBe('too-young');
    const broke = adult(30, 1000);
    expect(buyBlockReason(broke, marketOffers(broke, C).find((o) => o.kind === 'imovel'), false)).toBe('no-money');
    const indebted = { ...adult(30, 900000), economy: { ...adult(30, 900000).economy, debt: 5000 } };
    expect(buyBlockReason(indebted, marketOffers(indebted, C).find((o) => o.kind === 'imovel'), true)).toBe('credit');
  });

  it('custo total do financiamento = entrada + parcelas (Price) com juros', () => {
    const s = adult(30, 500000);
    const offer = marketOffers(s, C).find((o) => o.defId === 'apartamento')!;
    const q = financingQuote(offer, 20)!;
    const t = LOAN_TERMS.imobiliario;
    expect(q.installment).toBe(priceInstallment(q.loan, t.rate, 20));
    let balance = q.loan;
    let total = q.downPayment;
    for (let i = 0; i < 20; i++) {
      const interest = toMoney(balance * t.rate);
      const pay = i === 19 ? balance + interest : Math.min(q.installment, balance + interest);
      total += pay;
      balance += interest - pay;
    }
    expect(q.totalCost).toBe(total);
    expect(q.totalCost).toBeGreaterThan(offer.price);
  });

  it('comprar e vender no mesmo ano sempre dá prejuízo (com ou sem reforma)', () => {
    const base = adult(30, 5_000_000);
    for (const offer of marketOffers(base, C)) {
      let s = buyAsset(base, offer.id, C);
      const a = s.economy.assets.at(-1)!;
      if (a.kind === 'imovel') s = renovateAsset(s, a.id);
      s = sellAsset(s, a.id);
      expect(s.money).toBeLessThan(base.money);
      expect(ledgerOk(s)).toBe(true);
    }
  });

  it('aluguel e manutenção dos imóveis e lucro dos empreendimentos entram no extrato do ano', () => {
    let s = adult(30, 2_000_000);
    const apt = marketOffers(s, C).find((o) => o.defId === 'apartamento')!;
    s = buyAsset(s, apt.id, C);
    s = setRented(s, s.economy.assets.at(-1)!.id, true, C);
    const biz = businessOffers(s, C).find((b) => b.status === 'fiel') ?? businessOffers(s, C)[0]!;
    s = buyBusiness(s, biz.id, C);
    expect(s.economy.businesses).toHaveLength(1);
    // novo ano: o extrato começa depois das compras
    s = { ...s, economy: { ...s.economy, ledger: { ...s.economy.ledger, opening: s.money, entries: [] }, businesses: s.economy.businesses.map((b) => ({ ...b, manager: true, reputation: 90, level: 3 })) } };
    let rent = 0;
    let maint = 0;
    let profit = 0;
    for (let i = 0; i < 6; i++) {
      const r = closeEconomicYear(s, createRng(i), C);
      const year = r.economy.history.at(-1)!;
      rent += year.totals.aluguel_recebido ?? 0;
      maint += year.totals.manutencao ?? 0;
      profit += year.totals.empresa ?? 0;
    }
    expect(rent).toBeGreaterThan(0);
    expect(maint).toBeLessThan(0);
    expect(profit).toBeGreaterThan(0);
  });

  it('empreendimentos: ofertas determinísticas, compra pelo extrato, renomear e vender', () => {
    const s0 = adult(30, 1_000_000);
    expect(businessOffers(s0, C)).toEqual(businessOffers(s0, C));
    const o = businessOffers(s0, C)[0]!;
    expect(o.price).toBeGreaterThan(0);
    expect(['baixo', 'medio', 'alto']).toContain(o.risk);
    let s = buyBusiness(s0, o.id, C);
    expect(s.money).toBe(s0.money - o.price);
    expect(ledgerOk(s)).toBe(true);
    expect(businessOffers(s, C).some((x) => x.id === o.id)).toBe(false);
    const id = s.economy.businesses[0]!.id;
    s = renameBusiness(s, id, 'Meu Negócio');
    expect(s.economy.businesses[0]!.name).toBe('Meu Negócio');
    expect(s.log.at(-1)!.entries.some((e) => e.includes('Você comprou'))).toBe(true);
    s = sellBusiness(s, id);
    expect(s.economy.businesses).toHaveLength(0);
    expect(s.money).toBeLessThan(s0.money);
  });
});
