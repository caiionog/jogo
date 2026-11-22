import { del, get, set } from 'idb-keyval';
import type { GameState } from '../engine';
import { migrate } from './migrations';

const SAVE_KEY = 'save:current';

/**
 * O IndexedDB pode estar indisponível (aba anônima, dados bloqueados, páginas embutidas).
 * Nesses casos o jogo continua funcionando, só sem salvar.
 */
export async function loadGame(): Promise<GameState | null> {
  let raw: unknown;
  try {
    raw = await get(SAVE_KEY);
  } catch (err) {
    console.warn('Save indisponível (IndexedDB bloqueado?)', err);
    return null;
  }
  if (raw === undefined) return null;
  try {
    return migrate(raw);
  } catch (err) {
    console.error('Falha ao carregar save', err);
    return null;
  }
}

export async function saveGame(state: GameState): Promise<void> {
  try {
    // Garante JSON puro (o estado deve ser serializável).
    await set(SAVE_KEY, JSON.parse(JSON.stringify(state)) as GameState);
  } catch (err) {
    console.warn('Não foi possível salvar', err);
  }
}

export async function clearGame(): Promise<void> {
  try {
    await del(SAVE_KEY);
  } catch (err) {
    console.warn('Não foi possível apagar o save', err);
  }
}
