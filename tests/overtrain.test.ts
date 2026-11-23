/** Treino invisível (release 0.0.2): acima do limite o treino não rende, avisa e, a partir da 2ª extra, pode lesionar. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { overtrainCause, overtrainExtras, overtrainInjuryChance, trainAtClub, joinSportsClub, trainFighter } from '../src/engine';
import type { GameState } from '../src/engine';
import { makeGame, withAge } from './helpers';

const adult = (seed: string | number = 'over'): GameState => ({ ...withAge(makeGame(seed), 20), money: 100000 });
const full = (s: GameState): GameState => ({ ...s, fighter: { ...s.fighter, sessionsThisYear: C.limits.trainingSessions } });
const withJob = (s: GameState, jobId: string): GameState => ({ ...s, economy: { ...s.economy, job: { jobId, level: 1, performance: 50, years: 0 } } });
const lastLine = (s: GameState) => s.log.at(-1)!.entries.at(-1)!;
const T = C.fighting.overtrain!;

describe('treino acima do limite', () => {
  it('ganho zero, sessão contada e aviso do limite', () => {
    const g = full(adult());
    const n = trainFighter(g, 'fisico', C);
    expect(n.character.stats.athletic).toBe(g.character.stats.athletic);
    expect(n.fighter.skills).toEqual(g.fighter.skills);
    expect(n.fighter.sessionsThisYear).toBe(g.fighter.sessionsThisYear + 1);
    expect(T.text.limit).toContain(lastLine(n));
    expect(overtrainExtras(n, C)).toBe(1);
  });

  it('com emprego, o aviso fala do trabalho', () => {
    const job = C.economy.jobs.find((j) => j.trainingSessions === 4)!;
    const g = withJob(adult(), job.id);
    const s = { ...g, fighter: { ...g.fighter, sessionsThisYear: C.limits.trainingSessions - 4 } };
    expect(overtrainCause(s, C)).toBe('job');
    const n = trainFighter(s, 'fisico', C);
    expect(n.character.stats.athletic).toBe(s.character.stats.athletic);
    expect(T.text.job.some((t) => lastLine(n).startsWith(t))).toBe(true);
  });

  it('no clube esportivo também vale', () => {
    const g = full(joinSportsClub(withAge(makeGame('clube-over'), 12), 'clube_bairro', 'futebol', C));
    const n = trainAtClub(g, C);
    expect(n.character.stats.athletic).toBe(g.character.stats.athletic);
    expect(T.text.limit.some((t) => lastLine(n).startsWith(t))).toBe(true);
  });

  it('1ª tentativa extra nunca lesiona; da 2ª em diante, lesão leve com frequência na faixa', () => {
    expect(overtrainInjuryChance(1, C)).toBe(0);
    let first = 0;
    let second = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const g = full(adult(`ov${i}`));
      const a = trainFighter(g, 'fisico', C);
      if (a.health.injuries.length) first++;
      const b = trainFighter(a, 'fisico', C);
      if (b.health.injuries.length > a.health.injuries.length) {
        second++;
        expect(T.injuryIds).toContain(b.health.injuries.at(-1)!.defId);
      }
    }
    expect(first).toBe(0);
    // 8% ± sorte (limitada) → entre 3% e 14%
    expect(second / N).toBeGreaterThan(0.03);
    expect(second / N).toBeLessThan(0.14);
  });

  it('determinístico pela seed', () => {
    const g = full(adult('det'));
    expect(trainFighter(trainFighter(g, 'fisico', C), 'fisico', C)).toEqual(trainFighter(trainFighter(g, 'fisico', C), 'fisico', C));
  });
});
