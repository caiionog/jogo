import { eatingYear } from '../fighting/body';
import { policeColleaguesYear } from '../police/colleagues';
import { emptyCivilService } from '../civilService/civil';
import { emptyPopulation } from '../population/population';
import { fameYear } from '../fame/fame';
import { postgradYear } from '../lifeStages/college';
import { prisonYear } from '../crime/justice';
import { crimeYear } from '../crime/crimes';
import { policeYear } from '../police/career';
import { emptyPolice } from '../police/types';
import { emptyCrime } from '../crime/types';
import { exchangeYear, onExchange, sportsClubYear } from '../lifeStages/sportsClub';
import { collegeYear, emptyCollege, inCollege } from '../lifeStages/college';
import type { Appearance } from '../character/appearance/genes';
import { defaultWardrobe } from '../character/appearance/outfits';
import { composeName } from '../character/names';
import { ufDef } from '../geo';
import { injuriesYear } from '../fighting/injuries';
import { healthYear } from '../health/aging';
import { deathCheck } from '../health/death';
import { killCharacter } from '../legacy/finalize';
import { emptyHealth } from '../health/types';
import { emptyDynasty } from '../legacy/types';
import type { ActionDef, GameContent } from './content';
import { applyEffects, formatText } from './effects';
import type { Effects } from './effects';
import { createRng, seedToState } from './rng';
import type { Rng } from './rng';
import type { EventVars, GameState, PendingEvent, Sex, StatKey } from './state';
import { STATE_VERSION } from './state';
import { addStats, appendLog } from './stats';
import { createCharacter } from '../character/create';
import { applyBirthTalents, luckHint, luckRiskChance, rollLuck, rollTalents, talentMod, talentRng } from '../character/talents';
import { randomPersonName, randomTeacherName } from '../character/names';
import { bumpUse, repeatMultiplier, scalePositiveEffects } from '../lifeStages/sessions';
import {
  clubBlockReason,
  currentStage,
  emptyEducation,
  endSchoolYear,
  joinClubState,
  startSchoolYear,
} from '../lifeStages/school';
import { autoEvents, conditionsMet, matchingTargets, selectEvents } from '../events/select';
import { relLabel } from '../relationships/people';
import { targetVars } from '../relationships/social';
import type { GameEvent } from '../events/types';
import { baseSkills, emptyWorld, newFighterProfile } from '../fighting/profile';
import { updateBody } from '../fighting/body';
import { endFightingYear, startFightingYear } from '../fighting/career';
import { emptyRelationships } from '../relationships/people';
import { generateFamily } from '../relationships/family';
import { relationshipsYear } from '../relationships/year';
import { emptyEconomy } from '../economy/ledger';
import { closeEconomicYear } from '../economy/close';

