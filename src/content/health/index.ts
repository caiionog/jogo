import type { ConditionDef, HealthContent } from '../../engine';
import { INJURY_CATALOG, LEGACY_INJURY_NAMES, SEQUELAE } from '../injuries';

/** Doenças da velhice/crônicas (Etapa 6). Chance anual base × idade × fatores de risco. */
export const CONDITIONS: readonly ConditionDef[] = [
  { id: 'hipertensao', name: 'hipertensão', minAge: 35, baseChance: 0.004, healthPerYear: 1, deathMult: 1.2, treatmentCost: 1200, risk: { lowStandard: 0.3, lowFitness: 0.4 }, deathCause: 'complicações da hipertensão' },
  { id: 'diabetes', name: 'diabetes tipo 2', minAge: 40, baseChance: 0.003, healthPerYear: 1, deathMult: 1.25, treatmentCost: 2400, risk: { lowStandard: 0.4, lowFitness: 0.5 }, deathCause: 'complicações do diabetes' },
  { id: 'cardiopatia', name: 'doença cardíaca', minAge: 45, baseChance: 0.002, healthPerYear: 2, deathMult: 1.6, treatmentCost: 4000, risk: { lowStandard: 0.3, lowFitness: 0.5 }, deathCause: 'um ataque cardíaco' },
  { id: 'artrose', name: 'artrose', minAge: 45, baseChance: 0.003, healthPerYear: 1, deathMult: 1.02, treatmentCost: 1500, risk: { injuries: 0.25 }, deathCause: 'complicações de saúde' },
  { id: 'cancer', name: 'câncer', minAge: 40, baseChance: 0.0015, healthPerYear: 4, deathMult: 2.2, treatmentCost: 12000, risk: { lowStandard: 0.2 }, deathCause: 'câncer' },
  { id: 'neuro', name: 'doença neurodegenerativa (ligada a pancadas na cabeça)', minAge: 50, baseChance: 0.0006, healthPerYear: 3, deathMult: 1.6, treatmentCost: 6000, risk: { brainDamage: 10 }, deathCause: 'complicações neurológicas' },
];

export const HEALTH_CONTENT: HealthContent = {
  injuries: INJURY_CATALOG,
  sequelae: SEQUELAE,
  conditions: CONDITIONS,
  actionCosts: { checkup: 800, gym: 1800, diet: 1500 },
  diagnosisEventId: 'health_diagnosis',
  legacyNames: LEGACY_INJURY_NAMES,
};
