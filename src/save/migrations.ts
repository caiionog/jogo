import type { GameState } from '../engine';
import { STATE_VERSION } from '../engine';

export const CURRENT_VERSION = STATE_VERSION;

type AnySave = Record<string, unknown> & { version: number };

/**
 * migrations[n] converte um save da versão n para n+1.
 * Ao mudar o GameState: incremente STATE_VERSION e adicione a migração aqui.
 */
export const migrations: Record<number, (save: AnySave) => AnySave> = {
  // 1: (s) => ({ ...s, version: 2, novoCampo: valorPadrao }),
};

export class SaveMigrationError extends Error {}

export function migrate(raw: unknown): GameState {
  if (typeof raw !== 'object' || raw === null || typeof (raw as AnySave).version !== 'number') {
    throw new SaveMigrationError('Save inválido: sem campo version');
  }
  let save = raw as AnySave;
  if (save.version > CURRENT_VERSION) {
    throw new SaveMigrationError(`Save da versão ${save.version} é mais novo que o jogo (${CURRENT_VERSION})`);
  }
  while (save.version < CURRENT_VERSION) {
    const step = migrations[save.version];
    if (!step) throw new SaveMigrationError(`Sem migração a partir da versão ${save.version}`);
    save = step(save);
  }
  return save as unknown as GameState;
}
