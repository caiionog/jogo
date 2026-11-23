import type { LimitsConfig } from '../engine';

/**
 * Limites anuais (release 0.0.1: substituem a energia).
 * - 10 sessões de treino por ano, compartilhadas entre as modalidades, o treino físico e os camps de luta.
 * - Emprego, faculdade e "gerenciar de perto" ocupam parte delas.
 * - As outras atividades não têm limite, mas cada repetição no mesmo ano rende menos.
 */
export const LIMITS: LimitsConfig = {
  trainingSessions: 10,
  /** Multiplicador dos efeitos positivos na 1ª, 2ª, 3ª… repetição da mesma atividade no ano (o último vale dali em diante). */
  repeatMultipliers: [1, 0.6, 0.35, 0.2, 0.1],
  sessionsByJob: { fullTime: 4, partTime: 2 },
  collegeSessions: 2,
  businessDedicateSessions: 2,
  /** Idade mínima para qualquer atividade (bebês só avançam o ano). */
  minActivityAge: 3,
  /** Um evento aleatório não se repete antes de 5 anos (o evento pode pedir outro intervalo). */
  eventCooldown: 5,
};
