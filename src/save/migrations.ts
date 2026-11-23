import { rollLuck, rollTalents } from '../engine/character/talents';
import type { Education, Enrollment, GameState, Skills, Stats } from '../engine';
import {
  STATE_VERSION,
  bodyFor,
  clamp,
  createRng,
  emptyEducation,
  emptyWorld,
  gradeForAge,
  newFighterProfile,
  randomAdultHeight,
  randomSchool,
  seedToState,
  emptyRelationships,
  generateFamily,
  setCoach,
  survivalByAge,
  updatePerson,
  relationsOf,
  emptyEconomy,
  parentWealth,
  netWorth,
  emptyHealth,
  emptyDynasty,
  killCharacter,
  pickBirthplace,
  randomAppearance,
  parentsFor,
  inheritAppearance,
  npcAppearance,
  ufOrDefault,
  defaultWardrobe,
  appendLog,
} from '../engine';
import type { Appearance, Person } from '../engine';
import { NAMES } from '../content/names';
import { GYMS } from '../content/gyms';
import { GAME_CONTENT } from '../content';

export const CURRENT_VERSION = STATE_VERSION;

type AnySave = Record<string, unknown> & { version: number };

/**
 * migrations[n] converte um save da versão n para n+1.
 * Ao mudar o GameState: incremente STATE_VERSION e adicione a migração aqui (+ teste).
 */
export const migrations: Record<number, (save: AnySave) => AnySave> = {
  1: migrateV1toV2,
  2: migrateV2toV3,
  3: migrateV3toV4,
  4: migrateV4toV5,
  5: migrateV5toV6,
  6: migrateV6toV7,
  7: migrateV7toV8,
  8: migrateV8toV9,
  9: migrateV9toV10,
  10: migrateV10toV11,
  11: migrateV11toV12,
  12: migrateV12toV13,
  13: migrateV13toV14,
  14: migrateV14toV15,
};

export class SaveMigrationError extends Error {}

export function migrate(raw: unknown): GameState {
  if (typeof raw !== 'object' || raw === null || typeof (raw as AnySave).version !== 'number') {
    throw new SaveMigrationError('Save inválido: sem campo version');
  }
  let save = raw as AnySave;
  if (save.version > CURRENT_VERSION) {
    throw new SaveMigrationError(`Save da versão ${save.version} é mais novo que o jogo (${CURRENT_VERSION})`);
  }
  while (save.version < CURRENT_VERSION) {
    const step = migrations[save.version];
    if (!step) throw new SaveMigrationError(`Sem migração a partir da versão ${save.version}`);
    save = step(save);
  }
  return save as unknown as GameState;
}

// ---------------------------------------------------------------------------
// v1 → v2 (Etapa 2: escola)
// ---------------------------------------------------------------------------

/** Formato mínimo do save v1 usado pela migração. */
interface V1Save extends AnySave {
  seed: string;
  character: GameState['character'] & { familyWealth?: number };
  flags: GameState['flags'];
}

/**
 * Adiciona familyWealth, estado escolar coerente com a idade e scheduledEvents.
 * Usa um RNG próprio (derivado da seed) para não alterar o rngState do jogo.
 */
function migrateV1toV2(save: AnySave): AnySave {
  const s = save as V1Save;
  const rng = createRng(seedToState(`${s.seed}:v2`));
  const familyWealth = s.character.familyWealth ?? rng.int(0, 100);
  const { age, stats } = s.character;

  const flags = { ...s.flags };
  if ('brigouNaEscola' in flags) {
    flags.brigou_na_escola = flags.brigouNaEscola as boolean;
    delete flags.brigouNaEscola;
  }

  let education: Education = emptyEducation();
  if (age >= 3 && age <= 17) {
    const type = rng.chance(0.1 + (familyWealth / 100) * 0.7) ? 'particular' : 'publica';
    const enrollment: Enrollment = {
      school: randomSchool(rng, NAMES, type),
      grade: gradeForAge(age),
      average: clamp(30 + 0.5 * stats.intelligence),
      discipline: 70,
      absences: 0,
      popularity: clamp(30 + stats.looks * 0.2),
      club: null,
      suspensions: 0,
    };
    education = { ...education, current: enrollment };
  } else if (age >= 18) {
    education = { ...education, graduated: true };
    flags.formado = true;
    // a decisão dos 18 anos não dispara retroativamente para quem já passou dessa idade
    if (age > 18 && !flags.caminho_18) flags.caminho_18 = 'indefinido';
  }

  return {
    ...s,
    version: 2,
    character: { ...s.character, familyWealth },
    flags,
    education,
    scheduledEvents: [],
    pendingEvents: (s.pendingEvents as GameState['pendingEvents'] | undefined) ?? [],
  };
}

