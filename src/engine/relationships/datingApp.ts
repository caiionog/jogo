/**
 * App de namoro (release 0.0.4, fase 3). Só para 18+. Os perfis do ano são gerados por RNG derivado de (seed, ano):
 * ver os cartões não muda o estado. Dar "curtir" gasta o RNG do jogo: se a pessoa também curtir (química), ela vira
 * `Person` e vocês começam a ficar, do jeito que `startRomance` permitir (caso escondido se você já tem alguém sem
 * relação aberta). Filtros: faixa de idade e intenção. Todo perfil é adulto (`isValidPartnerAge`).
 */
import type { GameContent } from '../core/content';
import { createRng, seedToState } from '../core/rng';
import type { GameState, Sex } from '../core/state';
import { appendLog } from '../core/stats';
import { pickFirstName } from '../character/names';
import { bumpUse, repeatMultiplier, usesThisYear } from '../lifeStages/sessions';
import { ufDef } from '../geo';
import { ADULT_AGE, isValidPartnerAge } from './guards';
import { addRelation, createPerson, firstName, randomTraits, startRomance, updateRelation, withHistory } from './people';
import { compatibility, meetBlockReason } from './romance';
import type { TraitId } from './types';

export const APP_CARDS_PER_YEAR = 8;
/** Curtidas por ano (depois disso o app pede para voltar no ano que vem). */
export const APP_LIKES_PER_YEAR = 6;

export type AppIntent = 'casual' | 'serio' | 'amizade';

export interface AppCard {
  id: string;
  name: string;
  sex: Sex;
  age: number;
  looks: number;
  traits: TraitId[];
  intent: AppIntent;
  /** Distância fictícia em km, para a vitrine. */
  km: number;
}

export interface AppFilters {
  minAge?: number;
  maxAge?: number;
  intent?: AppIntent;
}

/** Perfis do ano conforme a preferência; todos 18+ e dentro de `isValidPartnerAge`. */
export function appCards(state: GameState, content: GameContent, filters: AppFilters = {}): AppCard[] {
  const me = state.character.age;
  if (me < ADULT_AGE) return [];
  const rng = createRng(seedToState(`${state.seed}:app:${state.year}`));
  const pref = state.relationships.settings.preference;
  const regiao = ufDef(content.geo, state.character.uf)?.regiao;
  const out: AppCard[] = [];
  for (let i = 0; i < APP_CARDS_PER_YEAR; i++) {
    const sex: Sex = pref === 'any' ? (rng.chance(0.5) ? 'M' : 'F') : pref;
    const age = Math.max(ADULT_AGE, me + rng.int(-8, 8));
    const name = pickFirstName(rng, content.names, sex, state.year - age, regiao);
    out.push({
      id: `app:${state.year}:${i}`,
      name,
      sex,
      age,
      looks: rng.int(25, 95),
      traits: randomTraits(rng, content, 2),
      intent: rng.pick(['casual', 'serio', 'amizade'] as const),
      km: rng.int(1, 25),
    });
  }
  return out.filter(
    (c) =>
      isValidPartnerAge(me, c.age) &&
      !state.yearUses[`app:${c.id}`] &&
      (filters.minAge === undefined || c.age >= filters.minAge) &&
      (filters.maxAge === undefined || c.age <= filters.maxAge) &&
      (filters.intent === undefined || c.intent === filters.intent),
  );
}

export type AppBlockReason = 'not-adult' | 'busy' | 'taken' | 'limit' | 'unknown';

export function appLikeBlockReason(state: GameState, cardId: string, content: GameContent): AppBlockReason | null {
  if (state.character.age < ADULT_AGE) return 'not-adult';
  const r = meetBlockReason(state, 'app');
  if (r === 'too-young' || r === 'app-adult') return 'not-adult';
  if (r === 'taken') return 'taken';
  if (r) return 'busy';
  if (usesThisYear(state, 'app:curtidas') >= APP_LIKES_PER_YEAR) return 'limit';
  if (!appCards(state, content).some((c) => c.id === cardId)) return 'unknown';
  return null;
}

/** Pular um perfil (sem custo). */
export function appSkip(state: GameState, cardId: string): GameState {
  return { ...state, yearUses: { ...state.yearUses, [`app:${cardId}`]: 1 } };
}

/** Curtir um perfil: se der match, vira pessoa; "amizade" vira amizade, os outros começam a ficar. */
export function appLike(state: GameState, cardId: string, content: GameContent): GameState {
  if (appLikeBlockReason(state, cardId, content) !== null) return state;
  const card = appCards(state, content).find((c) => c.id === cardId)!;
  const rng = createRng(state.rngState);
  const rep = repeatMultiplier(state, 'app:curtidas', content);
  let s = bumpUse(appSkip(state, cardId), 'app:curtidas');
  const [s1, person] = createPerson(s, rng, content, { name: undefined, sex: card.sex, age: card.age, looks: card.looks, traits: card.traits });
  const named = { ...person, name: `${card.name} ${person.name.split(' ').slice(1).join(' ')}`.trim() };
  s = { ...s1, relationships: { ...s1.relationships, people: s1.relationships.people.map((p) => (p.id === person.id ? named : p)) } };
  const chance = Math.min(0.85, (0.15 + (compatibility(s, named, content) / 100) * 0.6) * rep);
  if (!rng.chance(chance)) {
    s = { ...s, relationships: { ...s.relationships, people: s.relationships.people.filter((p) => p.id !== person.id) } };
    return { ...appendLog(s, `Você curtiu o perfil de ${card.name}, mas não deu match.`), rngState: rng.state };
  }
  if (card.intent === 'amizade') {
    s = addRelation(s, person.id, 'amigo', rng.int(35, 50));
    s = updateRelation(s, person.id, (r) => withHistory(r, 'Vocês se conheceram num aplicativo.'));
    return { ...appendLog(s, `Deu match com ${firstName(named.name)}! Vocês viraram amigos de conversa.`), rngState: rng.state };
  }
  const romance = startRomance(s)!;
  s = addRelation(s, person.id, 'parceiro', rng.int(40, 60), { romance });
  s = updateRelation(s, person.id, (r) => withHistory(r, 'Vocês se conheceram num aplicativo de namoro.'));
  const secret = romance.secret ? ' Ninguém em casa pode saber.' : '';
  return { ...appendLog(s, `Deu match com ${firstName(named.name)}! Um encontro depois, vocês estão ficando.${secret}`), rngState: rng.state };
}
