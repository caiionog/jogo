import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import {
  GROUP_USE_KEY,
  applySocialEffects,
  createRng,
  getPerson,
  getRelation,
  groupActivities,
  groupAvailability,
  groupBlockReason,
  hangOutAll,
  sessionsLeft,
} from '../src/engine';
import type { GameContent, GameEvent, GameState, GroupActivityDef, Person } from '../src/engine';
import { aged, withPerson } from './relHelpers';

const ACTS: GroupActivityDef[] = [
  { id: 't_kid', label: 'Brincar na rua', emoji: '⚽', minAge: 5, maxAge: 12, cost: 30, happiness: 4, affection: 4, text: 'Você brincou na rua com {n} amigos.' },
  { id: 't_teen', label: 'Rolê no shopping', emoji: '🛍️', minAge: 13, maxAge: 17, cost: 40, happiness: 4, affection: 4, text: 'Rolê com {n} amigos.' },
  { id: 't_bar', label: 'Barzinho', emoji: '🍻', minAge: 18, maxAge: 120, cost: 150, happiness: 6, affection: 6, text: 'Barzinho com {n} amigos.' },
  { id: 't_treino', label: 'Treinar juntos', emoji: '🥋', minAge: 12, maxAge: 120, cost: 0, happiness: 2, affection: 3, training: true, text: 'Treino com {n} amigos.' },
];

const EV_OK: GameEvent = {
  id: 'grp_test_ok',
  trigger: 'followUp',
  weight: 0,
  conditions: {},
  text: '{pessoa} e {pessoa2} discutiram.',
  choices: [{ id: 'a', label: 'Ok', resultText: 'Ok.' }, { id: 'b', label: 'Ok 2', resultText: 'Ok.' }],
};
const EV_NEVER: GameEvent = { ...EV_OK, id: 'grp_test_never', conditions: { minAge: 200 } };

function content(over: Partial<GameContent['friends']> = {}): GameContent {
  return {
    ...GAME_CONTENT,
    events: [...GAME_CONTENT.events, EV_OK, EV_NEVER],
    friends: { activities: ACTS, groupEvents: ['grp_test_ok', 'grp_test_never'], groupEventChance: 1, ...over },
  };
}
const C = content();

/** Ledger coerente com o dinheiro do helper (`aged` muda `money` direto). */
function fixLedger(s: GameState): GameState {
  const sum = s.economy.ledger.entries.reduce((t, e) => t + e.amount, 0);
  return { ...s, economy: { ...s.economy, ledger: { ...s.economy.ledger, opening: s.money - sum } } };
}
const ledgerOk = (s: GameState) => s.money - s.economy.ledger.opening === s.economy.ledger.entries.reduce((t, e) => t + e.amount, 0);

/** Personagem com `n` amigos (afeto 50) e opcionalmente um brigado (afeto 10). */
function withFriends(age: number, n: number, seed = 'grp', feud = false): [GameState, Person[]] {
  let s = fixLedger({ ...aged(age, seed), pendingEvents: [] });
  const people: Person[] = [];
  for (let i = 0; i < n; i++) {
    let p: Person;
    [s, p] = withPerson(s, i % 2 ? 'colega_treino' : 'amigo', Math.max(5, age + (i % 3) - 1), { affection: 50 + i });
    people.push(p);
  }
  if (feud) {
    let p: Person;
    [s, p] = withPerson(s, 'amigo', age, { affection: 10 });
    people.push(p);
  }
  return [s, people];
}

