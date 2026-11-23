/** Carreira policial (release 0.0.2, fase 2): concurso, formação, estágio, promoções, ações e migração v14→v15. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import {
  advanceYear,
  leavePolice,
  policeExamBlockReason,
  policeSalary,
  policeWorkHard,
  policeYear,
  quitJob,
  rankTitle,
  runExam,
  shootingRange,
  takePoliceExam,
  trackDef,
  createRng,
  newGame,
} from '../src/engine';
import type { GameState, PoliceTrackId } from '../src/engine';
import { migrate } from '../src/save/migrations';
import fixturesV14 from '../src/save/__fixtures__/saves-v14.json';

const NO_EV = { ...C, events: [] };

function person(age = 22, opts: { diplomas?: string[]; graduated?: boolean; seed?: string; stats?: Partial<GameState['character']['stats']> } = {}): GameState {
  const g = newGame({ seed: opts.seed ?? 'pol', name: 'Teste', sex: 'F', birthYear: 2000, uf: 'SP', city: 'São Paulo' }, C);
  return {
    ...g,
    year: 2000 + age,
    money: 5000,
    character: { ...g.character, age, stats: { ...g.character.stats, intelligence: 95, athletic: 80, health: 95, happiness: 90, ...opts.stats } },
    education: { ...g.education, current: null, graduated: opts.graduated ?? true },
    college: { ...g.college, diplomas: opts.diplomas ?? [] },
    economy: { ...g.economy, ledger: { year: 2000 + age, opening: 5000, entries: [] } },
  };
}

/** Passa no concurso tentando seeds diferentes (o resultado é aleatório). */
function approved(track: PoliceTrackId, base = person(22, { diplomas: ['direito'] })): GameState {
  for (let i = 0; i < 50; i++) {
    const s = takePoliceExam({ ...base, rngState: 1000 + i }, track, C);
    if (s.police.career) return s;
  }
  throw new Error('não passou');
}

function years(s: GameState, n: number): GameState {
  let g = s;
  for (let i = 0; i < n; i++) g = advanceYear(g, NO_EV);
  return g;
}

describe('concurso', () => {
  it('idade de 18 a 30 na inscrição', () => {
    expect(policeExamBlockReason(person(17), 'pm_praca', C)).toBe('age');
    expect(policeExamBlockReason(person(18), 'pm_praca', C)).toBeNull();
    expect(policeExamBlockReason(person(30), 'pm_praca', C)).toBeNull();
    expect(policeExamBlockReason(person(31), 'pm_praca', C)).toBe('age');
  });

  it('escolaridade por trilha; delegado exige Direito', () => {
    expect(policeExamBlockReason(person(22, { graduated: false }), 'pm_praca', C)).toBe('education');
    expect(policeExamBlockReason(person(22), 'civil_investigador', C)).toBe('education');
    expect(policeExamBlockReason(person(22, { diplomas: ['educacao_fisica'] }), 'civil_investigador', C)).toBeNull();
    expect(policeExamBlockReason(person(22, { diplomas: ['educacao_fisica'] }), 'civil_delegado', C)).toBe('degree');
    expect(policeExamBlockReason(person(22, { diplomas: ['direito'] }), 'civil_delegado', C)).toBeNull();
  });

  it('ficha criminal com condenação bloqueia; facção reprova na investigação social', () => {
    const p = person();
    const convicted = { ...p, crime: { ...p.crime, record: [{ age: 20, year: 2020, crime: 'furto_loja', kind: 'condenacao' as const, years: 1 }] } };
    expect(policeExamBlockReason(convicted, 'pm_praca', C)).toBe('record');
    const faction = { ...p, crime: { ...p.crime, faction: { id: 'x', rank: 0, years: 1, debt: 0 } } };
    for (let i = 0; i < 20; i++) expect(runExam(faction, trackDef(C, 'pm_praca')!, createRng(i))).toBe('social');
  });

  it('uma inscrição por ano', () => {
    const s = takePoliceExam(person(22, { stats: { intelligence: 10 } }), 'pm_praca', C);
    expect(s.police.exams).toHaveLength(1);
    expect(policeExamBlockReason(s, 'pm_praca', C)).toBe('tried');
  });

  it('o TAF depende da Capacidade atlética', () => {
    const def = trackDef(C, 'pm_praca')!;
    let weak = 0;
    let strong = 0;
    for (let i = 0; i < 300; i++) {
      if (runExam(person(22, { stats: { athletic: 20 } }), def, createRng(i)) === 'taf') weak++;
      if (runExam(person(22, { stats: { athletic: 85 } }), def, createRng(i)) === 'taf') strong++;
    }
    expect(weak).toBeGreaterThan(250);
    expect(strong).toBe(0);
  });

  it('aprovado: academia, emprego policial e inscrição paga no extrato', () => {
    const s = approved('pm_praca');
    expect(s.police.career).toMatchObject({ force: 'pm', track: 'pm_praca', stage: 'formacao', rank: 0 });
    expect(s.economy.job?.jobId).toBe('policia_militar');
    expect(s.money - s.economy.ledger.opening).toBe(s.economy.ledger.entries.reduce((t, e) => t + e.amount, 0));
  });
});

