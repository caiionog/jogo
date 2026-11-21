import type { ActionDef, GameContent } from './content';
import { applyEffects, formatText } from './effects';
import type { Effects } from './effects';
import { createRng, seedToState } from './rng';
import type { Rng } from './rng';
import type { EventVars, GameState, PendingEvent, Sex, StatKey } from './state';
import { STATE_VERSION } from './state';
import { addStats, appendLog, clamp } from './stats';
import { createCharacter } from '../character/create';
import { randomPersonName, randomTeacherName } from '../character/names';
import { maxEnergy } from '../lifeStages/energy';
import {
  CLUB_ENERGY_COST,
  clubBlockReason,
  currentStage,
  emptyEducation,
  endSchoolYear,
  joinClubState,
  startSchoolYear,
} from '../lifeStages/school';
import { autoEvents, conditionsMet, selectEvents } from '../events/select';
import type { GameEvent } from '../events/types';

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
    scheduledEvents: [],
    education: emptyEducation(),
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

export type ActionBlockReason =
  | 'unknown'
  | 'dead'
  | 'pending-event'
  | 'too-young'
  | 'too-old'
  | 'not-enrolled'
  | 'wrong-stage'
  | 'no-energy';

export function actionBlockReason(state: GameState, action: ActionDef | undefined): ActionBlockReason | null {
  if (!action) return 'unknown';
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0) return 'pending-event';
  if (state.character.age < action.minAge) return 'too-young';
  if (action.maxAge !== undefined && state.character.age > action.maxAge) return 'too-old';
  const req = action.requires;
  if (req?.enrolled && !state.education.current) return 'not-enrolled';
  if (req?.schoolStages) {
    const stage = currentStage(state);
    if (!stage) return 'not-enrolled';
    if (!req.schoolStages.includes(stage)) return 'wrong-stage';
  }
  if (state.energy.current < action.energyCost) return 'no-energy';
  return null;
}

/** Ação disponível para o personagem agora (ignora energia e eventos pendentes). Usado pela UI para esconder ações. */
export function isActionAvailable(state: GameState, action: ActionDef): boolean {
  const r = actionBlockReason(state, action);
  return r === null || r === 'no-energy' || r === 'pending-event';
}

