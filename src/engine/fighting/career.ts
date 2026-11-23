import { sessionsLeft, useSessions } from '../lifeStages/sessions';
/**
 * Carreira: ofertas de luta, a luta em andamento (activeFight), aplicação do resultado
 * (cartel, dinheiro, reputação, ranking, cinturão, lesão) e as viradas de ano.
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { EventVars, GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { bjjRank, graduationYear, promoteGrade } from './belts';
import { findMatches, ephemeralOpponent, npcToOpponent, opponentFullName, playerLevel } from './matchmaking';
import { currentRosterKey, getOrg, leaveRankings, playerDivision, signWith, tierIndex } from './orgs';
import { PLAYER_ID, applySkillDelta, playerSnapshot, shortName } from './profile';
import { npcChin } from './chin';
import { applyRankingResult, rankOf } from './ranking';
import { DECISION_TEXT, aiStrategy, chooseCorner, playRound, startFight } from './simulateFight';
import { ageDecline, currentGym, fightExperience, trainingYear } from './training';
import type {
  ModalityId,
  CareerRecord,
  FightOffer,
  FighterSnapshot,
  Opponent,
  OfferKind,
  OrgDef,
  RetireReason,
  SkillDelta,
  Strategy,
} from './types';
import { ensureRoster, rosterKey, simulateWorldYear } from './world';
import { partnerSupportsFighting, setCoach } from '../relationships/social';
import { post } from '../economy/ledger';
import { checkSponsorClauses, countContractFight, payFightPurse, purseMultiplier } from '../economy/fightIncome';
import { addSkills as addSk } from './profile';
import { applyFightInjuries, injuryFightPenalty, injuryVeto, legacyInjury } from './injuries';
import { bumpFeat, maxFeat } from '../meta/feats';
import { addRelation, createPerson, relationsOf } from '../relationships/people';
import type { Person } from '../relationships/types';
import { checkForcedRetirement, completeRetirement, unretire } from './retirement';

export const AGGRESSIVE_CUT_MISS_CHANCE = 0.25;
export const AGGRESSIVE_CUT_EDGE = 0.6;
const MAX_HISTORY = 60;

// ---------------------------------------------------------------------------
// Ofertas
// ---------------------------------------------------------------------------

function trainsFighting(state: GameState, content: GameContent): boolean {
  const club = state.education.current?.club;
  const combatClub = club ? content.clubs.find((c) => c.id === club)?.combat : false;
  return !!state.fighter.gymId || !!combatClub;
}

function makeOffer(state: GameState, org: OrgDef, kind: OfferKind, opponent: Opponent, title: boolean, mult = 1): FightOffer {
  const rep = 1 + state.fighter.reputation / 100;
  // empresário negocia bolsas maiores; contrato garante a bolsa base
  const agent = purseMultiplier(state);
  const c = state.economy.contract;
  const base = c && c.orgId === org.id ? Math.max(c.basePurse, org.purse.base * rep) : org.purse.base * rep;
  return {
    id: `o${state.fighter.nextOfferId}`,
    orgId: org.id,
    divisionId: '',
    kind,
    opponent,
    rounds: title ? org.titleRounds : org.rounds,
    rules: org.rules,
    purse: Math.round(base * (title ? 2 : 1) * mult * agent),
    winBonus: Math.round(org.purse.win * (title ? 2 : 1) * mult * agent),
    campSessions: kind === 'shortNotice' ? 1 : org.campSessions + (title ? 1 : 0),
    title,
  };
}

function pushOffer(state: GameState, offer: FightOffer, content: GameContent): GameState {
  const div = playerDivision(state, content).id;
  return {
    ...state,
    fighter: {
      ...state.fighter,
      offers: [...state.fighter.offers, { ...offer, divisionId: div }],
      nextOfferId: state.fighter.nextOfferId + 1,
    },
  };
}

function ephemeral(state: GameState, rng: Rng, org: OrgDef, level: number, content: GameContent, extra: Parameters<typeof ephemeralOpponent>[5] = {}): Opponent {
  const [lo, hi] = org.npcSkill;
  const lv = Math.min(hi, Math.max(lo, level));
  return ephemeralOpponent(rng, `e${state.fighter.nextOfferId}`, lv, state.character.sex, content, {
    nickname: org.tier !== 'kids',
    age: state.character.age,
    ...extra,
  });
}

/** Gera as ofertas do ano (limpa as anteriores). */
export function generateOffers(state: GameState, rng: Rng, content: GameContent): GameState {
  let s: GameState = { ...state, fighter: { ...state.fighter, offers: [] } };
  const f = s.fighter;
  if (!s.alive || injuryVeto(s) || f.retired || f.suspendedYears > 0) return s;
  const age = s.character.age;
  const trains = trainsFighting(s, content);
  const lvl = playerLevel(s);
  const contract = getOrg(content, f.orgId);

  for (const org of content.fighting.orgs) {
    if (age < org.minAge || (org.maxAge !== undefined && age > org.maxAge)) continue;
    if (org.contract) continue;
    if (!trains) continue;
    if (org.tier === 'amateur' && org.sport === 'mma' && contract) continue; // profissional não luta amador de MMA
    const count = org.sport === 'bjj' ? 1 : org.tier === 'kids' ? (rng.chance(0.85) ? 1 : 0) : org.offersPerYear;
    for (let i = 0; i < count; i++) {
      const level = org.sport === 'bjj' && org.tier === 'amateur'
        ? 25 + bjjRank(state) * 13 + rng.int(-6, 6)
        : lvl + rng.int(-9, 5);
      const kind: OfferKind = org.tier === 'kids' ? 'kids' : org.sport === 'bjj' ? 'bjj' : 'regular';
      s = pushOffer(s, makeOffer(s, org, kind, ephemeral(s, rng, org, level, content), false), content);
    }
  }

  if (contract && contract.rankingSize > 0) {
    s = ensureRoster(s, contract.id, playerDivision(s, content).id, content);
    const key = rosterKey(contract.id, playerDivision(s, content).id);
    const roster = s.world.rosters[key];
    if (roster) {
      const proFights = s.fighter.pro.wins + s.fighter.pro.losses + s.fighter.pro.draws;
      for (const m of findMatches(roster, s.fighter.winStreak, contract.offersPerYear, rng, proFights, contract.titleShotStreak)) {
        const npc = roster.npcs.find((n) => n.id === m.npcId);
        if (npc) s = pushOffer(s, makeOffer(s, contract, m.title ? 'title' : 'regular', npcToOpponent(npc, roster), m.title), content);
      }
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// Luta
// ---------------------------------------------------------------------------

export type FightBlockReason = 'dead' | 'busy' | 'injured' | 'suspended' | 'retired' | 'no-sessions' | 'unknown';

/** Motivo para não aceitar a luta. O camp ocupa sessões de treino do ano (`offer.campSessions`). */
export function fightBlockReason(state: GameState, offer: FightOffer | undefined, content: GameContent): FightBlockReason | null {
  if (!offer) return 'unknown';
  if (!state.alive) return 'dead';
  if (state.activeFight || state.pendingEvents.length > 0) return 'busy';
  if (state.fighter.retired && offer.kind !== 'farewell') return 'retired';
  if (injuryVeto(state)) return 'injured';
  if (state.fighter.suspendedYears > 0) return 'suspended';
  if (sessionsLeft(state, content) < offer.campSessions) return 'no-sessions';
  return null;
}

function opponentSnapshot(o: Opponent): FighterSnapshot {
  return {
    id: o.id,
    name: o.nickname || shortName(o.name),
    fullName: opponentFullName(o),
    skills: o.skills,
    athletic: o.athletic,
    chin: npcChin(o),
    sizeEdge: 0,
  };
}

export interface AcceptOptions {
  aggressiveCut?: boolean;
}

/** Aceita a oferta: paga o camp, faz o corte de peso, inicia a luta e joga o 1º round. */
export function acceptOffer(state: GameState, offerId: string, opts: AcceptOptions, content: GameContent): GameState {
  const offer = state.fighter.offers.find((o) => o.id === offerId);
  if (fightBlockReason(state, offer, content) !== null || !offer) return state;
  const rng = createRng(state.rngState);
  const aggressive = !!opts.aggressiveCut && offer.rules === 'mma';
  const missed = aggressive && rng.chance(AGGRESSIVE_CUT_MISS_CHANCE);

  let s: GameState = useSessions(state, offer.campSessions);
  s = { ...s, fighter: { ...s.fighter, offers: s.fighter.offers.filter((o) => o.id !== offerId) } };
  if (missed) {
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { health: -3 }) } };
    s = appendLog(s, 'Você não bateu o peso! Multa de 20% da bolsa e um corpo mais fraco para a luta.');
    const hook = content.fighting.hooks.weightMissEventId;
    if (hook) s = { ...s, pendingEvents: [...s.pendingEvents, { eventId: hook, source: 'action', vars: { lutador: opponentFullName(offer.opponent) } }] };
  }
  // lesões ativas pesam na luta (lutar machucado) e o dano cerebral enfraquece o queixo (em playerSnapshot)
  let player = playerSnapshot(s, aggressive ? AGGRESSIVE_CUT_EDGE : 0, missed ? 85 : 100);
  const pen = injuryFightPenalty(s, content);
  player = { ...player, skills: addSk(player.skills, { grappling: pen.grappling ?? 0, trocacao: pen.trocacao ?? 0 }), athletic: Math.max(0, player.athletic + (pen.athletic ?? 0)), chin: Math.max(0, player.chin + (pen.chin ?? 0)) };
  // parceiro(a) que apoia a carreira: ânimo extra (+3 de fôlego na luta)
  if (partnerSupportsFighting(s, content)) player = { ...player, athletic: Math.min(100, player.athletic + 3) };
  let fight = startFight(player, opponentSnapshot(offer.opponent), {
    rounds: offer.rounds,
    rngState: rng.int(1, 0x7fffffff),
    rules: offer.rules,
  });
  fight = playRound(fight, content.fighting.text);
  s = { ...s, rngState: rng.state, activeFight: { offer, fight, aggressiveCut: aggressive, missedWeight: missed, applied: false } };
  return fight.phase === 'finished' ? applyFightResult(s, content) : s;
}

