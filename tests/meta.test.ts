import { beforeEach, describe, expect, it, vi } from 'vitest';

// IndexedDB em memória (idb-keyval) para testar o armazenamento meta e os slots
const store = new Map<string, unknown>();
vi.mock('idb-keyval', () => ({
  get: async (k: string) => structuredClone(store.get(k)),
  set: async (k: string, v: unknown) => void store.set(k, structuredClone(v)),
  del: async (k: string) => void store.delete(k),
}));

import { GAME_CONTENT } from '../src/content';
import { emptyMeta, emptyRecord, evaluateAchievements, killCharacter, newGame, recordLifeEnd, recordLifeStart } from '../src/engine';
import type { GameState, MetaState } from '../src/engine';
import { exportSave, importSave, listSlots, loadGame, loadMeta, loadSlot, migrateMeta, saveMeta, saveSlot, setActiveSlot, slotKey } from '../src/save';
import fixturesV1 from '../src/save/__fixtures__/saves-v1.json';
import { adult } from './ecoHelpers';
import { fighterGame } from './fightHelpers';

const C = GAME_CONTENT;
const AT = '2026-11-22T10:00:00.000Z';
const ach = (id: string) => C.achievements.find((a) => a.id === id)!;

beforeEach(() => store.clear());

describe('conquistas', () => {
  it('há pelo menos 40, com secretas, cobrindo todas as etapas', () => {
    expect(C.achievements.length).toBeGreaterThanOrEqual(40);
    expect(C.achievements.filter((a) => a.secret).length).toBeGreaterThanOrEqual(6);
    for (const m of ['graduated', 'subWins', 'belt', 'majorTitles', 'married', 'netWorth', 'generation', 'surgeries']) {
      expect(C.achievements.some((a) => a.metric === m), m).toBe(true);
    }
  });

  it('predicados disparam nas condições certas e não disparam fora delas', () => {
    const rookie = fighterGame(20);
    const sub = fighterGame(20, {}, { amateur: { ...emptyRecord(), wins: 1, winsBy: { KO: 0, SUB: 1, DEC: 0 } }, grades: { jiujitsu: { system: 'bjj_adulto', rank: 4, degree: 0, years: 1 } } });
    const r0 = evaluateAchievements(rookie, emptyMeta(), C, AT);
    expect(r0.unlocked.map((a) => a.id)).not.toContain('primeira_finalizacao');
    const r1 = evaluateAchievements(sub, emptyMeta(), C, AT);
    const ids = r1.unlocked.map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['primeira_vitoria', 'primeira_finalizacao', 'faixa_roxa', 'faixa_preta']));
    expect(ids).not.toContain('primeiro_ko');
    expect(r1.meta.achievements.faixa_preta).toEqual({ at: AT, life: sub.character.name });
    // milionário
    expect(evaluateAchievements(adult(40, 1_500_000), emptyMeta(), C, AT).unlocked.map((a) => a.id)).toContain('milionario');
  });

  it('não desbloqueia duas vezes', () => {
    const g = fighterGame(20, {}, { grades: { jiujitsu: { system: 'bjj_adulto', rank: 4, degree: 0, years: 1 } } });
    const first = evaluateAchievements(g, emptyMeta(), C, AT);
    const again = evaluateAchievements(g, first.meta, C, '2030-01-01T00:00:00.000Z');
    expect(again.unlocked).toEqual([]);
    expect(again.meta).toBe(first.meta);
    expect(again.meta.achievements.faixa_preta!.at).toBe(AT);
  });

  it('conquistas de morte só valem com a vida encerrada', () => {
    let g = adult(70, 100000);
    g = { ...g, flags: { ...g.flags, casado: true } };
    expect(evaluateAchievements(g, emptyMeta(), C, AT).unlocked.map((a) => a.id)).not.toContain('para_sempre');
    const dead = killCharacter(g, 'causas naturais', C);
    expect(evaluateAchievements(dead, emptyMeta(), C, AT).unlocked.map((a) => a.id)).toContain('para_sempre');
    expect(ach('para_sempre').onDeath).toBe(true);
  });

  it('persistem entre vidas no armazenamento meta (chave própria)', async () => {
    const g = fighterGame(20, {}, { grades: { jiujitsu: { system: 'bjj_adulto', rank: 4, degree: 0, years: 1 } } });
    const { meta } = evaluateAchievements(g, await loadMeta(), C, AT);
    await saveMeta(meta);
    // nova vida: o save da vida é outro, o meta continua
    const novo = newGame({ seed: 'outra', name: 'Outra Vida', sex: 'F' }, C);
    await saveSlot(1, novo);
    const loaded = await loadMeta();
    expect(loaded.achievements.faixa_preta).toBeDefined();
    expect(store.has('meta')).toBe(true);
    expect(evaluateAchievements(novo, loaded, C, AT).unlocked.map((a) => a.id)).not.toContain('faixa_preta');
  });
});

