import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import {
  STATE_VERSION,
  changeLuck,
  createRng,
  interact,
  luckFightMult,
  luckRiskChance,
  luckWeightMult,
  newGame,
  performAction,
  resolveEvent,
  rollLuck,
  rollTalents,
  selectEvents,
  talentMod,
  trainFighter,
} from '../src/engine';
import type { GameEvent, GameState } from '../src/engine';
import { migrate } from '../src/save/migrations';
import fixturesV10 from '../src/save/__fixtures__/saves-v10.json';
import { makeGame, withAge } from './helpers';
import { fighterGame } from './fightHelpers';

const withTalents = (s: GameState, ids: string[], revealed = false): GameState => ({ ...s, character: { ...s.character, talents: ids.map((id) => ({ id, revealed })) } });
const withLuck = (s: GameState, luck: number): GameState => ({ ...s, character: { ...s.character, luck } });

describe('talentos de nascimento', () => {
  it('frequências próximas das chances configuradas em 100 mil nascimentos (±0,5 p.p.)', () => {
    const N = 100_000;
    const count: Record<string, number> = {};
    for (let i = 0; i < N; i++) for (const id of rollTalents(createRng(i * 2654435761), C)) count[id] = (count[id] ?? 0) + 1;
    for (const t of C.talents) {
      expect(Math.abs((count[t.id] ?? 0) / N - t.chance)).toBeLessThan(0.005);
      // positivos 5–15%; negativos menores
      if (t.negative) expect(t.chance).toBeLessThan(0.08);
      else expect(t.chance).toBeGreaterThanOrEqual(0.05);
    }
  });

  it('filhos herdam com chance maior quando um dos pais tem o talento', () => {
    const N = 20_000;
    let base = 0;
    let inherited = 0;
    for (let i = 0; i < N; i++) {
      if (rollTalents(createRng(i + 7), C).includes('atletico')) base++;
      if (rollTalents(createRng(i + 7), C, [['atletico'], []]).includes('atletico')) inherited++;
    }
    const t = C.talents.find((x) => x.id === 'atletico')!;
    expect(inherited / N).toBeGreaterThan(base / N + 0.15);
    expect(Math.abs(inherited / N - (t.chance + t.heritBonus))).toBeLessThan(0.01);
  });

  it('nascer é determinístico e não usa o RNG principal (mesma seed → mesmos talentos e sorte)', () => {
    const a = newGame({ seed: 'tal', name: 'A', sex: 'M' }, C);
    const b = newGame({ seed: 'tal', name: 'A', sex: 'M' }, C);
    expect(a.character.talents).toEqual(b.character.talents);
    expect(a.character.luck).toBe(b.character.luck);
    expect(a.character.talents.every((t) => !t.revealed)).toBe(true);
  });

  it('os mods mudam as regras: atlético treina mais, prodígio estuda mais, carisma conquista mais', () => {
    const g = { ...fighterGame(20, { grappling: 30 }, { gymId: 'gen_bairro' }), money: 100000 };
    const gain = (s: GameState) => trainFighter(s, 'jiujitsu', C).fighter.skills.grappling - 30;
    expect(gain(withTalents(g, ['atletico']))).toBeGreaterThan(gain(g));
    const kid = withAge(makeGame('prod'), 12);
    const intel = (s: GameState) => performAction(s, 'study', C).character.stats.intelligence - s.character.stats.intelligence;
    expect(intel(withTalents(kid, ['prodigio']))).toBeGreaterThanOrEqual(intel(kid));
    expect(talentMod(withTalents(kid, ['carismatico']), C, 'affectionMult')).toBeCloseTo(1.2);
    expect(talentMod(withTalents(kid, ['saude_ferro', 'saude_fragil']), C, 'diseaseMult')).toBeCloseTo(0.9);
    const adult = withAge(makeGame('cari'), 25);
    const mom = adult.relationships.relations.find((r) => r.type === 'mae')!;
    const low = { ...adult, relationships: { ...adult.relationships, relations: adult.relationships.relations.map((r) => (r.personId === mom.personId ? { ...r, affection: 20 } : r)) } };
    const aff = (s: GameState) => interact(s, mom.personId, 'spend_time', C).relationships.relations.find((r) => r.personId === mom.personId)!.affection;
    expect(aff(withTalents(low, ['carismatico']))).toBeGreaterThanOrEqual(aff(low));
  });

  it('eventos revelam o talento só para quem tem; revelado, não repete', () => {
    const g = withTalents(withAge(makeGame('rev'), 12), ['atletico']);
    const ev = C.events.find((e) => e.id === 'talent_atletico')!;
    const pool = selectEvents(g, [ev], 1, createRng(1), C);
    expect(pool.map((e) => e.id)).toEqual(['talent_atletico']);
    expect(selectEvents(withAge(makeGame('rev2'), 12), [ev], 1, createRng(1), { ...C })).toEqual(
      makeGame('rev2').character.talents.some((t) => t.id === 'atletico') ? [ev] : [],
    );
    const r = resolveEvent({ ...g, pendingEvents: [{ eventId: 'talent_atletico' }] }, 'talent_atletico', 'ok', C);
    expect(r.character.talents[0]!.revealed).toBe(true);
    expect(selectEvents(r, [ev], 1, createRng(1), C)).toEqual([]);
  });
});

