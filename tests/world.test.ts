import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { createRng, emptyRecord, ensureRoster, npcRating, quickFight, signWith, simulateWorldYear, viewRoster } from '../src/engine';
import type { GameState } from '../src/engine';
import { fighterGame, npc } from './fightHelpers';

const KEY = 'arc:m_leve'; // 75 kg → peso-leve
const signed = (): GameState => signWith(fighterGame(22, {}, { amateur: { ...emptyRecord(), wins: 5 }, reputation: 30 }), 'arc', GAME_CONTENT);

describe('mundo vivo', () => {
  it('elencos são gerados pelo seed sob demanda (determinístico) e só para a categoria tocada', () => {
    const a = signed();
    expect(a).toEqual(signed());
    expect(Object.keys(a.world.rosters)).toEqual([KEY]);
    const r = a.world.rosters[KEY]!;
    expect(new Set(r.npcs.map((n) => n.id)).size).toBe(r.npcs.length);
    for (const n of r.npcs) {
      expect(n.name).toMatch(/\S+ \S+/);
      expect(n.nickname).toBeTruthy();
      expect(npcRating(n)).toBeGreaterThan(20);
    }
    // ranking em ordem decrescente de força (no início)
    const champ = r.npcs.find((n) => n.id === r.champion)!;
    const last = r.npcs.find((n) => n.id === r.ranking.at(-1))!;
    expect(npcRating(champ)).toBeGreaterThan(npcRating(last));
  });

  it('viewRoster mostra um elenco sem alterar o estado', () => {
    const g = fighterGame(22);
    const v = viewRoster(g, 'titan', 'm_leve', GAME_CONTENT)!;
    expect(v.ranking).toHaveLength(15);
    expect(g.world.rosters).toEqual({});
    expect(viewRoster(g, 'amador_punho_de_ferro', 'm_leve', GAME_CONTENT)).toBeNull();
  });

  it('ano no mundo: NPCs envelhecem, lutam, se aposentam e são substituídos; o ranking se move', () => {
    let g = signed();
    const before = g.world.rosters[KEY]!;
    const ids0 = new Set(before.npcs.map((n) => n.id));
    let moved = false;
    for (let y = 0; y < 12; y++) {
      g = simulateWorldYear(g, createRng(100 + y), GAME_CONTENT);
      const r = g.world.rosters[KEY]!;
      if (y === 0) {
        expect(r.npcs.filter((n) => ids0.has(n.id)).every((n) => n.age === before.npcs.find((b) => b.id === n.id)!.age + 1)).toBe(true);
        const fights = r.npcs.reduce((t, n) => t + n.record.w + n.record.l + n.record.d, 0) - before.npcs.reduce((t, n) => t + n.record.w + n.record.l + n.record.d, 0);
        expect(fights).toBeGreaterThan(10);
      }
      if (r.ranking.join() !== before.ranking.join()) moved = true;
    }
    const after = g.world.rosters[KEY]!;
    expect(moved).toBe(true);
    expect(after.npcs.some((n) => !ids0.has(n.id))).toBe(true); // novos talentos
    expect(after.npcs.length).toBe(before.npcs.length);
    expect(after.champion).toBeTruthy();
    expect(after.ranking.length).toBeLessThanOrEqual(10);
    expect(JSON.parse(JSON.stringify(g))).toEqual(g);
    expect(JSON.stringify(g.world).length).toBeLessThan(30000); // estado enxuto
  });

  it('o jogador nunca é escalado nas lutas entre NPCs', () => {
    let g = signed();
    const key = KEY;
    g = { ...g, world: { ...g.world, rosters: { ...g.world.rosters, [key]: { ...g.world.rosters[key]!, ranking: ['player', ...g.world.rosters[key]!.ranking.slice(0, 9)] } } } };
    const r = simulateWorldYear(g, createRng(3), GAME_CONTENT).world.rosters[key]!;
    expect(r.ranking).toContain('player');
  });

  it('quickFight favorece o mais forte', () => {
    const a = npc('forte', 75);
    const b = npc('fraco', 45);
    let w = 0;
    for (let i = 0; i < 500; i++) if (quickFight(createRng(i), a, b).winner === 'a') w++;
    expect(w / 500).toBeGreaterThan(0.85);
  });

  it('ensureRoster não recria um elenco existente', () => {
    const g = signed();
    expect(ensureRoster(g, 'arc', 'm_leve', GAME_CONTENT)).toBe(g);
  });
});
