import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { autoEvents, barExamBlockReason, takeBarExam } from '../src/engine';
import type { GameEvent, GameState } from '../src/engine';
import { makeEvent, makeGame, withAge } from './helpers';

/** Release 0.0.4, fase 1: eventos automáticos que não se repetem sem limite e o Exame da Ordem como ação. */

/** Um 'auto' se limita sozinho se tiver once, cooldownYears, schoolResult ou uma flag de parada resolvida por todas as escolhas. */
function selfLimiting(e: GameEvent): boolean {
  if (e.once || e.cooldownYears || e.conditions.schoolResult) return true;
  const none = e.conditions.flagsNone ?? [];
  if (none.length && e.choices.every((ch) => none.some((f) => ch.effects?.setFlags?.[f]))) return true;
  const all = e.conditions.flagsAll ?? [];
  const cleared = (ch: GameEvent['choices'][number], f: string) => {
    const c = ch.effects?.clearFlags as unknown;
    return Array.isArray(c) ? c.includes(f) : !!(c as Record<string, unknown> | undefined)?.[f];
  };
  return !!all.length && e.choices.every((ch) => all.some((f) => cleared(ch, f)));
}

describe('eventos automáticos (varredura)', () => {
  it('todo evento auto se limita (once, cooldownYears, schoolResult ou flag de parada)', () => {
    const bad = GAME_CONTENT.events.filter((e) => e.trigger === 'auto' && !selfLimiting(e)).map((e) => e.id);
    expect(bad).toEqual([]);
  });

  it('auto com cooldownYears não volta antes do intervalo', () => {
    const ev = makeEvent('auto_cd', { trigger: 'auto', cooldownYears: 2, conditions: {} });
    const g = withAge(makeGame(), 20);
    expect(autoEvents(g, [ev], GAME_CONTENT).map((e) => e.id)).toEqual(['auto_cd']);
    const fired = { ...g, eventLastAge: { auto_cd: 20 } };
    expect(autoEvents(withAge(fired, 21), [ev], GAME_CONTENT)).toEqual([]);
    expect(autoEvents(withAge(fired, 22), [ev], GAME_CONTENT).map((e) => e.id)).toEqual(['auto_cd']);
  });

  it('auto sem cooldownYears não ganha o intervalo padrão dos aleatórios', () => {
    const ev = makeEvent('auto_free', { trigger: 'auto', conditions: {} });
    const g = { ...withAge(makeGame(), 20), eventLastAge: { auto_free: 20 } };
    expect(autoEvents(withAge(g, 21), [ev], GAME_CONTENT)).toHaveLength(1);
  });
});

function lawyer(seed = 'oab', intelligence = 90, money = 5000): GameState {
  const g = withAge(makeGame(seed), 24);
  return {
    ...g,
    money,
    economy: { ...g.economy, ledger: { ...g.economy.ledger, opening: money - (g.money - g.economy.ledger.opening) } },
    college: { ...g.college, diplomas: ['direito'] },
    character: { ...g.character, stats: { ...g.character.stats, intelligence } },
  };
}

describe('Exame da Ordem (ação anual)', () => {
  it('exige diploma de Direito, taxa e uma tentativa por ano', () => {
    const g = withAge(makeGame('x'), 24);
    expect(barExamBlockReason(g, GAME_CONTENT)).toBe('no-degree');
    expect(barExamBlockReason(lawyer('a', 90, 10), GAME_CONTENT)).toBe('no-money');
    const l = lawyer();
    expect(barExamBlockReason(l, GAME_CONTENT)).toBeNull();
    const after = takeBarExam(l, GAME_CONTENT);
    expect(after.money).toBe(l.money - GAME_CONTENT.college.barExam.fee);
    expect(barExamBlockReason(after, GAME_CONTENT)).toBe(after.flags.oab ? 'licensed' : 'tried');
    expect(takeBarExam(after, GAME_CONTENT)).toBe(after);
  });

  it('inteligência alta passa quase sempre; baixa reprova quase sempre', () => {
    let hi = 0;
    let lo = 0;
    for (let i = 0; i < 60; i++) {
      if (takeBarExam(lawyer(`h${i}`, 95), GAME_CONTENT).flags.oab) hi++;
      if (takeBarExam(lawyer(`l${i}`, 35), GAME_CONTENT).flags.oab) lo++;
    }
    expect(hi).toBeGreaterThan(40);
    expect(lo).toBeLessThan(10);
  });

  it('"Não tenho interesse em advogar" não impede a inscrição depois', () => {
    const l = { ...lawyer(), flags: { sem_interesse_oab: true } };
    expect(barExamBlockReason(l, GAME_CONTENT)).toBeNull();
  });

  it('o aviso da OAB é único e oferece desistir de advogar', () => {
    const ev = GAME_CONTENT.events.find((e) => e.id === 'oab_exam')!;
    expect(ev.once).toBe(true);
    expect(ev.choices.some((c) => c.effects?.setFlags?.sem_interesse_oab)).toBe(true);
  });
});

import { migrate } from '../src/save/migrations';
import fixturesV16 from '../src/save/__fixtures__/saves-v16.json';
import { STATE_VERSION, addFame, fameAsRep, fameYear, sportFame } from '../src/engine';

describe('fama pública (release 0.0.4)', () => {
  it('migração v16 → v17: a fama nasce da reputação de lutador', () => {
    const v16 = fixturesV16 as unknown as Record<string, { fighter: { reputation: number; retired: boolean } }>;
    for (const k of Object.keys(v16)) {
      const raw = structuredClone(v16[k]!);
      const m = migrate(raw);
      expect(m.version).toBe(STATE_VERSION);
      const f = v16[k]!.fighter;
      expect(m.character.fame).toBe(Math.round(f.reputation * 0.8 * (f.retired ? 0.5 : 1)));
    }
  });

  it('nova vida começa sem fama; efeito e limites 0–100', () => {
    const g = makeGame('fama');
    expect(g.character.fame).toBe(0);
    expect(addFame(g, 150).character.fame).toBe(100);
    expect(addFame(g, -5).character.fame).toBe(0);
  });

  it('o esporte sustenta a fama; sem esporte ela cai devagar', () => {
    const g = makeGame('fama2');
    const fighter = { ...g, fighter: { ...g.fighter, reputation: 50 } };
    expect(sportFame(fighter)).toBe(40);
    expect(fameYear(fighter).character.fame).toBe(20);
    const famous = addFame(g, 60);
    expect(fameYear(famous).character.fame).toBe(58);
    expect(fameAsRep(addFame(g, 40))).toBe(50);
  });
});
