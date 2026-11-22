import { describe, expect, it } from 'vitest';
import { withInjury } from './healthHelpers';
import { GAME_CONTENT } from '../src/content';
import { TRAINING_COST, ageFactor, diminishing, expectedGain, trainFighter, trainingBlockReason } from '../src/engine';
import { fighterGame } from './fightHelpers';

const gym = (id: string) => GAME_CONTENT.fighting.gyms.find((g) => g.id === id)!;

describe('ganho de treino', () => {
  it('retornos decrescentes: quanto maior a habilidade, menor o ganho', () => {
    const ctx = { age: 27, health: 90, gym: gym('sp_leao_dourado') };
    const gains = [10, 40, 70, 90].map((v) => expectedGain(7, 'trocacao', v, ctx));
    for (let i = 1; i < gains.length; i++) expect(gains[i]!).toBeLessThan(gains[i - 1]!);
    expect(gains[3]! / gains[0]!).toBeLessThan(0.1);
    expect(diminishing(100)).toBe(0);
  });

  it('efeito da idade: pico entre 25 e 32, declínio depois', () => {
    expect(ageFactor(27)).toBe(1);
    expect(ageFactor(32)).toBe(1);
    expect(ageFactor(20)).toBeLessThan(1);
    expect(ageFactor(8)).toBeLessThan(ageFactor(15));
    expect(ageFactor(35)).toBeLessThan(1);
    expect(ageFactor(40)).toBeLessThan(ageFactor(35));
  });

  it('academia: treinador melhor e especialidade aumentam o ganho; sem academia rende menos', () => {
    const base = { age: 27, health: 90 };
    const none = expectedGain(7, 'trocacao', 40, { ...base, gym: undefined });
    const weak = expectedGain(7, 'trocacao', 40, { ...base, gym: gym('gen_bairro') });
    const strikingGym = expectedGain(7, 'trocacao', 40, { ...base, gym: gym('sp_muay_zona_leste') });
    const bjjGym = expectedGain(7, 'trocacao', 40, { ...base, gym: gym('sp_tatame_paulista') });
    expect(weak).toBeGreaterThan(none);
    expect(strikingGym).toBeGreaterThan(bjjGym); // especialidade
    expect(expectedGain(7, 'trocacao', 40, { ...base, gym: undefined, talent: 1.3 })).toBeCloseTo(none * 1.3);
    expect(expectedGain(7, 'trocacao', 40, { age: 27, health: 30, gym: undefined })).toBeLessThan(none);
  });

  it('cada treino sobe o atributo certo: jiu-jitsu, trocação, físico (Capacidade atlética)', () => {
    const g = fighterGame(25, { jiujitsu: 30, trocacao: 30 }, { gymId: 'sp_muay_zona_leste' });
    const jj = trainFighter(g, 'jiujitsu', GAME_CONTENT);
    expect(jj.energy.current).toBe(g.energy.current - TRAINING_COST.jiujitsu);
    expect(jj.fighter.skills.jiujitsu).toBeGreaterThan(30);
    expect(jj.fighter.skills.trocacao).toBe(30);
    const tr = trainFighter(g, 'trocacao', GAME_CONTENT);
    expect(tr.fighter.skills.trocacao).toBeGreaterThan(30);
    expect(tr.fighter.skills.jiujitsu).toBe(30);
    const low = { ...g, character: { ...g.character, stats: { ...g.character.stats, athletic: 30 } } };
    const fi = trainFighter(low, 'fisico', GAME_CONTENT);
    expect(fi.character.stats.athletic).toBeGreaterThan(30);
    expect(fi.fighter.skills).toEqual(g.fighter.skills);
    const sp = trainFighter(g, 'sparring', GAME_CONTENT);
    expect(sp.fighter.skills.jiujitsu).toBeGreaterThan(30);
    expect(sp.fighter.skills.trocacao).toBeGreaterThan(30);
  });

  it('retornos decrescentes no treino real: quem já é bom ganha menos', () => {
    const lo = trainFighter(fighterGame(25, { trocacao: 20 }), 'trocacao', GAME_CONTENT).fighter.skills.trocacao - 20;
    const hi = trainFighter(fighterGame(25, { trocacao: 80 }), 'trocacao', GAME_CONTENT).fighter.skills.trocacao - 80;
    expect(hi).toBeLessThan(lo / 3);
    const aLo = (s: number) => {
      const g = fighterGame(25);
      const st = { ...g, character: { ...g.character, stats: { ...g.character.stats, athletic: s } } };
      return trainFighter(st, 'fisico', GAME_CONTENT).character.stats.athletic - s;
    };
    expect(aLo(90)).toBeLessThanOrEqual(aLo(20));
  });

  it('sparring pode lesionar', () => {
    let injured = 0;
    for (let i = 0; i < 200; i++) {
      const r = trainFighter(fighterGame(25, {}, {}, `sp${i}`), 'sparring', GAME_CONTENT);
      if (r.health.injuries.length) injured++;
    }
    expect(injured).toBeGreaterThan(4);
    expect(injured).toBeLessThan(40);
  });

  it('bloqueios: sem energia, muito novo, sparring lesionado', () => {
    expect(trainingBlockReason({ ...fighterGame(25), energy: { current: 1, max: 8 } }, 'trocacao')).toBe('no-energy');
    expect(trainingBlockReason(fighterGame(8), 'sparring')).toBe('too-young');
    expect(trainingBlockReason(withInjury(fighterGame(25), 'lca', 12), 'sparring')).toBe('injured');
    expect(trainingBlockReason(withInjury(fighterGame(25), 'distensao', 2), 'sparring')).toBe(null);
  });

  it('clubes escolares de luta contam como treino na infância', () => {
    const judo = GAME_CONTENT.clubs.find((c) => c.id === 'judo')!;
    expect(judo.yearlyEffects.fighter?.skills?.jiujitsu).toBeGreaterThan(0);
  });
});

