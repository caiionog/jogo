/**
 * Crime e justiça (release 0.0.2). Fases 4–7 preenchem as regras; a fase 2 cria o formato (save v15).
 * `wanted` e `rep` são OCULTOS (a UI mostra só pistas).
 */

export type CrimeTier = 'leve' | 'medio' | 'grave';

/** Registro na ficha criminal. `passagem` = detido sem condenação; `condenacao` = sentença transitada. */
export interface RecordEntry {
  age: number;
  year: number;
  /** Id do delito ou motivo ('briga', 'corrupcao'…). */
  crime: string;
  kind: 'passagem' | 'condenacao';
  /** Pena em anos (condenação). */
  years?: number;
}

export interface CrimeState {
  /** Nível de procurado 0–100 (oculto). */
  wanted: number;
  /** Reputação no crime 0–100 (oculta). */
  rep: number;
  /** Quanto do dinheiro é "sujo" (R$, nunca acima do saldo). */
  dirty: number;
  /** Ficha criminal (adulto, permanente). */
  record: RecordEntry[];
  /** Passagens de 12–17 anos (não contam depois dos 18). */
  juvenile: RecordEntry[];
  /** Facção (fase 5). */
  faction: { id: string; rank: number; years: number; debt: number } | null;
  /** Tráfico (fase 5). */
  trafficking: { level: 'pequeno' | 'medio' | 'grande'; years: number } | null;
  /** Delito grave sendo planejado (opcional na v15). */
  plan?: CrimePlan | null;
  /** Delitos cometidos na vida (contador). */
  committed?: number;
  /** Total ganho com crime (R$). */
  earned?: number;
}

/** Plano de um delito grave em andamento (etapas abstratas; opcional na v15). */
export interface CrimePlan {
  crimeId: string;
  team?: 'amigos' | 'conhecidos' | 'profissionais';
  /** Qualidade oculta da equipe (0–100). */
  teamQuality?: number;
  target?: 'pequeno' | 'medio' | 'grande';
  time?: 'dia' | 'noite';
}

export interface CrimeDef {
  id: string;
  label: string;
  emoji: string;
  tier: CrimeTier;
  /** 12 (leves) ou 18 (médios e graves). */
  minAge: number;
  /** Chance base de dar certo (0–1). */
  baseSuccess: number;
  /** Ganho em R$ quando dá certo (0 = sem ganho, ex.: pichação). */
  gain: [number, number];
  /** Chances quando dá errado: ser pego, se ferir, morrer. */
  risk: { caught: number; injury: number; death: number };
  wantedGain: number;
  repGain: number;
  /** Reputação no crime mínima para tentar. */
  minCrimeRep?: number;
  /** Delito planejado em etapas (graves). */
  plan?: boolean;
  /** Texto curto do sucesso e do fracasso (sem método; `{o/a}`). */
  text: { ok: string; fail: string };
}

export interface CrimeContent {
  crimes: readonly CrimeDef[];
  /** Eventos das etapas do planejamento: equipe, alvo, momento, hora H. */
  planEvents: readonly [string, string, string, string];
  /** Evento de suspeita por gastar dinheiro sujo. */
  suspicionEventId: string;
  /** Instituições fictícias. */
  places: { juvenile: string; reentry: string };
}

export function emptyCrime(): CrimeState {
  return { wanted: 0, rep: 0, dirty: 0, record: [], juvenile: [], faction: null, trafficking: null };
}

/** Pena em andamento (fase 7). */
export interface PrisonState {
  facility: string;
  regime: 'fechado' | 'semiaberto' | 'aberto';
  sentence: number;
  served: number;
  remission: number;
  behavior: number;
  protection: boolean;
  wing: 'comum' | 'especial';
  kind: 'adulto' | 'internacao';
}
