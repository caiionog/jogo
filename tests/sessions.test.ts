import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import {
  actionBlockReason,
  advanceYear,
  applyForJob,
  currentMarket,
  dedicate,
  enterGym,
  interact,
  newGame,
  performAction,
  repeatMultiplier,
  sessionsBreakdown,
  sessionsLeft,
  sessionsReserved,
  trainFighter,
  trainingBlockReason,
  STATE_VERSION,
} from '../src/engine';
import type { GameState } from '../src/engine';
import { makeGame, withAge } from './helpers';
import { migrate } from '../src/save/migrations';
import fixturesV8 from '../src/save/__fixtures__/saves-v8.json';

const adult = (): GameState => {
  const g = withAge(makeGame('sessoes'), 20);
  return { ...g, money: 100000 };
};

function withJob(s: GameState, jobId: string): GameState {
  return { ...s, economy: { ...s.economy, job: { jobId, level: 1, performance: 50, years: 0 } } };
}

describe('sem energia', () => {
  it('o estado não tem energia; tem contadores anuais', () => {
    const g = makeGame();
    expect('energy' in g).toBe(false);
    expect(g.yearUses).toEqual({});
  });

  it('nenhuma ação, emprego ou organização de conteúdo fala de energia', () => {
    const json = JSON.stringify({ actions: C.actions, jobs: C.economy.jobs, orgs: C.fighting.orgs, events: C.events, clubs: C.clubs });
    expect(json).not.toMatch(/"energyCost"|"energy":|"campCost"/);
    // a narração da luta pode falar em "gasta energia numa queda"; o resto do conteúdo não
    const texts = JSON.stringify({ actions: C.actions, events: C.events, jobs: C.economy.jobs });
    expect(texts).not.toMatch(/⚡|[Ee]nergia/);
  });
});

describe('limite de 10 sessões de treino por ano', () => {
  it('10 treinos e depois bloqueia', () => {
    let g = adult();
    for (let i = 0; i < 10; i++) {
      expect(trainingBlockReason(g, 'fisico', C)).toBeNull();
      g = trainFighter(g, 'fisico', C);
    }
    expect(sessionsLeft(g, C)).toBe(0);
    expect(trainingBlockReason(g, 'fisico', C)).toBe('no-sessions');
    expect(trainFighter(g, 'fisico', C)).toBe(g);
  });

  it('as modalidades e o físico dividem as mesmas sessões', () => {
    let g = adult();
    g = trainFighter(g, 'fisico', C);
    g = trainFighter(g, 'trocacao', C);
    g = trainFighter(g, 'jiujitsu', C);
    expect(g.fighter.sessionsThisYear).toBe(3);
    expect(sessionsLeft(g, C)).toBe(7);
  });

  it('as sessões voltam no ano seguinte', () => {
    let g = adult();
    for (let i = 0; i < 10; i++) g = trainFighter(g, 'fisico', C);
    g = advanceYear(g, { ...C, events: [] });
    expect(sessionsLeft(g, C)).toBe(10);
  });

  it('emprego de tempo integral ocupa 4 sessões; meio período ou estágio ocupa 2', () => {
    const full = C.economy.jobs.find((j) => j.category === 'formal' && j.trainingSessions === 4)!;
    const part = C.economy.jobs.find((j) => j.id === 'lanchonete')!;
    const intern = C.economy.jobs.find((j) => j.id === 'estagio')!;
    expect(part.trainingSessions).toBe(2);
    expect(intern.trainingSessions).toBe(2);
    const g = adult();
    expect(sessionsLeft(withJob(g, full.id), C)).toBe(6);
    expect(sessionsLeft(withJob(g, part.id), C)).toBe(8);
    expect(sessionsBreakdown(withJob(g, full.id), C)[0]!.text).toBe('Seu emprego ocupa 4 sessões de treino');
  });

  it('todo emprego ocupa 0, 2 ou 4 sessões', () => {
    for (const j of C.economy.jobs) expect([0, 2, 4]).toContain(j.trainingSessions);
  });

  it('candidatar-se não depende de sessões livres', () => {
    let g = adult();
    for (let i = 0; i < 10; i++) g = trainFighter(g, 'fisico', C);
    const job = C.economy.jobs.find((j) => j.id === 'servente')!;
    let hired = g;
    for (let i = 0; i < 20 && !hired.economy.job; i++) hired = applyForJob({ ...g, rngState: i + 1 }, job.id, C, currentMarket(g));
    expect(hired.economy.job?.jobId).toBe('servente');
    expect(sessionsLeft(hired, C)).toBe(0);
  });

  it('o camp de luta ocupa sessões', () => {
    let g = adult();
    g = enterGym(g, C.fighting.gyms.find((x) => x.city === null)!.id, C);
    g = advanceYear({ ...g, fighter: { ...g.fighter, amateur: { ...g.fighter.amateur, wins: 1 } } }, { ...C, events: [] });
    const offer = g.fighter.offers[0];
    if (offer) {
      expect(offer.campSessions).toBeGreaterThan(0);
      let busy = g;
      for (let i = 0; i < 10; i++) busy = trainFighter(busy, 'fisico', C);
      expect(sessionsLeft(busy, C)).toBe(0);
    }
  });

  it('gerenciar a empresa de perto ocupa 2 sessões', () => {
    const g = adult();
    const biz = { id: 'b1', defId: C.economy.businesses[0]!.id, name: 'Teste', level: 1, cash: 0, manager: false, dedicatedYear: 0, profits: [], lastProfit: 0, yearsOpen: 0, redYears: 0 };
    const s = { ...g, economy: { ...g.economy, businesses: [biz as never] } } as GameState;
    const d = dedicate(s, 'b1', C);
    expect(sessionsReserved(d, C)).toBe(2);
    expect(sessionsLeft(d, C)).toBe(8);
  });
});

