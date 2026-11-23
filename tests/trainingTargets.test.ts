import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { STATE_VERSION, trainFighter } from '../src/engine';
import type { ModalityId } from '../src/engine';
import { migrate } from '../src/save/migrations';
import fixturesV9 from '../src/save/__fixtures__/saves-v9.json';
import { fighterGame } from './fightHelpers';
import { trainingSummary } from '../scripts/lib/trainingProfile';

const MMA_GYM = 'sp_leao_dourado';

describe('modalidades (release 0.0.1)', () => {
  it.each(C.fighting.modalities.map((m) => m.id))('%s sobe a habilidade certa e a Capacidade atlética', (id) => {
    const mod = C.fighting.modalities.find((m) => m.id === id)!;
    const gym = C.fighting.gyms.find((g) => g.modalities.includes(id as ModalityId))!;
    let g = { ...fighterGame(22, { grappling: 30, trocacao: 30, athletic: 30 }, { gymId: gym.id }), money: 100000 };
    let ath = 0;
    for (let i = 0; i < 10; i++) {
      const before = g.character.stats.athletic;
      g = trainFighter(g, id as ModalityId, C);
      ath += g.character.stats.athletic - before;
    }
    const other = mod.skill === 'grappling' ? 'trocacao' : 'grappling';
    expect(g.fighter.skills[mod.skill]).toBeGreaterThan(30);
    expect(g.fighter.skills[other]).toBe(30);
    expect(ath).toBeGreaterThan(0);
    // menos atlética que o treino físico puro
    let f = { ...fighterGame(22, { athletic: 30 }, { gymId: gym.id }), money: 100000 };
    for (let i = 0; i < 10; i++) f = trainFighter(f, 'fisico', C);
    expect(f.character.stats.athletic - 30).toBeGreaterThan(ath);
  });

  it('toda academia oferece pelo menos uma modalidade; há academias de muay thai e mistas', () => {
    expect(C.fighting.gyms.every((g) => g.modalities.length > 0)).toBe(true);
    expect(C.fighting.gyms.filter((g) => g.modalities.length === 1 && g.modalities[0] === 'muaythai').length).toBeGreaterThanOrEqual(4);
    expect(C.fighting.gyms.filter((g) => g.modalities.includes('jiujitsu') && g.modalities.includes('muaythai')).length).toBeGreaterThanOrEqual(5);
    expect(C.fighting.gyms.find((g) => g.id === MMA_GYM)!.modalities.length).toBeGreaterThanOrEqual(4);
  });
});

describe('metas de evolução (Melhoria 3, perfil de 10 sessões por ano desde os 10)', () => {
  // 7 sessões na modalidade principal + 3 de físico, academia de nível médio; 150 vidas (determinístico)
  const s = trainingSummary(150, 'meta');
  it('chega a "Sólido" na modalidade principal por volta dos 17–18 (tolerância 16–19)', () => {
    expect(s.solidMedian).toBeGreaterThanOrEqual(16);
    expect(s.solidMedian).toBeLessThanOrEqual(19);
  });
  it('chega a "Elite" por volta dos 24–27 com talento (tolerância 23–28)', () => {
    expect(s.eliteMedianTalented).toBeGreaterThanOrEqual(23);
    expect(s.eliteMedianTalented).toBeLessThanOrEqual(28);
    expect(s.eliteReachedTalented).toBeGreaterThan(0.8);
  });
  it('Capacidade atlética de quem treina pesado passa de 70 no começo da vida adulta', () => {
    expect(s.athletic21Median).toBeGreaterThanOrEqual(70);
    expect(s.athletic21Median).toBeLessThanOrEqual(90);
  });
});

describe('migração v9 → v10', () => {
  const v9 = fixturesV9 as unknown as Record<string, Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
  it('fixtures são saves v9 reais com a faixa antiga', () => {
    for (const s of Object.values(v9)) {
      expect(s.version).toBe(9);
      expect(s.fighter.belt).toBeDefined();
      expect(s.fighter.skills).toHaveProperty('jiujitsu');
    }
  });
  it.each(Object.keys(v9))('%s: jiu-jitsu → grappling, faixa → graduações', (k) => {
    const raw = v9[k]!;
    const m = migrate(structuredClone(raw));
    expect(m.version).toBe(STATE_VERSION);
    expect(m.fighter.skills.grappling).toBe(raw.fighter.skills.jiujitsu);
    expect(m.fighter.skills).not.toHaveProperty('jiujitsu');
    expect(m.fighter).not.toHaveProperty('belt');
    expect(m.fighter).not.toHaveProperty('trainedBjjThisYear');
    expect(Array.isArray(m.fighter.trainedThisYear)).toBe(true);
    const json = JSON.stringify({ w: m.world, o: m.fighter.offers, a: m.activeFight });
    expect(json).not.toMatch(/"jiujitsu":/);
    const belt = raw.fighter.belt as { rank: number; years: number };
    const g = m.fighter.grades.jiujitsu;
    if (raw.character.age >= 16 && g) expect(g).toMatchObject({ system: 'bjj_adulto', rank: belt.rank });
    if (raw.character.age < 16 && g) expect(g.system).toBe('bjj_infantil');
  });
  it('é determinística', () => {
    const k = Object.keys(v9)[1]!;
    expect(migrate(structuredClone(v9[k]))).toEqual(migrate(structuredClone(v9[k])));
  });
});
