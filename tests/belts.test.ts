import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { BELT_REQUIREMENTS, advanceYear, beltPromotionReady, promoteBelt, resolveEvent, trainFighter } from '../src/engine';
import { fighterGame } from './fightHelpers';

const withBelt = (age: number, rank: number, years: number, grappling: number) =>
  fighterGame(age, { grappling }, { belt: { rank, years } });

describe('faixas de jiu-jitsu', () => {
  it('respeita o tempo mínimo na faixa', () => {
    expect(beltPromotionReady(withBelt(17, 0, 1, 60))).toBe(false); // 1 ano < 2
    expect(beltPromotionReady(withBelt(17, 0, 2, 60))).toBe(true);
    expect(beltPromotionReady(withBelt(20, 3, 0, 95))).toBe(false); // marrom → preta exige 1 ano
    expect(beltPromotionReady(withBelt(20, 3, 1, 95))).toBe(true);
  });

  it('respeita idade mínima e habilidade', () => {
    expect(beltPromotionReady(withBelt(15, 0, 5, 90))).toBe(false); // azul só aos 16
    expect(beltPromotionReady(withBelt(17, 2, 3, 60))).toBe(false); // marrom só aos 18 e com grappling 65
    expect(beltPromotionReady(withBelt(18, 2, 3, 60))).toBe(false);
    expect(beltPromotionReady(withBelt(18, 2, 3, 65))).toBe(true);
    expect(beltPromotionReady(withBelt(30, 4, 10, 100))).toBe(false); // já é faixa preta
  });

  it('promoteBelt sobe uma faixa, zera o tempo e só promove se pronto', () => {
    const g = promoteBelt(withBelt(17, 0, 2, 40));
    expect(g.fighter.belt).toEqual({ rank: 1, years: 0 });
    expect(g.log.at(-1)!.entries.at(-1)).toMatch(/faixa azul/);
    const not = withBelt(17, 1, 0, 40);
    expect(promoteBelt(not)).toBe(not);
    expect(BELT_REQUIREMENTS).toHaveLength(5);
  });

  it('o ano só conta se treinou jiu-jitsu (ação ou academia de grappling)', () => {
    const base = fighterGame(16, { grappling: 40 }, { belt: { rank: 0, years: 0 }, gymId: 'gen_boxe' });
    const idle = advanceYear(base, GAME_CONTENT);
    expect(idle.fighter.belt.years).toBe(0);
    const trained = trainFighter(base, 'bjj', undefined, GAME_CONTENT);
    expect(trained.fighter.trainedBjjThisYear).toBe(true);
    const next = advanceYear(trained, GAME_CONTENT);
    expect(next.fighter.belt.years).toBe(1);
    const gymBjj = advanceYear({ ...base, fighter: { ...base.fighter, gymId: 'sp_tatame_paulista' } }, GAME_CONTENT);
    expect(gymBjj.fighter.belt.years).toBe(1);
  });

  it('o evento automático de exame de faixa aparece quando pronto e gradua', () => {
    // pronto no ano que vem: 17 anos, 1 ano de faixa + o ano atual treinando
    let g = trainFighter(fighterGame(16, { grappling: 50 }, { belt: { rank: 0, years: 1 } }), 'bjj', undefined, GAME_CONTENT);
    g = advanceYear(g, GAME_CONTENT);
    expect(g.pendingEvents.map((p) => p.eventId)).toContain('fight_belt_exam');
    g = resolveEvent(g, 'fight_belt_exam', 'exam', GAME_CONTENT);
    expect(g.fighter.belt.rank).toBe(1);
  });
});
