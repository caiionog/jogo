import { describe, expect, it } from 'vitest';
import { CURRENT_VERSION, migrate, SaveMigrationError } from '../src/save/migrations';
import { makeGame } from './helpers';

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
});
