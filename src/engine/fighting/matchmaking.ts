/** Matchmaking: adversários do elenco (ligas com ranking) ou efêmeros (kids/amador/jiu-jitsu). */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState, Sex } from '../core/state';
import { randomPersonName } from '../character/names';
import { PLAYER_ID, clampSkill } from './profile';
import { rankOf } from './ranking';
import type { Npc, Opponent, Roster } from './types';
import { FIGHT_STYLES, npcSkills } from './world';
import { playerRating } from './chin';

export function npcToOpponent(n: Npc, roster: Roster | null): Opponent {
  return {
    id: n.id,
    name: n.name,
    nickname: n.nickname,
    style: n.style,
    skills: n.skills,
    athletic: n.athletic,
    chinBase: n.chinBase,
    age: n.age,
    record: n.record,
    rank: roster ? rankOf(roster, n.id) : null,
  };
}

/** Nome completo com apelido: Rafael 'Trovão' Duarte. */
export function opponentFullName(o: Pick<Opponent, 'name' | 'nickname'>): string {
  if (!o.nickname) return o.name;
  const [first, ...rest] = o.name.split(' ');
  return [first, `'${o.nickname}'`, ...rest].join(' ');
}


/** Adversário efêmero (não persistido) em torno de `level`. */
export function ephemeralOpponent(rng: Rng, id: string, level: number, sex: Sex, content: GameContent, opts: { nickname?: boolean; name?: string; nick?: string; age?: number } = {}): Opponent {
  const style = rng.pick(FIGHT_STYLES);
  const lv = clampSkill(level);
  const fights = opts.age && opts.age < 15 ? rng.int(0, 4) : rng.int(0, 8);
  const w = rng.int(0, fights);
  return {
    id,
    name: opts.name ?? randomPersonName(rng, content.names, sex),
    nickname: opts.nick ?? (opts.nickname ? rng.pick(content.fighting.nicknames) : ''),
    style,
    skills: npcSkills(rng, lv, style),
    athletic: clampSkill(Math.round(22 + lv * 0.58 + rng.int(-6, 6))),
    chinBase: clampSkill(40 + lv * 0.35 + rng.int(-10, 10)),
    ...(opts.age !== undefined ? { age: opts.age } : {}),
    record: { w, l: fights - w, d: 0 },
    rank: null,
  };
}

export function playerLevel(state: GameState): number {
  return playerRating(state);
}

/** Vitórias seguidas exigidas (estando no top 3) para disputar o cinturão. */
export const TITLE_SHOT_STREAK = 3;

export interface Match {
  npcId: string;
  title: boolean;
}

/**
 * Adversários do elenco para o jogador:
 * - campeão → defesa contra o top 3;
 * - top 3 com sequência ≥ TITLE_SHOT_STREAK vitórias → disputa de cinturão contra o campeão;
 * - ranqueado em r → entre r−3 e r+3;
 * - sem ranking → não ranqueados ou os 3 últimos do ranking (estreantes: só não ranqueados).
 */
export function findMatches(roster: Roster, winStreak: number, count: number, rng: Rng, proFights = 99, streakNeeded = TITLE_SHOT_STREAK): Match[] {
  const r = rankOf(roster, PLAYER_ID);
  const unranked = roster.npcs.map((n) => n.id).filter((id) => id !== roster.champion && !roster.ranking.includes(id));
  if (r === 0) {
    const pool = roster.ranking.slice(0, 3).filter((id) => id !== PLAYER_ID);
    return pool.length ? [{ npcId: rng.pick(pool), title: true }] : [];
  }
  const out: Match[] = [];
  if (r !== null && r <= 3 && winStreak >= streakNeeded && roster.champion) out.push({ npcId: roster.champion, title: true });
  let pool: string[];
 // estreantes (< 3 lutas pro) enfrentam só não ranqueados
  if (r === null) pool = proFights < 3 && unranked.length ? unranked : [...unranked, ...roster.ranking.slice(-3)];
  else pool = roster.ranking.slice(Math.max(0, r - 4), r + 3);
  pool = pool.filter((id) => id !== PLAYER_ID && !out.some((m) => m.npcId === id));
  while (out.length < count && pool.length) {
    const id = rng.pick(pool);
    pool = pool.filter((x) => x !== id);
    out.push({ npcId: id, title: false });
  }
  return out;
}
