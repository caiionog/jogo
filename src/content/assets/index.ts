import type { AssetDef } from '../../engine';

/** Catálogo de bens. Preço base em R$ (imóveis × custo da cidade). */
export const ASSET_CATALOG: readonly AssetDef[] = [
  { id: 'apartamento', kind: 'imovel', name: 'Apartamento', price: [220000, 520000], happiness: 3, variants: ['no Centro', 'perto do metrô', 'na Vila Nova', 'com vista para o parque'] },
  { id: 'casa', kind: 'imovel', name: 'Casa', price: [380000, 850000], happiness: 4, variants: ['com quintal', 'no Jardim das Acácias', 'de dois andares'] },
  { id: 'casa_luxo', kind: 'imovel', name: 'Casa de luxo', price: [1800000, 4500000], happiness: 6, reputation: 1, variants: ['em condomínio fechado', 'com piscina', 'à beira do lago'] },
  { id: 'sala_comercial', kind: 'imovel', name: 'Sala comercial', price: [180000, 420000], happiness: 0, variants: ['no centro empresarial', 'numa galeria'] },
  { id: 'carro_popular', kind: 'veiculo', name: 'Carro popular Faísca', price: [55000, 80000], happiness: 1 },
  { id: 'sedan', kind: 'veiculo', name: 'Sedã Horizonte', price: [120000, 180000], happiness: 2 },
  { id: 'suv', kind: 'veiculo', name: 'SUV Trovão', price: [220000, 330000], happiness: 3, reputation: 1 },
  { id: 'esportivo', kind: 'veiculo', name: 'Esportivo Relâmpago GT', price: [650000, 1100000], happiness: 4, reputation: 1 },
  { id: 'relogio', kind: 'luxo', name: 'Relógio Cronos Imperial', price: [30000, 90000], happiness: 1, reputation: 1 },
  { id: 'joias', kind: 'luxo', name: 'Joias Aurora', price: [20000, 70000], happiness: 1 },
  { id: 'arte', kind: 'luxo', name: 'Quadro de artista em alta', price: [60000, 250000], happiness: 1, reputation: 1 },
];
