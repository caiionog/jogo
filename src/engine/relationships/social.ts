/** Amizades (escola, academia, eventos), efeitos `social` de eventos e bônus sociais. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { EventVars, GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { canHaveSexualContent, canMarry, isValidPartnerAge } from './guards';
import { ADOPTION_COST, breakUp, divorce, marry, setStage, startPregnancy } from './romance';
import { post } from '../economy/ledger';
import { contractIst, checkTypeShift } from './actions';
import { recordIntimacy } from './intimacy';
import {
  addRelation,
  archivePerson,
  changeAffection,
  createPerson,
  currentPartner,
  startRomance,
  firstName,
  getPerson,
  getRelation,
  relationsOf,
  updatePerson,
  updateRelation,
  withHistory,
} from './people';
import type { Person, RelType, RomanceStage } from './types';

export type MeetContext = 'school' | 'gym' | 'party' | 'work';

const CONTEXT_TEXT: Record<MeetContext, string> = {
  school: 'na escola',
  gym: 'no treino',
  party: 'numa festa',
  work: 'no trabalho',
};

/** Cria um(a) amigo(a) ou colega de treino de idade parecida. */
export function meetFriend(state: GameState, rng: Rng, content: GameContent, context: MeetContext, type: RelType = context === 'gym' ? 'colega_treino' : 'amigo'): GameState {
  const age = Math.max(3, state.character.age + rng.int(-1, context === 'gym' ? 4 : 1));
  let s = state;
  let p: Person;
  [s, p] = createPerson(s, rng, content, {
    age,
    ...(context === 'gym' ? { athletic: rng.int(45, 85), flags: { academia: state.fighter.gymId ?? '' } } : {}),
  });
  s = addRelation(s, p.id, type, rng.int(40, 60));
  s = updateRelation(s, p.id, (r) => withHistory(r, `Vocês se conheceram ${CONTEXT_TEXT[context]}.`));
  return appendLog(s, `Você fez amizade com ${p.name} ${CONTEXT_TEXT[context]}.`);
}

/** Entrar numa academia cria a relação com o(a) treinador(a) (e arquiva a do treinador anterior). */
export function setCoach(state: GameState, rng: Rng, content: GameContent, gymId: string | null): GameState {
  let s = state;
  for (const { person } of relationsOf(s, ['treinador'], false)) s = archivePerson(s, person.id, 'Treinou você por um tempo.');
  if (!gymId) return s;
  let coach: Person;
  [s, coach] = createPerson(s, rng, content, { age: rng.int(30, 58), athletic: rng.int(60, 90), flags: { academia: gymId } });
  return addRelation(s, coach.id, 'treinador', rng.int(45, 65));
}

/** Bônus de treino por companheiros próximos na mesma academia e treinador querido. */
export function socialTrainingBonus(state: GameState): number {
  const gym = state.fighter.gymId;
  if (!gym || !state.relationships) return 0;
  let bonus = 0;
  if (relationsOf(state, ['colega_treino', 'amigo']).some((x) => x.rel.affection >= 70 && x.person.flags.academia === gym)) bonus += 0.08;
  if (relationsOf(state, ['treinador']).some((x) => x.rel.affection >= 70)) bonus += 0.05;
  return bonus;
}

/** Parceiro(a) que apoia (afeto ≥ 70 e sem traço que reprova a luta) dá ânimo extra nas lutas. */
export function partnerSupportsFighting(state: GameState, content: GameContent): boolean {
  const p = currentPartner(state);
  if (!p || p.rel.affection < 70) return false;
  return !p.person.traits.some((t) => content.relationships.traits.find((d) => d.id === t)?.fightStance === -1);
}

// ---------------------------------------------------------------------------
// Efeitos `social` dos eventos
// ---------------------------------------------------------------------------

