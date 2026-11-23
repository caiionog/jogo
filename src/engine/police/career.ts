/**
 * Carreira policial (release 0.0.2): academia (1 ano), estágio probatório (2 anos), efetivação, promoções por
 * tempo + mérito, ações do ano e saída (exoneração, pedido, aposentadoria). O emprego fica em `economy.job` (o
 * fechamento econômico paga o salário do posto); o estado da carreira fica em `police.career`.
 */
import { openCase } from '../crime/justice';
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { bumpUse, repeatMultiplier, scaleGain, sessionsLeft, useSessions } from '../lifeStages/sessions';
import { rankTitle, shootingHint, trackDef } from './defs';
import type { PoliceCareer, PoliceTrackDef } from './types';

const oa = (s: GameState) => (s.character.sex === 'M' ? 'o' : 'a');

function setCareer(s: GameState, career: PoliceCareer | null): GameState {
  return { ...s, police: { ...s.police, career } };
}

/** Ganho de Tiro com retorno decrescente (formação, estande). */
export function shootingGain(rng: Rng, current: number, base: number): number {
  return Math.round(base * Math.max(0.05, (100 - current) / 100) * (0.8 + rng.next() * 0.4) * 10) / 10;
}

/** Aprovado no concurso: entra na academia (ou no CFO, para o praça da PM). Assume o emprego policial. */
export function startAcademy(state: GameState, def: PoliceTrackDef, rng: Rng, content: GameContent): GameState {
  const prev = state.police.career;
  const jobId = content.police.jobIds[def.force];
  let s = state;
  if (s.economy.job && s.economy.job.jobId !== jobId) {
    const old = content.economy.jobs.find((j) => j.id === s.economy.job!.jobId);
    s = appendLog(s, `Você pediu demissão${old ? ` (${old.title.toLowerCase()})` : ''} para entrar na polícia.`);
  }
  const career: PoliceCareer = {
    force: def.force,
    track: def.id,
    rank: 0,
    stage: 'formacao',
    stageYears: 0,
    serviceYears: prev?.serviceYears ?? 0,
    rankYears: 0,
    merit: prev ? Math.round(prev.merit / 2) : 0,
    unit: 'regular',
    posting: rng.pick(def.postings),
    notable: prev?.notable ?? [],
    corregedoria: prev?.corregedoria ?? 0,
    specialTries: prev?.specialTries ?? 0,
    startAge: prev?.startAge ?? s.character.age,
  };
  s = setCareer(s, career);
  return { ...s, economy: { ...s.economy, job: { jobId, level: 1, performance: 50, years: s.economy.job?.jobId === jobId ? s.economy.job.years : 0 } } };
}

export type PoliceLeaveReason = 'exoneracao' | 'pedido' | 'demissao' | 'aposentadoria';

/** Sai da polícia: guarda o histórico e libera o emprego. */
export function leavePolice(state: GameState, reason: PoliceLeaveReason, content: GameContent): GameState {
  const c = state.police.career;
  if (!c) return state;
  const past = [...state.police.past, { force: c.force, track: c.track, rank: c.rank, until: state.character.age, reason }];
  const job = state.economy.job && Object.values(content.police.jobIds).includes(state.economy.job.jobId) ? null : state.economy.job;
  return { ...state, police: { ...state.police, career: null, case: null, past }, economy: { ...state.economy, job } };
}

export function addNotable(state: GameState, text: string): GameState {
  const c = state.police.career;
  if (!c) return state;
  return setCareer(state, { ...c, notable: [...c.notable, { age: state.character.age, text }].slice(-12) });
}

/** Virada do ano da carreira (depois do fechamento econômico). */
export function policeYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const c = state.police.career;
  const def = c ? trackDef(content, c.track) : undefined;
  if (!c || !def) return state;
  const o = oa(state);
  let s = state;
  let next: PoliceCareer = { ...c, stageYears: c.stageYears + 1 };

  if (c.stage === 'formacao') {
    // a academia ensina a atirar e puxa o físico
    const shooting = Math.min(100, s.police.shooting + shootingGain(rng, s.police.shooting, 22));
    s = { ...s, police: { ...s.police, shooting }, character: { ...s.character, stats: addStats(s.character.stats, { athletic: rng.int(1, 3) }) } };
    next = { ...next, stage: 'probatorio', stageYears: 0 };
    s = setCareer(s, next);
    return appendLog(s, `Você concluiu o ${def.course} e tomou posse como ${rankTitle(s, content).toLowerCase()} (${next.posting}).`);
  }

  next = { ...next, serviceYears: c.serviceYears + 1, rankYears: c.rankYears + 1, merit: c.merit + rng.int(2, 5) };
  if (c.stage === 'probatorio') {
    if (c.corregedoria >= 2) {
      s = appendLog(s, `Reprovad${o} no estágio probatório por causa dos processos na corregedoria. Você foi exonerad${o}.`);
      return leavePolice(s, 'exoneracao', content);
    }
    if (next.stageYears >= 2) {
      next = { ...next, stage: 'efetivo', stageYears: 0 };
      s = appendLog(s, `Fim do estágio probatório: você foi efetivad${o} na ${def.force === 'pm' ? 'Polícia Militar' : 'Polícia Civil'}.`);
    }
    return setCareer(s, next);
  }

  // corregedoria demais: prisão por corrupção (fase 8) — o processo leva à ala especial
  if (c.corregedoria >= 4 && rng.chance(0.35)) {
    s = setCareer(s, next);
    s = appendLog(s, `A corregedoria concluiu a investigação e pediu sua prisão por corrupção. Você foi pres${o} em casa.`);
    s = { ...s, crime: { ...s.crime, record: [...s.crime.record, { age: s.character.age, year: s.year, crime: 'corrupcao', kind: 'passagem' }] } };
    return openCase(s, 'corrupcao', content);
  }
  // efetivo: aposentadoria e promoção
  if (next.serviceYears >= 35 || s.character.age >= 65) {
    s = setCareer(s, next);
    s = appendLog(s, `Depois de ${next.serviceYears} anos de serviço, você se aposentou da polícia como ${rankTitle(s, content).toLowerCase()}.`);
    return leavePolice(s, 'aposentadoria', content);
  }
  const up = def.ranks[c.rank + 1];
  if (up && next.rankYears >= up.minYears && next.merit >= up.minMerit && c.corregedoria < 3) {
    const chance = Math.min(0.9, 0.55 + (next.merit - up.minMerit) / 100);
    if (rng.chance(chance)) {
      next = { ...next, rank: c.rank + 1, rankYears: 0 };
      s = setCareer(s, next);
      s = appendLog(s, `Promoção! Você agora é ${rankTitle(s, content).toLowerCase()}.`);
      return addNotable(s, `Promovid${o} a ${rankTitle(s, content).toLowerCase()}`);
    }
  }
  return setCareer(s, next);
}

