import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  DEBT_RATE,
  acceptOffer,
  advanceYear,
  applyJob,
  autoFinishFight,
  buyAsset,
  buyCost,
  closeEconomicYear,
  closeFight,
  createRng,
  currentPartner,
  debtYear,
  deposit,
  enterGym,
  gymsInCity,
  incomeTax,
  interact,
  loanTotalCost,
  marketOffers,
  marketYear,
  meetSomeone,
  newGame,
  newLoan,
  openBusiness,
  payLoans,
  performAction,
  personalLoan,
  resolveEvent,
  sellAsset,
  trainFighter,
  withdraw,
} from '../src/engine';
import type { GameState } from '../src/engine';
import { adult, ledgerOk } from './ecoHelpers';

const C = GAME_CONTENT;

describe('dinheiro e extrato', () => {
  it('em vidas inteiras com lutas, eventos, empregos, bens e empresas: dinheiro inteiro e Σ extrato = variação do saldo', () => {
    for (let i = 0; i < 6; i++) {
      const rng = createRng(900 + i);
      let s: GameState = newGame({ seed: `ledger-${i}`, name: 'Lia Extrato', sex: i % 2 ? 'M' : 'F', preference: 'any', adultContent: true }, C);
      let prevClosing = s.money;
      const check = () => {
        expect(ledgerOk(s)).toBe(true);
      };
      for (let y = 0; y < 70 && s.alive; y++) {
        const before = s.economy.history.length;
        s = advanceYear(s, C);
        check();
        if (s.economy.history.length > before) {
          const h = s.economy.history.at(-1)!;
          const sum = Object.values(h.totals).reduce((t, v) => t + (v ?? 0), 0);
          expect(h.closing - prevClosing).toBe(sum);
          prevClosing = h.closing;
        }
        for (let k = 0; k < 8 && s.pendingEvents.length; k++) {
          const ev = C.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
          s = resolveEvent(s, ev.id, rng.pick(ev.choices).id, C);
          check();
        }
        if (y === 5) s = enterGym(s, gymsInCity(s, C)[0]!.id, C);
        for (const o of s.fighter.offers.slice(0, 2)) {
          s = closeFight(autoFinishFight(acceptOffer(s, o.id, {}, C), C));
          check();
          for (let k = 0; k < 4 && s.pendingEvents.length; k++) {
            const ev = C.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
            s = resolveEvent(s, ev.id, rng.pick(ev.choices).id, C);
          }
          check();
        }
        if (s.character.age >= 16 && !s.economy.job) s = applyJob(s, rng.pick(['lanchonete', 'entregador', 'vendedor', 'auxiliar_adm']), C);
        s = performAction(s, 'make_friends', C);
        s = trainFighter(s, 'fisico', C);
        if (s.character.age >= 18) {
          const p = currentPartner(s);
          if (!p) s = meetSomeone(s, 'social', C, rng);
          else s = interact(s, p.person.id, rng.pick(['date', 'gift', 'propose', 'try_baby']), C);
          const offers = marketOffers(s, C);
          if (offers.length && rng.chance(0.3)) s = buyAsset(s, rng.pick(offers).id, C, { financed: rng.chance(0.5) });
          if (s.economy.assets.length && rng.chance(0.15)) s = sellAsset(s, rng.pick(s.economy.assets).id);
          if (rng.chance(0.2)) s = deposit(s, s.money * 0.3, rng.chance(0.5) ? 'savings' : 'investments');
          if (rng.chance(0.1)) s = withdraw(s, 5000, 'investments');
          if (rng.chance(0.05)) s = personalLoan(s, 10000, 3);
          if (!s.economy.businesses.length && rng.chance(0.05)) s = openBusiness(s, rng.pick(C.economy.businesses).id, C);
        }
        check();
      }
      expect(s.economy.history.length).toBeLessThanOrEqual(100);
    }
  }, 120_000);
});

describe('impostos', () => {
  const B = [
    { upTo: 30000, rate: 0 },
    { upTo: 60000, rate: 0.075 },
    { upTo: 120000, rate: 0.15 },
    { upTo: 250000, rate: 0.225 },
    { upTo: null, rate: 0.275 },
  ];
  it('faixas progressivas: cada faixa tributa só a parte dentro dela', () => {
    expect(incomeTax(0, B)).toBe(0);
    expect(incomeTax(30000, B)).toBe(0);
    expect(incomeTax(60000, B)).toBe(2250); // 30k × 7,5%
    expect(incomeTax(120000, B)).toBe(2250 + 9000); // + 60k × 15%
    expect(incomeTax(250000, B)).toBe(2250 + 9000 + 29250); // + 130k × 22,5%
    expect(incomeTax(350000, B)).toBe(2250 + 9000 + 29250 + 27500); // + 100k × 27,5%
  });

  it('o fechamento cobra imposto sobre a renda tributável do ano', () => {
    let s = adult(30, 0);
    s = { ...s, economy: { ...s.economy, housing: 'pais' } };
    s = { ...s, economy: { ...s.economy, ledger: { ...s.economy.ledger, entries: [{ cat: 'salario', amount: 120000, label: 'x' }] } }, money: 120000 };
    const r = closeEconomicYear(s, createRng(1), C);
    const last = r.economy.history.at(-1)!;
    expect(last.totals.impostos).toBeLessThanOrEqual(-11250);
  });
});

