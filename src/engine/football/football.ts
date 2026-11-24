/**
 * Carreira de futebol (release 0.0.4, fase 6). Peneira (10–23 anos) → base → primeiro contrato aos 17+ → temporadas
 * anuais com tabela, gols, nota, títulos, Seleção, propostas e transferências (inclusive para o exterior) →
 * aposentadoria. As habilidades e o potencial são ocultos (a UI mostra pistas em palavras).
 * RNG: a força dos clubes no ano usa RNG derivado (seed, ano); o resto usa o RNG do jogo (`rng` do tick ou da ação).
 */
import type { GameContent } from '../core/content';
import { createRng, seedToState } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { luckFactor } from '../character/talents';
import { post, toMoney } from '../economy/ledger';
import { bumpUse, repeatMultiplier, sessionsLeft, useSessions } from '../lifeStages/sessions';
import type { FootballClubDef, FootballDivision, FootballOffer, FootballPosition, FootballSeason, FootballSkill, FootballState } from './types';

export const POSITIONS: readonly FootballPosition[] = ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA'];
export const POSITION_LABEL: Record<FootballPosition, string> = { GOL: 'Goleiro(a)', ZAG: 'Zagueiro(a)', LAT: 'Lateral', VOL: 'Volante', MEI: 'Meia', ATA: 'Atacante' };
const DIVS: readonly FootballDivision[] = ['A', 'B', 'C', 'D'];

/** Peso de cada habilidade no nível geral por posição. */
const WEIGHTS: Record<FootballPosition, Record<FootballSkill, number>> = {
  GOL: { goalkeeping: 0.75, passing: 0.1, defending: 0.1, pace: 0.05, finishing: 0 },
  ZAG: { defending: 0.6, pace: 0.15, passing: 0.15, finishing: 0.05, goalkeeping: 0.05 },
  LAT: { pace: 0.35, defending: 0.35, passing: 0.25, finishing: 0.05, goalkeeping: 0 },
  VOL: { defending: 0.45, passing: 0.35, pace: 0.15, finishing: 0.05, goalkeeping: 0 },
  MEI: { passing: 0.55, finishing: 0.2, pace: 0.15, defending: 0.1, goalkeeping: 0 },
  ATA: { finishing: 0.6, pace: 0.25, passing: 0.15, defending: 0, goalkeeping: 0 },
};

export function clubDef(content: GameContent, id: string | undefined): FootballClubDef | undefined {
  if (!id) return undefined;
  return content.football.clubs.find((c) => c.id === id) ?? content.football.leagues.flatMap((l) => l.clubs).find((c) => c.id === id);
}

export function leagueOf(content: GameContent, clubId: string) {
  return content.football.leagues.find((l) => l.clubs.some((c) => c.id === clubId));
}

export function overall(f: Pick<FootballState, 'skills' | 'position'>): number {
  const w = WEIGHTS[f.position];
  return Math.round((Object.keys(w) as FootballSkill[]).reduce((t, k) => t + f.skills[k] * w[k], 0));
}

export function divisionOf(state: GameState, content: GameContent, clubId: string): FootballDivision | 'X' {
  if (leagueOf(content, clubId)) return 'X';
  return state.football?.divisions[clubId] ?? (clubDef(content, clubId)?.division as FootballDivision | undefined) ?? 'D';
}

export function initialDivisions(content: GameContent): Record<string, FootballDivision> {
  return Object.fromEntries(content.football.clubs.map((c) => [c.id, c.division as FootballDivision]));
}

/** Pista do treinador (nunca o número). */
export function footballHint(f: FootballState): string {
  const o = overall(f);
  if (o >= 85) return '"Craque. Joga em qualquer time do mundo."';
  if (o >= 75) return '"Titular de time grande, sem discussão."';
  if (o >= 65) return '"Bom jogador. Falta pouco para virar diferença."';
  if (o >= 55) return '"Tem espaço no time, mas precisa render mais."';
  if (o >= 45) return '"Esforçado. Ainda está longe do nível profissional alto."';
  return '"Ainda muito cru. Precisa treinar muito."';
}

/** Pista do potencial (oculto). */
export function potentialHint(f: FootballState): string {
  const gap = f.potential - overall(f);
  if (gap >= 20) return 'Os olheiros acham que você ainda vai crescer muito.';
  if (gap >= 8) return 'Ainda há espaço para evoluir.';
  return 'Você está perto do seu teto.';
}