describe('retorno decrescente nas outras atividades', () => {
  it('estudar várias vezes no ano rende cada vez menos, sem bloquear', () => {
    let g = withAge(makeGame('estudo'), 12);
    g = { ...g, character: { ...g.character, stats: { ...g.character.stats, intelligence: 40 } } };
    const gains: number[] = [];
    for (let i = 0; i < 6; i++) {
      expect(actionBlockReason(g, C.actions.find((a) => a.id === 'study'))).toBeNull();
      const before = g.character.stats.intelligence;
      g = performAction(g, 'study', C);
      gains.push(g.character.stats.intelligence - before);
    }
    expect(gains[0]).toBeGreaterThan(gains[5]!);
    expect(gains.slice(1).every((x, i) => x <= gains[i]!)).toBe(true);
    expect(g.yearUses['acao:study']).toBe(6);
  });

  it('o multiplicador segue a tabela de dados e zera no ano seguinte', () => {
    let g = withAge(makeGame('rep'), 15);
    expect(repeatMultiplier(g, 'acao:go_out', C)).toBe(1);
    g = performAction(g, 'go_out', C);
    expect(repeatMultiplier(g, 'acao:go_out', C)).toBe(C.limits.repeatMultipliers[1]);
    g = advanceYear(g, { ...C, events: [] });
    expect(g.yearUses).toEqual({});
  });

  it('interações com a mesma pessoa rendem menos no mesmo ano', () => {
    let g = withAge(makeGame('afeto'), 20);
    const rel = g.relationships.relations.find((r) => r.type === 'mae')!;
    g = { ...g, relationships: { ...g.relationships, relations: g.relationships.relations.map((r) => (r.personId === rel.personId ? { ...r, affection: 20 } : r)) } };
    const aff = (s: GameState) => s.relationships.relations.find((r) => r.personId === rel.personId)!.affection;
    const d: number[] = [];
    for (let i = 0; i < 5; i++) {
      const b = aff(g);
      g = interact(g, rel.personId, 'spend_time', C);
      d.push(aff(g) - b);
    }
    expect(d[0]!).toBeGreaterThan(d[4]!);
  });

  it('bebês não fazem atividades', () => {
    const g = makeGame();
    expect(actionBlockReason(g, C.actions.find((a) => a.id === 'study'))).toBe('too-young');
  });
});

describe('migração v8 → v9', () => {
  const v8 = fixturesV8 as unknown as Record<string, Record<string, unknown>>;
  it('fixtures são saves v8 reais com energia', () => {
    for (const s of Object.values(v8)) {
      expect(s.version).toBe(8);
      expect(s.energy).toBeDefined();
    }
  });
  it.each(Object.keys(v8))('%s: remove a energia, cria yearUses e campSessions', (k) => {
    const m = migrate(structuredClone(v8[k]));
    expect(m.version).toBe(STATE_VERSION);
    expect('energy' in m).toBe(false);
    expect(m.yearUses).toEqual({});
    expect(m.fighter.sessionsThisYear).toBeLessThanOrEqual(10);
    for (const o of m.fighter.offers) {
      expect(o.campSessions).toBeGreaterThan(0);
      expect('campCost' in o).toBe(false);
    }
    if (m.activeFight) expect(m.activeFight.offer.campSessions).toBeGreaterThan(0);
    // o jogo continua depois da migração
    const next = advanceYear(m.pendingEvents.length || m.activeFight ? { ...m, pendingEvents: [], activeFight: null } : m, C);
    expect(next.character.age).toBeGreaterThanOrEqual(m.character.age);
  });
  it('um save novo não tem nada para migrar', () => {
    const g = newGame({ seed: 'novo', name: 'X', sex: 'F' }, C);
    expect(migrate(structuredClone(g))).toEqual(g);
  });
});
