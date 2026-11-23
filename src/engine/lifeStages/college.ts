/**
 * Faculdade (release 0.0.1): exame nacional fictício (ENU, 0–1000), matrícula em pública (sem mensalidade, nota de
 * corte alta) ou particular (mensalidade; bolsa por nota ou financiamento estudantil fictício), ano letivo com nota,
 * reprovação, trancamento e jubilamento, diploma ao concluir. A faculdade ocupa 2 sessões de treino por ano.
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState, StatKey } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { luckFactor, talentMod } from '../character/talents';
import { post, toMoney } from '../economy/ledger';
import { newLoan } from '../economy/bank';
import { cityMultOf } from '../geo';
import { usesThisYear } from './sessions';

export interface CourseDef {
  id: string;
  label: string;
  years: number;
  cutoffPublic: number;
  cutoffPrivate: number;
  /** Mensalidade da particular em salários mínimos. */
  tuitionMW: number;
  /** 0–1: pesa contra a nota do ano. */
  difficulty: number;
  develops: StatKey;
}

export interface CollegeContent {
  examName: string;
  loanName: string;
  loanRate: number;
  /** Nota acima do corte da particular que garante bolsa integral. */
  scholarshipMargin: number;
  publicNames: readonly string[];
  privateNames: readonly string[];
  courses: readonly CourseDef[];
}

export type CollegeType = 'publica' | 'particular';
export type CollegeFunding = 'gratis' | 'proprio' | 'bolsa' | 'financiamento';

export interface CollegeEnrollment {
  courseId: string;
  type: CollegeType;
  institution: string;
  /** Ano do curso (1 = primeiro). */
  year: number;
  /** Nota do último ano (0–100); null no primeiro ano. */
  grade: number | null;
  status: 'cursando' | 'trancado';
  funding: CollegeFunding;
  failures: number;
  /** Mensalidades financiadas acumuladas (viram empréstimo na formatura). */
  financed: number;
}

export interface CollegeState {
  current: CollegeEnrollment | null;
  diplomas: string[];
  examScore: number | null;
  examYear: number | null;
}

export const SALARIO_MINIMO_REF = 1518;

export function emptyCollege(): CollegeState {
  return { current: null, diplomas: [], examScore: null, examYear: null };
}

export function courseDef(content: GameContent, id: string | undefined): CourseDef | undefined {
  return id ? content.college.courses.find((c) => c.id === id) : undefined;
}

export function inCollege(state: GameState): boolean {
  return state.college.current?.status === 'cursando';
}

export function hasDiploma(state: GameState, ids?: readonly string[]): boolean {
  const d = state.college.diplomas;
  return ids ? ids.some((id) => d.includes(id)) : d.length > 0;
}

/** Mensalidade anual da particular (12 × salários mínimos × custo da cidade). */
export function tuitionOf(state: GameState, course: CourseDef, content: GameContent): number {
  return toMoney(course.tuitionMW * SALARIO_MINIMO_REF * 12 * cityMultOf(state, content));
}

// ---------------------------------------------------------------------------
// exame nacional
// ---------------------------------------------------------------------------

export type ExamBlockReason = 'busy' | 'too-young' | 'no-highschool' | 'done';

/** Pode fazer o ENU: 3º ano do ensino médio ou ensino médio concluído, uma vez por ano. */
export function examBlockReason(state: GameState): ExamBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < 16) return 'too-young';
  const cur = state.education.current;
  if (!state.education.graduated && !(cur && cur.grade >= 14)) return 'no-highschool';
  if (state.college.examYear === state.year) return 'done';
  return null;
}

