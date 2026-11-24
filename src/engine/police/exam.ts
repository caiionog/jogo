/**
 * Concurso público da polícia (release 0.0.2). Uma inscrição por ano. Etapas, nesta ordem, cada uma podendo
 * reprovar com o motivo: prova (inteligência + estudo do ano + sorte), TAF (Capacidade atlética), exame de saúde,
 * avaliação psicológica (felicidade e histórico) e investigação social (ficha limpa, nenhuma ligação com facção).
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { educationLevel, EDUCATION_ORDER } from '../economy/jobs';
import { post } from '../economy/ledger';
import { hasConviction } from '../crime/record';
import { publicExamScore, runExamStages, STAGE_FAIL_TEXT } from '../exams/stages';
export { studyBonus } from '../exams/stages';
import type { ExamResult, ExamStage, PoliceTrackDef, PoliceTrackId } from './types';
import { startAcademy } from './career';
import { trackDef } from './defs';


export type PoliceExamBlockReason = 'dead' | 'busy' | 'age' | 'education' | 'degree' | 'record' | 'prison' | 'tried' | 'already' | 'internal' | 'no-money';

/** Requisitos de perfil (para os cartões ✓/✗): idade, escolaridade, diploma, ficha. */
export function policeExamGaps(state: GameState, def: PoliceTrackDef): PoliceExamBlockReason[] {
  const gaps: PoliceExamBlockReason[] = [];
  const age = state.character.age;
  if (age < def.ageRange[0] || age > def.ageRange[1]) gaps.push('age');
  if (EDUCATION_ORDER.indexOf(educationLevel(state)) < EDUCATION_ORDER.indexOf(def.education)) gaps.push('education');
  if (def.degree && !def.degree.some((d) => state.college?.diplomas.includes(d))) gaps.push('degree');
  if (hasConviction(state)) gaps.push('record');
  return gaps;
}

export function policeExamBlockReason(state: GameState, trackId: PoliceTrackId, content: GameContent): PoliceExamBlockReason | null {
  const def = trackDef(content, trackId);
  if (!def || !state.alive) return 'dead';
  if (state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.prison) return 'prison';
  const career = state.police.career;
  if (def.entry === 'interno') {
    // CFO: só praça da PM já efetivada
    if (!career || career.track !== 'pm_praca' || career.stage !== 'efetivo') return 'internal';
  } else if (career) return 'already';
  const gap = policeExamGaps(state, def)[0];
  if (gap) return gap;
  if (state.police.exams.some((e) => e.year === state.year)) return 'tried';
  if (state.money < def.fee) return 'no-money';
  return null;
}

/** Nota da prova (0–100+): o motor comum de concursos (`exams/stages.ts`). */
export function policeExamScore(state: GameState, rng: Rng): number {
  return publicExamScore(state, rng);
}

/** Corre as etapas da polícia: prova, TAF, saúde, psicológico e investigação social completa. */
export function runExam(state: GameState, def: PoliceTrackDef, rng: Rng): ExamStage | null {
  return runExamStages(state, { cut: def.cut, health: true, social: 'full' }, rng);
}

const FAIL_TEXT = STAGE_FAIL_TEXT;

/** Prestar o concurso (ou o concurso interno do CFO). Aprovado: entra na academia de polícia. */
export function takePoliceExam(state: GameState, trackId: PoliceTrackId, content: GameContent): GameState {
  const def = trackDef(content, trackId);
  if (!def || policeExamBlockReason(state, trackId, content) !== null) return state;
  const rng = createRng(state.rngState);
  let s: GameState = def.fee > 0 ? post(state, 'educacao', -def.fee, `Inscrição: concurso (${def.label})`) : state;
  const failedAt = runExam(s, def, rng);
  const result: ExamResult = { year: s.year, age: s.character.age, track: def.id, passed: failedAt === null, failedAt };
  s = { ...s, police: { ...s.police, exams: [...s.police.exams, result].slice(-10) } };
  const o = s.character.sex === 'M' ? 'o' : 'a';
  if (failedAt) {
    s = appendLog(s, `Concurso (${def.label}): ${FAIL_TEXT[failedAt].replace(/o\(a\)/g, o)}`);
    return { ...s, rngState: rng.state };
  }
  s = startAcademy(s, def, rng, content);
  s = appendLog(s, `Aprovad${o} no concurso (${def.label})! Você vai para o ${def.course}.`);
  return { ...s, rngState: rng.state };
}
