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
  // release 0.0.1: mais tipos no Mercado (todos fictícios)
  { id: 'pizzaria', name: 'Pizzaria', startCost: 85000, revenue: 130000, cost: 112000, managerCost: 24000, forSale: true, saleNames: ['Pizzaria Forno a Lenha', 'Pizza da Nona', 'Pizzaria Bella Massa'], open: 'zero', risk: 'medio' },
  { id: 'padaria', name: 'Padaria', startCost: 110000, revenue: 170000, cost: 147000, managerCost: 28000, forSale: true, saleNames: ['Padaria Pão Quentinho', 'Panificadora Trigo de Ouro', 'Padaria da Esquina'], risk: 'baixo' },
  { id: 'salao_beleza', name: 'Salão de beleza', startCost: 45000, revenue: 70000, cost: 59000, managerCost: 16000, forSale: true, saleNames: ['Salão Espelho Meu', 'Studio Belle', 'Salão Cachos & Cia'], open: 'zero', risk: 'baixo' },
  { id: 'farmacia', name: 'Farmácia', startCost: 160000, revenue: 240000, cost: 214000, managerCost: 32000, forSale: true, saleNames: ['Farmácia Bem-Estar', 'Drogaria Vida Leve', 'Farmácia do Povo'], risk: 'baixo' },
  { id: 'oficina', name: 'Oficina mecânica', startCost: 75000, revenue: 105000, cost: 89000, managerCost: 22000, forSale: true, saleNames: ['Oficina Chave de Roda', 'Auto Center Pistão', 'Mecânica do Juca'], open: 'zero', risk: 'medio' },
  { id: 'pet_shop', name: 'Pet shop', startCost: 60000, revenue: 88000, cost: 75000, managerCost: 18000, forSale: true, saleNames: ['Pet Shop Focinho Feliz', 'Banho & Tosa Au Au', 'Pet Center Patinha'], open: 'zero', risk: 'medio' },
  { id: 'sorveteria', name: 'Sorveteria', startCost: 55000, revenue: 78000, cost: 67000, managerCost: 16000, forSale: true, saleNames: ['Sorveteria Gelato Tropical', 'Sorvetes Polo Sul', 'Picolé da Praça'], open: 'franquia', risk: 'medio' },
  { id: 'food_truck', name: 'Food truck', startCost: 45000, revenue: 70000, cost: 60000, managerCost: 15000, open: 'zero', risk: 'alto' },
  { id: 'grafica', name: 'Gráfica rápida', startCost: 70000, revenue: 92000, cost: 79000, managerCost: 20000, forSale: true, saleNames: ['Gráfica Tinta Fresca', 'Copiadora Express', 'Gráfica Papel & Cor'], risk: 'medio' },
  { id: 'loja_celulares', name: 'Loja de celulares', startCost: 90000, revenue: 140000, cost: 122000, managerCost: 24000, forSale: true, saleNames: ['Cell Point', 'Mundo do Celular', 'Conserta Já Celulares'], open: 'franquia', risk: 'alto' },
  { id: 'pousada', name: 'Pousada', startCost: 260000, revenue: 210000, cost: 172000, managerCost: 36000, forSale: true, saleNames: ['Pousada Brisa do Mar', 'Pousada Recanto Verde', 'Pousada Sol Nascente'], risk: 'medio' },
  { id: 'bar', name: 'Bar', startCost: 65000, revenue: 115000, cost: 99000, managerCost: 22000, forSale: true, saleNames: ['Bar do Gringo', 'Boteco da Esquina', 'Bar Saideira'], open: 'zero', risk: 'alto' },
  { id: 'estudio_tatuagem', name: 'Estúdio de tatuagem', startCost: 40000, revenue: 68000, cost: 57000, managerCost: 16000, forSale: true, saleNames: ['Estúdio Tinta Viva', 'Agulha de Ouro Tattoo', 'Studio Traço Fino'], open: 'zero', risk: 'medio' },
];
