import { rollTalents, talentRng } from '../character/talents';
import { npcAppearance } from '../character/appearance/derive';
import type { Appearance } from '../character/appearance/genes';
import { lookRng, randomAppearance, ufOrDefault } from '../character/appearance/inherit';
import { composeName, pickFirstName } from '../character/names';
import { ufDef } from '../geo';
/** Pessoas e relações: criação, consulta, histórico e limite de pessoas ativas. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState, Sex } from '../core/state';
import { appendLog } from '../core/stats';
import type { ArchivedPerson, CivilStatus, Person, RelType, Relation, RelationshipsState, TraitId } from './types';

export const MAX_ACTIVE_PEOPLE = 40;
export const MAX_ARCHIVED = 30;
export const MAX_HISTORY = 3;

/** Relações que nunca são arquivadas. */
const PERMANENT: readonly RelType[] = ['pai', 'mae', 'irmao', 'filho', 'conjuge'];

export function emptyRelationships(adultContent = false): RelationshipsState {
  return {
    people: [],
    relations: [],
    archived: [],
    nextPersonId: 1,
    settings: { adultContent, preference: 'any' },
    pregnancy: null,
  };
}

const LABELS: Record<RelType, [string, string]> = {
  pai: ['Pai', 'Pai'],
  mae: ['Mãe', 'Mãe'],
  irmao: ['Irmão', 'Irmã'],
  amigo: ['Amigo', 'Amiga'],
  parceiro: ['Parceiro', 'Parceira'],
  conjuge: ['Marido', 'Esposa'],
  ex: ['Ex', 'Ex'],
  filho: ['Filho', 'Filha'],
  treinador: ['Treinador', 'Treinadora'],
  rival: ['Rival', 'Rival'],
  colega_treino: ['Colega de treino', 'Colega de treino'],
  avo: ['Avô', 'Avó'],
  professor: ['Professor', 'Professora'],
  conhecido: ['Conhecido', 'Conhecida'],
};

export function relLabel(type: RelType, sex: Sex): string {
  return LABELS[type][sex === 'M' ? 0 : 1];
}

/** Sobrenome da mãe num nome "Nome Mãe Pai" (o penúltimo, se houver 3+ palavras). */
export function motherSurnameOf(full: string): string | undefined {
  const parts = full.trim().split(' ');
  return parts.length >= 3 ? parts[parts.length - 2] : undefined;
}

export function lastName(full: string): string {
  const parts = full.trim().split(' ');
  return parts[parts.length - 1] ?? full;
}

export function firstName(full: string): string {
  return full.trim().split(' ')[0] ?? full;
}

export function getPerson(state: GameState, id: string | undefined): Person | undefined {
  return id ? state.relationships.people.find((p) => p.id === id) : undefined;
}

export function getRelation(state: GameState, id: string | undefined): Relation | undefined {
  return id ? state.relationships.relations.find((r) => r.personId === id) : undefined;
}

/** Pares (pessoa, relação) filtrados por tipo. */
export function relationsOf(state: GameState, types?: readonly RelType[], aliveOnly = true): { person: Person; rel: Relation }[] {
  const out: { person: Person; rel: Relation }[] = [];
  for (const rel of state.relationships.relations) {
    if (types && !types.includes(rel.type)) continue;
    const person = getPerson(state, rel.personId);
    if (!person || (aliveOnly && !person.alive)) continue;
    out.push({ person, rel });
  }
  return out;
}

/** Parceiro(a) romântico(a) atual (ficando, namorando, noivos ou casados). */
export function currentPartner(state: GameState): { person: Person; rel: Relation } | undefined {
  const all = partners(state);
  // o parceiro principal: cônjuge, depois quem não é caso escondido, depois qualquer um
  return all.find((x) => x.rel.type === 'conjuge') ?? all.find((x) => !x.rel.romance?.secret) ?? all[0];
}

/** Todos os romances em andamento (release 0.0.4: pode haver mais de um entre adultos). */
export function partners(state: GameState): { person: Person; rel: Relation }[] {
  return relationsOf(state, ['parceiro', 'conjuge']).filter((x) => !!x.rel.romance);
}

/**
 * Como começa um romance novo: livre (sem ninguém, ou todos os parceiros atuais combinaram relação aberta), como
 * caso escondido (adulto que já tem alguém) ou bloqueado (menor de idade com parceiro).
 */
