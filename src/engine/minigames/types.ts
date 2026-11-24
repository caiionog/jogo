/**
 * Minigames (release 0.0.4, fase 7). Cada minigame é uma função pura:
 * - `setup(seed, ctx)`: prepara a jogada com um RNG próprio (o goleiro já "escolheu" o canto, o ruído do chute já
 *   está sorteado), sem mexer no `rngState` do jogo;
 * - `resolve(setup, input)`: resultado determinístico para a mesma entrada;
 * - `simulate(setup)`: a entrada que a habilidade (oculta) produziria, para o botão "Simular".
 * O estado guarda só `state.minigame` (setup + contexto) até o jogador terminar.
 */
export type MinigameKind = 'penalty';

/** Para que serve a jogada: treino (sem pressão, pequeno ganho) ou momento de jogo (vale prestígio e fama). */
export type MinigameContext = 'treino' | 'jogo';

export interface MinigameDef<Setup, Input, Result> {
  kind: MinigameKind;
  label: string;
  /** Texto do tutorial (uma ou duas frases). */
  tutorial: string;
  setup(seed: string, ctx: { skill: number; pressure: number; keeperSkill: number }): Setup;
  resolve(setup: Setup, input: Input): Result;
  simulate(setup: Setup): Input;
}

export interface PenaltySetup {
  /** Zona para onde o goleiro pula (0–5: coluna esquerda/centro/direita × alto/baixo) ou -1 se fica parado. */
  keeperZone: number;
  /** Chance de o goleiro alcançar um chute na zona certa (0–1). */
  keeperReach: number;
  /** Desvio do chute (0–1): cresce com a pressão e diminui com a habilidade. */
  spread: number;
  /** Ruído já sorteado do chute, em [-1, 1]. */
  noise: [number, number];
  /** Sorteio já feito para a defesa (0–1). */
  saveRoll: number;
  /** Habilidade (finalização) usada pelo "Simular". */
  skill: number;
  /** Mira preferida da habilidade para o "Simular". */
  simAim: [number, number];
}

/** Mira: x de -1 (canto esquerdo) a 1 (canto direito); y de 0 (rasteiro) a 1 (ângulo); força de 0 a 1. */
export interface PenaltyInput {
  x: number;
  y: number;
  power: number;
}

export type PenaltyOutcome = 'gol' | 'defesa' | 'fora' | 'trave';

export interface PenaltyResult {
  outcome: PenaltyOutcome;
  /** Onde a bola foi de fato (depois do desvio). */
  shot: { x: number; y: number };
  keeperZone: number;
}

export interface ActiveMinigame {
  kind: MinigameKind;
  context: MinigameContext;
  setup: PenaltySetup;
}