// ---------------------------------------------------------------------------
// ações do ano (Ocupação → Polícia)
// ---------------------------------------------------------------------------

export type PoliceActionBlock = 'busy' | 'no-career' | 'academy' | 'tried' | 'no-sessions';

export function policeActionBlock(state: GameState, action: 'afinco' | 'curso' | 'estande' | 'transferencia' | 'exoneracao', content: GameContent): PoliceActionBlock | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight || state.prison) return 'busy';
  const c = state.police.career;
  if (!c) return 'no-career';
  if (action === 'estande') return sessionsLeft(state, content) < 1 ? 'no-sessions' : null;
  if (c.stage === 'formacao' && (action === 'afinco' || action === 'curso' || action === 'transferencia')) return 'academy';
  if (action === 'curso' && state.flags.curso_policial === state.year) return 'tried';
  if (action === 'transferencia' && state.flags.transferencia_pedida === state.year) return 'tried';
  return null;
}

/** Trabalhar com afinco: mérito (rende menos a cada repetição no ano) e um pouco de cansaço. */
export function policeWorkHard(state: GameState, content: GameContent): GameState {
  if (policeActionBlock(state, 'afinco', content)) return state;
  const rng = createRng(state.rngState);
  const c = state.police.career!;
  const gain = scaleGain(rng.int(3, 6), repeatMultiplier(state, 'policia:afinco', content));
  let s = setCareer(bumpUse(state, 'policia:afinco'), { ...c, merit: c.merit + gain });
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -1 }) } };
  return { ...appendLog(s, `Você trabalhou com afinco (${c.posting}). O comando notou.`), rngState: rng.state };
}

/** Curso de aperfeiçoamento: 1 por ano; mérito e inteligência. */
export function policeCourse(state: GameState, content: GameContent): GameState {
  if (policeActionBlock(state, 'curso', content)) return state;
  const rng = createRng(state.rngState);
  const c = state.police.career!;
  let s = setCareer(state, { ...c, merit: c.merit + 5 });
  s = { ...s, flags: { ...s.flags, curso_policial: s.year }, character: { ...s.character, stats: addStats(s.character.stats, { intelligence: 1 }) } };
  return { ...appendLog(s, `Você concluiu o ${rng.pick(content.police.courses)}.`), rngState: rng.state };
}

/** Treinar no estande: 1 sessão de treino; sobe o Tiro (oculto) e mostra uma pista. */
export function shootingRange(state: GameState, content: GameContent): GameState {
  if (policeActionBlock(state, 'estande', content)) return state;
  const rng = createRng(state.rngState);
  const shooting = Math.min(100, state.police.shooting + shootingGain(rng, state.police.shooting, 7));
  const s = { ...useSessions(state, 1), police: { ...state.police, shooting } };
  return { ...appendLog(s, `Você treinou no estande. O instrutor resumiu: ${shootingHint(shooting)}.`), rngState: rng.state };
}

/** Pedir transferência: nova lotação (1 pedido por ano; pode ser negado). */
export function requestTransfer(state: GameState, content: GameContent): GameState {
  if (policeActionBlock(state, 'transferencia', content)) return state;
  const rng = createRng(state.rngState);
  const c = state.police.career!;
  const def = trackDef(content, c.track)!;
  let s: GameState = { ...state, flags: { ...state.flags, transferencia_pedida: state.year } };
  const options = def.postings.filter((p) => p !== c.posting);
  if (!options.length || !rng.chance(0.6 + Math.min(0.3, c.merit / 200))) return { ...appendLog(s, 'Seu pedido de transferência foi negado.'), rngState: rng.state };
  const posting = rng.pick(options);
  s = setCareer(s, { ...c, posting });
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: 2 }) } };
  return { ...appendLog(s, `Transferência aprovada: agora você está lotad${oa(s)} em ${posting}.`), rngState: rng.state };
}

/** Pedir exoneração (sai da polícia). */
export function resignPolice(state: GameState, content: GameContent): GameState {
  if (policeActionBlock(state, 'exoneracao', content)) return state;
  const title = rankTitle(state, content).toLowerCase();
  return leavePolice(appendLog(state, `Você pediu exoneração e deixou a polícia (${title}).`), 'pedido', content);
}
