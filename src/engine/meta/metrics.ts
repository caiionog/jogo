import { bjjRank } from '../fighting/belts';
/**
 * Registro de métricas das conquistas (Etapa 6). Cada métrica é uma função pura do estado da vida e do
 * armazenamento meta. As conquistas (conteúdo) só referenciam o id e o limite (`min`/`max`).
 */
import type { GameState } from '../core/state';
import { netWorth } from '../economy/worth';
import { relationsOf } from '../relationships/people';
import type { MetaState } from './types';

type Metric = (s: GameState, meta: MetaState) => number;

const b = (x: boolean) => (x ? 1 : 0);
const wins = (s: GameState, k: 'KO' | 'SUB') => s.fighter.pro.winsBy[k] + s.fighter.amateur.winsBy[k];

export const METRICS: Record<string, Metric> = {
  // luta
  anyWin: (s) => s.fighter.amateur.wins + s.fighter.pro.wins + s.fighter.bjj.wins,
  proWins: (s) => s.fighter.pro.wins,
  proFights: (s) => s.fighter.pro.wins + s.fighter.pro.losses + s.fighter.pro.draws,
  subWins: (s) => wins(s, 'SUB'),
  koWins: (s) => wins(s, 'KO'),
  bjjWins: (s) => s.fighter.bjj.wins,
  belt: (s) => bjjRank(s),
  regionalTitles: (s) => s.feats.regionalTitles ?? 0,
  majorTitles: (s) => s.feats.majorTitles ?? 0,
  titleDefenses: (s) => s.feats.titleDefenses ?? 0,
  maxUnbeaten: (s) => s.feats.maxUnbeaten ?? 0,
  koRival: (s) => s.feats.koRival ?? 0,
  reputation: (s) => s.fighter.reputation,
  oldestFightAge: (s) => s.feats.oldestFightAge ?? 0,
  undefeatedRetired: (s) => b(!!s.fighter.retired && s.fighter.pro.losses === 0 && s.fighter.pro.wins >= 5),
  // carreira e saúde
  comebacks: (s) => s.feats.comebacks ?? 0,
  farewellWin: (s) => s.feats.farewellWin ?? 0,
  surgeries: (s) => s.feats.surgeries ?? 0,
  injuries: (s) => s.health.history.length,
  sequelae: (s) => s.health.sequelae.length,
  retiredHealthy: (s) => s.feats.retiredHealthy ?? 0,
  forcedRetirements: (s) => s.feats.forcedRetirements ?? 0,
  contractCuts: (s) => s.feats.contractCuts ?? 0,
  age: (s) => s.character.age,
  healthyOld: (s) => b(s.character.age >= 80 && s.character.stats.health >= 60),
  // escola e vida
  graduated: (s) => b(s.education.graduated),
  expelledGraduated: (s) => b(!!s.flags.expulso && s.education.graduated),
  schoolMedal: (s) => b(!!s.flags.medalha_interescolar),
  repeated: (s) => b(!!s.flags.repetente),
  happiness: (s) => s.character.stats.happiness,
  // relações
  firstKiss: (s) => b(!!s.flags.primeiro_beijo),
  married: (s) => b(!!s.flags.casado || relationsOf(s, ['conjuge']).length > 0),
  marriedNeverDivorced: (s) => b((!!s.flags.casado || relationsOf(s, ['conjuge'], false).length > 0) && !s.flags.divorciado),
  divorced: (s) => b(!!s.flags.divorciado),
  children: (s) => relationsOf(s, ['filho'], false).length,
  friends: (s) => relationsOf(s, ['amigo', 'colega_treino']).length,
  // economia
  netWorth: (s) => netWorth(s),
  millionaireYoung: (s) => b(s.character.age <= 30 && netWorth(s) >= 1_000_000),
  ownHome: (s) => b(s.economy.assets.some((a) => a.kind === 'imovel' && a.home)),
  properties: (s) => s.economy.assets.filter((a) => a.kind === 'imovel').length,
  businessesOpened: (s) => s.feats.businessesOpened ?? 0,
  gymOwner: (s) => b(s.economy.businesses.some((x) => x.defId === 'academia')),
  bankruptcyRecovered: (s) => b(Number(s.flags.falencia ?? 0) > 0 && netWorth(s) >= 200_000),
  sponsors: (s) => s.economy.sponsors.length,
  luxury: (s) => b(s.economy.standard === 'luxo'),
  tvCommentator: (s) => b(s.economy.job?.jobId === 'comentarista'),
  // legado
  generation: (s) => s.dynasty.generation,
  fighterGenerations: (s) => s.dynasty.members.filter((m) => m.record !== '0-0-0' || m.belt > 0).length + b(s.fighter.pro.wins + s.fighter.amateur.wins > 0),
  heirChampion: (s) => b(s.dynasty.generation >= 2 && (s.feats.majorTitles ?? 0) + (s.feats.regionalTitles ?? 0) > 0),
  heirMajorChampion: (s) => b(s.dynasty.generation >= 2 && (s.feats.majorTitles ?? 0) > 0 && (s.dynasty.members.at(-1)?.titles.includes('Circuito Titã') ?? false)),
  inheritedGym: (s) => b(!!s.flags.academia_herdada),
  willMade: (s) => b(!!s.economy.will),
  lifeScore: (s) => s.ending?.score ?? 0,
  // meta (entre vidas)
  lives: (_s, m) => m.stats.lives,
  hallSize: (_s, m) => m.hallOfFame.length,
};

export function metricValue(id: string, state: GameState, meta: MetaState): number {
  const fn = METRICS[id];
  return fn ? fn(state, meta) : 0;
}
