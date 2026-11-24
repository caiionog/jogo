import type { GameEvent } from '../../../engine';

/**
 * Eventos ADULTOS (tag 'adult'): só aparecem com a opção "Conteúdo adulto" ligada, personagem 18+ e
 * parceiro(a) 18+ — o motor de eventos filtra com canHaveSexualContent. Texto sugestivo, nunca gráfico.
 */
export const ADULT_EVENTS: readonly GameEvent[] = [
  {
    id: 'adult_casual_encounter',
    tags: ['adult'],
    conditions: { minAge: 18, civilStatus: ['solteiro', 'divorciado'] },
    weight: 4,
    text: 'Depois de uma noite animada, alguém interessante te convida para esticar a noite no apartamento dele(a).',
    choices: [
      { id: 'yes_safe', label: 'Topar, com proteção', effects: { stats: { happiness: 4 }, social: { ist: 0.005 } }, resultText: 'Foi uma noite divertida. Cada um seguiu o seu caminho de manhã.' },
      { id: 'yes', label: 'Topar, sem pensar em proteção', effects: { stats: { happiness: 4 }, social: { ist: 0.06 } }, resultText: 'A noite foi intensa. A ressaca moral veio no dia seguinte.' },
      { id: 'no', label: 'Agradecer e ir para casa', effects: {}, resultText: 'Hoje não. Você foi dormir cedo.' },
    ],
  },
  {
    id: 'adult_night_with_partner',
    tags: ['adult'],
    conditions: { minAge: 18, relationship: { types: ['parceiro', 'conjuge'], affection: { min: 40 }, personAge: { min: 18 } } },
    weight: 5,
    text: 'Velas acesas, música baixa: {pessoa} preparou uma noite romântica só para vocês dois.',
    choices: [
      { id: 'safe', label: 'Aproveitar a noite (com proteção)', effects: { stats: { happiness: 4 }, social: { affection: 8, intimacy: true } }, resultText: 'O resto fica entre vocês dois.' },
      { id: 'unsafe', label: 'Deixar rolar, sem proteção', effects: { stats: { happiness: 4 }, social: { affection: 8, pregnancyChance: 0.25, intimacy: true } }, resultText: 'Uma noite para lembrar... e talvez com consequências.' },
    ],
  },
  {
    id: 'adult_forgot_condom',
    tags: ['adult'],
    conditions: { minAge: 18, relationship: { types: ['parceiro', 'conjuge'], personAge: { min: 18 } } },
    weight: 3,
    text: 'No calor do momento, você e {pessoa} percebem que a camisinha acabou.',
    choices: [
      { id: 'go', label: 'Seguir mesmo assim', effects: { social: { affection: 4, pregnancyChance: 0.3, ist: 0.02, intimacy: true } }, resultText: 'Agora é torcer (ou não) para o teste dar negativo.' },
      { id: 'stop', label: 'Parar e deixar para outro dia', effects: { social: { affection: -1 } }, resultText: 'Prudência venceu. Vocês riram da situação.' },
    ],
  },
  {
    id: 'adult_cheating_suspicion',
    tags: ['adult'],
    conditions: { minAge: 18, relationship: { types: ['parceiro', 'conjuge'], personAge: { min: 18 } } },
    weight: 3,
    text: 'Você viu mensagens comprometedoras no celular de {pessoa}, de alguém que você não conhece.',
    choices: [
      {
        id: 'confront',
        label: 'Confrontar',
        effects: { stats: { happiness: -3 }, social: { affection: -5 } },
        resultText: 'Era um mal-entendido: uma surpresa de aniversário sendo planejada.',
        risk: { chance: 0.5, effects: { stats: { happiness: -10 }, social: { affection: -30 } }, resultText: '{pessoa} confessou a traição. Sua confiança desmoronou.' },
      },
      { id: 'ignore', label: 'Fingir que não viu', effects: { stats: { happiness: -5 } }, resultText: 'A dúvida ficou martelando na sua cabeça.' },
    ],
  },
  {
    id: 'adult_temptation',
    tags: ['adult'],
    conditions: { minAge: 18, civilStatus: ['namorando', 'noivo', 'casado'], relationship: { types: ['parceiro', 'conjuge'], personAge: { min: 18 } } },
    weight: 3,
    text: 'Numa viagem para lutar fora, alguém deixa bem claro o interesse em você. {pessoa} está longe.',
    choices: [
      { id: 'loyal', label: 'Recusar e ligar para {pessoa}', effects: { social: { affection: 6 } }, resultText: 'Você dormiu com a consciência tranquila.' },
      {
        id: 'cheat',
        label: 'Ceder à tentação',
        effects: { stats: { happiness: 2 }, social: { ist: 0.03 } },
        resultText: 'Ninguém ficou sabendo... por enquanto.',
        risk: { chance: 0.5, effects: { stats: { happiness: -12 }, social: { affection: -40 } }, resultText: '{pessoa} descobriu a traição. A relação balançou de verdade.' },
      },
    ],
  },
];
