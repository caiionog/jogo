import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { MAX_ACTIVE_PEOPLE, advanceYear, conditionsMet, createRng, interact, meetSomeone, relationsOf, resolveEvent } from '../src/engine';
import type { GameState } from '../src/engine';
import { makeEvent } from './helpers';
import { aged, withPerson } from './relHelpers';

const C = GAME_CONTENT;

describe('condições de relacionamento', () => {
  const [base, friend] = withPerson(aged(20), 'amigo', 21, { affection: 70, traits: ['leal', 'ciumento'] });

  it('relationship: tipo, afeto, traço e idade da pessoa', () => {
    expect(conditionsMet(base, makeEvent('a', { conditions: { relationship: { types: ['amigo'] } } }))).toBe(true);
    expect(conditionsMet(base, makeEvent('b', { conditions: { relationship: { types: ['amigo'], affection: { min: 80 } } } }))).toBe(false);
    expect(conditionsMet(base, makeEvent('c', { conditions: { relationship: { types: ['amigo'], traits: ['ciumento'] } } }))).toBe(true);
    expect(conditionsMet(base, makeEvent('d', { conditions: { relationship: { types: ['amigo'], personAge: { max: 18 } } } }))).toBe(false);
    expect(conditionsMet(base, makeEvent('e', { conditions: { relationship: { types: ['filho'] } } }))).toBe(false);
  });

  it('alvo herdado (pessoa_id) precisa continuar batendo', () => {
    const ev = makeEvent('f', { conditions: { relationship: { types: ['amigo'] } } });
    expect(conditionsMet(base, ev, C, { pessoa_id: friend.id })).toBe(true);
    expect(conditionsMet(base, ev, C, { pessoa_id: 'p999' })).toBe(false);
  });

  it('hasRelation, noRelation, estado civil, filhos e idade do parceiro', () => {
    expect(conditionsMet(base, makeEvent('g', { conditions: { hasRelation: ['pai'] } }))).toBe(true);
    expect(conditionsMet(base, makeEvent('h', { conditions: { noRelation: ['filho'] } }))).toBe(true);
    expect(conditionsMet(base, makeEvent('i', { conditions: { civilStatus: ['solteiro'] } }))).toBe(true);
    const [married] = withPerson(base, 'conjuge', 30, { stage: 'casados' });
    expect(conditionsMet(married, makeEvent('j', { conditions: { civilStatus: ['casado'] } }))).toBe(true);
    expect(conditionsMet(married, makeEvent('k', { conditions: { partnerAge: { min: 25 } } }))).toBe(true);
    expect(conditionsMet(married, makeEvent('l', { conditions: { children: { min: 1 } } }))).toBe(false);
    const [kid] = withPerson(married, 'filho', 3);
    expect(conditionsMet(kid, makeEvent('m', { conditions: { children: { min: 1 } } }))).toBe(true);
  });

  it("tag 'adult': exige opção ligada, personagem 18+ e alvo 18+", () => {
    const adultEv = makeEvent('n', { tags: ['adult'], conditions: { minAge: 18, relationship: { types: ['parceiro'], personAge: { min: 18 } } } });
    const [off, p] = withPerson(aged(25, 'x', { adultContent: false }), 'parceiro', 25, { stage: 'namorando' });
    expect(conditionsMet(off, adultEv)).toBe(false);
    const on = { ...off, relationships: { ...off.relationships, settings: { ...off.relationships.settings, adultContent: true } } };
    expect(conditionsMet(on, adultEv)).toBe(true);
    const minorTarget = { ...on, relationships: { ...on.relationships, people: on.relationships.people.map((x) => (x.id === p.id ? { ...x, age: 17 } : x)) } };
    expect(conditionsMet(minorTarget, adultEv)).toBe(false);
    const minorChar = { ...on, character: { ...on.character, age: 17 } };
    expect(conditionsMet(minorChar, adultEv)).toBe(false);
  });

  it('o evento sorteado grava a pessoa-alvo nas variáveis ({pessoa})', () => {
    const content = { ...C, events: [makeEvent('alvo', { text: 'Oi {pessoa}', conditions: { relationship: { types: ['amigo'] } } })] };
    const next = advanceYear(base, content, { twoEventChance: 0 });
    const p = next.pendingEvents[0]!;
    expect(p.eventId).toBe('alvo');
    expect(relationsOf(next).some((x) => x.person.id === p.vars?.pessoa_id)).toBe(true);
    const done = resolveEvent(next, 'alvo', 'ok', content);
    expect(done.log.at(-1)!.entries.some((e) => e.startsWith('Oi '))).toBe(true);
  });
});

describe('limite de pessoas ativas', () => {
  it('depois de 80 anos conhecendo gente, o save não cresce sem controle', () => {
    let s: GameState = aged(0, 'limite');
    s = { ...s, character: { ...s.character, age: 0 } };
    const rng = createRng(77);
    for (let y = 0; y < 80 && s.alive; y++) {
      s = advanceYear({ ...s, pendingEvents: [] }, { ...C, events: [] });
      s = { ...s, energy: { current: 10, max: 10 }, money: 100000, character: { ...s.character, stats: { ...s.character.stats, health: 90 } } };
      for (let k = 0; k < 3; k++) s = meetSomeone(s, 'social', C, createRng(y * 10 + k));
      // termina para poder conhecer mais gente
      for (const { person, rel } of relationsOf(s, ['parceiro'])) if (rel.romance && rel.romance.stage !== 'casados' && rng.chance(0.7)) s = interact(s, person.id, 'break_up', C);
      for (let k = 0; k < 3; k++) s = interact({ ...s, pendingEvents: [] }, s.relationships.people[0]!.id, 'talk', C);
      expect(s.relationships.people.length).toBeLessThanOrEqual(MAX_ACTIVE_PEOPLE);
      expect(s.relationships.archived.length).toBeLessThanOrEqual(30);
    }
    expect(JSON.stringify(s).length).toBeLessThan(300_000);
  }, 60_000);
});
