import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { advanceYear, bjjRank, gradeOf, gradeReady, gradeText, kidsToAdult, playerOutfit, promoteGrade, resolveEvent, trainFighter, validateContent } from '../src/engine';
import type { GameState, GradeState, ModalityId } from '../src/engine';
import { fighterGame } from './fightHelpers';

const adultBjj = (rank: number, years: number): GradeState => ({ system: 'bjj_adulto', rank, degree: 0, years });
const withGrade = (age: number, id: ModalityId, g: GradeState, skills: { grappling?: number; trocacao?: number }, gymId = 'gen_bairro'): GameState =>
  fighterGame(age, skills, { grades: { [id]: g }, gymId });
const sys = (id: string) => C.fighting.graduations.find((g) => g.id === id)!;

describe('graduações em dados', () => {
  it('o conteúdo é válido e tem os sistemas pedidos', () => {
    expect(validateContent(C)).toEqual([]);
    expect(sys('bjj_infantil').levels.map((l) => l.id)).toEqual([
      'branca', 'cinza_branca', 'cinza', 'cinza_preta', 'amarela_branca', 'amarela', 'amarela_preta',
      'laranja_branca', 'laranja', 'laranja_preta', 'verde_branca', 'verde', 'verde_preta',
    ]);
    expect(sys('bjj_adulto').levels.map((l) => l.id)).toEqual(['branca', 'azul', 'roxa', 'marrom', 'preta']);
    expect(sys('judo').levels.map((l) => l.id)).toEqual(['branca', 'cinza', 'azul', 'amarela', 'laranja', 'verde', 'roxa', 'marrom', 'preta']);
    expect(sys('muaythai_fsbmt').kind).toBe('prajied');
    expect(sys('muaythai_fsbmt').federation).toMatch(/fictícia/);
    // boxe, wrestling e kickboxing sem graduação
    for (const id of ['boxe', 'wrestling', 'kickboxing']) expect(C.fighting.modalities.find((m) => m.id === id)!.graduation).toBeUndefined();
  });
});