// ---------------------------------------------------------------------------
// v2 → v3 (Etapa 3: carreira de luta)
// ---------------------------------------------------------------------------

interface V2Save extends AnySave {
  seed: string;
  character: Omit<GameState['character'], 'heightCm' | 'weightKg' | 'adultHeightCm' | 'build'>;
  flags: GameState['flags'];
  education: GameState['education'];
}

/**
 * Adiciona corpo (altura/peso), perfil de lutador coerente com a idade e com as flags/clubes das
 * etapas anteriores, mundo vazio (elencos são gerados sob demanda) e activeFight.
 */
function migrateV2toV3(save: AnySave): AnySave {
  const s = save as V2Save;
  const rng = createRng(seedToState(`${s.seed}:v3`));
  const c = s.character;
  const adultHeightCm = randomAdultHeight(rng, c.sex);
  const build = rng.int(-2, 2);
  // o corpo é calculado com o modelo atual (Capacidade atlética a partir de força e condicionamento antigos)
  const old = c.stats as unknown as Record<string, number>;
  const body = bodyFor(c.age, { adultHeightCm, build, stats: { ...c.stats, athletic: ((old.strength ?? 10) + (old.fitness ?? 10)) / 2 } as Stats });
  const flags = s.flags;
  const club = s.education.current?.club ?? null;

  // nível base pela idade (crianças pequenas quase nada; adultos jovens ~17)
  const base = c.age < 6 ? 5 : 5 + Math.min(c.age - 5, 15) * 0.8;
  // formato de habilidades da v3 (convertido para jiu-jitsu/trocação na v8)
  const skills: Record<string, number> = {
    striking: base,
    wrestling: base,
    grappling: base,
    defense: base,
    cardio: base + (old.fitness ?? 10) / 10,
    chin: 45 + rng.int(0, 10),
  };
  const add = (k: string, v: number) => {
    skills[k] = clamp((skills[k] ?? 0) + v);
  };
  if (flags.artesMarciais === 'judo') { add('wrestling', 8); add('grappling', 5); }
  if (flags.artesMarciais === 'jiujitsu') add('grappling', 10);
  if (club === 'judo') { add('wrestling', 6); add('grappling', 4); }
  if (club === 'wrestling') { add('wrestling', 8); add('cardio', 3); }
  if (flags.interesse_luta) add('striking', 3);
  if (flags.brigou_na_escola) { add('striking', 4); add('chin', 3); }

  const talent = Math.round((0.65 + 0.7 * ((rng.next() + rng.next()) / 2)) * 100) / 100;
  const fighter = newFighterProfile(skills as unknown as Skills, talent);
  fighter.reputation = flags.medalha_interescolar ? 5 : 0;
  // formato v3: faixa única de jiu-jitsu (`belt`), convertida em `grades` na migração v9→v10
  if (flags.artesMarciais === 'jiujitsu') (fighter as unknown as { belt: { rank: number; years: number } }).belt = { rank: 0, years: Math.max(0, Math.min(6, c.age - 6)) };
  if (flags.artesMarciais) {
    const gymId = flags.artesMarciais === 'judo' ? 'gen_judo_clube' : 'gen_bairro';
    if (GYMS.some((g) => g.id === gymId)) fighter.gymId = gymId;
  }

  return {
    ...s,
    version: 3,
    character: { ...c, adultHeightCm, build, ...body },
    fighter,
    world: emptyWorld(),
    activeFight: null,
  };
}

// ---------------------------------------------------------------------------
// v3 → v4 (Etapa 4: relacionamentos)
// ---------------------------------------------------------------------------

