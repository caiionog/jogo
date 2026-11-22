import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  advanceYear,
  applyForJob,
  businessYear,
  checkSponsorClauses,
  createRng,
  divorce,
  inheritFrom,
  jobBlockReason,
  jobYear,
  marketYear,
  netWorth,
  openBusiness,
  recordMarriage,
  relationsOf,
  setRegime,
  signSponsor,
  updatePerson,
  workHard,
} from '../src/engine';
import type { GameState, MarketYear } from '../src/engine';
import { adult, ledgerOk } from './ecoHelpers';
import { withPerson } from './relHelpers';

const C = GAME_CONTENT;
const job = (id: string) => C.economy.jobs.find((j) => j.id === id)!;
const normal: MarketYear = { kind: 'normal', indexReturn: 0.07, propertyGrowth: 0.03, businessMult: 1, layoffRisk: 0, savingsRate: 0.04 };
const crisis: MarketYear = { ...normal, kind: 'crise', businessMult: 0.75, layoffRisk: 1 };

describe('empregos', () => {
  it('requisitos: idade, escolaridade, atributos, reputação e luta', () => {
    const teen = { ...adult(15), education: { ...adult(15).education, graduated: false } };
    expect(jobBlockReason(teen, job('lanchonete'))).toBe('age');
    expect(jobBlockReason(adult(16), job('lanchonete'))).toBeNull();
    const noSchool = { ...adult(25), education: { ...adult(25).education, graduated: false } };
    expect(jobBlockReason(noSchool, job('auxiliar_adm'))).toBe('education');
    expect(jobBlockReason(adult(25), job('analista'))).toBe('education'); // superior exige faculdade
    const college = { ...adult(25), flags: { caminho_18: 'faculdade' } };
    expect(jobBlockReason(college, job('analista'))).toBeNull();
    const weak = { ...adult(25), character: { ...adult(25).character, stats: { ...adult(25).character.stats, athletic: 10 } } };
    expect(jobBlockReason(weak, job('seguranca'))).toBe('stats');
    expect(jobBlockReason(adult(30), job('comentarista'))).toBe('reputation');
    expect(jobBlockReason(adult(30), job('instrutor'))).toBe('fight');
    const black = { ...adult(30), fighter: { ...adult(30).fighter, belt: { rank: 2, years: 0 } } };
    expect(jobBlockReason(black, job('instrutor'))).toBeNull();
  });

  it('o emprego reserva energia (neste ano e nos próximos)', () => {
    let hired: GameState | null = null;
    for (let i = 0; i < 20 && !hired; i++) {
      const s = applyForJob({ ...adult(25), rngState: i * 7 }, 'auxiliar_adm', C, normal);
      if (s.economy.job) hired = s;
    }
    expect(hired).not.toBeNull();
    const h = hired!;
    expect(h.energy.current).toBe(8 - 1 - job('auxiliar_adm').energy);
    const next = advanceYear({ ...h, pendingEvents: [] }, { ...C, events: [] });
    if (next.economy.job) {
      expect(next.energy.reserved).toBe(job('auxiliar_adm').energy);
      expect(next.energy.current).toBe(next.energy.max - job('auxiliar_adm').energy);
    }
  });

  it('salário entra no extrato; desempenho alto promove; desempenho baixo ou crise demite', () => {
    let s: GameState = { ...adult(25), economy: { ...adult(25).economy, job: { jobId: 'vendedor', level: 1, performance: 95, years: 0 } } };
    let promoted = false;
    for (let i = 0; i < 20 && !promoted; i++) {
      const r = jobYear(s, createRng(i), C, normal);
      expect(r.money - s.money).toBe(job('vendedor').salary[0]);
      if (r.economy.job!.level === 2) promoted = true;
    }
    expect(promoted).toBe(true);
    s = { ...s, economy: { ...s.economy, job: { jobId: 'vendedor', level: 1, performance: 50, years: 0 } } };
    expect(jobYear(s, createRng(1), C, crisis).economy.job).toBeNull();
    const lazy = { ...s, economy: { ...s.economy, job: { jobId: 'vendedor', level: 1, performance: 5, years: 0 } } };
    let fired = 0;
    for (let i = 0; i < 40; i++) if (!jobYear(lazy, createRng(i), C, normal).economy.job) fired++;
    expect(fired).toBeGreaterThan(10);
    expect(workHard(s).economy.job!.performance).toBeGreaterThan(50);
  });
});

describe('empresas', () => {
  it('resultado anual determinístico e dividendos no extrato', () => {
    const s = openBusiness(adult(30, 500000), 'academia', C);
    expect(s.economy.businesses).toHaveLength(1);
    expect(s.flags.academia_propria).toBe(true);
    const a = businessYear(s, createRng(4), C, normal);
    expect(businessYear(s, createRng(4), C, normal)).toEqual(a);
    expect(ledgerOk(a)).toBe(true);
  });

  it('falência quando o caixa acaba', () => {
    let s = openBusiness(adult(30, 500000), 'restaurante', C);
    s = { ...s, economy: { ...s.economy, businesses: s.economy.businesses.map((b) => ({ ...b, cash: 1000, reputation: 0 })) } };
    let r = s;
    for (let y = 0; y < 10 && r.economy.businesses.length; y++) r = businessYear({ ...r, year: r.year + 1 }, createRng(y), C, crisis);
    expect(r.economy.businesses).toHaveLength(0);
    expect(r.log.flatMap((x) => x.entries).join('\n')).toMatch(/faliu/);
  });
});

