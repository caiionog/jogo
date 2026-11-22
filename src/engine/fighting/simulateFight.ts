/**
 * Simulação de luta round a round — máquina de estados pura e determinística.
 *
 *   startFight → [round] → playRound → 'break' → chooseCorner → [round] → … → 'finished'
 *
 * Cada round tem EXCHANGES trocas. Em cada troca um lutador age conforme a posição
 * (em pé, clinch ou chão), usando habilidades, estamina, dano acumulado e o RNG da luta
 * (guardado em `rngState`). Modelo documentado no GDD.md (Simulação de luta).
 */
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type {
  DecisionType,
  FightLogKind,
  FightResult,
  FightRules,
  FightState,
  FightTextPack,
  FighterSnapshot,
  RoundStats,
  Strategy,
} from './types';

export const EXCHANGES_PER_ROUND = 12;
const GRAPPLING_EXCHANGES = 16;
const JUDGES = 3;

export interface FightOptions {
  rounds: number;
  rngState: number;
  rules?: FightRules;
  /** Estratégias do round 1 (padrão: aiStrategy de cada lado). */
  strategy?: [Strategy, Strategy];
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const emptyStats = (): RoundStats => ({ landed: 0, power: 0, takedowns: 0, control: 0, subAttempts: 0, knockdowns: 0, points: 0 });

// ---------------------------------------------------------------------------
// Estratégia automática (NPC e "simular tudo")
// ---------------------------------------------------------------------------

/** Escolhe a estratégia do córner para o lutador `idx` com base no matchup e no andamento. */
export function aiStrategy(state: Pick<FightState, 'fighters' | 'live' | 'scorecards' | 'rules'>, idx: 0 | 1): Strategy {
  const me = state.fighters[idx];
  const op = state.fighters[idx === 0 ? 1 : 0];
  if (state.rules === 'grappling') return me.skills.grappling >= op.skills.grappling ? 'ground' : 'safe';
  const groundAdv = me.skills.wrestling + me.skills.grappling - (op.skills.wrestling + op.skills.grappling);
  const strikeAdv = me.skills.striking - op.skills.striking;
  if (groundAdv > 20 && groundAdv / 2 > strikeAdv) return 'ground';
  const live = state.live[idx];
  const behind = scoreDiff(state.scorecards, idx) < 0;
  if (behind) return 'pressure';
  if (live.damage > 60 || live.stamina < 30) return 'safe';
  return strikeAdv > 5 ? 'pressure' : 'safe';
}

function scoreDiff(scorecards: [number, number][][], idx: 0 | 1): number {
  const judge = scorecards[0] ?? [];
  return judge.reduce((acc, [a, b]) => acc + (idx === 0 ? a - b : b - a), 0);
}

// ---------------------------------------------------------------------------
// Máquina de estados
// ---------------------------------------------------------------------------

export function startFight(a: FighterSnapshot, b: FighterSnapshot, opts: FightOptions): FightState {
  const rules = opts.rules ?? 'mma';
  const base: FightState = {
    rules,
    rounds: opts.rounds,
    round: 1,
    phase: 'round',
    rngState: opts.rngState >>> 0,
    fighters: [a, b],
    live: [
      { stamina: a.startStamina ?? 100, damage: 0 },
      { stamina: b.startStamina ?? 100, damage: 0 },
    ],
    position: 'standing',
    top: null,
    strategy: ['safe', 'safe'],
    roundStats: [],
    scorecards: Array.from({ length: JUDGES }, () => []),
    log: [],
  };
  return { ...base, strategy: opts.strategy ?? [aiStrategy(base, 0), aiStrategy(base, 1)] };
}

/** Define a estratégia do lutador 0 (jogador) no intervalo e joga o próximo round. */
export function chooseCorner(state: FightState, strategy: Strategy, text: FightTextPack): FightState {
  if (state.phase !== 'break') return state;
  const next: FightState = {
    ...state,
    phase: 'round',
    round: state.round + 1,
    strategy: [strategy, aiStrategy(state, 1)],
  };
  return playRound(next, text);
}

/** Luta completa com escolhas automáticas (ou por `policy`). */
export function simulateFight(
  a: FighterSnapshot,
  b: FighterSnapshot,
  opts: FightOptions,
  text: FightTextPack,
  policy: (s: FightState) => Strategy = (s) => aiStrategy(s, 0),
): FightState {
  let s = playRound(startFight(a, b, { ...opts, strategy: opts.strategy ?? undefined }), text);
  while (s.phase === 'break') s = chooseCorner(s, policy(s), text);
  return s;
}

// ---------------------------------------------------------------------------
// Round
// ---------------------------------------------------------------------------

interface Ctx {
  s: FightState;
  rng: Rng;
  text: FightTextPack;
  stats: [RoundStats, RoundStats];
  finished: boolean;
}

/** Joga o round atual inteiro. Termina em 'break' (próximo round) ou 'finished'. */
export function playRound(state: FightState, text: FightTextPack): FightState {
  if (state.phase !== 'round') return state;
  const rng = createRng(state.rngState);
  const ctx: Ctx = {
    s: {
      ...state,
      live: [{ ...state.live[0] }, { ...state.live[1] }],
      log: state.log.slice(),
      position: 'standing',
      top: null,
    },
    rng,
    text,
    stats: [emptyStats(), emptyStats()],
    finished: false,
  };
  say(ctx, 'round_start', undefined, { n: String(state.round) });
  if (state.round > 1) {
    const st = state.strategy[0];
    say(ctx, 'corner', 0, { plano: STRATEGY_TEXT[st] });
  }

  const exchanges = state.rules === 'grappling' ? GRAPPLING_EXCHANGES : EXCHANGES_PER_ROUND;
  for (let i = 0; i < exchanges && !ctx.finished; i++) exchange(ctx);

  const s = ctx.s;
  s.roundStats = [...state.roundStats, ctx.stats];
  if (ctx.finished) return { ...s, rngState: rng.state };

  // fim do round: pontuação
  s.scorecards = scoreRound(ctx);
  say(ctx, 'round_end', undefined, { n: String(state.round) });

  // interrupção médica no intervalo
  if (state.rules === 'mma') {
    for (const i of [0, 1] as const) {
      const d = s.live[i].damage;
      if (d >= 85 && rng.chance((d - 80) / 60)) {
        finish(ctx, i === 0 ? 1 : 0, 'DOC', i === 0 ? 1 : 0, 'doctor');
        return { ...ctx.s, rngState: rng.state };
      }
    }
  }

  if (state.round >= state.rounds) {
    decide(ctx);
    return { ...ctx.s, rngState: rng.state };
  }

  // intervalo: recuperação
  for (const i of [0, 1] as const) {
    const f = s.fighters[i];
    const live = s.live[i];
    live.stamina = clamp(live.stamina + 8 + f.skills.cardio / 7, 0, 100);
    live.damage = clamp(live.damage - 7, 0, 100);
  }
  return { ...s, phase: 'break', rngState: rng.state };
}

const STRATEGY_TEXT: Record<Strategy, string> = {
  pressure: 'pressionar',
  safe: 'lutar seguro',
  ground: 'levar para o chão',
};

// ---------------------------------------------------------------------------
// Troca
// ---------------------------------------------------------------------------

/** Eficiência pelo cansaço e dano (0,3–1). */
function eff(ctx: Ctx, i: 0 | 1): number {
  const l = ctx.s.live[i];
  return clamp((0.5 + 0.5 * (l.stamina / 100)) * (1 - l.damage / 250), 0.3, 1);
}

function spend(ctx: Ctx, i: 0 | 1, base: number) {
  const f = ctx.s.fighters[i];
  const st = ctx.s.strategy[i];
  const mult = st === 'pressure' ? 1.25 : st === 'safe' ? 0.8 : 1.05;
  const cost = base * 1.6 * (1.45 - f.skills.cardio / 100) * mult * (1 + f.sizeEdge * 0.2);
  ctx.s.live[i].stamina = clamp(ctx.s.live[i].stamina - cost, 0, 100);
}

function pickActor(ctx: Ctx): 0 | 1 {
  const w = ([0, 1] as const).map((i) => {
    const st = ctx.s.strategy[i];
    let x = st === 'pressure' ? 1.35 : st === 'safe' ? 0.8 : 1.05;
    x *= 0.5 + ctx.s.live[i].stamina / 200;
    if (ctx.s.position === 'ground' && ctx.s.top === i) x *= 1.6;
    return x;
  });
  return ctx.rng.weightedIndex(w) as 0 | 1;
}

function exchange(ctx: Ctx) {
  const a = pickActor(ctx);
  const b = (a === 0 ? 1 : 0) as 0 | 1;
  const { position } = ctx.s;
  if (ctx.s.rules === 'grappling') return grapplingExchange(ctx, a, b);
  if (position === 'standing') return standingExchange(ctx, a, b);
  if (position === 'clinch') return clinchExchange(ctx, a, b);
  return ctx.s.top === a ? topExchange(ctx, a, b) : bottomExchange(ctx, a, b);
}

function takedownTendency(ctx: Ctx, a: 0 | 1, b: 0 | 1): number {
  const A = ctx.s.fighters[a].skills;
  const B = ctx.s.fighters[b].skills;
  const adv = (A.wrestling - B.wrestling) / 60 + (A.grappling - B.grappling) / 120;
  let p = 0.1 + 0.2 * clamp(adv, -0.5, 1);
  const st = ctx.s.strategy[a];
  if (st === 'ground') p += 0.4;
  if (st === 'safe') p -= 0.03;
  return clamp(p, 0.02, 0.8);
}

function standingExchange(ctx: Ctx, a: 0 | 1, b: 0 | 1) {
  const roll = ctx.rng.next();
  const td = takedownTendency(ctx, a, b);
  if (roll < td) return takedown(ctx, a, b, 0);
  if (roll < td + 0.08) {
    spend(ctx, a, 2);
    ctx.s.position = 'clinch';
    return say(ctx, 'clinch', a);
  }
  return strike(ctx, a, b, 'standing');
}

function clinchExchange(ctx: Ctx, a: 0 | 1, b: 0 | 1) {
  const roll = ctx.rng.next();
  const td = takedownTendency(ctx, a, b) * 0.9 + 0.1;
  if (roll < td) return takedown(ctx, a, b, 0.1);
  if (roll < td + 0.25) {
    spend(ctx, a, 1.5);
    ctx.s.position = 'standing';
    return say(ctx, 'clinch_break', a);
  }
  return strike(ctx, a, b, 'clinch');
}

function topExchange(ctx: Ctx, a: 0 | 1, b: 0 | 1) {
  const A = ctx.s.fighters[a].skills;
  const B = ctx.s.fighters[b].skills;
  const subBias = clamp((A.grappling - B.grappling) / 150, -0.1, 0.25) + (ctx.s.strategy[a] === 'ground' ? 0.05 : 0);
  const roll = ctx.rng.next();
  if (roll < 0.17 + subBias) return submission(ctx, a, b, 1);
  if (roll < 0.62) return strike(ctx, a, b, 'ground');
  spend(ctx, a, 1.5);
  ctx.stats[a].control += 1;
  return say(ctx, 'control', a);
}

function bottomExchange(ctx: Ctx, a: 0 | 1, b: 0 | 1) {
  const A = ctx.s.fighters[a].skills;
  const B = ctx.s.fighters[b].skills;
  const ea = eff(ctx, a);
  const eb = eff(ctx, b);
  const prefersGround = A.grappling > B.grappling + 10 && ctx.s.strategy[a] !== 'safe';
  const roll = ctx.rng.next();
  if (prefersGround && roll < 0.35) return submission(ctx, a, b, 0.55);
  if (prefersGround && roll < 0.75) {
    spend(ctx, a, 2.5);
    if (ctx.rng.chance(0.15 + 0.5 * sigmoid((A.grappling * ea - B.grappling * eb) / 12))) {
      ctx.s.top = a;
      ctx.stats[a].points += 2;
      return say(ctx, 'sweep', a);
    }
    return say(ctx, 'sub_escape', b);
  }
  spend(ctx, a, 3);
  const p = 0.12 + 0.55 * sigmoid((A.wrestling * ea + A.defense * 0.3 - (B.wrestling * 0.8 + B.grappling * 0.4) * eb) / 14);
  if (ctx.rng.chance(p)) {
    ctx.s.position = 'standing';
    ctx.s.top = null;
    return say(ctx, 'standup', a);
  }
  return strike(ctx, b, a, 'ground'); // tentou levantar e tomou golpes
}

function takedown(ctx: Ctx, a: 0 | 1, b: 0 | 1, bonus: number) {
  const A = ctx.s.fighters[a].skills;
  const B = ctx.s.fighters[b].skills;
  const p = 0.08 + bonus + 0.7 * sigmoid((A.wrestling * eff(ctx, a) - (B.wrestling * 0.75 + B.defense * 0.35) * eff(ctx, b)) / 16);
  spend(ctx, a, 4);
  spend(ctx, b, 1.5);
  if (ctx.rng.chance(p)) {
    ctx.s.position = 'ground';
    ctx.s.top = a;
    ctx.stats[a].takedowns += 1;
    ctx.stats[a].points += 2;
    return say(ctx, 'takedown', a);
  }
  spend(ctx, a, 3);
  if (ctx.s.position === 'clinch' && ctx.rng.chance(0.5)) ctx.s.position = 'standing';
  return say(ctx, 'takedown_stuffed', a);
}

function strike(ctx: Ctx, a: 0 | 1, b: 0 | 1, where: 'standing' | 'clinch' | 'ground') {
  const FA = ctx.s.fighters[a];
  const FB = ctx.s.fighters[b];
  const A = FA.skills;
  const B = FB.skills;
  const ea = eff(ctx, a);
  const eb = eff(ctx, b);
  let atk = (where === 'ground' ? A.striking * 0.5 + A.grappling * 0.5 : A.striking) * ea;
  let def = (where === 'ground' ? B.defense * 0.6 + B.grappling * 0.4 : B.defense * 0.7 + B.striking * 0.3) * eb;
  if (ctx.s.strategy[a] === 'pressure') atk *= 1.05;
  if (ctx.s.strategy[b] === 'safe') def *= 1.12;
  if (ctx.s.strategy[b] === 'pressure') def *= 0.93;
  spend(ctx, a, where === 'ground' ? 2.5 : 2.5);
  spend(ctx, b, 0.6);

  const hitP = 0.12 + 0.68 * sigmoid((atk - def) / 20);
  const golpe = ctx.rng.pick(ctx.text.strikes[where]);
  if (!ctx.rng.chance(hitP)) return say(ctx, 'strike_miss', a, { golpe });

  const heavyP = clamp(0.13 + (A.striking - 50) / 500 + (ctx.s.strategy[a] === 'pressure' ? 0.04 : 0) + FA.sizeEdge * 0.05, 0.03, 0.3);
  const heavy = where !== 'ground' && ctx.rng.chance(heavyP);
  let dmg = (4 + A.striking / 18 + FA.strength / 30 + FA.sizeEdge * 2) * (0.6 + ctx.rng.next() * 0.8);
  if (heavy) dmg *= 2.3;
  if (where === 'ground') dmg *= 0.85;
  if (where === 'clinch') dmg *= 0.9;
  dmg *= (1.25 - B.chin / 200) * (1.1 - B.defense / 500);
  const live = ctx.s.live[b];
  live.damage = clamp(live.damage + dmg, 0, 100);
  ctx.stats[a].landed += 1;
  ctx.stats[a].power += dmg;

  if (heavy) {
    const kdP = clamp((dmg * 1.5 + live.damage * 0.6 - B.chin * 0.5) / 100, 0.02, 0.75);
    if (ctx.rng.chance(kdP)) {
      ctx.stats[a].knockdowns += 1;
      const koP = clamp((live.damage - 30) / 90 + (100 - B.chin) / 250, 0.05, 0.85);
      if (ctx.rng.chance(koP)) return finish(ctx, a, 'KO', a, 'ko', { golpe });
      say(ctx, 'knockdown', a, { golpe });
      if (ctx.rng.chance(0.5)) {
        ctx.s.position = 'ground';
        ctx.s.top = a;
      }
      return;
    }
  }
  if (live.damage >= 100 || (live.damage >= 78 && ctx.rng.chance((live.damage - 74) / 70))) {
    return finish(ctx, a, 'TKO', a, 'tko', { golpe });
  }
  say(ctx, heavy ? 'strike_heavy' : where === 'ground' ? 'gnp' : 'strike_land', a, { golpe });
}

function submission(ctx: Ctx, a: 0 | 1, b: 0 | 1, factor: number) {
  const A = ctx.s.fighters[a].skills;
  const B = ctx.s.fighters[b].skills;
  const fin = ctx.rng.pick(ctx.text.submissions);
  spend(ctx, a, 4);
  spend(ctx, b, 3);
  ctx.stats[a].subAttempts += 1;
  const tired = 1 + (100 - ctx.s.live[b].stamina) / 200;
  const p = (0.05 + 0.28 * sigmoid((A.grappling * eff(ctx, a) - (B.grappling * 0.75 + B.defense * 0.3) * eff(ctx, b)) / 14)) * tired * factor;
  if (ctx.rng.chance(p)) return finish(ctx, a, 'SUB', a, 'sub_win', { finalizacao: fin });
  say(ctx, 'sub_attempt', a, { finalizacao: fin });
}

function grapplingExchange(ctx: Ctx, a: 0 | 1, b: 0 | 1) {
  if (ctx.s.position !== 'ground') {
    if (ctx.rng.chance(0.6)) return takedown(ctx, a, b, 0.05);
    spend(ctx, a, 1);
    ctx.s.position = 'ground';
    ctx.s.top = b;
    return say(ctx, 'guard_pull', a);
  }
  if (ctx.s.top === a) {
    const roll = ctx.rng.next();
    if (roll < 0.35) return submission(ctx, a, b, 1);
    spend(ctx, a, 1.5);
    ctx.stats[a].control += 1;
    ctx.stats[a].points += 3;
    return say(ctx, 'control', a);
  }
  const A = ctx.s.fighters[a].skills;
  const B = ctx.s.fighters[b].skills;
  if (ctx.rng.chance(0.4)) return submission(ctx, a, b, 0.6);
  spend(ctx, a, 2);
  if (ctx.rng.chance(0.1 + 0.5 * sigmoid((A.grappling * eff(ctx, a) - B.grappling * eff(ctx, b)) / 12))) {
    ctx.s.top = a;
    ctx.stats[a].points += 2;
    return say(ctx, 'sweep', a);
  }
  return say(ctx, 'sub_escape', b);
}

// ---------------------------------------------------------------------------
// Pontuação, final e narração
// ---------------------------------------------------------------------------

function scoreRound(ctx: Ctx): [number, number][][] {
  const [s0, s1] = ctx.stats;
  const raw = (st: RoundStats) =>
    ctx.s.rules === 'grappling'
      ? st.points + st.subAttempts * 0.5
      : st.landed + st.power * 0.25 + st.takedowns * 2.5 + st.control * 1 + st.subAttempts * 1.5 + st.knockdowns * 6;
  const r0 = raw(s0);
  const r1 = raw(s1);
  return ctx.s.scorecards.map((card) => {
    if (ctx.s.rules === 'grappling') return [...card, [Math.round(s0.points), Math.round(s1.points)] as [number, number]];
    const diff = r0 - r1 + (ctx.rng.next() * 3.6 - 1.8);
    let pair: [number, number];
    if (Math.abs(diff) < 0.1) pair = [10, 10];
    else {
      const dominant = Math.abs(diff) > 18 || Math.abs(s0.knockdowns - s1.knockdowns) >= 2;
      pair = diff > 0 ? [10, dominant ? 8 : 9] : [dominant ? 8 : 9, 10];
    }
    return [...card, pair];
  });
}

function decide(ctx: Ctx) {
  const s = ctx.s;
  const totals = s.scorecards.map((card) => card.reduce<[number, number]>((t, [a, b]) => [t[0] + a, t[1] + b], [0, 0]));
  let winner: 0 | 1 | null;
  let decisionType: DecisionType;
  if (s.rules === 'grappling') {
    const [p0, p1] = totals[0]!;
    const adv0 = s.roundStats.reduce((n, r) => n + r[0].subAttempts, 0);
    const adv1 = s.roundStats.reduce((n, r) => n + r[1].subAttempts, 0);
    winner = p0 > p1 ? 0 : p1 > p0 ? 1 : adv0 > adv1 ? 0 : adv1 > adv0 ? 1 : null;
    decisionType = winner === null ? 'draw' : 'unanimous';
  } else {
    const votes = totals.map(([a, b]) => (a > b ? 0 : b > a ? 1 : null));
    const w0 = votes.filter((v) => v === 0).length;
    const w1 = votes.filter((v) => v === 1).length;
    if (w0 >= 2 || w1 >= 2) {
      winner = w0 >= 2 ? 0 : 1;
      const lead = Math.max(w0, w1);
      decisionType = lead === 3 ? 'unanimous' : Math.min(w0, w1) === 1 ? 'split' : 'majority';
    } else {
      winner = null;
      decisionType = 'draw';
    }
  }
  const result: FightResult = { winner, method: 'DEC', decisionType, round: s.round, scorecards: s.scorecards, totals };
  s.result = result;
  s.phase = 'finished';
  const placar = totals.map(([a, b]) => `${a}-${b}`).join(', ');
  if (winner === null) say(ctx, 'draw', undefined, { placar });
  else say(ctx, 'decision', winner, { placar, tipo: DECISION_TEXT[decisionType] });
}

export const DECISION_TEXT: Record<DecisionType, string> = {
  unanimous: 'unânime',
  split: 'dividida',
  majority: 'majoritária',
  draw: 'empate',
};

function finish(ctx: Ctx, winner: 0 | 1, method: FightResult['method'], actor: 0 | 1, kind: FightLogKind, vars: Record<string, string> = {}) {
  const s = ctx.s;
  if (method === 'SUB') s.position = 'ground';
  s.result = { winner, method, round: s.round, scorecards: s.scorecards, totals: s.scorecards.map(() => [0, 0]) };
  s.phase = 'finished';
  ctx.finished = true;
  say(ctx, kind, actor, vars);
}

function say(ctx: Ctx, kind: FightLogKind, actor?: 0 | 1, vars: Record<string, string> = {}) {
  const s = ctx.s;
  const a = actor ?? 0;
  const b = a === 0 ? 1 : 0;
  const options = ctx.text[kind];
  let t = options.length ? ctx.rng.pick(options) : kind;
  // evita repetir a mesma variação do lance anterior
  const prev = s.log[s.log.length - 1];
  if (options.length > 1 && prev?.kind === kind && prev.raw === t) t = ctx.rng.pick(options.filter((o) => o !== t));
  const raw = t;
  const all: Record<string, string> = { a: s.fighters[a].name, b: s.fighters[b].name, ...vars };
  for (const [k, v] of Object.entries(all)) t = t.replaceAll(`{${k}}`, v);
  t = t.charAt(0).toUpperCase() + t.slice(1);
  s.log.push({
    round: s.round,
    kind,
    text: t,
    raw,
    ...(actor !== undefined ? { actor } : {}),
    stamina: [Math.round(s.live[0].stamina), Math.round(s.live[1].stamina)],
    damage: [Math.round(s.live[0].damage), Math.round(s.live[1].damage)],
  });
}
