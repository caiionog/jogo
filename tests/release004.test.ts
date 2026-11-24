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

import fixturesV17 from '../src/save/__fixtures__/saves-v17.json';
import { cityNeighborhoods, cityResidents, generateResidents, homeNeighborhood, meetResident, meetResidentBlockReason, residentAge, residentCount } from '../src/engine';

describe('população da cidade (release 0.0.4)', () => {
  it('migração v17 → v18 cria a população vazia', () => {
    const v17 = fixturesV17 as unknown as Record<string, unknown>;
    for (const k of Object.keys(v17)) {
      const m = migrate(structuredClone(v17[k]) as never);
      expect(m.version).toBe(STATE_VERSION);
      expect(m.population).toEqual({ version: 1, met: {} });
    }
  });

  it('60 a 400 moradores conforme a população; bairros fixos por cidade', () => {
    expect(residentCount(3000)).toBe(60);
    expect(residentCount(20_000_000)).toBe(400);
    const g = makeGame('pop');
    const n = residentCount(GAME_CONTENT.geo.ufs.find((u) => u.sigla === g.character.uf)!.cities.find((c) => c.name === g.character.city)!.populacao);
    expect(generateResidents(g, GAME_CONTENT)).toHaveLength(n);
    const hoods = cityNeighborhoods(GAME_CONTENT, g.character.uf, g.character.city);
    expect(hoods.length).toBeGreaterThanOrEqual(6);
    expect(cityNeighborhoods(GAME_CONTENT, g.character.uf, g.character.city)).toEqual(hoods);
    expect(hoods).toContain(homeNeighborhood(g, GAME_CONTENT));
  });

  it('determinístico, não mexe no rngState e envelhece com o ano', () => {
    const g = makeGame('pop2');
    const a = generateResidents(g, GAME_CONTENT);
    expect(generateResidents(g, GAME_CONTENT)).toEqual(a);
    expect(g.rngState).toBe(makeGame('pop2').rngState);
    const later = withAge({ ...g, year: g.year + 10 }, g.character.age + 10);
    const b = generateResidents(later, GAME_CONTENT);
    expect(b.map((r) => r.id)).toEqual(a.map((r) => r.id));
    expect(residentAge(later, b[0]!)).toBe(residentAge(g, a[0]!) + 10);
  });

  it('conhecer um morador cria a pessoa uma vez só e respeita idade', () => {
    const g = withAge(makeGame('pop3'), 30);
    const adult = cityResidents(g, GAME_CONTENT).find((r) => residentAge(g, r) >= 20)!;
    const minor = cityResidents(g, GAME_CONTENT).find((r) => residentAge(g, r) < 16);
    if (minor) expect(meetResidentBlockReason(g, minor.id, GAME_CONTENT)).toBe('minor');
    const s = meetResident(g, adult.id, GAME_CONTENT);
    const pid = s.population.met[adult.id]!;
    const person = s.relationships.people.find((p) => p.id === pid)!;
    expect(person.name).toBe(adult.name);
    expect(s.relationships.relations.find((r) => r.personId === pid)!.type).toBe('conhecido');
    expect(cityResidents(s, GAME_CONTENT).some((r) => r.id === adult.id)).toBe(false);
    expect(meetResident(s, adult.id, GAME_CONTENT)).toBe(s);
  });
});

import { appCards, appLike, appLikeBlockReason, currentPartner, discoverAffairs, exFriends, interact, marry, newRomanceMode, partners, reconnectExFriend, startRomance, archivePerson, addRelation, createPerson, createRng as mkRng } from '../src/engine';

function adultWithPartner(seed = 'rom', open = false): GameState {
  let g = withAge(makeGame(seed), 28);
  g = { ...g, relationships: { ...g.relationships, settings: { ...g.relationships.settings, adultContent: true } } };
  const rng = mkRng(1);
  const [s, p] = createPerson(g, rng, GAME_CONTENT, { age: 28, sex: g.character.sex === 'M' ? 'F' : 'M' });
  return addRelation(s, p.id, 'parceiro', 70, { romance: { stage: 'namorando', since: 26, ...(open ? { open: true } : {}) } });
}

