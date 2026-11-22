/**
 * Geografia (Etapa 7): o jogo se passa só no Brasil. UFs, cidades e a distribuição de cor ou raça do Censo 2022
 * são dados de conteúdo (`content.geo`). Cor ou raça é só demografia e aparência: nunca entra em mecânica.
 */
export const RACES = ['branca', 'preta', 'parda', 'amarela', 'indigena'] as const;
export type Race = (typeof RACES)[number];
export const RACE_LABEL: Record<Race, string> = { branca: 'Branca', preta: 'Preta', parda: 'Parda', amarela: 'Amarela', indigena: 'Indígena' };

export const REGIOES = ['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste'] as const;
export type Regiao = (typeof REGIOES)[number];

export interface CityDef {
  name: string;
  /** População (Censo 2022) — peso no sorteio do nascimento. */
  populacao: number;
  /** Multiplicador de custo de vida DO JOGO (salários, aluguel, compras). */
  custo: number;
}

export interface UfDef {
  sigla: string;
  nome: string;
  regiao: Regiao;
  /** População residente (Censo 2022) — peso no sorteio da UF. */
  populacao: number;
  capital: string;
  cities: readonly CityDef[];
  /** Percentuais de cor ou raça (Censo 2022), somando 100. */
  corRaca: Readonly<Record<Race, number>>;
}

export interface GeoContent {
  ufs: readonly UfDef[];
}