describe('academias', () => {
  it('entrar custa energia; respeita cidade, idade e dinheiro', async () => {
    const { joinGym, gymBlockReason, leaveGym } = await import('../src/engine');
    const g = { ...fighterGame(20), character: { ...fighterGame(20).character, city: 'São Paulo' }, money: 0 };
    expect(gymBlockReason(g, 'rj_irmandade', GAME_CONTENT)).toBe('other-city');
    expect(gymBlockReason(g, 'sp_leao_dourado', GAME_CONTENT)).toBe('no-money');
    const kid = { ...g, character: { ...g.character, age: 6 } };
    expect(gymBlockReason(kid, 'sp_leao_dourado', GAME_CONTENT)).toBe('too-young');
    expect(gymBlockReason(kid, 'sp_tatame_paulista', GAME_CONTENT)).toBeNull(); // pais pagam
    const rich = { ...g, money: 20000 };
    const r = joinGym(rich, 'sp_leao_dourado', GAME_CONTENT);
    expect(r.fighter.gymId).toBe('sp_leao_dourado');
    expect(r.energy.current).toBe(rich.energy.current - 1);
    expect(gymBlockReason(r, 'sp_leao_dourado', GAME_CONTENT)).toBe('current');
    expect(leaveGym(r, GAME_CONTENT).fighter.gymId).toBeNull();
  });

  it('mensalidade cobrada a partir dos 18; sem dinheiro, sai da academia', async () => {
    const { advanceYear } = await import('../src/engine');
    const base = fighterGame(20, {}, { gymId: 'gen_bairro', reputation: 0 });
    const paid = advanceYear({ ...base, money: 5000 }, GAME_CONTENT);
    expect(paid.money).toBeLessThanOrEqual(5000 - 1200);
    const broke = advanceYear({ ...base, money: 0 }, GAME_CONTENT);
    expect(broke.fighter.gymId).toBeNull();
    const sponsored = advanceYear({ ...base, money: 0, fighter: { ...base.fighter, reputation: 30 } }, GAME_CONTENT);
    expect(sponsored.fighter.gymId).toBe('gen_bairro');
  });
});
