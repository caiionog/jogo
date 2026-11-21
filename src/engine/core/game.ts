import type { ActionDef, GameContent } from './content';
import { applyEffects, formatText } from './effects';
import type { Effects } from './effects';
import { createRng, seedToState } from './rng';
import type { Rng } from './rng';
import type { GameState, Sex, StatKey } from './state';
import { STATE_VERSION } from './state';
import { addStats, appendLog, clamp } from './stats';
import { createCharacter } from '../character/create';
import { maxEnergy } from '../lifeStages/energy';
import { selectEvents } from '../events/select';

export interface NewGameOptions {
  seed: string | number;
  name: string;
  sex: Sex;
  /** Ano de nascimento. Se omitido, é sorteado pelo seed. */
  birthYear?: number;
}

/** Executa `fn` com um RNG criado a partir do estado e grava o novo rngState. */
function withRng(state: GameState, fn: (rng: Rng, s: GameState) => GameState): GameState {
  const rng = createRng(state.rngState);
  const next = fn(rng, state);
  return { ...next, rngState: rng.state };
}

export function newGame(options: NewGameOptions, content: GameContent): GameState {
  const seed = String(options.seed);
  const rng = createRng(seedToState(seed));
  const birthYear = options.birthYear ?? rng.int(1995, 2010);
  const character = createCharacter(rng, options, content.locations, birthYear);
  const state: GameState = {
    version: STATE_VERSION,
    seed,
    rngState: rng.state,
    year: birthYear,
    character,
    money: 0,
    energy: { current: 0, max: 0 },
    flags: {},
    firedEvents: [],
    pendingEvents: [],
    log: [],
    alive: true,
  };
  const max = maxEnergy(0, character.stats.health);
  const pronoun = character.sex === 'M' ? 'um menino' : 'uma menina';
  return appendLog(
    { ...state, energy: { current: max, max } },
    `Você nasceu ${pronoun} em ${character.city}, ${character.country}. Seu nome é ${character.name}.`,
  );
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

export type ActionBlockReason = 'unknown' | 'dead' | 'pending-event' | 'too-young' | 'too-old' | 'no-energy';

export function actionBlockReason(state: GameState, action: ActionDef | undefined): ActionBlockReason | null {
  if (!action) return 'unknown';
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0) return 'pending-event';
  if (state.character.age < action.minAge) return 'too-young';
  if (action.maxAge !== undefined && state.character.age > action.maxAge) return 'too-old';
  if (state.energy.current < action.energyCost) return 'no-energy';
  return null;
}

/** Gasta energia e aplica os efeitos da ação. Se a ação não for permitida, devolve o estado inalterado. */
export function performAction(state: GameState, actionId: string, content: GameContent): GameState {
  const action = content.actions.find((a) => a.id === actionId);
  if (actionBlockReason(state, action) !== null || !action) return state;

  return withRng(state, (rng, s) => {
    const effects = withVariance(action.effects, action.variance ?? 0, rng);
    let next = applyEffects(s, effects);
    next = { ...next, energy: { ...next.energy, current: next.energy.current - action.energyCost } };
    return appendLog(next, formatText(next, rng.pick(action.logTexts)));
  });
}

function withVariance(effects: Effects, variance: number, rng: Rng): Effects {
  if (variance <= 0 || !effects.stats) return effects;
  const stats: Partial<Record<StatKey, number>> = {};
  for (const [key, value] of Object.entries(effects.stats) as [StatKey, number][]) {
    stats[key] = value > 0 ? value + rng.int(0, variance) : value;
  }
  return { ...effects, stats };
}

// ---------------------------------------------------------------------------
// Avançar ano
// ---------------------------------------------------------------------------

