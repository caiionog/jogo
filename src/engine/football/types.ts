/** Futebol (release 0.0.4, fase 6). Tudo JSON puro. As habilidades são ocultas (a UI só mostra pistas). */

export type FootballDivision = 'A' | 'B' | 'C' | 'D';
export type FootballPosition = 'GOL' | 'ZAG' | 'LAT' | 'VOL' | 'MEI' | 'ATA';
export type FootballSkill = 'finishing' | 'passing' | 'defending' | 'goalkeeping' | 'pace';

export interface FootballClubDef {
  id: string;
  name: string;
  city: string;
  /** UF do clube ('' = cidade fictícia do interior ou exterior). */
  uf: string;
  colors: [string, string];
  colorNames: string;
  mascot: string;
  /** Divisão inicial ('X' = liga estrangeira). */
  division: FootballDivision | 'X';
  /** Força base do elenco (0–100). */
  power: number;
}

export interface FootballLeagueDef {
  id: string;
  name: string;
  region: string;
  /** Multiplicador de salário em relação à Divisão A. */
  salaryMult: number;
  clubs: FootballClubDef[];
}

export interface FootballContent {
  clubs: readonly FootballClubDef[];
  leagues: readonly FootballLeagueDef[];
  competitions: Record<'nacional' | 'copa' | 'continental' | 'premio' | 'selecao' | 'estadual', string>;
  /** Salário anual (R$) por divisão no nível médio, antes do desempenho. */
  salaryByDivision: Record<FootballDivision, number>;
}

export interface FootballContract {
  clubId: string;
  years: number;
  /** Salário anual (R$). */
  salary: number;
}

export interface FootballOffer {
  clubId: string;
  years: number;
  salary: number;
  /** Ano em que a proposta vence (some na virada). */
  year: number;
}

export interface FootballSeason {
  year: number;
  age: number;
  clubId: string;
  /** Divisão no ano ('X' = exterior). */
  division: FootballDivision | 'X';
  apps: number;
  goals: number;
  assists: number;
  /** Nota média 0–10 (uma casa decimal). */
  rating: number;
  /** Posição do clube na tabela. */
  place: number;
  titles: string[];
}

export interface FootballState {
  stage: 'base' | 'pro' | 'aposentado';
  position: FootballPosition;
  /** Ocultas, 0–100. */
  skills: Record<FootballSkill, number>;
  /** Teto oculto de desenvolvimento (0–100). */
  potential: number;
  /** Prestígio dentro do futebol (0–100). Alimenta a fama pública. */
  reputation: number;
  /** Clube da base ou do contrato profissional. */
  clubId: string;
  contract: FootballContract | null;
  offers: FootballOffer[];
  history: FootballSeason[];
  titles: string[];
  caps: number;
  /** Divisão atual de cada clube nacional (promoção e rebaixamento). */
  divisions: Record<string, FootballDivision>;
}