/**
 * Cria a família coerente com a idade (pais vivos ou não conforme a idade deles, irmãos plausíveis),
 * o(a) treinador(a) da academia atual e a opção "Conteúdo adulto" DESLIGADA.
 */
function migrateV3toV4(save: AnySave): AnySave {
  const s = { ...(save as unknown as GameState), relationships: emptyRelationships(false) };
  const rng = createRng(seedToState(`${s.seed}:v4`));
  let g: GameState = generateFamily(s, rng, GAME_CONTENT, s.character.age);
  // pais podem já ter falecido
  for (const { person } of relationsOf(g, ['pai', 'mae'])) {
    if (!rng.chance(survivalByAge(person.age))) {
      const deathAge = Math.max(40, person.age - rng.int(1, Math.max(1, s.character.age - 1)));
      g = updatePerson(g, person.id, (p) => ({ ...p, alive: false, deathAge }));
    }
  }
  const gym = GYMS.find((x) => x.id === s.fighter.gymId);
  if (gym) g = setCoach(g, rng, GAME_CONTENT, gym.id);
  return { ...(g as unknown as AnySave), rngState: s.rngState, version: 4 };
}

// ---------------------------------------------------------------------------
// v4 → v5 (Etapa 5: economia e bens)
// ---------------------------------------------------------------------------

/**
 * Dinheiro vira inteiro; cria o extrato vazio (opening = dinheiro), moradia coerente com a idade, padrão simples,
 * patrimônio dos pais pela renda da família e comunhão parcial para quem já é casado.
 */
function migrateV4toV5(save: AnySave): AnySave {
  const s0 = save as unknown as GameState;
  const rng = createRng(seedToState(`${s0.seed}:v5`));
  const money = Math.round(s0.money);
  const age = s0.character.age;
  // `energy` existia até o save v8 (removida na v9)
  let g = {
    ...s0,
    money,
    energy: { ...(s0 as unknown as { energy: object }).energy, reserved: 0 },
    economy: { ...emptyEconomy(money, s0.year), housing: age >= 25 ? 'aluguel' : 'pais' },
  } as unknown as GameState;
  for (const { person } of relationsOf(g, ['pai', 'mae'], false)) {
    const wealth = person.alive ? parentWealth(rng, g.character.familyWealth) : 0;
    g = updatePerson(g, person.id, (p) => ({ ...p, wealth }));
  }
  if (relationsOf(g, ['pai', 'mae']).length === 0 && g.economy.housing === 'pais' && age >= 18) {
    g = { ...g, economy: { ...g.economy, housing: 'aluguel' } };
  }
  const spouse = g.relationships.relations.find((r) => r.romance?.stage === 'casados');
  if (spouse) g = { ...g, economy: { ...g.economy, marriage: { personId: spouse.personId, regime: 'parcial', netWorthAtMarriage: Math.round(netWorth(g) / 2) } } };
  return { ...(g as unknown as AnySave), version: 5 };
}

// ---------------------------------------------------------------------------
// v5 → v6 (Etapa 6: lesões, aposentadoria, morte e legado)
// ---------------------------------------------------------------------------

type V5Fighter = GameState['fighter'] & { injury?: { name: string; yearsLeft: number } | null };

/**
 * Converte a lesão antiga (`fighter.injury`) numa lesão do catálogo, estima o dano cerebral pelos nocautes
 * sofridos no histórico de lutas, inicializa saúde, façanhas, dinastia (geração 1) e aposentadoria.
 * Saves de personagens mortos ganham o fim de vida (obituário e partilha).
 */