describe('vários parceiros, relação aberta e casos (release 0.0.4)', () => {
  it('sem ninguém: livre; com parceiro fechado: caso escondido; aberto: livre; menor: bloqueado', () => {
    expect(newRomanceMode(withAge(makeGame('a'), 25))).toBe('free');
    expect(newRomanceMode(adultWithPartner())).toBe('secret');
    expect(newRomanceMode(adultWithPartner('b', true))).toBe('free');
    const teen = adultWithPartner('c');
    expect(newRomanceMode(withAge(teen, 16))).toBe('blocked');
    expect(startRomance(adultWithPartner())?.secret).toBe(true);
  });

  it('caso escondido não vira casamento e o casamento é exclusivo', () => {
    let s = adultWithPartner('d');
    const rng = mkRng(2);
    const [s2, other] = createPerson(s, rng, GAME_CONTENT, { age: 27 });
    s = addRelation(s2, other.id, 'parceiro', 80, { romance: { stage: 'namorando', since: 27, secret: true } });
    expect(partners(s)).toHaveLength(2);
    expect(currentPartner(s)!.rel.romance!.secret).toBeUndefined();
    expect(marry(s, other.id, 'simple')).toBe(s);
    const main = currentPartner(s)!.person.id;
    const wed = marry(s, main, 'simple');
    expect(wed.relationships.relations.find((r) => r.personId === main)!.type).toBe('conjuge');
  });

  it('casos escondidos acabam sendo descobertos', () => {
    let found = 0;
    for (let i = 0; i < 80; i++) {
      let s = adultWithPartner(`e${i}`);
      const rng = mkRng(i + 10);
      const [s2, other] = createPerson(s, rng, GAME_CONTENT, { age: 27 });
      s = addRelation(s2, other.id, 'parceiro', 60, { romance: { stage: 'ficando', since: 28, secret: true } });
      const after = discoverAffairs(s, mkRng(i));
      if (after.relationships.relations.find((r) => r.personId === other.id)?.type === 'ex') found++;
    }
    expect(found).toBeGreaterThan(5);
    expect(found).toBeLessThan(35);
  });

  it('propor relação aberta só entre adultos', () => {
    const s = adultWithPartner('f');
    const pid = currentPartner(s)!.person.id;
    let opened = false;
    let cur = s;
    for (let i = 0; i < 30 && !opened; i++) {
      cur = interact({ ...cur, rngState: i * 7919 + 1 }, pid, 'propose_open', GAME_CONTENT);
      opened = !!cur.relationships.relations.find((r) => r.personId === pid)?.romance?.open;
    }
    expect(opened).toBe(true);
  });
});

describe('app de namoro e ex-amizades (release 0.0.4)', () => {
  it('só adultos; cartões determinísticos e adultos; curtir pode dar match', () => {
    expect(appCards(withAge(makeGame('g'), 16), GAME_CONTENT)).toEqual([]);
    const g = withAge(makeGame('h'), 30);
    const cards = appCards(g, GAME_CONTENT);
    expect(cards.length).toBeGreaterThan(3);
    expect(cards.every((c) => c.age >= 18)).toBe(true);
    expect(appCards(g, GAME_CONTENT)).toEqual(cards);
    expect(appLikeBlockReason(g, cards[0]!.id, GAME_CONTENT)).toBeNull();
    let matched = 0;
    for (let i = 0; i < 40; i++) {
      const s = { ...withAge(makeGame(`m${i}`), 30) };
      const c = appCards(s, GAME_CONTENT)[0]!;
      const after = appLike(s, c.id, GAME_CONTENT);
      if (after.relationships.people.length > s.relationships.people.length) matched++;
      expect(appCards(after, GAME_CONTENT).some((x) => x.id === c.id)).toBe(false);
    }
    expect(matched).toBeGreaterThan(5);
  });

  it('amizade arquivada vira ex-amizade e pode ser reatada', () => {
    let s = withAge(makeGame('ex'), 30);
    const [s2, p] = createPerson(s, mkRng(3), GAME_CONTENT, { age: 30 });
    s = archivePerson(addRelation(s2, p.id, 'amigo', 5), p.id, 'Vocês se afastaram.');
    expect(exFriends(s).map((a) => a.person!.id)).toEqual([p.id]);
    let back = s;
    for (let i = 0; i < 20 && !back.relationships.people.some((x) => x.id === p.id); i++) back = reconnectExFriend({ ...s, rngState: i * 104729 + 3 }, p.id);
    expect(back.relationships.relations.find((r) => r.personId === p.id)!.type).toBe('amigo');
    expect(exFriends(back)).toEqual([]);
  });
});