export function newRomanceMode(state: GameState): 'free' | 'secret' | 'blocked' {
  const all = partners(state).filter((x) => !x.rel.romance?.secret);
  if (!all.length) return 'free';
  if (state.character.age < 18) return 'blocked';
  return all.every((x) => x.rel.romance?.open) ? 'free' : 'secret';
}

/** Romance inicial ("ficando") conforme `newRomanceMode`; null se bloqueado. */
export function startRomance(state: GameState): Relation['romance'] | null {
  const mode = newRomanceMode(state);
  if (mode === 'blocked') return null;
  return { stage: 'ficando', since: state.character.age, ...(mode === 'secret' ? { secret: true } : {}) };
}

export function civilStatus(state: GameState): CivilStatus {
  const p = currentPartner(state);
  if (p?.rel.romance) {
    const stage = p.rel.romance.stage;
    return stage === 'casados' ? 'casado' : stage === 'noivos' ? 'noivo' : stage;
  }
  return state.flags.divorciado ? 'divorciado' : 'solteiro';
}

export function childrenOf(state: GameState): { person: Person; rel: Relation }[] {
  return relationsOf(state, ['filho']);
}

export interface NewPersonOptions {
  /** Talentos dos pais (herança com chance maior). */
  parentTalents?: readonly (readonly string[])[];
  sex?: Sex;
  age: number;
  /** Sobrenome do pai (o último do nome). */
  surname?: string;
  /** Sobrenome da mãe (vem antes do do pai). */
  motherSurname?: string;
  name?: string;
  looks?: number;
  smarts?: number;
  health?: number;
  athletic?: number;
  job?: string;
  npcId?: string;
  traits?: TraitId[];
  flags?: Person['flags'];
  /** Aparência herdada/definida; sem ela, sorteada pela cor ou raça da UF atual do personagem. */
  appearance?: Appearance;
}

export function randomTraits(rng: Rng, content: GameContent, n = rng.int(2, 3)): TraitId[] {
  const pool = content.relationships.traits.map((t) => t.id);
  const out: TraitId[] = [];
  while (out.length < n && pool.length) {
    const i = rng.int(0, pool.length - 1);
    out.push(pool[i] as TraitId);
    pool.splice(i, 1);
  }
  return out;
}

/** Cria uma pessoa (sem relação) e devolve o estado atualizado e a pessoa. */
export function createPerson(state: GameState, rng: Rng, content: GameContent, o: NewPersonOptions): [GameState, Person] {
  const sex: Sex = o.sex ?? (rng.chance(0.5) ? 'M' : 'F');
  // nome pela década de nascimento e pela região da UF atual (Etapa 7)
  const regiao = ufDef(content.geo, state.character.uf)?.regiao;
  const first = pickFirstName(rng, content.names, sex, state.year - o.age, regiao);
  const surname = o.surname ?? rng.pick(content.names.surnames);
  const person: Person = {
    id: `p${state.relationships.nextPersonId}`,
    name: o.name ?? composeName(first, o.motherSurname, surname),
    sex,
    age: o.age,
    alive: true,
    looks: o.looks ?? rng.int(25, 90),
    smarts: o.smarts ?? rng.int(25, 90),
    health: o.health ?? rng.int(70, 100),
    athletic: o.athletic ?? rng.int(20, 80),
    traits: o.traits ?? randomTraits(rng, content),
    ...(o.job ? { job: o.job } : {}),
    ...(o.npcId ? { npcId: o.npcId } : {}),
    flags: o.flags ?? {},
    // talentos por RNG derivado (não mexe no rngState principal)
    talents: rollTalents(talentRng(state.seed, `p${state.relationships.nextPersonId}`), content, o.parentTalents),
    // lutador do elenco: a mesma aparência derivada do busto do ranking; senão, pela UF atual do personagem
    appearance: o.appearance ?? (o.npcId ? npcAppearance(state.seed, { id: o.npcId }, sex, content) : randomAppearance(lookRng(rng), ufOrDefault(content.geo, state.character.uf), sex)),
  };
  const rs = state.relationships;
  return [{ ...state, relationships: { ...rs, people: [...rs.people, person], nextPersonId: rs.nextPersonId + 1 } }, person];
}

