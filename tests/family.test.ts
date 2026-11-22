import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { advanceYear, createRng, npcDeathChance, relationsOf, ageFamilyAndPeople, lastName } from '../src/engine';
import { aged, life } from './relHelpers';

describe('família', () => {
  it('é gerada ao nascer, de forma determinística pelo seed', () => {
    expect(life('fam').relationships).toEqual(life('fam').relationships);
    expect(life('fam').relationships).not.toEqual(life('outra').relationships);
  });

  it('pais mais velhos que o personagem (19–42 anos de diferença) e irmãos plausíveis', () => {
    for (let i = 0; i < 100; i++) {
      const g = life(`f${i}`);
      const dad = relationsOf(g, ['pai'])[0]!.person;
      const mom = relationsOf(g, ['mae'])[0]!.person;
      expect(dad.sex).toBe('M');
      expect(mom.sex).toBe('F');
      for (const p of [dad, mom]) {
        expect(p.age).toBeGreaterThanOrEqual(19);
        expect(p.age).toBeLessThanOrEqual(42);
        expect(p.job).toBeTruthy();
      }
      expect(lastName(dad.name)).toBe(lastName(g.character.name));
      const sibs = relationsOf(g, ['irmao']);
      expect(sibs.length).toBeLessThanOrEqual(2);
      for (const { person } of sibs) {
        expect(person.age).toBeGreaterThan(0);
        expect(mom.age - person.age).toBeGreaterThanOrEqual(18);
      }
    }
  });

  it('cerca de 20% das famílias têm pais separados', () => {
    let sep = 0;
    for (let i = 0; i < 300; i++) if (relationsOf(life(`s${i}`), ['pai'])[0]!.person.flags.separados) sep++;
    expect(sep / 300).toBeGreaterThan(0.1);
    expect(sep / 300).toBeLessThan(0.3);
  });

  it('todos envelhecem um ano a cada advanceYear', () => {
    const g = life('env');
    const next = advanceYear(g, { ...GAME_CONTENT, events: [] });
    for (const p of g.relationships.people) {
      const after = next.relationships.people.find((x) => x.id === p.id)!;
      expect(after.age).toBe(p.age + 1);
    }
  });

  it('NPCs idosos morrem com o tempo; a morte vira log e tira felicidade', () => {
    expect(npcDeathChance(10, 100)).toBe(0);
    expect(npcDeathChance(80, 80)).toBeGreaterThan(npcDeathChance(50, 80));
    let g = aged(50, 'morte');
    g = { ...g, relationships: { ...g.relationships, people: g.relationships.people.map((p) => ({ ...p, age: p.age + 50 })) } };
    let deaths = 0;
    let s = g;
    for (let y = 0; y < 30; y++) {
      s = ageFamilyAndPeople(s, createRng(y + 1), GAME_CONTENT);
    }
    deaths = s.relationships.people.filter((p) => !p.alive).length;
    expect(deaths).toBeGreaterThanOrEqual(2);
    const log = s.log.flatMap((y) => y.entries).join('\n');
    expect(log).toMatch(/(Seu pai|Sua mãe), \S+, faleceu aos \d+ anos\./);
    expect(s.character.stats.happiness).toBeLessThan(g.character.stats.happiness);
  });

  it('irmãos mais novos podem nascer durante a infância (no máximo 3 irmãos)', () => {
    let born = 0;
    for (let i = 0; i < 60; i++) {
      let s = life(`irm${i}`);
      for (let y = 0; y < 12; y++) s = advanceYear({ ...s, pendingEvents: [] }, { ...GAME_CONTENT, events: [] });
      const sibs = relationsOf(s, ['irmao'], false);
      expect(sibs.length).toBeLessThanOrEqual(3);
      if (sibs.some((x) => x.person.age < 12)) born++;
    }
    expect(born).toBeGreaterThan(5);
  });
});
