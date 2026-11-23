/**
 * Mundo vivo: elencos de NPCs por organização/categoria, gerados pelo seed sob demanda
 * (só para as divisões que o jogador toca) e simulados de forma barata a cada ano.
 */
import type { GameContent } from '../core/content';
import { createRng, seedToState } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState, Sex } from '../core/state';
import { randomPersonName } from '../character/names';
import { PLAYER_ID, addSkills, clampSkill, skillRating } from './profile';
import { npcChin } from './chin';
import { applyRankingResult, removeFromRanking } from './ranking';
import type { FightStyle, FinishMethod, Npc, OrgDef, Roster, Skills, World } from './types';

export const rosterKey = (orgId: string, divisionId: string) => `${orgId}:${divisionId}`;
const EXTRA_UNRANKED = 6;

const STYLE_BONUS: Record<FightStyle, Partial<Skills>> = {
  striker: { trocacao: 12, jiujitsu: -8 },
  grappler: { jiujitsu: 13, trocacao: -8 },
  allround: {},
};
export const FIGHT_STYLES: readonly FightStyle[] = ['striker', 'grappler', 'allround'];

export function npcRating(n: Pick<Npc, 'skills' | 'athletic' | 'chinBase'> & { age?: number }): number {
  return skillRating(n.skills, n.athletic, npcChin(n));
}

export function npcSkills(rng: Rng, level: number, style: FightStyle): Skills {
  const base = (bonus = 0) => clampSkill(level + bonus + rng.int(-6, 6));
  const b = STYLE_BONUS[style];
  return { jiujitsu: base(b.jiujitsu), trocacao: base(b.trocacao) };
}

/** Físico e queixo inato de um NPC em torno do nível. */
export function npcBody(rng: Rng, level: number, style: FightStyle): { athletic: number; chinBase: number } {
  return {
    athletic: clampSkill(Math.round(43 + level * 0.47 + rng.int(-8, 8))),
    chinBase: clampSkill(40 + level * 0.35 + rng.int(-10, 10) + (style === 'grappler' ? -2 : 0)),
  };
}

export function generateNpc(rng: Rng, id: string, level: number, sex: Sex, content: GameContent, age?: number): Npc {
  const style = rng.pick(FIGHT_STYLES);
  const a = age ?? rng.int(21, 35);
  const fights = Math.max(0, Math.round((a - 19) * 1.3 + rng.int(-2, 3)));
  const winRate = Math.min(0.9, Math.max(0.35, 0.35 + level / 160 + rng.next() * 0.15));
  const w = Math.round(fights * winRate);
  return {
    id,
    name: randomPersonName(rng, content.names, sex, 2025 - a, rng.pick(['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste'])),
    nickname: rng.pick(content.fighting.nicknames),
    age: a,
    style,
    skills: npcSkills(rng, level, style),
    ...npcBody(rng, level, style),
    record: { w, l: Math.max(0, fights - w - (rng.chance(0.2) ? 1 : 0)), d: rng.chance(0.15) ? 1 : 0 },
  };
}

/** Gera um elenco determinístico (RNG derivado de seed + chave). */
export function generateRoster(state: GameState, org: OrgDef, divisionId: string, content: GameContent): { roster: Roster; nextNpcId: number } {
  const rng = createRng(seedToState(`${state.seed}:roster:${rosterKey(org.id, divisionId)}`));
  const size = org.rankingSize + 1 + EXTRA_UNRANKED;
  const [lo, hi] = org.npcSkill;
  let nextId = state.world.nextNpcId;
  const npcs: Npc[] = [];
  for (let i = 0; i < size; i++) {
    const q = 1 - i / size; // primeiros mais fortes
    const level = lo + (hi - lo) * (0.15 + 0.85 * q) + rng.int(-3, 3);
    npcs.push(generateNpc(rng, `n${nextId++}`, level, state.character.sex, content));
  }
  const sorted = npcs.slice().sort((a, b) => npcRating(b) - npcRating(a));
  return {
    roster: {
      orgId: org.id,
      divisionId,
      npcs,
      champion: sorted[0]?.id ?? null,
      ranking: sorted.slice(1, 1 + org.rankingSize).map((n) => n.id),
    },
    nextNpcId: nextId,
  };
}

