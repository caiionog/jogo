import type { ExchangeProgramDef } from '../../engine';

/**
 * Intercâmbio de artes marciais (release 0.0.1): um ano treinando numa academia FICTÍCIA de referência no exterior.
 * O personagem continua morando no Brasil (é temporário). `cost` = passagem + estadia + mensalidade do ano (R$).
 */
export const EXCHANGE_PROGRAMS: readonly ExchangeProgramDef[] = [
  { id: 'tailandia', country: 'Tailândia', city: 'Chiang Mai', academy: 'Kru Sombat Camp', modality: 'muaythai', cost: 48000 },
  { id: 'japao', country: 'Japão', city: 'Tóquio', academy: 'Dojô Hayabusa', modality: 'judo', cost: 62000 },
  { id: 'eua', country: 'Estados Unidos', city: 'Iowa City', academy: 'Iron Plains Wrestling', modality: 'wrestling', cost: 70000 },
  { id: 'holanda', country: 'Holanda', city: 'Amsterdã', academy: 'Lowlands Kickboxing', modality: 'kickboxing', cost: 58000 },
  { id: 'bjj_exterior', country: 'Estados Unidos', city: 'San Diego', academy: 'Pacific Coast Jiu-Jitsu Center', modality: 'jiujitsu', cost: 66000 },
];
