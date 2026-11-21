/** Energia base por idade (antes do modificador de saúde). */
export function baseEnergyForAge(age: number): number {
  if (age <= 2) return 0;
  if (age <= 5) return 3;
  if (age <= 12) return 5;
  if (age <= 17) return 6;
  if (age <= 49) return 7;
  if (age <= 64) return 6;
  return 4;
}

export function healthEnergyModifier(health: number): number {
  if (health < 25) return -2;
  if (health < 50) return -1;
  if (health >= 85) return 1;
  return 0;
}

/** Energia máxima do ano. Bebês (0–2) sempre têm 0. */
export function maxEnergy(age: number, health: number): number {
  const base = baseEnergyForAge(age);
  if (base === 0) return 0;
  return Math.max(0, base + healthEnergyModifier(health));
}
