/**
 * Sistema escolar: fases, matrícula, início e fim do ano letivo, transferências e clubes.
 * Fórmulas documentadas no GDD.md (seção Escola).
 */
import type { ClubDef, GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type {
  Character,
  ClubId,
  Education,
  Enrollment,
  GameState,
  SchoolStage,
  SchoolType,
  SchoolYearResult,
} from '../core/state';
import { addStats, appendLog, clamp } from '../core/stats';
import { randomSchool, withPreposition } from '../character/names';
import { applyEffects, gendered } from '../core/effects';

export const SCHOOL_START_AGE = 3;
export const LAST_GRADE = 14;
/** Idade a partir da qual quem não se formou deixa a escola. */
export const SCHOOL_DROPOUT_AGE = 20;
export const PASS_GRADE = 50;
export const HONORS_GRADE = 88;
export const MAX_ABSENCES = 25;
export const EXPEL_DISCIPLINE = 15;
export const EXPEL_SUSPENSIONS = 3;

export const STAGE_ORDER: readonly SchoolStage[] = ['pre', 'fund1', 'fund2', 'medio'];

export const SCHOOL_STAGE_LABEL: Record<SchoolStage, string> = {
  pre: 'Pré-escola',
  fund1: 'Fundamental I',
  fund2: 'Fundamental II',
  medio: 'Ensino Médio',
};

export function emptyEducation(): Education {
  return { current: null, history: [], lastResult: null, repeats: 0, expulsions: 0, graduated: false };
}

export function stageOfGrade(grade: number): SchoolStage {
  if (grade <= 2) return 'pre';
  if (grade <= 7) return 'fund1';
  if (grade <= 11) return 'fund2';
  return 'medio';
}

export function gradeLabel(grade: number): string {
  if (grade <= 2) return `Pré ${['I', 'II', 'III'][grade]}`;
  if (grade <= 11) return `${grade - 2}º ano`;
  return `${grade - 11}º ano do Ensino Médio`;
}

/** Série esperada para a idade (3 → Pré I, 6 → 1º ano, 15 → 1º EM). */
export function gradeForAge(age: number): number {
  return Math.min(LAST_GRADE, Math.max(0, age - SCHOOL_START_AGE));
}

export function currentStage(state: GameState): SchoolStage | null {
  const cur = state.education.current;
  return cur ? stageOfGrade(cur.grade) : null;
}

export function stageAtLeast(stage: SchoolStage, min: SchoolStage): boolean {
  return STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(min);
}

export function privateSchoolChance(familyWealth: number): number {
  return 0.1 + (familyWealth / 100) * 0.7;
}

function pickSchoolType(rng: Rng, familyWealth: number): SchoolType {
  return rng.chance(privateSchoolChance(familyWealth)) ? 'particular' : 'publica';
}

/** Média inicial do ano letivo. */
export function initialAverage(rng: Rng, intelligence: number, previousFinal: number, type: SchoolType): number {
  return clamp(30 + 0.35 * intelligence + 0.15 * previousFinal + (type === 'particular' ? 3 : 0) + rng.int(-5, 5));
}

/** Nota final do ano letivo. */
export function finalGrade(rng: Rng, average: number, intelligence: number, absences: number): number {
  return clamp(0.7 * average + 0.3 * intelligence - 1.5 * Math.max(0, absences - 10) + rng.int(-8, 8));
}

export function createEnrollment(
  rng: Rng,
  state: GameState,
  content: GameContent,
  grade: number,
  type?: SchoolType,
): Enrollment {
  const { stats, familyWealth } = state.character;
  const school = randomSchool(rng, content.names, type ?? pickSchoolType(rng, familyWealth));
  const prev = state.education.lastResult?.final ?? stats.intelligence;
  return {
    school,
    grade,
    average: initialAverage(rng, stats.intelligence, prev, school.type),
    discipline: 70,
    absences: 0,
    popularity: clamp(30 + stats.looks * 0.2 + rng.int(-5, 5)),
    club: null,
    suspensions: 0,
  };
}

/**
 * Escolaridade coerente com a idade para um personagem que "entra" no meio da vida (herdeiro do legado):
 * matriculado na série da idade (3–17) ou formado (18+).
 */
export function educationForAge(rng: Rng, content: GameContent, age: number, character: Character): Education {
  const education = emptyEducation();
  if (age >= 3 && age <= 17) {
    const school = randomSchool(rng, content.names, pickSchoolType(rng, character.familyWealth));
    return {
      ...education,
      current: {
        school,
        grade: gradeForAge(age),
        average: initialAverage(rng, character.stats.intelligence, character.stats.intelligence, school.type),
        discipline: 70,
        absences: 0,
        popularity: clamp(30 + character.stats.looks * 0.2 + rng.int(-5, 5)),
        club: null,
        suspensions: 0,
      },
    };
  }
  if (age >= 18) return { ...education, graduated: true };
  return education;
}

/**
 * Início do ano letivo (chamado depois de envelhecer): matrícula automática, evasão aos 20 anos
 * ou renovação da matrícula (faltas zeradas, nova média inicial, disciplina se recupera).
 */
export function startSchoolYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const { age } = state.character;
  const edu = state.education;
  const flags = { ...state.flags };
  delete flags.suspenso;
  let next: GameState = { ...state, flags };

  if (edu.current && age >= SCHOOL_DROPOUT_AGE) {
    next = { ...next, education: { ...edu, current: null }, flags: { ...next.flags, evadiu: true } };
    return appendLog(next, 'Você deixou a escola sem concluir o Ensino Médio.');
  }

  if (!edu.current) {
    if (edu.graduated || age < SCHOOL_START_AGE || age > 17) return next;
    const enrollment = createEnrollment(rng, next, content, gradeForAge(age));
    next = { ...next, education: { ...edu, current: enrollment } };
    const tipo = enrollment.school.type === 'publica' ? 'pública' : 'particular';
    return appendLog(
      next,
      `Você foi matriculad${gendered(next, 'o', 'a')} no ${gradeLabel(enrollment.grade)} ${withPreposition(enrollment.school.name, 'de')} (escola ${tipo}).`,
    );
  }

  const cur = edu.current;
  const prev = edu.lastResult?.final ?? state.character.stats.intelligence;
  const renewed: Enrollment = {
    ...cur,
    absences: 0,
    average: initialAverage(rng, state.character.stats.intelligence, prev, cur.school.type),
    discipline: cur.discipline < 70 ? Math.min(70, cur.discipline + 3) : cur.discipline,
  };
  return { ...next, education: { ...edu, current: renewed } };
}

