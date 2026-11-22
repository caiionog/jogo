import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { advanceYear, autoEvents, conditionsMet, createRng, eligibleEvents, isEligible, selectEvents } from '../src/engine';
import { enrolledGame, makeEvent, makeGame, withAge } from './helpers';

describe('condições de evento', () => {
  const g = withAge(makeGame(), 8);

  it('faixa de idade', () => {
    expect(isEligible(g, makeEvent('a', { conditions: { minAge: 6, maxAge: 10 } }))).toBe(true);
    expect(isEligible(g, makeEvent('b', { conditions: { minAge: 9 } }))).toBe(false);
    expect(isEligible(g, makeEvent('c', { conditions: { maxAge: 7 } }))).toBe(false);
  });

  it('atributos', () => {
    const s = { ...g, character: { ...g.character, stats: { ...g.character.stats, athletic: 50 } } };
    expect(isEligible(s, makeEvent('a', { conditions: { stats: { athletic: { min: 40 } } } }))).toBe(true);
    expect(isEligible(s, makeEvent('b', { conditions: { stats: { athletic: { max: 40 } } } }))).toBe(false);
  });

  it('flags', () => {
    const f = { ...g, flags: { gostaDeLuta: true } };
    expect(isEligible(f, makeEvent('a', { conditions: { flagsAll: ['gostaDeLuta'] } }))).toBe(true);
    expect(isEligible(g, makeEvent('a', { conditions: { flagsAll: ['gostaDeLuta'] } }))).toBe(false);
    expect(isEligible(f, makeEvent('b', { conditions: { flagsNone: ['gostaDeLuta'] } }))).toBe(false);
  });

  it('sexo', () => {
    expect(isEligible(g, makeEvent('a', { conditions: { sex: 'M' } }))).toBe(true);
    expect(isEligible(g, makeEvent('b', { conditions: { sex: 'F' } }))).toBe(false);
  });

  it('once bloqueia eventos já disparados; peso 0 nunca é elegível', () => {
    const fired = { ...g, firedEvents: ['a'] };
    expect(isEligible(fired, makeEvent('a', { once: true }))).toBe(false);
    expect(isEligible(fired, makeEvent('a'))).toBe(true);
    expect(isEligible(g, makeEvent('z', { weight: 0 }))).toBe(false);
  });
});

describe('selectEvents', () => {
  const g = withAge(makeGame(), 8);

  it('retorna vazio quando nada é elegível', () => {
    const events = [makeEvent('a', { conditions: { minAge: 50 } })];
    expect(selectEvents(g, events, 2, createRng(1))).toEqual([]);
  });

  it('não repete eventos e respeita a quantidade', () => {
    const events = [makeEvent('a'), makeEvent('b'), makeEvent('c')];
    const chosen = selectEvents(g, events, 2, createRng(5));
    expect(chosen).toHaveLength(2);
    expect(new Set(chosen.map((e) => e.id)).size).toBe(2);
    expect(selectEvents(g, events, 10, createRng(5))).toHaveLength(3);
  });

  it('só escolhe elegíveis', () => {
    const events = [makeEvent('ok'), makeEvent('velho', { conditions: { minAge: 60 } })];
    expect(eligibleEvents(g, events).map((e) => e.id)).toEqual(['ok']);
    for (let i = 0; i < 50; i++) expect(selectEvents(g, events, 1, createRng(i))[0]!.id).toBe('ok');
  });

  it('distribuição segue os pesos', () => {
    const events = [makeEvent('raro', { weight: 1 }), makeEvent('comum', { weight: 9 })];
    const rng = createRng(99);
    let comum = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) if (selectEvents(g, events, 1, rng)[0]!.id === 'comum') comum++;
    expect(comum / N).toBeGreaterThan(0.86);
    expect(comum / N).toBeLessThan(0.94);
  });

  it('é determinístico com a mesma seed', () => {
    const events = 'abcdefgh'.split('').map((id) => makeEvent(id));
    const ids = (seed: number) => selectEvents(g, events, 2, createRng(seed)).map((e) => e.id);
    expect(ids(1234)).toEqual(ids(1234));
  });
});