describe('relacionamentos × economia', () => {
  it('divórcio em comunhão parcial divide o que foi construído; separação total não divide', () => {
    let [s, p] = withPerson(adult(30, 50000), 'conjuge', 30, { stage: 'casados' });
    s = recordMarriage(s, p.id);
    s = { ...s, money: 250000, economy: { ...s.economy, ledger: { ...s.economy.ledger, opening: 250000 } } };
    const partial = divorce(s, p.id);
    expect(partial.money).toBe(250000 - 100000); // metade dos 200k construídos
    expect(ledgerOk(partial)).toBe(true);
    const sep = divorce(setRegime(s, 'separacao'), p.id);
    expect(sep.money).toBe(250000);
  });

  it('divórcio com filhos menores cria pensão anual', () => {
    let [s, p] = withPerson(adult(35, 100000), 'conjuge', 35, { stage: 'casados' });
    [s] = withPerson(s, 'filho', 6);
    s = recordMarriage(s, p.id, 'separacao');
    const d = divorce(s, p.id);
    expect(d.economy.alimony).toHaveLength(1);
    expect(d.economy.alimony[0]!.amount).toBeGreaterThanOrEqual(6000);
  });

  it('herança dividida entre os herdeiros vivos', () => {
    let s = adult(40, 0);
    // sem irmãos sorteados pela família: o teste controla os herdeiros
    s = { ...s, relationships: { ...s.relationships, relations: s.relationships.relations.filter((r) => r.type !== 'irmao') } };
    const dad = relationsOf(s, ['pai'])[0]!.person;
    const mom = relationsOf(s, ['mae'])[0]!.person;
    s = updatePerson(s, dad.id, (x) => ({ ...x, wealth: 400000, alive: false }));
    s = updatePerson(s, mom.id, (x) => ({ ...x, alive: false }));
    const [withSib] = withPerson(s, 'irmao', 42);
    const solo = inheritFrom(s, { ...dad, wealth: 400000 });
    const two = inheritFrom(withSib, { ...dad, wealth: 400000 });
    expect(solo.money).toBe(Math.round(400000 * 0.96));
    expect(two.money).toBe(Math.round(200000 * 0.96));
    expect(ledgerOk(two)).toBe(true);
  });
});

describe('patrocínios', () => {
  const rep = (s: GameState, r: number) => ({ ...s, fighter: { ...s.fighter, reputation: r } });
  it('cancelado pela cláusula de derrotas seguidas', () => {
    let s = signSponsor(rep(adult(25), 45), C);
    expect(s.economy.sponsors).toHaveLength(1);
    const loss = { age: 25, year: s.year, orgId: 'arc', opponent: 'X', result: 'L' as const, method: 'DEC' as const, round: 3, title: false, pro: true };
    s = { ...s, fighter: { ...s.fighter, history: [loss, loss] } };
    expect(checkSponsorClauses(s, C).economy.sponsors).toHaveLength(0);
  });

  it('cancelado por escândalo (suspensão por doping)', () => {
    const s = signSponsor(rep(adult(25), 45), C);
    expect(checkSponsorClauses(s, C, true).economy.sponsors).toHaveLength(0);
  });
});

describe('save enxuto', () => {
  it('depois de 80 anos o extrato fica resumido (só totais) e o save limitado', () => {
    let s = adult(0, 0);
    s = { ...s, character: { ...s.character, age: 0 } };
    for (let y = 0; y < 85 && s.alive; y++) s = advanceYear({ ...s, pendingEvents: [] }, C);
    expect(s.economy.history.length).toBeLessThanOrEqual(100);
    expect(s.economy.history.every((h) => !('entries' in h))).toBe(true);
    expect(JSON.stringify(s).length).toBeLessThan(250_000);
    expect(netWorth(s)).toBeTypeOf('number');
    void marketYear;
  });
});

describe('ajustes de balanceamento', () => {
  it('saldo negativo é coberto pela poupança e depois pelo índice antes de virar dívida', async () => {
    const { debtYear, post } = await import('../src/engine');
    let s = adult(30, 0);
    s = { ...s, economy: { ...s.economy, savings: 5000, investments: 50000 } };
    s = post(s, 'compras', -20000, 'teste');
    const r = debtYear(s, (x) => x);
    expect(r.economy.debt).toBe(0);
    expect(r.money).toBeGreaterThanOrEqual(0);
    expect(r.economy.savings).toBe(0);
    expect(r.economy.investments).toBeLessThan(50000 - 15000);
    expect(ledgerOk(r)).toBe(true);
  });

  it('salário paga 9% de previdência e é ajustado ao custo da cidade', async () => {
    const { closeEconomicYear, PENSION_RATE, salaryOf, cityMultOf } = await import('../src/engine');
    let s = adult(30, 50000);
    s = { ...s, character: { ...s.character, uf: 'SP', city: 'São Paulo' }, economy: { ...s.economy, job: { jobId: 'tecnico', level: 1, performance: 50, years: 1 } } };
    const r = closeEconomicYear(s, createRng(5), C);
    const wage = salaryOf(job('tecnico'), 1, cityMultOf(s, C));
    expect(wage).toBeGreaterThan(job('tecnico').salary[0]);
    const entries = r.economy.history.at(-1)!;
    expect(entries.totals.salario).toBeGreaterThanOrEqual(wage);
    expect(-(entries.totals.impostos ?? 0)).toBeGreaterThanOrEqual(Math.round(wage * PENSION_RATE));
  });
});