// ---------------------------------------------------------------------------
// entrada: peneira
// ---------------------------------------------------------------------------

export type TryoutBlockReason = 'busy' | 'age' | 'already' | 'tried' | 'prison' | 'fighter';

export function tryoutBlockReason(state: GameState): TryoutBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.prison) return 'prison';
  if (state.football && state.football.stage !== 'aposentado') return 'already';
  if (state.football?.stage === 'aposentado') return 'already';
  if (state.character.age < 10 || state.character.age > 23) return 'age';
  if (state.fighter.orgId) return 'fighter';
  if (state.yearUses['futebol:peneira']) return 'tried';
  return null;
}

export function tryoutChance(state: GameState): number {
  const age = state.character.age;
  const st = state.character.stats;
  const youth = age <= 14 ? 0.12 : age <= 17 ? 0.05 : -0.12;
  const club = state.sportsClub?.sport === 'futebol' ? 0.12 : 0;
  return Math.max(0.03, Math.min(0.7, 0.04 + st.athletic / 320 + youth + club + luckFactor(state) * 0.05));
}

/** Peneira: aprovado, entra na base de um clube (da UF se houver; senão um clube de divisão baixa). */
export function tryout(state: GameState, position: FootballPosition, content: GameContent): GameState {
  if (tryoutBlockReason(state) !== null) return state;
  const rng = createRng(state.rngState);
  let s = bumpUse(state, 'futebol:peneira');
  if (!rng.chance(tryoutChance(s))) {
    s = appendLog(s, `Você fez a peneira como ${POSITION_LABEL[position].toLowerCase()}, mas não foi chamad${s.character.sex === 'M' ? 'o' : 'a'}. Tem outra no ano que vem.`);
    return { ...s, rngState: rng.state };
  }
  const local = content.football.clubs.filter((c) => c.uf === s.character.uf && (c.division === 'A' || c.division === 'B'));
  const pool = local.length ? local : content.football.clubs.filter((c) => c.division === 'C' || c.division === 'D');
  const club = rng.pick(pool);
  // potencial e base por RNG derivado (talento oculto), sem depender da ordem das ações
  const tr = createRng(seedToState(`${s.seed}:futebol:${s.character.birthYear}`));
  const ath = s.character.stats.athletic;
  const base = (k: FootballSkill) => Math.round(Math.min(60, 15 + ath * 0.25 + (WEIGHTS[position][k] > 0.3 ? 8 : 0) + tr.int(-5, 8) + Math.min(6, s.character.age - 10)));
  const fs: FootballState = {
    stage: s.character.age >= 17 ? 'pro' : 'base',
    position,
    skills: { finishing: base('finishing'), passing: base('passing'), defending: base('defending'), goalkeeping: position === 'GOL' ? base('goalkeeping') : 10, pace: base('pace') },
    potential: Math.min(97, 45 + tr.int(0, 38) + Math.round(ath / 12)),
    reputation: 2,
    clubId: club.id,
    contract: null,
    offers: [],
    history: [],
    titles: [],
    caps: 0,
    divisions: initialDivisions(content),
  };
  s = { ...s, football: fs };
  if (fs.stage === 'pro') s = signContract(s, club.id, 2, Math.round(salaryFor(s, content, club.id) * 0.5), content);
  s = appendLog(s, `Aprovad${s.character.sex === 'M' ? 'o' : 'a'} na peneira! Você vai jogar na ${fs.stage === 'base' ? 'base' : 'equipe'} do ${club.name} como ${POSITION_LABEL[position].toLowerCase()}.`);
  return { ...s, rngState: rng.state };
}

// ---------------------------------------------------------------------------
// treino
// ---------------------------------------------------------------------------

export type FootTrainBlockReason = 'busy' | 'none' | 'sessions' | 'retired';

export function footballTrainBlockReason(state: GameState, content: GameContent): FootTrainBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (!state.football) return 'none';
  if (state.football.stage === 'aposentado') return 'retired';
  if (sessionsLeft(state, content) < 1) return 'sessions';
  return null;
}

