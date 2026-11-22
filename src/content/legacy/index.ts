import type { LegacyContent } from '../../engine';

/** Regras de herança e bônus de legado (Etapa 6). */
export const LEGACY_CONTENT: LegacyContent = {
  defaultSplit: { spouseWithChildren: 0.5 },
  inheritanceTax: 0.04,
  famousRepDivisor: 4,
  famousRepMax: 25,
  gymBonusPerGen: 0.05,
  gymBonusMax: 0.2,
};