export function addRelation(state: GameState, personId: string, type: RelType, affection: number, extra: Partial<Relation> = {}): GameState {
  const rel: Relation = {
    personId,
    type,
    affection: Math.max(0, Math.min(100, Math.round(affection))),
    since: state.character.age,
    history: [],
    interactedYear: state.year,
    revealed: ['pai', 'mae', 'irmao', 'filho'].includes(type) ? 3 : 0,
    ...extra,
  };
  const rs = state.relationships;
  return { ...state, relationships: { ...rs, relations: [...rs.relations.filter((r) => r.personId !== personId), rel] } };
}

export function updateRelation(state: GameState, personId: string, fn: (r: Relation) => Relation): GameState {
  const rs = state.relationships;
  return { ...state, relationships: { ...rs, relations: rs.relations.map((r) => (r.personId === personId ? fn(r) : r)) } };
}

export function updatePerson(state: GameState, personId: string, fn: (p: Person) => Person): GameState {
  const rs = state.relationships;
  return { ...state, relationships: { ...rs, people: rs.people.map((p) => (p.id === personId ? fn(p) : p)) } };
}

export function withHistory(rel: Relation, text: string): Relation {
  return { ...rel, history: [...rel.history, text].slice(-MAX_HISTORY) };
}

export function changeAffection(state: GameState, personId: string, delta: number, note?: string): GameState {
  return updateRelation(state, personId, (r) => {
    const next = { ...r, affection: Math.max(0, Math.min(100, Math.round(r.affection + delta))) };
    return note ? withHistory(next, note) : next;
  });
}

/** Remove a pessoa da lista ativa, guardando um resumo de uma linha. */
export function archivePerson(state: GameState, personId: string, note: string): GameState {
  const person = getPerson(state, personId);
  const rel = getRelation(state, personId);
  if (!person || !rel) return state;
  const rs = state.relationships;
  const friend = person.alive && (rel.type === 'amigo' || rel.type === 'colega_treino');
  const entry: ArchivedPerson = { name: person.name, type: rel.type, note, ...(friend ? { person, endedAge: state.character.age } : {}) };
  return {
    ...state,
    relationships: {
      ...rs,
      people: rs.people.filter((p) => p.id !== personId),
      relations: rs.relations.filter((r) => r.personId !== personId),
      archived: [...rs.archived, entry].slice(-MAX_ARCHIVED),
    },
  };
}

/** Importância para decidir quem arquivar primeiro (menor = arquiva antes). */
function importance(state: GameState, p: Person, r: Relation): number {
  if (PERMANENT.includes(r.type) || r.romance) return Infinity;
  if (!p.alive) return -100 + (p.deathAge ?? 0) - state.character.age;
  const base = r.type === 'treinador' ? 40 : r.type === 'ex' ? -20 : r.type === 'rival' ? 10 : 0;
  return base + r.affection;
}

/** Mantém no máximo MAX_ACTIVE_PEOPLE pessoas ativas. */
export function enforcePeopleLimit(state: GameState): GameState {
  let s = state;
  while (s.relationships.people.length > MAX_ACTIVE_PEOPLE) {
    const ranked = s.relationships.relations
      .map((r) => ({ r, p: getPerson(s, r.personId) }))
      .filter((x): x is { r: Relation; p: Person } => !!x.p)
      .map((x) => ({ ...x, score: importance(s, x.p, x.r) }))
      .filter((x) => x.score !== Infinity)
      .sort((a, b) => a.score - b.score);
    const victim = ranked[0];
    if (!victim) break;
    s = archivePerson(s, victim.p.id, victim.p.alive ? 'Vocês perderam o contato.' : `Faleceu aos ${victim.p.deathAge ?? victim.p.age} anos.`);
  }
  // pessoas sem relação (não deveria acontecer) são descartadas
  const ids = new Set(s.relationships.relations.map((r) => r.personId));
  if (s.relationships.people.some((p) => !ids.has(p.id))) {
    s = { ...s, relationships: { ...s.relationships, people: s.relationships.people.filter((p) => ids.has(p.id)) } };
  }
  return s;
}

export function logRel(state: GameState, text: string): GameState {
  return appendLog(state, text);
}

/** Altera as configurações da vida (conteúdo adulto, interesse amoroso). */
export function setRelationshipSettings(state: GameState, patch: Partial<RelationshipsState['settings']>): GameState {
  return { ...state, relationships: { ...state.relationships, settings: { ...state.relationships.settings, ...patch } } };
}

export const STAGE_LABEL = { ficando: 'Ficando', namorando: 'Namorando', noivos: 'Noivos', casados: 'Casados' } as const;
