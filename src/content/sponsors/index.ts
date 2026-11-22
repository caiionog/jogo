import type { SponsorDef } from '../../engine';

/** Patrocinadores fictícios: reputação mínima, valor anual (R$), duração e cláusulas. */
export const SPONSORS: readonly SponsorDef[] = [
  { id: 'kimono_raiz', brand: 'Kimonos Raiz', minReputation: 15, amount: 6000, years: 2, maxLossStreak: 3, scandal: false },
  { id: 'suple_tita', brand: 'Suplementos Titânio', minReputation: 25, amount: 15000, years: 2, maxLossStreak: 3, scandal: true },
  { id: 'energetico_choque', brand: 'Energético Choque', minReputation: 40, amount: 40000, years: 2, maxLossStreak: 2, scandal: true },
  { id: 'banco_aurora', brand: 'Banco Aurora', minReputation: 55, amount: 90000, years: 3, maxLossStreak: 3, scandal: true },
  { id: 'relogios_cronos', brand: 'Relógios Cronos', minReputation: 70, amount: 180000, years: 3, maxLossStreak: 2, scandal: true },
  { id: 'montadora_horizonte', brand: 'Montadora Horizonte', minReputation: 85, amount: 350000, years: 3, maxLossStreak: 2, scandal: true },
];
