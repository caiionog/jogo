/**
 * Condições e efeitos `police` dos eventos (release 0.0.2, fase 3): ocorrências, troca de tiro, investigações
 * encadeadas da Polícia Civil, dilemas, curso de seleção da força especial e NPCs presos pelo personagem.
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { luckFactor } from '../character/talents';
import { addInjury, pickInjury } from '../fighting/injuries';
import { addRelation, createPerson } from '../relationships/people';
import { addNotable, leavePolice } from './career';
import { specialDef } from './defs';
import { rollShootout, shootoutText } from './shootout';
import type { CaseOutcome, PoliceCareer, PoliceForce, PoliceStage, PoliceTrackId, PoliceUnit, ShootoutTactic } from './types';

export interface PoliceConditions {
  force?: PoliceForce[];
  track?: PoliceTrackId[];
  stage?: PoliceStage[];
  unit?: PoliceUnit;
  /** Índice mínimo do posto. */
  minRank?: number;
  serviceYears?: { min?: number; max?: number };
  /** Investigação em andamento com este id (etapas da cadeia). */
  inCase?: string;
  /** Sem investigação em andamento (para abrir um caso novo). */
  noCase?: boolean;
  /** Já foi policial (carreira encerrada). */
  former?: boolean;
  /** Processos acumulados na corregedoria. */
  corregedoria?: { min?: number; max?: number };
}

export interface PoliceEffects {
  merit?: number;
  /** Tiro (oculto). */
  shooting?: number;
  corregedoria?: number;
  promote?: boolean;
  /** Exoneração (dilema que deu errado, corregedoria). */
  exonerate?: boolean;
  /** Ocorrência marcante (`{pessoa}` etc. já formatados pelo evento). */
  notable?: string;
  /** Troca de tiro com a tática escolhida. */
  shootout?: ShootoutTactic;
  caseStart?: string;
  /** Pista boa (+) ou ruim (−) na investigação. */
  caseScore?: number;
  /** Fecha a investigação (resolvido, arquivado ou suspeito errado). */
  caseEnd?: boolean;
  /** Etapa 1–3 do curso de seleção da força especial. */
  specialStep?: 1 | 2 | 3;
  /** Prende alguém que vira um conhecido com a flag `preso_por_voce` (pode voltar depois). */
  arrest?: boolean;
  /** Imobilizar o suspeito sem ferir: jiu-jitsu, trocação e atlética ajudam; falhar gera reclamação. */
  subdue?: boolean;
}

export function policeConditionsMet(state: GameState, c: PoliceConditions): boolean {
  const car = state.police.career;
  if (c.former !== undefined) return c.former === (!car && state.police.past.length > 0);
  if (!car) return false;
  if (c.force && !c.force.includes(car.force)) return false;
  if (c.track && !c.track.includes(car.track)) return false;
  if (c.stage && !c.stage.includes(car.stage)) return false;
  if (c.unit && car.unit !== c.unit) return false;
  if (c.minRank !== undefined && car.rank < c.minRank) return false;
  if (c.serviceYears && (car.serviceYears < (c.serviceYears.min ?? -Infinity) || car.serviceYears > (c.serviceYears.max ?? Infinity))) return false;
  if (c.inCase !== undefined && state.police.case?.id !== c.inCase) return false;
  if (c.noCase && state.police.case) return false;
  if (c.corregedoria && (car.corregedoria < (c.corregedoria.min ?? -Infinity) || car.corregedoria > (c.corregedoria.max ?? Infinity))) return false;
  return true;
}

function patch(state: GameState, fn: (c: PoliceCareer) => PoliceCareer): GameState {
  const c = state.police.career;
  return c ? { ...state, police: { ...state.police, career: fn(c) } } : state;
}

const oa = (s: GameState) => (s.character.sex === 'M' ? 'o' : 'a');