export function declineOffer(state: GameState, offerId: string): GameState {
  if (state.activeFight) return state;
  return { ...state, fighter: { ...state.fighter, offers: state.fighter.offers.filter((o) => o.id !== offerId) } };
}

/** Escolha do córner no intervalo. */
export function chooseFightCorner(state: GameState, strategy: Strategy, content: GameContent): GameState {
  const af = state.activeFight;
  if (!af || af.fight.phase !== 'break') return state;
  const fight = chooseCorner(af.fight, strategy, content.fighting.text);
  const s = { ...state, activeFight: { ...af, fight } };
  return fight.phase === 'finished' ? applyFightResult(s, content) : s;
}

/** "Simular tudo": o córner automático decide até o fim. */
export function autoFinishFight(state: GameState, content: GameContent): GameState {
  let s = state;
  while (s.activeFight && s.activeFight.fight.phase === 'break') {
    s = chooseFightCorner(s, aiStrategy(s.activeFight.fight, 0), content);
  }
  return s;
}

/** Fecha a tela de resultado. */
export function closeFight(state: GameState): GameState {
  return state.activeFight?.applied ? { ...state, activeFight: null } : state;
}

const METHOD_TEXT = { KO: 'nocaute', TKO: 'nocaute técnico', SUB: 'finalização', DOC: 'interrupção médica', DEC: 'decisão' } as const;

