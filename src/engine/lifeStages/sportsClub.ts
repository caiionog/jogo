/**
 * Clubes esportivos e intercâmbio de artes marciais (release 0.0.1).
 *
 * Clube: a partir dos 6 anos, mensalidade anual (pais pagam até os 18). "Treinar no clube" gasta 1 sessão de treino,
 * sobe a Capacidade atlética e pode render amizades; o judô do clube também conta como treino de judô (grappling e
 * faixa). Competições chegam por eventos com a condição `sportsClub`.
 *
 * Intercâmbio: 16+ (com autorização dos pais até os 18), um ano numa academia fictícia no exterior. Custo alto, sem
 * emprego de tempo integral (a não ser com licença), a escola fica em pausa e, no fim do ano, ganho grande na
 * modalidade e na Capacidade atlética + reputação. O personagem continua morando no Brasil.
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { post } from '../economy/ledger';
import { ensureGrade, modalityDef } from '../fighting/belts';
import { addSkills } from '../fighting/profile';
import type { ModalityId } from '../fighting/types';
import { meetFriend } from '../relationships/social';
import { relationsOf } from '../relationships/people';
import { talentMod } from '../character/talents';
import { bumpUse, usesThisYear, useSessions } from './sessions';
import { isOvertraining, overtrainSession } from '../fighting/overtrain';

export type SportId = 'futebol' | 'natacao' | 'atletismo' | 'volei' | 'basquete' | 'judo' | 'ginastica';

export interface SportsClubDef {
  id: string;
  name: string;
  city: string | null;
  fee: number;
  minAge: number;
  sports: readonly SportId[];
}

export interface SportsClubMembership {
  clubId: string;
  sport: SportId;
  years: number;
}

export interface ExchangeProgramDef {
  id: string;
  country: string;
  city: string;
  academy: string;
  modality: ModalityId;
  cost: number;
}

export interface ExchangeState {
  programId: string;
  /** Ano do calendário em que o intercâmbio acontece. */
  year: number;
}

// ---------------------------------------------------------------------------
// clube esportivo
// ---------------------------------------------------------------------------

export function sportsClubDef(content: GameContent, id: string | undefined): SportsClubDef | undefined {
  return id ? content.sportsClubs.find((c) => c.id === id) : undefined;
}

export function clubsInCity(state: GameState, content: GameContent): SportsClubDef[] {
  return content.sportsClubs.filter((c) => c.city === null || c.city === state.character.city);
}

export type SportsClubBlockReason = 'busy' | 'too-young' | 'other-city' | 'no-sport' | 'current' | 'no-money';

export function sportsClubBlockReason(state: GameState, clubId: string, sport: SportId, content: GameContent): SportsClubBlockReason | null {
  const c = sportsClubDef(content, clubId);
  if (!c || !state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.character.age < c.minAge) return 'too-young';
  if (c.city !== null && c.city !== state.character.city) return 'other-city';
  if (!c.sports.includes(sport)) return 'no-sport';
  if (state.sportsClub?.clubId === clubId && state.sportsClub.sport === sport) return 'current';
  if (state.character.age >= 18 && state.money < c.fee) return 'no-money';
  return null;
}

export function joinSportsClub(state: GameState, clubId: string, sport: SportId, content: GameContent): GameState {
  if (sportsClubBlockReason(state, clubId, sport, content) !== null) return state;
  const c = sportsClubDef(content, clubId)!;
  const s: GameState = { ...state, sportsClub: { clubId, sport, years: 0 } };
  return appendLog(s, `Você entrou no ${c.name} para praticar ${sportLabel(sport)}.`);
}

export function leaveSportsClub(state: GameState, content: GameContent): GameState {
  const m = state.sportsClub;
  if (!m) return state;
  return appendLog({ ...state, sportsClub: null }, `Você saiu do ${sportsClubDef(content, m.clubId)?.name ?? 'clube'}.`);
}

const SPORT_TEXT: Record<SportId, string> = { futebol: 'futebol', natacao: 'natação', atletismo: 'atletismo', volei: 'vôlei', basquete: 'basquete', judo: 'judô', ginastica: 'ginástica' };
export const sportLabel = (s: SportId) => SPORT_TEXT[s];

export type ClubTrainBlockReason = 'busy' | 'no-club';

