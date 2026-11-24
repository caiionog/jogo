/**
 * Etapas de concurso público (release 0.0.4): o mesmo motor serve à polícia e aos concursos civis. Cada etapa pode
 * reprovar, nesta ordem: prova (inteligência + estudo do ano + sorte + títulos), TAF (Capacidade atlética), exame de
 * saúde, avaliação psicológica (felicidade e histórico) e investigação social. A investigação pode ser completa
 * (facção reprova sempre; passagem sem condenação, metade das vezes) ou só checar condenação.
 */
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { luckFactor } from '../character/talents';
import { factionLinked, hasConviction } from '../crime/record';

export type ExamStage = 'prova' | 'taf' | 'saude' | 'psico' | 'social';

export interface ExamSpec {
  /** Notas de corte das etapas que existem neste concurso (sem `taf` = sem TAF; sem `psico` = sem avaliação). */
  cut: { prova: number; taf?: number; psico?: number };
  /** Exame de saúde. */
  health?: boolean;
  /** Investigação social: completa, só condenação, ou nenhuma. */
  social: 'full' | 'conviction' | 'none';
  /** Prova de títulos: diplomas somam pontos na nota (até +6). */
  titles?: boolean;
}

/** Bônus de estudo do ano na prova (ações "Estudar", "Estudar para as provas" e o estudo da polícia). */
export function studyBonus(state: GameState): number {
  const n = (state.yearUses['acao:study'] ?? 0) + (state.yearUses['acao:study_exams'] ?? 0) + (state.yearUses['policia:estudar'] ?? 0);
  return Math.min(18, n * 6);
}

/** Pontos da prova de títulos: 3 por diploma, no máximo 6. */
export function titlesBonus(state: GameState): number {
  return Math.min(6, (state.college?.diplomas.length ?? 0) * 3);
}

/** Nota da prova (0–100+): inteligência, estudo, sorte (limitada a ±5), títulos e ruído. */
export function publicExamScore(state: GameState, rng: Rng, spec?: Pick<ExamSpec, 'titles'>): number {
  return state.character.stats.intelligence * 0.75 + studyBonus(state) + luckFactor(state) * 5 + (spec?.titles ? titlesBonus(state) : 0) + rng.int(-8, 12);
}

/** Corre as etapas na ordem; devolve a etapa da reprovação (null = aprovado). */
export function runExamStages(state: GameState, spec: ExamSpec, rng: Rng): ExamStage | null {
  const st = state.character.stats;
  if (publicExamScore(state, rng, spec) < spec.cut.prova) return 'prova';
  if (spec.cut.taf !== undefined && st.athletic + rng.int(-8, 8) < spec.cut.taf) return 'taf';
  if (spec.health && (st.health < 50 || state.health.injuries.some((i) => i.severity >= 3))) return 'saude';
  if (spec.cut.psico !== undefined) {
    const historyPenalty = (state.flags.brigou_na_escola ? 5 : 0) + (state.flags.expulso ? 10 : 0) + state.crime.juvenile.length * 3 + state.crime.record.length * 12;
    if (st.happiness * 0.6 + 25 - historyPenalty + rng.int(-10, 10) < spec.cut.psico) return 'psico';
  }
  if (spec.social === 'full') {
    if (factionLinked(state)) return 'social';
    if (state.crime.record.length && rng.chance(0.5)) return 'social';
  } else if (spec.social === 'conviction' && hasConviction(state)) return 'social';
  return null;
}

export const STAGE_FAIL_TEXT: Record<ExamStage, string> = {
  prova: 'Você não atingiu a nota de corte na prova escrita.',
  taf: 'Você foi eliminado(a) no teste de aptidão física.',
  saude: 'O exame de saúde apontou uma restrição e você foi eliminado(a).',
  psico: 'A avaliação psicológica considerou você inapto(a) por enquanto.',
  social: 'A investigação social encontrou problemas no seu histórico. Eliminado(a).',
};
