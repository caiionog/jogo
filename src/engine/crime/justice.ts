/**
 * Justiça (release 0.0.2, fase 6): flagrante/investigação → delegacia → defesa (defensor público, advogado
 * particular — um amigo advogado ajuda — ou a própria defesa de quem é advogado) → fiança/responder em liberdade →
 * julgamento → sentença por faixa (fictícia) com agravantes e atenuantes → regime. Durante a pena: progressão a
 * cada 1/4 com bom comportamento, livramento condicional na metade e remição (trabalho/estudo).
 * A ficha criminal é permanente (`record`).
 */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { luckFactor } from '../character/talents';
import { post } from '../economy/ledger';
import { leavePolice } from '../police/career';
import { relationsOf } from '../relationships/people';
import { hasConviction } from './record';
import type { CrimeCase, PrisonState } from './types';

const g = (s: GameState, m: string, f: string) => (s.character.sex === 'M' ? m : f);

/** Abre o processo e chama o evento da delegacia (adultos). */
export function openCase(state: GameState, crimeId: string, content: GameContent): GameState {
  if (state.crime.case) return state;
  const c: CrimeCase = { crimeId, year: state.year, confessed: false, lawyer: null, quality: 20, free: false, ...(state.police.career ? { wasPolice: true } : {}) };
  return { ...state, crime: { ...state.crime, case: c }, pendingEvents: [...state.pendingEvents, { eventId: content.crime.justiceEvents.station, source: 'followUp' }] };
}

export type Plea = 'confessar' | 'silencio' | 'negar';
export type LawyerChoice = 'publico' | 'particular';

const patchCase = (s: GameState, fn: (c: CrimeCase) => CrimeCase): GameState => (s.crime.case ? { ...s, crime: { ...s.crime, case: fn(s.crime.case) } } : s);

export function setPlea(state: GameState, plea: Plea): GameState {
  return patchCase(state, (c) => ({ ...c, confessed: plea === 'confessar', quality: c.quality + (plea === 'silencio' ? 5 : plea === 'negar' ? 0 : -5) }));
}

/** Penas faixa de anos do delito. */
export function sentenceRange(content: GameContent, crimeId: string): [number, number] {
  return content.crime.sentences[crimeId] ?? [1, 4];
}

export function bailAmount(state: GameState, content: GameContent, crimeId: string): number {
  const [, hi] = sentenceRange(content, crimeId);
  return Math.round(1500 + hi * 1200 + (state.economy.lastIncome ?? 0) * 0.05);
}

/** Defesa: defensor público (de graça, defesa média) ou particular (caro, melhor; amigo advogado cobra metade). */
export function chooseLawyer(state: GameState, choice: LawyerChoice, rng: Rng, content: GameContent): GameState {
  const c = state.crime.case;
  if (!c) return state;
  let s = state;
  let quality = c.quality;
  let lawyer: CrimeCase['lawyer'] = choice;
  const ownLawyer = s.economy.job?.jobId === 'advogado';
  if (choice === 'particular') {
    const friend = relationsOf(s, ['amigo', 'pai', 'mae', 'irmao', 'conjuge', 'parceiro', 'conhecido']).find((r) => /Advogad/i.test(r.person.job ?? ''));
    if (ownLawyer) {
      lawyer = 'proprio';
      quality += 30;
      s = appendLog(s, 'Você mesm' + g(s, 'o', 'a') + ' preparou sua defesa. Os anos de advocacia ajudaram.');
    } else {
      const [, hi] = sentenceRange(content, c.crimeId);
      const fee = Math.round((5000 + hi * 2500) * (friend ? 0.5 : 1));
      s = post(s, 'eventos', -fee, 'Advogado (processo criminal)');
      quality += 35 + rng.int(0, 15);
      s = appendLog(s, friend ? `${friend.person.name.split(' ')[0]}, que é advogad${friend.person.sex === 'M' ? 'o' : 'a'}, assumiu sua defesa por um preço camarada.` : 'Você contratou um advogado criminalista.');
    }
  } else {
    quality += rng.int(5, 20);
    s = appendLog(s, 'A Defensoria Pública ficou com o seu caso. O defensor tem muitos processos, mas fez o possível.');
  }
  s = patchCase(s, (x) => ({ ...x, lawyer, quality: Math.min(100, quality) }));
  // fiança: quando cabível e houver dinheiro, responde em liberdade (o julgamento fica para o ano seguinte)
  const bailable = content.crime.bailable.includes(c.crimeId);
  const bail = bailAmount(s, content, c.crimeId);
  const trial = content.crime.justiceEvents.trial;
  if (bailable && s.money >= bail) {
    s = post(s, 'multas', -bail, 'Fiança');
    s = patchCase(s, (x) => ({ ...x, free: true }));
    s = appendLog(s, `Você pagou fiança e vai responder ao processo em liberdade.`);
    return { ...s, scheduledEvents: [...s.scheduledEvents, { eventId: trial, dueAge: s.character.age + 1 }] };
  }
  if (bailable && rng.chance(0.4 + quality / 400)) {
    s = patchCase(s, (x) => ({ ...x, free: true }));
    s = appendLog(s, 'O juiz concedeu a liberdade provisória: você responde em liberdade.');
    return { ...s, scheduledEvents: [...s.scheduledEvents, { eventId: trial, dueAge: s.character.age + 1 }] };
  }
  s = appendLog(s, `Sem direito a responder em liberdade, você aguardou o julgamento no ${content.crime.facilities.provisorio}.`);
  return { ...s, pendingEvents: [...s.pendingEvents, { eventId: trial, source: 'followUp' }] };
}