/** Garante que o elenco exista no estado (só organizações com ranking). */
export function ensureRoster(state: GameState, orgId: string, divisionId: string, content: GameContent): GameState {
  const key = rosterKey(orgId, divisionId);
  if (state.world.rosters[key]) return state;
  const org = content.fighting.orgs.find((o) => o.id === orgId);
  if (!org || org.rankingSize === 0) return state;
  const { roster, nextNpcId } = generateRoster(state, org, divisionId, content);
  return { ...state, world: { rosters: { ...state.world.rosters, [key]: roster }, nextNpcId } };
}

/** Elenco para exibição: o do estado ou um gerado na hora (sem alterar o estado). */
export function viewRoster(state: GameState, orgId: string, divisionId: string, content: GameContent): Roster | null {
  const existing = state.world.rosters[rosterKey(orgId, divisionId)];
  if (existing) return existing;
  const org = content.fighting.orgs.find((o) => o.id === orgId);
  if (!org || org.rankingSize === 0) return null;
  return generateRoster(state, org, divisionId, content).roster;
}

// ---------------------------------------------------------------------------
// Lutas rápidas entre NPCs
// ---------------------------------------------------------------------------

const METHOD_BY_STYLE: Record<FightStyle, [number, number]> = {
  // [P(KO/TKO), P(SUB)] — o resto é decisão
  striker: [0.5, 0.08],
  grappler: [0.2, 0.36],
  allround: [0.32, 0.22],
};

export interface QuickResult {
  winner: 'a' | 'b' | null;
  method: FinishMethod;
}

/** Luta barata (sem narração): probabilidade logística pela diferença de rating. */
export function quickFight(rng: Rng, a: Npc, b: Npc): QuickResult {
  if (rng.chance(0.015)) return { winner: null, method: 'DEC' };
  const pA = 1 / (1 + Math.exp(-(npcRating(a) - npcRating(b)) / 6));
  const winner = rng.chance(pA) ? 'a' : 'b';
  const [ko, sub] = METHOD_BY_STYLE[(winner === 'a' ? a : b).style];
  const r = rng.next();
  return { winner, method: r < ko ? 'KO' : r < ko + sub ? 'SUB' : 'DEC' };
}

/** Envelhece e evolui o NPC; o crescimento para no teto do nível da organização (`cap`). */
function evolveNpc(rng: Rng, n: Npc, cap: number): Npc {
  const age = n.age + 1;
  let delta: Partial<Skills>;
  let dAth = 0;
  if (age < 28) { delta = { trocacao: rng.int(0, 3), jiujitsu: rng.int(0, 3) }; dAth = rng.int(0, 2); }
  else if (age <= 32) delta = { trocacao: rng.int(0, 1), jiujitsu: rng.int(0, 1) };
  else { delta = { trocacao: -rng.int(0, 2), jiujitsu: -rng.int(0, 1) }; dAth = -rng.int(1, 3); }
  const capped: Partial<Skills> = {};
  for (const [k, v] of Object.entries(delta) as [keyof Skills, number][]) capped[k] = v > 0 && n.skills[k] >= cap ? 0 : v;
  const athletic = clampSkill(n.athletic + (dAth > 0 && n.athletic >= cap ? 0 : dAth));
  return { ...n, age, athletic, skills: addSkills(n.skills, capped) };
}

function shouldRetire(rng: Rng, n: Npc): boolean {
  if (n.age >= 35 && rng.chance(Math.min(0.9, (n.age - 33) * 0.15))) return true;
  return n.record.l - n.record.w > 6 && rng.chance(0.3);
}

