import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';

describe('conteúdo', () => {
  it('tem 10 eventos de infância com ids únicos e escolhas válidas', () => {
    const ids = GAME_CONTENT.events.map((e) => e.id);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of GAME_CONTENT.events) {
      expect(e.weight).toBeGreaterThan(0);
      expect(e.choices.length).toBeGreaterThan(0);
      expect(new Set(e.choices.map((c) => c.id)).size).toBe(e.choices.length);
      for (const c of e.choices) if (c.risk) expect(c.risk.chance).toBeGreaterThan(0);
    }
  });

  it('ações têm custo de energia positivo e textos de log', () => {
    for (const a of GAME_CONTENT.actions) {
      expect(a.energyCost).toBeGreaterThan(0);
      expect(a.logTexts.length).toBeGreaterThan(0);
    }
  });
});