function bump(r: CareerRecord, result: 'W' | 'L' | 'D', key: 'KO' | 'SUB' | 'DEC'): CareerRecord {
  if (result === 'D') return { ...r, draws: r.draws + 1 };
  if (result === 'W') return { ...r, wins: r.wins + 1, winsBy: { ...r.winsBy, [key]: r.winsBy[key] + 1 } };
  return { ...r, losses: r.losses + 1, lossesBy: { ...r.lossesBy, [key]: r.lossesBy[key] + 1 } };
}

/** Aplica o resultado da luta terminada (idempotente). */
export function applyFightResult(state: GameState, content: GameContent): GameState {
  const af = state.activeFight;
  if (!af || af.applied || af.fight.phase !== 'finished' || !af.fight.result) return state;
  const rng = createRng(state.rngState);
  const { offer, fight } = af;
  const res = fight.result!;
  const org = getOrg(content, offer.orgId);
  if (!org) return state;
  const result: 'W' | 'L' | 'D' = res.winner === 0 ? 'W' : res.winner === 1 ? 'L' : 'D';
  const key = res.method === 'SUB' ? 'SUB' : res.method === 'DEC' ? 'DEC' : 'KO';
  const bucket = org.sport === 'bjj' ? 'bjj' : org.tier === 'kids' || org.tier === 'amateur' ? 'amateur' : 'pro';
  const finish = res.method !== 'DEC';
  let f = { ...state.fighter, [bucket]: bump(state.fighter[bucket], result, key) };
  f.winStreak = result === 'W' ? f.winStreak + 1 : result === 'L' ? 0 : f.winStreak;
  if (bucket === 'pro' && f.proDebutAge === null) f.proDebutAge = state.character.age;
  if (org.tier === 'major' && f.majorDebutAge === null) f.majorDebutAge = state.character.age;

  // dinheiro
  const perf = result === 'W' && finish && org.purse.perf > 0 && rng.chance(0.5) ? org.purse.perf : 0;
  const earnings = Math.round(offer.purse * (af.missedWeight ? 0.8 : 1) + (result === 'W' ? offer.winBonus : 0) + perf);

  // reputação
  const gain = org.reputationGain;
  const repDelta = result === 'W' ? gain * (finish ? 1.5 : 1) * (offer.title ? 2 : 1) : result === 'L' ? -gain : 1;
  f.reputation = Math.min(100, Math.max(0, Math.round(f.reputation + repDelta)));

  // queixo: quem é nocauteado fica mais vulnerável — desde a Etapa 6 via dano cerebral (applyFightInjuries + playerSnapshot)

  let s: GameState = { ...state, fighter: f };
  if (earnings > 0) s = payFightPurse(s, earnings, `Bolsa: luta contra ${opponentFullName(offer.opponent)}`);
  s = countContractFight(s, org.id, result);
  s = { ...s, fighter: { ...s.fighter, skills: fightExperience(s, rng, content, org.rules === 'grappling') } };
  const oppName = opponentFullName(offer.opponent);
  let titleText = '';

  // ranking e cinturão
  if (org.rankingSize > 0) {
    const rkey = rosterKey(org.id, offer.divisionId || playerDivision(s, content).id);
    s = ensureRoster(s, org.id, rkey.split(':')[1] as string, content);
    let roster = s.world.rosters[rkey];
    if (roster) {
      const wasChampion = roster.champion === PLAYER_ID;
      if (result !== 'D') {
        const [w, l] = result === 'W' ? [PLAYER_ID, offer.opponent.id] : [offer.opponent.id, PLAYER_ID];
        roster = applyRankingResult(roster, w, l, offer.title, org.rankingSize);
      }
      const npcRes = result === 'W' ? 'l' : result === 'L' ? 'w' : 'd';
      roster = { ...roster, npcs: roster.npcs.map((n) => (n.id === offer.opponent.id ? { ...n, record: { ...n.record, [npcRes]: n.record[npcRes] + 1 } } : n)) };
      s = { ...s, world: { ...s.world, rosters: { ...s.world.rosters, [rkey]: roster } } };
      const isChampion = roster.champion === PLAYER_ID;
      const division = content.fighting.divisions.find((d) => d.id === roster!.divisionId);
      if (isChampion && !wasChampion) {
        s = { ...s, fighter: { ...s.fighter, titles: [...s.fighter.titles, { orgId: org.id, divisionId: roster.divisionId }], titlesWon: s.fighter.titlesWon + 1 } };
        titleText = ` 🏆 Você é o novo campeão ${division?.label.toLowerCase() ?? ''} da ${org.short}!`;
        s = bumpFeat(s, org.tier === 'major' ? 'majorTitles' : 'regionalTitles');
      } else if (wasChampion && !isChampion) {
        s = { ...s, fighter: { ...s.fighter, titles: s.fighter.titles.filter((t) => !(t.orgId === org.id && t.divisionId === roster!.divisionId)) } };
        titleText = ' Você perdeu o cinturão.';
      } else if (isChampion && offer.title) titleText = ' Cinturão defendido!';
    }
  }

  // saúde, dano cerebral e lesões (Etapa 6)
  const dmg = fight.live[0].damage;
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { health: -Math.round(dmg / 12) }) } };
  const knockdowns = fight.roundStats.reduce((t, r) => t + r[1].knockdowns, 0);
  const inj = applyFightInjuries(s, rng, content, { damage: dmg, koLoss: result === 'L' && key === 'KO', rules: org.rules, knockdowns, result, method: res.method });
  s = inj.state;
  const injuryText = inj.text;

  // log e histórico
  const how = res.method === 'DEC' ? `decisão ${DECISION_TEXT[res.decisionType ?? 'unanimous']}` : `${METHOD_TEXT[res.method]} no ${res.round}º round`;
  const prefix = `[${org.short}] `;
  let line: string;
  if (result === 'W') line = `${prefix}Você venceu ${oppName} por ${how}.`;
  else if (result === 'L') line = `${prefix}Você perdeu para ${oppName} por ${how}.`;
  else line = `${prefix}Você empatou com ${oppName}.`;
  const money = earnings > 0 ? ` Ganhou R$ ${earnings.toLocaleString('pt-BR')}.` : '';
  const summary = `${line}${titleText}${money}${injuryText}`;
  s = appendLog(s, summary);
  s = {
    ...s,
    fighter: {
      ...s.fighter,
      history: [
        ...s.fighter.history,
        { age: s.character.age, year: s.year, orgId: org.id, opponent: oppName, result, method: res.method, round: res.round, title: offer.title, pro: bucket === 'pro' },
      ].slice(-MAX_HISTORY),
    },
  };
  if (result === 'L') s = checkSponsorClauses(s, content);
  if (result === 'L' && offer.opponent.id.startsWith('n') && (res.method === 'KO' || res.method === 'TKO' || offer.title)) s = makeNpcRival(s, offer.opponent, rng, content, how);
  s = recordFightFeats(s, { result, method: res.method, bucket, title: offer.title, wasInjured: state.health.injuries.length > 0, farewell: offer.kind === 'farewell', opponentId: offer.opponent.id, titleText });
  if (offer.kind === 'farewell') s = completeRetirement(s, 'voluntaria', result === 'W' ? 'Você venceu a luta de despedida e saiu por cima.' : 'Você fez a luta de despedida diante da sua torcida.');
  else s = checkForcedRetirement(s, content);
  return { ...s, rngState: rng.state, activeFight: { ...af, applied: true, summary, earnings } };
}

