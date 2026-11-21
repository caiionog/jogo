import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { GameState } from '../src/engine';
import {
  advanceYear,
  createRng,
  endSchoolYear,
  gradeForAge,
  gradeLabel,
  privateSchoolChance,
  stageOfGrade,
  startSchoolYear,
} from '../src/engine';
import { NO_EVENTS, enrolledGame, makeGame, playYears } from './helpers';

describe('fases e séries', () => {
  it('mapeia série → fase e rótulo', () => {
    expect([0, 2, 3, 7, 8, 11, 12, 14].map(stageOfGrade)).toEqual(['pre', 'pre', 'fund1', 'fund1', 'fund2', 'fund2', 'medio', 'medio']);
    expect(gradeLabel(0)).toBe('Pré I');
    expect(gradeLabel(3)).toBe('1º ano');
    expect(gradeLabel(9)).toBe('7º ano');
    expect(gradeLabel(13)).toBe('2º ano do Ensino Médio');
  });

  it('série esperada por idade: Pré-escola 3–5, Fund. I 6–10, Fund. II 11–14, EM 15–17', () => {
    expect(stageOfGrade(gradeForAge(3))).toBe('pre');
    expect(stageOfGrade(gradeForAge(5))).toBe('pre');
    expect(stageOfGrade(gradeForAge(6))).toBe('fund1');
    expect(stageOfGrade(gradeForAge(10))).toBe('fund1');
    expect(stageOfGrade(gradeForAge(11))).toBe('fund2');
    expect(stageOfGrade(gradeForAge(14))).toBe('fund2');
    expect(stageOfGrade(gradeForAge(15))).toBe('medio');
    expect(stageOfGrade(gradeForAge(17))).toBe('medio');
  });
});

describe('matrícula e progressão', () => {
  it('não matricula antes dos 3 anos e matricula automaticamente aos 3 no Pré I', () => {
    let g = playYears(makeGame('mat'), 2, NO_EVENTS);
    expect(g.education.current).toBeNull();
    g = playYears(g, 1, NO_EVENTS);
    expect(g.character.age).toBe(3);
    expect(g.education.current?.grade).toBe(0);
    expect(g.education.current?.school.name).toMatch(/\S+ \S+/);
    expect(g.log.at(-1)!.entries.join(' ')).toMatch(/matriculad[oa] no Pré I/);
  });

  it('um aluno estudioso avança uma série por ano e se forma aos 17–18', () => {
    // inteligência alta e sem faltas: aprova todo ano
    let g = makeGame('progride');
    g = { ...g, character: { ...g.character, stats: { ...g.character.stats, intelligence: 95 } } };
    for (let age = 1; age <= 17; age++) {
      g = playYears(g, 1, NO_EVENTS);
      if (age >= 3) expect(g.education.current?.grade).toBe(gradeForAge(age));
    }
    g = playYears(g, 1, NO_EVENTS); // fim do 3º EM
    expect(g.character.age).toBe(18);
    expect(g.education.graduated).toBe(true);
    expect(g.education.current).toBeNull();
    expect(g.flags.formado).toBe(true);
    expect(g.education.lastResult?.graduated).toBe(true);
    const log = g.log.flatMap((y) => y.entries).join('\n');
    expect(log).toMatch(/passou para o 7º ano com média \d+/);
    expect(log).toMatch(/se formou/);
  });

  it('não volta a matricular quem já se formou', () => {
    let g = makeGame('formado');
    g = { ...g, character: { ...g.character, stats: { ...g.character.stats, intelligence: 95 } } };
    g = playYears(g, 20, NO_EVENTS);
    expect(g.education.graduated).toBe(true);
    expect(g.education.current).toBeNull();
  });

  it('escola particular é mais provável com família rica', () => {
    expect(privateSchoolChance(100)).toBeGreaterThan(privateSchoolChance(0));
    const count = (wealth: number) => {
      let n = 0;
      for (let i = 0; i < 300; i++) {
        let g = { ...makeGame(`w${i}`), character: { ...makeGame(`w${i}`).character, age: 3, familyWealth: wealth } };
        g = startSchoolYear(g, createRng(i), GAME_CONTENT);
        if (g.education.current?.school.type === 'particular') n++;
      }
      return n;
    };
    expect(count(95)).toBeGreaterThan(count(5) * 3);
  });
});