/** Resolve a troca de tiro e aplica as consequências (mérito, lesão, morte em serviço). */
export function applyShootout(state: GameState, tactic: ShootoutTactic, rng: Rng, content: GameContent): GameState {
  const outcome = rollShootout(state, tactic, rng);
  let s = appendLog(state, shootoutText(content, outcome, rng).replaceAll('{o/a}', oa(state)));
  const meritBy: Record<string, number> = { preso: tactic === 'avancar' ? 8 : 6, fuga: tactic === 'recuar' ? 0 : 1, colega_ferido: 1, ferido: 3, morte: 0 };
  s = patch(s, (c) => ({ ...c, merit: c.merit + (meritBy[outcome] ?? 0) }));
  s = { ...s, feats: { ...s.feats, shootouts: (s.feats.shootouts ?? 0) + 1 } };
  if (outcome === 'preso') s = addNotable(s, 'Prendeu um suspeito numa troca de tiro');
  if (outcome === 'colega_ferido') s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -4 }) } };
  if (outcome === 'ferido') {
    const def = pickInjury(rng, content, 'evento');
    if (def) s = addInjury(s, rng, content, def, 'evento');
    s = addNotable(s, `Ferid${oa(s)} em serviço`);
  }
  // morte: o `resolveEvent` chama `killCharacter` ao ver a flag
  if (outcome === 'morte') s = { ...s, flags: { ...s.flags, morte_evento: `Morte em serviço (${s.police.career?.force === 'pm' ? 'Polícia Militar' : 'Polícia Civil'})` }, feats: { ...s.feats, mortoEmServico: 1 } };
  return s;
}

/** Chance de imobilizar sem ferir: base + luta (oculta) + atlética + sorte (limitada). */
export function subdueChance(state: GameState): number {
  const sk = state.fighter.skills;
  return Math.max(0.2, Math.min(0.92, 0.35 + Math.max(sk.grappling, sk.trocacao * 0.8) / 150 + state.character.stats.athletic / 400 + luckFactor(state) * 0.04));
}

export function applySubdue(state: GameState, rng: Rng): GameState {
  if (rng.chance(subdueChance(state))) {
    const s = patch(appendLog(state, 'Com técnica, você imobilizou o suspeito sem machucar ninguém.'), (c) => ({ ...c, merit: c.merit + 4 }));
    return state.fighter.skills.grappling >= 40 ? addNotable(s, 'Imobilizou um suspeito sem ferir ninguém') : s;
  }
  return patch(appendLog(state, 'A imobilização saiu errada e o suspeito se machucou. Ele registrou uma reclamação.'), (c) => ({ ...c, corregedoria: c.corregedoria + 1 }));
}

/** Chance de fechar a investigação: placar das pistas + sorte (limitada). */
export function caseSolveChance(state: GameState, score: number): number {
  return Math.max(0.05, Math.min(0.92, 0.2 + score * 0.14 + luckFactor(state) * 0.05));
}

export function resolveCase(state: GameState, rng: Rng, content: GameContent): GameState {
  const pc = state.police.case;
  if (!pc) return state;
  const label = content.police.cases.find((c) => c.id === pc.id)?.label ?? 'o caso';
  const outcome: CaseOutcome = rng.chance(caseSolveChance(state, pc.score)) ? 'resolvido' : pc.score <= 0 && rng.chance(0.45) ? 'errado' : 'arquivado';
  let s: GameState = { ...state, police: { ...state.police, case: null } };
  s = appendLog(s, rng.pick(content.police.caseText[outcome]).replaceAll('{caso}', label));
  if (outcome === 'resolvido') {
    s = patch(s, (c) => ({ ...c, merit: c.merit + 10 }));
    s = addNotable(s, `Resolveu ${label}`);
    s = { ...s, feats: { ...s.feats, casesSolved: (s.feats.casesSolved ?? 0) + 1 } };
  } else if (outcome === 'errado') {
    s = patch(s, (c) => ({ ...c, merit: Math.max(0, c.merit - 5), corregedoria: c.corregedoria + 1 }));
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -5 }) } };
  }
  return s;
}

/** Chance de passar numa etapa do curso de seleção (alvo: 10–25% de aprovação nas 3 etapas). */
export function specialStepChance(state: GameState, content: GameContent): number {
  const c = state.police.career;
  const u = c ? specialDef(content, c.force) : undefined;
  if (!c || !u) return 0;
  const st = state.character.stats;
  const k = (st.athletic - u.minAthletic) / 100 + (state.police.shooting - u.minShooting) / 120 + (st.health - u.minHealth) / 300;
  return Math.max(0.15, Math.min(0.8, 0.26 + k + luckFactor(state) * 0.04));
}

export type SpecialBlockReason = 'busy' | 'no-career' | 'stage' | 'already' | 'service' | 'athletic' | 'shooting' | 'health' | 'tried';

export function specialBlockReason(state: GameState, content: GameContent): SpecialBlockReason | null {
  const c = state.police.career;
  if (!state.alive || state.pendingEvents.length || state.activeFight || state.prison) return 'busy';
  if (!c) return 'no-career';
  const u = specialDef(content, c.force);
  if (!u) return 'no-career';
  if (c.unit === 'especial') return 'already';
  if (c.stage !== 'efetivo') return 'stage';
  if (c.serviceYears < u.minServiceYears) return 'service';
  if (state.character.stats.athletic < u.minAthletic) return 'athletic';
  if (state.police.shooting < u.minShooting) return 'shooting';
  if (state.character.stats.health < u.minHealth || state.health.injuries.some((i) => i.severity >= 2)) return 'health';
  if (state.flags.curso_especial_ano === state.year) return 'tried';
  return null;
}

