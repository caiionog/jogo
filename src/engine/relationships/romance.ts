import { fameAsRep } from '../fame/fame';
import { inheritAppearance, lookRng } from '../character/appearance/inherit';
/** Namoro, casamento, divórcio, gravidez e filhos. Toda regra de idade passa por guards.ts. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import { createRng as createRngFrom } from '../core/rng';
import type { GameState, Sex } from '../core/state';
import { addStats, appendLog, clamp } from '../core/stats';
import { canDate, canHaveSexualContent, canMarry, isValidPartnerAge, ADULT_AGE } from './guards';
import {
  addRelation,
  childrenOf,
  createPerson,
  newRomanceMode,
  startRomance,
  firstName,
  getPerson,
  getRelation,
  lastName,
  updateRelation,
  withHistory,
} from './people';
import type { Person, RomanceStage } from './types';
import { post } from '../economy/ledger';
import { divorceSettlement, recordMarriage } from '../economy/family';
import { bumpUse, repeatMultiplier } from '../lifeStages/sessions';

export const WEDDING_COST = { simple: 3000, big: 20000 } as const;
export const ADOPTION_COST = 10000;
export const CHILD_YEARLY_COST = 6000;

export type MeetMode = 'social' | 'app';

export type MeetBlockReason = 'dead' | 'busy' | 'too-young' | 'app-adult' | 'taken';

export function meetBlockReason(state: GameState, mode: MeetMode): MeetBlockReason | null {
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'busy';
  if (!canDate(state.character.age)) return 'too-young';
  if (mode === 'app' && state.character.age < ADULT_AGE) return 'app-adult';
  if (newRomanceMode(state) === 'blocked') return 'taken';
  return null;
}

/** Sexo do pretendente conforme a preferência do jogador. */
export function pickPartnerSex(rng: Rng, state: GameState): Sex {
  const pref = state.relationships.settings.preference;
  return pref === 'any' ? (rng.chance(0.5) ? 'M' : 'F') : pref;
}

/** Idade de um pretendente válida para o personagem (sempre dentro de isValidPartnerAge). */
export function pickPartnerAge(rng: Rng, charAge: number, mode: MeetMode): number {
  if (charAge < ADULT_AGE) {
    const lo = Math.max(14, charAge - 2);
    const hi = Math.min(17, charAge + 2);
    return rng.int(lo, hi);
  }
  const spread = mode === 'app' ? 8 : 5;
  return Math.max(ADULT_AGE, charAge + rng.int(-spread, spread));
}

/** Compatibilidade 0–100: traços, aparência, felicidade, dinheiro e fama de lutador. */
export function compatibility(state: GameState, person: Person, content: GameContent): number {
  const c = state.character;
  let score = 50;
  for (const t of person.traits) {
    const def = content.relationships.traits.find((x) => x.id === t);
    if (!def) continue;
    // traços "do personagem" são inferidos pela postura da carreira: lutadores combinam com quem apoia a luta
    if (state.fighter.history.length > 0) score += def.fightStance * 6;
    score -= def.jealousy * 8;
  }
  score -= Math.abs(c.stats.looks - person.looks) / 4;
  score += (c.stats.happiness - 50) / 8;
  if (c.age >= ADULT_AGE) score += Math.min(8, Math.log10(Math.max(1, state.money)) * 1.5);
  score += fameAsRep(state) / 8;
  return clamp(score);
}

/** Conhecer alguém: gera um pretendente válido e, se houver química, começam a ficar. */
export function meetSomeone(state: GameState, mode: MeetMode, content: GameContent, rng: Rng): GameState {
  if (meetBlockReason(state, mode) !== null) return state;
  // sem limite, mas insistir no mesmo ano rende menos química
  const rep = repeatMultiplier(state, 'conhecer', content);
  let s: GameState = bumpUse(state, 'conhecer');
  const age = pickPartnerAge(rng, s.character.age, mode);
  if (!isValidPartnerAge(s.character.age, age)) return s; // defesa em profundidade
  let person: Person;
  [s, person] = createPerson(s, rng, content, { sex: pickPartnerSex(rng, s), age });
  const compat = compatibility(s, person, content);
  const where = mode === 'app' ? 'num aplicativo de namoro' : rng.pick(['numa festa', 'por amigos em comum', 'na academia', 'num show']);
  if (rng.chance((0.1 + (compat / 100) * 0.75) * rep)) {
    const romance = startRomance(s)!;
    s = addRelation(s, person.id, 'parceiro', rng.int(40, 60), { romance });
    s = updateRelation(s, person.id, (r) => withHistory(r, `Vocês se conheceram ${where}.`));
    return appendLog(s, `Você conheceu ${person.name} ${where} e vocês estão ficando${romance.secret ? ', escondido de quem já está com você' : ''}.`);
  }
  // não rolou: a pessoa não entra na lista
  s = { ...s, relationships: { ...s.relationships, people: s.relationships.people.filter((p) => p.id !== person.id) } };
  return appendLog(s, `Você conheceu ${firstName(person.name)} ${where}, mas não rolou química.`);
}

