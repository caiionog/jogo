/**
 * Release 0.0.4, fase 3: o lado dos NPCs. Uma vez por ano:
 * - casos escondidos podem ser descobertos pelos parceiros "oficiais" (relação aberta não conta como traição);
 * - amizades próximas tomam a iniciativa (chamam para sair, ligam, ajudam);
 * - alguém que gosta muito de você pode se declarar (só dentro de `isValidPartnerAge`, nunca professor da escola);
 * - ex-amizades podem ser reatadas (`reconnectExFriend`).
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { isSchoolTeacher, isValidPartnerAge } from './guards';
import { changeAffection, firstName, MAX_ACTIVE_PEOPLE, newRomanceMode, partners, relationsOf, updatePerson, updateRelation, withHistory } from './people';
import { breakUp } from './romance';
import type { ArchivedPerson } from './types';

/** Chance anual de um caso escondido ser descoberto. */
export const AFFAIR_DISCOVERY_CHANCE = 0.22;
export const INITIATIVE_CHANCE = 0.15;
export const CONFESSION_CHANCE = 0.08;

export function discoverAffairs(state: GameState, rng: Rng): GameState {
  let s = state;
  for (const affair of partners(s).filter((x) => x.rel.romance?.secret)) {
    const betrayed = partners(s).filter((x) => !x.rel.romance?.secret && !x.rel.romance?.open && x.person.id !== affair.person.id);
    if (!betrayed.length) {
      // ninguém a enganar (o parceiro oficial saiu ou abriu a relação): o caso deixa de ser escondido
      s = updateRelation(s, affair.person.id, (r) => ({ ...r, romance: { ...r.romance!, secret: false } }));
      continue;
    }
    if (!rng.chance(AFFAIR_DISCOVERY_CHANCE)) continue;
    for (const b of betrayed) s = changeAffection(s, b.person.id, -rng.int(25, 40), `Descobriu o caso com ${firstName(affair.person.name)}.`);
    const main = betrayed[0]!;
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -8 }) } };
    s = appendLog(s, `${firstName(main.person.name)} descobriu seu caso com ${firstName(affair.person.name)}. A casa caiu.`);
    // o caso termina; quem foi traído decide o resto pelo afeto (decaimento e divórcio do ciclo anual)
    s = breakUp(s, affair.person.id, true);
    s = { ...s, flags: { ...s.flags, traicao_descoberta: s.year } };
  }
  return s;
}

/** Amizades próximas tomam a iniciativa (até 2 por ano). */
export function friendsInitiative(state: GameState, rng: Rng): GameState {
  let s = state;
  let n = 0;
  const lines = ['chamou você para sair', 'ligou só para saber como você está', 'apareceu com um café e uma fofoca', 'convidou você para o aniversário'];
  for (const { person, rel } of relationsOf(s, ['amigo', 'colega_treino'])) {
    if (n >= 2) break;
    if (rel.affection < 65 || !rng.chance(INITIATIVE_CHANCE)) continue;
    n++;
    s = changeAffection(s, person.id, rng.int(2, 4), 'Tomou a iniciativa.');
    s = updateRelation(s, person.id, (r) => ({ ...r, interactedYear: s.year }));
    s = appendLog(s, `${firstName(person.name)} ${rng.pick(lines)}.`);
  }
  return s;
}

/**
 * Alguém que gosta muito de você se declara: marca a pessoa com `quer_namorar` e o evento `rel_confession` (conteúdo)
 * pergunta o que fazer. Só se você puder começar um romance livre e a idade for válida para namoro.
 */
export function confessions(state: GameState, rng: Rng): GameState {
  if (state.character.age < 14 || newRomanceMode(state) !== 'free' || partners(state).length) return state;
  for (const { person, rel } of relationsOf(state, ['amigo', 'colega_treino', 'conhecido'])) {
    if (rel.affection < 75 || person.flags.quer_namorar || !isValidPartnerAge(state.character.age, person.age) || isSchoolTeacher(person)) continue;
    if (!rng.chance(CONFESSION_CHANCE)) continue;
    return updatePerson(state, person.id, (p) => ({ ...p, flags: { ...p.flags, quer_namorar: true } }));
  }
  return state;
}

export function relationshipsInitiativeYear(state: GameState, rng: Rng): GameState {
  return confessions(friendsInitiative(discoverAffairs(state, rng), rng), rng);
}

// ---------------------------------------------------------------------------
// ex-amizades
// ---------------------------------------------------------------------------

/** Ex-amizades guardadas com a pessoa (vivas), da mais recente para a mais antiga. */
export function exFriends(state: GameState): ArchivedPerson[] {
  return state.relationships.archived.filter((a) => !!a.person).slice().reverse();
}

export type ReconnectBlockReason = 'busy' | 'unknown' | 'tried' | 'full';

export function reconnectBlockReason(state: GameState, personId: string): ReconnectBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (!state.relationships.archived.some((a) => a.person?.id === personId)) return 'unknown';
  if (state.yearUses[`reatar:${personId}`]) return 'tried';
  if (state.relationships.people.length >= MAX_ACTIVE_PEOPLE) return 'full';
  return null;
}

/** Tentar reatar uma amizade antiga: metade das vezes dá certo (mais se faz pouco tempo). Uma tentativa por ano. */
export function reconnectExFriend(state: GameState, personId: string, _content?: GameContent): GameState {
  if (reconnectBlockReason(state, personId) !== null) return state;
  const rng = createRng(state.rngState);
  const entry = state.relationships.archived.find((a) => a.person?.id === personId)!;
  const p = entry.person!;
  const years = Math.max(0, state.character.age - (entry.endedAge ?? state.character.age));
  let s: GameState = { ...state, yearUses: { ...state.yearUses, [`reatar:${personId}`]: 1 } };
  const name = firstName(p.name);
  if (!rng.chance(Math.max(0.25, 0.65 - years * 0.04))) {
    s = appendLog(s, `Você mandou mensagem para ${name}, mas a conversa não engatou.`);
    return { ...s, rngState: rng.state };
  }
  const rs = s.relationships;
  const person = { ...p, age: p.age + years };
  s = {
    ...s,
    relationships: {
      ...rs,
      people: [...rs.people, person],
      relations: [...rs.relations, { personId: p.id, type: entry.type, affection: 35, since: s.character.age, history: [], interactedYear: s.year, revealed: 1 }],
      archived: rs.archived.filter((a) => a !== entry),
    },
  };
  s = updateRelation(s, p.id, (r) => withHistory(r, 'Reataram a amizade.'));
  s = appendLog(s, `Você e ${name} voltaram a se falar. Parecia que o tempo não tinha passado.`);
  return { ...s, rngState: rng.state };
}
