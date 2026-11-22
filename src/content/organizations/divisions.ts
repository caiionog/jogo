import type { DivisionDef } from '../../engine';

/** Categorias de peso (limite em kg). */
export const DIVISIONS: readonly DivisionDef[] = [
  { id: 'm_mosca', label: 'Peso-mosca', limitKg: 57, sex: 'M' },
  { id: 'm_galo', label: 'Peso-galo', limitKg: 61, sex: 'M' },
  { id: 'm_pena', label: 'Peso-pena', limitKg: 66, sex: 'M' },
  { id: 'm_leve', label: 'Peso-leve', limitKg: 70, sex: 'M' },
  { id: 'm_meiomedio', label: 'Peso meio-médio', limitKg: 77, sex: 'M' },
  { id: 'm_medio', label: 'Peso-médio', limitKg: 84, sex: 'M' },
  { id: 'm_meiopesado', label: 'Peso meio-pesado', limitKg: 93, sex: 'M' },
  { id: 'm_pesado', label: 'Peso-pesado', limitKg: 120, sex: 'M' },
  { id: 'f_palha', label: 'Peso-palha', limitKg: 52, sex: 'F' },
  { id: 'f_mosca', label: 'Peso-mosca', limitKg: 57, sex: 'F' },
  { id: 'f_galo', label: 'Peso-galo', limitKg: 61, sex: 'F' },
  { id: 'f_pena', label: 'Peso-pena', limitKg: 66, sex: 'F' },
];
