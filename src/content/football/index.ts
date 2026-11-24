import type { FootballContent } from '../../engine';
import { COMPETITIONS, DIVISION_A, DIVISION_B, DIVISION_C, DIVISION_D, FOREIGN_LEAGUES } from './clubs';

export const FOOTBALL: FootballContent = {
  clubs: [...DIVISION_A, ...DIVISION_B, ...DIVISION_C, ...DIVISION_D],
  leagues: FOREIGN_LEAGUES,
  competitions: COMPETITIONS,
  // salário anual médio (R$) por divisão; o desempenho e a reputação multiplicam
  salaryByDivision: { A: 480_000, B: 140_000, C: 48_000, D: 22_000 },
};
