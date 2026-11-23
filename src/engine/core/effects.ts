import { examBlockReason, takeExamWith } from '../lifeStages/college';
import { changeLuck, revealTalent } from '../character/talents';
import { applySkillDelta } from '../fighting/profile';
import type { GameContent } from './content';
import type { Rng } from './rng';
import type { ClubId, EventSource, EventVars, FlagValue, GameState, SchoolType, StatKey } from './state';
import { addStats, clamp } from './stats';
import { joinClubState, transferSchool } from '../lifeStages/school';
import { withPreposition } from '../character/names';
import { post } from '../economy/ledger';
import { applyMoveEffect } from '../geo';
import type { MoveEffect } from '../geo';
import { applyEconomyEffects } from '../economy/effects';
import type { EconomyEffects } from '../economy/effects';
import { applyFighterEffects } from '../fighting/career';
import type { FighterEffects } from '../fighting/career';
import { applySocialEffects } from '../relationships/social';
import type { SocialEffects } from '../relationships/social';
import { applyHealthEffects } from '../health/effects';
import type { HealthEffects } from '../health/effects';

/** Agenda um evento de continuação. delayYears = 0 → pendente imediatamente. */
export interface FollowUp {
  eventId: string;
  delayYears: number;
}

/** Efeitos sobre a matrícula atual. Ignorados se o personagem não estiver matriculado. */
export interface SchoolEffects {
  average?: number;
  discipline?: number;
  popularity?: number;
  absences?: number;
  /** Suspensão: disciplina −15, faltas +3, suspensões +1, flag `suspenso`. */
  suspend?: boolean;
  /** Expulsão imediata: transferência para escola pública, flag `expulso`. */
  expel?: boolean;
  /** Troca de escola (ex.: bolsa, mudança da família). Sem `type`, sorteia pela renda da família. */
  changeSchool?: { type?: SchoolType };
  joinClub?: ClubId;
  leaveClub?: boolean;
}

/** Efeito declarativo, usado por ações, clubes e escolhas de eventos. */
export interface Effects {
  stats?: Partial<Record<StatKey, number>>;
  /** Revela um talento de nascimento do personagem (se ele tiver). */
  revealTalent?: string;
  /** Muda a sorte oculta (limitado por `luck.maxEventChange`). */
  luck?: number;
  /** Faculdade: fazer o exame nacional agora. */
  college?: { exam?: boolean };
  money?: number;
  setFlags?: Record<string, FlagValue>;
  clearFlags?: string[];
  school?: SchoolEffects;
  /** Efeitos de carreira de luta (habilidades, reputação, academia, contrato, lesão, ofertas...). */
  fighter?: FighterEffects;
  /** Efeitos de relacionamento (afeto do alvo {pessoa}, conhecer alguém, namoro, casamento, filhos...). */
  social?: SocialEffects;
  /** Efeitos econômicos (emprego, bens, patrocínio, impostos, empréstimos...). */
  economy?: EconomyEffects;
  /** Lesões, doenças, dano cerebral, morte por evento (Etapa 6). */
  health?: HealthEffects;
  /** Mudança de cidade sorteada (Etapa 7). */
  move?: MoveEffect;
  followUps?: FollowUp[];
}

/** Contexto necessário para efeitos que sorteiam algo ou encadeiam eventos. */
export interface EffectContext {
  rng: Rng;
  content: GameContent;
  /** Variáveis do evento de origem, herdadas pelos follow-ups. */
  vars?: EventVars;
  /** Origem atribuída a follow-ups imediatos (delay 0). Padrão: 'followUp'. */
  immediateSource?: EventSource;
}

export const SUSPENSION_DISCIPLINE_PENALTY = 15;

export function applyEffects(state: GameState, effects: Effects | undefined, ctx?: EffectContext): GameState {
  if (!effects) return state;
  let flags = state.flags;
  if (effects.setFlags || effects.clearFlags) {
    flags = { ...flags, ...effects.setFlags };
    for (const f of effects.clearFlags ?? []) delete flags[f];
  }
  let next: GameState = {
    ...state,
    flags,
    character: effects.stats
      ? { ...state.character, stats: addStats(state.character.stats, effects.stats) }
      : state.character,
  };  // talentos e sorte (release 0.0.1)
  if (effects.revealTalent && ctx) next = revealTalent(next, effects.revealTalent, ctx.content);
  if (effects.luck && ctx) next = changeLuck(next, effects.luck, ctx.content);
  if (effects.college?.exam && ctx && examBlockReason(next) !== 'too-young') next = takeExamWith(next, ctx.rng, ctx.content);

  // dinheiro só via extrato (inteiro)
  if (effects.money) next = post(next, effects.money > 0 ? 'eventos' : 'eventos', effects.money, 'Evento');
  if (effects.school) next = applySchoolEffects(next, effects.school, ctx);
  if (effects.move) {
    if (!ctx) throw new Error('applyEffects: mudança exige EffectContext');
    next = applyMoveEffect(next, effects.move, ctx.rng, ctx.content);
  }
  if (effects.fighter) {
    const fx = effects.fighter;
    const needsCtx = fx.joinGym || fx.signWith || fx.injury || fx.offer;
    if (needsCtx && !ctx) throw new Error('applyEffects: efeitos de luta exigem EffectContext');
    if (ctx) next = applyFighterEffects(next, fx, ctx.rng, ctx.content, ctx.vars);
    else next = applyFighterEffectsNoCtx(next, fx);
  }
  if (effects.social) {
    if (!ctx) throw new Error('applyEffects: efeitos sociais exigem EffectContext');
    next = applySocialEffects(next, effects.social, ctx.rng, ctx.content, ctx.vars);
  }
  if (effects.economy) {
    if (!ctx) throw new Error('applyEffects: efeitos econômicos exigem EffectContext');
    next = applyEconomyEffects(next, effects.economy, ctx.rng, ctx.content, ctx.vars);
  }
  if (effects.health) {
    if (!ctx) throw new Error('applyEffects: efeitos de saúde exigem EffectContext');
    next = applyHealthEffects(next, effects.health, ctx.rng, ctx.content, ctx.vars);
  }
  if (effects.followUps?.length) next = applyFollowUps(next, effects.followUps, ctx);
  return next;
}

