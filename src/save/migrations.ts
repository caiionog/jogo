import type { Education, Enrollment, GameState } from '../engine';
import {
  STATE_VERSION,
  clamp,
  createRng,
  emptyEducation,
  gradeForAge,
  randomSchool,
  seedToState,
} from '../engine';
import { NAMES } from '../content/names';

export const CURRENT_VERSION = STATE_VERSION;

type AnySave = Record<string, unknown> & { version: number };

/**
 * migrations[n] converte um save da versão n para n+1.
 * Ao mudar o GameState: incremente STATE_VERSION e adicione a migração aqui (+ teste).
 */
export const migrations: Record<number, (save: AnySave) => AnySave> = {
  1: migrateV1toV2,
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