/** Gasta energia e aplica os efeitos da ação. Se a ação não for permitida, devolve o estado inalterado. */
export function performAction(state: GameState, actionId: string, content: GameContent): GameState {
  const action = content.actions.find((a) => a.id === actionId);
  if (actionBlockReason(state, action) !== null || !action) return state;

  return withRng(state, (rng, s) => {
    const ctx = { rng, content, immediateSource: 'action' as const };
    const effects = withVariance(action.effects, action.variance ?? 0, rng);
    let next = applyEffects(s, effects, ctx);
    next = { ...next, energy: { ...next.energy, current: next.energy.current - action.energyCost } };
    next = appendLog(next, formatText(next, rng.pick(action.logTexts)));
    if (action.risk && rng.chance(action.risk.chance)) {
      next = applyEffects(next, action.risk.effects, ctx);
      next = appendLog(next, formatText(next, action.risk.logText));
    }
    return withEventVars(next, rng, content);
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
// Clubes escolares
// ---------------------------------------------------------------------------

export function joinClub(state: GameState, clubId: string, content: GameContent): GameState {
  const club = content.clubs.find((c) => c.id === clubId);
  if (clubBlockReason(state, club) !== null) return state;
  return withRng(state, (rng, s) => {
    const next = { ...s, energy: { ...s.energy, current: s.energy.current - CLUB_ENERGY_COST } };
    return joinClubState(next, clubId, content, rng);
  });
}

export function leaveClub(state: GameState, content: GameContent): GameState {
  const cur = state.education.current;
  if (!state.alive || !cur?.club || state.pendingEvents.length > 0) return state;
  if (state.energy.current < CLUB_ENERGY_COST) return state;
  const club = content.clubs.find((c) => c.id === cur.club);
  const next: GameState = {
    ...state,
    energy: { ...state.energy, current: state.energy.current - CLUB_ENERGY_COST },
    education: { ...state.education, current: { ...cur, club: null } },
  };
  return appendLog(next, `Você saiu do clube de ${club?.label.toLowerCase() ?? 'escola'}.`);
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

/** Variáveis de texto sorteadas para um evento ({colega}, {professor}, {clube}). */
function makeEventVars(state: GameState, rng: Rng, content: GameContent): EventVars {
  const vars: EventVars = {
    colega: randomPersonName(rng, content.names),
    professor: randomTeacherName(rng, content.names),
  };
  const clubId = state.education.current?.club;
  const club = clubId ? content.clubs.find((c) => c.id === clubId) : undefined;
  if (club) vars.clube = club.label.toLowerCase();
  return vars;
}

/** Garante que pendentes criados por ações/escolhas (sem vars herdadas) tenham variáveis de texto. */
function withEventVars(state: GameState, rng: Rng, content: GameContent): GameState {
  if (state.pendingEvents.every((p) => p.vars)) return state;
  return {
    ...state,
    pendingEvents: state.pendingEvents.map((p) => (p.vars ? p : { ...p, vars: makeEventVars(state, rng, content) })),
  };
}

export interface AdvanceYearOptions {
  /** Probabilidade de sortear 2 eventos em vez de 1. */
  twoEventChance?: number;
}

/**
 * Seleciona os eventos do ano: agendados vencidos (follow-ups) e 'auto' primeiro,
 * depois sorteio aleatório até completar 1–2 eventos.
 */
function pickYearEvents(state: GameState, content: GameContent, rng: Rng, target: number): GameState {
  const age = state.character.age;
  const byId = (id: string) => content.events.find((e) => e.id === id);
  const due = state.scheduledEvents.filter((s) => s.dueAge <= age);
  const scheduledEvents = state.scheduledEvents.filter((s) => s.dueAge > age);

  const pending: PendingEvent[] = [];
  const chosen = new Set<string>(state.pendingEvents.map((p) => p.eventId));
  const add = (event: GameEvent, source: PendingEvent['source'], vars?: EventVars) => {
    chosen.add(event.id);
    pending.push({ eventId: event.id, source, vars: vars ?? makeEventVars(state, rng, content) });
  };

  for (const s of due) {
    const ev = byId(s.eventId);
    if (ev && !chosen.has(ev.id) && conditionsMet(state, ev)) add(ev, 'followUp', s.vars);
  }
  for (const ev of autoEvents(state, content.events)) if (!chosen.has(ev.id)) add(ev, 'auto');

  const randomCount = Math.max(0, target - pending.length);
  const pool = content.events.filter((e) => !chosen.has(e.id));
  for (const ev of selectEvents(state, pool, randomCount, rng)) add(ev, 'random');

  return {
    ...state,
    scheduledEvents,
    pendingEvents: [...state.pendingEvents, ...pending],
    firedEvents: [...state.firedEvents, ...pending.map((p) => p.eventId)],
  };
}

/**
 * Tick anual: fecha o ano letivo, envelhece, aplica efeitos naturais, abre o novo ano letivo,
 * renova energia e seleciona eventos (follow-ups, automáticos e 1–2 aleatórios).
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
    let next = endSchoolYear(s, rng, content);
    next = {
      ...next,
      year: next.year + 1,
      character: { ...next.character, age: next.character.age + 1 },
    };
    next = naturalAging(next, rng);
    next = appendLog(next, `Você fez ${next.character.age} ${next.character.age === 1 ? 'ano' : 'anos'}.`);

    if (deathCheck(next, rng)) {
      next = appendLog(next, 'Você faleceu. Fim da jornada.');
      return { ...next, alive: false, energy: { current: 0, max: 0 } };
    }

    next = startSchoolYear(next, rng, content);
    const max = maxEnergy(next.character.age, next.character.stats.health);
    next = { ...next, energy: { current: max, max } };

    const target = rng.chance(twoEventChance) ? 2 : 1;
    return pickYearEvents(next, content, rng, target);
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
  const pending = state.pendingEvents[pendingIdx];
  const event = content.events.find((e) => e.id === eventId);
  const choice = event?.choices.find((c) => c.id === choiceId);
  if (!pending || !event || !choice) return state;

  return withRng(state, (rng, s) => {
    const risky = choice.risk !== undefined && rng.chance(choice.risk.chance);
    const effects = risky ? choice.risk?.effects : choice.effects;
    const resultText = risky ? (choice.risk?.resultText ?? choice.resultText) : choice.resultText;
    // o texto usa o estado ANTES dos efeitos (ex.: nome da escola antiga numa transferência)
    const logText = formatText(s, `${event.text} ${resultText}`, pending.vars);
    let next: GameState = appendLog(
      { ...s, pendingEvents: s.pendingEvents.filter((_, i) => i !== pendingIdx) },
      logText,
    );
    next = applyEffects(next, effects, { rng, content, ...(pending.vars ? { vars: pending.vars } : {}) });
    next = { ...next, energy: { ...next.energy, current: clamp(next.energy.current, 0, next.energy.max) } };
    return withEventVars(next, rng, content);
  });
}
