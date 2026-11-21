import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { actionBlockReason, clubBlockReason, isActionAvailable, joinClub, leaveClub, performAction } from '../src/engine';
import { enrolledGame, makeGame, withAge } from './helpers';

const action = (id: string) => GAME_CONTENT.actions.find((a) => a.id === id)!;
const club = (id: string) => GAME_CONTENT.clubs.find((c) => c.id === id)!;

describe('ações escolares', () => {
  it('bloqueiam quando não está matriculado (e somem da lista)', () => {
    const g = { ...withAge(makeGame(), 10), energy: { current: 6, max: 6 } };
    for (const id of ['study_exams', 'skip_class', 'make_friends']) {
      expect(actionBlockReason(g, action(id))).toBe('not-enrolled');
      expect(isActionAvailable(g, action(id))).toBe(false);
      expect(performAction(g, id, GAME_CONTENT)).toBe(g);
    }
    expect(isActionAvailable(g, action('train'))).toBe(true);
  });

  it('estudar para as provas: gasta energia e melhora nota e inteligência', () => {
    const g = enrolledGame(12, { average: 50 });
    const r = performAction(g, 'study_exams', GAME_CONTENT);
    expect(r.energy.current).toBe(g.energy.current - action('study_exams').energyCost);
    expect(r.education.current!.average).toBe(55);
    expect(r.character.stats.intelligence).toBeGreaterThan(g.character.stats.intelligence);
  });

  it('"Estudar" (Etapa 1) também melhora a nota, sem lógica duplicada', () => {
    const g = enrolledGame(12, { average: 50 });
    expect(performAction(g, 'study', GAME_CONTENT).education.current!.average).toBe(52);
    // fora da escola: só inteligência
    const out = { ...withAge(makeGame(), 10), energy: { current: 6, max: 6 } };
    const r = performAction(out, 'study', GAME_CONTENT);
    expect(r.education.current).toBeNull();
    expect(r.character.stats.intelligence).toBeGreaterThan(out.character.stats.intelligence);
  });

  it('matar aula: +felicidade, −nota, −disciplina, +faltas', () => {
    const g = enrolledGame(12, { average: 60, discipline: 70, absences: 0 });
    const r = performAction(g, 'skip_class', GAME_CONTENT);
    const e = r.education.current!;
    expect(e.average).toBe(57);
    expect(e.discipline).toBe(64);
    expect(e.absences).toBe(4);
    expect(r.character.stats.happiness).toBeGreaterThanOrEqual(Math.min(100, g.character.stats.happiness));
  });

  it('matar aula às vezes gera o evento de punição na hora', () => {
    let caught = 0;
    for (let i = 0; i < 60; i++) {
      const r = performAction(enrolledGame(12, {}, `skip${i}`), 'skip_class', GAME_CONTENT);
      if (r.pendingEvents.some((p) => p.eventId === 'school_skip_caught' && p.source === 'action' && p.vars)) caught++;
    }
    expect(caught).toBeGreaterThan(5);
    expect(caught).toBeLessThan(40);
  });

  it('fazer amizade aumenta a popularidade', () => {
    const g = enrolledGame(12, { popularity: 40 });
    expect(performAction(g, 'make_friends', GAME_CONTENT).education.current!.popularity).toBe(44);
  });

  it('matar aula exige ao menos o Fundamental (wrong-stage na pré-escola)', () => {
    expect(actionBlockReason(enrolledGame(8, { grade: 1 }), action('skip_class'))).toBe('wrong-stage');
  });
});

describe('clubes', () => {
  it('entrar no judô gasta energia e dá a flag interesse_luta', () => {
    const g = enrolledGame(9);
    const r = joinClub(g, 'judo', GAME_CONTENT);
    expect(r.education.current!.club).toBe('judo');
    expect(r.energy.current).toBe(g.energy.current - 1);
    expect(r.flags.interesse_luta).toBe(true);
  });

  it('clubes não de luta não dão interesse_luta', () => {
    expect(joinClub(enrolledGame(9), 'chess', GAME_CONTENT).flags.interesse_luta).toBeUndefined();
  });

  it('sair do clube', () => {
    const g = leaveClub(enrolledGame(9, { club: 'soccer' }), GAME_CONTENT);
    expect(g.education.current!.club).toBeNull();
    expect(g.log.at(-1)!.entries.at(-1)).toMatch(/saiu do clube de futebol/);
  });

  it('bloqueios: fora da escola, fase mínima, já membro, sem energia', () => {
    expect(clubBlockReason({ ...withAge(makeGame(), 9), energy: { current: 5, max: 5 } }, club('judo'))).toBe('not-enrolled');
    expect(clubBlockReason(enrolledGame(9), club('wrestling'))).toBe('too-young');
    expect(clubBlockReason(enrolledGame(12), club('wrestling'))).toBeNull();
    expect(clubBlockReason(enrolledGame(9, { club: 'judo' }), club('judo'))).toBe('already-member');
    const tired = { ...enrolledGame(9), energy: { current: 0, max: 5 } };
    expect(clubBlockReason(tired, club('judo'))).toBe('no-energy');
    expect(joinClub(tired, 'judo', GAME_CONTENT)).toBe(tired);
  });
});
