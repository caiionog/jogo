import type { Appearance } from '../character/appearance/genes';
/** Relacionamentos (Etapa 4). Tudo JSON puro. */
import type { FlagValue, Sex } from '../core/state';

export type TraitId = string;

export type RelType =
  | 'pai'
  | 'mae'
  | 'irmao'
  | 'amigo'
  | 'parceiro'
  | 'conjuge'
  | 'ex'
  | 'filho'
  | 'treinador'
  | 'rival'
  | 'colega_treino'
  | 'avo'
  /** Professor(a) ou instrutor(a) de faculdade, academia ou curso (release 0.0.1). Professores da ESCOLA nunca são alvo de romance. */
  | 'professor'
  /** Conhecido(a) de fora do círculo próximo: detido por você, membro de facção, colega de cela (release 0.0.2). */
  | 'conhecido';

export type RomanceStage = 'ficando' | 'namorando' | 'noivos' | 'casados';
export type CivilStatus = 'solteiro' | 'ficando' | 'namorando' | 'noivo' | 'casado' | 'divorciado';
export type PartnerPreference = 'M' | 'F' | 'any';

/** Modelo único de pessoa (NPC) — família, amigos, amores, filhos, treinadores, rivais. */
export interface Person {
  id: string;
  /** Talentos de nascimento do NPC (release 0.0.1; filhos herdam com chance maior). */
  talents?: string[];
  name: string;
  sex: Sex;
  age: number;
  alive: boolean;
  deathAge?: number;
  /** Atributos resumidos (0–100). */
  looks: number;
  smarts: number;
  health: number;
  athletic: number;
  traits: TraitId[];
  job?: string;
  /** Referência a um lutador NPC do elenco (Etapa 3), sem duplicar habilidades. */
  npcId?: string;
  /** Patrimônio (inteiro, R$) — pais, para herança e "pedir dinheiro" (Etapa 5). */
  wealth?: number;
  /** Genes de aparência, cor ou raça e barba (Etapa 7) — só aparência, nunca mecânica. */
  appearance?: Appearance;
  flags: Record<string, FlagValue>;
}

export interface Relation {
  personId: string;
  type: RelType;
  affection: number;
  /** Idade do personagem quando a relação começou. */
  since: number;
  /** Últimos acontecimentos (no máximo 3). */
  history: string[];
  /** Ano da última interação (para o decaimento). */
  interactedYear: number;
  /** Quantos traços o personagem já conhece. */
  revealed: number;
  romance?: { stage: RomanceStage; since: number };
}

export interface ArchivedPerson {
  name: string;
  type: RelType;
  note: string;
}

export interface Pregnancy {
  partnerId: string;
  dueYear: number;
  adoption?: boolean;
}

export interface RelationshipsState {
  people: Person[];
  relations: Relation[];
  archived: ArchivedPerson[];
  nextPersonId: number;
  settings: { adultContent: boolean; preference: PartnerPreference };
  pregnancy: Pregnancy | null;
}

export type InteractionKind =
  | 'spend_time'
  | 'talk'
  | 'compliment'
  | 'argue'
  | 'gift'
  | 'ask_money'
  | 'teach_fight'
  | 'date'
  | 'ask_out'
  | 'propose'
  | 'break_up'
  | 'divorce'
  | 'intimacy'
  | 'intimacy_protected'
  | 'try_baby'
  | 'adopt'
  /** Flertar com amizade, colega, treinador(a) ou professor(a) (romântico; faixas de idade de `isValidPartnerAge`). */
  | 'flirt'
  /** Passar a noite juntos (sexual: SÓ com `canHaveSexualContentWith` — os dois 18+ e opção adulta ligada). */
  | 'night_together';

/** Traço de personalidade (conteúdo). */
export interface TraitDef {
  id: TraitId;
  label: string;
  /** Multiplicadores do efeito das ações (1 = normal). */
  actionMods?: Partial<Record<InteractionKind, number>>;
  /** 0–1: chance extra de ciúme/conflito. */
  jealousy: number;
  /** Postura diante da carreira de luta: −1 reprova, 0 neutro, +1 apoia. */
  fightStance: -1 | 0 | 1;
  /** Traços com que combina / não combina (compatibilidade). */
  likes?: TraitId[];
  dislikes?: TraitId[];
}

export interface RelationshipsContent {
  traits: readonly TraitDef[];
  /** Profissões fictícias por faixa de renda. */
  jobs: { low: readonly string[]; mid: readonly string[]; high: readonly string[] };
  hooks: {
    /** Evento disparado quando um pedido de casamento é aceito. */
    weddingEventId?: string;
    /** Evento disparado quando a gravidez é descoberta. */
    pregnancyEventId?: string;
  };
}