/** Avança a etapa do romance com validação de idade (noivos/casados só 18+). */
export function setStage(state: GameState, personId: string, stage: RomanceStage): GameState {
  const person = getPerson(state, personId);
  const rel = getRelation(state, personId);
  if (!person || !rel?.romance) return state;
  if ((stage === 'noivos' || stage === 'casados') && !canMarry(state.character.age, person.age)) return state;
  // casamento é exclusivo: ninguém casa com uma segunda pessoa, nem um caso escondido vira noivado
  if ((stage === 'noivos' || stage === 'casados') && (rel.romance.secret || hasOtherSpouse(state, personId))) return state;
  return updateRelation(state, personId, (r) => ({
    ...r,
    type: stage === 'casados' ? 'conjuge' : 'parceiro',
    romance: { ...(r.romance?.open ? { open: true } : {}), ...(r.romance?.secret ? { secret: true } : {}), stage, since: state.character.age },
  }));
}

/** Já existe outro cônjuge (o casamento é exclusivo: bigamia é crime). */
export function hasOtherSpouse(state: GameState, personId: string): boolean {
  return state.relationships.relations.some((r) => r.personId !== personId && r.type === 'conjuge' && r.romance?.stage === 'casados');
}

export function marry(state: GameState, personId: string, ceremony: 'simple' | 'big'): GameState {
  const person = getPerson(state, personId);
  if (!person || !canMarry(state.character.age, person.age) || hasOtherSpouse(state, personId) || getRelation(state, personId)?.romance?.secret) return state;
  let s = setStage(state, personId, 'casados');
  const cost = WEDDING_COST[ceremony];
  s = post(s, 'compras', -cost, ceremony === 'big' ? 'Festa de casamento' : 'Cerimônia de casamento');
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: ceremony === 'big' ? 12 : 8 }) } };
  s = recordMarriage(s, personId);
  s = updateRelation(s, personId, (r) => withHistory({ ...r, affection: Math.min(100, r.affection + 10) }, 'Casamento!'));
  s = { ...s, flags: { ...s.flags, casado: true } };
  return appendLog(s, `Você se casou com ${person.name}${ceremony === 'big' ? ' numa grande festa' : ' numa cerimônia simples'}.`);
}

export function breakUp(state: GameState, personId: string, byPartner = false): GameState {
  const person = getPerson(state, personId);
  const rel = getRelation(state, personId);
  if (!person || !rel?.romance || rel.romance.stage === 'casados') return state;
  let s = updateRelation(state, personId, (r) => {
    const { romance: _drop, ...rest } = r;
    return withHistory({ ...rest, type: 'ex', affection: Math.max(0, r.affection - 25) }, 'Terminaram.');
  });
  const hurt = rel.affection >= 60 ? 10 : 4;
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -hurt }) } };
  return appendLog(s, byPartner ? `${person.name} terminou com você.` : `Você terminou com ${person.name}.`);
}

/** Divórcio: −20 felicidade e metade do dinheiro (divisão simples; bens na Etapa 5). */
export function divorce(state: GameState, personId: string): GameState {
  const person = getPerson(state, personId);
  const rel = getRelation(state, personId);
  if (!person || rel?.romance?.stage !== 'casados') return state;
  let s = updateRelation(state, personId, (r) => {
    const { romance: _drop, ...rest } = r;
    return withHistory({ ...rest, type: 'ex', affection: Math.max(0, r.affection - 30) }, 'Divórcio.');
  });
  // divisão de bens conforme o regime (Etapa 5) e pensão dos filhos
  const settled = divorceSettlement(s, personId);
  s = settled.state;
  const lost = settled.paid;
  s = {
    ...s,
    flags: { ...s.flags, divorciado: true, casado: false },
    character: { ...s.character, stats: addStats(s.character.stats, { happiness: -20 }) },
  };
  return appendLog(s, `Você se divorciou de ${person.name}.${lost > 0 ? ` A divisão custou R$ ${lost.toLocaleString('pt-BR')}.` : ''}`);
}

// ---------------------------------------------------------------------------
// Gravidez e filhos
// ---------------------------------------------------------------------------

/** Gravidez biológica: casal M/F, os dois 18+ (canHaveSexualContent), sem gravidez em curso. */
export function canConceive(state: GameState, partner: Person): boolean {
  if (!canHaveSexualContent(state.character, partner)) return false;
  if (state.relationships.pregnancy) return false;
  if (partner.sex === state.character.sex) return false;
  const motherAge = state.character.sex === 'F' ? state.character.age : partner.age;
  return motherAge <= 45;
}

