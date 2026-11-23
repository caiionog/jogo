/**
 * Vida na prisão (release 0.0.2, fase 7). Enquanto preso em regime fechado ou semiaberto, as ações comuns dão lugar
 * às da prisão: trabalhar e estudar (remição de 0,25 ano cada, uma vez por ano), treinar no pátio (até 4 vezes),
 * conversar com detentos, receber visita (o afeto pesa) e ficar fora de confusão. Nada de violência sexual, nem
 * como insinuação. Fugir é muito arriscado e, se falhar, aumenta a pena.
 */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { luckFactor } from '../character/talents';
import { addRelation, createPerson, relationsOf } from '../relationships/people';
import { clamp100 } from './crimes';
import type { PrisonState } from './types';

export type PrisonAction = 'trabalhar' | 'estudar' | 'treinar' | 'conversar' | 'visita' | 'quieto';
export const PRISON_TRAIN_LIMIT = 4;
export const REMISSION_PER_ACTIVITY = 0.25;

/** Preso "de verdade" (o regime aberto vive quase normalmente). */
export function behindBars(state: GameState): boolean {
  return !!state.prison && state.prison.regime !== 'aberto';
}

const used = (s: GameState, a: PrisonAction) => s.yearUses[`prisao:${a}`] ?? 0;

export type PrisonActionBlock = 'busy' | 'free' | 'done';

export function prisonActionBlock(state: GameState, a: PrisonAction): PrisonActionBlock | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (!behindBars(state)) return 'free';
  const limit = a === 'treinar' ? PRISON_TRAIN_LIMIT : 1;
  return used(state, a) >= limit ? 'done' : null;
}

function patchPrison(s: GameState, fn: (p: PrisonState) => PrisonState): GameState {
  return s.prison ? { ...s, prison: fn(s.prison) } : s;
}

const stat = (s: GameState, d: Parameters<typeof addStats>[1]): GameState => ({ ...s, character: { ...s.character, stats: addStats(s.character.stats, d) } });

export function prisonAction(state: GameState, a: PrisonAction, content: GameContent): GameState {
  if (prisonActionBlock(state, a) !== null) return state;
  const rng = createRng(state.rngState);
  let s: GameState = { ...state, yearUses: { ...state.yearUses, [`prisao:${a}`]: used(state, a) + 1 } };
  switch (a) {
    case 'trabalhar':
      s = patchPrison(s, (p) => ({ ...p, remission: p.remission + REMISSION_PER_ACTIVITY, behavior: clamp100(p.behavior + 4) }));
      s = appendLog(stat(s, { athletic: 1, happiness: 1 }), 'Você trabalhou na oficina da unidade. Cada dia trabalhado desconta da pena.');
      break;
    case 'estudar':
      s = patchPrison(s, (p) => ({ ...p, remission: p.remission + REMISSION_PER_ACTIVITY, behavior: clamp100(p.behavior + 4) }));
      s = appendLog(stat(s, { intelligence: 2 }), s.education.graduated ? 'Você fez um curso a distância pela biblioteca da unidade. Estudo também desconta da pena.' : 'Você estudou no supletivo da unidade. Estudo também desconta da pena.');
      break;
    case 'treinar': {
      const n = used(s, 'treinar');
      // pátio: até 4 sessões no ano; a 1ª rende mais
      const gain = n <= 2 ? rng.int(1, 2) : rng.int(0, 1);
      s = appendLog(stat(s, { athletic: gain, happiness: 1 }), 'Você treinou no pátio com o que tinha: barra, flexões e corrida em volta da quadra.');
      break;
    }
    case 'conversar': {
      const [s2, p] = createPerson(s, rng, content, { age: rng.int(20, 50), sex: s.character.sex, flags: { detento: true } });
      s = addRelation(s2, p.id, 'conhecido', rng.int(35, 60), { history: ['Conheceram-se na prisão'] });
      s = appendLog(stat(s, { happiness: 2 }), `Você puxou conversa com ${p.name.split(' ')[0]}, que cumpre pena na mesma ala.`);
      if (rng.chance(0.25)) s = { ...s, crime: { ...s.crime, rep: clamp100(s.crime.rep + 2) } };
      break;
    }
    case 'visita': {
      const close = relationsOf(s, ['mae', 'pai', 'conjuge', 'parceiro', 'filho', 'irmao']).filter((r) => r.person.age >= 12);
      const best = close.sort((x, y) => y.rel.affection - x.rel.affection)[0];
      if (best && rng.chance(Math.min(0.95, best.rel.affection / 80))) {
        s = appendLog(stat(s, { happiness: 6 }), `${best.person.name.split(' ')[0]} veio te visitar no dia de visita. A hora passou rápido demais.`);
        s = patchPrison(s, (p) => ({ ...p, behavior: clamp100(p.behavior + 3) }));
      } else s = appendLog(stat(s, { happiness: -4 }), 'Dia de visita. Você ficou esperando no pátio, mas ninguém veio.');
      break;
    }
    case 'quieto':
      s = patchPrison(s, (p) => ({ ...p, behavior: clamp100(p.behavior + 8) }));
      s = appendLog(s, 'Você manteve a cabeça baixa e ficou longe de confusão.');
      break;
  }
  return { ...s, rngState: rng.state };
}

/** Chance de fuga dar certo (baixa): atlética e sorte (limitada). */
export function escapeChance(state: GameState): number {
  return Math.max(0.05, Math.min(0.3, 0.1 + (state.character.stats.athletic - 50) / 500 + luckFactor(state) * 0.03));
}

/** Tentativa de fuga: sucesso vira foragido (procurado alto); falha aumenta a pena e volta ao fechado. */
export function attemptEscape(state: GameState, rng: Rng, content: GameContent): GameState {
  const p = state.prison;
  if (!p) return state;
  if (rng.chance(escapeChance(state))) {
    const s: GameState = { ...state, prison: null, crime: { ...state.crime, wanted: 90 }, flags: { ...state.flags, foragido: true } };
    return appendLog(s, 'A fuga deu certo. Agora você é foragid' + (s.character.sex === 'M' ? 'o' : 'a') + ' e qualquer blitz pode ser o fim.');
  }
  const [lo, hi] = content.crime.sentences.fuga ?? [1, 3];
  const extra = rng.int(lo, hi);
  const s = patchPrison(state, (x) => ({ ...x, sentence: x.sentence + extra, behavior: clamp100(x.behavior - 35), regime: 'fechado', facility: x.wing === 'especial' ? content.crime.facilities.especial : content.crime.facilities.fechado }));
  return appendLog({ ...s, crime: { ...s.crime, record: [...s.crime.record, { age: s.character.age, year: s.year, crime: 'fuga', kind: 'condenacao', years: extra }] } }, `A fuga falhou. Você voltou para o regime fechado com mais ${extra} ${extra === 1 ? 'ano' : 'anos'} de pena.`);
}

/** Anos que faltam (para o banner). */
export function yearsLeft(p: PrisonState): number {
  return Math.max(0, Math.ceil(p.sentence - p.served - p.remission));
}
