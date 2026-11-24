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
  /**
   * Romance. `open`: relação aberta combinada com esta pessoa (release 0.0.4). `secret`: caso escondido dos outros
   * parceiros, que pode ser descoberto. Os dois só existem entre adultos.
   */
  romance?: { stage: RomanceStage; since: number; open?: boolean; secret?: boolean };
}

export interface ArchivedPerson {
  name: string;
  type: RelType;
  note: string;
  /** Ex-amizade (release 0.0.4): a pessoa inteira e a idade do personagem quando se afastaram, para tentar reatar. */
  person?: Person;
  endedAge?: number;
}

export interface Pregnancy {
  partnerId: string;
  dueYear: number;
  adoption?: boolean;
  /** Gravidez de uma noite, fora de um relacionamento (release 0.0.4). */
  casual?: boolean;
}

export interface RelationshipsState {
  people: Person[];
  relations: Relation[];
  archived: ArchivedPerson[];
  nextPersonId: number;
  settings: { adultContent: boolean; preference: PartnerPreference };
  pregnancy: Pregnancy | null;
  /** Último "passar tempo com todos" (release 0.0.3): quem foi, para os eventos de grupo. Opcional na v16. */
  lastGroup?: { year: number; activityId: string; present: string[] } | null;
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
  | 'night_together'
  /** Propor relação aberta (release 0.0.4): os dois adultos, sem caso escondido. */
  | 'propose_open';

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

/** Atividade em grupo com todos os amigos (release 0.0.3). */
export interface GroupActivityDef {
  id: string;
  label: string;
  emoji: string;
  /** Faixa de idade do personagem. */
  minAge: number;
  maxAge: number;
  /** Custo em R$ para o personagem (0 = de graça; criança não paga). */
  cost: number;
  /** Felicidade do personagem (antes do retorno decrescente). */
  happiness: number;
  /** Afeto base com cada amigo presente (os mais próximos ganham mais). */
  affection: number;
  /** Conta como sessão de treino ("treinar juntos"). */
  training?: boolean;
  /** Texto do log (`{n}` = quantos foram). */
  text: string;
}

export interface FriendsContent {
  activities: readonly GroupActivityDef[];
  /** Eventos de grupo (trigger 'followUp') sorteados depois de uma saída em grupo; usam {pessoa} e {pessoa2}. */
  groupEvents: readonly string[];
  /** Chance de um evento de grupo depois da saída. */
  groupEventChance: number;
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
