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
  agents: ['Marcos "Contrato" Valadares', 'Paula Sampaio Gestão Esportiva', 'Rodrigo Holanda Management', 'Grupo Faixa Preta Agenciamento'],
  hooks: { regimeEventId: 'eco_regime' },
};
