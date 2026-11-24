/** Minigames (release 0.0.4, fase 7): o pênalti é puro, determinístico e ligado ao jogo pelo `state.minigame`. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { PENALTY, advanceYear, finishMinigame, practiceBlockReason, startMinigame, startPenaltyPractice, zoneOf } from '../src/engine';
import { makeGame, withAge } from './helpers';

const setup = (seed: string, skill = 70, pressure = 0.5) => PENALTY.setup(seed, { skill, pressure, keeperSkill: 50 });

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
