import type { Education, Enrollment, GameState, Skills } from '../engine';
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
} from '../engine';
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
  const body = bodyFor(c.age, { adultHeightCm, build, stats: c.stats });
  const flags = s.flags;
  const club = s.education.current?.club ?? null;

  // nível base pela idade (crianças pequenas quase nada; adultos jovens ~17)
  const base = c.age < 6 ? 5 : 5 + Math.min(c.age - 5, 15) * 0.8;
  const skills: Skills = {
    striking: base,
    wrestling: base,
    grappling: base,
    defense: base,
    cardio: base + c.stats.fitness / 10,
    chin: 45 + rng.int(0, 10),
  };
  const add = (k: keyof Skills, v: number) => {
    skills[k] = clamp(skills[k] + v);
  };
  if (flags.artesMarciais === 'judo') { add('wrestling', 8); add('grappling', 5); }
  if (flags.artesMarciais === 'jiujitsu') add('grappling', 10);
  if (club === 'judo') { add('wrestling', 6); add('grappling', 4); }
  if (club === 'wrestling') { add('wrestling', 8); add('cardio', 3); }
  if (flags.interesse_luta) add('striking', 3);
  if (flags.brigou_na_escola) { add('striking', 4); add('chin', 3); }

  const talent = Math.round((0.65 + 0.7 * ((rng.next() + rng.next()) / 2)) * 100) / 100;
  const fighter = newFighterProfile(skills, talent);
  fighter.reputation = flags.medalha_interescolar ? 5 : 0;
  if (flags.artesMarciais === 'jiujitsu') fighter.belt = { rank: 0, years: Math.max(0, Math.min(6, c.age - 6)) };
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
  let g: GameState = {
    ...s0,
    money,
    energy: { ...s0.energy, reserved: 0 },
    economy: { ...emptyEconomy(money, s0.year), housing: age >= 25 ? 'aluguel' : 'pais' },
  };
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
