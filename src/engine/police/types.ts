/**
 * Carreira policial (release 0.0.2): Polícia Militar e Polícia Civil, concurso, formação, postos e promoções.
 * O atributo Tiro (`shooting`) é OCULTO: a UI mostra só pistas em palavras (`shootingHint`).
 */
import type { EducationLevel } from '../economy/types';

export type PoliceForce = 'pm' | 'civil';
export type PoliceTrackId = 'pm_praca' | 'pm_oficial' | 'civil_investigador' | 'civil_escrivao' | 'civil_delegado';
export type PoliceStage = 'formacao' | 'probatorio' | 'efetivo';
export type PoliceUnit = 'regular' | 'especial';

export interface PoliceRankDef {
  title: string;
  /** Título no feminino, quando muda ("Delegada de 3ª Classe"). */
  titleF?: string;
  /** Salário mensal em salários mínimos de referência (o anual é ×13, antes do custo da cidade). */
  salaryMW: number;
  /** Anos mínimos no posto anterior para chegar a este. */
  minYears: number;
  /** Mérito mínimo acumulado para chegar a este. */
  minMerit: number;
}

export interface PoliceTrackDef {
  id: PoliceTrackId;
  force: PoliceForce;
  /** Nome da carreira na UI ("Soldado da Polícia Militar"). */
  label: string;
  /** `concurso` = concurso público aberto; `interno` = só para quem já é da corporação (CFO). */
  entry: 'concurso' | 'interno';
  ageRange: [number, number];
  education: EducationLevel;
  /** Diploma exigido (delegado: Direito). */
  degree?: readonly string[];
  /** Taxa de inscrição (R$). */
  fee: number;
  /** Notas de corte das etapas (0–100). */
  cut: { prova: number; taf: number; psico: number };
  ranks: readonly PoliceRankDef[];
  /** Nome da formação ("Curso de Formação de Soldados"). */
  course: string;
  /** Lotações possíveis ({n} = número). */
  postings: readonly string[];
}

export interface SpecialUnitDef {
  force: PoliceForce;
  name: string;
  course: string;
  minServiceYears: number;
  minAthletic: number;
  minShooting: number;
  minHealth: number;
  /** Bônus de salário na unidade (fração). */
  salaryBonus: number;
}

export type ShootoutTactic = 'avancar' | 'abrigar' | 'negociar' | 'recuar';
export type ShootoutOutcome = 'preso' | 'fuga' | 'colega_ferido' | 'ferido' | 'morte';
export type CaseOutcome = 'resolvido' | 'arquivado' | 'errado';

export interface PoliceCaseDef {
  id: string;
  /** Nome curto do caso ("o furto de carga"). */
  label: string;
}

export interface PoliceContent {
  tracks: readonly PoliceTrackDef[];
  special: readonly SpecialUnitDef[];
  /** Id do `JobDef` que representa cada força no `economy.job`. */
  jobIds: Record<PoliceForce, string>;
  academyName: string;
  /** Salário mínimo de referência (o mesmo dos empregos). */
  minimumWage: number;
  /** Cursos de aperfeiçoamento (ação "Fazer curso"). */
  courses: readonly string[];
  /** Casos da Polícia Civil (investigação encadeada em eventos). */
  cases: readonly PoliceCaseDef[];
  /** Textos curtos (não gráficos) do resultado da troca de tiro. */
  shootoutText: Record<ShootoutOutcome, readonly string[]>;
  /** Fim de investigação; `{caso}` = rótulo do caso. */
  caseText: Record<CaseOutcome, readonly string[]>;
  /** Eventos das 3 etapas do curso de seleção da força especial. */
  specialEvents: readonly [string, string, string];
  /** Textos do curso: reprovação/desistência por etapa e aprovação (`{unidade}`). */
  specialText: { fail: readonly string[]; pass: string };
}

export type ExamStage = 'prova' | 'taf' | 'saude' | 'psico' | 'social';

export interface ExamResult {
  year: number;
  age: number;
  track: PoliceTrackId;
  passed: boolean;
  /** Etapa em que reprovou (null = aprovado). */
  failedAt: ExamStage | null;
}

export interface NotableEntry {
  age: number;
  text: string;
}

export interface PoliceCareer {
  force: PoliceForce;
  track: PoliceTrackId;
  /** Índice do posto em `track.ranks`. */
  rank: number;
  stage: PoliceStage;
  /** Anos na etapa atual (formação/estágio probatório). */
  stageYears: number;
  /** Anos de serviço desde a posse (a formação não conta). */
  serviceYears: number;
  /** Anos no posto atual. */
  rankYears: number;
  merit: number;
  unit: PoliceUnit;
  /** Lotação atual ("3º Batalhão", "12ª Delegacia"). */
  posting: string;
  notable: NotableEntry[];
  /** Processos na corregedoria (acumulados). */
  corregedoria: number;
  specialTries: number;
  /** Idade da posse (entrada na academia). */
  startAge: number;
}

/** Investigação em andamento (placar oculto). */
export interface PoliceCase {
  id: string;
  score: number;
  step: number;
}

export interface PoliceState {
  /** Tiro, 0–100 (oculto). */
  shooting: number;
  /** Investigação em andamento (Polícia Civil; opcional na v15). */
  case?: PoliceCase | null;
  career: PoliceCareer | null;
  exams: ExamResult[];
  /** Carreiras anteriores (exoneração, aposentadoria). */
  past: { force: PoliceForce; track: PoliceTrackId; rank: number; until: number; reason: 'exoneracao' | 'pedido' | 'demissao' | 'aposentadoria' }[];
}

export function emptyPolice(): PoliceState {
  return { shooting: 0, career: null, exams: [], past: [] };
}
