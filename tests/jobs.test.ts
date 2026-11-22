import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { SALARIO_MINIMO } from '../src/content/jobs';
import type { GameState } from '../src/engine';
import {
  CNH_COST, applyForJob, careerCard, careersIn, createRng, currentMarket, fighterNextStep, fighterStage, getDriversLicense, joinGym,
  jobBlockReason, jobDef, jobOpenings, jobRequirementGaps, jobTitle, jobYear, ledgerSum, talkToColleagues,
} from '../src/engine';
import { adult, ledgerOk } from './ecoHelpers';
import { enrolledGame } from './helpers';

const C = GAME_CONTENT;
const def = (id: string) => jobDef(C, id)!;
const at = (s: GameState, age: number): GameState => ({ ...s, character: { ...s.character, age } });
/** Tenta até ser contratado (a chance é sorteada pelo rngState). */
function hire(s0: GameState, id: string, replace = false): GameState {
  // vagas são sorteadas pela seed: troca a seed até a vaga estar aberta
  let s = s0;
  for (let k = 0; k < 30 && !jobOpenings(s, C).includes(id); k++) s = { ...s0, seed: `${s0.seed}-${k}` };
  for (let i = 0; i < 40; i++) {
    const r = applyForJob({ ...s, rngState: i * 7919 + 1 }, id, C, currentMarket(s), { replace });
    if (r.economy.job?.jobId === id) return r;
  }
  throw new Error(`não contratou: ${jobBlockReason(s, def(id), C, { replace })}`);
}

