import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import {
  STATE_VERSION,
  advanceYear,
  collegeYear,
  createRng,
  enrollBlockReason,
  enrollCollege,
  examBlockReason,
  examScore,
  jobBlockReason,
  performAction,
  sessionsLeft,
  takeExam,
} from '../src/engine';
import type { GameState } from '../src/engine';
import { migrate } from '../src/save/migrations';
import fixturesV11 from '../src/save/__fixtures__/saves-v11.json';
import { makeGame, withAge } from './helpers';

const NO_EV = { ...C, events: [] };
const grad = (age = 18, intel = 70, seed = 'fac'): GameState => {
  const g = withAge(makeGame(seed), age);
  return { ...g, money: 500000, education: { ...g.education, current: null, graduated: true }, character: { ...g.character, stats: { ...g.character.stats, intelligence: intel, health: 90 } } };
};
const scored = (s: GameState, score: number): GameState => ({ ...s, college: { ...s.college, examScore: score, examYear: s.year - 1 } });
const job = (id: string) => C.economy.jobs.find((j) => j.id === id)!;

describe('exame nacional (ENU)', () => {
  it('só no 3º ano do médio ou depois da escola, uma vez por ano', () => {
    expect(examBlockReason(withAge(makeGame('e1'), 15))).toBe('too-young');
    expect(examBlockReason({ ...withAge(makeGame('e2'), 17), education: { ...makeGame('e2').education, current: null, graduated: false } })).toBe('no-highschool');
    const g = grad();
    expect(examBlockReason(g)).toBeNull();
    const t = takeExam(g, C);
    expect(t.college.examScore).not.toBeNull();
    expect(examBlockReason(t)).toBe('done');
  });

  it('a nota sobe com a inteligência e o estudo (0–1000)', () => {
    let low = 0;
    let high = 0;
    for (let i = 0; i < 200; i++) {
      low += examScore(grad(18, 30), createRng(i), C);
      high += examScore(grad(18, 90), createRng(i), C);
    }
    expect(high / 200).toBeGreaterThan(low / 200 + 150);
    const studied = performAction(performAction(grad(18, 60), 'study', C), 'study', C);
    expect(examScore(studied, createRng(1), C)).toBeGreaterThan(examScore(grad(18, 60), createRng(1), C));
  });
});

describe('matrícula', () => {
  it('nota de corte: pública exige mais que particular', () => {
    const s = scored(grad(), 500);
    expect(enrollBlockReason(s, 'direito', 'publica', C)).toBe('cutoff');
    expect(enrollBlockReason(s, 'direito', 'particular', C)).toBeNull();
    expect(enrollBlockReason(scored(grad(), 760), 'direito', 'publica', C)).toBeNull();
    expect(enrollBlockReason(grad(), 'direito', 'particular', C)).toBe('no-exam');
    expect(enrollBlockReason({ ...scored(grad(), 900), education: { ...grad().education, graduated: false } }, 'direito', 'publica', C)).toBe('no-highschool');
  });

  it('pública é grátis; particular cobra mensalidade, dá bolsa pela nota ou financia', () => {
    const pub = enrollCollege(scored(grad(), 800), 'administracao', 'publica', C);
    expect(pub.college.current).toMatchObject({ type: 'publica', funding: 'gratis', year: 1, status: 'cursando' });
    const paid = enrollCollege(scored(grad(), 420), 'administracao', 'particular', C);
    expect(paid.college.current!.funding).toBe('proprio');
    const before = paid.money;
    const next = collegeYear(paid, createRng(1), C);
    expect(next.money).toBeLessThan(before);
    expect(enrollCollege(scored(grad(), 700), 'administracao', 'particular', C).college.current!.funding).toBe('bolsa');
    const fin = enrollCollege(scored(grad(), 420), 'administracao', 'particular', C, true);
    expect(fin.college.current!.funding).toBe('financiamento');
    expect(collegeYear(fin, createRng(1), C).money).toBe(fin.money);
  });

  it('a faculdade ocupa 2 sessões de treino (trancada, não)', () => {
    const s = enrollCollege(scored(grad(), 800), 'direito', 'publica', C);
    expect(sessionsLeft(s, C)).toBe(C.limits.trainingSessions - 2);
    expect(sessionsLeft({ ...s, college: { ...s.college, current: { ...s.college.current!, status: 'trancado' } } }, C)).toBe(C.limits.trainingSessions);
  });
});

