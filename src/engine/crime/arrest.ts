/**
 * Ser pego (release 0.0.2). Menores de 18: medida socioeducativa fictícia e simplificada (advertência, serviço
 * comunitário ou internação curta no Centro Socioeducativo), registrada só na ficha juvenil. Adultos: passagem na
 * ficha criminal; o processo e a sentença ficam com a justiça (fase 6).
 */
import { openCase } from './justice';
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { changeAffection, relationsOf } from '../relationships/people';
import type { RecordEntry } from './types';

export type ArrestSource = 'flagrante' | 'investigacao' | 'evento';

const g = (s: GameState, m: string, f: string) => (s.character.sex === 'M' ? m : f);

function parentsUpset(state: GameState, delta: number): GameState {
  let s = state;
  for (const { person } of relationsOf(state, ['pai', 'mae'])) s = changeAffection(s, person.id, delta, 'Ficou sabendo da sua passagem pela polícia');
  return s;
}

/** Medida socioeducativa (12–17). */
export function juvenileMeasure(state: GameState, crimeId: string, rng: Rng, content: GameContent): GameState {
  const entry: RecordEntry = { age: state.character.age, year: state.year, crime: crimeId, kind: 'passagem' };
  let s: GameState = { ...state, crime: { ...state.crime, juvenile: [...state.crime.juvenile, entry], wanted: 0 } };
  s = parentsUpset(s, -6);
  const n = s.crime.juvenile.length;
  const roll = rng.next();
  if (n >= 3 && roll < 0.5) {
    s = { ...s, flags: { ...s.flags, internacao_ano: s.year }, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -10 }) } };
    return appendLog(s, `Pela reincidência, o juiz da infância determinou uma internação curta no ${content.crime.places.juvenile}. Você continua estudando lá dentro.`);
  }
  if (roll < 0.6 && n < 3) return appendLog(s, `Você foi levad${g(s, 'o', 'a')} à delegacia e liberad${g(s, 'o', 'a')} com uma advertência, na frente dos seus responsáveis.`);
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -3 }) } };
  return appendLog(s, 'O juiz da infância determinou serviço comunitário: seis meses ajudando numa creche aos sábados.');
}

/** Ser pego. Menores → medida socioeducativa; adultos → passagem na ficha (o processo é da fase 6). */
export function arrest(state: GameState, crimeId: string, rng: Rng, content: GameContent, source: ArrestSource): GameState {
  if (state.character.age < 18) return juvenileMeasure(state, crimeId, rng, content);
  const entry: RecordEntry = { age: state.character.age, year: state.year, crime: crimeId, kind: 'passagem' };
  let s: GameState = { ...state, crime: { ...state.crime, record: [...state.crime.record, entry], wanted: Math.max(0, state.crime.wanted - 30) }, feats: { ...state.feats, arrested: (state.feats.arrested ?? 0) + 1 } };
  s = parentsUpset(s, -8);
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -6 }) } };
  const how = source === 'investigacao' ? 'A polícia chegou à sua porta com um mandado.' : 'Você foi pres' + g(s, 'o', 'a') + ' em flagrante.';
  s = appendLog(s, `${how} Você foi levad${g(s, 'o', 'a')} para a delegacia.`);
  // processo (fase 6): delegacia → defesa → julgamento
  return openCase(s, crimeId, content);
}
