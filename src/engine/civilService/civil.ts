/**
 * Concursos públicos civis (release 0.0.4, fase 4). Cada cargo é um `JobDef` com `civilExam` (etapas, corte, faixa de
 * idade, taxa). A candidatura comum não vale: o caminho é prestar o concurso, uma vez por ano por cargo, pelo motor
 * comum de etapas (`exams/stages.ts`). Aprovado, assume o cargo (nível 1) e ganha estabilidade: não é demitido pela
 * crise, só por desempenho muito baixo (a empresa pública de correspondência tem estabilidade parcial).
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { jobDef, jobRequirementGaps, jobTitle, salaryOf } from '../economy/jobs';
import type { JobBlockReason } from '../economy/jobs';
import { post } from '../economy/ledger';
import type { JobDef } from '../economy/types';
import { runExamStages, STAGE_FAIL_TEXT } from '../exams/stages';
import type { ExamSpec, ExamStage } from '../exams/stages';
import { cityMultOf } from '../geo';

export interface CivilExamSpec extends ExamSpec {
  /** Órgão genérico (fictício): "Tribunal Regional", "Prefeitura"… */
  agency: string;
  fee: number;
  /** Idade máxima para a inscrição (a mínima é `JobDef.minAge`). */
  maxAge?: number;
  /** 'parcial': pode haver demissão por crise, com risco menor. Padrão: estável. */
  stability?: 'total' | 'parcial';
}

export interface CivilExamResult {
  year: number;
  age: number;
  jobId: string;
  passed: boolean;
  failedAt: ExamStage | null;
}

export interface CivilServiceState {
  exams: CivilExamResult[];
}

export function emptyCivilService(): CivilServiceState {
  return { exams: [] };
}

export type CivilExamBlockReason = JobBlockReason | 'not-civil' | 'max-age' | 'tried' | 'no-money' | 'prison';

export function civilExamJobs(content: GameContent): JobDef[] {
  return content.economy.jobs.filter((j) => !!j.civilExam);
}

export function civilExamBlockReason(state: GameState, jobId: string, content: GameContent): CivilExamBlockReason | null {
  const def = jobDef(content, jobId);
  if (!def?.civilExam) return 'not-civil';
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.prison && state.prison.regime !== 'aberto') return 'prison';
  if (state.economy.job?.jobId === jobId) return 'current';
  if (state.fighter.orgId && !state.fighter.retired) return 'fighter';
  const gap = jobRequirementGaps(state, def)[0];
  if (gap) return gap;
  if (def.civilExam.maxAge !== undefined && state.character.age > def.civilExam.maxAge) return 'max-age';
  if (state.civilService?.exams.some((e) => e.year === state.year && e.jobId === jobId)) return 'tried';
  if (state.money < def.civilExam.fee) return 'no-money';
  return null;
}

/** Prestar o concurso: taxa, etapas e, aprovado, posse no cargo (sai do emprego anterior). */
export function takeCivilExam(state: GameState, jobId: string, content: GameContent): GameState {
  if (civilExamBlockReason(state, jobId, content) !== null) return state;
  const def = jobDef(content, jobId)!;
  const spec = def.civilExam!;
  const rng = createRng(state.rngState);
  let s = spec.fee > 0 ? post(state, 'educacao', -spec.fee, `Inscrição: concurso (${def.title})`) : state;
  const failedAt = runExamStages(s, spec, rng);
  const result: CivilExamResult = { year: s.year, age: s.character.age, jobId, passed: failedAt === null, failedAt };
  s = { ...s, civilService: { exams: [...(s.civilService?.exams ?? []), result].slice(-15) } };
  const o = s.character.sex === 'M' ? 'o' : 'a';
  if (failedAt) {
    s = appendLog(s, `Concurso (${def.title}, ${spec.agency}): ${STAGE_FAIL_TEXT[failedAt].replace(/o\(a\)/g, o)}`);
    return { ...s, rngState: rng.state };
  }
  if (s.economy.job) {
    const old = jobDef(content, s.economy.job.jobId);
    s = appendLog(s, `Você pediu demissão${old ? ` (${old.title.toLowerCase()})` : ''} para tomar posse.`);
  }
  s = { ...s, economy: { ...s.economy, job: { jobId, level: 1, performance: 55, years: 0 } } };
  const salary = salaryOf(def, 1, cityMultOf(s, content));
  s = appendLog(s, `Aprovad${o} no concurso! Você tomou posse como ${jobTitle(def, 1).toLowerCase()} (${spec.agency}, R$ ${salary.toLocaleString('pt-BR')}/ano).`);
  return { ...s, rngState: rng.state };
}

/** Risco de demissão por crise de um cargo público: 0 (estável) ou 30% do risco do mercado (estabilidade parcial). */
export function civilLayoffFactor(def: JobDef): number {
  if (!def.civilExam) return 1;
  return def.civilExam.stability === 'parcial' ? 0.3 : 0;
}