/**
 * Fim do ano letivo (chamado antes de envelhecer): efeitos do clube, nota final,
 * aprovação/reprovação, formatura e expulsão. Registra histórico, `lastResult` e log.
 */
export function endSchoolYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const cur0 = state.education.current;
  if (!cur0) return { ...state, education: { ...state.education, lastResult: null } };

  let next = state;
  const club = cur0.club ? content.clubs.find((c) => c.id === cur0.club) : undefined;
  if (club) next = applyEffects(next, club.yearlyEffects, { rng, content });

  const cur = next.education.current ?? cur0;
  const { intelligence } = next.character.stats;
  const isPre = stageOfGrade(cur.grade) === 'pre';
  // pré-escola não tem nota: registra a média do ano e sempre aprova
  const final = isPre ? cur.average : finalGrade(rng, cur.average, intelligence, cur.absences);
  const passed = isPre || (final >= PASS_GRADE && cur.absences <= MAX_ABSENCES);
  const honors = !isPre && passed && final >= HONORS_GRADE;
  const graduated = passed && cur.grade === LAST_GRADE;
  const expelled =
    !graduated && (cur.discipline <= EXPEL_DISCIPLINE || cur.suspensions >= EXPEL_SUSPENSIONS);

  const edu = next.education;
  const record = {
    age: next.character.age,
    year: next.year,
    school: cur.school.name,
    gradeLabel: gradeLabel(cur.grade),
    final,
    passed,
  };
  const result: SchoolYearResult = { final, passed, honors, graduated, expelled };
  let flags = next.flags;
  let stats = next.character.stats;
  let text: string;

  if (graduated) {
    text = `Você concluiu o ${gradeLabel(cur.grade)} com média ${final} e se formou!`;
    flags = { ...flags, formado: true };
  } else if (passed) {
    text = isPre
      ? `Você concluiu o ${gradeLabel(cur.grade)}.`
      : `Você passou para o ${gradeLabel(cur.grade + 1)} com média ${final}.`;
  } else {
    const motivo = cur.absences > MAX_ABSENCES ? `${cur.absences} faltas` : `média ${final}`;
    text = `Você reprovou no ${gradeLabel(cur.grade)} (${motivo}) e vai repetir o ano.`;
    flags = { ...flags, repetente: true };
    stats = addStats(stats, { happiness: -10 });
  }

  next = {
    ...next,
    flags,
    character: { ...next.character, stats },
    education: {
      ...edu,
      current: graduated ? null : { ...cur, grade: passed ? cur.grade + 1 : cur.grade },
      history: [...edu.history, record],
      lastResult: result,
      repeats: edu.repeats + (passed ? 0 : 1),
      graduated: edu.graduated || graduated,
    },
  };
  next = appendLog(next, text);

  if (expelled) next = transferSchool(next, rng, content, { expelled: true, type: 'publica' });
  return next;
}

