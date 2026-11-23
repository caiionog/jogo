/**
 * Faixas de pena (anos) por delito — FICTÍCIAS e simplificadas, só inspiradas na ideia de penas brasileiras.
 * Agravantes: reincidência e facção. Atenuantes: bom advogado, confissão e sorte (limitada).
 * Regime inicial: > 8 anos fechado, 4–8 semiaberto, < 4 aberto. Até 1 ano: pena alternativa (serviço comunitário).
 */
export const SENTENCES: Record<string, [number, number]> = {
  pichacao: [0, 1],
  furto_loja: [0, 2],
  briga_rua: [0, 1],
  dano_patrimonio: [0, 1],
  furto_carro: [1, 4],
  receptacao: [1, 4],
  estelionato: [1, 5],
  agressao: [1, 3],
  assalto_pedestre: [4, 8],
  assalto_comercio: [5, 10],
  assalto_joalheria: [6, 12],
  assalto_banco: [8, 16],
  sequestro: [10, 20],
  trafico: [5, 15],
  corrupcao: [2, 8],
  excesso: [1, 6],
  fuga: [1, 3],
  investigacao: [1, 5],
  briga: [0, 1],
};

/** Delitos que admitem fiança (responder em liberdade pagando). */
export const BAILABLE: readonly string[] = ['pichacao', 'furto_loja', 'briga_rua', 'dano_patrimonio', 'furto_carro', 'receptacao', 'estelionato', 'agressao', 'investigacao', 'briga', 'excesso'];

export const FACILITIES = {
  provisorio: 'Centro de Detenção Vale Cinzento',
  fechado: 'Penitenciária Pedra Funda',
  semiaberto: 'Colônia Agrícola Boa Semente',
  aberto: 'Casa do Albergado Recomeço',
  especial: 'Ala de Custódia Especial da Penitenciária Pedra Funda',
} as const;
