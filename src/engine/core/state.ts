import type { HealthState } from '../health/types';
import type { Dynasty, LifeEnding } from '../legacy/types';
import type { ActiveFight, FighterProfile, World } from '../fighting/types';
import type { RelationshipsState } from '../relationships/types';
import type { EconomyState } from '../economy/types';

/** Tipos do estado do jogo. Tudo aqui deve ser JSON puro (sem classes, Date, Map, funções). */

export const STAT_KEYS = [
  'health',
  'happiness',
  'intelligence',
  'looks',
  'strength',
  'fitness',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export type Sex = 'M' | 'F';

export interface Character {
  name: string;
  sex: Sex;
  age: number;
  birthYear: number;
  country: string;
  city: string;
  /** Condição financeira da família (0–100). Influencia o tipo de escola. */
  familyWealth: number;
  heightCm: number;
  weightKg: number;
  /** Altura adulta-alvo (sorteada ao nascer). */
  adultHeightCm: number;
  /** Biotipo: −2 (magro) … +2 (largo). Ajusta o IMC. */
  build: number;
  stats: Stats;
  /** Preenchido na morte (Etapa 6). */
  death?: { age: number; year: number; cause: string };
}

export interface Energy {
  current: number;
  max: number;
  /** Energia do ano já comprometida com o emprego (Etapa 5). */
  reserved?: number;
}

export type FlagValue = boolean | number | string;

export interface LogYear {
  age: number;
  year: number;
  entries: string[];
}

/** Variáveis de texto de um evento ({colega}, {professor}...), sorteadas na seleção. */
export type EventVars = Record<string, string>;

export type EventSource = 'random' | 'auto' | 'followUp' | 'action';

export interface PendingEvent {
  eventId: string;
  vars?: EventVars;
  source?: EventSource;
}

/** Evento encadeado agendado para quando o personagem atingir `dueAge`. */
export interface ScheduledEvent {
  eventId: string;
  dueAge: number;
  vars?: EventVars;
}

// ---------------------------------------------------------------------------
// Escola
// ---------------------------------------------------------------------------

export type SchoolStage = 'pre' | 'fund1' | 'fund2' | 'medio';
export type SchoolType = 'publica' | 'particular';
export type ClubId = string;

export interface School {
  name: string;
  type: SchoolType;
}

export interface Enrollment {
  school: School;
  /** 0–14: Pré I–III (0–2), 1º–9º ano (3–11), 1º–3º EM (12–14). */
  grade: number;
  /** Nota média do ano letivo (0–100). */
  average: number;
  /** Disciplina/comportamento (0–100). */
  discipline: number;
  /** Faltas no ano letivo. */
  absences: number;
  popularity: number;
  club: ClubId | null;
  /** Suspensões acumuladas nesta escola. */
  suspensions: number;
}

export interface SchoolYearRecord {
  age: number;
  year: number;
  school: string;
  gradeLabel: string;
  final: number;
  passed: boolean;
}

export interface SchoolYearResult {
  final: number;
  passed: boolean;
  honors: boolean;
  graduated: boolean;
  expelled: boolean;
}

export interface Education {
  current: Enrollment | null;
  history: SchoolYearRecord[];
  /** Resultado do último fim de ano letivo (null se não estudou no ano que passou). */
  lastResult: SchoolYearResult | null;
  repeats: number;
  expulsions: number;
  graduated: boolean;
}

export interface GameState {
  version: number;
  seed: string;
  rngState: number;
  /** Ano corrente no calendário do jogo. */
  year: number;
  character: Character;
  money: number;
  energy: Energy;
  flags: Record<string, FlagValue>;
  /** Ids de eventos que já aconteceram (para `once`). */
  firedEvents: string[];
  /** Eventos sorteados aguardando decisão do jogador. */
  pendingEvents: PendingEvent[];
  /** Eventos encadeados agendados para anos futuros. */
  scheduledEvents: ScheduledEvent[];
  education: Education;
  fighter: FighterProfile;
  world: World;
  /** Luta em andamento (máquina de estados) — bloqueia o resto do jogo. */
  activeFight: ActiveFight | null;
  /** Família, amigos, amores, filhos, treinador e rivais (Etapa 4). */
  relationships: RelationshipsState;
  /** Dinheiro, extrato, emprego, bens, empresas, banco (Etapa 5). */
  economy: EconomyState;
  /** Histórico ano a ano. O último item é o ano atual. */
  log: LogYear[];
  alive: boolean;
  /** Lesões, sequelas, dano cerebral (oculto), doenças e hábitos (Etapa 6). */
  health: HealthState;
  /** Contadores para conquistas (KO no rival, cirurgias, empresas abertas...). */
  feats: Record<string, number>;
  /** Família jogada ao longo das gerações (Etapa 6). */
  dynasty: Dynasty;
  /** Fim da vida (obituário, nota, partilha) — preenchido na morte. */
  ending: LifeEnding | null;
}

export const STATE_VERSION = 6;