describe('passar tempo com todos os amigos', () => {
  it('atividades certas por idade', () => {
    expect(groupActivities(aged(8), C).map((a) => a.id)).toEqual(['t_kid']);
    expect(groupActivities(aged(15), C).map((a) => a.id).sort()).toEqual(['t_teen', 't_treino']);
    expect(groupActivities(aged(30), C).map((a) => a.id).sort()).toEqual(['t_bar', 't_treino']);
    const [s] = withFriends(15, 3);
    expect(groupBlockReason(s, 't_bar', C)).toBe('too-young');
    expect(groupBlockReason(s, 't_kid', C)).toBe('age');
    expect(groupBlockReason(s, 'nope', C)).toBe('unknown');
    expect(hangOutAll(s, 't_bar', C)).toBe(s);
  });

  it('afeto sobe em todos os presentes e não nos ausentes; ausentes têm motivo', () => {
    const [s, people] = withFriends(25, 20, 'grp-a', true);
    const { present, absent } = groupAvailability(s, C);
    expect(present.length).toBeGreaterThan(5);
    expect(absent.some((x) => x.reason === 'brigado')).toBe(true);
    expect(absent.some((x) => x.reason === 'ocupado' || x.reason === 'viajando')).toBe(true);
    expect(present.length + absent.length).toBe(people.length);
    const r = hangOutAll(s, 't_bar', C);
    for (const p of present) expect(getRelation(r, p.id)!.affection).toBeGreaterThan(getRelation(s, p.id)!.affection);
    for (const { person } of absent) expect(getRelation(r, person.id)!.affection).toBe(getRelation(s, person.id)!.affection);
    expect(r.relationships.lastGroup).toEqual({ year: s.year, activityId: 't_bar', present: present.map((p) => p.id) });
    const log = r.log.at(-1)!.entries.join('\n');
    expect(log).toContain(`Barzinho com ${present.length} amigos.`);
    expect(log).toMatch(/Não foram: .*brigad. com você/);
  });

  it('disponibilidade é estável no ano (RNG derivado, sem mexer no rngState)', () => {
    const [s] = withFriends(25, 10, 'grp-b');
    const a = groupAvailability(s, C);
    const b = groupAvailability({ ...s, rngState: s.rngState + 123 }, C);
    expect(a.present.map((p) => p.id)).toEqual(b.present.map((p) => p.id));
  });

  it('custo no extrato (invariante), retorno decrescente e criança não paga', () => {
    const [s, people] = withFriends(25, 4, 'grp-c');
    const r1 = hangOutAll({ ...s, pendingEvents: [] }, 't_bar', content({ groupEventChance: 0 }));
    expect(r1.money).toBe(s.money - 150);
    expect(ledgerOk(r1)).toBe(true);
    expect(r1.economy.ledger.entries.at(-1)).toMatchObject({ cat: 'familia', amount: -150 });
    expect(r1.yearUses[GROUP_USE_KEY]).toBe(1);
    const r2 = hangOutAll(r1, 't_bar', content({ groupEventChance: 0 }));
    const present = groupAvailability(s, C).present[0]!;
    const g1 = getRelation(r1, present.id)!.affection - getRelation(s, present.id)!.affection;
    const g2 = getRelation(r2, present.id)!.affection - getRelation(r1, present.id)!.affection;
    expect(g2).toBeLessThan(g1);
    expect(people.length).toBe(4);

    const [kid] = withFriends(8, 4, 'grp-k');
    const rk = hangOutAll(kid, 't_kid', content({ groupEventChance: 0 }));
    expect(rk.money).toBe(kid.money);
    expect(rk.relationships.lastGroup?.activityId).toBe('t_kid');
  });

  it('sem dinheiro, sem amigos e ocupado bloqueiam', () => {
    const [s] = withFriends(25, 4, 'grp-d');
    expect(groupBlockReason(fixLedger({ ...s, money: 10 }), 't_bar', C)).toBe('no-money');
    expect(groupBlockReason(fixLedger({ ...aged(25, 'sozinho'), pendingEvents: [] }), 't_bar', C)).toBe('no-friends');
    expect(groupBlockReason({ ...s, pendingEvents: [{ eventId: 'x' }] }, 't_bar', C)).toBe('busy');
  });

  it('treinar juntos usa uma sessão e não passa sem sessão livre', () => {
    const [s] = withFriends(20, 4, 'grp-e');
    const before = sessionsLeft(s, C);
    const r = hangOutAll(s, 't_treino', content({ groupEventChance: 0 }));
    expect(sessionsLeft(r, C)).toBe(before - 1);
    expect(r.character.stats.athletic).toBeGreaterThanOrEqual(s.character.stats.athletic);
    const full = { ...s, fighter: { ...s.fighter, sessionsThisYear: 99 } };
    expect(groupBlockReason(full, 't_treino', C)).toBe('no-sessions');
  });

  it('evento de grupo com duas pessoas presentes diferentes (e só eventos com condições atendidas)', () => {
    let hits = 0;
    for (let i = 0; i < 10; i++) {
      const [s] = withFriends(25, 6, `grp-ev-${i}`);
      const r = hangOutAll(s, 't_bar', C);
      const p = r.pendingEvents[0];
      if (!p) continue;
      hits++;
      expect(p.eventId).toBe('grp_test_ok');
      expect(p.source).toBe('followUp');
      const ids = r.relationships.lastGroup!.present;
      expect(p.vars!.pessoa_id).not.toBe(p.vars!.pessoa2_id);
      expect(ids).toContain(p.vars!.pessoa_id);
      expect(ids).toContain(p.vars!.pessoa2_id);
      expect(p.vars!.pessoa_nome).toBe(getPerson(r, p.vars!.pessoa_id)!.name);
      expect(p.vars!.pessoa2_nome).toBe(getPerson(r, p.vars!.pessoa2_id)!.name);
      expect(p.vars!.pessoa).toBeTruthy();
      expect(p.vars!.pessoa2).toBeTruthy();
      expect(p.vars!.relacao).toBeTruthy();
      expect(r.rngState).not.toBe(s.rngState);
    }
    expect(hits).toBeGreaterThan(5);
  });

  it('determinístico pela seed', () => {
    const [a] = withFriends(25, 8, 'grp-det');
    const [b] = withFriends(25, 8, 'grp-det');
    expect(JSON.stringify(hangOutAll(a, 't_bar', C))).toBe(JSON.stringify(hangOutAll(b, 't_bar', C)));
  });
});

