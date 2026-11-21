export type LifeStage = 'bebe' | 'crianca' | 'adolescente' | 'adulto' | 'idoso';

export function lifeStage(age: number): LifeStage {
  if (age <= 2) return 'bebe';
  if (age <= 12) return 'crianca';
  if (age <= 17) return 'adolescente';
  if (age <= 64) return 'adulto';
  return 'idoso';
}

export const LIFE_STAGE_LABEL: Record<LifeStage, string> = {
  bebe: 'Bebê',
  crianca: 'Criança',
  adolescente: 'Adolescente',
  adulto: 'Adulto',
  idoso: 'Idoso',
};
