/** Sorteio do local de nascimento, cor ou raça (demografia) e mudança de cidade (Etapa 7). */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { post } from '../economy/ledger';
import { RACES } from './types';
import type { CityDef, GeoContent, Race, UfDef } from './types';

export * from './types';

function weighted<T>(rng: Rng, items: readonly T[], weight: (t: T) => number): T {
  const total = items.reduce((t, x) => t + weight(x), 0);
  let r = rng.next() * total;
  for (const x of items) {
    r -= weight(x);
    if (r <= 0) return x;
  }
  return items[items.length - 1]!;
}

export function ufDef(geo: GeoContent, sigla: string | undefined): UfDef | undefined {
  return geo.ufs.find((u) => u.sigla === sigla);
}

export function cityDef(geo: GeoContent, sigla: string | undefined, city: string | undefined): CityDef | undefined {
  return ufDef(geo, sigla)?.cities.find((c) => c.name === city);
}

/** UF pelo peso populacional. */
export function pickUf(rng: Rng, geo: GeoContent): UfDef {
  return weighted(rng, geo.ufs, (u) => u.populacao);
}

/** Cidade da UF pelo peso populacional. */
export function pickCity(rng: Rng, uf: UfDef): CityDef {
  return weighted(rng, uf.cities, (c) => c.populacao);
}

/** Local de nascimento: UF pelo peso, depois a cidade. */
export function pickBirthplace(rng: Rng, geo: GeoContent): { uf: string; city: string } {
  const uf = pickUf(rng, geo);
  return { uf: uf.sigla, city: pickCity(rng, uf).name };
}

/** Cor ou raça pela distribuição do Censo 2022 da UF (só demografia e aparência). */
export function pickRace(rng: Rng, uf: UfDef): Race {
  return weighted(rng, RACES, (r) => uf.corRaca[r]);
}

/** Multiplicador de custo de vida da cidade atual (salários, aluguel, compras). */
export function cityMultOf(state: GameState, content: GameContent): number {
  return cityDef(content.geo, state.character.uf, state.character.city)?.custo ?? 1;
}

export const MOVE_COST_SAME_UF = 3000;
export const MOVE_COST_OTHER_UF = 8000;

export type MoveBlockReason = 'busy' | 'too-young' | 'same' | 'unknown' | 'no-money';

export function moveBlockReason(state: GameState, content: GameContent, uf: string, city: string): MoveBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < 18) return 'too-young';
  if (!cityDef(content.geo, uf, city)) return 'unknown';
  if (state.character.uf === uf && state.character.city === city) return 'same';
  if (state.money < (uf === state.character.uf ? MOVE_COST_SAME_UF : MOVE_COST_OTHER_UF)) return 'no-money';
  return null;
}

/**
 * Mudança de cidade (gancho da Etapa 7): paga a mudança, troca UF/cidade e sai da academia que só existe na
 * cidade antiga. Pessoas criadas depois seguem a distribuição da nova UF.
 */
export function moveTo(state: GameState, content: GameContent, uf: string, city: string): GameState {
  if (moveBlockReason(state, content, uf, city) !== null) return state;
  const cost = uf === state.character.uf ? MOVE_COST_SAME_UF : MOVE_COST_OTHER_UF;
  let s = post(state, 'moradia', -cost, `Mudança para ${city}`);
  const gym = content.fighting.gyms.find((g) => g.id === s.fighter.gymId);
  s = { ...s, character: { ...s.character, uf, city } };
  if (gym?.city && gym.city !== city) s = { ...s, fighter: { ...s.fighter, gymId: null } };
  return appendLog(s, `Você se mudou para ${city} (${ufDef(content.geo, uf)?.nome ?? uf}).`);
}