describe('empregos básicos (Etapa 8)', () => {
  it('catálogo: salários a partir do salário mínimo, idades 14/16/18/21, escada e carteira', () => {
    for (const j of C.economy.jobs) {
      expect(j.salaryMW).toBeDefined();
      expect(j.salary[0]).toBeLessThanOrEqual(j.salary[1]);
    }
    expect(def('lanchonete').salary[0]).toBe(Math.round(0.6 * SALARIO_MINIMO * 13));
    expect(def('jovem_aprendiz').minAge).toBe(14);
    for (const id of ['lanchonete', 'repositor', 'empacotador', 'estagio']) expect(def(id).minAge).toBe(16);
    for (const id of ['entregador', 'caixa', 'vendedor', 'garcom', 'recepcionista', 'auxiliar_adm', 'frentista', 'servente', 'auxiliar_limpeza', 'cuidador', 'motorista_app', 'professor_particular', 'instrutor']) expect(def(id).minAge).toBe(18);
    expect(def('seguranca').minAge).toBe(21);
    expect(jobTitle(def('lanchonete'), 1)).toBe('Atendente');
    expect(jobTitle(def('lanchonete'), 5)).toBe('Gerente da lanchonete');
    expect(def('servente').formal).toBe(false);
  });

  it('idade mínima e requisitos: aprendiz exige estudar; estágio, ensino médio; motorista, CNH; segurança, físico', () => {
    const kid = enrolledGame(14);
    expect(jobRequirementGaps(kid, def('jovem_aprendiz'))).toEqual([]);
    expect(jobRequirementGaps({ ...kid, education: { ...kid.education, current: null } }, def('jovem_aprendiz'))).toContain('study');
    expect(jobRequirementGaps(at(kid, 13), def('jovem_aprendiz'))).toContain('age');
    expect(jobRequirementGaps(kid, def('lanchonete'))).toContain('age');
    expect(jobRequirementGaps(enrolledGame(16, { grade: 12 }), def('estagio'))).toEqual([]);
    expect(jobRequirementGaps(enrolledGame(16, { grade: 10 }), def('estagio'))).toContain('study');
    const a = adult(25);
    expect(jobRequirementGaps(a, def('motorista_app'))).toContain('cnh');
    expect(jobRequirementGaps({ ...a, flags: { ...a.flags, cnh: true } }, def('motorista_app'))).toEqual([]);
    expect(jobRequirementGaps(at(a, 20), def('seguranca'))).toContain('age');
    const weak = { ...a, character: { ...a.character, stats: { ...a.character.stats, athletic: 30 } } };
    expect(jobRequirementGaps(weak, def('seguranca'))).toContain('stats');
  });

  it('cartões da tela Carreiras: requisitos ✓/✗ corretos e escada com o cargo atual', () => {
    const a = adult(25);
    const card = careerCard(a, C, 'motorista_app')!;
    expect(card.requirements.find((r) => r.key === 'cnh')).toEqual({ key: 'cnh', ok: false });
    expect(card.requirements.find((r) => r.key === 'age')).toEqual({ key: 'age', ok: true });
    expect(card.ladder.length).toBeGreaterThanOrEqual(1);
    const employed = hire(a, 'lanchonete');
    const lc = careerCard(employed, C, 'lanchonete')!;
    expect(lc.current).toBe(true);
    expect(lc.ladder.map((l) => l.title)).toEqual(['Atendente', 'Supervisor', 'Gerente da lanchonete']);
    expect(lc.ladder[0]!.current).toBe(true);
    expect(careersIn(a, C, 'aprendiz').map((c) => c.def.id)).toEqual(['jovem_aprendiz', 'estagio']);
  });

  it('só um emprego por vez: trocar exige pedir demissão (replace); energia reservada pelo emprego', () => {
    let s = hire(adult(25), 'lanchonete');
    expect(s.energy.reserved).toBe(def('lanchonete').energy);
    expect(s.energy.current).toBeLessThan(adult(25).energy.current);
    const other = 'garcom';
    expect(['employed', 'no-opening']).toContain(jobBlockReason(s, def(other), C));
    s = hire(s, other, true);
    expect(s.economy.job?.jobId).toBe(other);
    expect(s.log.at(-1)!.entries.some((e) => e.includes('pediu demissão'))).toBe(true);
  });

  it('jovem aprendiz aos 14 e troca por outro emprego aos 18', () => {
    let s = enrolledGame(14);
    s = { ...s, energy: { current: 6, max: 6 } };
    s = hire(s, 'jovem_aprendiz');
    expect(s.economy.job?.jobId).toBe('jovem_aprendiz');
    s = { ...at(s, 18), energy: { current: 8, max: 8, reserved: 1 } };
    const id = 'garcom';
    s = hire(s, id, true);
    expect(s.economy.job?.jobId).toBe(id);
  });

  it('vagas do ano são determinísticas e mudam com a cidade/ano', () => {
    const a = adult(25);
    expect(jobOpenings(a, C)).toEqual(jobOpenings(a, C));
    const years = new Set(Array.from({ length: 8 }, (_, i) => jobOpenings({ ...a, year: a.year + i }, C).join(',')));
    expect(years.size).toBeGreaterThan(1);
  });

  it('promoção com bom desempenho e demissão com desempenho ruim', () => {
    const base = hire(adult(25), 'lanchonete');
    let promoted = 0;
    let fired = 0;
    for (let i = 0; i < 200; i++) {
      const good = jobYear({ ...base, economy: { ...base.economy, job: { ...base.economy.job!, performance: 90 } } }, createRng(i), C, { ...currentMarket(base), layoffRisk: 0 });
      if ((good.economy.job?.level ?? 0) > 1) promoted++;
      const bad = jobYear({ ...base, economy: { ...base.economy, job: { ...base.economy.job!, performance: 10 } } }, createRng(i), C, { ...currentMarket(base), layoffRisk: 0 });
      if (!bad.economy.job) fired++;
    }
    expect(promoted).toBeGreaterThan(40);
    expect(fired).toBeGreaterThan(60);
  });

  it('informal: paga 15% a mais, cai como trabalho informal e sem previdência; extrato coerente', () => {
    const s = hire(adult(25), 'servente');
    const y = jobYear(s, createRng(1), C, { ...currentMarket(s), layoffRisk: 0 });
    const e = y.economy.ledger.entries.find((x) => x.cat === 'trabalho_informal')!;
    expect(e.amount).toBe(Math.round(def('servente').salary[0] * 1.15));
    expect(y.economy.ledger.entries.some((x) => x.cat === 'salario')).toBe(false);
    expect(ledgerOk(y)).toBe(true);
    expect(ledgerSum(y)).toBe(e.amount);
  });

  it('conversar com os colegas e tirar a CNH', () => {
    const s = hire(adult(25), 'caixa');
    const t = talkToColleagues(s, C);
    expect(t.energy.current).toBe(s.energy.current - 1);
    expect(t.economy.job!.performance).toBeGreaterThan(s.economy.job!.performance);
    let passed = 0;
    for (let i = 0; i < 40; i++) {
      const r = getDriversLicense({ ...adult(25, 10000), rngState: i * 31 + 7 });
      expect(r.money).toBe(10000 - CNH_COST);
      expect(ledgerOk(r)).toBe(true);
      if (r.flags.cnh) passed++;
    }
    expect(passed).toBeGreaterThan(15);
    expect(passed).toBeLessThan(40);
  });

  it('carreira de lutador coexiste com um emprego e mostra a etapa', () => {
    let s = hire(adult(22, 20000), 'lanchonete');
    expect(fighterStage(s, C)).toBe('sem_academia');
    s = joinGym({ ...s, energy: { ...s.energy, current: 3 } }, 'gen_bairro', C);
    expect(s.fighter.gymId).toBe('gen_bairro');
    expect(s.economy.job?.jobId).toBe('lanchonete');
    expect(fighterStage(s, C)).toBe('aluno');
    expect(fighterNextStep(s, C).nextOrg).not.toBeNull();
  });
});