function migrateV5toV6(save: AnySave): AnySave {
  const s0 = save as unknown as GameState;
  const f0 = s0.fighter as V5Fighter;
  const health = emptyHealth();
  if (f0.injury) {
    const defId = GAME_CONTENT.health.legacyNames[f0.injury.name] ?? 'distensao';
    const def = GAME_CONTENT.health.injuries.find((d) => d.id === defId)!;
    health.injuries.push({ id: 'i1', defId, severity: def.severity, months: Math.max(1, Math.round(f0.injury.yearsLeft * 12)), treatment: 'none', aggravated: false, age: s0.character.age, source: 'luta' });
    health.history.push({ age: s0.character.age, defId, source: 'luta' });
    health.nextId = 2;
  }
  // dano cerebral a partir dos nocautes sofridos (o histórico guarda as últimas lutas)
  const kos = f0.history.filter((h) => h.result === 'L' && h.method === 'KO').length;
  const tkos = f0.history.filter((h) => h.result === 'L' && h.method === 'TKO').length;
  health.brainDamage = Math.min(60, kos * 8 + tkos * 4);
  const { injury: _old, ...fighterRest } = f0;
  void _old;
  const fighter = { ...fighterRest, retired: null } as GameState['fighter'];
  const majorTitles = fighter.titles.filter((t) => GAME_CONTENT.fighting.orgs.find((o) => o.id === t.orgId)?.tier === 'major').length;
  let g: GameState = {
    ...s0,
    fighter,
    health,
    feats: { peakRep: fighter.reputation, majorTitles, regionalTitles: Math.max(0, fighter.titlesWon - majorTitles) },
    dynasty: emptyDynasty(s0.character.name.split(' ').slice(-1)[0] ?? s0.character.name, s0.character.birthYear),
    ending: null,
    economy: { ...s0.economy, will: null },
    version: 6,
  };
  if (!g.alive) g = killCharacter({ ...g, alive: true }, g.character.stats.health <= 0 ? 'complicações de saúde' : 'causas naturais', GAME_CONTENT);
  return g as unknown as AnySave;
}

// ---------------------------------------------------------------------------
// v6 → v7 (Etapa 7: Brasil e aparência)
// ---------------------------------------------------------------------------

/**
 * Local: cidade brasileira antiga → a UF dela; país estrangeiro → UF e cidade sorteadas pela seed.
 * Academias estrangeiras removidas viram `null`. Aparência para o personagem e todas as pessoas, coerente com a
 * família (pais compatíveis, irmãos e filhos herdando), e o guarda-roupa inicial. Nomes antigos não mudam.
 * RNG próprio (`seed:v7`): o `rngState` do jogo não é alterado.
 */
function migrateV6toV7(save: AnySave): AnySave {
  const s0 = save as unknown as GameState;
  const geo = GAME_CONTENT.geo;
  const rng = createRng(seedToState(`${s0.seed}:v7`));
  const c0 = s0.character;
  const home = geo.ufs.find((u) => u.cities.some((x) => x.name === c0.city));
  const place = c0.country === 'Brasil' && home ? { uf: home.sigla, city: c0.city } : pickBirthplace(rng, geo);
  const uf = ufOrDefault(geo, place.uf);
  const appearance = randomAppearance(rng, uf, c0.sex);
  if (c0.age < 16) appearance.facialHair = 'nenhuma';
  let g: GameState = { ...s0, character: { ...c0, country: 'Brasil', uf: place.uf, city: place.city, appearance } };
  if (place.city !== c0.city) g = appendLog(g, `Sua vida agora se passa em ${place.city} (${place.uf}).`);
  if (g.fighter.gymId && !GYMS.some((x) => x.id === g.fighter.gymId)) {
    g = appendLog({ ...g, fighter: { ...g.fighter, gymId: null } }, 'Sua antiga academia ficou para trás.');
  }

  const people = new Map(g.relationships.people.map((p) => [p.id, p] as const));
  const set = (id: string, a: Appearance) => {
    const p = people.get(id);
    if (p) people.set(id, { ...p, appearance: p.age < 16 ? { ...a, facialHair: 'nenhuma' } : a });
  };
  const rels = g.relationships.relations;
  const of = (type: string) => rels.filter((r) => r.type === type).map((r) => people.get(r.personId)).filter((p): p is Person => !!p);
  // pais compatíveis com o personagem
  const looks = parentsFor(rng, appearance);
  const father = of('pai')[0];
  const mother = of('mae')[0];
  if (father) set(father.id, looks.father);
  if (mother) set(mother.id, looks.mother);
  for (const sib of of('irmao')) set(sib.id, inheritAppearance(rng, looks.father, looks.mother, sib.sex));
  // filhos: do personagem com o cônjuge/ex (ou com um outro genitor sorteado pela UF)
  const partner = of('conjuge')[0] ?? of('ex')[0] ?? of('parceiro')[0];
  const partnerLook = partner ? randomAppearance(rng, uf, partner.sex) : randomAppearance(rng, uf, c0.sex === 'M' ? 'F' : 'M');
  if (partner) set(partner.id, partnerLook);
  for (const kid of of('filho')) {
    const look = c0.sex === 'M' ? inheritAppearance(rng, appearance, partnerLook, kid.sex) : inheritAppearance(rng, partnerLook, appearance, kid.sex);
    set(kid.id, look);
  }
  // demais pessoas: lutadores do elenco pela aparência derivada; o resto pela UF
  for (const p of Array.from(people.values())) {
    if (p.appearance) continue;
    set(p.id, p.npcId ? npcAppearance(s0.seed, { id: p.npcId }, p.sex, GAME_CONTENT) : randomAppearance(rng, uf, p.sex));
  }
  g = { ...g, relationships: { ...g.relationships, people: g.relationships.people.map((p) => people.get(p.id)!) } };
  const wardrobe = { ...defaultWardrobe(GAME_CONTENT), facialHair: appearance.facialHair };
  return { ...(g as unknown as AnySave), wardrobe, rngState: s0.rngState, version: 7 };
}

