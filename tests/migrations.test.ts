import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/saves-v1.json';
import { GAME_CONTENT } from '../src/content';
import { advanceYear, gradeForAge, performAction } from '../src/engine';
import { CURRENT_VERSION, migrate, SaveMigrationError } from '../src/save/migrations';
import { makeGame, resolveAllFirst } from './helpers';

const v1 = fixtures as unknown as Record<string, Record<string, unknown> & { version: number }>;

describe('migrações de save', () => {
  it('save da versão atual passa intacto', () => {
    const g = makeGame();
    expect(migrate(JSON.parse(JSON.stringify(g)))).toEqual(g);
  });

  it('rejeita save sem versão ou de versão futura', () => {
    expect(() => migrate({})).toThrow(SaveMigrationError);
    expect(() => migrate(null)).toThrow(SaveMigrationError);
    expect(() => migrate({ version: CURRENT_VERSION + 1 })).toThrow(SaveMigrationError);
  });

  it('fixtures são saves v1 reais (Etapa 1)', () => {
    for (const s of Object.values(v1)) {
      expect(s.version).toBe(1);
      expect(s).not.toHaveProperty('education');
    }
  });

  it.each(['1', '8', '16', '25'])('v1 → v2 com idade %s', (key) => {
    const raw = structuredClone(v1[key]!);
    const g = migrate(raw);
    const age = g.character.age;
    expect(g.version).toBe(2);
    expect(g.scheduledEvents).toEqual([]);
    expect(g.character.familyWealth).toBeGreaterThanOrEqual(0);
    expect(g.character.familyWealth).toBeLessThanOrEqual(100);
    expect(g.rngState).toBe(v1[key]!.rngState);
    if (age < 3) expect(g.education.current).toBeNull();
    if (age >= 3 && age <= 17) {
      expect(g.education.current?.grade).toBe(gradeForAge(age));
      expect(g.education.current?.school.name).toBeTruthy();
    }
    if (age >= 18) {
      expect(g.education.graduated).toBe(true);
      expect(g.flags.formado).toBe(true);
    }
    // flag antiga renomeada
    expect(g.flags).not.toHaveProperty('brigouNaEscola');
    expect(g.flags.brigou_na_escola).toBe(true);
    // continua jogável
    let s = resolveAllFirst(advanceYear(g, GAME_CONTENT));
    s = performAction(s, 'study', GAME_CONTENT);
    s = resolveAllFirst(advanceYear(s, GAME_CONTENT));
    expect(s.character.age).toBe(age + 2);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('migração é determinística', () => {
    expect(migrate(structuredClone(v1['8']))).toEqual(migrate(structuredClone(v1['8'])));
  });
});