describe('efeitos sociais de grupo', () => {
  const rng = () => createRng(1);

  it('groupAffection soma no afeto de todos os presentes da última saída', () => {
    const [s] = withFriends(25, 6, 'grp-ga');
    const r = hangOutAll(s, 't_bar', content({ groupEventChance: 0 }));
    const ids = r.relationships.lastGroup!.present;
    const r2 = applySocialEffects(r, { groupAffection: 5 }, rng(), C);
    for (const id of ids) expect(getRelation(r2, id)!.affection).toBe(Math.min(100, getRelation(r, id)!.affection + 5));
  });

  it('pairFriends marca amizade ou rivalidade nas duas pessoas', () => {
    let [s, a] = withPerson(aged(25), 'amigo', 25);
    let b: Person;
    [s, b] = withPerson(s, 'amigo', 26);
    const vars = { pessoa_id: a.id, pessoa2_id: b.id };
    const f = applySocialEffects(s, { pairFriends: 'amizade' }, rng(), C, vars);
    expect(getPerson(f, a.id)!.flags[`amigo_de_${b.id}`]).toBe(true);
    expect(getPerson(f, b.id)!.flags[`amigo_de_${a.id}`]).toBe(true);
    expect(getRelation(f, a.id)!.history.at(-1)).toContain('Ficou amig');
    const r = applySocialEffects(s, { pairFriends: 'rivalidade' }, rng(), C, vars);
    expect(getPerson(r, a.id)!.flags[`rival_de_${b.id}`]).toBe(true);
    expect(getPerson(r, b.id)!.flags[`rival_de_${a.id}`]).toBe(true);
  });

  it('npcCouple respeita a faixa de idade (nunca menor × adulto)', () => {
    let [s, a] = withPerson(aged(25), 'amigo', 25);
    let b: Person, teen: Person, teen2: Person, teen3: Person;
    [s, b] = withPerson(s, 'amigo', 30);
    [s, teen] = withPerson(s, 'amigo', 16);
    [s, teen2] = withPerson(s, 'amigo', 17);
    [s, teen3] = withPerson(s, 'amigo', 14);
    const ok = applySocialEffects(s, { npcCouple: true }, rng(), C, { pessoa_id: a.id, pessoa2_id: b.id });
    expect(getPerson(ok, a.id)!.flags.casal_com).toBe(b.id);
    expect(getPerson(ok, b.id)!.flags.casal_com).toBe(a.id);
    const no = applySocialEffects(s, { npcCouple: true }, rng(), C, { pessoa_id: a.id, pessoa2_id: teen.id });
    expect(getPerson(no, a.id)!.flags.casal_com).toBeUndefined();
    expect(getPerson(no, teen.id)!.flags.casal_com).toBeUndefined();
    const teens = applySocialEffects(s, { npcCouple: true }, rng(), C, { pessoa_id: teen.id, pessoa2_id: teen2.id });
    expect(getPerson(teens, teen.id)!.flags.casal_com).toBe(teen2.id);
    const gap = applySocialEffects(s, { npcCouple: true }, rng(), C, { pessoa_id: teen3.id, pessoa2_id: teen2.id });
    expect(getPerson(gap, teen3.id)!.flags.casal_com).toBeUndefined();
  });
});