function recordFight(npcs: Npc[], id: string, result: 'w' | 'l' | 'd'): Npc[] {
  return npcs.map((n) => (n.id === id ? { ...n, record: { ...n.record, [result]: n.record[result] + 1 } } : n));
}

/** Um ano no mundo de um elenco: envelhecer, aposentar/substituir, lutas e disputa de cinturão. */
export function simulateRosterYear(roster: Roster, org: OrgDef, world: World, rng: Rng, sex: Sex, content: GameContent): { roster: Roster; nextNpcId: number } {
  let nextId = world.nextNpcId;
  const cap = org.npcSkill[1] + 4;
  let r: Roster = { ...roster, npcs: roster.npcs.map((n) => evolveNpc(rng, n, cap)) };

  // aposentadorias e novos talentos
  for (const n of r.npcs.slice()) {
    if (!shouldRetire(rng, n)) continue;
    r = removeFromRanking(r, n.id);
    const [lo, hi] = org.npcSkill;
    const rookie = generateNpc(rng, `n${nextId++}`, lo + (hi - lo) * (0.2 + rng.next() * 0.4), sex, content, rng.int(21, 25));
    r = { ...r, npcs: [...r.npcs.filter((x) => x.id !== n.id), rookie] };
  }

  const byId = (id: string) => r.npcs.find((n) => n.id === id);
  const fight = (aId: string, bId: string, title: boolean) => {
    const a = byId(aId);
    const b = byId(bId);
    if (!a || !b) return;
    const res = quickFight(rng, a, b);
    if (res.winner === null) {
      r = { ...r, npcs: recordFight(recordFight(r.npcs, a.id, 'd'), b.id, 'd') };
      return;
    }
    const [w, l] = res.winner === 'a' ? [a, b] : [b, a];
    r = { ...r, npcs: recordFight(recordFight(r.npcs, w.id, 'w'), l.id, 'l') };
    r = applyRankingResult(r, w.id, l.id, title, org.rankingSize);
  };

  // ~2 lutas por NPC contra vizinhos de ranking (o jogador fica de fora)
  for (let round = 0; round < 2; round++) {
    const order = [...r.ranking, ...r.npcs.map((n) => n.id).filter((id) => id !== r.champion && !r.ranking.includes(id))].filter((id) => id !== PLAYER_ID);
    const used = new Set<string>();
    for (let i = 0; i < order.length; i++) {
      const a = order[i] as string;
      if (used.has(a)) continue;
      const candidates = order.slice(i + 1, i + 4).filter((id) => !used.has(id));
      if (candidates.length === 0) continue;
      const b = rng.pick(candidates);
      used.add(a);
      used.add(b);
      fight(a, b, false);
    }
  }
  // disputa anual de cinturão entre NPCs
  const top = r.ranking[0];
  if (r.champion && r.champion !== PLAYER_ID && top && top !== PLAYER_ID) fight(r.champion, top, true);
  // cinturão vago: o NPC mais bem ranqueado assume (o jogador só ganha o cinturão lutando)
  const first = r.ranking.find((id) => id !== PLAYER_ID);
  if (!r.champion && first) r = { ...r, champion: first, ranking: r.ranking.filter((id) => id !== first) };

  return { roster: r, nextNpcId: nextId };
}

/** Simula o ano de todos os elencos materializados. */
export function simulateWorldYear(state: GameState, rng: Rng, content: GameContent): GameState {
  let world = state.world;
  for (const key of Object.keys(world.rosters).sort()) {
    const roster = world.rosters[key] as Roster;
    const org = content.fighting.orgs.find((o) => o.id === roster.orgId);
    if (!org) continue;
    const { roster: next, nextNpcId } = simulateRosterYear(roster, org, world, rng, state.character.sex, content);
    world = { rosters: { ...world.rosters, [key]: next }, nextNpcId };
  }
  return { ...state, world };
}
