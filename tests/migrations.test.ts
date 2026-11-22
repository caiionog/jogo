import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/saves-v1.json';
import fixturesV2 from './fixtures/saves-v2.json';
import { GAME_CONTENT } from '../src/content';
import { advanceYear, gradeForAge, performAction } from '../src/engine';
import { CURRENT_VERSION, migrate, SaveMigrationError } from '../src/save/migrations';
import { makeGame, resolveAllFirst } from './helpers';

type Raw = Record<string, unknown> & { version: number; rngState: number };
const v1 = fixtures as unknown as Record<string, Raw>;
const v2 = fixturesV2 as unknown as Record<string, Raw>;

describe('migrações de save', () => {
  it('save da versão atual passa intacto', () => {
    const g = makeGame();
    expect(migrate(JSON.parse(JSON.stringify(g)))).toEqual(g);
  });

  it('rejeita save sem versão ou de versão futura', () => {
    expect(() => migrate({})).toThrow(SaveMigrationError);
    expect(() => migrate(null)).toThrow(SaveMigrationError);
    expect(() => migrate({ version: CURRENT_VERSION + 1 })).toThrow(SaveMigrationError);
  });

  it('fixtures são saves v1 reais (Etapa 1)', () => {
    for (const s of Object.values(v1)) {
      expect(s.version).toBe(1);
      expect(s).not.toHaveProperty('education');
    }
  });

  it.each(['1', '8', '16', '25'])('v1 → atual com idade %s (cadeia v1→…→atual)', (key) => {
    const raw = structuredClone(v1[key]!);
    const g = migrate(raw);
    const age = g.character.age;
    expect(g.version).toBe(CURRENT_VERSION);
    expect(g.scheduledEvents).toEqual([]);
    expect(g.fighter).toBeDefined();
    expect(g.activeFight).toBeNull();
    expect(g.character.familyWealth).toBeGreaterThanOrEqual(0);
    expect(g.character.familyWealth).toBeLessThanOrEqual(100);
    expect(g.rngState).toBe(v1[key]!.rngState);
    if (age < 3) expect(g.education.current).toBeNull();
    if (age >= 3 && age <= 17) {
      expect(g.education.current?.grade).toBe(gradeForAge(age));
      expect(g.education.current?.school.name).toBeTruthy();
    }
    if (age >= 18) {
      expect(g.education.graduated).toBe(true);
      expect(g.flags.formado).toBe(true);
    }
    // flag antiga renomeada
    expect(g.flags).not.toHaveProperty('brigouNaEscola');
    expect(g.flags.brigou_na_escola).toBe(true);
    // continua jogável
    let s = resolveAllFirst(advanceYear(g, GAME_CONTENT));
    s = performAction(s, 'study', GAME_CONTENT);
    s = resolveAllFirst(advanceYear(s, GAME_CONTENT));
    expect(s.character.age).toBe(age + 2);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('migração é determinística', () => {
    expect(migrate(structuredClone(v1['8']))).toEqual(migrate(structuredClone(v1['8'])));
  });
});

describe('migração v2 → v3 (carreira de luta)', () => {
  it('fixtures são saves v2 reais (Etapa 2)', () => {
    for (const s of Object.values(v2)) {
      expect(s.version).toBe(2);
      expect(s).not.toHaveProperty('fighter');
    }
  });

  it.each(['2', '9', '16', '22'])('idade %s: corpo, perfil de lutador e mundo coerentes', (key) => {
    const raw = structuredClone(v2[key]!);
    const g = migrate(raw);
    const age = g.character.age;
    expect(g.version).toBe(CURRENT_VERSION);
    expect(g.rngState).toBe(v2[key]!.rngState);
    // corpo
    expect(g.character.heightCm).toBeGreaterThan(age < 3 ? 60 : 100);
    expect(g.character.weightKg).toBeGreaterThan(8);
    expect(g.character.heightCm).toBeLessThanOrEqual(g.character.adultHeightCm);
    // perfil
    const f = g.fighter;
    expect(f.pro.wins + f.amateur.wins).toBe(0);
    expect(f.orgId).toBeNull();
    expect(g.world.rosters).toEqual({});
    for (const v of Object.values(f.skills)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    // continua jogável
    let s = resolveAllFirst(advanceYear(g, GAME_CONTENT));
    s = resolveAllFirst(advanceYear(s, GAME_CONTENT));
    expect(s.character.age).toBe(age + 2);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('flags e clubes da Etapa 2 viram vantagens de lutador', () => {
    const plain = migrate(structuredClone(v2['2']!));
    const veteran = migrate(structuredClone(v2['16']!)); // jiu-jitsu, luta olímpica, brigou na escola, medalha
    expect(veteran.fighter.skills.grappling).toBeGreaterThan(plain.fighter.skills.grappling + 10);
    expect(veteran.fighter.skills.wrestling).toBeGreaterThan(plain.fighter.skills.wrestling + 10);
    expect(veteran.fighter.reputation).toBe(5);
    expect(veteran.fighter.belt.years).toBeGreaterThan(0);
    expect(veteran.fighter.gymId).toBe('gen_bairro');
    expect(plain.fighter.gymId).toBeNull();
  });

  it('é determinística', () => {
    expect(migrate(structuredClone(v2['9']!))).toEqual(migrate(structuredClone(v2['9']!)));
  });
});

import fixturesV3 from './fixtures/saves-v3.json';
import { relationsOf } from '../src/engine';
import type { GameState } from '../src/engine';
const v3 = fixturesV3 as unknown as Record<string, Raw>;

describe('migração v3 → v4 (relacionamentos)', () => {
  it('fixtures são saves v3 reais (Etapa 3)', () => {
    for (const s of Object.values(v3)) {
      expect(s.version).toBe(3);
      expect(s).not.toHaveProperty('relationships');
    }
  });

  it.each(['3', '12', '20', '35'])('idade %s: família coerente, treinador e conteúdo adulto desligado', (key) => {
    const g = migrate(structuredClone(v3[key]!));
    const age = g.character.age;
    expect(g.version).toBe(CURRENT_VERSION);
    expect(g.rngState).toBe(v3[key]!.rngState);
    expect(g.relationships.settings.adultContent).toBe(false);
    const parents = relationsOf(g, ['pai', 'mae'], false);
    expect(parents).toHaveLength(2);
    for (const { person } of parents) {
      expect(person.age - age).toBeGreaterThanOrEqual(19);
      expect(person.age - age).toBeLessThanOrEqual(42);
      if (!person.alive) expect(person.deathAge).toBeLessThanOrEqual(person.age);
    }
    for (const { person } of relationsOf(g, ['irmao'])) expect(person.age).toBeGreaterThan(age);
    const coach = relationsOf(g, ['treinador']);
    expect(coach.length).toBe(g.fighter.gymId ? 1 : 0);
    // continua jogável
    let s = resolveAllFirst(advanceYear(g, GAME_CONTENT));
    s = resolveAllFirst(advanceYear(s, GAME_CONTENT));
    expect(s.character.age).toBe(age + 2);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('é determinística', () => {
    expect(migrate(structuredClone(v3['20']!))).toEqual(migrate(structuredClone(v3['20']!)));
  });
});

import fixturesV4 from './fixtures/saves-v4.json';
const v4 = fixturesV4 as unknown as Record<string, Raw>;

describe('migração v4 → v5 (economia)', () => {
  it('fixtures são saves v4 reais (Etapa 4)', () => {
    for (const s of Object.values(v4)) {
      expect(s.version).toBe(4);
      expect(s).not.toHaveProperty('economy');
    }
  });

  it.each(['10', '22', '35', '60'])('idade %s: dinheiro inteiro, extrato vazio, moradia e patrimônio dos pais', (key) => {
    const g = migrate(structuredClone(v4[key]!));
    expect(g.version).toBe(5);
    expect(Number.isInteger(g.money)).toBe(true);
    expect(g.economy.ledger.opening).toBe(g.money);
    expect(g.economy.ledger.entries).toEqual([]);
    if (g.character.age < 18) expect(g.economy.housing).toBe('pais');
    for (const { person } of relationsOf(g, ['pai', 'mae'])) expect(Number.isInteger(person.wealth)).toBe(true);
    if (g.alive) {
      let s = resolveAllFirst(advanceYear(g, GAME_CONTENT));
      s = resolveAllFirst(advanceYear(s, GAME_CONTENT));
      expect(s.character.age).toBe(g.character.age + 2);
      expect(s.economy.history.length).toBe(2);
    }
  });

  it('casamentos existentes ganham comunhão parcial', () => {
    const raw = structuredClone(v4['22']!) as unknown as GameState;
    const spouse = raw.relationships.people[0]!;
    raw.relationships.relations = raw.relationships.relations.map((r) => (r.personId === spouse.id ? { ...r, type: 'conjuge', romance: { stage: 'casados', since: 21 } } : r));
    const g = migrate(raw);
    expect(g.economy.marriage).toMatchObject({ personId: spouse.id, regime: 'parcial' });
  });

  it('é determinística', () => {
    expect(migrate(structuredClone(v4['35']!))).toEqual(migrate(structuredClone(v4['35']!)));
  });
});
