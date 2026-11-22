/** Ranking por organização/categoria. Funções puras sobre Roster. */
import type { Roster } from './types';

/** 0 = campeão, 1..N = posição, null = sem ranking. */
export function rankOf(roster: Roster, id: string): number | null {
  if (roster.champion === id) return 0;
  const i = roster.ranking.indexOf(id);
  return i >= 0 ? i + 1 : null;
}

function moveTo(list: string[], id: string, index: number): string[] {
  const out = list.filter((x) => x !== id);
  out.splice(Math.min(Math.max(0, index), out.length), 0, id);
  return out;
}

/**
 * Atualiza o ranking após uma luta.
 * - Disputa de cinturão: vencedor vira campeão; ex-campeão vai para o #1. Se o campeão vence, o desafiante cai 2.
 * - Vencedor pior ranqueado (ou sem ranking) assume a posição do perdedor; o perdedor cai 2 posições.
 * - Vencedor melhor ranqueado sobe 1; o perdedor cai 2.
 * - Dois sem ranking: o vencedor entra na última posição.
 */
export function applyRankingResult(roster: Roster, winnerId: string, loserId: string, title: boolean, size: number): Roster {
  let ranking = roster.ranking.slice();
  let champion = roster.champion;

  if (title) {
    if (champion === winnerId) {
      const li = ranking.indexOf(loserId);
      if (li >= 0) ranking = moveTo(ranking, loserId, li + 2);
    } else {
      const old = champion;
      champion = winnerId;
      ranking = ranking.filter((x) => x !== winnerId);
      if (old && old === loserId) ranking = moveTo(ranking, old, 0);
      else if (old) ranking = moveTo(ranking, old, 0);
    }
    return { ...roster, champion, ranking: ranking.slice(0, size) };
  }

  if (winnerId === champion || loserId === champion) return roster; // campeão só arrisca o cinturão em disputa
  const wi = ranking.indexOf(winnerId);
  const li = ranking.indexOf(loserId);

  if (li >= 0 && (wi === -1 || wi > li)) {
    ranking = moveTo(ranking, winnerId, li); // perdedor fica em li+1
    ranking = moveTo(ranking, loserId, li + 2);
  } else if (wi >= 0) {
    ranking = moveTo(ranking, winnerId, wi - 1);
    if (li >= 0) ranking = moveTo(ranking, loserId, ranking.indexOf(loserId) + 2);
  } else {
    // dois sem ranking: o vencedor entra no fim (empurrando o último para fora se cheio)
    ranking = ranking.length >= size ? [...ranking.slice(0, size - 1), winnerId] : [...ranking, winnerId];
  }
  return { ...roster, ranking: ranking.slice(0, size) };
}

/** Remove um lutador do ranking (e do cinturão, que passa para o #1). */
export function removeFromRanking(roster: Roster, id: string): Roster {
  if (roster.champion === id) {
    const [first, ...rest] = roster.ranking;
    return { ...roster, champion: first ?? null, ranking: rest };
  }
  return { ...roster, ranking: roster.ranking.filter((x) => x !== id) };
}