export interface TransferOptions {
  expelled?: boolean;
  type?: SchoolType | undefined;
}

/** Transfere para outra escola mantendo a série. Expulsão: disciplina 55 e flag `expulso`. */
export function transferSchool(state: GameState, rng: Rng, content: GameContent, opts: TransferOptions): GameState {
  const cur = state.education.current;
  if (!cur) return state;
  const type = opts.type ?? pickSchoolType(rng, state.character.familyWealth);
  let school = randomSchool(rng, content.names, type);
  for (let i = 0; i < 5 && school.name === cur.school.name; i++) school = randomSchool(rng, content.names, type);

  const moved: Enrollment = {
    ...cur,
    school,
    club: null,
    suspensions: 0,
    popularity: Math.round(cur.popularity / 2),
    discipline: opts.expelled ? 55 : cur.discipline,
  };
  let next: GameState = {
    ...state,
    education: {
      ...state.education,
      current: moved,
      expulsions: state.education.expulsions + (opts.expelled ? 1 : 0),
    },
  };
  if (opts.expelled) {
    next = { ...next, flags: { ...next.flags, expulso: true } };
    return appendLog(
      next,
      `Você foi expuls${gendered(next, 'o', 'a')} ${withPreposition(cur.school.name, 'de')} e transferid${gendered(next, 'o', 'a')} ${withPreposition(school.name, 'para')}.`,
    );
  }
  return appendLog(next, `Você mudou de escola: agora estuda ${withPreposition(school.name, 'em')}.`);
}

// ---------------------------------------------------------------------------
// Clubes
// ---------------------------------------------------------------------------

export const CLUB_ENERGY_COST = 1;

export type ClubBlockReason = 'unknown' | 'not-enrolled' | 'too-young' | 'already-member' | 'no-energy' | 'pending-event' | 'dead';

export function clubBlockReason(state: GameState, club: ClubDef | undefined): ClubBlockReason | null {
  if (!club) return 'unknown';
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'pending-event';
  const cur = state.education.current;
  if (!cur) return 'not-enrolled';
  if (!stageAtLeast(stageOfGrade(cur.grade), club.minStage)) return 'too-young';
  if (cur.club === club.id) return 'already-member';
  if (state.energy.current < CLUB_ENERGY_COST) return 'no-energy';
  return null;
}

/** Entra no clube (sem custo de energia/validação). Usado por efeitos de eventos e por joinClub. */
export function joinClubState(state: GameState, clubId: ClubId, content: GameContent, rng: Rng): GameState {
  const club = content.clubs.find((c) => c.id === clubId);
  const cur = state.education.current;
  if (!club || !cur || cur.club === clubId) return state;
  let next: GameState = { ...state, education: { ...state.education, current: { ...cur, club: clubId } } };
  next = applyEffects(next, club.joinEffects, { rng, content });
  return appendLog(next, club.joinText);
}
