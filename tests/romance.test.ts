import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  CHILD_YEARLY_COST,
  canDate,
  canHaveSexualContent,
  canMarry,
  civilStatus,
  createRng,
  currentPartner,
  divorce,
  getRelation,
  inherit,
  interact,
  interactionBlockReason,
  isValidPartnerAge,
  marry,
  meetBlockReason,
  meetSomeone,
  relationsOf,
  relationshipsYear,
  resolvePregnancy,
  startPregnancy,
} from '../src/engine';
import { aged, withPerson } from './relHelpers';

const C = GAME_CONTENT;

describe('guardas de idade', () => {
  it('canHaveSexualContent é false sempre que alguém tem menos de 18', () => {
    for (let a = 0; a <= 30; a++) {
      for (let b = 0; b <= 30; b++) {
        expect(canHaveSexualContent({ age: a }, { age: b })).toBe(a >= 18 && b >= 18);
      }
    }
    expect(canHaveSexualContent({ age: 30 }, { age: 30, alive: false })).toBe(false);
  });

  it('faixas de parceiro: 14–17 só com 14–17 e até 2 anos; 18+ só com 18+', () => {
    expect(canDate(13)).toBe(false);
    expect(canDate(14)).toBe(true);
    expect(isValidPartnerAge(15, 17)).toBe(true);
    expect(isValidPartnerAge(14, 17)).toBe(false);
    expect(isValidPartnerAge(17, 18)).toBe(false);
    expect(isValidPartnerAge(16, 13)).toBe(false);
    expect(isValidPartnerAge(18, 17)).toBe(false);
    expect(isValidPartnerAge(30, 45)).toBe(true);
    expect(canMarry(17, 30)).toBe(false);
    expect(canMarry(18, 18)).toBe(true);
  });
});

describe('namoro e casamento', () => {
  it('namoro bloqueado antes dos 14', () => {
    expect(meetBlockReason(aged(13), 'social')).toBe('too-young');
    expect(meetSomeone(aged(13), 'social', C, createRng(1))).toEqual(aged(13));
    expect(meetBlockReason(aged(15), 'app')).toBe('app-adult');
    expect(meetBlockReason(aged(15), 'social')).toBeNull();
  });

  it('noivado e casamento bloqueados antes dos 18', () => {
    const [g, p] = withPerson(aged(17), 'parceiro', 17, { affection: 95, stage: 'namorando' });
    expect(interactionBlockReason(g, p.id, 'propose')).toBe('not-applicable');
    expect(marry(g, p.id, 'simple')).toBe(g);
  });

  it('progressão ficando → namorando → noivos → casados', () => {
    let married = false;
    for (let i = 0; i < 40 && !married; i++) {
      let [g, p] = withPerson({ ...aged(26), rngState: i * 101 }, 'parceiro', 25, { affection: 70, stage: 'ficando', traits: ['leal', 'carinhoso'] });
      for (let k = 0; k < 6 && getRelation(g, p.id)?.romance?.stage === 'ficando'; k++) g = interact({ ...g, energy: { current: 8, max: 8 } }, p.id, 'ask_out', C);
      if (getRelation(g, p.id)?.romance?.stage !== 'namorando') continue;
      expect(civilStatus(g)).toBe('namorando');
      g = { ...g, energy: { current: 8, max: 8 } };
      for (let k = 0; k < 4 && getRelation(g, p.id)?.romance?.stage === 'namorando'; k++) {
        g = interact({ ...g, energy: { current: 8, max: 8 }, pendingEvents: [] }, p.id, 'propose', C);
      }
      if (getRelation(g, p.id)?.romance?.stage !== 'noivos') continue;
      expect(g.pendingEvents.some((e) => e.eventId === 'rel_wedding')).toBe(true);
      g = marry({ ...g, pendingEvents: [] }, p.id, 'simple');
      expect(civilStatus(g)).toBe('casado');
      expect(getRelation(g, p.id)!.type).toBe('conjuge');
      expect(g.log.at(-1)!.entries.at(-1)).toMatch(/Você se casou com /);
      married = true;
    }
    expect(married).toBe(true);
  });

  it('divórcio custa metade do dinheiro e 20 de felicidade', () => {
    let [g, p] = withPerson(aged(30), 'conjuge', 30, { stage: 'casados' });
    g = { ...g, money: 40000, character: { ...g.character, stats: { ...g.character.stats, happiness: 80 } } };
    const r = divorce(g, p.id);
    expect(r.money).toBe(20000);
    expect(r.character.stats.happiness).toBe(60);
    expect(civilStatus(r)).toBe('divorciado');
    expect(getRelation(r, p.id)!.type).toBe('ex');
  });

  it('carreira: lutas no ano reduzem o afeto do(a) parceiro(a)', () => {
    let [g, p] = withPerson(aged(28), 'parceiro', 28, { affection: 70, stage: 'namorando', traits: ['ciumento'] });
    g = { ...g, year: g.year + 1 };
    const fights = [1, 2, 3].map((i) => ({ age: 27, year: g.year - 1, orgId: 'arc', opponent: `X${i}`, result: 'W' as const, method: 'DEC' as const, round: 3, title: false, pro: true }));
    const withFights = { ...g, fighter: { ...g.fighter, history: fights } };
    const a = getRelation(relationshipsYear(g, createRng(3), C), p.id)!.affection;
    const b = getRelation(relationshipsYear(withFights, createRng(3), C), p.id)!.affection;
    expect(b).toBeLessThan(a);
  });

  it('namoro adolescente termina quando a faixa de idade deixa de valer', () => {
    let [g] = withPerson(aged(17), 'parceiro', 17, { stage: 'namorando', affection: 80 });
    g = { ...g, character: { ...g.character, age: 18 } }; // personagem fez 18, parceiro ainda 17
    const r = relationshipsYear({ ...g, relationships: { ...g.relationships, people: g.relationships.people.map((p) => (relationsOf(g, ['parceiro']).some((x) => x.person.id === p.id) ? { ...p, age: 16 } : p)) } }, createRng(1), C);
    expect(currentPartner(r)).toBeUndefined();
  });
});

