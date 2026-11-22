import type { EconomyContent } from '../../engine';
import { ASSET_CATALOG } from '../assets';
import { BUSINESSES } from '../businesses';
import { JOBS } from '../jobs';
import { SPONSORS } from '../sponsors';

export const ECONOMY_CONTENT: EconomyContent = {
  jobs: JOBS,
  assets: ASSET_CATALOG,
  businesses: BUSINESSES,
  sponsors: SPONSORS,
  // imposto de renda progressivo fictício (renda anual em R$)
  taxBrackets: [
    { upTo: 24000, rate: 0 },
    { upTo: 48000, rate: 0.075 },
    { upTo: 96000, rate: 0.15 },
    { upTo: 200000, rate: 0.225 },
    { upTo: null, rate: 0.275 },
  ],
  cityCost: {
    'São Paulo': 1.3,
    'Rio de Janeiro': 1.25,
    'Belo Horizonte': 1.0,
    Curitiba: 1.0,
    Manaus: 0.85,
    Recife: 0.85,
    Salvador: 0.85,
    'Porto Alegre': 1.0,
    Lisboa: 1.4,
    Porto: 1.2,
    Coimbra: 1.0,
    'Nova York': 2.2,
    'Las Vegas': 1.6,
    Miami: 1.8,
    'San Diego': 1.9,
    'Tóquio': 2.0,
    Osaka: 1.6,
    'Cidade do México': 0.9,
    Tijuana: 0.75,
  },
  agents: ['Marcos "Contrato" Valadares', 'Paula Sampaio Gestão Esportiva', 'Rodrigo Holanda Management', 'Grupo Faixa Preta Agenciamento'],
  hooks: { regimeEventId: 'eco_regime' },
};