export function clubTrainBlockReason(state: GameState, _content: GameContent): ClubTrainBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (!state.sportsClub) return 'no-club';
  return null;
}

/** Treinar no clube: 1 sessão; Capacidade atlética (menos que o treino físico puro), humor e chance de amizade. */
export function trainAtClub(state: GameState, content: GameContent): GameState {
  if (clubTrainBlockReason(state, content) !== null) return state;
  const m = state.sportsClub!;
  const rng = createRng(state.rngState);
  // sem sessões livres: treino sem ganho e com o aviso (release 0.0.2)
  if (isOvertraining(state, content)) return { ...overtrainSession(state, rng, content), rngState: rng.state };
  const athletic = state.character.stats.athletic;
  const mult = 1 + talentMod(state, content, 'trainingGain');
  const raw = 2.4 * mult * Math.max(0.1, (100 - athletic) / 100) * (state.character.age < 12 ? 0.8 : 1) * (0.8 + rng.next() * 0.4);
  const gain = Math.floor(raw) + (rng.chance(raw - Math.floor(raw)) ? 1 : 0);
  let s = useSessions(state, 1);
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { athletic: gain, happiness: 1 }) } };
  if (m.sport === 'judo') {
    // judô do clube: grappling e faixa de judô
    const sk = s.fighter.skills.grappling;
    s = { ...s, fighter: { ...s.fighter, skills: addSkills(s.fighter.skills, { grappling: 1.2 * Math.pow((100 - sk) / 100, 1.5) * mult }) } };
    s = ensureGrade(s, 'judo', content);
    if (!s.fighter.trainedThisYear.includes('judo')) s = { ...s, fighter: { ...s.fighter, trainedThisYear: [...s.fighter.trainedThisYear, 'judo'] } };
  }
  if (m.sport === 'natacao') s = { ...s, scene: { kind: 'piscina', year: s.year } };
  s = appendLog(s, `Você treinou ${sportLabel(m.sport)} no clube.`);
  if (rng.chance(0.15)) s = meetFriend({ ...s, rngState: rng.state }, rng, content, 'school');
  return { ...s, rngState: rng.state };
}

/** Fim do ano do clube: mensalidade (a partir dos 18) e um ano a mais de clube. */
export function sportsClubYear(state: GameState, content: GameContent): GameState {
  const m = state.sportsClub;
  if (!m) return state;
  const c = sportsClubDef(content, m.clubId);
  if (!c) return { ...state, sportsClub: null };
  let s = state;
  if (state.character.age >= 18) {
    if (s.money < c.fee) return appendLog({ ...s, sportsClub: null }, `Sem dinheiro para a mensalidade, você saiu do ${c.name}.`);
    s = post(s, 'educacao', -c.fee, `Mensalidade: ${c.name}`);
  }
  return { ...s, sportsClub: { ...m, years: m.years + 1 } };
}

// ---------------------------------------------------------------------------
// intercâmbio
// ---------------------------------------------------------------------------

export function exchangeDef(content: GameContent, id: string | undefined): ExchangeProgramDef | undefined {
  return id ? content.exchangePrograms.find((p) => p.id === id) : undefined;
}

export function onExchange(state: GameState): boolean {
  return !!state.exchange && state.exchange.year === state.year;
}

/** Parte do custo que os pais pagam para quem tem 16–17 (pela renda da família). */
export function parentsShare(state: GameState, cost: number): number {
  return state.character.age < 18 ? Math.round((cost * state.character.familyWealth) / 100) : 0;
}

export type ExchangeBlockReason = 'busy' | 'too-young' | 'needs-parents' | 'job' | 'no-money' | 'already';

export function exchangeBlockReason(state: GameState, programId: string, content: GameContent): ExchangeBlockReason | null {
  const p = exchangeDef(content, programId);
  if (!p || !state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.exchange) return 'already';
  if (state.character.age < 16) return 'too-young';
  if (state.character.age < 18 && state.flags.autorizacao_intercambio !== state.year) return 'needs-parents';
  const job = content.economy.jobs.find((j) => j.id === state.economy.job?.jobId);
  if (job && job.trainingSessions >= 4 && state.flags.licenca !== state.year) return 'job';
  if (state.money < p.cost - parentsShare(state, p.cost)) return 'no-money';
  return null;
}

