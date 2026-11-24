/**
 * Ligação dos minigames com o jogo (release 0.0.4, fase 7). `startMinigame` guarda a jogada preparada em
 * `state.minigame`; `finishMinigame` resolve com a entrada do jogador (ou simula pela habilidade, com `input = null`),
 * aplica as consequências e limpa. Se o ano virar com um minigame aberto, ele é simulado antes.
 */
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { addFame } from '../fame/fame';
import { applySkillDelta } from '../fighting/profile';
import type { FootballSkill } from '../football/types';
import { bumpUse } from '../lifeStages/sessions';
import { GOALIE, MMA, PASS, SHOT } from './others';
import { PENALTY } from './penalty';
import type { ActiveMinigame, MinigameContext, MinigameDef, MinigameInput, MinigameKind, MinigameResult } from './types';

// os defs têm tipos próprios; aqui só importa a forma comum
type AnyDef = MinigameDef<unknown, unknown, { success: boolean }>;
export const MINIGAMES: Record<MinigameKind, AnyDef> = {
  penalty: PENALTY as unknown as AnyDef,
  shot: SHOT as unknown as AnyDef,
  pass: PASS as unknown as AnyDef,
  goalie: GOALIE as unknown as AnyDef,
  mma: MMA as unknown as AnyDef,
};

/** Treinos por tipo e por ano. */
export const PRACTICE_PER_YEAR = 3;
/** Compatibilidade com a parte 1 (pênalti). */
export const PENALTY_PRACTICE_PER_YEAR = PRACTICE_PER_YEAR;

/** Habilidade oculta usada em cada minigame. Sem carreira no esporte, metade da capacidade atlética. */
export function minigameSkill(state: GameState, kind: MinigameKind): number {
  const f = state.football;
  const half = state.character.stats.athletic / 2;
  switch (kind) {
    case 'penalty':
    case 'shot':
      return f?.skills.finishing ?? half;
    case 'pass':
      return f?.skills.passing ?? half;
    case 'goalie':
      return f?.skills.goalkeeping ?? half;
    case 'mma':
      return Math.round((state.fighter.skills.trocacao + state.fighter.skills.grappling) / 2);
  }
}

/** Compatibilidade com a parte 1. */
export function penaltySkill(state: GameState): number {
  return minigameSkill(state, 'penalty');
}

export type MinigameBlockReason = 'busy' | 'open' | 'tried' | 'no-gym';

export function practiceBlockReason(state: GameState, kind: MinigameKind = 'penalty'): MinigameBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight || state.character.age < 8) return 'busy';
  if (state.minigame) return 'open';
  if (kind === 'mma' && !state.fighter.gymId) return 'no-gym';
  if ((state.yearUses[`minigame:${kind === 'penalty' ? 'penalti' : kind}`] ?? 0) >= PRACTICE_PER_YEAR) return 'tried';
  return null;
}

export function startMinigame(state: GameState, kind: MinigameKind, context: MinigameContext): GameState {
  if (state.minigame || !state.alive) return state;
  const n = state.yearUses[`minigame:${kind}:${context}`] ?? 0;
  const setup = MINIGAMES[kind].setup(`${state.seed}:${state.year}:${context}:${n}`, {
    skill: minigameSkill(state, kind),
    pressure: context === 'jogo' ? 0.75 : 0.15,
    opponent: context === 'jogo' ? 60 : 40,
  });
  const active = { kind, context, setup } as ActiveMinigame;
  return { ...bumpUse(state, `minigame:${kind}:${context}`), minigame: active };
}

/** Treino (ação): abre o minigame no contexto de treino. */
export function startPractice(state: GameState, kind: MinigameKind): GameState {
  if (practiceBlockReason(state, kind) !== null) return state;
  return startMinigame(bumpUse(state, `minigame:${kind === 'penalty' ? 'penalti' : kind}`), kind, 'treino');
}

export function startPenaltyPractice(state: GameState): GameState {
  return startPractice(state, 'penalty');
}

/** Resultado que a entrada daria (o mesmo que `finishMinigame` aplica). */
export function minigamePreview<R extends MinigameResult = MinigameResult>(state: GameState, input: MinigameInput | null): R | null {
  const mg = state.minigame;
  if (!mg) return null;
  const def = MINIGAMES[mg.kind];
  return def.resolve(mg.setup, input ?? def.simulate(mg.setup)) as unknown as R;
}

const LABEL: Record<MinigameKind, [string, string]> = {
  penalty: ['GOL! Bola de um lado, goleiro do outro.', 'Não entrou.'],
  shot: ['Chute no canto, sem chance para o goleiro!', 'O chute saiu torto.'],
  pass: ['Passe na medida: o companheiro saiu cara a cara.', 'O passe não chegou.'],
  goalie: ['Você pegou!', 'A bola entrou.'],
  mma: ['Você venceu as trocas.', 'O parceiro levou a melhor nas trocas.'],
};
const NAME: Record<MinigameKind, string> = { penalty: 'Pênalti', shot: 'Finalização', pass: 'Passe', goalie: 'Pênalti contra você', mma: 'Sparring' };
const TRAIN_SKILL: Partial<Record<MinigameKind, FootballSkill>> = { penalty: 'finishing', shot: 'finishing', pass: 'passing', goalie: 'goalkeeping' };

/** Termina o minigame: com `input = null`, simula pela habilidade. Consequências pelo tipo e pelo contexto. */
export function finishMinigame(state: GameState, input: MinigameInput | null): GameState {
  const mg = state.minigame;
  if (!mg) return state;
  const res = minigamePreview(state, input)!;
  let s: GameState = { ...state, minigame: null };
  const ok = res.success;
  const sim = input ? '' : ' (simulado)';
  const text = 'outcome' in res && mg.kind === 'penalty' && !ok && res.outcome === 'fora' ? 'Por cima do gol! A bola foi parar na arquibancada.' : LABEL[mg.kind][ok ? 0 : 1];
  if (mg.kind === 'mma') {
    // sparring: ganho pequeno nas duas áreas, maior quando vence
    s = applySkillDelta(s, { trocacao: ok ? 0.6 : 0.2, grappling: ok ? 0.6 : 0.2 });
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: ok ? 2 : -1 }) } };
    // sparring valendo vaga: vencer dá nome na academia
    if (mg.context === 'jogo' && ok) s = { ...s, fighter: { ...s.fighter, reputation: Math.min(100, s.fighter.reputation + 2) } };
    return appendLog(s, `${NAME.mma}${sim}: ${text} (${(res as { won: number }).won} de 3).`);
  }
  if (mg.context === 'jogo') {
    if (s.football) s = { ...s, football: { ...s.football, reputation: Math.max(0, Math.min(100, s.football.reputation + (ok ? 3 : -2))) } };
    if (ok) s = addFame(s, 2);
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: ok ? 5 : -4 }) } };
    return appendLog(s, `${NAME[mg.kind]} no jogo${sim}: ${text}`);
  }
  const k = TRAIN_SKILL[mg.kind];
  if (ok && k && s.football) s = { ...s, football: { ...s.football, skills: { ...s.football.skills, [k]: Math.min(100, Math.round((s.football.skills[k] + 0.4) * 10) / 10) } } };
  return appendLog(s, `Treino de ${NAME[mg.kind].toLowerCase()}${sim}: ${text}`);
}
