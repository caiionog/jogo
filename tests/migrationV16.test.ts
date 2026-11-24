/** Migração v15 → v16 (release 0.0.3): saves reais da 0.0.2 migram sem erro. */
import { describe, expect, it } from 'vitest';
import { STATE_VERSION } from '../src/engine';
import { migrate } from '../src/save/migrations';
import fixturesV15 from '../src/save/__fixtures__/saves-v15.json';

describe('migração v15 → v16', () => {
  it('saves reais da 0.0.2 migram; lastGroup vazio; cena preservada', () => {
    const v15 = fixturesV15 as unknown as Record<string, Record<string, unknown>>;
    expect(Object.keys(v15).length).toBeGreaterThan(3);
    for (const k of Object.keys(v15)) {
      const raw = structuredClone(v15[k]!);
      const m = migrate(raw);
      expect(m.version).toBe(STATE_VERSION);
      expect(m.relationships.lastGroup).toBeNull();
      expect(m.scene).toEqual((v15[k] as { scene: unknown }).scene ?? null);
      expect(m.police).toBeDefined();
    }
  });
});