// ---------------------------------------------------------------------------
// v7 → v8 (Etapa 8: atributos simplificados e habilidades ocultas)
// ---------------------------------------------------------------------------

type OldSkills = Partial<Record<'striking' | 'wrestling' | 'grappling' | 'defense' | 'cardio' | 'chin', number>>;
const r1 = (x: number) => Math.round(Math.max(0, Math.min(100, x)) * 10) / 10;

/** Habilidades antigas → jiu-jitsu (chão e agarre) e trocação (em pé) — formato do save v8 (vira `grappling` na v10). */
export function convertSkills(o: OldSkills): { jiujitsu: number; trocacao: number } {
  const g = o.grappling ?? 5;
  const w = o.wrestling ?? 5;
  const st = o.striking ?? 5;
  const d = o.defense ?? 5;
  return { jiujitsu: r1(g * 0.45 + w * 0.35 + ((g + w) / 2) * 0.2), trocacao: r1(st * 0.7 + d * 0.3) };
}

type OldNpc = Record<string, unknown> & { skills: OldSkills; strength?: number; fitness?: number; style?: string };

function convertNpc<T extends OldNpc>(n: T): Record<string, unknown> {
  const { strength, fitness, skills, ...rest } = n;
  return {
    ...rest,
    style: rest.style === 'wrestler' ? 'grappler' : rest.style,
    skills: convertSkills(skills),
    athletic: r1(((strength ?? 50) + (fitness ?? 50)) / 2 * 0.75 + (skills.cardio ?? 50) * 0.25),
    chinBase: r1(skills.chin ?? 55),
  };
}

/**
 * Capacidade atlética = 0,4·força + 0,35·condicionamento + 0,25·cardio; jiu-jitsu e trocação das habilidades antigas;
 * queixo antigo vira o queixo inato (`chinBase`). O mesmo para os NPCs dos elencos, das ofertas e de uma luta em
 * andamento. Força, condicionamento e as habilidades removidas saem do save.
 */
