import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  DECAY,
  advanceYear,
  getRelation,
  interact,
  interactionBlockReason,
  meetSomeone,
  createRng,
  relationsOf,
  relationshipsYear,
  performAction,
} from '../src/engine';
import { aged, withPerson } from './relHelpers';

const C = GAME_CONTENT;

describe('ações de relacionamento', () => {
  it('passar tempo aumenta o afeto (e conta como repetição no ano)', () => {
    const [g, p] = withPerson(aged(20), 'amigo', 20, { affection: 50 });
    const r = interact(g, p.id, 'spend_time', C);
    expect(r.yearUses[`rel:spend_time:${p.id}`]).toBe(1);
    expect(getRelation(r, p.id)!.affection).toBeGreaterThan(50);
    expect(getRelation(r, p.id)!.interactedYear).toBe(g.year);
  });

  it('discutir reduz o afeto; explosivo reduz mais', () => {
    const calm = withPerson(aged(20), 'amigo', 20, { affection: 60, traits: ['tranquilo'] });
    const hot = withPerson(aged(20), 'amigo', 20, { affection: 60, traits: ['explosivo'] });
    const a = getRelation(interact(calm[0], calm[1].id, 'argue', C), calm[1].id)!.affection;
    const b = getRelation(interact(hot[0], hot[1].id, 'argue', C), hot[1].id)!.affection;
    expect(a).toBeLessThan(60);
    expect(b).toBeLessThan(a);
  });

  it('presente custa dinheiro; pedir dinheiro só aos pais e uma vez por ano', () => {
    const [g, p] = withPerson(aged(20), 'amigo', 20);
    expect(interact(g, p.id, 'gift', C).money).toBe(g.money - 200);
    expect(interactionBlockReason(g, p.id, 'ask_money')).toBe('not-applicable');
    const dad = relationsOf(g, ['pai'])[0]!.person;
    const once = interact(g, dad.id, 'ask_money', C);
    expect(interactionBlockReason(once, dad.id, 'ask_money')).toBe('asked');
  });

  it('bloqueios: acontecimento pendente, pessoa morta (sem custo de energia)', () => {
    const [g, p] = withPerson(aged(20), 'amigo', 20);
    expect(interactionBlockReason(g, p.id, 'talk')).toBeNull();
    expect(interactionBlockReason({ ...g, pendingEvents: [{ eventId: 'x' }] }, p.id, 'talk')).toBe('busy');
    const dead = { ...g, relationships: { ...g.relationships, people: g.relationships.people.map((x) => (x.id === p.id ? { ...x, alive: false } : x)) } };
    expect(interactionBlockReason(dead, p.id, 'talk')).toBe('person-dead');
  });

  it('sem interação, o afeto decai a cada ano (amigos mais que família)', () => {
    let [g, p] = withPerson(aged(20), 'amigo', 20, { affection: 60 });
    g = { ...g, year: g.year + 2 };
    const dad = relationsOf(g, ['pai'])[0]!;
    const r = relationshipsYear(g, createRng(1), C);
    expect(getRelation(r, p.id)!.affection).toBe(60 - DECAY.amigo!);
    expect(getRelation(r, dad.person.id)!.affection).toBe(dad.rel.affection - DECAY.pai!);
  });

  it('amizade fria acaba (arquivada com resumo)', () => {
    let [g, p] = withPerson(aged(20), 'amigo', 20, { affection: 12 });
    g = { ...g, year: g.year + 2 };
    const r = relationshipsYear(g, createRng(2), C);
    expect(getRelation(r, p.id)).toBeUndefined();
    expect(r.relationships.archived.at(-1)).toMatchObject({ name: p.name, type: 'amigo' });
  });

  it('rival com afeto alto vira amigo', () => {
    const [g, p] = withPerson(aged(25), 'rival', 25, { affection: 58, traits: ['carinhoso'] });
    let s = g;
    for (let i = 0; i < 3; i++) s = interact(s, p.id, 'compliment', C);
    expect(getRelation(s, p.id)!.type).toBe('amigo');
  });

  it('ensinar luta ao filho aumenta o atletismo e pode criar interesse_luta', () => {
    let found = false;
    for (let i = 0; i < 30 && !found; i++) {
      const [g, kid] = withPerson(aged(35, `k${i}`), 'filho', 8);
      const r = interact(g, kid.id, 'teach_fight', C);
      const after = r.relationships.people.find((x) => x.id === kid.id)!;
      expect(after.athletic).toBeGreaterThan(kid.athletic);
      if (after.flags.interesse_luta) found = true;
    }
    expect(found).toBe(true);
  });

  it('amizades nascem na escola (Fazer amizade) e na academia', () => {
    let made = 0;
    for (let i = 0; i < 20; i++) {
      let g = aged(10, `esc${i}`);
      g = advanceYear(g, { ...C, events: [] });
      g = { ...g };
      for (let k = 0; k < 4; k++) g = performAction(g, 'make_friends', C);
      made += relationsOf(g, ['amigo']).length;
    }
    expect(made).toBeGreaterThan(10);
  });

  it('conhecer alguém respeita a preferência e a faixa de idade', () => {
    let s = aged(25);
    s = { ...s, relationships: { ...s.relationships, settings: { ...s.relationships.settings, preference: 'M' } } };
    for (let i = 0; i < 40; i++) {
      const r = meetSomeone({ ...s, rngState: i * 977 }, 'app', C, createRng(i));
      const p = relationsOf(r, ['parceiro'])[0]?.person;
      if (p) {
        expect(p.sex).toBe('M');
        expect(p.age).toBeGreaterThanOrEqual(18);
      }
    }
  });
});