/** Treino extra (1 sessão): sobe as habilidades da posição, mais longe do teto rende mais; retorno decrescente no ano. */
export function trainFootball(state: GameState, content: GameContent): GameState {
  if (footballTrainBlockReason(state, content) !== null) return state;
  const f = state.football!;
  const mult = repeatMultiplier(state, 'futebol:treino', content);
  const w = WEIGHTS[f.position];
  const skills = { ...f.skills };
  for (const k of Object.keys(skills) as FootballSkill[]) {
    const room = Math.max(0, f.potential - skills[k]);
    skills[k] = Math.min(100, Math.round((skills[k] + room * 0.05 * (w[k] + 0.1) * 2 * mult) * 10) / 10);
  }
  const s = bumpUse(useSessions({ ...state, football: { ...f, skills } }, 1), 'futebol:treino');
  return appendLog(s, 'Você ficou depois do treino batendo bola, cobrando falta e correndo de tiro.');
}

// ---------------------------------------------------------------------------
// contratos e propostas
// ---------------------------------------------------------------------------

export function salaryFor(state: GameState, content: GameContent, clubId: string): number {
  const f = state.football;
  const div = divisionOf(state, content, clubId);
  const league = leagueOf(content, clubId);
  const base = div === 'X' ? content.football.salaryByDivision.A * (league?.salaryMult ?? 3) : content.football.salaryByDivision[div];
  const o = f ? overall(f) : 40;
  return toMoney(base * (0.4 + o / 80) * (1 + (f?.reputation ?? 0) / 200));
}

function signContract(state: GameState, clubId: string, years: number, salary: number, _content: GameContent): GameState {
  const f = state.football!;
  let s: GameState = { ...state, football: { ...f, stage: 'pro', clubId, contract: { clubId, years, salary }, offers: [] } };
  if (s.economy.job) s = appendLog({ ...s, economy: { ...s.economy, job: null } }, 'Você largou o emprego para viver de futebol.');
  return s;
}

export type FootballOfferBlockReason = 'busy' | 'none' | 'unknown' | 'fighter';

export function footballOfferBlockReason(state: GameState, clubId: string): FootballOfferBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (!state.football) return 'none';
  if (state.fighter.orgId && !state.fighter.retired) return 'fighter';
  if (!state.football.offers.some((o) => o.clubId === clubId)) return 'unknown';
  return null;
}

export function acceptFootballOffer(state: GameState, clubId: string, content: GameContent): GameState {
  if (footballOfferBlockReason(state, clubId) !== null) return state;
  const offer = state.football!.offers.find((o) => o.clubId === clubId)!;
  const club = clubDef(content, clubId);
  const s = signContract(state, clubId, offer.years, offer.salary, content);
  const abroad = leagueOf(content, clubId);
  return appendLog(s, `Contrato assinado com o ${club?.name ?? clubId}${abroad ? ` (${abroad.name})` : ''}: ${offer.years} ${offer.years === 1 ? 'ano' : 'anos'}, R$ ${offer.salary.toLocaleString('pt-BR')}/ano.`);
}

export function retireFootball(state: GameState): GameState {
  const f = state.football;
  if (!f || f.stage === 'aposentado' || state.pendingEvents.length || state.activeFight) return state;
  const s: GameState = { ...state, football: { ...f, stage: 'aposentado', contract: null, offers: [] } };
  return appendLog(s, `Você pendurou as chuteiras${f.history.length ? ` depois de ${f.history.length} temporadas` : ''}.`);
}

// ---------------------------------------------------------------------------
// temporada (virada do ano)
// ---------------------------------------------------------------------------

/** Força de cada clube no ano (RNG derivado: igual para qualquer vida com a mesma seed e ano). */
export function yearPower(seed: string, year: number, club: FootballClubDef): number {
  return club.power + createRng(seedToState(`${seed}:clube:${year}:${club.id}`)).int(-6, 6);
}

/** Tabela de uma divisão no ano: ids do 1º ao último. */
export function divisionTable(state: GameState, content: GameContent, div: FootballDivision): string[] {
  const clubs = content.football.clubs.filter((c) => (state.football?.divisions[c.id] ?? c.division) === div);
  const rng = createRng(seedToState(`${state.seed}:tabela:${state.year}:${div}`));
  return clubs.map((c) => ({ id: c.id, score: yearPower(state.seed, state.year, c) + rng.int(-8, 8) })).sort((a, b) => b.score - a.score).map((x) => x.id);
}

function promotions(state: GameState, content: GameContent): Record<string, FootballDivision> {
  const next = { ...state.football!.divisions };
  const tables = Object.fromEntries(DIVS.map((d) => [d, divisionTable(state, content, d)])) as Record<FootballDivision, string[]>;
  for (let i = 0; i < DIVS.length - 1; i++) {
    const up = DIVS[i]!;
    const down = DIVS[i + 1]!;
    for (const id of tables[up].slice(-4)) next[id] = down;
    for (const id of tables[down].slice(0, 4)) next[id] = up;
  }
  return next;
}

