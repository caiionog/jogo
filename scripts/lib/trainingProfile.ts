/**
 * Perfil de calibragem do treino (release 0.0.1, Melhoria 3): a partir dos 10 anos, numa academia de jiu-jitsu de
 * nível médio da cidade, 10 sessões por ano — 7 na modalidade principal (jiu-jitsu) e 3 de treino físico. Sem lutas,
 * sem eventos (isola o treino). Mede a idade em que a habilidade principal chega a "Sólido" (≥ 50) e "Elite" (≥ 72)
 * e a Capacidade atlética aos 21. Usado por `npm run sim` e por `tests/trainingTargets.test.ts`.
 */
import { GAME_CONTENT } from '../../src/content';
import { advanceYear, enterGym, newGame, trainFighter } from '../../src/engine';
import type { GameContent, GameState } from '../../src/engine';

export const SOLID = 50;
export const ELITE = 72;

export interface TrainingRun {
  talent: number;
  solidAge: number | null;
  eliteAge: number | null;
  athleticAt21: number;
}

const NO_EVENTS: GameContent = { ...GAME_CONTENT, events: [] };

export function trainingRun(seed: string, maxAge = 30, content: GameContent = NO_EVENTS): TrainingRun {
  let s: GameState = newGame({ seed, name: 'Calibra', sex: seed.length % 2 ? 'M' : 'F', birthYear: 2000 }, content);
  // saúde estável e sem dinheiro no caminho: o teste é do treino
  const gym = content.fighting.gyms.find((g) => g.id === 'gen_jj_kids')!;
  let solidAge: number | null = null;
  let eliteAge: number | null = null;
  let athleticAt21 = 0;
  while (s.character.age < maxAge && s.alive) {
    s = { ...advanceYear({ ...s, pendingEvents: [] }, content), pendingEvents: [] };
    s = { ...s, health: { ...s.health, injuries: [] }, money: Math.max(s.money, 100000) };
    const age = s.character.age;
    if (age >= 10) {
      if (s.fighter.gymId !== gym.id) s = enterGym(s, gym.id, content);
      for (let i = 0; i < 10; i++) s = trainFighter(s, i < 7 ? 'jiujitsu' : 'fisico', content);
      s = { ...s, health: { ...s.health, injuries: [] } };
    }
    if (solidAge === null && s.fighter.skills.grappling >= SOLID) solidAge = age;
    if (eliteAge === null && s.fighter.skills.grappling >= ELITE) eliteAge = age;
    if (age === 21) athleticAt21 = s.character.stats.athletic;
  }
  return { talent: s.fighter.talent, solidAge, eliteAge, athleticAt21 };
}

export function median(a: number[]): number {
  if (!a.length) return NaN;
  const b = [...a].sort((x, y) => x - y);
  return b[Math.floor(b.length / 2)]!;
}

export interface TrainingSummary {
  n: number;
  solidMedian: number;
  eliteMedianTalented: number;
  eliteReachedTalented: number;
  athletic21Median: number;
}

/** `n` vidas: idade mediana para Sólido (talento ≥ 1,0) e Elite (talento ≥ 1,1), atlética aos 21. */
export function trainingSummary(n: number, prefix = 'calib'): TrainingSummary {
  const runs = Array.from({ length: n }, (_, i) => trainingRun(`${prefix}-${i}`));
  const solid = runs.filter((r) => r.talent >= 1).map((r) => r.solidAge ?? 99);
  const talented = runs.filter((r) => r.talent >= 1.1);
  const elite = talented.map((r) => r.eliteAge ?? 99);
  return {
    n,
    solidMedian: median(solid),
    eliteMedianTalented: median(elite),
    eliteReachedTalented: talented.length ? talented.filter((r) => r.eliteAge !== null).length / talented.length : 0,
    athletic21Median: median(runs.map((r) => r.athleticAt21)),
  };
}
