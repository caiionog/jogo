/** Justiça (release 0.0.2, fase 6): processo, faixas de pena, agravantes/atenuantes, regime, progressão, remição, ficha. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import {
  advanceYear,
  arrest,
  computeSentence,
  createRng,
  hireChance,
  imprison,
  jobBlockReason,
  newGame,
  policeExamBlockReason,
  prisonYear,
  regimeFor,
  resolveEvent,
  sentenceRange,
} from '../src/engine';
import type { CrimeCase, GameState } from '../src/engine';

const NO_EV = { ...C, events: [] };

function adult(seed = 'jus', age = 25, money = 1000): GameState {
  const g = newGame({ seed, name: 'Teste', sex: 'M', birthYear: 2000, uf: 'SP', city: 'São Paulo' }, C);
  return { ...g, year: 2000 + age, money, character: { ...g.character, age, luck: 50 }, education: { ...g.education, graduated: true, current: null }, economy: { ...g.economy, ledger: { year: 2000 + age, opening: money, entries: [] } } };
}

const cs = (patch: Partial<CrimeCase> = {}): CrimeCase => ({ crimeId: 'assalto_comercio', year: 2025, confessed: false, lawyer: 'publico', quality: 20, free: false, ...patch });
const convicted = (s: GameState): GameState => ({ ...s, crime: { ...s.crime, record: [{ age: 20, year: 2020, crime: 'furto_carro', kind: 'condenacao', years: 2 }] } });

/** Roda o processo inteiro escolhendo as opções dadas. */
function trial(s0: GameState, choices: { plea: string; lawyer: string; trial: string }): GameState {
  let s = arrest(s0, 'assalto_comercio', createRng(1), C, 'flagrante');
  expect(s.pendingEvents[0]!.eventId).toBe('justica_delegacia');
  s = resolveEvent(s, 'justica_delegacia', choices.plea, C);
  s = resolveEvent(s, 'justica_defesa', choices.lawyer, C);
  if (s.pendingEvents[0]?.eventId === 'justica_julgamento') s = resolveEvent(s, 'justica_julgamento', choices.trial, C);
  return s;
}

describe('processo', () => {
  it('flagrante → delegacia → defesa → julgamento (sem fiança em crime grave)', () => {
    const s = trial(adult('p1'), { plea: 'silencio', lawyer: 'publico', trial: 'julgar' });
    expect(s.crime.case).toBeNull();
    expect(s.crime.record.some((r) => r.kind === 'passagem')).toBe(true);
  });

  it('com fiança em delito médio: responde em liberdade e o julgamento fica para o ano seguinte', () => {
    let s = arrest(adult('p2', 25, 60000), 'furto_carro', createRng(1), C, 'flagrante');
    s = resolveEvent(s, 'justica_delegacia', 'silencio', C);
    s = resolveEvent(s, 'justica_defesa', 'publico', C);
    expect(s.crime.case?.free).toBe(true);
    expect(s.scheduledEvents.some((e) => e.eventId === 'justica_julgamento')).toBe(true);
    expect(s.money - s.economy.ledger.opening).toBe(s.economy.ledger.entries.reduce((t, e) => t + e.amount, 0));
  });
});

describe('sentença', () => {
  it('faixas por delito e regime pela pena', () => {
    expect(sentenceRange(C, 'assalto_banco')).toEqual([8, 16]);
    expect(regimeFor(10)).toBe('fechado');
    expect(regimeFor(5)).toBe('semiaberto');
    expect(regimeFor(3)).toBe('aberto');
    const s = adult();
    expect(computeSentence(s, cs({ quality: 0 }), C, 0)).toBeCloseTo(5, 5);
    expect(computeSentence(s, cs({ quality: 0 }), C, 1)).toBeCloseTo(10, 5);
  });

  it('reincidência e facção agravam; bom advogado e confissão atenuam; a sorte só inclina', () => {
    const s = adult();
    const base = computeSentence(s, cs(), C, 0.5);
    expect(computeSentence(convicted(s), cs(), C, 0.5)).toBeGreaterThan(base);
    expect(computeSentence({ ...s, crime: { ...s.crime, faction: { id: 'liga', rank: 0, years: 1, debt: 0 } } }, cs(), C, 0.5)).toBeGreaterThan(base);
    expect(computeSentence(s, cs({ quality: 80 }), C, 0.5)).toBeLessThan(base);
    expect(computeSentence(s, cs({ confessed: true }), C, 0.5)).toBeLessThan(base);
    const lucky = computeSentence({ ...s, character: { ...s.character, luck: 100 } }, cs(), C, 0.5);
    expect(lucky).toBeLessThan(base);
    expect(lucky).toBeGreaterThanOrEqual(base * 0.9 - 1e-9);
  });
});

describe('cumprimento da pena', () => {
  it('progressão a cada 1/4 com bom comportamento; soltura no ano certo', () => {
    let s = imprison(adult('pr'), 12, C);
    expect(s.prison).toMatchObject({ regime: 'fechado', sentence: 12, served: 0 });
    s = { ...s, prison: { ...s.prison!, behavior: 55 } };
    const regimes: string[] = [];
    let years = 0;
    while (s.prison && years < 20) {
      s = prisonYear(s, createRng(years), C);
      years++;
      if (s.prison) regimes.push(s.prison.regime);
    }
    expect(regimes[2]).toBe('semiaberto');
    expect(regimes).toContain('aberto');
    expect(years).toBe(12);
  });

  it('remição reduz a pena (sai antes)', () => {
    let s = imprison(adult('rm'), 6, C);
    s = { ...s, prison: { ...s.prison!, behavior: 40, remission: 1.5 } };
    let years = 0;
    while (s.prison && years < 20) {
      s = prisonYear(s, createRng(years), C);
      years++;
    }
    expect(years).toBe(5);
  });

  it('o advanceYear solta no ano certo', () => {
    let s = imprison(adult('ay'), 3, C);
    s = { ...s, prison: { ...s.prison!, behavior: 40 } };
    for (let i = 0; i < 2; i++) s = advanceYear(s, NO_EV);
    expect(s.prison).not.toBeNull();
    s = advanceYear(s, NO_EV);
    expect(s.prison).toBeNull();
  });

  it('policial condenado é demitido e vai para a ala especial', () => {
    const base = adult('cop');
    const s = imprison({ ...base, police: { ...base.police, career: { force: 'pm', track: 'pm_praca', rank: 0, stage: 'efetivo', stageYears: 0, serviceYears: 3, rankYears: 3, merit: 0, unit: 'regular', posting: 'x', notable: [], corregedoria: 3, specialTries: 0, startAge: 20 } } }, 10, C);
    expect(s.police.career).toBeNull();
    expect(s.prison?.wing).toBe('especial');
  });
});

describe('ficha criminal', () => {
  it('bloqueia concursos e empregos que exigem ficha limpa; reduz a chance nos outros', () => {
    const s = convicted(adult());
    expect(policeExamBlockReason(s, 'pm_praca', C)).toBe('record');
    const seg = C.economy.jobs.find((j) => j.id === 'cuidador')!;
    expect(jobBlockReason(s, seg)).toBe('record');
    const caixa = C.economy.jobs.find((j) => j.id === 'caixa')!;
    const market = { kind: 'normal' } as never;
    expect(hireChance(s, caixa, market)).toBeLessThan(hireChance(adult(), caixa, market));
  });
});