/** Inscreve-se no curso de seleção: abre a 1ª etapa (evento). */
export function trySpecialCourse(state: GameState, content: GameContent): GameState {
  if (specialBlockReason(state, content) !== null) return state;
  const s = patch({ ...state, flags: { ...state.flags, curso_especial_ano: state.year } }, (c) => ({ ...c, specialTries: c.specialTries + 1 }));
  return { ...s, pendingEvents: [...s.pendingEvents, { eventId: content.police.specialEvents[0], source: 'action' }] };
}

function specialStep(state: GameState, step: 1 | 2 | 3, rng: Rng, content: GameContent): GameState {
  const c = state.police.career;
  const u = c ? specialDef(content, c.force) : undefined;
  if (!c || !u) return state;
  if (!rng.chance(specialStepChance(state, content))) return appendLog(state, rng.pick(content.police.specialText.fail).replaceAll('{o/a}', oa(state)));
  if (step < 3) return { ...state, pendingEvents: [...state.pendingEvents, { eventId: content.police.specialEvents[step as 1 | 2], source: 'followUp' }] };
  let s = patch(state, (x) => ({ ...x, unit: 'especial', merit: x.merit + 10 }));
  s = appendLog(s, content.police.specialText.pass.replaceAll('{unidade}', u.name));
  return addNotable(s, `Entrou para o ${u.name}`);
}

/** Prende alguém: a pessoa vira um conhecido marcado (pode reaparecer: vingança, reencontro, delação). */
function arrestSomeone(state: GameState, rng: Rng, content: GameContent): GameState {
  const [s, p] = createPerson(state, rng, content, { age: rng.int(18, 40), flags: { preso_por_voce: true, crime: true } });
  const out = addRelation(s, p.id, 'conhecido', rng.int(0, 15), { history: [`Preso por você (${s.character.age} anos)`] });
  return { ...out, feats: { ...out.feats, arrests: (out.feats.arrests ?? 0) + 1 } };
}

export function applyPoliceEffects(state: GameState, fx: PoliceEffects, rng: Rng, content: GameContent): GameState {
  if (!state.police.career && !fx.notable) return state;
  let s = state;
  if (fx.merit) s = patch(s, (c) => ({ ...c, merit: Math.max(0, c.merit + fx.merit!) }));
  if (fx.shooting) s = { ...s, police: { ...s.police, shooting: Math.max(0, Math.min(100, s.police.shooting + fx.shooting)) } };
  if (fx.corregedoria) s = patch(s, (c) => ({ ...c, corregedoria: Math.max(0, c.corregedoria + fx.corregedoria!) }));
  if (fx.notable) s = addNotable(s, fx.notable.replaceAll('{o/a}', oa(s)));
  if (fx.arrest) s = arrestSomeone(s, rng, content);
  if (fx.caseStart) s = { ...s, police: { ...s.police, case: { id: fx.caseStart, score: 0, step: 1 } } };
  if (fx.caseScore !== undefined && s.police.case) s = { ...s, police: { ...s.police, case: { ...s.police.case, score: s.police.case.score + fx.caseScore, step: s.police.case.step + 1 } } };
  if (fx.caseEnd) s = resolveCase(s, rng, content);
  if (fx.shootout) s = applyShootout(s, fx.shootout, rng, content);
  if (fx.subdue) s = applySubdue(s, rng);
  if (fx.specialStep) s = specialStep(s, fx.specialStep, rng, content);
  if (fx.promote) {
    const c = s.police.career;
    const max = c ? (content.police.tracks.find((t) => t.id === c.track)?.ranks.length ?? 1) - 1 : 0;
    if (c && c.rank < max) s = patch(s, (x) => ({ ...x, rank: x.rank + 1, rankYears: 0 }));
  }
  if (fx.exonerate && s.police.career) {
    s = appendLog(s, `Você foi exonerad${oa(s)} da polícia.`);
    s = leavePolice(s, 'exoneracao', content);
  }
  return s;
}

/** Sem RNG externo (testes): usa o rngState do estado. */
export function applyPoliceEffectsSeeded(state: GameState, fx: PoliceEffects, content: GameContent): GameState {
  const rng = createRng(state.rngState);
  return { ...applyPoliceEffects(state, fx, rng, content), rngState: rng.state };
}