export interface SocialEffects {
  /** Altera o afeto da pessoa-alvo do evento ({pessoa}). */
  affection?: number;
  /** Conhece alguém novo. */
  meet?: { context: MeetContext; type?: RelType; chance?: number };
  /** Converte uma variável de texto do evento ({colega}, {lutador}) em pessoa. */
  addFromVar?: { var: 'colega' | 'lutador'; type: RelType; affection?: number };
  /** Muda o tipo da relação com o alvo (ex.: rival → amigo). */
  setType?: RelType;
  /** Encerra a relação com o alvo (amizade acabou, afastamento). */
  endRelation?: string;
  breakUp?: boolean;
  /** Começa um romance ("ficando") com o alvo, como `startRomance` permitir (release 0.0.4). */
  startRomance?: boolean;
  stage?: RomanceStage;
  wedding?: 'simple' | 'big';
  divorce?: boolean;
  /** Chance de gravidez com o alvo — exige canHaveSexualContent. */
  pregnancyChance?: number;
  /** Chance de IST — exige personagem 18+. */
  ist?: number;
  /** Cancela a gravidez em curso (decisão de entregar para adoção). */
  giveUpPregnancy?: boolean;
  setPersonFlags?: Record<string, boolean | number | string>;
  /** Altera a saúde da pessoa-alvo (ex.: tratamento de um parente doente). */
  personHealth?: number;
  /** Adoção com o(a) cônjuge-alvo (custa ADOPTION_COST). */
  adopt?: boolean;
  /** Afeto de todos os pais vivos. */
  parentsAffection?: number;
  /** Eventos de grupo (release 0.0.3): {pessoa} e {pessoa2} viram amigos ou rivais entre si. */
  pairFriends?: 'amizade' | 'rivalidade';
  /** Eventos de grupo: {pessoa} e {pessoa2} começam a namorar (NPC × NPC, ambos com a mesma faixa de idade). */
  npcCouple?: boolean;
  /** Afeto de todos os amigos presentes na última saída em grupo. */
  groupAffection?: number;
  /** Momento íntimo com o alvo: grava a cena `intimo` SÓ se `canHaveSexualContent` + "Conteúdo adulto" (release 0.0.3). */
  intimacy?: boolean;
}

export function applySocialEffects(state: GameState, fx: SocialEffects, rng: Rng, content: GameContent, vars?: EventVars): GameState {
  let s = state;
  const targetId = vars?.pessoa_id;
  const target = getPerson(s, targetId);
  if (fx.affection && target) s = changeAffection(s, target.id, fx.affection);
  if (fx.parentsAffection) for (const { person } of relationsOf(s, ['pai', 'mae'])) s = changeAffection(s, person.id, fx.parentsAffection);
  if (fx.setPersonFlags && target) s = updatePerson(s, target.id, (p) => ({ ...p, flags: { ...p.flags, ...fx.setPersonFlags } }));
  if (fx.personHealth && target) s = updatePerson(s, target.id, (p) => ({ ...p, health: Math.max(0, Math.min(100, p.health + (fx.personHealth ?? 0))) }));
  if (fx.adopt && target && !s.relationships.pregnancy && s.money >= ADOPTION_COST) {
    s = startPregnancy(post(s, 'compras', -ADOPTION_COST, 'Processo de adoção'), target.id, content, true);
  }
  if (fx.meet && rng.chance(fx.meet.chance ?? 1)) s = meetFriend(s, rng, content, fx.meet.context, fx.meet.type);
  if (fx.addFromVar) {
    const full = vars?.[fx.addFromVar.var === 'lutador' ? 'lutador_nome' : 'colega'];
    if (full && !s.relationships.people.some((p) => p.name === full)) {
      let p: Person;
      [s, p] = createPerson(s, rng, content, {
        name: full,
        age: Math.max(5, s.character.age + rng.int(-2, 3)),
        ...(fx.addFromVar.var === 'lutador' ? { athletic: rng.int(60, 90), flags: { apelido: vars?.lutador_apelido ?? '' } } : {}),
      });
      s = addRelation(s, p.id, fx.addFromVar.type, fx.addFromVar.affection ?? 40);
    }
  }
  if (target && getRelation(s, target.id)) {
    if (fx.setType) {
      s = updateRelation(s, target.id, (r) => withHistory({ ...r, type: fx.setType as RelType }, 'A relação mudou.'));
      s = checkTypeShift(s, target.id);
    }
    if (fx.startRomance && isValidPartnerAge(s.character.age, target.age) && !getRelation(s, target.id)?.romance) {
      const romance = startRomance(s);
      if (romance) s = updateRelation(s, target.id, (r) => withHistory({ ...r, type: 'parceiro', romance }, 'Começaram a ficar.'));
    }
    if (fx.stage) {
      const ok = fx.stage === 'noivos' || fx.stage === 'casados' ? canMarry(s.character.age, target.age) : isValidPartnerAge(s.character.age, target.age);
      if (ok) s = setStage(s, target.id, fx.stage);
    }
    if (fx.wedding) {
      s = marry(s, target.id, fx.wedding);
      // escolha do regime de bens logo após o casamento (Etapa 5)
      const hook = content.economy.hooks.regimeEventId;
      if (hook && s.economy.marriage?.personId === target.id) s = { ...s, pendingEvents: [...s.pendingEvents, { eventId: hook, source: 'followUp', ...(vars ? { vars } : {}) }] };
    }
    if (fx.breakUp) s = breakUp(s, target.id, true);
    if (fx.divorce) s = divorce(s, target.id);
    if (fx.pregnancyChance && canHaveSexualContent(s.character, target) && rng.chance(fx.pregnancyChance)) s = startPregnancy(s, target.id, content);
    if (fx.endRelation) s = archivePerson(s, target.id, fx.endRelation);
  }
  if (fx.groupAffection) {
    const g = s.relationships.lastGroup;
    if (g && g.year === s.year) for (const id of g.present) if (getRelation(s, id)) s = changeAffection(s, id, fx.groupAffection);
  }
  if (fx.pairFriends || fx.npcCouple) s = applyPairEffects(s, fx, vars);
  if (fx.intimacy) s = recordIntimacy(s, getPerson(s, targetId));
  if (fx.ist && s.character.age >= 18 && rng.chance(fx.ist)) s = contractIst(s);
  if (fx.giveUpPregnancy && s.relationships.pregnancy) {
    s = { ...s, relationships: { ...s.relationships, pregnancy: null } };
    s = appendLog(s, 'Vocês decidiram entregar o bebê para adoção ao nascer.');
  }
  return s;
}

