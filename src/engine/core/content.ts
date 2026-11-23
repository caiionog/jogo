import type { CrimeContent } from '../crime/types';
import type { PoliceContent } from '../police/types';
import type { VenueDef } from '../lifeStages/nightlife';
import type { ExchangeProgramDef, SportsClubDef } from '../lifeStages/sportsClub';
import type { CollegeContent } from '../lifeStages/college';
import type { Effects } from './effects';
import type { GameEvent } from '../events/types';
import type { ClubId, SchoolStage } from './state';
import type { FightingContent } from '../fighting/types';
import type { RelationshipsContent } from '../relationships/types';
import type { EconomyContent } from '../economy/types';
import type { GeoContent } from '../geo/types';
import type { OutfitDef } from '../character/appearance/outfits';
import type { HealthContent } from '../health/types';
import type { LegacyContent } from '../legacy/types';
import type { AchievementDef } from '../meta/types';
import type { LimitsConfig } from '../lifeStages/sessions';
import type { LuckConfig, TalentDef } from '../character/talents';

/** Risco de uma ação: efeitos ADICIONAIS aplicados com probabilidade `chance`. */
export interface ActionRisk {
  chance: number;
  effects?: Effects;
  logText: string;
}

export type ActionCategory = 'vida' | 'escola';

/** Atividade (estudar, sair...). Sem limite, mas cada repetição no ano rende menos. Definida como dado em src/content. */
export interface ActionDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
  category: ActionCategory;
  minAge: number;
  maxAge?: number;
  requires?: {
    /** Exige estar matriculado em uma escola. */
    enrolled?: boolean;
    schoolStages?: SchoolStage[];
    /** Exige estar cursando a faculdade. */
    college?: boolean;
  };
  effects: Effects;
  /** Variação aleatória (+0..variance) somada a cada atributo positivo dos efeitos. */
  variance?: number;
  /** Textos possíveis para o log (um é sorteado). */
  logTexts: string[];
  risk?: ActionRisk;
}

/** Clube ou time escolar. */
export interface ClubDef {
  id: ClubId;
  label: string;
  emoji: string;
  /** Fase escolar mínima para participar. */
  minStage: SchoolStage;
  /** Clubes de luta alimentam a carreira de luta (Etapa 3). */
  combat: boolean;
  joinText: string;
  joinEffects: Effects;
  /** Aplicado no fim de cada ano letivo em que o personagem participou. */
  yearlyEffects: Effects;
}

export interface NamePools {
  /**
   * Nomes por década de nascimento e sexo (IBGE, Censo 2010): [nome, frequência]. Sem eles, usa `male`/`female`.
   * Chave: década ('1930'…'2000').
   */
  byDecade?: Readonly<Record<'M' | 'F', Readonly<Record<string, readonly (readonly [string, number])[]>>>>;
  /** Nomes por região e década (variação regional). */
  byRegion?: Readonly<Record<string, Readonly<Record<'M' | 'F', Readonly<Record<string, readonly (readonly [string, number])[]>>>>>>;
  male: readonly string[];
  female: readonly string[];
  surnames: readonly string[];
  publicSchoolPrefixes: readonly string[];
  privateSchoolPrefixes: readonly string[];
  schoolNames: readonly string[];
}

/**
 * Pacote de conteúdo injetado na engine. A engine não importa src/content diretamente:
 * recebe este objeto, o que facilita testes com conteúdo sob medida.
 */
export interface GameContent {
  actions: readonly ActionDef[];
  events: readonly GameEvent[];
  /** Geografia do Brasil: UFs, cidades, cor ou raça do Censo 2022 (Etapa 7). */
  geo: GeoContent;
  clubs: readonly ClubDef[];
  names: NamePools;
  fighting: FightingContent;
  relationships: RelationshipsContent;
  economy: EconomyContent;
  health: HealthContent;
  legacy: LegacyContent;
  achievements: readonly AchievementDef[];
  /** Catálogo de roupas do busto (Etapa 7). */
  outfits: readonly OutfitDef[];
  /** Limites anuais: sessões de treino e retorno decrescente (release 0.0.1). */
  limits: LimitsConfig;
  /** Talentos de nascimento e limites da sorte (release 0.0.1). */
  talents: readonly TalentDef[];
  luck: LuckConfig;
  /** Faculdade: exame, instituições e cursos (release 0.0.1). */
  college: CollegeContent;
  /** Clubes esportivos e programas de intercâmbio (release 0.0.1). */
  sportsClubs: readonly SportsClubDef[];
  exchangePrograms: readonly ExchangeProgramDef[];
  /** Locais da vida noturna (release 0.0.1). */
  venues: readonly VenueDef[];
  /** Carreira policial: trilhas, postos, forças especiais (release 0.0.2). */
  police: PoliceContent;
  /** Delitos, planejamento e instituições fictícias (release 0.0.2). */
  crime: CrimeContent;
}
