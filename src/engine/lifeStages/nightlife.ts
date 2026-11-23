/**
 * Vida noturna (release 0.0.1): sair (bar, festa, show, balada, casa de strip; antes dos 18, festa de amigos, matinê,
 * lanchonete). Cada saída sorteia um evento do local (peso pela sorte), que vira um pop-up com escolhas. Sem limite,
 * mas repetir no mesmo ano rende menos felicidade.
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats } from '../core/stats';
import { conditionsMet, eventWeight } from '../events/select';
import { adultContentAllowed } from '../relationships/guards';
import { post } from '../economy/ledger';
import { bumpUse, repeatMultiplier, scaleGain } from './sessions';

export interface VenueDef {
  id: string;
  label: string;
  emoji: string;
  minAge: number;
  maxAge?: number;
  /** Conteúdo adulto: exige 18+ e a opção "Conteúdo adulto". */
  adult?: true;
  cost: number;
  events: readonly string[];
}

export type VenueBlockReason = 'busy' | 'too-young' | 'too-old' | 'adult-off' | 'no-money';

export function venueBlockReason(state: GameState, venueId: string, content: GameContent): VenueBlockReason | null {
  const v = content.venues.find((x) => x.id === venueId);
  if (!v || !state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < v.minAge) return 'too-young';
  if (v.maxAge !== undefined && state.character.age > v.maxAge) return 'too-old';
  if (v.adult && !adultContentAllowed(state)) return state.character.age < 18 ? 'too-young' : 'adult-off';
  if (state.character.age >= 18 && state.money < v.cost) return 'no-money';
  return null;
}

/** Sai para o local: paga, ganha um pouco de felicidade e um evento do local fica pendente. */
export function goOut(state: GameState, venueId: string, content: GameContent): GameState {
  if (venueBlockReason(state, venueId, content) !== null) return state;
  const v = content.venues.find((x) => x.id === venueId)!;
  const rng = createRng(state.rngState);
  const mult = repeatMultiplier(state, 'noite', content);
  let s = bumpUse(state, 'noite');
  if (state.character.age >= 18) s = post(s, 'compras', -v.cost, `Saída: ${v.label.toLowerCase()}`);
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: scaleGain(3, mult) }) } };
  // um evento do local (filtrado pelas condições, incluindo a regra adulta) com peso pela sorte
  const pool = v.events.map((id) => content.events.find((e) => e.id === id)).filter((e) => e && conditionsMet(s, e, content));
  if (pool.length) {
    const ev = pool[rng.weightedIndex(pool.map((e) => eventWeight(s, e!, content)))]!;
    s = { ...s, pendingEvents: [...s.pendingEvents, { eventId: ev.id }] };
  }
  return { ...s, rngState: rng.state };
}