/** Nota do ENU: inteligência, média escolar, estudo do ano, talento e um pouco de sorte (0–1000). */
export function examScore(state: GameState, rng: Rng, content: GameContent): number {
  const st = state.character.stats;
  const avg = state.education.current?.average ?? state.education.history.at(-1)?.final ?? 60;
  const study = Math.min(4, usesThisYear(state, 'acao:study') + usesThisYear(state, 'acao:study_exams'));
  const raw = 180 + st.intelligence * 5.2 + (avg - 50) * 3.5 + study * 18 + talentMod(state, content, 'studyGain') * 120 + luckFactor(state) * 30 + rng.int(-70, 70);
  return Math.max(0, Math.min(1000, Math.round(raw)));
}

export function takeExamWith(state: GameState, rng: Rng, content: GameContent): GameState {
  const score = examScore(state, rng, content);
  const best = Math.max(score, state.college.examScore ?? 0);
  const s: GameState = { ...state, college: { ...state.college, examScore: best, examYear: state.year } };
  return appendLog(s, `Você fez o ${content.college.examName} e tirou ${score} pontos${best > score ? ` (vale a nota anterior, ${best})` : ''}.`);
}

export function takeExam(state: GameState, content: GameContent): GameState {
  if (examBlockReason(state) !== null) return state;
  const rng = createRng(state.rngState);
  return { ...takeExamWith(state, rng, content), rngState: rng.state };
}

// ---------------------------------------------------------------------------
// matrícula
// ---------------------------------------------------------------------------

export type EnrollBlockReason = 'busy' | 'too-young' | 'no-highschool' | 'no-exam' | 'cutoff' | 'enrolled' | 'has-diploma';

export function enrollBlockReason(state: GameState, courseId: string, type: CollegeType, content: GameContent): EnrollBlockReason | null {
  const c = courseDef(content, courseId);
  if (!c || !state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < 17) return 'too-young';
  if (!state.education.graduated) return 'no-highschool';
  if (state.college.current) return 'enrolled';
  if (state.college.diplomas.includes(courseId)) return 'has-diploma';
  if (state.college.examScore === null) return 'no-exam';
  if (state.college.examScore < (type === 'publica' ? c.cutoffPublic : c.cutoffPrivate)) return 'cutoff';
  return null;
}

/** Bolsa integral na particular quando a nota passa bem do corte. */
export function earnsScholarship(state: GameState, c: CourseDef, content: GameContent): boolean {
  return (state.college.examScore ?? 0) >= c.cutoffPrivate + content.college.scholarshipMargin;
}

/** Matricula: pública é grátis; particular paga (ou financia, ou ganha bolsa pela nota). */
export function enrollCollege(state: GameState, courseId: string, type: CollegeType, content: GameContent, financing = false): GameState {
  if (enrollBlockReason(state, courseId, type, content) !== null) return state;
  const c = courseDef(content, courseId)!;
  const rng = createRng(state.rngState);
  const names = type === 'publica' ? content.college.publicNames : content.college.privateNames;
  const funding: CollegeFunding = type === 'publica' ? 'gratis' : earnsScholarship(state, c, content) ? 'bolsa' : financing ? 'financiamento' : 'proprio';
  const current: CollegeEnrollment = { courseId, type, institution: rng.pick(names), year: 1, grade: null, status: 'cursando', funding, failures: 0, financed: 0 };
  const s: GameState = { ...state, rngState: rng.state, college: { ...state.college, current }, flags: { ...state.flags, caminho_18: 'faculdade' } };
  const how = funding === 'gratis' ? 'pública, sem mensalidade' : funding === 'bolsa' ? 'com bolsa integral pela nota' : funding === 'financiamento' ? `pelo ${content.college.loanName}` : `mensalidade de R$ ${tuitionOf(state, c, content).toLocaleString('pt-BR')}/ano`;
  return appendLog(s, `Você começou ${c.label} na ${current.institution} (${how}).`);
}

export function lockCollege(state: GameState): GameState {
  const cur = state.college.current;
  if (!cur || cur.status !== 'cursando') return state;
  return appendLog({ ...state, college: { ...state.college, current: { ...cur, status: 'trancado' } } }, 'Você trancou a matrícula da faculdade.');
}