function migrateV7toV8(save: AnySave): AnySave {
  const s0 = save as unknown as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const st = s0.character.stats as Record<string, number>;
  const f = s0.fighter as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const oldSkills = f.skills as OldSkills;
  const { strength, fitness, ...restStats } = st;
  const athletic = r1((strength ?? 10) * 0.4 + (fitness ?? 10) * 0.35 + (oldSkills.cardio ?? 10) * 0.25);
  const rosters: Record<string, unknown> = {};
  for (const [k, r] of Object.entries((s0.world?.rosters ?? {}) as Record<string, { npcs: OldNpc[] }>)) rosters[k] = { ...r, npcs: r.npcs.map(convertNpc) };
  const offers = (f.offers as { opponent: OldNpc }[]).map((o) => ({ ...o, opponent: convertNpc(o.opponent) }));
  let activeFight = s0.activeFight;
  if (activeFight) {
    const snap = (x: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const { strength: sx, fitness: fx, skills, ...rest } = x;
      return { ...rest, skills: convertSkills(skills), athletic: r1(((sx ?? 50) + (fx ?? 50)) / 2), chin: r1(skills.chin ?? 55) };
    };
    activeFight = { ...activeFight, offer: { ...activeFight.offer, opponent: convertNpc(activeFight.offer.opponent) }, fight: { ...activeFight.fight, fighters: activeFight.fight.fighters.map(snap) } };
  }
  // guarda-roupa por camadas (Etapa 8): a peça antiga vira a parte de cima/inteira quando ainda existe
  const def = defaultWardrobe(GAME_CONTENT);
  const oldW = (s0.wardrobe ?? {}) as { unlocked?: string[]; outfit?: { id: string; color: number }; facialHair?: string };
  const known = new Set(GAME_CONTENT.outfits.map((o) => o.id));
  const unlocked = [...new Set([...def.unlocked, ...(oldW.unlocked ?? []).filter((id) => known.has(id))])];
  const worn = { ...def.worn } as Record<string, { id: string; color: number }>;
  const old = oldW.outfit && GAME_CONTENT.outfits.find((o) => o.id === oldW.outfit!.id);
  if (old && (old.layer === 'cima' || old.layer === 'inteira' || old.layer === 'agasalho')) {
    worn[old.layer] = { id: old.id, color: Math.min(oldW.outfit!.color, old.colors.length - 1) };
    if (old.layer === 'inteira') { delete worn.cima; delete worn.baixo; }
  }
  const wardrobe = { unlocked, worn, facialHair: oldW.facialHair ?? 'nenhuma' };
  // sardas e pintas: genes novos, derivados de forma estável (sem mexer no rngState)
  const look = (a: Record<string, any> | undefined, key: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!a?.genes) return a;
    const r = createRng(seedToState(`${s0.seed}:v8:${key}`));
    return { ...a, genes: { ...a.genes, freckles: r.chance(0.18) ? Math.round(r.next() * 100) / 100 : 0, moles: r.chance(0.3) ? Math.round(r.next() * 100) / 100 : 0 } };
  };
  const people = ((s0.relationships?.people ?? []) as Record<string, any>[]).map((p) => (p.appearance ? { ...p, appearance: look(p.appearance, p.id) } : p)); // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    ...(s0 as AnySave),
    version: 8,
    wardrobe,
    relationships: { ...s0.relationships, people },
    character: { ...s0.character, appearance: look(s0.character.appearance, 'player'), stats: { ...restStats, athletic } },
    fighter: { ...f, skills: convertSkills(oldSkills), chinBase: r1(oldSkills.chin ?? 55), trainingLoad: f.gymId ? 0.3 : 0, sessionsThisYear: 0, offers },
    world: { ...s0.world, rosters },
    activeFight,
  };
}

// ---------------------------------------------------------------------------
// v8 → v9 (release 0.0.1: fim da energia → sessões de treino)
// ---------------------------------------------------------------------------

/**
 * A energia sai do save. Entram os contadores anuais do retorno decrescente (`yearUses`, vazio) e o limite de 10
 * sessões de treino (o gasto do ano fica limitado a 10). O custo de camp das ofertas vira `campSessions`.
 */
function migrateV8toV9(save: AnySave): AnySave {
  const s0 = save as unknown as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { energy: _energy, ...rest } = s0;
  void _energy;
  const camp = (o: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { campCost, ...x } = o;
    return { ...x, campSessions: typeof campCost === 'number' ? campCost : 2 };
  };
  const f = s0.fighter as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const activeFight = s0.activeFight ? { ...s0.activeFight, offer: camp(s0.activeFight.offer) } : s0.activeFight;
  return {
    ...(rest as AnySave),
    version: 9,
    yearUses: {},
    fighter: { ...f, sessionsThisYear: Math.min(GAME_CONTENT.limits.trainingSessions, f.sessionsThisYear ?? 0), offers: (f.offers ?? []).map(camp) },
    activeFight,
  };
}

// ---------------------------------------------------------------------------
// v9 → v10 (release 0.0.1: grappling, modalidades e graduações)
// ---------------------------------------------------------------------------

