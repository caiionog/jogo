import type { GameEvent } from '../../../engine';

/**
 * Vizinhança e imigração (release 0.0.4, fase 2). O alvo {pessoa} é alguém da cidade que você conheceu (flag
 * `morador`); nos eventos de imigração, quem nasceu em outro país (flag `origem`). Nunca há mecânica por origem:
 * os eventos são sobre convivência, cultura e burocracia.
 */
const MORADOR = { types: ['conhecido' as const, 'amigo' as const], personFlag: 'morador' };
const IMIGRANTE = { types: ['conhecido' as const, 'amigo' as const], personFlag: 'origem' };

export const POPULATION_EVENTS: readonly GameEvent[] = [
  { id: 'cidade_vizinho_obra', weight: 5, conditions: { minAge: 16, relationship: MORADOR }, text: '{pessoa} começou uma obra que faz barulho às sete da manhã, até no sábado.',
    choices: [
      { id: 'conversar', label: 'Conversar com jeito', resultText: '{pessoa} pediu desculpas e mudou o horário.', effects: { social: { affection: 4 } } },
      { id: 'reclamar', label: 'Reclamar no grupo do bairro', resultText: 'Virou briga no grupo inteiro.', effects: { social: { affection: -10 }, stats: { happiness: -2 } } },
    ] },
  { id: 'cidade_vizinho_ajuda', weight: 5, tone: 'good', conditions: { minAge: 10, relationship: MORADOR }, text: 'Faltou luz na rua e {pessoa} bateu na sua porta com velas e um bolo que ia estragar.',
    choices: [
      { id: 'convidar', label: 'Chamar para comer junto', resultText: 'Vocês conversaram até a luz voltar.', effects: { social: { affection: 8 }, stats: { happiness: 3 } } },
      { id: 'agradecer', label: 'Agradecer e ficar em casa', resultText: 'Gentileza de vizinho vale ouro.', effects: { social: { affection: 3 } } },
    ] },
  { id: 'cidade_festa_rua', weight: 4, tone: 'good', cooldownYears: 3, conditions: { minAge: 6, relationship: MORADOR }, text: '{pessoa} está organizando a festa junina da rua e pede ajuda com as bandeirinhas.',
    choices: [
      { id: 'ajudar', label: 'Ajudar a montar tudo', resultText: 'A rua ficou linda e você conheceu metade do bairro.', effects: { social: { affection: 6, meet: { context: 'school', type: 'amigo', chance: 0.5 } }, stats: { happiness: 3 } } },
      { id: 'so_ir', label: 'Só aparecer na festa', resultText: 'Quentão, pé de moleque e quadrilha.', effects: { stats: { happiness: 2 } } },
    ] },
  { id: 'imig_receita', weight: 5, tone: 'good', conditions: { minAge: 10, relationship: IMIGRANTE }, text: '{pessoa} chama você para provar uma receita típica da terra natal.',
    choices: [
      { id: 'provar', label: 'Provar tudo e pedir a receita', resultText: 'Foi a melhor comida do mês. Você anotou o passo a passo.', effects: { social: { affection: 7 }, stats: { happiness: 3 } } },
      { id: 'educado', label: 'Provar um pouco, por educação', resultText: '{pessoa} riu: "Da próxima vez faço menos pimenta."', effects: { social: { affection: 3 } } },
    ] },
  { id: 'imig_documentos', weight: 4, conditions: { minAge: 18, relationship: IMIGRANTE }, text: '{pessoa} está com dificuldade com a papelada para renovar os documentos.',
    choices: [
      { id: 'ajudar', label: 'Ajudar a agendar e ir junto', resultText: 'Duas filas e um carimbo depois, tudo certo.', effects: { social: { affection: 10 } } },
      { id: 'indicar', label: 'Indicar um serviço de atendimento a migrantes', resultText: '{pessoa} agradeceu a dica.', effects: { social: { affection: 4 } } },
    ] },
  { id: 'imig_idioma', weight: 4, tone: 'good', conditions: { minAge: 12, relationship: IMIGRANTE }, text: '{pessoa} propõe uma troca: você ajuda no português e aprende o idioma da terra natal.',
    choices: [
      { id: 'topar', label: 'Topar a troca', resultText: 'Em poucos meses vocês já faziam piada nos dois idiomas.', effects: { social: { affection: 6 }, stats: { intelligence: 2 } } },
      { id: 'sem_tempo', label: 'Dizer que está sem tempo', resultText: 'Fica para outra hora.', effects: { social: { affection: -1 } } },
    ] },
  { id: 'imig_preconceito', weight: 3, conditions: { minAge: 14, relationship: IMIGRANTE }, text: 'Na fila do mercado, alguém faz um comentário preconceituoso sobre o sotaque de {pessoa}.',
    choices: [
      { id: 'defender', label: 'Defender {pessoa} na hora', resultText: 'O sujeito se calou. {pessoa} apertou seu braço em agradecimento.', effects: { social: { affection: 10 }, stats: { happiness: 1 } } },
      { id: 'depois', label: 'Consolar {pessoa} depois', resultText: '{pessoa} disse que já se acostumou, mas não devia ser assim.', effects: { social: { affection: 4 } } },
    ] },
];