describe('filhos', () => {
  it('gravidez só com os dois 18+ e casal M/F; nascimento no ano seguinte', () => {
    const [teen, tp] = withPerson(aged(17), 'parceiro', 17, { stage: 'namorando' });
    expect(startPregnancy(teen, tp.id, C)).toBe(teen);
    const [same, sp] = withPerson(aged(25), 'conjuge', 25, { stage: 'casados', sex: 'M' });
    expect(startPregnancy(same, sp.id, C)).toBe(same);
    let [g, p] = withPerson(aged(25), 'conjuge', 25, { stage: 'casados', sex: 'F' });
    g = startPregnancy(g, p.id, C);
    expect(g.relationships.pregnancy).not.toBeNull();
    g = resolvePregnancy({ ...g, year: g.year + 1 }, createRng(4), C);
    const kids = relationsOf(g, ['filho']);
    expect(kids).toHaveLength(1);
    expect(kids[0]!.person.age).toBe(0);
    expect(g.log.at(-1)!.entries.at(-1)).toMatch(/Nasceu (seu filho|sua filha)/);
  });

  it('adoção funciona para qualquer casal casado', () => {
    const [g, p] = withPerson(aged(30), 'conjuge', 30, { stage: 'casados', sex: 'M' });
    const r = interact(g, p.id, 'adopt', C);
    expect(r.relationships.pregnancy?.adoption).toBe(true);
    expect(r.money).toBe(g.money - 10000);
  });

  it('herança: atributos dos filhos ficam na faixa dos pais ± 12', () => {
    const rng = createRng(9);
    for (let i = 0; i < 500; i++) {
      const a = rng.int(0, 100);
      const b = rng.int(0, 100);
      const v = inherit(rng, a, b);
      expect(v).toBeGreaterThanOrEqual(Math.max(0, Math.round((a + b) / 2) - 12));
      expect(v).toBeLessThanOrEqual(Math.min(100, Math.round((a + b) / 2) + 12));
    }
  });

  it('despesa anual por filho menor de 18', () => {
    let [g] = withPerson(aged(35), 'filho', 5);
    g = { ...g, money: 10000, year: g.year + 1 };
    expect(relationshipsYear(g, createRng(1), C).money).toBe(10000 - CHILD_YEARLY_COST);
  });
});
