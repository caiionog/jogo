/** Meta-progressão entre vidas (Etapa 6): conquistas, Hall da Fama e estatísticas globais. */

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Descrição oculta até desbloquear. */
  secret?: boolean;
  /** Métrica do registro da engine (`METRICS`). */
  metric: string;
  min?: number;
  max?: number;
  /** Só avaliada na morte (ex.: "nunca se divorciou"). */
  onDeath?: boolean;
}

export interface HallEntry {
  id: string;
  name: string;
  sex: 'M' | 'F';
  generation: number;
  dynasty: string;
  born: number;
  died: number;
  age: number;
  cause: string;
  score: number;
  record: string;
  titles: string[];
  netWorth: number;
  summary: string;
}

export interface MetaSettings {
  /** Narração das lutas: lenta, normal, rápida. */
  fightSpeed: 'lenta' | 'normal' | 'rapida';
  fontScale: 'normal' | 'grande';
  /** Visual dos personagens e ícones (release 0.0.3): cartoon vetorial (padrão) ou pixel art. */
  avatarStyle: 'cartoon' | 'pixel';
}

export interface MetaState {
  version: number;
  achievements: Record<string, { at: string; life: string }>;
  hallOfFame: HallEntry[];
  stats: { lives: number; deaths: number; generations: number; totalYears: number; totalFights: number; bestScore: number };
  settings: MetaSettings;
  /** Explicações de primeira vez já vistas ("Entendi"), por id (release 0.0.1). */
  seenTips: string[];
}

export const META_VERSION = 3;
export const MAX_HALL = 200;

export function emptyMeta(): MetaState {
  return {
    version: META_VERSION,
    achievements: {},
    hallOfFame: [],
    stats: { lives: 0, deaths: 0, generations: 0, totalYears: 0, totalFights: 0, bestScore: 0 },
    settings: { fightSpeed: 'normal', fontScale: 'normal', avatarStyle: 'cartoon' },
    seenTips: [],
  };
}
