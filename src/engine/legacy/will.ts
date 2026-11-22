/** Testamento e partilha do espólio (Etapa 6). A divisão padrão (sem testamento) vem de `content.legacy`. */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { toMoney } from '../economy/ledger';
import { netWorth } from '../economy/worth';
import { relationsOf } from '../relationships/people';
import type { Person, RelType } from '../relationships/types';
import type { HeirShare } from './types';

const HEIR_TYPES: readonly RelType[] = ['conjuge', 'filho', 'irmao', 'pai', 'mae'];

/** Herdeiros possíveis (vivos): cônjuge, filhos, irmãos e pais. */
export function eligibleHeirs(state: GameState): { person: Person; type: RelType }[] {
  return relationsOf(state, HEIR_TYPES).map(({ person, rel }) => ({ person, type: rel.type }));
}

function splitEven(ids: string[], total: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (!ids.length) return out;
  const base = Math.floor((total * 100) / ids.length) / 100;
  ids.forEach((id) => (out[id] = base));
  // o resto (arredondamento) vai para o primeiro
  const rest = Math.round((total - base * ids.length) * 100) / 100;
  if (rest) out[ids[0]!] = Math.round((out[ids[0]!]! + rest) * 100) / 100;
  return out;
}

/**
 * Divisão padrão sem testamento (dados em `content.legacy.defaultSplit`):
 * cônjuge + filhos → cônjuge X% e o resto dividido entre os filhos; só filhos → 100% entre eles;
 * só cônjuge → 100%; senão irmãos; senão pais.
 */
export function defaultShares(state: GameState, content: GameContent): Record<string, number> {
  const heirs = eligibleHeirs(state);
  const ids = (t: RelType[]) => heirs.filter((h) => t.includes(h.type)).map((h) => h.person.id);
  const spouse = ids(['conjuge']);
  const children = ids(['filho']);
  if (spouse.length && children.length) {
    const sp = content.legacy.defaultSplit.spouseWithChildren * 100;
    return { ...splitEven(spouse, sp), ...splitEven(children, 100 - sp) };
  }
  if (children.length) return splitEven(children, 100);
  if (spouse.length) return splitEven(spouse, 100);
  const siblings = ids(['irmao']);
  if (siblings.length) return splitEven(siblings, 100);
  return splitEven(ids(['pai', 'mae']), 100);
}

/** Porcentagens efetivas: o testamento (só herdeiros vivos, renormalizado) ou a divisão padrão. */
export function effectiveShares(state: GameState, content: GameContent): { shares: Record<string, number>; byWill: boolean } {
  const will = state.economy.will;
  if (will) {
    const alive = new Set(eligibleHeirs(state).map((h) => h.person.id));
    const valid = Object.entries(will.shares).filter(([id, p]) => alive.has(id) && p > 0);
    const sum = valid.reduce((t, [, p]) => t + p, 0);
    if (sum > 0) return { shares: Object.fromEntries(valid.map(([id, p]) => [id, Math.round(((p * 100) / sum) * 100) / 100])), byWill: true };
  }
  return { shares: defaultShares(state, content), byWill: false };
}

export type WillBlockReason = 'too-young' | 'dead' | 'not-heir' | 'bad-sum' | 'negative';

export function willBlockReason(state: GameState, shares: Record<string, number>): WillBlockReason | null {
  if (!state.alive) return 'dead';
  if (state.character.age < 18) return 'too-young';
  const heirs = new Set(eligibleHeirs(state).map((h) => h.person.id));
  const entries = Object.entries(shares).filter(([, p]) => p !== 0);
  if (entries.some(([, p]) => p < 0 || !Number.isFinite(p))) return 'negative';
  if (entries.some(([id]) => !heirs.has(id))) return 'not-heir';
  const sum = entries.reduce((t, [, p]) => t + p, 0);
  if (Math.abs(sum - 100) > 0.01) return 'bad-sum';
  return null;
}

/** Faz (ou refaz) o testamento. As porcentagens precisam somar 100. */
export function makeWill(state: GameState, shares: Record<string, number>): GameState {
  if (willBlockReason(state, shares) !== null) return state;
  const clean = Object.fromEntries(Object.entries(shares).filter(([, p]) => p > 0));
  const s: GameState = { ...state, economy: { ...state.economy, will: { shares: clean, year: state.year } } };
  return appendLog(s, 'Você registrou seu testamento no cartório.');
}

export function revokeWill(state: GameState): GameState {
  if (!state.economy.will) return state;
  return appendLog({ ...state, economy: { ...state.economy, will: null } }, 'Você revogou o testamento.');
}

const REL_TEXT: Record<string, string> = { conjuge: 'cônjuge', filho: 'filho(a)', irmao: 'irmão(ã)', pai: 'pai', mae: 'mãe' };

/** Partilha: espólio (patrimônio líquido) − imposto, dividido pelas porcentagens efetivas. */
export function splitEstate(state: GameState, content: GameContent): { gross: number; tax: number; net: number; byWill: boolean; heirs: HeirShare[] } {
  const gross = Math.max(0, netWorth(state));
  const tax = toMoney(gross * content.legacy.inheritanceTax);
  const net = gross - tax;
  const { shares, byWill } = effectiveShares(state, content);
  const byId = new Map(eligibleHeirs(state).map((h) => [h.person.id, h]));
  const heirs: HeirShare[] = Object.entries(shares)
    .filter(([, p]) => p > 0)
    .map(([id, share]) => {
      const h = byId.get(id)!;
      const sex = h.person.sex;
      const relation = h.type === 'filho' ? (sex === 'M' ? 'filho' : 'filha') : h.type === 'irmao' ? (sex === 'M' ? 'irmão' : 'irmã') : (REL_TEXT[h.type] ?? h.type);
      return { personId: id, name: h.person.name, relation, age: h.person.age, share, amount: toMoney((net * share) / 100), canContinue: h.type === 'filho' };
    });
  // filhos vivos sem parte (testamento que os deserdou) também podem continuar a história
  for (const h of eligibleHeirs(state)) {
    if (h.type === 'filho' && !heirs.some((x) => x.personId === h.person.id)) {
      heirs.push({ personId: h.person.id, name: h.person.name, relation: h.person.sex === 'M' ? 'filho' : 'filha', age: h.person.age, share: 0, amount: 0, canContinue: true });
    }
  }
  return { gross, tax, net, byWill, heirs };
}