function growth(f: FootballState, age: number, rng: Rng): FootballState {
  const skills = { ...f.skills };
  for (const k of Object.keys(skills) as FootballSkill[]) {
    if (age <= 24) skills[k] = Math.min(f.potential, skills[k] + Math.max(0, (f.potential - skills[k]) * 0.09) + rng.next() * 0.8);
    else if (age >= 31) skills[k] = Math.max(5, skills[k] - (age - 29) * 0.6 * (k === 'pace' ? 1.6 : 1) - rng.next());
    skills[k] = Math.round(skills[k] * 10) / 10;
  }
  return { ...f, skills };
}

function simulateSeason(state: GameState, rng: Rng, content: GameContent): { s: GameState; season: FootballSeason } {
  const f = state.football!;
  const club = clubDef(content, f.clubId)!;
  const div = divisionOf(state, content, f.clubId);
  const clubStr = yearPower(state.seed, state.year, club);
  const o = overall(f);
  const starter = o >= clubStr - 6;
  const apps = f.contract ? (starter ? rng.int(26, 38) : rng.int(2, 16)) : 0;
  const share: Record<FootballPosition, [number, number]> = { GOL: [0, 0.01], ZAG: [0.05, 0.03], LAT: [0.04, 0.12], VOL: [0.06, 0.08], MEI: [0.2, 0.3], ATA: [0.55, 0.15] };
  const [gRate, aRate] = share[f.position];
  const goals = Math.round(apps * gRate * (f.skills.finishing / 70) * (0.7 + rng.next() * 0.6));
  const assists = Math.round(apps * aRate * (f.skills.passing / 70) * (0.7 + rng.next() * 0.6));
  const rating = apps ? Math.round(Math.max(4, Math.min(9.6, 6 + (o - clubStr) / 10 + (goals + assists) / Math.max(10, apps) + (rng.next() - 0.5))) * 10) / 10 : 0;
  let place = 1;
  const titles: string[] = [];
  const C = content.football.competitions;
  if (div === 'X') {
    const league = leagueOf(content, f.clubId)!;
    place = rng.int(1, league.clubs.length + 6);
    if (place === 1) titles.push(league.name);
  } else {
    const table = divisionTable(state, content, div);
    place = table.indexOf(f.clubId) + 1;
    if (place === 1) titles.push(`${C.nacional} (Divisão ${div})`);
    if ((div === 'A' || div === 'B') && rng.chance(Math.max(0.02, (clubStr - 55) / 180))) titles.push(C.copa);
    if (div === 'A' && place <= 4 && rng.chance(0.18)) titles.push(C.continental);
    if (club.uf && rng.chance(Math.max(0.03, (clubStr - 50) / 160))) titles.push(`${C.estadual} (${club.uf})`);
  }
  if (apps && (div === 'A' || div === 'X') && rating >= 8.1 && rng.chance(0.5)) titles.push(C.premio);
  const season: FootballSeason = { year: state.year, age: state.character.age, clubId: f.clubId, division: div, apps, goals, assists, rating, place, titles };
  // Seleção: os melhores da primeira divisão ou do exterior
  const caps = o >= 73 && (div === 'A' || div === 'X') && apps >= 20 ? rng.int(2, 9) : 0;
  const repTarget = Math.max(0, Math.min(100, (o - 40) * 1.3 + (div === 'A' ? 12 : div === 'X' ? 18 : div === 'B' ? 4 : 0) + titles.length * 6 + (caps ? 10 : 0)));
  const reputation = Math.round(f.reputation + (repTarget - f.reputation) * 0.35);
  let s: GameState = { ...state, football: { ...f, history: [...f.history, season].slice(-25), titles: [...f.titles, ...titles.map((t) => `${t} ${state.year}`)], caps: f.caps + caps, reputation } };
  if (titles.length) s = appendLog(s, `Títulos da temporada: ${titles.join(', ')}!`);
  if (caps) s = appendLog(s, `Você foi convocad${s.character.sex === 'M' ? 'o' : 'a'} para a ${C.selecao} e jogou ${caps} partidas.`);
  return { s, season };
}