export function unlockCollege(state: GameState): GameState {
  const cur = state.college.current;
  if (!cur || cur.status !== 'trancado') return state;
  return appendLog({ ...state, college: { ...state.college, current: { ...cur, status: 'cursando' } } }, 'Você destrancou a matrícula e voltou às aulas.');
}

export function dropCollege(state: GameState, content: GameContent): GameState {
  const cur = state.college.current;
  if (!cur) return state;
  let s: GameState = { ...state, college: { ...state.college, current: null } };
  s = financedToLoan(s, cur, content);
  return appendLog(s, `Você largou ${courseDef(content, cur.courseId)?.label ?? 'a faculdade'}.`);
}

function financedToLoan(state: GameState, cur: CollegeEnrollment, content: GameContent): GameState {
  if (cur.financed <= 0) return state;
  const [s] = newLoan(state, 'pessoal', cur.financed, 5, content.college.loanName);
  return appendLog(s, `O ${content.college.loanName} começa a ser cobrado: R$ ${cur.financed.toLocaleString('pt-BR')} em parcelas.`);
}

/** Nota do ano: inteligência, dificuldade do curso, estudo, faltas, sorte e ruído (0–100). */
export function collegeGrade(state: GameState, c: CourseDef, rng: Rng, content: GameContent): number {
  const st = state.character.stats;
  const study = Math.min(3, usesThisYear(state, 'acao:college_study'));
  const skip = usesThisYear(state, 'acao:college_skip');
  const raw = 52 + (st.intelligence - 50) * 0.45 + study * 6 - skip * 7 - c.difficulty * 22 + talentMod(state, content, 'studyGain') * 15 + luckFactor(state) * 4 + rng.int(-8, 8);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Fim do ano letivo da faculdade (no `advanceYear`, junto com o da escola). */
export function collegeYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const cur = state.college.current;
  if (!cur || cur.status !== 'cursando') return state;
  const c = courseDef(content, cur.courseId);
  if (!c) return state;
  let s = state;
  let next: CollegeEnrollment = { ...cur };
  // mensalidade do ano
  if (cur.funding === 'proprio') s = post(s, 'educacao', -tuitionOf(s, c, content), `Mensalidade: ${c.label}`);
  if (cur.funding === 'financiamento') next = { ...next, financed: next.financed + tuitionOf(s, c, content) };
  const grade = collegeGrade(s, c, rng, content);
  next = { ...next, grade };
  if (grade >= 50) {
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { [c.develops]: 2 }) } };
    if (cur.year >= c.years) return graduate(s, next, c, content);
    s = appendLog(s, `Você passou de ano em ${c.label} (nota ${grade}).`);
    next = { ...next, year: cur.year + 1 };
  } else {
    next = { ...next, failures: cur.failures + 1 };
    if (next.failures >= 2) {
      s = { ...s, college: { ...s.college, current: null }, flags: { ...s.flags, jubilado: true } };
      s = financedToLoan(s, next, content);
      return appendLog(s, `Com a segunda reprovação, você foi jubilad${s.character.sex === 'M' ? 'o' : 'a'} de ${c.label}.`);
    }
    s = appendLog(s, `Você reprovou no ${cur.year}º ano de ${c.label} (nota ${grade}) e vai repetir.`);
  }
  return { ...s, college: { ...s.college, current: next } };
}

function graduate(state: GameState, cur: CollegeEnrollment, c: CourseDef, content: GameContent): GameState {
  let s: GameState = {
    ...state,
    college: { ...state.college, current: null, diplomas: [...state.college.diplomas, c.id] },
    flags: { ...state.flags, [`formado_${c.id}`]: true, diploma: true, ...(c.id === 'medicina' ? { crm: true } : {}) },
  };
  s = appendLog(s, `🎓 Você se formou em ${c.label}!${c.id === 'medicina' ? ' Com o diploma, o registro de médico(a) saiu.' : ''}`);
  return financedToLoan(s, cur, content);
}
