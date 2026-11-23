/** Tipos do sistema de luta. Tudo JSON puro. */

/**
 * Habilidades de luta OCULTAS (Etapa 8): o jogador nunca vê estes números, só pistas qualitativas.
 * grappling = todo o jogo de agarre (jiu-jitsu, judô, wrestling: quedas, controle, finalização);
 * trocacao = todo o jogo em pé (muay thai, boxe, kickboxing). Release 0.0.1: `jiujitsu` virou `grappling`.
 * O físico é o atributo visível `athletic` (Capacidade atlética); o queixo é derivado (`chinOf`).
 */
export const SKILL_KEYS = ['grappling', 'trocacao'] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];
export type Skills = Record<SkillKey, number>;
/** Mudança em habilidades e físico (efeitos de evento, lesão e sequela): athletic vai para o atributo visível; chin, para o queixo inato. */
export type SkillDelta = Partial<Record<SkillKey | 'athletic' | 'chin', number>>;

/** Rótulo de estilo (só texto na UI): trocador, especialista em chão ou completo. */
export type FightStyle = 'striker' | 'grappler' | 'allround';
export type Strategy = 'pressure' | 'safe' | 'ground';
export type FightRules = 'mma' | 'grappling';
export type FinishMethod = 'KO' | 'TKO' | 'SUB' | 'DOC' | 'DEC';
export type DecisionType = 'unanimous' | 'split' | 'majority' | 'draw';

/** Fotografia de um lutador no momento da luta. */
export interface FighterSnapshot {
  id: string;
  /** Nome curto usado na narração (ex.: "Kauã" ou "Trovão"). */
  name: string;
  fullName: string;
  skills: Skills;
  /** Capacidade atlética (0–100): estamina, força e explosão. */
  athletic: number;
  /** Queixo efetivo no dia da luta (derivado: base inata, idade, dano cerebral, saúde). */
  chin: number;
  /** Vantagem de tamanho (corte de peso agressivo): 0–1. */
  sizeEdge: number;
  /** Estamina inicial (100 normal; menor se falhou o peso). */
  startStamina?: number;
  /** Multiplicadores dos lances decisivos (talento mão pesada/corpo elástico × sorte; release 0.0.1). */
  koMult?: number;
  subMult?: number;
}

export interface FighterLive {
  stamina: number;
  damage: number;
}

export interface RoundStats {
  landed: number;
  power: number;
  takedowns: number;
  control: number;
  subAttempts: number;
  knockdowns: number;
  points: number;
}

export type FightLogKind =
  | 'round_start'
  | 'strike_land'
  | 'strike_heavy'
  | 'strike_miss'
  | 'knockdown'
  | 'ko'
  | 'tko'
  | 'takedown'
  | 'takedown_stuffed'
  | 'guard_pull'
  | 'clinch'
  | 'clinch_break'
  | 'gnp'
  | 'control'
  | 'sub_attempt'
  | 'sub_escape'
  | 'sub_win'
  | 'sweep'
  | 'standup'
  | 'round_end'
  | 'doctor'
  | 'decision'
  | 'draw'
  | 'corner';

export interface FightLogEntry {
  round: number;
  kind: FightLogKind;
  text: string;
  /** Template usado (para não repetir a mesma variação em sequência). */
  raw?: string;
  /** Índice de quem agiu (para a UI colorir). */
  actor?: 0 | 1;
  stamina: [number, number];
  damage: [number, number];
}

export interface FightResult {
  winner: 0 | 1 | null;
  method: FinishMethod;
  decisionType?: DecisionType;
  /** Round em que a luta terminou. */
  round: number;
  /** scorecards[juiz][round] = [pontos A, pontos B]. */
  scorecards: [number, number][][];
  /** Totais por juiz. */
  totals: [number, number][];
}

export interface FightState {
  rules: FightRules;
  rounds: number;
  round: number;
  phase: 'round' | 'break' | 'finished';
  rngState: number;
  fighters: [FighterSnapshot, FighterSnapshot];
  live: [FighterLive, FighterLive];
  position: 'standing' | 'clinch' | 'ground';
  /** Quem está por cima no chão. */
  top: 0 | 1 | null;
  strategy: [Strategy, Strategy];
  /** roundStats[round-1][lutador]. */
  roundStats: [RoundStats, RoundStats][];
  scorecards: [number, number][][];
  log: FightLogEntry[];
  result?: FightResult;
}

/** Textos de narração (conteúdo). Placeholders: {a} quem age, {b} o outro, {golpe}, {finalizacao}. */
export type FightTextPack = Record<FightLogKind, readonly string[]> & {
  strikes: { standing: readonly string[]; clinch: readonly string[]; ground: readonly string[] };
  submissions: readonly string[];
};

export const FIGHT_TEXT_KEYS: readonly FightLogKind[] = [
  'round_start', 'strike_land', 'strike_heavy', 'strike_miss', 'knockdown', 'ko', 'tko', 'takedown',
  'takedown_stuffed', 'guard_pull', 'clinch', 'clinch_break', 'gnp', 'control', 'sub_attempt', 'sub_escape',
  'sub_win', 'sweep', 'standup', 'round_end', 'doctor', 'decision', 'draw', 'corner',
];

