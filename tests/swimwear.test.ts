import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { STATE_VERSION, createRng, derivePersonAvatar, deriveAvatar, performAction, playerOutfit, swimOutfit, wardrobeOptions } from '../src/engine';
import type { AvatarOutfit, GameState } from '../src/engine';
import { migrate } from '../src/save/migrations';
import fixturesV13 from '../src/save/__fixtures__/saves-v13.json';
import { makeGame, withAge } from './helpers';

const ADULT_SWIM = new Set(C.outfits.filter((o) => o.context === 'praia' && o.minAge >= 18).map((o) => o.id));
const ids = (o: AvatarOutfit) => Object.values(o).map((p) => p?.id).filter(Boolean) as string[];

describe('roupas de banho', () => {
  it('as peças adultas existem e exigem 18+ no catálogo', () => {
    for (const id of ['biquini', 'maio', 'sunga', 'bermuda_praia', 'saida_praia']) expect(ADULT_SWIM.has(id), id).toBe(true);
    for (const id of ['maio_infantil', 'camiseta_uv', 'bermuda_infantil']) expect(C.outfits.find((o) => o.id === id)!.maxAge).toBe(17);
  });

  it('nunca em menores de 18: todas as idades × sexos × sementes, guarda-roupa e contexto de praia', () => {
    for (let age = 0; age <= 90; age++) {
      for (const sex of ['M', 'F'] as const) {
        for (let seed = 0; seed < 12; seed++) {
          const worn = ids(swimOutfit(C, age, sex, 1990 + seed));
          if (age < 18) for (const id of worn) expect(ADULT_SWIM.has(id), `${age} ${sex} ${id}`).toBe(false);
        }
        let g: GameState = withAge(makeGame(`praia-${sex}`), age);
        g = { ...g, character: { ...g.character, sex }, scene: { kind: 'praia', year: g.year } };
        for (const ctx of ['principal', 'lista', 'luta', 'treino', 'casamento', 'formatura'] as const) {
          const o = playerOutfit(g, C, ctx);
          if (age < 18) for (const id of ids(o)) expect(ADULT_SWIM.has(id), `${age} ${ctx} ${id}`).toBe(false);
        }
        if (age < 18) for (const o of wardrobeOptions(g, C)) expect(ADULT_SWIM.has(o.id)).toBe(false);
      }
    }
  });

  it('NPCs nunca aparecem com roupa de banho adulta abaixo de 18', () => {
    const g = makeGame('npc-praia');
    const rng = createRng(3);
    for (const p of g.relationships.people) {
      for (const age of [5, 12, 16, 17]) {
        const d = derivePersonAvatar({ ...p, age: age + rng.int(0, 0) }, C);
        if (d) for (const id of ids(d.outfit)) expect(ADULT_SWIM.has(id)).toBe(false);
      }
    }
  });

  it('viajar leva à praia: adulto de roupa de banho; criança de roupa fechada', () => {
    const adult = performAction(withAge(makeGame('viagem'), 25), 'travel', C);
    expect(adult.scene?.kind).toBe('praia');
    expect(ids(deriveAvatar({ ...adult, money: 10000 }, C).outfit).some((id) => ADULT_SWIM.has(id))).toBe(true);
    const kid = { ...withAge(makeGame('viagem-kid'), 9), scene: { kind: 'praia' as const, year: makeGame('viagem-kid').year } };
    expect(ids(deriveAvatar(kid, C).outfit).some((id) => ADULT_SWIM.has(id))).toBe(false);
  });
});

describe('migração v13 → v14', () => {
  const v13 = fixturesV13 as unknown as Record<string, Record<string, unknown>>;
  it.each(Object.keys(v13))('%s', (k) => {
    const m = migrate(structuredClone(v13[k]));
    expect(m.version).toBe(STATE_VERSION);
    expect(m.scene).toBeNull();
    expect(m.eventLastAge).toEqual({});
    expect(m.wardrobe.unlocked).toContain('maio_infantil');
  });
});