describe('curso, formatura e empregos', () => {
  function study(s: GameState, years: number): GameState {
    let g = s;
    for (let y = 0; y < years && g.college.current; y++) {
      for (let k = 0; k < 3; k++) g = performAction(g, 'college_study', C);
      g = { ...advanceYear({ ...g, pendingEvents: [] }, NO_EV), pendingEvents: [] };
    }
    return g;
  }

  it('concluir gera o diploma e libera os empregos do curso', () => {
    const s = enrollCollege(scored(grad(18, 85), 800), 'computacao', 'publica', C);
    const g = study(s, 8);
    expect(g.college.diplomas).toContain('computacao');
    expect(g.flags.formado_computacao).toBe(true);
    expect(g.college.current).toBeNull();
    expect(['education', 'degree']).toContain(jobBlockReason(grad(25, 85), job('programador')));
    expect(['no-opening', null]).toContain(jobBlockReason({ ...g, character: { ...g.character, age: 25 } }, job('programador')));
  });

  it('o diploma certo: Direito não serve para médico; advogado exige o Exame da Ordem', () => {
    const law = { ...grad(25, 80), college: { ...grad().college, diplomas: ['direito'] } };
    expect(jobBlockReason(law, job('medico'))).toBe('degree');
    expect(jobBlockReason(law, job('advogado'))).toBe('license');
    expect(['no-opening', null]).toContain(jobBlockReason({ ...law, flags: { ...law.flags, oab: true } }, job('advogado')));
    const med = study(enrollCollege(scored(grad(18, 95), 900), 'medicina', 'publica', C), 10);
    expect(med.college.diplomas).toContain('medicina');
    expect(med.flags.crm).toBe(true);
  });

  it('duas reprovações: jubilado; financiamento vira empréstimo', () => {
    let s = enrollCollege(scored(grad(18, 15, 'jub'), 450), 'engenharia', 'particular', C, true);
    expect(s.college.current).not.toBeNull();
    for (let y = 0; y < 3 && s.college.current; y++) {
      for (let k = 0; k < 3; k++) s = performAction(s, 'college_skip', C);
      s = { ...advanceYear({ ...s, pendingEvents: [] }, NO_EV), pendingEvents: [] };
    }
    expect(s.college.current).toBeNull();
    expect(s.college.diplomas).toEqual([]);
    expect(s.flags.jubilado).toBe(true);
    expect(s.economy.loans.length).toBeGreaterThan(0);
  });
});

describe('migração v11 → v12', () => {
  const v11 = fixturesV11 as unknown as Record<string, Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
  it.each(Object.keys(v11))('%s ganha college', (k) => {
    const m = migrate(structuredClone(v11[k]));
    expect(m.version).toBe(STATE_VERSION);
    expect(m.college).toBeDefined();
    expect(Array.isArray(m.college.diplomas)).toBe(true);
  });
  it('quem escolheu faculdade aos 18 ganha diploma (22+) ou matrícula (18–21)', () => {
    const base = v11['25']!;
    const old: Record<string, any> = { ...base, flags: { ...base.flags, caminho_18: 'faculdade' }, education: { ...base.education, graduated: true } }; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(migrate(structuredClone(old)).college.diplomas).toEqual(['administracao']);
    const young = { ...old, character: { ...old.character, age: 19 } };
    expect(migrate(structuredClone(young)).college.current).toMatchObject({ courseId: 'administracao', year: 2 });
  });
});
