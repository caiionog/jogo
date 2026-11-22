import type { BusinessDef } from '../../engine';

/**
 * Empreendimentos (valores anuais por nível, em R$; nomes e marcas fictícios). `open`: abrir do zero ou franquia;
 * `forSale`: negócios existentes à venda no Mercado (com clientela e estado). Receita ÷ custo ≈ 1,17 (Etapa 5).
 */
export const BUSINESSES: readonly BusinessDef[] = [
  // abrir do zero / franquia
  { id: 'academia', name: 'Academia própria', startCost: 150000, revenue: 130000, cost: 108000, managerCost: 30000, combat: true, open: 'zero', risk: 'medio' },
  { id: 'suplementos', name: 'Loja de suplementos Força Total', startCost: 80000, revenue: 95000, cost: 81000, managerCost: 22000, open: 'franquia', risk: 'medio' },
  { id: 'acaiteria', name: 'Açaiteria Açaí da Praça', startCost: 70000, revenue: 90000, cost: 76500, managerCost: 20000, open: 'franquia', risk: 'medio' },
  { id: 'roupa', name: 'Marca de roupa de luta Guerreiro', startCost: 120000, revenue: 120000, cost: 100000, managerCost: 28000, open: 'zero', risk: 'alto' },
  { id: 'restaurante', name: 'Restaurante Prato Cheio', startCost: 200000, revenue: 230000, cost: 202000, managerCost: 35000, open: 'zero', risk: 'alto' },
  { id: 'lava_jato', name: 'Lava-jato Bolha Azul', startCost: 60000, revenue: 72000, cost: 61000, managerCost: 18000, open: 'zero', forSale: true, saleNames: ['Lava-jato Bolha Azul', 'Lava Rápido do Zé', 'Brilho Total Lava-jato'], risk: 'baixo' },
  // negócios existentes à venda
  { id: 'lanchonete_bairro', name: 'Lanchonete de bairro', startCost: 50000, revenue: 80000, cost: 68000, managerCost: 18000, forSale: true, saleNames: ['Lanchonete do Bairro', 'Pastelaria Sabor da Esquina', 'Lanches da Praça'], risk: 'medio' },
  { id: 'barbearia', name: 'Barbearia', startCost: 40000, revenue: 62000, cost: 52500, managerCost: 14000, forSale: true, saleNames: ['Barbearia Navalha de Ouro', 'Barbearia do Tonho', 'Studio Corte Fino'], risk: 'baixo' },
  { id: 'mercadinho', name: 'Mercadinho', startCost: 90000, revenue: 160000, cost: 137000, managerCost: 28000, forSale: true, saleNames: ['Mercadinho Bom Preço', 'Mercearia Dona Lurdes', 'Mini Mercado Vizinho'], risk: 'baixo' },
  { id: 'loja_roupas', name: 'Loja de roupas', startCost: 70000, revenue: 100000, cost: 84000, managerCost: 22000, forSale: true, saleNames: ['Loja Estilo Urbano', 'Boutique Flor de Lis', 'Moda & Cia'], risk: 'alto' },
  { id: 'academia_luta', name: 'Academia de luta', startCost: 140000, revenue: 125000, cost: 104000, managerCost: 30000, combat: true, forSale: true, saleNames: ['Academia Tatame Vivo', 'CT Punho de Ferro', 'Equipe Raiz Jiu-Jitsu'], risk: 'medio' },
];