export interface NewGameOptions {
  seed: string | number;
  name: string;
  sex: Sex;
  /** Ano de nascimento. Se omitido, é sorteado pelo seed. */
  birthYear?: number;
  /** Opção "Conteúdo adulto" (padrão: desligada). */
  adultContent?: boolean;
  /** Interesse amoroso (padrão: ambos). */
  preference?: 'M' | 'F' | 'any';
  /** Local de nascimento escolhido na criação (Etapa 7); sem ele, sorteado pelo peso populacional. */
  uf?: string;
  city?: string;
  /**
   * Sobrenomes digitados na criação (Etapa 7). Com eles, `name` é só o primeiro nome: o último sobrenome é o do pai;
   * o penúltimo, o da mãe (com um só, o da mãe é sorteado). Nome final: "Nome Mãe Pai".
   */
  surnames?: string[];
  /** Aparência escolhida na criação (Etapa 7); sem ela, sorteada pela cor ou raça da UF. */
  appearance?: Appearance;
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
  let fullName = options.name;
  if (options.surnames?.length) {
    const sn = options.surnames.map((x) => x.trim()).filter(Boolean);
    const father = sn[sn.length - 1] ?? rng.pick(content.names.surnames);
    const mother = sn.length >= 2 ? sn[sn.length - 2] : rng.pick(content.names.surnames);
    fullName = composeName(options.name.trim(), mother, father);
  }
  const character = createCharacter(rng, { ...options, name: fullName }, content.geo, birthYear, options.uf && options.city ? { uf: options.uf, city: options.city } : undefined, options.appearance);
  const talent = Math.round((0.65 + 0.7 * ((rng.next() + rng.next()) / 2)) * 100) / 100;
  // talentos de nascimento e sorte (release 0.0.1): RNG derivado da seed, não mexe no rngState
  applyBirthTalents(character, rollTalents(talentRng(seed, 'player'), content), rollLuck(talentRng(seed, 'sorte')), content);
  const state: GameState = {
    version: STATE_VERSION,
    seed,
    rngState: rng.state,
    year: birthYear,
    character,
    money: 0,
    yearUses: {},
    college: emptyCollege(),
    sportsClub: null,
    exchange: null,
    scene: null,
    eventLastAge: {},
    flags: {},
    firedEvents: [],
    pendingEvents: [],
    scheduledEvents: [],
    education: emptyEducation(),
    fighter: newFighterProfile(baseSkills(), talent, rng.int(40, 75)),
    world: emptyWorld(),
    activeFight: null,
    relationships: { ...emptyRelationships(options.adultContent ?? false), settings: { adultContent: options.adultContent ?? false, preference: options.preference ?? 'any' } },
    economy: emptyEconomy(0, birthYear),
    log: [],
    alive: true,
    health: emptyHealth(),
    feats: {},
    dynasty: emptyDynasty(character.name.split(' ').slice(-1)[0] ?? character.name, birthYear),
    ending: null,
    wardrobe: { ...defaultWardrobe(content), facialHair: options.appearance?.facialHair ?? 'nenhuma' },
    police: emptyPolice(),
    crime: emptyCrime(),
    prison: null,
    population: emptyPopulation(),
    civilService: emptyCivilService(),
  };
  const withFamily = generateFamily(state, rng, content, 0);
  state.relationships = withFamily.relationships;
  state.rngState = rng.state;
  const pronoun = character.sex === 'M' ? 'um menino' : 'uma menina';
  return appendLog(
    state,
    `Você nasceu ${pronoun} em ${character.city} (${character.uf}). Seu nome é ${character.name}.`,
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
  | 'prison';

export function actionBlockReason(state: GameState, action: ActionDef | undefined): ActionBlockReason | null {
  if (!action) return 'unknown';
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'pending-event';
  // preso (fechado/semiaberto): só as ações da prisão (release 0.0.2)
  if (state.prison && state.prison.regime !== 'aberto') return 'prison';
  if (state.character.age < action.minAge) return 'too-young';
  if (action.maxAge !== undefined && state.character.age > action.maxAge) return 'too-old';
  const req = action.requires;
  if (req?.enrolled && !state.education.current) return 'not-enrolled';
  if (req?.college && !inCollege(state)) return 'not-enrolled';
  if (req?.schoolStages) {
    const stage = currentStage(state);
    if (!stage) return 'not-enrolled';
    if (!req.schoolStages.includes(stage)) return 'wrong-stage';
  }
  return null;
}

/** Ação disponível para o personagem agora (ignora eventos pendentes). Usado pela UI para esconder ações. */
export function isActionAvailable(state: GameState, action: ActionDef): boolean {
  const r = actionBlockReason(state, action);
  return r === null || r === 'pending-event';
}

/** Chave do retorno decrescente de uma ação (`yearUses`). */
export function actionUseKey(actionId: string): string {
  return `acao:${actionId}`;
}

/**
 * Aplica os efeitos da ação. Sem limite por ano, mas cada repetição no mesmo ano rende menos (efeitos positivos ×
 * `repeatMultiplier`). Se a ação não for permitida, devolve o estado inalterado.
 */
export function performAction(state: GameState, actionId: string, content: GameContent): GameState {
  const action = content.actions.find((a) => a.id === actionId);
  if (actionBlockReason(state, action) !== null || !action) return state;

  return withRng(state, (rng, s) => {
    const ctx = { rng, content, immediateSource: 'action' as const };
    const key = actionUseKey(action.id);
    const mult = repeatMultiplier(s, key, content);
    // prodígio intelectual (talento): estudar rende mais
    const study = action.id === 'study' || action.id === 'study_exams' ? 1 + talentMod(s, content, 'studyGain') : 1;
    const effects = scalePositiveEffects(boostPositive(withVariance(action.effects, action.variance ?? 0, rng), study), mult);
    let next = applyEffects(bumpUse(s, key), effects, ctx);
    next = appendLog(next, formatText(next, rng.pick(action.logTexts)));
    if (action.risk && rng.chance(luckRiskChance(next, action.risk.chance, 'bad', content))) {
      next = applyEffects(next, action.risk.effects, ctx);
      next = appendLog(next, formatText(next, action.risk.logText));
    }
    return withEventVars(next, rng, content);
  });
}

/** Multiplica os ganhos positivos de inteligência e de média escolar (talento prodígio). */
function boostPositive(effects: Effects, k: number): Effects {
  if (k === 1) return effects;
  const out: Effects = { ...effects };
  if (effects.stats?.intelligence && effects.stats.intelligence > 0) out.stats = { ...effects.stats, intelligence: Math.round(effects.stats.intelligence * k) };
  if (effects.school?.average && effects.school.average > 0) out.school = { ...effects.school, average: Math.round(effects.school.average * k) };
  return out;
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
    return joinClubState(s, clubId, content, rng);
  });
}

