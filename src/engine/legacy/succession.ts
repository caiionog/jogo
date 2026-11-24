import { emptyPopulation } from '../population/population';
import { emptyPolice } from '../police/types';
import { emptyCrime } from '../crime/types';
import { emptyCollege } from '../lifeStages/college';
import { rollLuck, talentRng } from '../character/talents';
import { inheritAppearance, lookRng } from '../character/appearance/inherit';
import { defaultWardrobe } from '../character/appearance/outfits';
import { coupleSurnames } from '../relationships/romance';
/**
 * Legado (Etapa 6): continuar a história como um dos filhos vivos.
 * O mundo (NPCs, organizações, ranking, ano, seed) continua; a vida é nova (log, eventos `once`, conquistas da vida).
 * O herdeiro recebe a parte dele da partilha: primeiro em bens (casa e academia da família), o resto em dinheiro.
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { Character, GameState, Stats } from '../core/state';
import { STATE_VERSION } from '../core/state';
import { appendLog, clamp } from '../core/stats';
import { createCharacter } from '../character/create';
import { businessValue } from '../economy/business';
import { emptyEconomy, post, toMoney } from '../economy/ledger';
import { bodyFor } from '../fighting/body';
import { leaveRankings } from '../fighting/orgs';
import { baseSkills, newFighterProfile } from '../fighting/profile';
import { bjjRank } from '../fighting/belts';
import type { FighterProfile } from '../fighting/types';
import { emptyHealth } from '../health/types';
import { educationForAge } from '../lifeStages/school';
import { addRelation, createPerson, getPerson, relationsOf } from '../relationships/people';
import { recordMarriage } from '../economy/family';
import type { Person, Relation, RelationshipsState } from '../relationships/types';
import type { Asset, Business, Loan } from '../economy/types';
import type { DynastyMember } from './types';

export type ContinueBlockReason = 'alive' | 'no-ending' | 'not-heir' | 'dead-heir';

export function continueBlockReason(state: GameState, personId: string): ContinueBlockReason | null {
  if (state.alive) return 'alive';
  if (!state.ending) return 'no-ending';
  const heir = state.ending.heirs.find((h) => h.personId === personId && h.canContinue);
  if (!heir) return 'not-heir';
  if (!getPerson(state, personId)?.alive) return 'dead-heir';
  return null;
}

/** Filhos que podem continuar a história. */
export function continuableHeirs(state: GameState) {
  return (state.ending?.heirs ?? []).filter((h) => h.canContinue && getPerson(state, h.personId)?.alive);
}

/** Resumo do falecido para a árvore da dinastia. */
export function dynastyMember(state: GameState, heirName?: string): DynastyMember {
  const c = state.character;
  const f = state.fighter;
  const titles: string[] = [];
  for (let i = 0; i < (state.feats.majorTitles ?? 0); i++) titles.push('Circuito Titã');
  for (let i = 0; i < (state.feats.regionalTitles ?? 0); i++) titles.push('regional');
  return {
    name: c.name,
    sex: c.sex,
    gen: state.dynasty.generation,
    born: c.birthYear,
    died: c.death?.year ?? state.year,
    ageAtDeath: c.death?.age ?? c.age,
    cause: c.death?.cause ?? state.ending?.cause ?? 'causas naturais',
    score: state.ending?.score ?? 0,
    record: `${f.pro.wins}-${f.pro.losses}-${f.pro.draws}`,
    titles,
    belt: bjjRank(state),
    peakRep: Math.max(state.feats.peakRep ?? 0, f.reputation),
    children: relationsOf(state, ['filho'], false).map((r) => r.person.name),
    ...(heirName ? { heir: heirName } : {}),
  };
}

function statsFromPerson(p: Person, rng: Rng, age: number): Stats {
  const grown = Math.min(1, Math.max(0.15, age / 18));
  return {
    health: clamp(p.health + rng.int(-3, 3)),
    happiness: clamp(45 + rng.int(-5, 10)),
    intelligence: clamp(p.smarts + rng.int(-4, 4)),
    looks: clamp(p.looks + rng.int(-3, 3)),
    athletic: clamp(Math.round(p.athletic * 0.65 * grown) + rng.int(0, 5)),
  };
}