/** Máximo de rivais do mundo da luta ao mesmo tempo. */
export const MAX_NPC_RIVALS = 3;

/** Quem te nocauteia (ou tira o cinturão) vira rival: pessoa ligada ao NPC do elenco por `npcId`. */
function makeNpcRival(state: GameState, opp: Opponent, rng: Rng, content: GameContent, how: string): GameState {
  const rivals = relationsOf(state, ['rival']);
  if (rivals.some(({ person }) => person.npcId === opp.id) || rivals.filter(({ person }) => person.npcId).length >= MAX_NPC_RIVALS) return state;
  let s = state;
  let p: Person;
  [s, p] = createPerson(s, rng, content, { age: s.character.age + rng.int(-3, 3), sex: s.character.sex, name: opponentFullName(opp), npcId: opp.id, athletic: 80 });
  s = addRelation(s, p.id, 'rival', 10, { history: [`Venceu você por ${how}.`] });
  return appendLog(s, `${opponentFullName(opp)} virou seu rival. A revanche fica para outro dia.`);
}

/** Façanhas da luta para as conquistas (KO no rival, invencibilidade, defesas de cinturão...). */
function recordFightFeats(
  state: GameState,
  o: { result: 'W' | 'L' | 'D'; method: string; bucket: string; title: boolean; wasInjured: boolean; farewell: boolean; opponentId: string; titleText: string },
): GameState {
  let s = state;
  if (o.bucket === 'pro') {
    s = maxFeat(s, 'maxUnbeaten', o.result === 'L' ? 0 : (s.feats.curUnbeaten ?? 0) + 1);
    s = { ...s, feats: { ...s.feats, curUnbeaten: o.result === 'L' ? 0 : (s.feats.curUnbeaten ?? 0) + 1 } };
    s = { ...s, feats: { ...s.feats, curLosses: o.result === 'L' ? (s.feats.curLosses ?? 0) + 1 : 0 } };
  }
  if (o.result === 'W' && (o.method === 'KO' || o.method === 'TKO')) s = bumpFeat(s, 'koWins');
  if (o.result === 'W' && o.method === 'SUB') s = bumpFeat(s, 'subWins');
  if (o.title && o.result === 'W' && o.titleText.includes('defendido')) s = bumpFeat(s, 'titleDefenses');
  if (o.wasInjured) s = bumpFeat(s, 'foughtInjured');
  if (o.farewell && o.result === 'W') s = bumpFeat(s, 'farewellWin');
  if (o.result === 'W' && (o.method === 'KO' || o.method === 'TKO')) {
    const rival = relationsOf(s, ['rival']).some(({ person }) => person.npcId === o.opponentId);
    if (rival) s = bumpFeat(s, 'koRival');
  }
  s = maxFeat(s, 'oldestFightAge', s.character.age);
  return maxFeat(s, 'peakRep', s.fighter.reputation);
}

