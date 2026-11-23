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
import { luckFactor } from '../character/talents';
import { educationLevel, EDUCATION_ORDER } from '../economy/jobs';
import { post } from '../economy/ledger';
import { factionLinked, hasConviction } from '../crime/record';
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

/** Bônus de estudo do ano na prova (ações "Estudar" e "Estudar para as provas"). */
export function studyBonus(state: GameState): number {
  const n = (state.yearUses['acao:study'] ?? 0) + (state.yearUses['acao:study_exams'] ?? 0) + (state.yearUses['policia:estudar'] ?? 0);
  return Math.min(18, n * 6);
}

/** Nota da prova (0–100+): inteligência, estudo, sorte (limitada a ±5) e ruído. */
export function policeExamScore(state: GameState, rng: Rng): number {
  return state.character.stats.intelligence * 0.75 + studyBonus(state) + luckFactor(state) * 5 + rng.int(-8, 12);
}

/** Corre as etapas; devolve a etapa da reprovação (null = aprovado). */
export function runExam(state: GameState, def: PoliceTrackDef, rng: Rng): ExamStage | null {
  const st = state.character.stats;
  if (policeExamScore(state, rng) < def.cut.prova) return 'prova';
  if (st.athletic + rng.int(-8, 8) < def.cut.taf) return 'taf';
  if (st.health < 50 || state.health.injuries.some((i) => i.severity >= 3)) return 'saude';
  const historyPenalty = (state.flags.brigou_na_escola ? 5 : 0) + (state.flags.expulso ? 10 : 0) + state.crime.juvenile.length * 3 + state.crime.record.length * 12;
  if (st.happiness * 0.6 + 25 - historyPenalty + rng.int(-10, 10) < def.cut.psico) return 'psico';
  // investigação social: facção reprova sempre; passagem sem condenação, metade das vezes
  if (factionLinked(state)) return 'social';
  if (state.crime.record.length && rng.chance(0.5)) return 'social';
  return null;
}

const FAIL_TEXT: Record<ExamStage, string> = {
  prova: 'Você não atingiu a nota de corte na prova escrita.',
  taf: 'Você foi eliminado(a) no teste de aptidão física.',
  saude: 'O exame de saúde apontou uma restrição e você foi eliminado(a).',
  psico: 'A avaliação psicológica considerou você inapto(a) por enquanto.',
  social: 'A investigação social encontrou problemas no seu histórico. Eliminado(a).',
};

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
