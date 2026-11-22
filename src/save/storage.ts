import { del, get, set } from 'idb-keyval';
import type { GameState } from '../engine';
import { migrate } from './migrations';

/** Chave antiga (Etapas 1–5, um só save): migrada para o slot 1 na primeira carga. */
const LEGACY_KEY = 'save:current';
const ACTIVE_KEY = 'slot:active';
export const SLOT_COUNT = 3;
export const slotKey = (slot: number) => `save:slot${slot}`;

export interface SlotInfo {
  slot: number;
  empty: boolean;
  name?: string;
  age?: number;
  generation?: number;
  alive?: boolean;
  year?: number;
  /** Save existe, mas não pôde ser lido. */
  broken?: boolean;
}

/**
 * O IndexedDB pode estar indisponível (aba anônima, dados bloqueados, páginas embutidas).
 * Nesses casos o jogo continua funcionando, só sem salvar.
 */
async function safeGet(key: string): Promise<unknown> {
  try {
    return await get(key);
  } catch (err) {
    console.warn('Save indisponível (IndexedDB bloqueado?)', err);
    return undefined;
  }
}

/** Move o save antigo (chave única) para o slot 1. */
async function migrateLegacyKey(): Promise<void> {
  const legacy = await safeGet(LEGACY_KEY);
  if (legacy === undefined) return;
  try {
    if ((await safeGet(slotKey(1))) === undefined) await set(slotKey(1), legacy);
    await del(LEGACY_KEY);
  } catch (err) {
    console.warn('Não foi possível mover o save antigo', err);
  }
}

export async function getActiveSlot(): Promise<number> {
  await migrateLegacyKey();
  const v = Number(await safeGet(ACTIVE_KEY));
  return v >= 1 && v <= SLOT_COUNT ? v : 1;
}

export async function setActiveSlot(slot: number): Promise<void> {
  try {
    await set(ACTIVE_KEY, slot);
  } catch (err) {
    console.warn('Não foi possível gravar o slot ativo', err);
  }
}

export async function loadSlot(slot: number): Promise<GameState | null> {
  const raw = await safeGet(slotKey(slot));
  if (raw === undefined) return null;
  try {
    return migrate(raw);
  } catch (err) {
    console.error('Falha ao carregar save', err);
    return null;
  }
}

export async function saveSlot(slot: number, state: GameState): Promise<void> {
  try {
    // Garante JSON puro (o estado deve ser serializável).
    await set(slotKey(slot), JSON.parse(JSON.stringify(state)) as GameState);
  } catch (err) {
    console.warn('Não foi possível salvar', err);
  }
}

export async function clearSlot(slot: number): Promise<void> {
  try {
    await del(slotKey(slot));
  } catch (err) {
    console.warn('Não foi possível apagar o save', err);
  }
}

export async function listSlots(): Promise<SlotInfo[]> {
  await migrateLegacyKey();
  const out: SlotInfo[] = [];
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    const raw = await safeGet(slotKey(slot));
    if (raw === undefined) {
      out.push({ slot, empty: true });
      continue;
    }
    try {
      const g = migrate(raw);
      out.push({ slot, empty: false, name: g.character.name, age: g.character.age, generation: g.dynasty.generation, alive: g.alive, year: g.year });
    } catch {
      out.push({ slot, empty: false, broken: true });
    }
  }
  return out;
}

// --- API antiga (slot ativo), usada pelo store ---

export async function loadGame(): Promise<GameState | null> {
  return loadSlot(await getActiveSlot());
}

export async function saveGame(state: GameState): Promise<void> {
  await saveSlot(await getActiveSlot(), state);
}

export async function clearGame(): Promise<void> {
  await clearSlot(await getActiveSlot());
}