describe('sorte (oculta, com limite)', () => {
  it('distribuição concentrada no meio, poucos extremos', () => {
    const xs = Array.from({ length: 20000 }, (_, i) => rollLuck(createRng(i + 1)));
    const mid = xs.filter((x) => x >= 30 && x <= 70).length / xs.length;
    const ext = xs.filter((x) => x <= 15 || x >= 85).length / xs.length;
    expect(mid).toBeGreaterThan(0.75);
    expect(ext).toBeLessThan(0.05);
  });

  it('o efeito nunca passa do limite configurado', () => {
    const g = makeGame('lim');
    for (let luck = 0; luck <= 100; luck += 5) {
      const s = withLuck(g, luck);
      for (const tone of ['good', 'bad', undefined] as const) {
        expect(Math.abs(luckWeightMult(s, tone, C) - 1)).toBeLessThanOrEqual(C.luck.eventWeight + 1e-9);
        for (let ch = 0; ch <= 1; ch += 0.05) {
          const c = luckRiskChance(s, ch, tone, C);
          expect(Math.abs(c - ch)).toBeLessThanOrEqual(C.luck.risk + 1e-9);
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(1);
        }
      }
      expect(Math.abs(luckFightMult(s, C) - 1)).toBeLessThanOrEqual(C.luck.fight + 1e-9);
    }
    // eventos mudam a sorte no máximo maxEventChange, sempre dentro de 0–100
    expect(changeLuck(withLuck(g, 50), 99, C).character.luck).toBe(50 + C.luck.maxEventChange);
    expect(changeLuck(withLuck(g, 3), -10, C).character.luck).toBe(0);
  });

  it('é determinística: mesma seed e mesmas escolhas, mesma vida', () => {
    const play = () => {
      let s = withLuck(makeGame('det'), 80);
      for (let i = 0; i < 15; i++) {
        s = { ...s, pendingEvents: [] };
        s = resolveAll(advance(s));
      }
      return s;
    };
    expect(play()).toEqual(play());
  });

  it('quem tem mais sorte tira, em média, mais eventos bons (teste estatístico)', () => {
    const mk = (id: string, tone: 'good' | 'bad'): GameEvent => ({ id, weight: 1, tone, conditions: {}, text: id, choices: [{ id: 'ok', label: 'ok', resultText: '' }] });
    const pool = [mk('g1', 'good'), mk('g2', 'good'), mk('b1', 'bad'), mk('b2', 'bad')];
    const goods = (luck: number) => {
      const s = withLuck(makeGame('stat'), luck);
      let n = 0;
      for (let i = 0; i < 4000; i++) if (selectEvents(s, pool, 1, createRng(i + 1), C)[0]!.tone === 'good') n++;
      return n / 4000;
    };
    const lucky = goods(95);
    const unlucky = goods(5);
    expect(lucky).toBeGreaterThan(0.55);
    expect(unlucky).toBeLessThan(0.45);
    // mas nunca decide sozinha
    expect(lucky).toBeLessThan(0.7);
    expect(unlucky).toBeGreaterThan(0.3);
  });
});

describe('migração v10 → v11', () => {
  const v10 = fixturesV10 as unknown as Record<string, Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
  it.each(Object.keys(v10))('%s: talentos ocultos e sorte determinísticos', (k) => {
    expect(v10[k]!.version).toBe(10);
    const a = migrate(structuredClone(v10[k]));
    const b = migrate(structuredClone(v10[k]));
    expect(a.version).toBe(STATE_VERSION);
    expect(a.character.talents).toEqual(b.character.talents);
    expect(a.character.talents.every((t) => !t.revealed)).toBe(true);
    expect(a.character.luck).toBeGreaterThanOrEqual(0);
    expect(a.character.luck).toBeLessThanOrEqual(100);
    expect(a.rngState).toBe(v10[k]!.rngState);
    for (const p of a.relationships.people) expect(Array.isArray(p.talents)).toBe(true);
  });
});

// helpers locais (sem eventos pendentes acumulando)
import { advanceYear } from '../src/engine';
const advance = (s: GameState) => advanceYear(s, C);
function resolveAll(s: GameState): GameState {
  let g = s;
  while (g.pendingEvents.length) {
    const ev = C.events.find((e) => e.id === g.pendingEvents[0]!.eventId)!;
    g = resolveEvent(g, ev.id, ev.choices[0]!.id, C);
  }
  return g;
}