// ---------------------------------------------------------------------------
// Viradas de ano
// ---------------------------------------------------------------------------

/** Fim do ano de luta (antes de envelhecer): ofertas expiram, faixa, mensalidade, lesão, suspensão, reputação. */
export function endFightingYear(state: GameState, content: GameContent): GameState {
  const f = state.fighter;
  const gym = currentGym(state, content);
  let s: GameState = state;
  const foughtThisYear = f.history.some((h) => h.year === state.year);
  s = {
    ...s,
    fighter: {
      ...f,
      offers: [],
      suspendedYears: Math.max(0, f.suspendedYears - 1),
      // a fama precisa de manutenção: cai um pouco todo ano (mais se não lutou); aposentado: lenda, cai devagar
      reputation: f.retired
        ? Math.max(0, f.reputation - (f.reputation > 0 ? 1 : 0))
        : Math.max(0, f.reputation - (f.reputation > 40 ? 3 : 0) - (!foughtThisYear && f.reputation > 5 ? 2 : 0)),
    },
  };
  if (f.suspendedYears === 1) s = appendLog(s, 'Sua suspensão acabou. Você pode voltar a lutar.');
  // graduações: o tempo só corre nas modalidades treinadas; aos 16, jiu-jitsu infantil → adulto
  s = graduationYear(s, content);

  // mensalidade (a partir dos 18; reputação ≥ 15 rende bolsa de atleta)
  if (gym && state.character.age >= 18 && s.fighter.reputation < 15) {
    if (s.money >= gym.fee) s = post(s, 'academia', -gym.fee, `Mensalidade: ${gym.name}`);
    else {
      s = { ...s, fighter: { ...s.fighter, gymId: null } };
      s = appendLog(s, `Sem dinheiro para a mensalidade, você saiu da ${gym.name}.`);
    }
  }
  s = maxFeat(s, 'peakRep', s.fighter.reputation);
  return checkForcedRetirement(s, content);
}

