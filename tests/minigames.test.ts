/** Minigames (release 0.0.4, fase 7): o pênalti é puro, determinístico e ligado ao jogo pelo `state.minigame`. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { PENALTY, advanceYear, finishMinigame, practiceBlockReason, startMinigame, startPenaltyPractice, zoneOf } from '../src/engine';
import { makeGame, withAge } from './helpers';

const setup = (seed: string, skill = 70, pressure = 0.5) => PENALTY.setup(seed, { skill, pressure, opponent: 50 });

describe('pênalti', () => {
  it('zonas 3 × 2', () => {
    expect(zoneOf(-0.9, 0.1)).toBe(0);
    expect(zoneOf(0, 0.1)).toBe(1);
    expect(zoneOf(0.9, 0.9)).toBe(5);
  });

  it('mesma jogada e mesma entrada: mesmo resultado; setup não depende do RNG do jogo', () => {
    const a = setup('x');
    expect(setup('x')).toEqual(a);
    const input = { x: 0.6, y: 0.4, power: 0.6 };
    expect(PENALTY.resolve(a, input)).toEqual(PENALTY.resolve(a, input));
  });

  it('força demais isola; fraca demais o goleiro pega; canto com força boa marca quase sempre', () => {
    let goals = 0;
    for (let i = 0; i < 200; i++) {
      const s = setup(`s${i}`, 80, 0.2);
      expect(PENALTY.resolve(s, { x: 0, y: 0.3, power: 0.97 }).outcome).toBe('fora');
      expect(PENALTY.resolve(s, { x: 0, y: 0.3, power: 0.1 }).outcome).toBe('defesa');
      if (PENALTY.resolve(s, { x: 0.75, y: 0.3, power: 0.65 }).outcome === 'gol') goals++;
    }
    expect(goals).toBeGreaterThan(150);
  });

  it('"Simular": finalizador bom converte mais que um ruim', () => {
    let good = 0;
    let bad = 0;
    for (let i = 0; i < 300; i++) {
      const g = setup(`g${i}`, 90, 0.7);
      const b = setup(`g${i}`, 15, 0.7);
      if (PENALTY.resolve(g, PENALTY.simulate(g)).outcome === 'gol') good++;
      if (PENALTY.resolve(b, PENALTY.simulate(b)).outcome === 'gol') bad++;
    }
    expect(good).toBeGreaterThan(bad);
    expect(good / 300).toBeGreaterThan(0.6);
  });
});

describe('minigame no jogo', () => {
  it('treino: até 3 por ano; abrir e terminar limpa o estado e registra no log', () => {
    let s = withAge(makeGame('mg'), 15);
    for (let i = 0; i < 3; i++) {
      s = startPenaltyPractice(s);
      expect(s.minigame?.context).toBe('treino');
      expect(practiceBlockReason(s)).toBe('open');
      s = finishMinigame(s, null);
      expect(s.minigame).toBeNull();
    }
    expect(practiceBlockReason(s)).toBe('tried');
    expect(JSON.stringify(s.log.slice(-3))).toContain('pênalti');
  });

  it('o ano não fica travado: minigame aberto é simulado na virada', () => {
    const s = startMinigame(withAge(makeGame('mg2'), 20), 'penalty', 'jogo');
    const next = advanceYear(s, GAME_CONTENT);
    expect(next.minigame ?? null).toBeNull();
    expect(next.year).toBe(s.year + 1);
  });

  it('o evento do pênalti abre o minigame', () => {
    const ev = GAME_CONTENT.events.find((e) => e.id === 'fut_penalti_jogo')!;
    expect(ev.choices[0]!.effects?.minigame).toEqual({ kind: 'penalty', context: 'jogo' });
  });
});

import { GOALIE, MMA, MMA_COUNTER, PASS, SHOT, MINIGAMES, minigamePreview, startPractice } from '../src/engine';
import type { MinigameKind } from '../src/engine';

const ctx = (skill: number) => ({ skill, pressure: 0.5, opponent: 50 });

describe('finalização, passe, goleiro e MMA', () => {
  it('finalização: parar no centro da brecha marca; longe dela, não', () => {
    for (let i = 0; i < 50; i++) {
      const s = SHOT.setup(`f${i}`, ctx(70));
      expect(SHOT.resolve(s, { at: s.gap - s.noise * s.spread }).success).toBe(true);
      expect(SHOT.resolve(s, { at: s.gap > 0.5 ? 0.05 : 0.95 }).success).toBe(false);
    }
  });

  it('passe: força errada nunca chega; força certa chega na maioria', () => {
    let ok = 0;
    for (let i = 0; i < 100; i++) {
      const s = PASS.setup(`p${i}`, ctx(70));
      expect(PASS.resolve(s, { lane: 0, power: s.lanes[0]!.distance + 0.5 }).outcome).toBe('forte');
      expect(PASS.resolve(s, { lane: 0, power: Math.max(0, s.lanes[0]!.distance - 0.5) }).outcome).toBe('fraco');
      const best = s.lanes.map((l, j) => ({ j, r: l.marker })).sort((a, b) => a.r - b.r)[0]!.j;
      if (PASS.resolve(s, { lane: best, power: s.lanes[best]!.distance }).success) ok++;
    }
    expect(ok).toBeGreaterThan(55);
  });

  it('goleiro: pular no canto certo defende bem mais que no oposto', () => {
    let right = 0;
    let wrong = 0;
    for (let i = 0; i < 200; i++) {
      const s = GOALIE.setup(`g${i}`, ctx(70));
      if (GOALIE.resolve(s, { zone: s.shotZone }).success) right++;
      if (GOALIE.resolve(s, { zone: (s.shotZone + 1) % 3 + (s.shotZone >= 3 ? 0 : 3) }).success) wrong++;
    }
    expect(right).toBeGreaterThan(wrong * 3);
  });

  it('MMA: respostas certas vencem as 3 trocas', () => {
    const s = MMA.setup('m', ctx(60));
    const r = MMA.resolve(s, { answers: s.attacks.map((a) => MMA_COUNTER[a]) as never });
    expect(r).toEqual({ success: true, won: 3, rounds: [true, true, true] });
  });

  it.each(Object.keys(MINIGAMES) as MinigameKind[])('%s: abre, simula e fecha pelo jogo', (kind) => {
    let s = withAge(makeGame(`mg-${kind}`), 20);
    if (kind === 'mma') s = { ...s, fighter: { ...s.fighter, gymId: GAME_CONTENT.fighting.gyms[0]!.id } };
    s = startPractice(s, kind);
    expect(s.minigame?.kind).toBe(kind);
    expect(minigamePreview(s, null)).toEqual(minigamePreview(s, null));
    s = finishMinigame(s, null);
    expect(s.minigame).toBeNull();
  });
});
