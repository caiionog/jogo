/**
 * Passar tempo com todos os amigos (release 0.0.3): atividades em grupo por idade, quem vai e quem falta, e um
 * evento de grupo ocasional com duas pessoas presentes ({pessoa} e {pessoa2}).
 */
import type { GameContent } from '../core/content';
import { createRng, seedToState } from '../core/rng';
import type { Rng } from '../core/rng';
import type { EventVars, GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { behindBars } from '../crime/prison';
import { post } from '../economy/ledger';
import { conditionsMet } from '../events/select';
import { bumpUse, repeatMultiplier, scaleGain, sessionsLeft, useSessions } from '../lifeStages/sessions';
import { canHaveSexualContentWith, isValidPartnerAge } from './guards';
import { changeAffection, firstName, getRelation, relLabel, relationsOf, updateRelation } from './people';
import { targetVars } from './social';
import type { GroupActivityDef, Person } from './types';

/** Chave do retorno decrescente (`yearUses`) das saídas em grupo. */
export const GROUP_USE_KEY = 'grupo:todos';
/** Afeto abaixo disso: a pessoa está de mal e não vai. */
export const GROUP_FEUD_AFFECTION = 25;
export const GROUP_BUSY_CHANCE = 0.15;
export const GROUP_TRAVEL_CHANCE = 0.07;
/** Idade a partir da qual o personagem paga a atividade. */
export const GROUP_PAYING_AGE = 14;
/** Capacidade atlética de "treinar juntos" (antes do retorno decrescente). */
export const GROUP_TRAINING_ATHLETIC = 2;

export type GroupAbsenceReason = 'ocupado' | 'viajando' | 'brigado';
export type GroupBlockReason = 'busy' | 'unknown' | 'too-young' | 'age' | 'no-friends' | 'no-money' | 'no-sessions';

export interface GroupAvailability {
  present: Person[];
  absent: { person: Person; reason: GroupAbsenceReason }[];
}

/** Atividades em grupo cuja faixa de idade contém a idade do personagem. */
export function groupActivities(state: GameState, content: GameContent): GroupActivityDef[] {
  const age = state.character.age;
  return content.friends.activities.filter((a) => age >= a.minAge && age <= a.maxAge);
}

function activityDef(content: GameContent, id: string): GroupActivityDef | undefined {
  return content.friends.activities.find((a) => a.id === id);
}

/**
 * Quem vai e quem falta (amizades e colegas de treino vivos). De mal (afeto < 25) não vai; dos demais, cada um tem uma
 * chance estável no ano (RNG derivado da seed, ano e pessoa — nunca o `rngState`) de estar ocupado ou viajando.
 */
export function groupAvailability(state: GameState, _content?: GameContent): GroupAvailability {
  const present: Person[] = [];
  const absent: GroupAvailability['absent'] = [];
  for (const { person, rel } of relationsOf(state, ['amigo', 'colega_treino'])) {
    if (rel.affection < GROUP_FEUD_AFFECTION) {
      absent.push({ person, reason: 'brigado' });
      continue;
    }
    const roll = createRng(seedToState(`${state.seed}:grupo:${state.year}:${person.id}`)).next();
    if (roll < GROUP_BUSY_CHANCE) absent.push({ person, reason: 'ocupado' });
    else if (roll < GROUP_BUSY_CHANCE + GROUP_TRAVEL_CHANCE) absent.push({ person, reason: 'viajando' });
    else present.push(person);
  }
  return { present, absent };
}

/** Motivo para não poder sair com a turma (null = pode). */
export function groupBlockReason(state: GameState, activityId: string, content: GameContent): GroupBlockReason | null {
  if (!state.alive || state.pendingEvents.length > 0 || state.activeFight || behindBars(state)) return 'busy';
  const a = activityDef(content, activityId);
  if (!a) return 'unknown';
  const age = state.character.age;
  if (age < a.minAge) return 'too-young';
  if (age > a.maxAge) return 'age';
  if (groupAvailability(state, content).present.length === 0) return 'no-friends';
  if (a.cost > 0 && age >= GROUP_PAYING_AGE && state.money < a.cost) return 'no-money';
  if (a.training && sessionsLeft(state, content) < 1) return 'no-sessions';
  return null;
}

function absenceText(person: Person, reason: GroupAbsenceReason): string {
  const o = person.sex === 'M' ? 'o' : 'a';
  const why = reason === 'ocupado' ? `ocupad${o}` : reason === 'viajando' ? 'viajando' : `brigad${o} com você`;
  return `${firstName(person.name)} (${why})`;
}

/** Sai com todos os amigos disponíveis. Estado inalterado se bloqueado. */
export function hangOutAll(state: GameState, activityId: string, content: GameContent): GameState {
  if (groupBlockReason(state, activityId, content) !== null) return state;
  const a = activityDef(content, activityId)!;
  const { present, absent } = groupAvailability(state, content);
  const rng = createRng(state.rngState);
  const rep = repeatMultiplier(state, GROUP_USE_KEY, content);
  let s = bumpUse(state, GROUP_USE_KEY);

  if (a.cost > 0 && s.character.age >= GROUP_PAYING_AGE) s = post(s, 'familia', -a.cost, a.label);
  const statDelta: { happiness: number; athletic?: number } = { happiness: scaleGain(a.happiness, rep) };
  if (a.training) {
    s = useSessions(s, 1);
    statDelta.athletic = scaleGain(GROUP_TRAINING_ATHLETIC, rep);
  }
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, statDelta) } };

  for (const p of present) {
    const close = (getRelation(s, p.id)?.affection ?? 0) >= 70;
    s = changeAffection(s, p.id, scaleGain(Math.round(a.affection * (close ? 1.5 : 1)), rep), `${a.label} com a turma.`);
    s = updateRelation(s, p.id, (r) => ({ ...r, interactedYear: s.year }));
  }
  s = { ...s, relationships: { ...s.relationships, lastGroup: { year: s.year, activityId: a.id, present: present.map((p) => p.id) } } };
  // quem não foi vem antes: a última linha (a atividade) é a que vira o toast
  if (absent.length) s = appendLog(s, `Não foram: ${absent.map((x) => absenceText(x.person, x.reason)).join(', ')}.`);
  s = appendLog(s, a.text.replace(/\{n\}/g, String(present.length)));

  s = maybeGroupEvent(s, present, rng, content);
  return { ...s, rngState: rng.state };
}

