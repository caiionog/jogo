import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  advanceYear,
  applyFightInjuries,
  baseMortality,
  createRng,
  deathRisk,
  fightInjuryChance,
  healthAction,
  healthYear,
  injuriesYear,
  playerSnapshot,
  simulateFight,
  treatInjury,
} from '../src/engine';
import type { FightInjuryInput, GameState } from '../src/engine';
import { ledgerOk } from './ecoHelpers';
import { fighterGame } from './fightHelpers';
import { withInjury } from './healthHelpers';
import { resolveAllFirst } from './helpers';

const C = GAME_CONTENT;
const hit = (damage: number, extra: Partial<FightInjuryInput> = {}): FightInjuryInput => ({ damage, koLoss: false, rules: 'mma', knockdowns: 0, result: 'W', method: 'DEC', ...extra });

describe('lesões', () => {
  it('chance de lesão cresce com o dano recebido e com o nocaute sofrido', () => {
    expect(fightInjuryChance(hit(80))).toBeGreaterThan(fightInjuryChance(hit(10)));
    expect(fightInjuryChance(hit(50, { koLoss: true }))).toBeGreaterThan(fightInjuryChance(hit(50)));
    expect(fightInjuryChance(hit(50, { rules: 'grappling' }))).toBeLessThan(fightInjuryChance(hit(50)));
  });

  it('geração é determinística pelo RNG e proporcional ao dano', () => {
    const g = fighterGame(25);
    const a = applyFightInjuries(g, createRng(42), C, hit(70));
    const b = applyFightInjuries(g, createRng(42), C, hit(70));
    expect(a.state.health).toEqual(b.state.health);
    let low = 0;
    let high = 0;
    for (let i = 1; i <= 300; i++) {
      if (applyFightInjuries(g, createRng(i), C, hit(5)).state.health.injuries.length) low++;
      if (applyFightInjuries(g, createRng(i), C, hit(90)).state.health.injuries.length) high++;
    }
    expect(high).toBeGreaterThan(low * 2);
  });

  it('recuperação: 12 meses por ano, sara no tempo certo', () => {
    let g = withInjury(fighterGame(25), 'lca', 18);
    g = injuriesYear(g, createRng(1), C);
    expect(g.health.injuries[0]!.months).toBe(6);
    g = injuriesYear(g, createRng(2), C);
    expect(g.health.injuries).toEqual([]);
    expect(g.log.flat().flatMap((y) => y.entries).join(' ')).toMatch(/recuperou da lesão/);
  });

  it('lutar antes de sarar pode agravar a lesão (dobra o tempo); sem lesão, nada a agravar', () => {
    const injured = withInjury(fighterGame(25), 'mao_fraturada', 4);
    let aggravated = 0;
    for (let i = 1; i <= 200; i++) {
      const r = applyFightInjuries(injured, createRng(i), C, hit(0));
      const inj = r.state.health.injuries.find((x) => x.defId === 'mao_fraturada')!;
      if (inj.aggravated) {
        aggravated++;
        expect(inj.months).toBeGreaterThanOrEqual(8);
      }
    }
    expect(aggravated).toBeGreaterThan(40);
    expect(aggravated).toBeLessThan(110);
  });

  it('sequela ao sarar é permanente (habilidade cai e não volta); agravada pesa mais', () => {
    let withSeq = 0;
    let withSeqAggr = 0;
    for (let i = 1; i <= 200; i++) {
      const g = withInjury(fighterGame(25, { grappling: 60 }), 'lca', 6);
      const r = injuriesYear(g, createRng(i), C);
      if (r.health.sequelae.includes('joelho_instavel')) {
        withSeq++;
        expect(r.fighter.skills.grappling).toBeLessThan(60);
      }
      const r2 = injuriesYear(withInjury(fighterGame(25), 'lca', 6, { aggravated: true }), createRng(i), C);
      if (r2.health.sequelae.length) withSeqAggr++;
    }
    expect(withSeq).toBeGreaterThan(70);
    expect(withSeqAggr).toBeGreaterThan(withSeq);
  });

  it('tratamento: fisioterapia cobra pelo extrato e encurta; cirurgia que falha deixa sequela', () => {
    const g0 = withInjury({ ...fighterGame(30), money: 200000, economy: { ...fighterGame(30).economy, ledger: { year: 2030, opening: 200000, entries: [] } } }, 'lca', 12);
    const id = g0.health.injuries[0]!.id;
    const f = treatInjury(g0, id, 'fisio', C);
    expect(f.health.injuries[0]!.months).toBe(9);
    expect(f.money).toBeLessThan(g0.money);
    expect(ledgerOk(f)).toBe(true);
    expect(treatInjury(f, id, 'cirurgia', C)).toBe(f); // um tratamento por lesão
    let failed = 0;
    let ok = 0;
    for (let i = 1; i <= 120; i++) {
      const r = treatInjury({ ...g0, rngState: i * 7919 }, id, 'cirurgia', C);
      if (r.health.sequelae.includes('joelho_instavel')) failed++;
      else {
        ok++;
        expect(r.health.injuries[0]!.months).toBe(9);
      }
      expect(r.feats.surgeries).toBe(1);
    }
    expect(failed).toBeGreaterThan(5);
    expect(ok).toBeGreaterThan(failed);
  });
});