type AnyObj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** `{ jiujitsu, trocacao }` → `{ grappling, trocacao }` (personagem, NPCs, ofertas, luta em andamento). */
function renameSkills<T extends AnyObj | undefined>(sk: T): T {
  if (!sk || !('jiujitsu' in sk)) return sk;
  const { jiujitsu, ...rest } = sk;
  return { ...rest, grappling: jiujitsu } as unknown as T;
}

const withSkills = (x: AnyObj) => (x && x.skills ? { ...x, skills: renameSkills(x.skills) } : x);

/**
 * A habilidade `jiujitsu` vira `grappling` em todo o save. A faixa única (`belt`) vira `grades.jiujitsu`:
 * adulto (16+) mantém a faixa e os anos; quem tem menos de 16 entra no sistema infantil com a faixa estimada pelo
 * nível de grappling e pela idade (determinístico, sem RNG). `trainedBjjThisYear` vira `trainedThisYear`.
 */
export function migrateV9toV10(save: AnySave): AnySave {
  const s0 = save as unknown as AnyObj;
  const f = s0.fighter as AnyObj;
  const age = s0.character.age as number;
  const skills = renameSkills(f.skills) as AnyObj;
  let grades: AnyObj = f.grades ?? {};
  const belt = f.belt as { rank: number; years: number } | undefined;
  const practiced = !!belt && (belt.rank > 0 || belt.years > 0 || (f.bjj?.wins ?? 0) + (f.bjj?.losses ?? 0) > 0);
  if (belt && practiced && !grades.jiujitsu) {
    if (age >= 16) grades = { ...grades, jiujitsu: { system: 'bjj_adulto', rank: belt.rank, degree: Math.min(4, belt.years), years: belt.years } };
    else {
      const kids = GAME_CONTENT.fighting.graduations.find((g) => g.id === 'bjj_infantil')!;
      let rank = 0;
      kids.levels.forEach((l, i) => {
        if (i > 0 && age >= l.minAge && (skills.grappling ?? 0) >= l.minSkill && i <= belt.years * 2) rank = i;
      });
      grades = { ...grades, jiujitsu: { system: 'bjj_infantil', rank, degree: 0, years: Math.min(1, belt.years) } };
    }
  }
  const { belt: _belt, trainedBjjThisYear, ...restF } = f;
  void _belt;
  const rosters: AnyObj = {};
  for (const [k, r] of Object.entries((s0.world?.rosters ?? {}) as AnyObj)) rosters[k] = { ...r, npcs: (r.npcs ?? []).map(withSkills) };
  const offers = (f.offers ?? []).map((o: AnyObj) => ({ ...o, opponent: withSkills(o.opponent) }));
  let activeFight = s0.activeFight;
  if (activeFight) {
    activeFight = { ...activeFight, offer: { ...activeFight.offer, opponent: withSkills(activeFight.offer.opponent) }, fight: { ...activeFight.fight, fighters: activeFight.fight.fighters.map(withSkills) } };
  }
  return {
    ...(s0 as AnySave),
    version: 10,
    fighter: { ...restF, skills, grades, trainedThisYear: trainedBjjThisYear ? ['jiujitsu'] : [], offers },
    world: { ...s0.world, rosters },
    activeFight,
  };
}

// ---------------------------------------------------------------------------
// v10 → v11 (release 0.0.1: talentos de nascimento e sorte)
// ---------------------------------------------------------------------------

/**
 * Talentos (todos ainda ocultos) e sorte para o personagem; talentos para as pessoas. Sorteio determinístico por RNG
 * derivado (`seed:v11:…`), sem mexer no `rngState`. Os bônus iniciais de atributo NÃO são aplicados a saves antigos
 * (a vida já aconteceu); os demais efeitos valem dali em diante.
 */
export function migrateV10toV11(save: AnySave): AnySave {
  const s0 = save as unknown as AnyObj;
  const seed = String(s0.seed);
  const r = (k: string) => createRng(seedToState(`${seed}:v11:${k}`));
  const talents = rollTalents(r('player'), GAME_CONTENT).map((id) => ({ id, revealed: false }));
  const people = ((s0.relationships?.people ?? []) as AnyObj[]).map((p) => ({ ...p, talents: p.talents ?? rollTalents(r(`p:${p.id}`), GAME_CONTENT) }));
  return {
    ...(s0 as AnySave),
    version: 11,
    character: { ...s0.character, talents: s0.character.talents ?? talents, luck: s0.character.luck ?? rollLuck(r('sorte')) },
    relationships: { ...s0.relationships, people },
  };
}