/** Início do ano de luta (depois de envelhecer e da escola): declínio, mundo e ofertas. */
export function startFightingYear(state: GameState, rng: Rng, content: GameContent): GameState {
  let s: GameState = { ...state, fighter: { ...state.fighter, skills: ageDecline(state.fighter.skills, state.character.age, rng) } };
  s = trainingYear(s, rng);
  // mudou de categoria? sai do ranking da antiga
  const key = currentRosterKey(s, content);
  const orgId = s.fighter.orgId;
  if (key && orgId) {
    s = leaveRankings(s, (k) => k.startsWith(`${orgId}:`) && k !== key);
    s = ensureRoster(s, orgId, key.split(':')[1] as string, content);
  }
  s = simulateWorldYear(s, rng, content);
  // títulos que o mundo tirou (ex.: categoria abandonada)
  s = { ...s, fighter: { ...s.fighter, titles: s.fighter.titles.filter((t) => s.world.rosters[rosterKey(t.orgId, t.divisionId)]?.champion === PLAYER_ID) } };
  return generateOffers(s, rng, content);
}

// ---------------------------------------------------------------------------
// Efeitos de luta (eventos)
// ---------------------------------------------------------------------------

export interface FighterEffects {
  skills?: SkillDelta;
  reputation?: number;
  /** 'local' = mais barata da cidade, 'best' = melhor que dá para pagar, ou um id. */
  joinGym?: string;
  leaveGym?: boolean;
  signWith?: string;
  injury?: { name?: string; years: number };
  suspendYears?: number;
  vacateTitles?: boolean;
  /** Legado: promove a faixa de jiu-jitsu (= `promoteGrade: 'jiujitsu'`). */
  promoteBelt?: boolean;
  /** Promove a graduação da modalidade, se os requisitos forem atendidos. */
  promoteGrade?: ModalityId;
  offer?: { kind: 'shortNotice' | 'rival' | 'titleDefense' | 'bjjOpen' | 'farewell' };
  /** Aposenta (Etapa 6). */
  retire?: RetireReason;
  /** Volta da aposentadoria. */
  unretire?: boolean;
}

export function gymsInCity(state: GameState, content: GameContent) {
  return content.fighting.gyms.filter((g) => g.city === null || g.city === state.character.city);
}