describe('empréstimos e financiamentos', () => {
  it('parcelas fixas, juros corretos e quitação exata no prazo', () => {
    for (const [principal, years] of [[100000, 5], [300000, 20], [17777, 3]] as const) {
      let [s, loan] = newLoan(adult(30, 10_000_000), 'imobiliario', principal, years);
      const total = loanTotalCost(principal, loan.rate, years);
      const startMoney = s.money;
      for (let y = 0; y < years; y++) {
        expect(s.economy.loans).toHaveLength(1);
        s = payLoans(s);
      }
      expect(s.economy.loans).toHaveLength(0);
      expect(startMoney - s.money).toBe(total);
      expect(total).toBeGreaterThan(principal);
      expect(ledgerOk(s)).toBe(true);
    }
  });

  it('empréstimo pessoal respeita o limite de crédito', () => {
    const s = { ...adult(30, 0), economy: { ...adult(30, 0).economy, lastIncome: 10000 } };
    expect(personalLoan(s, 1_000_000, 5)).toBe(s);
    const ok = personalLoan(s, 15000, 3);
    expect(ok.money).toBe(15000);
    expect(ok.economy.loans[0]!.balance).toBe(15000);
  });
});

describe('mercado e ano econômico', () => {
  it('determinísticos pelo seed e ano; variam entre anos', () => {
    expect(marketYear('a', 2020)).toEqual(marketYear('a', 2020));
    const kinds = new Set(Array.from({ length: 60 }, (_, i) => marketYear('a', 2000 + i).kind));
    expect(kinds).toEqual(new Set(['normal', 'crise', 'boom']));
    const g = adult(30);
    expect(marketOffers(g, C)).toEqual(marketOffers(g, C));
  });

  it('valorização dos imóveis e índice determinísticos', () => {
    let s = adult(30, 2_000_000);
    const offer = marketOffers(s, C).find((o) => o.kind === 'imovel')!;
    s = buyAsset(s, offer.id, C);
    s = deposit(s, 100000, 'investments');
    const a = closeEconomicYear(s, createRng(5), C);
    const b = closeEconomicYear(s, createRng(5), C);
    expect(a.economy.assets[0]!.value).toBe(b.economy.assets[0]!.value);
    expect(a.economy.investments).toBe(Math.round(100000 * (1 + marketYear(s.seed, s.year).indexReturn)));
  });
});

describe('anti-exploit', () => {
  it('comprar e vender o mesmo bem no mesmo ano sempre dá prejuízo (à vista e financiado)', () => {
    for (let i = 0; i < 20; i++) {
      const base = adult(30, 10_000_000, `ex${i}`);
      for (const offer of marketOffers(base, C)) {
        for (const financed of [false, true]) {
          const bought = buyAsset(base, offer.id, C, { financed });
          if (bought === base) continue;
          const asset = bought.economy.assets.at(-1)!;
          const sold = sellAsset(bought, asset.id);
          expect(sold.money).toBeLessThan(base.money);
          expect(ledgerOk(sold)).toBe(true);
          expect(sold.economy.loans).toHaveLength(0);
        }
      }
    }
  });

  it('não dá para comprar a mesma oferta duas vezes no ano', () => {
    const base = adult(30, 10_000_000);
    const offer = marketOffers(base, C)[0]!;
    const once = buyAsset(base, offer.id, C);
    expect(buyAsset(once, offer.id, C)).toBe(once);
    expect(buyCost(offer)).toBeGreaterThanOrEqual(offer.price);
  });
});

describe('dívida', () => {
  it('saldo negativo no fechamento vira dívida com juros, felicidade e saúde caem', () => {
    let s = { ...adult(30, 0), economy: { ...adult(30, 0).economy, housing: 'aluguel' as const, lastIncome: 0 } };
    s = { ...s, money: -5000, economy: { ...s.economy, ledger: { ...s.economy.ledger, opening: -5000 } } };
    const y1 = closeEconomicYear(s, createRng(1), C);
    expect(y1.money).toBe(0);
    expect(y1.economy.debt).toBeGreaterThan(5000);
    expect(y1.character.stats.happiness).toBeLessThan(s.character.stats.happiness);
    // juros de 35% ao ano sobre a dívida existente (sem novos gastos)
    const debt1 = y1.economy.debt;
    const y2 = debtYear({ ...y1, money: 0 }, (x) => x);
    expect(y2.economy.debt).toBe(debt1 + Math.round(debt1 * DEBT_RATE));
    expect(y2.economy.debtYears).toBe(2);
  });

  it('dívida longa leva à falência pessoal com perda de bens', () => {
    let s = adult(30, 2_000_000);
    const offer = marketOffers(s, C).find((o) => o.kind === 'veiculo')!;
    s = buyAsset(s, offer.id, C);
    s = { ...s, money: 0, economy: { ...s.economy, ledger: { ...s.economy.ledger, opening: 0, entries: [] }, debt: 200000, debtYears: 3, lastIncome: 0 } };
    const r = closeEconomicYear(s, createRng(3), C);
    expect(r.flags.falencia).toBe(1);
    expect(r.economy.assets).toHaveLength(0);
    // renegociação: metade do que não foi pago continua devida, sem os anos de atraso
    expect(r.economy.debt).toBeGreaterThan(0);
    expect(r.economy.debt).toBeLessThan(200000 * (1 + DEBT_RATE) / 2);
    expect(r.economy.debtYears).toBe(0);
    expect(r.log.flatMap((y) => y.entries).join('\n')).toMatch(/Falência pessoal/);
  });
});
