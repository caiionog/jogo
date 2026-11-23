import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { advanceYear, eligibleEvents, isEligible, newGame, resolveEvent, validateContent } from '../src/engine';
import type { GameState } from '../src/engine';
import { RANDOM_EVENTS } from '../src/content/events/random';
import { makeGame, withAge } from './helpers';

describe('eventos novos (release 0.0.1)', () => {
  it('pelo menos 40 eventos novos, ids únicos, conteúdo válido, todos com tom', () => {
    expect(RANDOM_EVENTS.length).toBeGreaterThanOrEqual(40);
    expect(validateContent(C)).toEqual([]);
    const ids = C.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of RANDOM_EVENTS) expect(e.tone, e.id).toBeDefined();
  });

  it('todo ano da vida (3–85) tem eventos aleatórios elegíveis num estado típico', () => {
    for (let age = 3; age <= 85; age++) {
      const g = withAge(makeGame('cobertura'), age);
      expect(eligibleEvents(g, C.events, C).length, `idade ${age}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('intervalo de repetição: um evento sorteado não volta antes do intervalo', () => {
    const e = RANDOM_EVENTS.find((x) => x.id === 'r_health_flu')!;
    const g = withAge(makeGame('cool'), 20);
    expect(isEligible(g, e, C)).toBe(true);
    const fired: GameState = { ...g, eventLastAge: { r_health_flu: 18 } };
    expect(isEligible(fired, e, C)).toBe(false);
    expect(isEligible({ ...fired, eventLastAge: { r_health_flu: 20 - C.limits.eventCooldown } }, e, C)).toBe(true);
  });

  it('numa vida simulada, nenhum evento aleatório se repete dentro do intervalo', () => {
    let s = newGame({ seed: 'repeticao', name: 'R', sex: 'F' }, C);
    const seen: Record<string, number[]> = {};
    for (let y = 0; y < 70 && s.alive; y++) {
      s = advanceYear(s, C);
      for (const p of s.pendingEvents) if (p.source === 'random') (seen[p.eventId] ??= []).push(s.character.age);
      let k = 0;
      while (s.pendingEvents.length && k++ < 10) {
        const ev = C.events.find((e) => e.id === s.pendingEvents[0]!.eventId)!;
        s = resolveEvent(s, ev.id, ev.choices[0]!.id, C);
      }
    }
    for (const [id, ages] of Object.entries(seen)) {
      const cd = C.events.find((e) => e.id === id)!.cooldownYears ?? C.limits.eventCooldown;
      for (let i = 1; i < ages.length; i++) expect(ages[i]! - ages[i - 1]!, id).toBeGreaterThanOrEqual(cd);
    }
  });
});