describe('formação, estágio e efetivação', () => {
  it('academia (1 ano, Tiro sobe) → probatório (2 anos) → efetivo, com salário do posto', () => {
    let s = approved('pm_praca');
    expect(s.police.shooting).toBe(0);
    s = years(s, 1);
    expect(s.police.career?.stage).toBe('probatorio');
    expect(s.police.shooting).toBeGreaterThan(10);
    expect(rankTitle(s, C)).toBe('Soldado');
    s = years(s, 2);
    expect(s.police.career?.stage).toBe('efetivo');
    expect(s.economy.history.at(-1)!.totals.salario).toBeGreaterThan(0);
  });

  it('a formação paga 70% (bolsa)', () => {
    const s = approved('pm_praca');
    const efetivo = { ...s, police: { ...s.police, career: { ...s.police.career!, stage: 'efetivo' as const } } };
    expect(policeSalary(s, C)).toBe(Math.round(policeSalary(efetivo, C) * 0.7));
  });

  it('processos na corregedoria reprovam no estágio probatório', () => {
    let s = years(approved('pm_praca'), 1);
    s = { ...s, police: { ...s.police, career: { ...s.police.career!, corregedoria: 2 } } };
    s = policeYear(s, createRng(1), C);
    expect(s.police.career).toBeNull();
    expect(s.police.past.at(-1)?.reason).toBe('exoneracao');
    expect(s.economy.job).toBeNull();
  });
});

describe('promoções', () => {
  const efetivo = (track: PoliceTrackId, merit: number, base?: GameState): GameState => {
    const s0 = approved(track, base);
    const s = { ...s0, year: s0.year + 1 };
    return { ...s, police: { ...s.police, career: { ...s.police.career!, stage: 'efetivo' as const, merit, rankYears: 0 } } };
  };

  it('PM: Soldado → Cabo exige tempo e mérito', () => {
    let s = efetivo('pm_praca', 0);
    for (let i = 0; i < 4; i++) s = policeYear(s, createRng(i), C);
    expect(s.police.career!.rank).toBe(0);
    let fast = efetivo('pm_praca', 80);
    for (let i = 0; i < 12 && fast.police.career!.rank === 0; i++) fast = policeYear(fast, createRng(100 + i), C);
    expect(rankTitle(fast, C)).toBe('Cabo');
  });

  it('Civil: delegada sobe de classe', () => {
    let s = efetivo('civil_delegado', 90);
    for (let i = 0; i < 12 && s.police.career!.rank === 0; i++) s = policeYear(s, createRng(i), C);
    expect(rankTitle(s, C)).toBe('Delegada de 2ª Classe');
  });

  it('CFO: só praça efetivo com curso superior', () => {
    const s = efetivo('pm_praca', 30, person(22));
    expect(policeExamBlockReason(s, 'pm_oficial', C)).toBe('education');
    const sup = { ...s, college: { ...s.college, diplomas: ['direito'] } };
    expect(policeExamBlockReason(sup, 'pm_oficial', C)).toBeNull();
    expect(policeExamBlockReason(person(22, { diplomas: ['direito'] }), 'pm_oficial', C)).toBe('internal');
  });
});

describe('ações e saída', () => {
  it('afinco dá mérito; estande gasta sessão e sobe o Tiro', () => {
    const s = years(approved('civil_investigador', person(22, { diplomas: ['direito'] })), 1);
    const w = policeWorkHard(s, C);
    expect(w.police.career!.merit).toBeGreaterThan(s.police.career!.merit);
    const r = shootingRange(s, C);
    expect(r.police.shooting).toBeGreaterThan(s.police.shooting);
    expect(r.fighter.sessionsThisYear).toBe(s.fighter.sessionsThisYear + 1);
  });

  it('pedir demissão do emprego policial = exoneração a pedido', () => {
    const s = quitJob(approved('pm_praca'), C);
    expect(s.police.career).toBeNull();
    expect(s.economy.job).toBeNull();
    expect(s.police.past.at(-1)?.reason).toBe('pedido');
    expect(leavePolice(s, 'pedido', C)).toBe(s);
  });

  it('candidatura comum é barrada: só por concurso', async () => {
    const { jobBlockReason } = await import('../src/engine');
    const def = C.economy.jobs.find((j) => j.id === 'policia_militar')!;
    expect(jobBlockReason(person(), def, C)).toBe('public-exam');
  });
});

describe('migração v14 → v15', () => {
  it('saves reais da 0.0.1 migram sem erro e sem carreira policial', () => {
    const v14 = fixturesV14 as unknown as Record<string, Record<string, unknown>>;
    for (const k of Object.keys(v14)) {
      const m = migrate(structuredClone(v14[k]));
      expect(m.version).toBe(15);
      expect(m.police).toEqual({ shooting: 0, career: null, exams: [], past: [] });
      expect(m.prison).toBeNull();
      expect(m.crime.wanted).toBe(0);
    }
  });

  it('a flag antiga "preso" vira passagem leve na ficha', () => {
    const v14 = fixturesV14 as unknown as Record<string, Record<string, unknown>>;
    const adult = structuredClone(Object.values(v14).find((s) => ((s.character as { age: number }).age ?? 0) >= 18)!);
    adult.flags = { ...(adult.flags as object), preso: true };
    const m = migrate(adult);
    expect(m.crime.record).toEqual([expect.objectContaining({ crime: 'briga', kind: 'passagem' })]);
  });
});