describe('condições escolares', () => {
  const school = enrolledGame(12, { average: 75, discipline: 30, popularity: 60, club: 'judo' });
  const out = withAge(makeGame(), 12);

  it('enrolled', () => {
    expect(isEligible(school, makeEvent('a', { conditions: { enrolled: true } }))).toBe(true);
    expect(isEligible(out, makeEvent('a', { conditions: { enrolled: true } }))).toBe(false);
    expect(isEligible(out, makeEvent('b', { conditions: { enrolled: false } }))).toBe(true);
    expect(isEligible(school, makeEvent('b', { conditions: { enrolled: false } }))).toBe(false);
  });

  it('fase escolar', () => {
    expect(isEligible(school, makeEvent('a', { conditions: { schoolStages: ['fund2'] } }))).toBe(true);
    expect(isEligible(school, makeEvent('b', { conditions: { schoolStages: ['pre', 'medio'] } }))).toBe(false);
    expect(isEligible(out, makeEvent('c', { conditions: { schoolStages: ['fund2'] } }))).toBe(false);
  });

  it('faixa de nota, disciplina e popularidade', () => {
    expect(isEligible(school, makeEvent('a', { conditions: { school: { average: { min: 70 } } } }))).toBe(true);
    expect(isEligible(school, makeEvent('b', { conditions: { school: { average: { min: 80 } } } }))).toBe(false);
    expect(isEligible(school, makeEvent('c', { conditions: { school: { discipline: { max: 40 } } } }))).toBe(true);
    expect(isEligible(school, makeEvent('d', { conditions: { school: { popularity: { max: 50 } } } }))).toBe(false);
  });

  it('clube', () => {
    expect(isEligible(school, makeEvent('a', { conditions: { club: ['judo', 'wrestling'] } }))).toBe(true);
    expect(isEligible(school, makeEvent('b', { conditions: { club: ['chess'] } }))).toBe(false);
    expect(isEligible(school, makeEvent('c', { conditions: { club: 'any' } }))).toBe(true);
    expect(isEligible(school, makeEvent('d', { conditions: { club: 'none' } }))).toBe(false);
    const noClub = enrolledGame(12);
    expect(isEligible(noClub, makeEvent('e', { conditions: { club: 'none' } }))).toBe(true);
    expect(isEligible(noClub, makeEvent('f', { conditions: { club: 'any' } }))).toBe(false);
  });

  it('resultado do ano letivo', () => {
    const failed = { ...school, education: { ...school.education, lastResult: { final: 30, passed: false, honors: false, graduated: false, expelled: true } } };
    expect(conditionsMet(failed, makeEvent('a', { conditions: { schoolResult: ['failed'] } }))).toBe(true);
    expect(conditionsMet(failed, makeEvent('b', { conditions: { schoolResult: ['expelled'] } }))).toBe(true);
    expect(conditionsMet(failed, makeEvent('c', { conditions: { schoolResult: ['honors', 'graduated'] } }))).toBe(false);
    expect(conditionsMet(school, makeEvent('d', { conditions: { schoolResult: ['passed'] } }))).toBe(false);
  });

  it("eventos 'auto' entram sempre que elegíveis e não são sorteados", () => {
    const auto = makeEvent('marco', { trigger: 'auto', conditions: { minAge: 13 } });
    expect(isEligible(school, auto)).toBe(false);
    const content = { ...GAME_CONTENT, events: [auto, makeEvent('x', { conditions: { minAge: 99 } })] };
    expect(autoEvents(withAge(school, 13), content.events).map((e) => e.id)).toEqual(['marco']);
    const next = advanceYear(school, content);
    expect(next.pendingEvents).toMatchObject([{ eventId: 'marco', source: 'auto' }]);
  });

  it('eventos antigos (sem campos novos) continuam funcionando', () => {
    const child = GAME_CONTENT.events.find((e) => e.id === 'child_flu')!;
    expect(isEligible(withAge(makeGame(), 5), child)).toBe(true);
  });
});
