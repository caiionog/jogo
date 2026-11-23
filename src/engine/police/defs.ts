/** Consultas puras sobre a carreira policial (sem RNG): trilha, posto, salário e pistas em palavras. */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { cityMultOf } from '../geo';
import type { PoliceCareer, PoliceTrackDef, PoliceTrackId, SpecialUnitDef } from './types';

/** Salário mínimo de referência do conteúdo de empregos (×13 por ano). */
const ANNUAL = 13;

export function trackDef(content: GameContent, id: PoliceTrackId | string | undefined): PoliceTrackDef | undefined {
  return id ? content.police.tracks.find((t) => t.id === id) : undefined;
}

export function specialDef(content: GameContent, force: 'pm' | 'civil'): SpecialUnitDef | undefined {
  return content.police.special.find((u) => u.force === force);
}

/** Título do posto, no gênero do personagem. */
export function rankTitle(state: GameState, content: GameContent, career: PoliceCareer | null = state.police.career): string {
  if (!career) return '';
  const r = trackDef(content, career.track)?.ranks[career.rank];
  if (!r) return '';
  return state.character.sex === 'F' && r.titleF ? r.titleF : r.title;
}

/** Salário anual (R$) do posto: formação paga 70% (bolsa); a força especial, o bônus da unidade. */
export function policeSalary(state: GameState, content: GameContent): number {
  const c = state.police.career;
  const r = c ? trackDef(content, c.track)?.ranks[c.rank] : undefined;
  if (!c || !r) return 0;
  const stage = c.stage === 'formacao' ? 0.7 : 1;
  const special = c.unit === 'especial' ? 1 + (specialDef(content, c.force)?.salaryBonus ?? 0) : 1;
  return Math.round(r.salaryMW * content.police.minimumWage * ANNUAL * cityMultOf(state, content) * stage * special);
}

/** Pista do Tiro (oculto). */
export function shootingHint(v: number): string {
  if (v < 15) return 'nunca atirou de verdade';
  if (v < 35) return 'mira insegura';
  if (v < 55) return 'mira razoável';
  if (v < 75) return 'boa mira';
  return 'mira de atirador de elite';
}

/** Avaliação em palavras (mérito e corregedoria), para a tela central. */
export function policeAssessment(state: GameState): string {
  const c = state.police.career;
  if (!c) return '';
  const a = state.character.sex === 'F' ? 'a' : 'o';
  if (c.corregedoria >= 2) return 'Na mira da corregedoria';
  if (c.stage === 'formacao') return `Alun${a} da academia`;
  if (c.merit < 15) return `Noviç${a} na tropa`;
  if (c.merit < 40) return 'Confiável';
  if (c.merit < 70) return `Respeitad${a} na tropa`;
  return 'Referência na corporação';
}

/** Próximo posto e o que falta (anos e mérito), para o cartão "Próximo passo". */
export function nextRankGap(state: GameState, content: GameContent): { title: string; years: number; merit: boolean } | null {
  const c = state.police.career;
  const def = c ? trackDef(content, c.track) : undefined;
  const next = def?.ranks[c!.rank + 1];
  if (!c || !def || !next) return null;
  const title = state.character.sex === 'F' && next.titleF ? next.titleF : next.title;
  return { title, years: Math.max(0, next.minYears - c.rankYears), merit: c.merit < next.minMerit };
}