/**
 * Eventos de grupo (release 0.0.3): {pessoa} e {pessoa2} viram amigos/rivais (`pairFriends`) ou um casal (`npcCouple`).
 * Não há relação NPC × NPC no modelo: fica nas flags das duas pessoas (`amigo_de_<id>`, `rival_de_<id>`, `casal_com`)
 * e numa linha do histórico. Casal só com a faixa de `isValidPartnerAge` (os dois 18+ ou os dois 14–17, ≤ 2 anos).
 */
function applyPairEffects(state: GameState, fx: SocialEffects, vars?: EventVars): GameState {
  const a = getPerson(state, vars?.pessoa_id);
  const b = getPerson(state, vars?.pessoa2_id);
  if (!a || !b || a.id === b.id || !a.alive || !b.alive) return state;
  let s = state;
  const mark = (p: Person, other: Person, flags: Record<string, boolean | string>, note: string) => {
    s = updatePerson(s, p.id, (x) => ({ ...x, flags: { ...x.flags, ...flags } }));
    if (getRelation(s, p.id)) s = updateRelation(s, p.id, (r) => withHistory(r, note.replace('{outro}', firstName(other.name))));
  };
  if (fx.pairFriends) {
    const friends = fx.pairFriends === 'amizade';
    const key = friends ? 'amigo_de_' : 'rival_de_';
    const note = friends ? 'Ficou amig{x} de {outro}.' : 'Virou rival de {outro}.';
    const g = (p: Person) => note.replace('{x}', p.sex === 'M' ? 'o' : 'a');
    mark(a, b, { [`${key}${b.id}`]: true }, g(a));
    mark(b, a, { [`${key}${a.id}`]: true }, g(b));
  }
  if (fx.npcCouple && isValidPartnerAge(a.age, b.age)) {
    mark(a, b, { casal_com: b.id }, 'Começou a namorar {outro}.');
    mark(b, a, { casal_com: a.id }, 'Começou a namorar {outro}.');
  }
  return s;
}

/** Texto curto para o alvo do evento ({pessoa}). */
export function targetVars(person: Person, label: string): EventVars {
  return { pessoa: firstName(person.name), pessoa_nome: person.name, pessoa_id: person.id, relacao: label.toLowerCase() };
}

/** Felicidade por amigos próximos (até +6 por ano). */
export function friendshipHappiness(state: GameState): GameState {
  const close = relationsOf(state, ['amigo', 'colega_treino']).filter((x) => x.rel.affection >= 70).length;
  if (!close) return state;
  return { ...state, character: { ...state.character, stats: addStats(state.character.stats, { happiness: Math.min(6, close * 2) }) } };
}