function makeOffers(state: GameState, rng: Rng, content: GameContent, season: FootballSeason | null): FootballOffer[] {
  const f = state.football!;
  const o = overall(f);
  const age = state.character.age;
  const offers: FootballOffer[] = [];
  const curStr = clubDef(content, f.clubId)?.power ?? 50;
  const good = season ? season.rating >= 7 : o >= 50;
  if (good) {
    const better = content.football.clubs.filter((c) => c.id !== f.clubId && c.power > curStr && c.power <= o + 8);
    for (let i = 0; i < Math.min(2, better.length); i++) {
      const c = rng.pick(better);
      if (!offers.some((x) => x.clubId === c.id)) offers.push({ clubId: c.id, years: rng.int(2, 4), salary: salaryFor(state, content, c.id), year: state.year });
    }
  }
  if (o >= 71 && age <= 31 && rng.chance(0.35)) {
    const league = rng.pick(content.football.leagues);
    const c = rng.pick(league.clubs.filter((x) => x.power <= o + 10).length ? league.clubs.filter((x) => x.power <= o + 10) : league.clubs);
    offers.push({ clubId: c.id, years: rng.int(2, 4), salary: salaryFor(state, content, c.id), year: state.year });
  }
  // sem contrato e sem nada melhor: um clube de divisão baixa sempre aparece até os 34
  if (!f.contract && !offers.length && age <= 34) {
    const low = content.football.clubs.filter((c) => c.power <= Math.max(48, o + 2));
    const c = rng.pick(low.length ? low : content.football.clubs);
    offers.push({ clubId: c.id, years: 1, salary: Math.round(salaryFor(state, content, c.id) * 0.8), year: state.year });
  }
  return offers;
}

/** Virada do ano do futebol: crescimento/declínio, base → profissional, temporada, salário, contrato e propostas. */
export function footballYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const f0 = state.football;
  if (!f0 || f0.stage === 'aposentado') return state;
  const age = state.character.age;
  let s: GameState = { ...state, football: { ...growth(f0, age, rng), offers: [] } };
  const o = (st: GameState) => overall(st.football!);
  if (f0.stage === 'base') {
    if (age >= 17 && o(s) >= 42) {
      const club = clubDef(content, f0.clubId)!;
      s = signContract(s, club.id, 2, Math.round(salaryFor(s, content, club.id) * 0.5), content);
      return appendLog(s, `Você subiu da base e assinou o primeiro contrato profissional com o ${club.name}!`);
    }
    if (age >= 20) {
      s = { ...s, football: { ...s.football!, stage: 'aposentado' } };
      return appendLog(s, 'A base te dispensou sem contrato profissional. O sonho do futebol ficou para trás.');
    }
    return s;
  }
  let season: FootballSeason | null = null;
  if (s.football!.contract) {
    const r = simulateSeason(s, rng, content);
    s = r.s;
    season = r.season;
    const c = s.football!.contract!;
    s = post(s, 'salario', c.salary, `Salário: ${clubDef(content, c.clubId)?.name ?? 'clube'}`);
    // bicho por título
    if (season.titles.length) s = post(s, 'salario', toMoney(c.salary * 0.1 * season.titles.length), 'Premiação por títulos');
    const years = c.years - 1;
    if (years > 0) s = { ...s, football: { ...s.football!, contract: { ...c, years } } };
    else if (season.rating >= 6 && age <= 35) {
      const salary = salaryFor(s, content, c.clubId);
      s = { ...s, football: { ...s.football!, contract: { ...c, years: rng.int(1, 3), salary } } };
      s = appendLog(s, `O ${clubDef(content, c.clubId)?.name} renovou seu contrato (R$ ${salary.toLocaleString('pt-BR')}/ano).`);
    } else {
      s = { ...s, football: { ...s.football!, contract: null } };
      s = appendLog(s, 'Seu contrato acabou e o clube não renovou. Você está sem clube.');
    }
  }
  // promoção e rebaixamento de todos os clubes nacionais
  s = { ...s, football: { ...s.football!, divisions: promotions(s, content) } };
  // aposentadoria forçada
  if (age >= 40 || (age >= 33 && o(s) < 40)) {
    s = retireFootball(s);
    return s;
  }
  return { ...s, football: { ...s.football!, offers: makeOffers(s, rng, content, season) } };
}

export function footballSeasonSummary(state: GameState): FootballSeason | undefined {
  return state.football?.history.at(-1);
}
