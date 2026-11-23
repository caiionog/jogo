import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import {
  STATE_VERSION,
  advanceYear,
  askParentsForExchange,
  clubTrainBlockReason,
  exchangeBlockReason,
  joinSportsClub,
  sessionsLeft,
  sportsClubBlockReason,
  startExchange,
  trainAtClub,
  trainFighter,
  trainingBlockReason,
} from '../src/engine';
import type { GameState } from '../src/engine';
import { migrate } from '../src/save/migrations';
import fixturesV12 from '../src/save/__fixtures__/saves-v12.json';
import { makeGame, withAge } from './helpers';

const NO_EV = { ...C, events: [] };
const at = (age: number, money = 200000, seed = 'clube'): GameState => ({ ...withAge(makeGame(seed), age), money });
const fullJob = (s: GameState): GameState => ({ ...s, economy: { ...s.economy, job: { jobId: 'caixa', level: 1, performance: 50, years: 0 } } });

describe('clube esportivo', () => {
  it('idade mínima de 6 anos e mensalidade (pais pagam até os 18)', () => {
    expect(sportsClubBlockReason(at(5), 'clube_bairro', 'futebol', C)).toBe('too-young');
    expect(sportsClubBlockReason(at(8, 0), 'clube_bairro', 'futebol', C)).toBeNull(); // pais pagam
    expect(sportsClubBlockReason(at(25, 0), 'clube_bairro', 'futebol', C)).toBe('no-money');
    expect(sportsClubBlockReason(at(10), 'clube_bairro', 'natacao', C)).toBe('no-sport');
    const adult = joinSportsClub(at(25, 5000), 'clube_bairro', 'volei', C);
    const next = advanceYear(adult, NO_EV);
    expect(next.money).toBeLessThan(adult.money); // mensalidade (e o resto do custo de vida)
    expect(next.economy.history.at(-1)!.totals.educacao).toBe(-C.sportsClubs[0]!.fee);
    const kid = joinSportsClub(at(9, 0), 'clube_bairro', 'futebol', C);
    expect(advanceYear(kid, NO_EV).sportsClub).toMatchObject({ clubId: 'clube_bairro', years: 1 });
  });

  it('treinar no clube conta nas 10 sessões e sobe a Capacidade atlética', () => {
    let s = joinSportsClub(at(12), 'clube_bairro', 'futebol', C);
    s = { ...s, character: { ...s.character, stats: { ...s.character.stats, athletic: 30 } } };
    for (let i = 0; i < 10; i++) s = trainAtClub(s, C);
    expect(sessionsLeft(s, C)).toBe(0);
    expect(clubTrainBlockReason(s, C)).toBe('no-sessions');
    expect(s.character.stats.athletic).toBeGreaterThan(30);
    expect(s.fighter.skills.grappling).toBe(makeGame('clube').fighter.skills.grappling);
  });

  it('judô do clube dá grappling e conta para a faixa de judô', () => {
    let s = joinSportsClub(at(10), 'clube_bairro', 'judo', C);
    s = trainAtClub(s, C);
    expect(s.fighter.skills.grappling).toBeGreaterThan(5);
    expect(s.fighter.grades.judo).toMatchObject({ system: 'judo', rank: 0 });
    expect(s.fighter.trainedThisYear).toContain('judo');
  });
});

describe('intercâmbio', () => {
  it('requisitos: 16+, autorização dos pais até os 18, custo e conflito com emprego de tempo integral', () => {
    expect(exchangeBlockReason(at(15), 'tailandia', C)).toBe('too-young');
    expect(exchangeBlockReason(at(16), 'tailandia', C)).toBe('needs-parents');
    const authorized = { ...at(16), flags: { autorizacao_intercambio: at(16).year } };
    expect(exchangeBlockReason(authorized, 'tailandia', C)).toBeNull();
    expect(exchangeBlockReason(at(20, 1000), 'tailandia', C)).toBe('no-money');
    expect(exchangeBlockReason(fullJob(at(25)), 'tailandia', C)).toBe('job');
    expect(exchangeBlockReason({ ...fullJob(at(25)), flags: { licenca: at(25).year } }, 'tailandia', C)).toBeNull();
  });

  it('pedir aos pais: uma vez por ano, decisão determinística', () => {
    const s = askParentsForExchange(at(17));
    expect(askParentsForExchange(s)).toBe(s);
    expect(askParentsForExchange(at(17))).toEqual(s);
  });

  it('um ano fora: custo, só a modalidade do programa, escola em pausa, ganho grande e reputação na volta', () => {
    let s = at(20, 200000);
    const before = s.money;
    s = startExchange(s, 'tailandia', C);
    expect(s.money).toBe(before - 48000);
    expect(trainingBlockReason(s, 'muaythai', C)).toBeNull();
    expect(trainingBlockReason(s, 'jiujitsu', C)).toBe('not-offered');
    for (let i = 0; i < 7; i++) s = trainFighter(s, 'muaythai', C);
    const troc = s.fighter.skills.trocacao;
    const rep = s.fighter.reputation;
    const next = advanceYear(s, NO_EV);
    expect(next.exchange).toBeNull();
    expect(next.fighter.skills.trocacao).toBeGreaterThan(troc + 3);
    expect(next.fighter.reputation).toBeGreaterThan(rep);
    expect(next.flags.fez_intercambio_tailandia).toBe(true);
    expect(next.character.city).toBe(s.character.city); // continua morando no Brasil
    // escola em pausa
    const teen = { ...at(16, 200000, 'escola-pausa'), flags: { autorizacao_intercambio: at(16).year } };
    const ex = startExchange(teen, 'japao', C);
    const grade = ex.education.current?.grade;
    if (grade !== undefined) expect(advanceYear(ex, NO_EV).education.current?.grade).toBe(grade);
  });
});

describe('migração v12 → v13', () => {
  const v12 = fixturesV12 as unknown as Record<string, Record<string, unknown>>;
  it.each(Object.keys(v12))('%s', (k) => {
    const m = migrate(structuredClone(v12[k]));
    expect(m.version).toBe(STATE_VERSION);
    expect(m.sportsClub).toBeNull();
    expect(m.exchange).toBeNull();
  });
});
