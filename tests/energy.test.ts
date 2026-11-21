import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { actionBlockReason, maxEnergy, performAction } from '../src/engine';
import { makeGame, withAge } from './helpers';

const train = GAME_CONTENT.actions.find((a) => a.id === 'train')!;

describe('energia máxima', () => {
  it('varia com a idade', () => {
    expect(maxEnergy(0, 70)).toBe(0);
    expect(maxEnergy(2, 70)).toBe(0);
    expect(maxEnergy(4, 70)).toBe(3);
    expect(maxEnergy(8, 70)).toBe(5);
    expect(maxEnergy(15, 70)).toBe(6);
    expect(maxEnergy(25, 70)).toBe(7);
    expect(maxEnergy(70, 70)).toBe(4);
  });

  it('varia com a saúde', () => {
    expect(maxEnergy(25, 90)).toBe(8);
    expect(maxEnergy(25, 40)).toBe(6);
    expect(maxEnergy(25, 10)).toBe(5);
    expect(maxEnergy(4, 10)).toBe(1);
  });
});

describe('gasto de energia', () => {
  const kid = () => {
    const g = withAge(makeGame(), 8);
    return { ...g, energy: { current: 5, max: 5 } };
  };

  it('ação gasta energia e aplica efeitos', () => {
    const g = kid();
    const after = performAction(g, 'train', GAME_CONTENT);
    expect(after.energy.current).toBe(5 - train.energyCost);
    expect(after.character.stats.fitness).toBeGreaterThan(g.character.stats.fitness);
    expect(after.log.at(-1)!.entries).toHaveLength(1);
    expect(after.log.at(-1)!.age).toBe(8);
  });

  it('não permite ação sem energia suficiente', () => {
    const g = { ...kid(), energy: { current: 1, max: 5 } };
    expect(actionBlockReason(g, train)).toBe('no-energy');
    expect(performAction(g, 'train', GAME_CONTENT)).toBe(g);
  });

  it('não permite ação abaixo da idade mínima', () => {
    const g = { ...withAge(makeGame(), 1), energy: { current: 5, max: 5 } };
    expect(actionBlockReason(g, train)).toBe('too-young');
    expect(performAction(g, 'train', GAME_CONTENT)).toBe(g);
  });

  it('ignora ações desconhecidas', () => {
    const g = kid();
    expect(performAction(g, 'voar', GAME_CONTENT)).toBe(g);
  });

  it('gasta até zerar e depois bloqueia', () => {
    let g = kid();
    g = performAction(g, 'socialize', GAME_CONTENT);
    g = performAction(g, 'train', GAME_CONTENT);
    g = performAction(g, 'study', GAME_CONTENT);
    expect(g.energy.current).toBe(0);
    expect(performAction(g, 'socialize', GAME_CONTENT)).toBe(g);
  });
});
