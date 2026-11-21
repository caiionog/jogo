import { del, get, set } from 'idb-keyval';
import type { GameState } from '../engine';
import { migrate } from './migrations';

const SAVE_KEY = 'save:current';

export async function loadGame(): Promise<GameState | null> {
  const raw: unknown = await get(SAVE_KEY);
  if (raw === undefined) return null;
  try {
    return migrate(raw);
  } catch (err) {
    console.error('Falha ao carregar save', err);
    return null;
  }
}

export async function saveGame(state: GameState): Promise<void> {
  // Garante JSON puro (o estado deve ser serializável).
  await set(SAVE_KEY, JSON.parse(JSON.stringify(state)) as GameState);
}

export async function clearGame(): Promise<void> {
  await del(SAVE_KEY);
}