function pickGym(state: GameState, which: string, content: GameContent) {
  const options = gymsInCity(state, content).filter((g) => g.minAge <= state.character.age && g.id !== state.fighter.gymId);
  if (which === 'local') return options.slice().sort((a, b) => a.fee - b.fee)[0];
  if (which === 'best') {
    const affordable = options.filter((g) => state.character.age < 18 || state.fighter.reputation >= 15 || state.money >= g.fee);
    return affordable.slice().sort((a, b) => b.coach - a.coach)[0];
  }
  return content.fighting.gyms.find((g) => g.id === which);
}

export function enterGym(state: GameState, gymId: string, content: GameContent): GameState {
  const gym = content.fighting.gyms.find((g) => g.id === gymId);
  if (!gym || state.fighter.gymId === gymId) return state;
  let s: GameState = { ...state, fighter: { ...state.fighter, gymId } };
  s = appendLog(s, `Você começou a treinar na ${gym.name}.`);
  // novo(a) treinador(a) na aba Relações
  const rng = createRng(s.rngState);
  s = setCoach(s, rng, content, gym.id);
  return { ...s, rngState: rng.state };
}

export function applyFighterEffects(state: GameState, fx: FighterEffects, rng: Rng, content: GameContent, vars?: EventVars): GameState {
  let s = state;
  if (fx.skills) s = applySkillDelta(s, fx.skills);
  let f = s.fighter;
  if (fx.reputation) f = { ...f, reputation: Math.min(100, Math.max(0, f.reputation + fx.reputation)) };
  if (fx.leaveGym) f = { ...f, gymId: null };
  if (fx.suspendYears) f = { ...f, suspendedYears: f.suspendedYears + fx.suspendYears, offers: [] };
  s = { ...s, fighter: f };
  // escândalo (suspensão) rompe patrocínios com cláusula de imagem
  if (fx.suspendYears) s = checkSponsorClauses(s, content, true);
  if (fx.injury) {
    s = legacyInjury(s, rng, content, fx.injury.name, fx.injury.years);
    if (injuryVeto(s)) s = { ...s, fighter: { ...s.fighter, offers: [] } };
  }
  if (fx.vacateTitles && s.fighter.titles.length) {
    s = leaveRankings(s, (k) => s.fighter.titles.some((t) => rosterKey(t.orgId, t.divisionId) === k));
    s = appendLog({ ...s, fighter: { ...s.fighter, titles: [] } }, 'Seu cinturão foi retirado.');
  }
  if (fx.joinGym) {
    const gym = pickGym(s, fx.joinGym, content);
    if (gym) s = enterGym(s, gym.id, content);
  }
  if (fx.signWith) s = signWith(s, fx.signWith, content);
  if (fx.promoteBelt) s = promoteGrade(s, 'jiujitsu', content);
  if (fx.promoteGrade) s = promoteGrade(s, fx.promoteGrade, content);
  if (fx.offer) s = effectOffer(s, fx.offer.kind, rng, content, vars);
  if (fx.retire) s = completeRetirement(s, fx.retire);
  if (fx.unretire) s = unretire(s);
  return s;
}

/** Luta de despedida: na liga atual (ou na melhor amadora/regional acessível), bolsa 1,5×. Depois dela, aposenta. */
function farewellOffer(state: GameState, rng: Rng, content: GameContent): GameState {
  if (state.fighter.retired || state.fighter.suspendedYears > 0) return completeRetirement(state, 'voluntaria');
  const org =
    getOrg(content, state.fighter.orgId) ??
    content.fighting.orgs.filter((o) => o.sport === 'mma' && (o.tier === 'regional' || o.tier === 'amateur') && state.character.age >= o.minAge).sort((a, b) => tierIndex(b.tier) - tierIndex(a.tier))[0];
  if (!org) return completeRetirement(state, 'voluntaria');
  const opp = ephemeral(state, rng, org, playerLevel(state), content);
  const offer = { ...makeOffer(state, org, 'farewell', opp, false, 1.5), kind: 'farewell' as const };
  return pushOffer({ ...state, fighter: { ...state.fighter, offers: [] } }, offer, content);
}

