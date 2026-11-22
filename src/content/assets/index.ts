import type { AssetDef } from '../../engine';

/** Catálogo de bens. Preço base em R$ (imóveis × custo da cidade). */
export const ASSET_CATALOG: readonly AssetDef[] = [
  { id: 'kitnet', kind: 'imovel', name: 'Kitnet', article: 'uma', price: [110000, 220000], happiness: 1, size: [22, 40], variants: ['no Centro', 'perto da faculdade', 'na Vila Operária'] },
  { id: 'apartamento', kind: 'imovel', name: 'Apartamento', price: [220000, 520000], happiness: 3, size: [45, 110], variants: ['no Centro', 'perto do metrô', 'na Vila Nova', 'com vista para o parque'] },
  { id: 'casa', kind: 'imovel', name: 'Casa', article: 'uma', price: [380000, 850000], happiness: 4, size: [90, 220], variants: ['com quintal', 'no Jardim das Acácias', 'de dois andares'] },
  { id: 'casa_luxo', kind: 'imovel', name: 'Casa de luxo', article: 'uma', price: [1800000, 4500000], happiness: 6, reputation: 1, size: [300, 700], variants: ['em condomínio fechado', 'com piscina', 'à beira do lago'] },
  { id: 'sala_comercial', kind: 'imovel', name: 'Sala comercial', article: 'uma', price: [180000, 420000], happiness: 0, size: [30, 90], variants: ['no centro empresarial', 'numa galeria'] },
  { id: 'casa_praia', kind: 'imovel', name: 'Casa de praia', article: 'uma', price: [300000, 900000], happiness: 4, size: [80, 200], where: 'litoral', variants: ['pé na areia', 'a duas quadras do mar', 'no condomínio da orla'] },
  { id: 'sitio', kind: 'imovel', name: 'Sítio', price: [250000, 700000], happiness: 4, size: [5000, 40000], where: 'interior', variants: ['com pomar', 'com açude', 'na estrada de terra'] },
  { id: 'terreno', kind: 'imovel', name: 'Terreno', price: [60000, 250000], happiness: 0, size: [200, 600], noRent: true, variants: ['no loteamento novo', 'de esquina', 'no bairro em expansão'] },
  { id: 'moto', kind: 'veiculo', name: 'Moto Corisco 160', article: 'uma', price: [12000, 25000], happiness: 1 },
  { id: 'carro_usado', kind: 'veiculo', name: 'Carro usado Faísca 2016', price: [28000, 48000], happiness: 1 },
  { id: 'carro_popular', kind: 'veiculo', name: 'Carro popular Faísca', price: [55000, 80000], happiness: 1 },
  { id: 'sedan', kind: 'veiculo', name: 'Sedã Horizonte', price: [120000, 180000], happiness: 2 },
  { id: 'suv', kind: 'veiculo', name: 'SUV Trovão', price: [220000, 330000], happiness: 3, reputation: 1 },
  { id: 'esportivo', kind: 'veiculo', name: 'Esportivo Relâmpago GT', price: [650000, 1100000], happiness: 4, reputation: 1 },
  { id: 'relogio', kind: 'luxo', name: 'Relógio Cronos Imperial', price: [30000, 90000], happiness: 1, reputation: 1 },
  { id: 'joias', kind: 'luxo', name: 'Joias Aurora', article: 'as', price: [20000, 70000], happiness: 1 },
  { id: 'arte', kind: 'luxo', name: 'Quadro de artista em alta', price: [60000, 250000], happiness: 1, reputation: 1 },
  // luxo barato: menores de idade podem comprar com o próprio dinheiro
  { id: 'bone_grife', kind: 'luxo', name: 'Boné Maison Arara', price: [350, 700], happiness: 1, teen: true },
  { id: 'tenis_grife', kind: 'luxo', name: 'Tênis de grife Cronos Run', price: [900, 2400], happiness: 1, teen: true },
  { id: 'oculos_grife', kind: 'luxo', name: 'Óculos de sol Aurora', price: [1200, 3500], happiness: 1, teen: true },
];