/** Bens e empresas que vão para o herdeiro (dentro da parte dele): casa → academia → outros. */
function pickInheritedItems(state: GameState, budget: number): { assets: Asset[]; businesses: Business[]; loans: Loan[]; used: number } {
  const assets: Asset[] = [];
  const businesses: Business[] = [];
  const loans: Loan[] = [];
  let used = 0;
  const loanOf = (a: Asset) => (a.loanId ? state.economy.loans.find((l) => l.id === a.loanId) : undefined);
  const net = (a: Asset) => a.value - (loanOf(a)?.balance ?? 0);
  type Item = { kind: 'asset'; a: Asset; v: number; prio: number } | { kind: 'biz'; b: Business; v: number; prio: number };
  const items: Item[] = [
    ...state.economy.assets.map((a) => ({ kind: 'asset' as const, a, v: net(a), prio: a.home ? 0 : a.kind === 'imovel' ? 2 : 3 })),
    ...state.economy.businesses.map((b) => ({ kind: 'biz' as const, b, v: businessValue(b), prio: b.defId === 'academia' ? 1 : 2 })),
  ].sort((x, y) => x.prio - y.prio);
  for (const it of items) {
    if (it.v > budget - used || it.v < 0) continue;
    used += it.v;
    if (it.kind === 'asset') {
      assets.push({ ...it.a, home: false, rented: false });
      const l = loanOf(it.a);
      if (l) loans.push(l);
    } else businesses.push({ ...it.b, dedicatedYear: -1, manager: true });
  }
  return { assets, businesses, loans, used };
}

/**
 * Herdeiro adulto já tem a própria vida: pode ser casado(a) e ter filhos (idades coerentes).
 * Sem isso, quem assume aos 45 anos não teria como continuar a dinastia.
 */
function heirOwnFamily(state: GameState, rng: Rng, content: GameContent): GameState {
  let s = state;
  const age = s.character.age;
  if (age < 24) return s;
  if (!rng.chance(Math.min(0.75, (age - 22) * 0.07))) return s;
  const pref = s.relationships.settings.preference;
  const spouseSex = pref === 'any' ? (rng.chance(0.5) ? 'M' : 'F') : pref;
  const since = Math.max(22, age - rng.int(1, Math.min(15, age - 22)));
  let spouse: Person;
  [s, spouse] = createPerson(s, rng, content, { age: Math.max(18, age + rng.int(-4, 4)), sex: spouseSex });
  s = addRelation(s, spouse.id, 'conjuge', rng.int(55, 85), { romance: { stage: 'casados', since }, since });
  s = { ...s, flags: { ...s.flags, casado: true } };
  s = recordMarriage(s, spouse.id);
  // filhos nascidos depois do casamento (até 3)
  const span = Math.min(age, 45) - since;
  const n = span <= 0 ? 0 : rng.int(0, Math.min(3, Math.floor(span / 3) + 1));
  for (let i = 0; i < n; i++) {
    const kidAge = age - (since + rng.int(1, Math.max(1, span)));
    if (kidAge < 0) continue;
    let kid: Person;
    const [fatherSurname, motherSurname] = coupleSurnames(s.character.sex, s.character.name, spouse);
    const kidSex = rng.chance(0.5) ? 'M' : 'F';
    const look = spouse.appearance ? (s.character.sex === 'M' ? inheritAppearance(lookRng(rng), s.character.appearance, spouse.appearance, kidSex) : inheritAppearance(lookRng(rng), spouse.appearance, s.character.appearance, kidSex)) : undefined;
    [s, kid] = createPerson(s, rng, content, { age: kidAge, sex: kidSex, surname: fatherSurname, ...(motherSurname ? { motherSurname } : {}), ...(look ? { appearance: look } : {}) });
    s = addRelation(s, kid.id, 'filho', rng.int(65, 90), { since: age - kidAge });
  }
  return s;
}

/**
 * Continua como filho(a): novo personagem com a idade e os atributos que já tinha, relações recriadas do ponto
 * de vista dele (pai/mãe falecido, outro genitor, irmãos, avós, treinador e rivais), herança, dinastia +1.
 */