function effectOffer(state: GameState, kind: NonNullable<FighterEffects['offer']>['kind'], rng: Rng, content: GameContent, vars?: EventVars): GameState {
  if (kind === 'farewell') return farewellOffer(state, rng, content);
  if (injuryVeto(state) || state.fighter.retired || state.fighter.suspendedYears > 0) return state;
  const contract = getOrg(content, state.fighter.orgId);
  const amateur = content.fighting.orgs.find((o) => o.tier === 'amateur' && o.sport === 'mma');
  const bjj = content.fighting.orgs.find((o) => o.tier === 'amateur' && o.sport === 'bjj');
  const lvl = playerLevel(state);
  if (kind === 'bjjOpen' && bjj) {
    return pushOffer(state, makeOffer(state, bjj, 'bjj', ephemeral(state, rng, bjj, 25 + bjjRank(state) * 13, content), false, 2), content);
  }
  if (kind === 'rival') {
    const org = contract ?? amateur;
    if (!org) return state;
    // revanche: um rival do elenco da sua categoria atual
    const rkey = contract ? currentRosterKey(state, content) : null;
    const roster = rkey ? state.world.rosters[rkey] : undefined;
    const rivalNpc = roster ? relationsOf(state, ['rival']).map(({ person }) => roster.npcs.find((n) => n.id === person.npcId)).find((n) => n) : undefined;
    if (rivalNpc && roster && contract) return pushOffer(state, makeOffer(state, contract, 'rival', npcToOpponent(rivalNpc, roster), false, 1.5), content);
    const opp = ephemeral(state, rng, org, lvl + 4, content, {
      ...(vars?.lutador_nome ? { name: vars.lutador_nome } : {}),
      ...(vars?.lutador_apelido ? { nick: vars.lutador_apelido } : {}),
    });
    return pushOffer(state, makeOffer(state, org, 'rival', opp, false, 1.5), content);
  }
  if (!contract) return state;
  const key = currentRosterKey(state, content);
  const s = key ? ensureRoster(state, contract.id, key.split(':')[1] as string, content) : state;
  const roster = key ? s.world.rosters[key] : undefined;
  if (!roster) return s;
  if (kind === 'titleDefense') {
    if (roster.champion !== PLAYER_ID || !roster.ranking[0]) return s;
    const npc = roster.npcs.find((n) => n.id === roster.ranking[0]);
    return npc ? pushOffer(s, makeOffer(s, contract, 'title', npcToOpponent(npc, roster), true), content) : s;
  }
  // shortNotice: substituir alguém num card principal — adversário bem ranqueado, bolsa maior
  const r = rankOf(roster, PLAYER_ID);
  const pool = roster.ranking.filter((id) => id !== PLAYER_ID).slice(0, Math.max(3, (r ?? roster.ranking.length) - 1));
  if (!pool.length) return s;
  const npc = roster.npcs.find((n) => n.id === rng.pick(pool));
  return npc ? pushOffer(s, makeOffer(s, contract, 'shortNotice', npcToOpponent(npc, roster), false, 1.5), content) : s;
}

// ---------------------------------------------------------------------------
// Academia (ações do jogador)
// ---------------------------------------------------------------------------

export type GymBlockReason = 'dead' | 'busy' | 'too-young' | 'other-city' | 'current' | 'no-money' | 'unknown';

/** Pode pagar: menor de idade (pais pagam), bolsa de atleta (reputação ≥ 15) ou dinheiro para a mensalidade. */
export function canAffordGym(state: GameState, fee: number): boolean {
  return state.character.age < 18 || state.fighter.reputation >= 15 || state.money >= fee;
}

export function gymBlockReason(state: GameState, gymId: string, content: GameContent): GymBlockReason | null {
  const gym = content.fighting.gyms.find((g) => g.id === gymId);
  if (!gym) return 'unknown';
  if (!state.alive) return 'dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'busy';
  if (state.fighter.gymId === gymId) return 'current';
  if (gym.city !== null && gym.city !== state.character.city) return 'other-city';
  if (state.character.age < gym.minAge) return 'too-young';
  if (!canAffordGym(state, gym.fee)) return 'no-money';
  return null;
}

/** Entra (ou troca) de academia. */
export function joinGym(state: GameState, gymId: string, content: GameContent): GameState {
  if (gymBlockReason(state, gymId, content) !== null) return state;
  return enterGym(state, gymId, content);
}

export function leaveGym(state: GameState, content: GameContent): GameState {
  const gym = currentGym(state, content);
  if (!gym || state.activeFight) return state;
  const rng = createRng(state.rngState);
  const s = setCoach({ ...state, fighter: { ...state.fighter, gymId: null } }, rng, content, null);
  return appendLog({ ...s, rngState: rng.state }, `Você saiu da ${gym.name}.`);
}
