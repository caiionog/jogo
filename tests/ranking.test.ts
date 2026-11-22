import { describe, expect, it } from 'vitest';
import { applyRankingResult, rankOf, removeFromRanking } from '../src/engine';
import { roster } from './fightHelpers';

const R = () => roster(['a', 'b', 'c', 'd', 'e'], 'champ', ['x', 'y']);

describe('ranking', () => {
  it('vitória sobre alguém melhor ranqueado sobe: o vencedor assume a posição, o perdedor cai 2', () => {
    const r = applyRankingResult(R(), 'd', 'b', false, 5);
    expect(r.ranking).toEqual(['a', 'd', 'c', 'b', 'e']);
    expect(rankOf(r, 'd')).toBe(2);
    expect(rankOf(r, 'b')).toBe(4);
  });

  it('vencedor melhor ranqueado sobe 1 e o perdedor desce', () => {
    const r = applyRankingResult(R(), 'c', 'e', false, 5);
    expect(rankOf(r, 'c')).toBe(2);
    expect(rankOf(r, 'e')).toBe(5);
    const r2 = applyRankingResult(R(), 'b', 'c', false, 5);
    expect(rankOf(r2, 'b')).toBe(1);
    expect(rankOf(r2, 'c')!).toBeGreaterThan(3);
  });

  it('não ranqueado que vence um ranqueado entra na posição dele', () => {
    const r = applyRankingResult(R(), 'x', 'c', false, 5);
    expect(rankOf(r, 'x')).toBe(3);
    expect(rankOf(r, 'c')).toBe(5);
    expect(r.ranking).toHaveLength(5);
    expect(rankOf(r, 'e')).toBeNull(); // empurrado para fora
  });

  it('dois sem ranking: o vencedor entra no fim do ranking', () => {
    const r = applyRankingResult(R(), 'x', 'y', false, 5);
    expect(rankOf(r, 'x')).toBe(5);
    expect(rankOf(r, 'y')).toBeNull();
  });

  it('campeão perde o cinturão ao perder a disputa e vai para o #1', () => {
    const r = applyRankingResult(R(), 'b', 'champ', true, 5);
    expect(r.champion).toBe('b');
    expect(rankOf(r, 'champ')).toBe(1);
    expect(r.ranking).not.toContain('b');
  });

  it('campeão que vence a disputa mantém o cinturão e o desafiante cai', () => {
    const r = applyRankingResult(R(), 'champ', 'a', true, 5);
    expect(r.champion).toBe('champ');
    expect(rankOf(r, 'a')).toBe(3);
  });

  it('luta sem disputa não mexe no cinturão', () => {
    const before = R();
    expect(applyRankingResult(before, 'a', 'champ', false, 5)).toBe(before);
  });

  it('removeFromRanking: cinturão vago passa ao #1', () => {
    const r = removeFromRanking(R(), 'champ');
    expect(r.champion).toBe('a');
    expect(r.ranking[0]).toBe('b');
  });
});