describe('Hall da Fama', () => {
  it('recebe a entrada na morte (uma vez) e atualiza as estatísticas', () => {
    let meta: MetaState = recordLifeStart(emptyMeta());
    const g = fighterGame(60, {}, { pro: { ...emptyRecord(), wins: 12, losses: 3 } });
    expect(recordLifeEnd(meta, g)).toBe(meta); // viva: nada
    const dead = killCharacter(g, 'causas naturais', C);
    meta = recordLifeEnd(meta, dead);
    expect(meta.hallOfFame).toHaveLength(1);
    expect(meta.hallOfFame[0]).toMatchObject({ name: g.character.name, record: '12-3-0', generation: 1, cause: 'causas naturais' });
    expect(meta.stats).toMatchObject({ lives: 1, deaths: 1 });
    expect(recordLifeEnd(meta, dead)).toBe(meta);
  });

  it('migração do meta: aceita meta antigo/parcial e descarta lixo', () => {
    expect(migrateMeta(undefined)).toEqual(emptyMeta());
    expect(migrateMeta({ version: 99 })).toEqual(emptyMeta());
    const partial = migrateMeta({ version: 1, achievements: { x: { at: AT, life: 'A' } } });
    expect(partial.achievements.x).toBeDefined();
    expect(partial.settings.fightSpeed).toBe('normal');
    expect(partial.hallOfFame).toEqual([]);
  });

  it('v2 → v3 (release 0.0.3): visual dos personagens vira cartoon; a preferência persiste', async () => {
    const v2 = migrateMeta({ version: 2, achievements: {}, hallOfFame: [], seenTips: ['x'], settings: { fightSpeed: 'rapida', fontScale: 'grande' } });
    expect(v2.version).toBe(3);
    expect(v2.settings).toEqual({ fightSpeed: 'rapida', fontScale: 'grande', avatarStyle: 'cartoon' });
    expect(v2.seenTips).toEqual(['x']);
    const pixel = { ...v2, settings: { ...v2.settings, avatarStyle: 'pixel' as const } };
    await saveMeta(pixel);
    expect((await loadMeta()).settings.avatarStyle).toBe('pixel');
  });
});

describe('slots e exportação', () => {
  it('o save antigo (chave única) vira o slot 1; 3 slots listados', async () => {
    const g = newGame({ seed: 'slot', name: 'Ana Slot', sex: 'F' }, C);
    store.set('save:current', JSON.parse(JSON.stringify(g)));
    const slots = await listSlots();
    expect(slots).toHaveLength(3);
    expect(slots[0]).toMatchObject({ slot: 1, empty: false, name: 'Ana Slot', generation: 1 });
    expect(slots[1]!.empty).toBe(true);
    expect(store.has('save:current')).toBe(false);
    await setActiveSlot(2);
    expect(await loadGame()).toBeNull();
    await saveSlot(2, g);
    expect((await loadSlot(2))?.character.name).toBe('Ana Slot');
    expect(store.has(slotKey(2))).toBe(true);
  });

  it('importação aceita um save exportado (ida e volta) e um save v1 cru (migrado)', () => {
    const g = adult(30, 5000);
    const r = importSave(exportSave(g, AT));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state).toEqual(JSON.parse(JSON.stringify(g)));
    const v1 = Object.values(fixturesV1)[0]!;
    const r1 = importSave(JSON.stringify(v1));
    expect(r1.ok).toBe(true);
  });

  it('importação rejeita JSON inválido, formato errado, versão futura e save corrompido', () => {
    const bad = (t: string) => {
      const r = importSave(t);
      expect(r.ok).toBe(false);
      return r.ok ? '' : r.error;
    };
    expect(bad('isso não é json')).toMatch(/JSON válido/);
    expect(bad(JSON.stringify({ format: 'outro-jogo', state: {} }))).toMatch(/não é um save/);
    expect(bad(JSON.stringify({ hello: 1 }))).toMatch(/version/);
    const g = adult(30, 5000);
    expect(bad(exportSave({ ...g, version: 99 } as GameState, AT))).toMatch(/versão mais nova/);
    expect(bad(exportSave({ ...g, money: 123.5 } as GameState, AT))).toMatch(/inválido/);
    const noChar = JSON.parse(exportSave(g, AT));
    delete noChar.state.character;
    expect(bad(JSON.stringify(noChar))).toMatch(/inválido|corrompido/);
  });
});