/** Variáveis de um evento de grupo: {pessoa} e {pessoa2} (duas pessoas presentes diferentes). */
export function groupEventVars(state: GameState, p1: Person, p2: Person): EventVars {
  const t1 = getRelation(state, p1.id);
  const t2 = getRelation(state, p2.id);
  return {
    ...targetVars(p1, t1 ? relLabel(t1.type, p1.sex) : ''),
    pessoa2: firstName(p2.name),
    pessoa2_nome: p2.name,
    pessoa2_id: p2.id,
    relacao2: t2 ? relLabel(t2.type, p2.sex).toLowerCase() : '',
  };
}

/**
 * Guardas do evento de grupo para o PAR sorteado (a condição `relationship` não se aplica a eles):
 * - evento de casal NPC × NPC (`social.npcCouple` em alguma escolha) só para um par que pode namorar entre si
 *   (`isValidPartnerAge`), para que nenhum texto narre namoro de menor com adulto;
 * - evento `adult` exige que o personagem possa ter conteúdo adulto com AS DUAS pessoas (18+ e opção ligada).
 */
export function groupEventFits(state: GameState, e: { tags?: readonly string[]; choices: readonly { effects?: unknown; risk?: { effects?: unknown } }[] }, p1: Person, p2: Person): boolean {
  const couple = e.choices.some((c) => JSON.stringify(c.effects ?? {}).includes('"npcCouple":true') || JSON.stringify(c.risk?.effects ?? {}).includes('"npcCouple":true'));
  if (couple && !isValidPartnerAge(p1.age, p2.age)) return false;
  if (e.tags?.includes('adult') && !(canHaveSexualContentWith(state, p1) && canHaveSexualContentWith(state, p2))) return false;
  return true;
}

function maybeGroupEvent(state: GameState, present: Person[], rng: Rng, content: GameContent): GameState {
  const ids = content.friends.groupEvents;
  if (present.length < 2 || ids.length === 0) return state;
  if (!rng.chance(content.friends.groupEventChance)) return state;
  const events = ids.map((id) => content.events.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e);
  if (!events.length) return state;
  // pares em ordem sorteada; usa o primeiro par para o qual algum evento tem as condições atendidas
  const order = [...present];
  for (let i = order.length - 1; i > 0; i--) {
    const k = rng.int(0, i);
    [order[i], order[k]] = [order[k]!, order[i]!];
  }
  for (let i = 0; i < order.length; i++) {
    for (let j = 0; j < order.length; j++) {
      if (i === j) continue;
      const p1 = order[i]!;
      const p2 = order[j]!;
      const vars = groupEventVars(state, p1, p2);
      const ok = events.filter((e) => conditionsMet(state, e, content, vars) && groupEventFits(state, e, p1, p2));
      if (!ok.length) continue;
      const ev = rng.pick(ok);
      return { ...state, pendingEvents: [...state.pendingEvents, { eventId: ev.id, source: 'followUp', vars }] };
    }
  }
  return state;
}