/** Mudanças naturais de atributos ao envelhecer (crescimento, envelhecimento, humor). */
function naturalAging(state: GameState, rng: Rng): GameState {
  const { age, stats } = state.character;
  const delta: Partial<Record<StatKey, number>> = {};
  if (age <= 17) {
    delta.strength = rng.int(0, 2);
    delta.fitness = rng.int(0, 2);
  }
  if (age >= 3 && age <= 22) delta.intelligence = rng.int(0, 2);
  if (age >= 35) {
    delta.fitness = -rng.int(0, 2);
    delta.strength = -rng.int(0, 1);
  }
  if (age >= 50) delta.health = -rng.int(0, 3);
  if (age >= 70) delta.health = -rng.int(1, 5);
  // felicidade tende lentamente a 60
  delta.happiness = Math.round((60 - stats.happiness) * 0.1) + rng.int(-2, 2);
  return {
    ...state,
    character: { ...state.character, stats: addStats(stats, delta) },
  };
}

function deathCheck(state: GameState, rng: Rng): boolean {
  const { age, stats } = state.character;
  if (stats.health <= 0) return true;
  if (age < 70) return false;
  const p = (age - 70) * 0.015 + (stats.health < 30 ? 0.1 : 0);
  return rng.chance(Math.min(0.9, p));
}

export interface AdvanceYearOptions {
  /** Probabilidade de sortear 2 eventos em vez de 1. */
  twoEventChance?: number;
}

/**
 * Tick anual: envelhece, aplica efeitos naturais, renova energia e sorteia 1–2 eventos.
 * Bloqueado (estado inalterado) se houver evento pendente ou o personagem estiver morto.
 */
export function advanceYear(
  state: GameState,
  content: GameContent,
  options: AdvanceYearOptions = {},
): GameState {
  if (!state.alive || state.pendingEvents.length > 0) return state;
  const twoEventChance = options.twoEventChance ?? 0.35;

  return withRng(state, (rng, s) => {
    let next: GameState = {
      ...s,
      year: s.year + 1,
      character: { ...s.character, age: s.character.age + 1 },
    };
    next = naturalAging(next, rng);
    next = appendLog(next, `Você fez ${next.character.age} ${next.character.age === 1 ? 'ano' : 'anos'}.`);

    if (deathCheck(next, rng)) {
      next = appendLog(next, 'Você faleceu. Fim da jornada.');
      return { ...next, alive: false, energy: { current: 0, max: 0 } };
    }

    const max = maxEnergy(next.character.age, next.character.stats.health);
    next = { ...next, energy: { current: max, max } };

    const count = rng.chance(twoEventChance) ? 2 : 1;
    const events = selectEvents(next, content.events, count, rng);
    return {
      ...next,
      pendingEvents: events.map((e) => ({ eventId: e.id })),
      firedEvents: [...next.firedEvents, ...events.map((e) => e.id)],
    };
  });
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

/** Aplica a escolha do jogador para um evento pendente. */
export function resolveEvent(
  state: GameState,
  eventId: string,
  choiceId: string,
  content: GameContent,
): GameState {
  const pendingIdx = state.pendingEvents.findIndex((p) => p.eventId === eventId);
  const event = content.events.find((e) => e.id === eventId);
  const choice = event?.choices.find((c) => c.id === choiceId);
  if (pendingIdx < 0 || !event || !choice) return state;

  return withRng(state, (rng, s) => {
    const risky = choice.risk !== undefined && rng.chance(choice.risk.chance);
    const effects = risky ? choice.risk?.effects : choice.effects;
    const resultText = risky ? (choice.risk?.resultText ?? choice.resultText) : choice.resultText;
    let next = applyEffects(s, effects);
    next = {
      ...next,
      pendingEvents: next.pendingEvents.filter((_, i) => i !== pendingIdx),
    };
    // garante limites de energia caso efeitos futuros mexam em saúde
    next = { ...next, energy: { ...next.energy, current: clamp(next.energy.current, 0, next.energy.max) } };
    return appendLog(next, formatText(next, `${event.text} ${resultText}`));
  });
}