/** Efeitos de luta que não precisam de RNG/conteúdo (ex.: bônus anual de clube). */
function applyFighterEffectsNoCtx(state: GameState, fx: FighterEffects): GameState {
  let s = fx.skills ? applySkillDelta(state, fx.skills) : state;
  if (fx.reputation) s = { ...s, fighter: { ...s.fighter, reputation: Math.min(100, Math.max(0, s.fighter.reputation + fx.reputation)) } };
  return s;
}

function applySchoolEffects(state: GameState, fx: SchoolEffects, ctx?: EffectContext): GameState {
  const cur = state.education.current;
  if (!cur) return state;
  let next = state;
  let e = {
    ...cur,
    average: clamp(cur.average + (fx.average ?? 0)),
    discipline: clamp(cur.discipline + (fx.discipline ?? 0)),
    popularity: clamp(cur.popularity + (fx.popularity ?? 0)),
    absences: Math.max(0, cur.absences + (fx.absences ?? 0)),
  };
  if (fx.suspend) {
    e = {
      ...e,
      discipline: clamp(e.discipline - SUSPENSION_DISCIPLINE_PENALTY),
      absences: e.absences + 3,
      suspensions: e.suspensions + 1,
    };
    next = { ...next, flags: { ...next.flags, suspenso: true } };
  }
  if (fx.leaveClub) e = { ...e, club: null };
  next = { ...next, education: { ...next.education, current: e } };
  if (fx.joinClub) {
    if (!ctx) throw new Error('applyEffects: joinClub exige EffectContext');
    next = joinClubState(next, fx.joinClub, ctx.content, ctx.rng);
  }
  if (fx.expel || fx.changeSchool) {
    if (!ctx) throw new Error('applyEffects: troca de escola exige EffectContext');
    next = transferSchool(next, ctx.rng, ctx.content, {
      expelled: fx.expel === true,
      type: fx.expel ? 'publica' : fx.changeSchool?.type,
    });
  }
  return next;
}

function applyFollowUps(state: GameState, followUps: FollowUp[], ctx?: EffectContext): GameState {
  const vars = ctx?.vars;
  const pending = state.pendingEvents.slice();
  const scheduled = state.scheduledEvents.slice();
  for (const f of followUps) {
    if (f.delayYears <= 0) {
      pending.push({ eventId: f.eventId, source: ctx?.immediateSource ?? 'followUp', ...(vars ? { vars } : {}) });
    } else {
      scheduled.push({ eventId: f.eventId, dueAge: state.character.age + f.delayYears, ...(vars ? { vars } : {}) });
    }
  }
  return { ...state, pendingEvents: pending, scheduledEvents: scheduled };
}

/** Escolhe a forma masculina ou feminina conforme o sexo do personagem. */
export function gendered(state: GameState, masc: string, fem: string): string {
  return state.character.sex === 'M' ? masc : fem;
}

/**
 * Substitui placeholders no texto: {name}, {city}, {escola}, {da_escola}, {na_escola} e as variáveis do evento
 * ({colega}, {professor}, {clube}...). Também aceita {o/a} para concordância de gênero e, no legado,
 * {antecessor} e {seu_pai}.
 */
export function formatText(state: GameState, text: string, vars?: EventVars): string {
  const cur = state.education.current;
  let out = text
    .replaceAll('{name}', state.character.name)
    .replaceAll('{city}', state.character.city)
    .replaceAll('{o/a}', gendered(state, 'o', 'a'))
    .replaceAll('{da_escola}', cur ? withPreposition(cur.school.name, 'de') : 'da escola')
    .replaceAll('{na_escola}', cur ? withPreposition(cur.school.name, 'em') : 'na escola')
    .replaceAll('{escola}', cur?.school.name ?? 'a escola');
  // legado (Etapa 6): o antecessor jogado — {antecessor} (nome), {seu_pai} ("seu pai"/"sua mãe")
  const prev = state.dynasty?.members.at(-1);
  if (prev) out = out.replaceAll('{antecessor}', prev.name).replaceAll('{seu_pai}', prev.sex === 'M' ? 'seu pai' : 'sua mãe');
  for (const [k, v] of Object.entries(vars ?? {})) out = out.replaceAll(`{${k}}`, v);
  return out;
}