// ---------------------------------------------------------------------------
// Carreira, organizações e mundo
// ---------------------------------------------------------------------------

export type Tier = 'kids' | 'amateur' | 'regional' | 'major';
export const TIER_ORDER: readonly Tier[] = ['kids', 'amateur', 'regional', 'major'];
export type Sport = 'mma' | 'bjj' | 'martial_arts';

export interface DivisionDef {
  id: string;
  label: string;
  limitKg: number;
  sex: 'M' | 'F';
}

export interface OrgDef {
  id: string;
  name: string;
  short: string;
  tier: Tier;
  sport: Sport;
  rules: FightRules;
  minAge: number;
  maxAge?: number;
  requirements: {
    minAmateurWins?: number;
    minProWins?: number;
    minReputation?: number;
    minBelt?: number;
    /** Aproveitamento mínimo nas últimas RECENT_PRO_FIGHTS lutas profissionais (fase recente). */
    minProWinRate?: number;
    /** Idade máxima para assinar contrato. */
    maxSigningAge?: number;
  };
  /** Exige contrato (assinado via evento) para lutar. */
  contract: boolean;
  /** Tamanho do ranking (0 = sem ranking/cinturão). */
  rankingSize: number;
  rounds: number;
  titleRounds: number;
  purse: { base: number; win: number; perf: number };
  /** Sessões de treino do ano que o camp de uma luta ocupa. */
  campSessions: number;
  /** Faixa de habilidade dos adversários (NPCs). */
  npcSkill: [number, number];
  reputationGain: number;
  /** Ofertas de luta por ano. */
  offersPerYear: number;
  /** Vitórias seguidas (estando no top 3) para disputar o cinturão. Padrão: TITLE_SHOT_STREAK. */
  titleShotStreak?: number;
}

/** Modalidades treináveis (release 0.0.1). */
export type ModalityId = 'jiujitsu' | 'judo' | 'wrestling' | 'muaythai' | 'boxe' | 'kickboxing';

export interface ModalityDef {
  id: ModalityId;
  label: string;
  emoji: string;
  /** Habilidade oculta que a modalidade desenvolve. */
  skill: SkillKey;
  /** Ganho base por sessão na habilidade. */
  base: number;
  /** Fração do ganho de Capacidade atlética do treino físico que a sessão também dá. */
  athletic: number;
  /** Sistema de graduação (sem = sem graduação: boxe, wrestling, kickboxing). */
  graduation?: string;
  /** Sistema infantil (jiu-jitsu) até `kidsUntil` anos. */
  kidsGraduation?: string;
  kidsUntil?: number;
  sub: string;
}

export interface GradeLevel {
  id: string;
  /** Nome no texto ("faixa azul", "prajied vermelho com ponta azul-clara"). */
  label: string;
  /** Cor principal (avatar). */
  color: string;
  /** Listra no meio da faixa infantil. */
  stripe?: string;
  /** Ponta do prajied. */
  tip?: string;
  minAge: number;
  /** Anos treinados na graduação anterior. */
  minYears: number;
  /** Nível mínimo da habilidade oculta da modalidade. */
  minSkill: number;
  /** Graus possíveis nesta faixa (1 por ano treinado; `degreeEvery` anos por grau). */
  degrees?: number;
  degreeEvery?: number;
}

export interface GraduationSystem {
  id: string;
  label: string;
  kind: 'faixa' | 'prajied';
  /** Federação fictícia (muay thai). */
  federation?: string;
  note: string;
  levels: readonly GradeLevel[];
  /** Transição para o sistema adulto (jiu-jitsu infantil → adulto aos 16). */
  adultAt?: { age: number; system: string; minKidsLevel: string; toLevel: string };
}

/** Graduação do personagem numa modalidade. */
export interface GradeState {
  system: string;
  /** Índice em `levels`. */
  rank: number;
  degree: number;
  /** Anos treinados na graduação atual. */
  years: number;
}

export interface GymDef {
  id: string;
  name: string;
  /** null = existe em qualquer cidade (rede/academia de bairro genérica). */
  city: string | null;
  /** Mensalidade anual (R$), cobrada a partir dos 18 anos. */
  fee: number;
  /** Qualidade do treinador (0–100). */
  coach: number;
  /** Modalidades oferecidas (só dá para treinar uma modalidade numa academia que a ofereça). */
  modalities: readonly ModalityId[];
  minAge: number;
}

export interface CareerRecord {
  wins: number;
  losses: number;
  draws: number;
  winsBy: { KO: number; SUB: number; DEC: number };
  lossesBy: { KO: number; SUB: number; DEC: number };
}

