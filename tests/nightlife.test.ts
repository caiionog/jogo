import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { applicableInteractions, canHaveSexualContentWith, goOut, interact, venueBlockReason } from '../src/engine';
import type { GameState } from '../src/engine';
import { makeGame, withAge } from './helpers';
import { withPerson } from './relHelpers';

const at = (age: number, adult = true): GameState => {
  const g = { ...withAge(makeGame('noite'), age), money: 50000 };
  return { ...g, relationships: { ...g.relationships, settings: { ...g.relationships.settings, adultContent: adult } } };
};

describe('vida noturna', () => {
  it('locais 18+ bloqueados para menores; antes dos 18, festa de amigos, matinê e lanchonete', () => {
    for (const id of ['bar', 'festa', 'balada', 'casa_strip']) expect(venueBlockReason(at(16), id, C)).toBe('too-young');
    for (const id of ['festa_amigos', 'matine', 'lanchonete']) expect(venueBlockReason(at(15), id, C)).toBeNull();
    expect(venueBlockReason(at(25), 'matine', C)).toBe('too-old');
  });

  it('casa de strip só com "Conteúdo adulto" ligado', () => {
    expect(venueBlockReason(at(25, false), 'casa_strip', C)).toBe('adult-off');
    expect(goOut(at(25, false), 'casa_strip', C)).toEqual(at(25, false));
    expect(venueBlockReason(at(25, true), 'casa_strip', C)).toBeNull();
  });

  it('sair gera um evento do local e custa dinheiro (adulto); repetir rende menos', () => {
    const s = goOut(at(22), 'bar', C);
    expect(s.pendingEvents).toHaveLength(1);
    expect(C.venues.find((v) => v.id === 'bar')!.events).toContain(s.pendingEvents[0]!.eventId);
    expect(s.money).toBeLessThan(at(22).money);
    expect(s.yearUses.noite).toBe(1);
  });
});

describe('interações adultas com amizades, colegas, treinadores e professores', () => {
  it('flerte e noite juntos só com as regras de idade; nunca com professor da escola durante a escola', () => {
    const [g, p] = withPerson({ ...at(20, true) }, 'amigo', 24);
    const rel = g.relationships.relations.find((r) => r.personId === p.id)!;
    expect(applicableInteractions(g, p, rel)).toEqual(expect.arrayContaining(['flirt', 'night_together']));
    const [off] = withPerson(at(20, false), 'amigo', 24);
    expect(applicableInteractions(off, p, rel)).not.toContain('night_together');
    const [teen, tp] = withPerson(at(16, true), 'amigo', 16);
    const trel = teen.relationships.relations.find((r) => r.personId === tp.id)!;
    expect(applicableInteractions(teen, tp, trel)).toContain('flirt');
    expect(applicableInteractions(teen, tp, trel)).not.toContain('night_together');
    expect(interact(teen, tp.id, 'night_together', C)).toBe(teen);
    // professor(a) da escola: nunca enquanto aluno(a)
    const student = { ...at(18, true), education: { ...at(18).education, current: makeGame('noite').education.current ?? ({ grade: 14 } as never) } };
    expect(canHaveSexualContentWith(student, { age: 40, flags: { professor_escola: true } })).toBe(false);
    expect(canHaveSexualContentWith({ ...student, education: { ...student.education, current: null } }, { age: 40, flags: {} })).toBe(true);
  });
});