/** Pedir autorização aos pais (16–17): chance pela renda e pelo afeto; uma vez por ano. */
export function askParentsForExchange(state: GameState): GameState {
  if (state.character.age >= 18 || state.flags.autorizacao_intercambio === state.year || usesThisYear(state, 'intercambio:pais') > 0) return state;
  const rng = createRng(state.rngState);
  const parents = relationsOf(state, ['pai', 'mae']);
  const aff = parents.length ? parents.reduce((t, p) => t + p.rel.affection, 0) / parents.length : 50;
  const chance = Math.min(0.9, 0.2 + state.character.familyWealth / 200 + aff / 200);
  let s = bumpUse({ ...state, rngState: rng.state }, 'intercambio:pais');
  if (rng.chance(chance)) {
    s = { ...s, flags: { ...s.flags, autorizacao_intercambio: s.year } };
    return appendLog(s, 'Seus pais autorizaram o intercâmbio — com mil recomendações.');
  }
  return appendLog(s, 'Seus pais disseram que ainda não é hora de ir para tão longe.');
}

/** Pedir licença do emprego de tempo integral por um ano (chance pelo desempenho). */
export function askJobLeave(state: GameState): GameState {
  const job = state.economy.job;
  if (!job || state.flags.licenca === state.year || usesThisYear(state, 'intercambio:licenca') > 0) return state;
  const rng = createRng(state.rngState);
  let s = bumpUse({ ...state, rngState: rng.state }, 'intercambio:licenca');
  if (rng.chance(Math.min(0.85, 0.15 + job.performance / 120))) {
    s = { ...s, flags: { ...s.flags, licenca: s.year } };
    return appendLog(s, 'A empresa aprovou sua licença não remunerada por um ano.');
  }
  return appendLog(s, 'O chefe negou a licença. Para ir, só pedindo demissão.');
}

export function startExchange(state: GameState, programId: string, content: GameContent): GameState {
  if (exchangeBlockReason(state, programId, content) !== null) return state;
  const p = exchangeDef(content, programId)!;
  const share = parentsShare(state, p.cost);
  let s = post(state, 'educacao', -(p.cost - share), `Intercâmbio: ${p.academy} (${p.country})`);
  s = { ...s, exchange: { programId, year: s.year } };
  const mod = modalityDef(content, p.modality)?.label.toLowerCase() ?? p.modality;
  return appendLog(s, `✈️ Você foi para ${p.city} (${p.country}) treinar ${mod} na ${p.academy} por um ano.${share > 0 ? ' Seus pais pagaram parte da viagem.' : ''}`);
}

/** Durante o intercâmbio, a "academia" é a do programa: treinador de elite, só a modalidade do programa. */
export function exchangeGym(state: GameState, content: GameContent) {
  const p = onExchange(state) ? exchangeDef(content, state.exchange!.programId) : undefined;
  return p ? { id: `intercambio_${p.id}`, name: p.academy, city: null, fee: 0, coach: 92, modalities: [p.modality] as const, minAge: 16 } : undefined;
}

/** Fim do ano do intercâmbio: ganho grande na modalidade e na atlética, reputação, flag e volta para casa. */
export function exchangeYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const ex = state.exchange;
  if (!ex) return state;
  const p = exchangeDef(content, ex.programId);
  let s: GameState = { ...state, exchange: null };
  if (!p) return s;
  const mod = modalityDef(content, p.modality);
  const k = state.fighter.talent * (1 + talentMod(state, content, 'trainingGain'));
  if (mod) {
    const cur = s.fighter.skills[mod.skill];
    s = { ...s, fighter: { ...s.fighter, skills: addSkills(s.fighter.skills, { [mod.skill]: 8 * k * Math.pow((100 - cur) / 100, 1.2) * (0.85 + rng.next() * 0.3) }), reputation: Math.min(100, s.fighter.reputation + 5) } };
    s = ensureGrade(s, p.modality, content);
    if (!s.fighter.trainedThisYear.includes(p.modality)) s = { ...s, fighter: { ...s.fighter, trainedThisYear: [...s.fighter.trainedThisYear, p.modality] } };
  }
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { athletic: 4, happiness: 3 }) }, flags: { ...s.flags, [`fez_intercambio_${p.id}`]: true, fez_intercambio: true } };
  return appendLog(s, `Você voltou de ${p.country} outra pessoa: técnica afiada, corpo pronto e histórias para contar.`);
}