describe('faixas de jiu-jitsu adulto (tempo, idade e habilidade)', () => {
  it('respeita o tempo mínimo na faixa', () => {
    expect(gradeReady(withGrade(17, 'jiujitsu', adultBjj(0, 1), { grappling: 60 }), 'jiujitsu', C)).toBe(false); // 1 ano < 2
    expect(gradeReady(withGrade(17, 'jiujitsu', adultBjj(0, 2), { grappling: 60 }), 'jiujitsu', C)).toBe(true);
    expect(gradeReady(withGrade(20, 'jiujitsu', adultBjj(3, 0), { grappling: 95 }), 'jiujitsu', C)).toBe(false); // marrom → preta: 1 ano
    expect(gradeReady(withGrade(20, 'jiujitsu', adultBjj(3, 1), { grappling: 95 }), 'jiujitsu', C)).toBe(true);
  });

  it('respeita idade mínima e habilidade', () => {
    expect(gradeReady(withGrade(17, 'jiujitsu', adultBjj(2, 3), { grappling: 60 }), 'jiujitsu', C)).toBe(false); // marrom: 18 anos e 65
    expect(gradeReady(withGrade(18, 'jiujitsu', adultBjj(2, 3), { grappling: 60 }), 'jiujitsu', C)).toBe(false);
    expect(gradeReady(withGrade(18, 'jiujitsu', adultBjj(2, 3), { grappling: 65 }), 'jiujitsu', C)).toBe(true);
    expect(gradeReady(withGrade(30, 'jiujitsu', adultBjj(4, 10), { grappling: 100 }), 'jiujitsu', C)).toBe(false); // já é preta
  });

  it('promoteGrade sobe uma faixa, zera o tempo e só promove se pronto', () => {
    const g = promoteGrade(withGrade(17, 'jiujitsu', adultBjj(0, 2), { grappling: 40 }), 'jiujitsu', C);
    expect(gradeOf(g, 'jiujitsu')).toEqual(adultBjj(1, 0));
    expect(bjjRank(g)).toBe(1);
    expect(g.log.at(-1)!.entries.at(-1)).toMatch(/faixa azul de jiu-jitsu/);
    const not = withGrade(17, 'jiujitsu', adultBjj(1, 0), { grappling: 40 });
    expect(promoteGrade(not, 'jiujitsu', C)).toBe(not);
  });

  it('cada ano treinado dá um grau (até 4) e conta para a faixa; sem treinar, nada corre', () => {
    const base = { ...withGrade(20, 'jiujitsu', adultBjj(1, 0), { grappling: 40 }), money: 1_000_000 }; // paga a mensalidade
    const idle = advanceYear(base, { ...C, events: [] });
    expect(gradeOf(idle, 'jiujitsu')).toMatchObject({ years: 0, degree: 0 });
    let g = base;
    for (let y = 0; y < 5; y++) g = advanceYear(trainFighter(g, 'jiujitsu', C), { ...C, events: [] });
    expect(gradeOf(g, 'jiujitsu')).toMatchObject({ rank: 1, years: 5, degree: 4 });
    expect(gradeText(C, gradeOf(g, 'jiujitsu'))).toBe('faixa azul (4 graus)');
  });

  it('treinar judô ou wrestling não conta tempo de faixa de jiu-jitsu', () => {
    const base = withGrade(20, 'jiujitsu', adultBjj(1, 0), { grappling: 40 }, 'bh_galo_wrestling');
    const g = advanceYear(trainFighter(trainFighter(base, 'judo', C), 'wrestling', C), { ...C, events: [] });
    expect(gradeOf(g, 'jiujitsu')!.years).toBe(0);
    expect(gradeOf(g, 'judo')).toMatchObject({ system: 'judo', rank: 0, years: 1 });
    expect(gradeOf(g, 'wrestling')).toBeUndefined(); // wrestling não tem graduação
  });

  it('o evento automático de exame de faixa aparece quando pronto e gradua', () => {
    let g = trainFighter(withGrade(16, 'jiujitsu', adultBjj(0, 1), { grappling: 50 }), 'jiujitsu', C);
    g = advanceYear(g, C);
    expect(g.pendingEvents.map((p) => p.eventId)).toContain('fight_belt_exam');
    g = resolveEvent(g, 'fight_belt_exam', 'exam', C);
    expect(bjjRank(g)).toBe(1);
  });
});

