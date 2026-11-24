/**
 * Minigames (release 0.0.4, fase 7). Cada minigame é uma função pura:
 * - `setup(seed, ctx)`: prepara a jogada com um RNG próprio (o goleiro já "escolheu" o canto, o ruído já está
 *   sorteado), sem mexer no `rngState` do jogo;
 * - `resolve(setup, input)`: resultado determinístico para a mesma entrada (`success` diz se deu certo);
 * - `simulate(setup)`: a entrada que a habilidade (oculta) produziria, para o botão "Simular".
 * O estado guarda só `state.minigame` (tipo + contexto + setup) até o jogador terminar.
 */
export type MinigameKind = 'penalty' | 'shot' | 'pass' | 'goalie' | 'mma';

/** Para que serve a jogada: treino (sem pressão, pequeno ganho) ou momento de jogo/luta (vale prestígio e fama). */
export type MinigameContext = 'treino' | 'jogo';

export interface MinigameCtx {
  skill: number;
  pressure: number;
  /** Força do adversário (goleiro, zagueiro, batedor, oponente). */
  opponent: number;
}

export interface MinigameDef<Setup, Input, Result extends { success: boolean }> {
  kind: MinigameKind;
  label: string;
  /** Texto do tutorial (uma ou duas frases). */
  tutorial: string;
  setup(seed: string, ctx: MinigameCtx): Setup;
  resolve(setup: Setup, input: Input): Result;
  simulate(setup: Setup): Input;
}

// ----- pênalti -----
export interface PenaltySetup {
  /** Zona para onde o goleiro pula (0–5: coluna esquerda/centro/direita × baixo/alto) ou -1 se fica parado. */
  keeperZone: number;
  keeperReach: number;
  spread: number;
  noise: [number, number];
  saveRoll: number;
  skill: number;
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
  success: boolean;
  outcome: PenaltyOutcome;
  shot: { x: number; y: number };
  keeperZone: number;
}

// ----- finalização (tempo): parar o marcador dentro da brecha que o goleiro deixa -----
export interface ShotSetup {
  /** Centro da brecha (0–1) e largura (cresce com a habilidade, diminui com o goleiro). */
  gap: number;
  width: number;
  /** Ruído já sorteado do chute (deslocamento em [-1, 1] × `spread`). */
  noise: number;
  spread: number;
  skill: number;
}
/** Posição (0–1) onde o jogador parou o marcador. */
export interface ShotInput {
  at: number;
}
export interface ShotResult {
  success: boolean;
  /** Onde a bola foi (0–1). */
  landed: number;
}

// ----- passe: escolher o companheiro e a força -----
export interface PassLane {
  /** Distância (0–1): mais longe pede mais força. */
  distance: number;
  /** Quão perto está o marcador (0–1): quanto mais perto, maior a chance de corte. */
  marker: number;
}
export interface PassSetup {
  lanes: [PassLane, PassLane, PassLane];
  /** Tolerância de força (cresce com a habilidade). */
  tolerance: number;
  /** Sorteio já feito para a interceptação. */
  cutRoll: number;
  skill: number;
}
export interface PassInput {
  lane: number;
  power: number;
}
export interface PassResult {
  success: boolean;
  outcome: 'certo' | 'cortado' | 'forte' | 'fraco';
}

// ----- goleiro: escolher o canto do pulo lendo a dica do batedor -----
export interface GoalieSetup {
  /** Zona do chute (0–5). */
  shotZone: number;
  /** Dica (zona para onde o batedor "olhou") e se ela é verdadeira (fica oculto até o fim). */
  tellZone: number;
  reach: number;
  roll: number;
  /** O batedor erra o gol sozinho. */
  miss: boolean;
  skill: number;
}
export interface GoalieInput {
  zone: number;
}
export interface GoalieResult {
  success: boolean;
  outcome: 'defesa' | 'gol' | 'fora';
  shotZone: number;
}

// ----- MMA: três trocas; ler o golpe anunciado e escolher a resposta -----
export type MmaAttack = 'jab' | 'chute' | 'queda';
export type MmaAnswer = 'esquiva' | 'bloqueio' | 'sprawl';
export interface MmaSetup {
  /** Golpes do oponente nas três trocas. */
  attacks: [MmaAttack, MmaAttack, MmaAttack];
  /** Dica de cada troca: o golpe que o oponente "telegrafou" (nem sempre é o golpe real). */
  tells: [MmaAttack, MmaAttack, MmaAttack];
  skill: number;
}
export interface MmaInput {
  answers: [MmaAnswer, MmaAnswer, MmaAnswer];
}
export interface MmaResult {
  success: boolean;
  /** Trocas vencidas (0–3); vence a sessão com 2+. */
  won: number;
  rounds: boolean[];
}

export type MinigameSetup =
  | { kind: 'penalty'; setup: PenaltySetup }
  | { kind: 'shot'; setup: ShotSetup }
  | { kind: 'pass'; setup: PassSetup }
  | { kind: 'goalie'; setup: GoalieSetup }
  | { kind: 'mma'; setup: MmaSetup };

export type MinigameInput = PenaltyInput | ShotInput | PassInput | GoalieInput | MmaInput;
export type MinigameResult = PenaltyResult | ShotResult | PassResult | GoalieResult | MmaResult;

export type ActiveMinigame = MinigameSetup & { context: MinigameContext };