export function regimeFor(years: number): PrisonState['regime'] {
  return years > 8 ? 'fechado' : years >= 4 ? 'semiaberto' : 'aberto';
}

/** Anos de pena (antes de arredondar): faixa + agravantes e atenuantes. Exportado para testes. */
export function computeSentence(state: GameState, c: CrimeCase, content: GameContent, roll: number): number {
  const [lo, hi] = sentenceRange(content, c.crimeId);
  let y = lo + (hi - lo) * roll;
  if (hasConviction(state)) y *= 1.5;
  if (state.crime.faction) y *= 1.25;
  y *= 1 - c.quality / 400;
  if (c.confessed) y *= 0.67;
  y *= 1 - luckFactor(state) * 0.1;
  return Math.max(0, Math.min(30, y));
}

/** Julgamento: absolvição ou condenação; pena ≤ 1 ano vira pena alternativa; acima, prisão no regime da pena. */
export function verdict(state: GameState, rng: Rng, content: GameContent): GameState {
  const c = state.crime.case;
  if (!c) return state;
  let s: GameState = { ...state, crime: { ...state.crime, case: null, wanted: 0 } };
  const acquit = c.confessed ? 0 : Math.max(0.05, Math.min(0.6, 0.12 + c.quality / 300 - (hasConviction(state) ? 0.08 : 0) + luckFactor(state) * 0.03));
  if (rng.chance(acquit)) {
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: 8 }) } };
    return appendLog(s, `Absolvid${g(s, 'o', 'a')}! Faltaram provas e o juiz encerrou o processo.`);
  }
  const years = Math.round(computeSentence(state, c, content, rng.next()));
  s = { ...s, crime: { ...s.crime, record: [...s.crime.record, { age: s.character.age, year: s.year, crime: c.crimeId, kind: 'condenacao', years }] }, feats: { ...s.feats, convictions: (s.feats.convictions ?? 0) + 1 } };
  if (years <= 1) {
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -4 }) } };
    return appendLog(s, `Condenad${g(s, 'o', 'a')}, mas com pena alternativa: um ano de serviço comunitário. A condenação fica na sua ficha.`);
  }
  return imprison(s, years, content, !!c.wasPolice);
}

/** Começa a cumprir a pena. Emprego perdido; policial é demitido e vai para a ala especial. */
export function imprison(state: GameState, years: number, content: GameContent, wasPolice = false): GameState {
  const regime = regimeFor(years);
  const wing: PrisonState['wing'] = wasPolice || !!state.police.career ? 'especial' : 'comum';
  let s = state;
  if (s.police.career) s = leavePolice(appendLog(s, `Você foi demitid${g(s, 'o', 'a')} da polícia.`), 'demissao', content);
  if (regime !== 'aberto' && s.economy.job) s = appendLog({ ...s, economy: { ...s.economy, job: null } }, 'Você perdeu o emprego.');
  const facility = wing === 'especial' && regime === 'fechado' ? content.crime.facilities.especial : content.crime.facilities[regime];
  const prison: PrisonState = { facility, regime, sentence: years, served: 0, remission: 0, behavior: 50, protection: !!s.crime.faction, wing, kind: 'adulto' };
  s = { ...s, prison, crime: { ...s.crime, trafficking: null, plan: null }, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -15 }) } };
  return appendLog(s, `Condenad${g(s, 'o', 'a')} a ${years} anos de prisão em regime ${regime}. Destino: ${facility}.`);
}

/** Pena cumprida (com remição). */
export function servedTotal(p: PrisonState): number {
  return p.served + p.remission;
}

/** Virada do ano preso: tempo cumprido, progressão de regime, livramento condicional e soltura. */
export function prisonYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const p = state.prison;
  if (!p) return state;
  let s = state;
  let next: PrisonState = { ...p, served: p.served + 1 };
  const done = servedTotal(next);
  if (done >= next.sentence) {
    s = { ...s, prison: null, flags: { ...s.flags, egresso: s.year } };
    return appendLog(s, `Pena cumprida. Você saiu d${next.facility.startsWith('Casa') || next.facility.startsWith('Colônia') ? 'a' : 'o'} ${next.facility}.`);
  }
  // livramento condicional na metade, com bom comportamento
  if (done >= next.sentence / 2 && next.behavior >= 60 && next.regime !== 'aberto' && rng.chance(0.6)) {
    s = { ...s, prison: null, flags: { ...s.flags, egresso: s.year, condicional: true } };
    return appendLog(s, 'Você ganhou o livramento condicional: vai cumprir o resto da pena em liberdade, com regras.');
  }
  // progressão a cada 1/4 da pena com bom comportamento
  if (next.regime !== 'aberto' && done >= (next.sentence / 4) * (next.regime === 'fechado' ? 1 : 2) && next.behavior >= 50) {
    const regime = next.regime === 'fechado' ? 'semiaberto' : 'aberto';
    next = { ...next, regime, facility: content.crime.facilities[regime] };
    s = appendLog(s, `Progressão de regime: você passou para o ${regime} (${next.facility}).`);
  }
  return { ...s, prison: next };
}