describe('dano cerebral', () => {
  it('acumula com nocautes e knockdowns (oculto) e não com vitórias', () => {
    const g = fighterGame(25);
    const ko = applyFightInjuries(g, createRng(1), C, hit(60, { koLoss: true, result: 'L', method: 'KO', knockdowns: 2 }));
    expect(ko.state.health.brainDamage).toBeGreaterThanOrEqual(7);
    const win = applyFightInjuries(g, createRng(1), C, hit(10, { result: 'W', method: 'KO' }));
    expect(win.state.health.brainDamage).toBe(0);
  });

  it('enfraquece o queixo e aumenta a chance de ser nocauteado de novo', () => {
    const base = fighterGame(25, { trocacao: 55, grappling: 55, athletic: 60, chin: 60 });
    const hurt: GameState = { ...base, health: { ...base.health, brainDamage: 80 } };
    expect(playerSnapshot(hurt, 0).chin).toBe(40);
    const opp = { ...playerSnapshot(base, 0), id: 'opp', name: 'Rival', fullName: 'Rival' };
    let koHealthy = 0;
    let koHurt = 0;
    for (let i = 1; i <= 400; i++) {
      const a = simulateFight(playerSnapshot(base, 0), opp, { rounds: 3, rngState: i, rules: 'mma' }, C.fighting.text);
      const b = simulateFight(playerSnapshot(hurt, 0), opp, { rounds: 3, rngState: i, rules: 'mma' }, C.fighting.text);
      if (a.result?.winner === 1 && a.result.method === 'KO') koHealthy++;
      if (b.result?.winner === 1 && b.result.method === 'KO') koHurt++;
    }
    expect(koHurt).toBeGreaterThan(koHealthy);
  });

  it('cobra na velhice: inteligência cai mais com dano alto', () => {
    let lossHigh = 0;
    let lossLow = 0;
    for (let i = 1; i <= 60; i++) {
      const g = { ...fighterGame(70), year: 2070 };
      const hi = healthYear({ ...g, health: { ...g.health, brainDamage: 85 } }, createRng(i), C);
      const lo = healthYear(g, createRng(i), C);
      lossHigh += g.character.stats.intelligence - hi.character.stats.intelligence;
      lossLow += g.character.stats.intelligence - lo.character.stats.intelligence;
    }
    expect(lossHigh).toBeGreaterThan(lossLow);
  });
});

describe('saúde e doenças', () => {
  it('doenças surgem com a idade e fatores de risco; check-up recente já pega controlada', () => {
    let young = 0;
    let old = 0;
    for (let i = 1; i <= 200; i++) {
      if (healthYear(fighterGame(30), createRng(i), C).health.conditions.length) young++;
      const g = fighterGame(75);
      if (healthYear({ ...g, character: { ...g.character, stats: { ...g.character.stats, health: 25, athletic: 10 } } }, createRng(i), C).health.conditions.length) old++;
    }
    expect(old).toBeGreaterThan(young * 3);
    // check-up no ano: a doença nova já vem controlada
    for (let i = 1; i <= 200; i++) {
      const g0 = fighterGame(75);
      const g = { ...g0, health: { ...g0.health, habits: { ...g0.health.habits, checkupYear: g0.year } } };
      const r = healthYear(g, createRng(i), C);
      for (const c of r.health.conditions) expect(c.controlled).toBe(true);
    }
  });

  it('ações de saúde gastam dinheiro (pelo extrato) uma vez por ano', () => {
    const base = fighterGame(40);
    const g = { ...base, money: 10000, economy: { ...base.economy, ledger: { year: base.year, opening: 10000, entries: [] } } };
    const r = healthAction(g, C, 'gym');
    expect(r.money).toBeLessThan(g.money);
    expect(ledgerOk(r)).toBe(true);
    expect(healthAction(r, C, 'gym')).toBe(r);
  });
});

describe('morte', () => {
  it('a probabilidade de morte cresce com a idade', () => {
    let prev = 0;
    for (let age = 20; age <= 100; age += 5) {
      expect(baseMortality(age)).toBeGreaterThan(prev);
      prev = baseMortality(age);
      const g = fighterGame(age);
      expect(deathRisk(g, C)).toBeGreaterThan(0);
    }
    expect(baseMortality(30)).toBeLessThan(0.002);
    expect(baseMortality(90)).toBeGreaterThan(0.09);
  });

  it('saúde baixa, doenças e dano cerebral aumentam o risco', () => {
    const g = fighterGame(70);
    const sick: GameState = { ...g, health: { ...g.health, brainDamage: 70, conditions: [{ defId: 'cardiopatia', sinceAge: 60, controlled: false }] }, character: { ...g.character, stats: { ...g.character.stats, health: 20 } } };
    expect(deathRisk(sick, C)).toBeGreaterThan(deathRisk(g, C) * 5);
  });

  it('com a mesma seed (e as mesmas escolhas) a morte ocorre na mesma idade, com obituário', () => {
    const run = () => {
      let s = { ...fighterGame(60, {}, {}, 'morte-seed') };
      for (let i = 0; i < 70 && s.alive; i++) s = resolveAllFirst(advanceYear(s, C));
      return s;
    };
    const a = run();
    const b = run();
    expect(a.alive).toBe(false);
    expect(a.character.death?.age).toBe(b.character.death?.age);
    expect(a.character.death?.cause).toBe(b.character.death?.cause);
    expect(a.ending?.obituary.headline).toContain(a.character.name);
    expect(a.ending!.score).toBeGreaterThanOrEqual(0);
  });

  it('morte por evento (acidente) encerra a vida na hora', async () => {
    const { resolveEvent } = await import('../src/engine');
    const g = { ...fighterGame(40), pendingEvents: [{ eventId: 'health_car_accident', source: 'random' as const }] };
    let died = 0;
    for (let i = 1; i <= 300 && died === 0; i++) {
      const r = resolveEvent({ ...g, rngState: i * 104729 }, 'health_car_accident', 'home', C);
      if (!r.alive) {
        died++;
        expect(r.character.death?.cause).toMatch(/acidente/);
        expect(r.ending).not.toBeNull();
      }
    }
    expect(died).toBe(1);
  });
});