// ---------------------------------------------------------------------------
// v11 → v12 (release 0.0.1: faculdade)
// ---------------------------------------------------------------------------

/**
 * Cria `college`. Quem escolheu "faculdade" aos 18 (flag `caminho_18`) e terminou a escola: com 22 anos ou mais, ganha o
 * diploma de Administração (o curso genérico de antes); de 18 a 21, fica matriculado(a) em Administração numa
 * particular, no ano correspondente à idade. Sem RNG.
 */
export function migrateV11toV12(save: AnySave): AnySave {
  const s0 = save as unknown as AnyObj;
  const age = s0.character.age as number;
  const college: AnyObj = { current: null, diplomas: [], examScore: null, examYear: null };
  if (s0.flags?.caminho_18 === 'faculdade' && s0.education?.graduated && s0.alive !== false) {
    if (age >= 22) college.diplomas = ['administracao'];
    else if (age >= 18) college.current = { courseId: 'administracao', type: 'particular', institution: GAME_CONTENT.college.privateNames[0], year: Math.min(4, age - 17), grade: null, status: 'cursando', funding: 'proprio', failures: 0, financed: 0 };
  }
  return { ...(s0 as AnySave), version: 12, college: s0.college ?? college };
}

// ---------------------------------------------------------------------------
// v12 → v13 (release 0.0.1: clube esportivo e intercâmbio)
// ---------------------------------------------------------------------------

/** Sem clube esportivo e sem intercâmbio em andamento (sem RNG). */
export function migrateV12toV13(save: AnySave): AnySave {
  const s0 = save as unknown as AnyObj;
  return { ...(s0 as AnySave), version: 13, sportsClub: s0.sportsClub ?? null, exchange: s0.exchange ?? null };
}

// ---------------------------------------------------------------------------
// v13 → v14 (release 0.0.1: cena de praia/piscina, intervalo de repetição de eventos, roupas de banho)
// ---------------------------------------------------------------------------

/** `scene` vazio, `eventLastAge` vazio (o intervalo vale dali em diante) e as roupas de banho no guarda-roupa. */
export function migrateV13toV14(save: AnySave): AnySave {
  const s0 = save as unknown as AnyObj;
  const swim = GAME_CONTENT.outfits.filter((o) => o.context === 'praia' && o.unlockedByDefault).map((o) => o.id);
  const w = (s0.wardrobe ?? {}) as AnyObj;
  const unlocked = [...new Set([...((w.unlocked as string[]) ?? []), ...swim])];
  return { ...(s0 as AnySave), version: 14, scene: s0.scene ?? null, eventLastAge: s0.eventLastAge ?? {}, wardrobe: { ...w, unlocked } };
}

// ---------------------------------------------------------------------------
// v14 → v15 (release 0.0.2: carreira policial, crime, justiça e prisão)
// ---------------------------------------------------------------------------

/**
 * Sem carreira policial (Tiro 0), crime vazio e ninguém preso (sem RNG). A flag antiga `preso` (briga na balada que
 * terminou na delegacia) vira uma passagem leve na ficha criminal, na idade atual (a idade exata não foi guardada).
 */
export function migrateV14toV15(save: AnySave): AnySave {
  const s0 = save as unknown as AnyObj;
  const ch = (s0.character ?? {}) as AnyObj;
  const age = typeof ch.age === 'number' ? ch.age : 18;
  const year = typeof s0.year === 'number' ? s0.year : 0;
  const flags = (s0.flags ?? {}) as AnyObj;
  const record = flags.preso && age >= 18 ? [{ age, year, crime: 'briga', kind: 'passagem' }] : [];
  return {
    ...(s0 as AnySave),
    version: 15,
    police: s0.police ?? { shooting: 0, career: null, exams: [], past: [] },
    crime: s0.crime ?? { wanted: 0, rep: 0, dirty: 0, record, juvenile: [], faction: null, trafficking: null },
    prison: s0.prison ?? null,
  };
}
