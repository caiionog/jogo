import type { BusinessDef } from '../../engine';

/** Empresas que o personagem pode abrir (valores anuais por nível, em R$). */
export const BUSINESSES: readonly BusinessDef[] = [
  { id: 'academia', name: 'Academia própria', startCost: 150000, revenue: 130000, cost: 105000, managerCost: 30000, combat: true },
  { id: 'suplementos', name: 'Loja de suplementos Força Total', startCost: 80000, revenue: 95000, cost: 78000, managerCost: 22000 },
  { id: 'roupa', name: 'Marca de roupa de luta Guerreiro', startCost: 120000, revenue: 120000, cost: 96000, managerCost: 28000 },
  { id: 'restaurante', name: 'Restaurante Prato Cheio', startCost: 200000, revenue: 230000, cost: 195000, managerCost: 35000 },
  { id: 'lava_jato', name: 'Lava-jato Bolha Azul', startCost: 60000, revenue: 72000, cost: 58000, managerCost: 18000 },
];
