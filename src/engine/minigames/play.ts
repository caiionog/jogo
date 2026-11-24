/**
 * Ligação dos minigames com o jogo (release 0.0.4, fase 7). `startMinigame` guarda a jogada preparada em
 * `state.minigame`; `finishMinigame` resolve com a entrada do jogador (ou simula pela habilidade, com `input = null`),
 * aplica as consequências e limpa. Se o ano virar com um minigame aberto, ele é simulado antes.
 */
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { addFame } from '../fame/fame';
import { bumpUse } from '../lifeStages/sessions';
import { PENALTY } from './penalty';
import type { ActiveMinigame, MinigameContext, MinigameKind, PenaltyInput, PenaltyResult } from './types';

export type MinigameBlockReason = 'busy' | 'open' | 'tried';

/** Treino de pênaltis: até 3 por ano, para quem joga futebol (ou qualquer um com 8+ anos, no clube ou na rua). */
export const PENALTY_PRACTICE_PER_YEAR = 3;

export function practiceBlockReason(state: GameState): MinigameBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight || state.character.age < 8) return 'busy';
  if (state.minigame) return 'open';
  if ((state.yearUses['minigame:penalti'] ?? 0) >= PENALTY_PRACTICE_PER_YEAR) return 'tried';
  return null;
}

/** Habilidade usada no minigame: finalização no futebol; sem carreira, metade da capacidade atlética. */
export function penaltySkill(state: GameState): number {
  return state.football?.skills.finishing ?? state.character.stats.athletic / 2;
}

export function startMinigame(state: GameState, kind: MinigameKind, context: MinigameContext): GameState {
  if (state.minigame || !state.alive) return state;
  const n = state.yearUses[`minigame:${kind}:${context}`] ?? 0;
  const setup = PENALTY.setup(`${state.seed}:${state.year}:${context}:${n}`, {
    skill: penaltySkill(state),
    pressure: context === 'jogo' ? 0.75 : 0.15,
    keeperSkill: context === 'jogo' ? 60 : 40,
  });
  const active: ActiveMinigame = { kind, context, setup };
  return { ...bumpUse(state, `minigame:${kind}:${context}`), minigame: active };
}

/** Treino de pênaltis (ação): abre o minigame no contexto de treino. */
export function startPenaltyPractice(state: GameState): GameState {
  if (practiceBlockReason(state) !== null) return state;
  return startMinigame(bumpUse(state, 'minigame:penalti'), 'penalty', 'treino');
}

const TEXT: Record<PenaltyResult['outcome'], string> = {
  gol: 'GOL! Bola de um lado, goleiro do outro.',
  defesa: 'O goleiro defendeu.',
  fora: 'Por cima do gol! A bola foi parar na arquibancada.',
  trave: 'Na trave! O estalo ecoou pelo estádio.',
};

export function minigamePreview(state: GameState, input: PenaltyInput | null): PenaltyResult | null {
  const mg = state.minigame;
  if (!mg) return null;
  return PENALTY.resolve(mg.setup, input ?? PENALTY.simulate(mg.setup));
}

/** Termina o minigame: com `input = null`, simula pela habilidade. Consequências pelo contexto. */
export function finishMinigame(state: GameState, input: PenaltyInput | null): GameState {
  const mg = state.minigame;
  if (!mg) return state;
  const res = PENALTY.resolve(mg.setup, input ?? PENALTY.simulate(mg.setup));
  let s: GameState = { ...state, minigame: null };
  const scored = res.outcome === 'gol';
  const sim = input ? '' : ' (simulado)';
  if (mg.context === 'jogo') {
    if (s.football) s = { ...s, football: { ...s.football, reputation: Math.max(0, Math.min(100, s.football.reputation + (scored ? 3 : -2))) } };
    if (scored) s = addFame(s, 2);
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: scored ? 5 : -4 }) } };
    s = appendLog(s, `Pênalti no jogo${sim}: ${TEXT[res.outcome]}`);
  } else {
    if (scored && s.football) s = { ...s, football: { ...s.football, skills: { ...s.football.skills, finishing: Math.min(100, Math.round((s.football.skills.finishing + 0.4) * 10) / 10) } } };
    s = appendLog(s, `Treino de pênalti${sim}: ${TEXT[res.outcome]}`);
  }
  return s;
}