describe('fim do ano letivo', () => {
  const end = (g: GameState, seed = 3) => endSchoolYear(g, createRng(seed), GAME_CONTENT);

  it('aprova com nota boa e reprova com nota baixa', () => {
    const good = end(enrolledGame(10, { average: 90 }));
    expect(good.education.lastResult?.passed).toBe(true);
    expect(good.education.current?.grade).toBe(8);
    const bad = end({ ...enrolledGame(10, { average: 10 }), character: { ...enrolledGame(10).character, stats: { ...enrolledGame(10).character.stats, intelligence: 10 } } });
    expect(bad.education.lastResult?.passed).toBe(false);
    expect(bad.education.current?.grade).toBe(7);
    expect(bad.education.repeats).toBe(1);
    expect(bad.flags.repetente).toBe(true);
    expect(bad.log.at(-1)!.entries.at(-1)).toMatch(/reprovou no 5º ano/);
  });

  it('faltas acima do limite reprovam mesmo com nota alta', () => {
    const g = end(enrolledGame(12, { average: 100, absences: 30 }));
    expect(g.education.lastResult?.passed).toBe(false);
    expect(g.log.at(-1)!.entries.at(-1)).toMatch(/30 faltas/);
  });

  it('é determinístico com o mesmo seed e varia entre seeds', () => {
    const g = enrolledGame(12, { average: 55 });
    expect(end(g, 42)).toEqual(end(g, 42));
    const finals = new Set(Array.from({ length: 30 }, (_, i) => end(g, i).education.lastResult!.final));
    expect(finals.size).toBeGreaterThan(5);
  });

  it('a mesma vida avançada duas vezes gera o mesmo histórico escolar', () => {
    expect(playYears(makeGame('det2'), 16).education).toEqual(playYears(makeGame('det2'), 16).education);
  });

  it('pré-escola sempre aprova', () => {
    const g = end(enrolledGame(4, { average: 0, absences: 50 }));
    expect(g.education.lastResult?.passed).toBe(true);
    expect(g.education.current?.grade).toBe(2);
  });

  it('honra com nota final alta', () => {
    const g = { ...enrolledGame(12, { average: 100 }) };
    const r = end({ ...g, character: { ...g.character, stats: { ...g.character.stats, intelligence: 100 } } });
    expect(r.education.lastResult?.honors).toBe(true);
  });

  it('expulsão por disciplina baixa transfere para outra escola pública', () => {
    const g = enrolledGame(12, { average: 80, discipline: 10 });
    const r = end(g);
    expect(r.education.lastResult?.expelled).toBe(true);
    expect(r.education.expulsions).toBe(1);
    expect(r.flags.expulso).toBe(true);
    expect(r.education.current?.school.type).toBe('publica');
    expect(r.education.current?.school.name).not.toBe(g.education.current!.school.name);
    expect(r.education.current?.discipline).toBe(55);
  });

  it('expulsão por 3 suspensões', () => {
    expect(end(enrolledGame(12, { average: 80, suspensions: 3 })).education.lastResult?.expelled).toBe(true);
  });

  it('clube aplica efeitos anuais', () => {
    const g = enrolledGame(12, { average: 80, club: 'judo' });
    const r = end(g);
    expect(r.character.stats.strength).toBe(g.character.stats.strength + 3);
  });

  it('novo ano zera faltas e sai da escola aos 20 sem diploma', () => {
    const g = startSchoolYear(enrolledGame(12, { absences: 9 }), createRng(1), GAME_CONTENT);
    expect(g.education.current?.absences).toBe(0);
    const old = startSchoolYear(enrolledGame(20, { grade: 13 }), createRng(1), GAME_CONTENT);
    expect(old.education.current).toBeNull();
    expect(old.flags.evadiu).toBe(true);
  });

  it('advanceYear registra o resultado do ano no log do ano que terminou', () => {
    const g = enrolledGame(9, { average: 95 });
    const next = advanceYear({ ...g, log: [{ age: 9, year: g.year, entries: [] }] }, NO_EVENTS);
    expect(next.log.find((y) => y.age === 9)!.entries.join(' ')).toMatch(/passou para o 5º ano/);
  });
});

describe('textos com nome da escola', () => {
  it('contrai a preposição conforme o gênero do nome', async () => {
    const { withPreposition } = await import('../src/engine');
    expect(withPreposition('Escola Municipal Ipê Amarelo', 'de')).toBe('da Escola Municipal Ipê Amarelo');
    expect(withPreposition('Colégio Estadual Sol Nascente', 'de')).toBe('do Colégio Estadual Sol Nascente');
    expect(withPreposition('Instituto Monte Verde', 'em')).toBe('no Instituto Monte Verde');
    expect(withPreposition('E.E. Rio Claro', 'para')).toBe('para a E.E. Rio Claro');
  });
});