export function leaveClub(state: GameState, content: GameContent): GameState {
  const cur = state.education.current;
  if (!state.alive || !cur?.club || state.pendingEvents.length > 0 || state.activeFight) return state;
  const club = content.clubs.find((c) => c.id === cur.club);
  const next: GameState = {
    ...state,
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
  // crescer deixa o corpo mais capaz; o declínio adulto vem de `trainingYear` (idade + sedentarismo)
  if (age <= 17) delta.athletic = rng.int(0, 2);
  if (age >= 3 && age <= 22) delta.intelligence = rng.int(0, 2);
  if (age >= 70) delta.looks = -rng.int(0, 1);
  // o corpo se recupera de pancadas, lesões e doenças rumo a um teto que cai com a idade (Etapa 6)
  const target = age < 45 ? 90 : Math.max(25, 90 - (age - 45) * 1.3);
  if (stats.health < target) delta.health = Math.round((target - stats.health) * (age < 45 ? 0.35 : 0.2));
  else if (age >= 45) delta.health = -rng.int(0, age >= 70 ? 3 : 2);
  // felicidade tende lentamente a 60
  delta.happiness = Math.round((60 - stats.happiness) * 0.1) + rng.int(-2, 2);
  return {
    ...state,
    character: { ...state.character, stats: addStats(stats, delta) },
  };
}


/** Variáveis de texto sorteadas para um evento ({colega}, {professor}, {clube}). */
function makeEventVars(state: GameState, rng: Rng, content: GameContent): EventVars {
  const regiao = ufDef(content.geo, state.character.uf)?.regiao;
  const fighterName = randomPersonName(rng, content.names, state.character.sex, state.year - state.character.age, regiao);
  const fighterNick = rng.pick(content.fighting.nicknames);
  const [first, ...rest] = fighterName.split(' ');
  const vars: EventVars = {
    colega: randomPersonName(rng, content.names, undefined, state.year - state.character.age, regiao),
    professor: randomTeacherName(rng, content.names),
    lutador: [first, `'${fighterNick}'`, ...rest].join(' '),
    lutador_nome: fighterName,
    lutador_apelido: fighterNick,
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
    let v = vars ?? makeEventVars(state, rng, content);
    // evento com pessoa-alvo: sorteia quem é {pessoa} (follow-ups herdam o alvo)
    if (event.conditions.relationship && !v.pessoa_id) {
      const targets = matchingTargets(state, event);
      if (targets.length) {
        const t = rng.pick(targets);
        v = { ...v, ...targetVars(t.person, relLabel(t.rel.type, t.person.sex)) };
      }
    }
    pending.push({ eventId: event.id, source, vars: v });
  };

  for (const s of due) {
    const ev = byId(s.eventId);
    if (ev && !chosen.has(ev.id) && conditionsMet(state, ev, content, s.vars)) add(ev, 'followUp', s.vars);
  }
  for (const ev of autoEvents(state, content.events, content)) if (!chosen.has(ev.id)) add(ev, 'auto');

  const randomCount = Math.max(0, target - pending.length);
  const pool = content.events.filter((e) => !chosen.has(e.id));
  for (const ev of selectEvents(state, pool, randomCount, rng, content)) add(ev, 'random');

  return {
    ...state,
    scheduledEvents,
    pendingEvents: [...state.pendingEvents, ...pending],
    firedEvents: [...state.firedEvents, ...pending.map((p) => p.eventId)],
    // intervalo de repetição: guarda a idade em que cada evento aconteceu por último
    eventLastAge: { ...state.eventLastAge, ...Object.fromEntries(pending.map((p) => [p.eventId, state.character.age])) },
  };
}

/**
 * Tick anual: fecha o ano letivo, envelhece, aplica efeitos naturais, abre o novo ano letivo,
 * zera os contadores anuais e seleciona eventos (follow-ups, automáticos e 1–2 aleatórios).
 * Bloqueado (estado inalterado) se houver evento pendente ou o personagem estiver morto.
 */
export function advanceYear(
  state: GameState,
  content: GameContent,
  options: AdvanceYearOptions = {},
): GameState {
  if (!state.alive || state.pendingEvents.length > 0 || state.activeFight) return state;
  const twoEventChance = options.twoEventChance ?? 0.35;

  return withRng(state, (rng, s) => {
    // no intercâmbio, o ano letivo da escola fica em pausa (sem nota e sem reprovar)
    let next = onExchange(s) ? s : endSchoolYear(s, rng, content);
    next = collegeYear(next, rng, content);
    next = postgradYear(next, content);
    next = sportsClubYear(next, content);
    next = exchangeYear(next, rng, content);
    next = endFightingYear(next, content);
    // lesões: 12 meses de recuperação (sequelas ao sarar)
    next = injuriesYear(next, rng, content);
    // crime: investigação pelo procurado, suspeita do dinheiro sujo, procurado cai (release 0.0.2)
    next = crimeYear(next, rng, content);
    if (!next.alive) return next;
    // pena: tempo cumprido, progressão de regime, condicional, soltura (release 0.0.2)
    next = prisonYear(next, rng, content);
    // fecha o ano econômico (salário, custos, impostos, dívida) e abre o extrato do novo ano
    next = closeEconomicYear(next, rng, content);
    // carreira policial: formação, estágio, promoção, aposentadoria (release 0.0.2)
    next = policeYear(next, rng, content);
    next = policeColleaguesYear(next, rng, content);
    next = {
      ...next,
      year: next.year + 1,
      character: { ...next.character, age: next.character.age + 1 },
    };
    next = naturalAging(next, rng);
    next = appendLog(next, `Você fez ${next.character.age} ${next.character.age === 1 ? 'ano' : 'anos'}.`);
    // doenças, dano cerebral na velhice e hábitos
    next = healthYear(next, rng, content);
    next = eatingYear(next);
    next = updateBody(next);

    const cause = deathCheck(next, rng, content);
    if (cause) return killCharacter(next, cause, content);

    next = startSchoolYear(next, rng, content);
    // ano novo: os contadores do retorno decrescente recomeçam (as sessões de treino zeram no ano de luta)
    next = { ...next, yearUses: {} };
    next = relationshipsYear(next, rng, content);
    next = startFightingYear(next, rng, content);
    next = fameYear(next);
    // pista da sorte (oculta): de vez em quando, nos extremos, uma frase no log
    const hint = luckHint(next);
    if (hint && next.character.age >= 8 && next.character.age % 7 === 1) next = appendLog(next, hint);

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
    // a sorte inclina a chance do risco (com limite); risco 'good' fica mais provável para quem tem sorte
    const risky = choice.risk !== undefined && rng.chance(luckRiskChance(s, choice.risk.chance, choice.risk.tone, content));
    const effects = risky ? choice.risk?.effects : choice.effects;
    const resultText = risky ? (choice.risk?.resultText ?? choice.resultText) : choice.resultText;
    // o texto usa o estado ANTES dos efeitos (ex.: nome da escola antiga numa transferência)
    const logText = formatText(s, `${event.text} ${resultText}`, pending.vars);
    let next: GameState = appendLog(
      { ...s, pendingEvents: s.pendingEvents.filter((_, i) => i !== pendingIdx) },
      logText,
    );
    next = applyEffects(next, effects, { rng, content, ...(pending.vars ? { vars: pending.vars } : {}) });
    // morte por evento (acidente, luta clandestina...)
    const eventDeath = next.flags.morte_evento;
    if (typeof eventDeath === 'string') {
      const flags = { ...next.flags };
      delete flags.morte_evento;
      return killCharacter({ ...next, flags }, eventDeath, content);
    }
    return withEventVars(next, rng, content);
  });
}