export function continueAsChild(state: GameState, personId: string, content: GameContent): GameState {
  if (continueBlockReason(state, personId) !== null) return state;
  const heir = state.ending!.heirs.find((h) => h.personId === personId)!;
  const child = getPerson(state, personId)!;
  const rng = createRng(state.rngState);
  const old = state.character;
  const age = child.age;
  const gen = state.dynasty.generation + 1;

  // personagem (corpo sorteado pelo RNG; atributos vêm do que o filho já tinha)
  const base = createCharacter(rng, { name: child.name, sex: child.sex }, content.geo, state.year - age, { uf: old.uf, city: old.city }, child.appearance);
  const estateGross = state.ending!.estate.gross;
  const familyWealth = estateGross >= 3_000_000 ? 92 : estateGross >= 500_000 ? 72 : estateGross >= 100_000 ? 50 : 25;
  const character: Character = {
    ...base,
    // o herdeiro já nasceu com os talentos dele (ocultos de novo para o jogador) e uma sorte própria
    talents: (child.talents ?? []).map((id) => ({ id, revealed: false })),
    luck: rollLuck(talentRng(state.seed, `sorte:${child.id}`)),
    // filho de gente famosa já nasce um pouco conhecido
    fame: Math.round((state.character.fame ?? 0) * 0.3),
    name: child.name,
    age,
    birthYear: state.year - age,
    country: 'Brasil',
    uf: old.uf,
    city: old.city,
    familyWealth,
    stats: statsFromPerson(child, rng, age),
  };
  Object.assign(character, bodyFor(age, character));

  // lutador: talento herdado, base de quem treinou desde pequeno
  const parentTalent = state.fighter.talent;
  const talent = Math.round(clamp((parentTalent + 0.65 + 0.7 * rng.next()) / 2, 0, 200) * 100) / 100;
  const mirim = !!child.flags.lutador_mirim;
  const trainedYears = mirim ? Math.max(0, Math.min(age - 6, 12)) : 0;
  const skills = baseSkills(5 + Math.round(trainedYears * 2.2));
  let fighter = newFighterProfile(skills, talent, rng.int(40, 75));
  const famous = Math.min(content.legacy.famousRepMax, Math.round(Math.max(state.feats.peakRep ?? 0, state.fighter.reputation) / content.legacy.famousRepDivisor));
  // lutador mirim herda a base: faixa de jiu-jitsu coerente com a idade (infantil até os 15; azul a partir dos 16)
  const grades: FighterProfile['grades'] = mirim
    ? { jiujitsu: age >= 16 ? { system: 'bjj_adulto', rank: 1, degree: 0, years: Math.min(3, trainedYears) } : { system: 'bjj_infantil', rank: Math.min(12, trainedYears * 2), degree: 0, years: 1 } }
    : {};
  fighter = { ...fighter, reputation: famous, grades };

  // relações do ponto de vista do herdeiro
  const people: Person[] = [];
  const relations: Relation[] = [];
  const add = (p: Person, r: Omit<Relation, 'personId' | 'revealed'> & { revealed?: number }) => {
    people.push(p);
    relations.push({ revealed: 3, ...r, personId: p.id });
  };
  const oldRel = (id: string) => state.relationships.relations.find((r) => r.personId === id);
  const affection = oldRel(personId)?.affection ?? 70;
  // o falecido vira pai/mãe (morto)
  const deceased: Person = {
    id: `p${state.relationships.nextPersonId}`,
    name: old.name,
    sex: old.sex,
    age: old.age,
    alive: false,
    deathAge: old.age,
    looks: old.stats.looks,
    smarts: old.stats.intelligence,
    health: 0,
    athletic: old.stats.athletic,
    traits: [],
    flags: {},
    appearance: old.appearance,
  };
  add(deceased, { type: old.sex === 'M' ? 'pai' : 'mae', affection, since: 0, history: [`Faleceu aos ${old.age} anos.`], interactedYear: state.year });
  // o outro genitor: cônjuge vivo ou o ex mais recente
  const spouse = relationsOf(state, ['conjuge'])[0] ?? relationsOf(state, ['ex']).slice(-1)[0];
  if (spouse) add({ ...spouse.person, wealth: spouse.person.wealth ?? 0 }, { type: spouse.person.sex === 'M' ? 'pai' : 'mae', affection: 70, since: 0, history: [], interactedYear: state.year });
  // irmãos
  for (const { person } of relationsOf(state, ['filho'], false)) {
    if (person.id === personId) continue;
    add(person, { type: 'irmao', affection: 60, since: 0, history: [], interactedYear: state.year });
  }
  // avós (pais vivos do falecido)
  for (const { person } of relationsOf(state, ['pai', 'mae'])) add(person, { type: 'avo', affection: 65, since: 0, history: [], interactedYear: state.year });
  // treinador e rivais do mundo da luta (por referência ao NPC)
  for (const { person, rel } of relationsOf(state, ['rival'])) if (person.npcId) add(person, { ...rel, affection: Math.min(rel.affection, 30), history: [`Rival de ${old.name.split(' ')[0]}.`] });
  const parentPref = state.relationships.settings.preference;
  const relationships: RelationshipsState = {
    ...state.relationships,
    // interesse amoroso do herdeiro: padrão sexo oposto (o jogador muda no menu); 'ambos' é mantido
    settings: { ...state.relationships.settings, preference: parentPref === 'any' ? 'any' : child.sex === 'M' ? 'F' : 'M' },
    people,
    relations,
    archived: [],
    nextPersonId: state.relationships.nextPersonId + 1,
    pregnancy: null,
  };

  // mundo: o antigo personagem sai dos rankings (cinturões ficam vagos)
  const world = leaveRankings(state, () => true).world;

  // economia: herança em bens e dinheiro
  let s: GameState = {
    version: STATE_VERSION,
    seed: state.seed,
    rngState: rng.state,
    year: state.year,
    character,
    money: 0,
    yearUses: {},
    college: emptyCollege(),
    sportsClub: null,
    exchange: null,
    scene: null,
    eventLastAge: {},
    flags: {
      ...(child.flags.interesse_luta ? { interesse_luta: true, gostaDeLuta: true } : {}),
      ...(mirim ? { lutador_mirim: true, artesMarciais: true } : {}),
      ...((state.feats.majorTitles ?? 0) + (state.feats.regionalTitles ?? 0) > 0 ? { filho_de_campeao: true } : {}),
      ...(age >= 18 ? { formado: true, caminho_18: 'indefinido' } : {}),
    },
    firedEvents: [],
    pendingEvents: [],
    scheduledEvents: [],
    education: educationForAge(rng, content, age, character),
    fighter,
    world,
    activeFight: null,
    relationships,
    economy: emptyEconomy(0, state.year),
    log: [],
    alive: true,
    health: emptyHealth(),
    feats: { gymGenerations: 0 },
    dynasty: { ...state.dynasty, generation: gen, members: [...state.dynasty.members, dynastyMember(state, child.name)].slice(-30) },
    ending: null,
    wardrobe: { ...defaultWardrobe(content), facialHair: child.appearance?.facialHair ?? 'nenhuma' },
    police: emptyPolice(),
    crime: emptyCrime(),
    prison: null,
    // a cidade é a mesma, mas o herdeiro conhece outra gente (a lista nasce no ano de nascimento dele)
    population: emptyPopulation(),
  };
  const items = pickInheritedItems(state, heir.amount);
  const cash = Math.max(0, heir.amount - items.used);
  s = {
    ...s,
    economy: {
      ...s.economy,
      housing: age < 18 || spouse ? 'pais' : 'aluguel',
      assets: items.assets,
      businesses: items.businesses,
      loans: items.loans,
      nextId: state.economy.nextId,
    },
  };
  if (items.businesses.some((b) => b.defId === 'academia')) {
    s = { ...s, flags: { ...s.flags, academia_herdada: true, academia_propria: true }, feats: { ...s.feats, gymGenerations: (state.feats.gymGenerations ?? 0) + 1 } };
  }
  const home = items.assets.find((a) => a.kind === 'imovel' && a.catalogId !== 'sala_comercial');
  if (home && age >= 18) s = { ...s, economy: { ...s.economy, housing: 'propria', assets: s.economy.assets.map((a) => (a.id === home.id ? { ...a, home: true } : a)) } };

  // a família que o herdeiro já tinha (coerente com a idade): cônjuge e filhos
  s = heirOwnFamily(s, rng, content);

  s = appendLog(s, `Você é ${child.name}, ${age} anos, ${gen}ª geração da família ${state.dynasty.surname}. ${old.sex === 'M' ? 'Seu pai' : 'Sua mãe'}, ${old.name}, faleceu aos ${old.age} anos.`);
  if (cash > 0) s = post(s, 'heranca', toMoney(cash), `Herança de ${old.name}`);
  if (heir.amount > 0) {
    const parts = [`R$ ${heir.amount.toLocaleString('pt-BR')}`];
    if (items.assets.length || items.businesses.length) parts.push(`incluindo ${[...items.assets.map((a) => a.name), ...items.businesses.map((b) => b.name)].join(', ')}`);
    s = appendLog(s, `Sua parte na herança: ${parts.join(', ')}.`);
  } else s = appendLog(s, 'Você não recebeu nada na partilha.');
  if (famous > 0) s = appendLog(s, `O sobrenome ${state.dynasty.surname} abre portas: você já começa com reputação ${famous}.`);
  return s;
}
