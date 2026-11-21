import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { GameContent } from '../src/engine';
import { advanceYear, resolveEvent } from '../src/engine';
import { enrolledGame, makeEvent } from './helpers';

const content: GameContent = {
  ...GAME_CONTENT,
  events: [
    makeEvent('start', {
      conditions: { enrolled: true },
      once: true,
      choices: [
        { id: 'in1', label: 'a', resultText: 'a', effects: { followUps: [{ eventId: 'next', delayYears: 1 }] } },
        { id: 'in2', label: 'b', resultText: 'b', effects: { followUps: [{ eventId: 'next', delayYears: 2 }] } },
        { id: 'now', label: 'c', resultText: 'c', effects: { followUps: [{ eventId: 'next', delayYears: 0 }] } },
        { id: 'school', label: 'd', resultText: 'd', effects: { followUps: [{ eventId: 'schoolOnly', delayYears: 1 }] } },
      ],
    }),
    makeEvent('next', { trigger: 'followUp', text: 'continua com {colega}' }),
    makeEvent('schoolOnly', { trigger: 'followUp', conditions: { enrolled: true } }),
  ],
};

/** Avança um ano até 'start' aparecer, escolhe `choice` e devolve o estado. */
function startWith(choice: string) {
  const g = advanceYear(enrolledGame(10, { average: 90 }), content, { twoEventChance: 0 });
  expect(g.pendingEvents.map((p) => p.eventId)).toEqual(['start']);
  return resolveEvent(g, 'start', choice, content);
}

describe('eventos encadeados (followUp)', () => {
  it('eventos followUp nunca são sorteados sozinhos', () => {
    let g = enrolledGame(10, { average: 90 });
    g = { ...g, firedEvents: ['start'] };
    for (let i = 0; i < 5; i++) {
      g = advanceYear(g, content);
      expect(g.pendingEvents).toEqual([]);
    }
  });

  it('delay 1: dispara no ano seguinte, com as mesmas variáveis', () => {
    const g = startWith('in1');
    expect(g.scheduledEvents).toEqual([{ eventId: 'next', dueAge: 12, vars: g.scheduledEvents[0]!.vars }]);
    const vars = g.scheduledEvents[0]!.vars;
    const n = advanceYear(g, content);
    expect(n.character.age).toBe(12);
    expect(n.pendingEvents[0]).toMatchObject({ eventId: 'next', source: 'followUp', vars });
    expect(n.scheduledEvents).toEqual([]);
    const done = resolveEvent(n, 'next', 'ok', content);
    expect(done.log.at(-1)!.entries.at(-1)).toContain(`continua com ${vars!.colega}`);
  });

  it('delay 2: espera dois anos', () => {
    const g = startWith('in2');
    const y1 = advanceYear(g, content);
    expect(y1.pendingEvents.some((p) => p.eventId === 'next')).toBe(false);
    const y2 = advanceYear(y1, content);
    expect(y2.pendingEvents.some((p) => p.eventId === 'next')).toBe(true);
  });

  it('delay 0: fica pendente imediatamente', () => {
    const g = startWith('now');
    expect(g.pendingEvents).toMatchObject([{ eventId: 'next', source: 'followUp' }]);
  });

  it('é descartado se as condições não forem mais atendidas', () => {
    const g = startWith('school');
    // formado: fora da escola e sem nova matrícula automática
    const dropped = advanceYear({ ...g, education: { ...g.education, current: null, graduated: true } }, content);
    expect(dropped.pendingEvents).toEqual([]);
    expect(dropped.scheduledEvents).toEqual([]);
  });
});