describe('guardas dos eventos de grupo (revisão)', () => {
  const COUPLE: GameEvent = { ...EV_OK, id: 'grp_test_couple', choices: [{ id: 'a', label: 'Torcer', resultText: '{pessoa} e {pessoa2} estão namorando.', effects: { social: { npcCouple: true } } }, { id: 'b', label: 'Nada', resultText: 'Ok.' }] };
  const ADULT: GameEvent = { ...EV_OK, id: 'grp_test_adult', tags: ['adult'], conditions: { minAge: 18 } };
  const CC: GameContent = { ...GAME_CONTENT, events: [...GAME_CONTENT.events, COUPLE, ADULT], friends: { activities: ACTS, groupEvents: ['grp_test_couple', 'grp_test_adult'], groupEventChance: 1 } };

  /** Personagem de 25 com um amigo de 16 e um de 30. */
  function mixed(adultContent: boolean, seed: string): GameState {
    let s = fixLedger({ ...aged(25, seed), pendingEvents: [], money: 5000 });
    s = fixLedger(s);
    [s] = withPerson(s, 'amigo', 16, { affection: 60 });
    [s] = withPerson(s, 'amigo', 30, { affection: 60 });
    return { ...s, relationships: { ...s.relationships, settings: { ...s.relationships.settings, adultContent } } };
  }

  it('casal NPC nunca é sorteado para menor + adulto; evento adult nunca com menor no par', () => {
    for (let i = 0; i < 200; i++) {
      const s = hangOutAll({ ...mixed(true, `m${i}`), rngState: i + 1 }, 't_bar', CC);
      const pend = s.pendingEvents.find((p) => p.eventId === 'grp_test_couple' || p.eventId === 'grp_test_adult');
      if (!pend) continue;
      const a = getPerson(s, pend.vars!.pessoa_id)!;
      const b = getPerson(s, pend.vars!.pessoa2_id)!;
      // só há um menor no grupo: qualquer par dos dois eventos o inclui → nenhum dos dois pode sair
      expect([a.age, b.age].some((x) => x < 18)).toBe(false);
    }
  });

  it('evento adult de grupo nunca entra na fila com "Conteúdo adulto" desligado', () => {
    const C2: GameContent = { ...CC, friends: { ...CC.friends, groupEvents: ['grp_test_adult'] } };
    for (let i = 0; i < 100; i++) {
      let s = fixLedger({ ...aged(25, `off${i}`), pendingEvents: [], money: 5000 });
      [s] = withPerson(s, 'amigo', 26, { affection: 60 });
      [s] = withPerson(s, 'amigo', 27, { affection: 60 });
      s = { ...s, relationships: { ...s.relationships, settings: { ...s.relationships.settings, adultContent: false } } };
      const r = hangOutAll({ ...s, rngState: i + 1 }, 't_bar', C2);
      expect(r.pendingEvents.some((p) => p.eventId === 'grp_test_adult')).toBe(false);
    }
  });
});