describe('jiu-jitsu infantil e a transição aos 16', () => {
  it('criança começa no sistema infantil e sobe com tempo, idade e nível', () => {
    let g = fighterGame(7, { grappling: 5 }, { gymId: 'gen_jj_kids' });
    g = trainFighter(g, 'jiujitsu', C);
    expect(gradeOf(g, 'jiujitsu')).toMatchObject({ system: 'bjj_infantil', rank: 0 });
    g = advanceYear(g, { ...C, events: [] });
    g = { ...g, fighter: { ...g.fighter, skills: { ...g.fighter.skills, grappling: 6 } } };
    expect(gradeReady(g, 'jiujitsu', C)).toBe(true); // branca → cinza e branca
    g = promoteGrade(g, 'jiujitsu', C);
    expect(gradeText(C, gradeOf(g, 'jiujitsu'))).toBe('faixa cinza e branca');
  });

  it('aos 16: laranja ou mais e nível de azul → azul; senão, branca adulta', () => {
    const laranja = sys('bjj_infantil').levels.findIndex((l) => l.id === 'laranja');
    const strong = withGrade(15, 'jiujitsu', { system: 'bjj_infantil', rank: laranja, degree: 0, years: 1 }, { grappling: 40 });
    const s1 = kidsToAdult(strong, C);
    expect(gradeOf(s1, 'jiujitsu')).toMatchObject({ system: 'bjj_adulto', rank: 1 });
    const weak = withGrade(15, 'jiujitsu', { system: 'bjj_infantil', rank: laranja, degree: 0, years: 1 }, { grappling: 20 });
    expect(gradeOf(kidsToAdult(weak, C), 'jiujitsu')).toMatchObject({ system: 'bjj_adulto', rank: 0 });
    const low = withGrade(15, 'jiujitsu', { system: 'bjj_infantil', rank: 2, degree: 0, years: 1 }, { grappling: 60 });
    expect(gradeOf(kidsToAdult(low, C), 'jiujitsu')).toMatchObject({ system: 'bjj_adulto', rank: 0 });
    // antes dos 16 nada muda
    const kid = withGrade(13, 'jiujitsu', { system: 'bjj_infantil', rank: 3, degree: 0, years: 1 }, { grappling: 40 });
    expect(kidsToAdult(kid, C)).toBe(kid);
  });

  it('a virada do ano dos 15 para os 16 faz a transição sozinha', () => {
    const verde = sys('bjj_infantil').levels.findIndex((l) => l.id === 'verde');
    const g = advanceYear(withGrade(15, 'jiujitsu', { system: 'bjj_infantil', rank: verde, degree: 0, years: 2 }, { grappling: 45 }), { ...C, events: [] });
    expect(g.character.age).toBe(16);
    expect(gradeOf(g, 'jiujitsu')).toMatchObject({ system: 'bjj_adulto', rank: 1 });
    expect(g.log.flatMap((y) => y.entries).join('\n')).toMatch(/jiu-jitsu adulto já de faixa azul/);
  });

  it('a faixa infantil de duas cores aparece no kimono (listra)', () => {
    const g = withGrade(10, 'jiujitsu', { system: 'bjj_infantil', rank: 6, degree: 0, years: 1 }, { grappling: 30 }, 'gen_jj_kids');
    const o = playerOutfit(g, C, 'treino');
    expect(o.inteira?.id).toBe('kimono');
    expect(o.acessorio).toMatchObject({ id: 'faixa', color: sys('bjj_infantil').levels[6]!.color, accent: sys('bjj_infantil').levels[6]!.stripe });
  });
});

describe('judô e muay thai', () => {
  it('judô: faixa preta exige 17 anos e 2 anos na marrom', () => {
    const marrom = sys('judo').levels.findIndex((l) => l.id === 'marrom');
    expect(gradeReady(withGrade(16, 'judo', { system: 'judo', rank: marrom, degree: 0, years: 3 }, { grappling: 90 }), 'judo', C)).toBe(false);
    expect(gradeReady(withGrade(17, 'judo', { system: 'judo', rank: marrom, degree: 0, years: 1 }, { grappling: 90 }), 'judo', C)).toBe(false);
    expect(gradeReady(withGrade(17, 'judo', { system: 'judo', rank: marrom, degree: 0, years: 2 }, { grappling: 90 }), 'judo', C)).toBe(true);
  });

  it('muay thai: o prajied sobe pela trocação e aparece no braço no treino', () => {
    let g = fighterGame(12, { trocacao: 30 }, { gymId: 'gen_muay_thai' });
    g = advanceYear(trainFighter(g, 'muaythai', C), { ...C, events: [] });
    expect(gradeOf(g, 'muaythai')).toMatchObject({ system: 'muaythai_fsbmt', rank: 0, years: 1 });
    expect(gradeReady(g, 'muaythai', C)).toBe(true);
    g = resolveEvent({ ...g, pendingEvents: [{ eventId: 'fight_muaythai_exam' }] }, 'fight_muaythai_exam', 'exam', C);
    expect(gradeText(C, gradeOf(g, 'muaythai'))).toBe('prajied vermelho');
    const o = playerOutfit(g, C, 'treino');
    expect(o.acessorio).toMatchObject({ id: 'prajied', color: sys('muaythai_fsbmt').levels[1]!.color });
    expect(o.baixo?.id).toBe('shorts_luta');
  });
});
