import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { GameContent, GameState } from '../src/engine';
import { advanceYear, maxEnergy, resolveEvent } from '../src/engine';
import { makeEvent, makeGame, withAge } from './helpers';

/** Avança N anos sempre escolhendo a primeira opção de cada evento. */
function playYears(state: GameState, years: number, content: GameContent = GAME_CONTENT): GameState {
  let s = state;
  for (let i = 0; i < years; i++) {
    s = advanceYear(s, content);
    while (s.pendingEvents.length > 0) {
      const ev = content.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
      s = resolveEvent(s, ev.id, ev.choices[0]!.id, content);
    }
  }
  return s;
}

const testContent: GameContent = {
  ...GAME_CONTENT,
  events: [makeEvent('e1'), makeEvent('e2'), makeEvent('e3')],
};

describe('advanceYear', () => {
  it('envelhece, avança o calendário e abre nova entrada no log', () => {
    const g = makeGame();
    const next = advanceYear(g, testContent);
    expect(next.character.age).toBe(1);
    expect(next.year).toBe(g.year + 1);
    expect(next.log).toHaveLength(2);
    expect(next.log.at(-1)!.age).toBe(1);
  });

  it('renova a energia para o máximo da nova idade', () => {
    let g = withAge(makeGame(), 7);
    g = { ...g, energy: { current: 0, max: 5 } };
    const next = advanceYear(g, testContent);
    expect(next.energy.max).toBe(maxEnergy(8, next.character.stats.health));
    expect(next.energy.current).toBe(next.energy.max);
  });

  it('sorteia 1 ou 2 eventos quando há elegíveis', () => {
    const counts = new Set<number>();
    for (let seed = 0; seed < 40; seed++) {
      const n = advanceYear(makeGame(seed), testContent).pendingEvents.length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(2);
      counts.add(n);
    }
    expect(counts).toEqual(new Set([1, 2]));
  });

  it('não sorteia eventos quando nada é elegível', () => {
    const none: GameContent = { ...GAME_CONTENT, events: [makeEvent('x', { conditions: { minAge: 90 } })] };
    expect(advanceYear(makeGame(), none).pendingEvents).toEqual([]);
  });

  it('fica bloqueado enquanto houver evento pendente', () => {
    const g = advanceYear(makeGame(), testContent);
    expect(g.pendingEvents.length).toBeGreaterThan(0);
    expect(advanceYear(g, testContent)).toBe(g);
  });

  it('resolveEvent aplica a escolha, remove o pendente e registra no log', () => {
    const content: GameContent = {
      ...GAME_CONTENT,
      events: [makeEvent('grana', { choices: [{ id: 'pega', label: 'Pegar', effects: { money: 50 }, resultText: 'Ganhou' }] })],
    };
    const g = advanceYear(makeGame(), content, { twoEventChance: 0 });
    const r = resolveEvent(g, 'grana', 'pega', content);
    expect(r.money).toBe(g.money + 50);
    expect(r.pendingEvents).toEqual([]);
    expect(r.log.at(-1)!.entries.at(-1)).toBe('grana Ganhou');
  });

  it('não modifica o estado original (imutável)', () => {
    const g = makeGame();
    const snapshot = JSON.stringify(g);
    playYears(g, 5);
    expect(JSON.stringify(g)).toBe(snapshot);
  });

  it('é determinístico: mesma seed e mesmas decisões → mesmo estado', () => {
    expect(playYears(makeGame('det'), 15)).toEqual(playYears(makeGame('det'), 15));
    expect(playYears(makeGame('det'), 15)).not.toEqual(playYears(makeGame('outra'), 15));
  });

  it('estado continua JSON puro após vários anos', () => {
    const s = playYears(makeGame('json'), 12);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
    expect(s.character.age).toBe(12);
    expect(s.log).toHaveLength(13);
  });
});
