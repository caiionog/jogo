/** Prisão e reintegração (release 0.0.2, fase 7). */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { PRISON_EVENTS } from '../src/content/events/prison';
import {
  actionBlockReason,
  advanceYear,
  attemptEscape,
  behindBars,
  createRng,
  imprison,
  isEligible,
  newGame,
  prisonAction,
  prisonActionBlock,
  trainingBlockReason,
} from '../src/engine';
import type { GameState } from '../src/engine';

const NO_EV = { ...C, events: [] };

function prisoner(years = 10, seed = 'pr'): GameState {
  const g = newGame({ seed, name: 'Teste', sex: 'M', birthYear: 2000, uf: 'SP', city: 'São Paulo' }, C);
  const s = { ...g, year: 2030, money: 1000, character: { ...g.character, age: 30 }, economy: { ...g.economy, ledger: { year: 2030, opening: 1000, entries: [] } } };
  return imprison(s, years, C);
}

describe('conteúdo', () => {
  it('pelo menos 20 eventos de prisão, sem violência sexual nem insinuação', () => {
    expect(PRISON_EVENTS.length).toBeGreaterThanOrEqual(20);
    const txt = JSON.stringify(PRISON_EVENTS).toLowerCase();
    for (const w of ['estupr', 'abuso sexual', 'sexual', 'violent', 'nu ', 'nua', 'pelad', 'chuveiro', 'sabonete', 'molest', 'assédio', 'intim']) expect(txt, w).not.toContain(w);
  });
});

describe('ações trocadas enquanto preso', () => {
  it('ações comuns e treino bloqueados; as da prisão liberadas', () => {
    const s = prisoner();
    expect(behindBars(s)).toBe(true);
    expect(actionBlockReason(s, C.actions[0])).toBe('prison');
    expect(trainingBlockReason(s, 'fisico', C)).toBe('prison');
    expect(prisonActionBlock(s, 'trabalhar')).toBeNull();
  });

  it('trabalhar e estudar dão remição (uma vez por ano); pátio até 4', () => {
    let s = prisonAction(prisoner(), 'trabalhar', C);
    s = prisonAction(s, 'estudar', C);
    expect(s.prison!.remission).toBe(0.5);
    expect(prisonAction(s, 'trabalhar', C)).toBe(s);
    for (let i = 0; i < 4; i++) s = prisonAction(s, 'treinar', C);
    expect(prisonActionBlock(s, 'treinar')).toBe('done');
  });

  it('atrás das grades só saem eventos da prisão', () => {
    const s = prisoner();
    const normal = C.events.find((e) => e.id === 'job_rude_customer')!;
    expect(isEligible(s, normal, C)).toBe(false);
  });
});

describe('soltura e fuga', () => {
  it('soltura no ano certo (com remição) e evento de reintegração', () => {
    let s = prisoner(3, 'sol');
    s = { ...s, prison: { ...s.prison!, behavior: 40 } };
    s = prisonAction(s, 'trabalhar', C);
    s = prisonAction(s, 'estudar', C);
    s = advanceYear(s, NO_EV);
    expect(s.prison).not.toBeNull();
    s = advanceYear(s, NO_EV);
    // 2 anos + 0,5 de remição < 3
    expect(s.prison).not.toBeNull();
    s = advanceYear({ ...s, pendingEvents: [] }, NO_EV);
    expect(s.prison).toBeNull();
    expect(s.flags.egresso).toBeTruthy();
    const full = advanceYear({ ...prisoner(2, 'r2'), prison: { ...prisoner(2, 'r2').prison!, served: 1, behavior: 40 } }, C);
    expect(full.pendingEvents.some((p) => p.eventId === 'prisao_reintegracao')).toBe(true);
  });

  it('fuga que falha aumenta a pena e volta ao fechado', () => {
    let failed = 0;
    let escaped = 0;
    for (let i = 0; i < 200; i++) {
      const s = prisoner(6, `f${i}`);
      const r = attemptEscape(s, createRng(i), C);
      if (r.prison) {
        failed++;
        expect(r.prison.sentence).toBeGreaterThan(s.prison!.sentence);
        expect(r.prison.regime).toBe('fechado');
      } else {
        escaped++;
        expect(r.crime.wanted).toBe(90);
      }
    }
    expect(failed).toBeGreaterThan(escaped * 2);
  });
});
