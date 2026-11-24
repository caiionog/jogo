/**
 * Armazenamento meta (Etapa 6): conquistas, Hall da Fama, estatísticas globais e preferências.
 * Fica numa chave própria do IndexedDB, separada dos saves de vida, com `version` e migrações próprias.
 */
import { get, set } from 'idb-keyval';
import { META_VERSION, emptyMeta } from '../engine';
import type { MetaState } from '../engine';

export const META_KEY = 'meta';

type AnyMeta = Record<string, unknown> & { version: number };

/**
 * metaMigrations[n] converte o meta da versão n para n+1. v1→v2: dicas de primeira vez (`seenTips`).
 * v2→v3 (release 0.0.3): `settings.avatarStyle` = 'cartoon' (o visual novo vira o padrão para todos).
 */
export const metaMigrations: Record<number, (m: AnyMeta) => AnyMeta> = {
  1: (m) => ({ ...m, version: 2, seenTips: [] }),
  2: (m) => ({ ...m, version: 3, settings: { ...(m.settings as Record<string, unknown> | undefined), avatarStyle: 'cartoon' } }),
};

export function migrateMeta(raw: unknown): MetaState {
  if (typeof raw !== 'object' || raw === null || typeof (raw as AnyMeta).version !== 'number') return emptyMeta();
  let m = raw as AnyMeta;
  if (m.version > META_VERSION) return emptyMeta();
  while (m.version < META_VERSION) {
    const step = metaMigrations[m.version];
    if (!step) return emptyMeta();
    m = step(m);
  }
  // campos novos com padrão (robustez para metas parciais)
  const base = emptyMeta();
  const meta = m as unknown as Partial<MetaState>;
  return {
    ...base,
    ...meta,
    stats: { ...base.stats, ...meta.stats },
    settings: { ...base.settings, ...meta.settings },
    achievements: meta.achievements ?? {},
    hallOfFame: meta.hallOfFame ?? [],
    seenTips: meta.seenTips ?? [],
    version: META_VERSION,
  };
}

export async function loadMeta(): Promise<MetaState> {
  try {
    return migrateMeta(await get(META_KEY));
  } catch (err) {
    console.warn('Meta indisponível', err);
    return emptyMeta();
  }
}

export async function saveMeta(meta: MetaState): Promise<void> {
  try {
    await set(META_KEY, JSON.parse(JSON.stringify(meta)) as MetaState);
  } catch (err) {
    console.warn('Não foi possível salvar o meta', err);
  }
}