export interface FightHistoryEntry {
  age: number;
  year: number;
  orgId: string;
  opponent: string;
  result: 'W' | 'L' | 'D';
  method: FinishMethod;
  round: number;
  title: boolean;
  /** Luta profissional (liga regional/principal). */
  pro: boolean;
}

export interface TitleHeld {
  orgId: string;
  divisionId: string;
}

export type RetireReason = 'voluntaria' | 'lesao' | 'medica' | 'derrotas';

export interface Retirement {
  age: number;
  reason: RetireReason;
  /** Quantas vezes voltou da aposentadoria. */
  comebacks: number;
}

export interface Npc {
  id: string;
  name: string;
  nickname: string;
  age: number;
  style: FightStyle;
  skills: Skills;
  athletic: number;
  /** Queixo inato (não treinável); o efetivo cai com a idade (`npcChin`). */
  chinBase: number;
  record: { w: number; l: number; d: number };
}

export interface Roster {
  orgId: string;
  divisionId: string;
  npcs: Npc[];
  /** Ids ranqueados em ordem (#1 primeiro), sem o campeão. 'player' é o jogador. */
  ranking: string[];
  champion: string | null;
}

export interface World {
  rosters: Record<string, Roster>;
  nextNpcId: number;
}

export interface Opponent {
  id: string;
  name: string;
  nickname: string;
  style: FightStyle;
  skills: Skills;
  athletic: number;
  chinBase: number;
  /** Idade (adversários do elenco); ausente nos antigos. */
  age?: number;
  record: { w: number; l: number; d: number };
  /** Posição no ranking (1 = #1), 0 = campeão, null = sem ranking. */
  rank: number | null;
}

export type OfferKind = 'regular' | 'title' | 'shortNotice' | 'rival' | 'bjj' | 'kids' | 'farewell';

export interface FightOffer {
  id: string;
  orgId: string;
  divisionId: string;
  kind: OfferKind;
  opponent: Opponent;
  rounds: number;
  rules: FightRules;
  purse: number;
  winBonus: number;
  /** Sessões de treino que o camp ocupa (substituição 1; título +1). */
  campSessions: number;
  title: boolean;
}

export interface ActiveFight {
  offer: FightOffer;
  fight: FightState;
  aggressiveCut: boolean;
  missedWeight: boolean;
  /** Resultado já aplicado ao estado (cartel, dinheiro, ranking). */
  applied: boolean;
  /** Resumo para a tela de resultado. */
  summary?: string;
  earnings?: number;
}

export interface FighterProfile {
  /** Ocultas: nunca aparecem como número na UI. */
  skills: Skills;
  /** Queixo inato (0–100), não treinável. O efetivo é `chinOf(state)`. */
  chinBase: number;
  /** Carga de treino recente (0–1, média móvel anual): deixa o corpo mais definido no avatar. */
  trainingLoad: number;
  /** Treinos no ano corrente (zera na virada). */
  sessionsThisYear: number;
  /** Potencial atlético (0,65–1,35, média 1): multiplica os ganhos de treino. */
  talent: number;
  /** Graduações por modalidade (release 0.0.1; substitui a faixa única de jiu-jitsu). */
  grades: Partial<Record<ModalityId, GradeState>>;
  reputation: number;
  gymId: string | null;
  amateur: CareerRecord;
  pro: CareerRecord;
  bjj: CareerRecord;
  /** Organização com contrato (regional/principal). */
  orgId: string | null;
  titles: TitleHeld[];
  titlesWon: number;
  winStreak: number;
  /** Aposentadoria (Etapa 6). As lesões ficam em `GameState.health`. */
  retired: Retirement | null;
  suspendedYears: number;
  history: FightHistoryEntry[];
  /** Modalidades treinadas no ano (o tempo de graduação só corre nelas). */
  trainedThisYear: ModalityId[];
  offers: FightOffer[];
  nextOfferId: number;
  proDebutAge: number | null;
  majorDebutAge: number | null;
}

/** Conteúdo de luta injetado na engine. */
export interface FightingContent {
  orgs: readonly OrgDef[];
  gyms: readonly GymDef[];
  divisions: readonly DivisionDef[];
  text: FightTextPack;
  nicknames: readonly string[];
  /** Frases do treinador depois do treino, por nível oculto (pista qualitativa; Etapa 8). */
  coachLines?: Record<'grappling' | 'trocacao' | 'fisico' | 'sparring', { low: readonly string[]; mid: readonly string[]; high: readonly string[] }>;
  /** Modalidades e sistemas de graduação (release 0.0.1). */
  modalities: readonly ModalityDef[];
  graduations: readonly GraduationSystem[];
  hooks: {
    /** Evento disparado quando o jogador falha o corte de peso. */
    weightMissEventId?: string;
    /** Evento de despedida aberto pela ação "Aposentar" (Etapa 6). */
    farewellEventId?: string;
    /** Evento "hora de parar?" depois de muitas derrotas seguidas. */
    losingStreakEventId?: string;
    /** Evento do médico recomendando parar (sequela grave). */
    doctorRetireEventId?: string;
  };
}