export function startPregnancy(state: GameState, partnerId: string, content: GameContent, adoption = false): GameState {
  const partner = getPerson(state, partnerId);
  if (!partner) return state;
  if (!adoption && !canConceive(state, partner)) return state;
  let s: GameState = { ...state, relationships: { ...state.relationships, pregnancy: { partnerId, dueYear: state.year + 1, ...(adoption ? { adoption: true } : {}) } } };
  if (adoption) return appendLog(s, `Você e ${firstName(partner.name)} entraram na fila de adoção. A criança chega no ano que vem.`);
  const who = state.character.sex === 'F' ? 'Você está grávida' : `${firstName(partner.name)} está grávida`;
  s = appendLog(s, `${who}!`);
  const hook = content.relationships.hooks.pregnancyEventId;
  if (hook) s = { ...s, pendingEvents: [...s.pendingEvents, { eventId: hook, source: 'action', vars: { pessoa: firstName(partner.name), pessoa_nome: partner.name, pessoa_id: partner.id } }] };
  return s;
}

/** Herança: média dos pais ± 12 (seed). */
export function inherit(rng: Rng, a: number, b: number): number {
  return clamp((a + b) / 2 + rng.int(-12, 12));
}

/** Sobrenomes do filho de um casal: [do pai, da mãe]. Casal do mesmo sexo: o do personagem por último. */
export function coupleSurnames(sex: Sex, name: string, partner: Person | undefined): [string, string | undefined] {
  const mine = lastName(name);
  const theirs = partner ? lastName(partner.name) : undefined;
  if (partner && sex === 'F' && partner.sex === 'M') return [theirs!, mine];
  return [mine, theirs];
}

/** Nascimento (ou chegada da adoção) quando a gravidez vence. */
export function resolvePregnancy(state: GameState, rng: Rng, content: GameContent): GameState {
  const preg = state.relationships.pregnancy;
  if (!preg || state.year < preg.dueYear) return state;
  let s: GameState = { ...state, relationships: { ...state.relationships, pregnancy: null } };
  const partner = getPerson(s, preg.partnerId);
  const c = s.character;
  const charAthletic = c.stats.athletic;
  const pLooks = partner?.looks ?? rng.int(30, 80);
  const pSmarts = partner?.smarts ?? rng.int(30, 80);
  const pAth = partner?.athletic ?? rng.int(30, 70);
  let child: Person;
  // sobrenomes do casal: o do pai por último, o da mãe antes
  const [fatherSurname, motherSurname] = coupleSurnames(c.sex, c.name, partner);
  const childSex: Sex = rng.chance(0.5) ? 'M' : 'F';
  const parentLook = partner?.appearance;
  const look = !preg.adoption && parentLook ? (c.sex === 'M' ? inheritAppearance(lookRng(rng), c.appearance, parentLook, childSex) : inheritAppearance(lookRng(rng), parentLook, c.appearance, childSex)) : undefined;
  [s, child] = createPerson(s, rng, content, {
    // filho biológico herda talentos com chance maior (adotado, não)
    ...(preg.adoption ? {} : { parentTalents: [c.talents.map((t) => t.id), partner?.talents ?? []] }),
    sex: childSex,
    ...(look ? { appearance: look } : {}),
    age: preg.adoption ? rng.int(0, 5) : 0,
    surname: fatherSurname,
    ...(motherSurname ? { motherSurname } : {}),
    looks: preg.adoption ? rng.int(25, 90) : inherit(rng, c.stats.looks, pLooks),
    smarts: preg.adoption ? rng.int(25, 90) : inherit(rng, c.stats.intelligence, pSmarts),
    athletic: preg.adoption ? rng.int(20, 80) : inherit(rng, charAthletic, pAth),
    health: rng.int(80, 100),
    flags: { ...(preg.adoption ? { adotado: true } : {}), recem_chegado: true },
  });
  s = addRelation(s, child.id, 'filho', rng.int(75, 95));
  s = { ...s, flags: { ...s.flags, recem_nascido: child.id }, character: { ...s.character, stats: addStats(s.character.stats, { happiness: 10 }) } };
  const word = child.sex === 'M' ? 'seu filho' : 'sua filha';
  return appendLog(s, preg.adoption ? `Chegou ${word} adotiv${child.sex === 'M' ? 'o' : 'a'}, ${firstName(child.name)}!` : `Nasceu ${word}, ${firstName(child.name)}!`);
}

/** Despesa anual com filhos menores de 18. */
export function payChildExpenses(state: GameState): GameState {
  const kids = childrenOf(state).filter((k) => k.person.age < 18).length;
  if (kids === 0) return state;
  const cost = kids * CHILD_YEARLY_COST;
  const short = state.money < cost;
  let s = post(state, 'filhos', -cost, `Despesas com ${kids} filho(s)`);
  if (!short) return s;
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -5 }) } };
  return appendLog(s, 'As contas com os filhos apertaram: faltou dinheiro este ano.');
}

/** Versão para a UI: usa e atualiza o RNG do próprio estado. */
export function meetSomeoneAction(state: GameState, mode: MeetMode, content: GameContent): GameState {
  if (meetBlockReason(state, mode) !== null) return state;
  const rng = createRngFrom(state.rngState);
  const s = meetSomeone(state, mode, content, rng);
  return { ...s, rngState: rng.state };
}
