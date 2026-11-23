import type { GameEvent } from '../../../engine';

/**
 * Cruzamentos (release 0.0.2, fase 8): polícia × crime × luta × família. O policial pode ter de prender alguém
 * próximo; parentes que se envolvem com o crime geram dilemas; o ex-presidiário lutador pode recomeçar na luta.
 */
const COP = { stage: ['probatorio' as const, 'efetivo' as const] };

export const CROSSING_EVENTS: readonly GameEvent[] = [
  {
    id: 'cruz_parente_crime',
    conditions: { minAge: 14, relationship: { types: ['irmao', 'amigo'], personAge: { min: 18 }, personFlagNone: 'crime' } },
    weight: 2,
    cooldownYears: 6,
    text: '{pessoa} anda com gente perigosa e aparece com dinheiro que ninguém sabe de onde vem.',
    choices: [
      { id: 'conversar', label: 'Conversar com {pessoa}', effects: { social: { affection: 4 } }, risk: { chance: 0.5, effects: { social: { affection: -4, setPersonFlags: { crime: true } } }, resultText: '{pessoa} mandou você cuidar da própria vida.' }, resultText: '{pessoa} prometeu se afastar daquela turma.' },
      { id: 'ignorar', label: 'Não se meter', effects: { social: { setPersonFlags: { crime: true } } }, resultText: 'Cada um sabe de si. Ou acha que sabe.' },
    ],
  },
  {
    id: 'cruz_policial_prende_proximo',
    conditions: { minAge: 19, police: COP, relationship: { types: ['irmao', 'amigo', 'ex', 'conhecido'], personFlag: 'crime', personAge: { min: 18 } } },
    weight: 4,
    cooldownYears: 4,
    text: 'Numa operação, você dá de cara com {pessoa} entre os suspeitos.',
    choices: [
      { id: 'prender', label: 'Fazer a prisão', effects: { police: { merit: 5, notable: 'Prendeu alguém próximo numa operação' }, social: { affection: -40, setPersonFlags: { preso_por_voce: true } }, stats: { happiness: -5 } }, resultText: '{pessoa} olhou para você sem dizer nada enquanto entrava na viatura.' },
      { id: 'colega', label: 'Pedir que um colega faça a prisão', effects: { stats: { happiness: -2 } }, resultText: 'Você se afastou da ocorrência. O comando entendeu.' },
      { id: 'liberar', label: 'Deixar {pessoa} escapar', effects: { social: { affection: 20 } }, risk: { chance: 0.35, effects: { police: { corregedoria: 2 }, social: { affection: 20 } }, resultText: 'Um colega viu. A corregedoria abriu processo.' }, resultText: 'Ninguém viu. Você nunca mais tocou no assunto.' },
    ],
  },
  {
    id: 'cruz_policial_parente_faccao',
    conditions: { minAge: 19, police: COP, relationship: { types: ['irmao', 'amigo', 'filho'], personFlag: 'faccao', personAge: { min: 18 } } },
    weight: 3,
    cooldownYears: 5,
    text: 'Seu nome apareceu num relatório de inteligência: {pessoa}, alguém próximo de você, é ligado a uma facção.',
    choices: [
      { id: 'declarar', label: 'Declarar o parentesco ao comando', effects: { police: { merit: 1 }, stats: { happiness: -3 } }, resultText: 'Você foi afastado das investigações daquela área. Transparência tem preço.' },
      { id: 'calar', label: 'Não dizer nada', effects: {}, risk: { chance: 0.3, effects: { police: { corregedoria: 2 } }, resultText: 'A corregedoria descobriu por conta própria.' }, resultText: 'Por enquanto, ninguém perguntou.' },
    ],
  },
  {
    id: 'cruz_criminoso_parente_policial',
    conditions: { minAge: 18, crime: { rep: { min: 15 } }, relationship: { types: ['irmao', 'amigo', 'pai', 'mae'], personFlag: 'policial' } },
    weight: 3,
    cooldownYears: 5,
    text: '{pessoa}, que é da polícia, te chama para uma conversa séria: "Eu sei o que você anda fazendo."',
    choices: [
      { id: 'parar', label: 'Prometer que vai parar', effects: { social: { affection: 6 }, crime: { rep: -6, wanted: -10 } }, resultText: '{pessoa} disse que vai acreditar em você. Uma última vez.' },
      { id: 'negar', label: 'Negar', effects: { social: { affection: -10 }, crime: { wanted: 8 } }, resultText: 'A conversa terminou fria.' },
    ],
  },
  {
    id: 'cruz_parente_vira_policial',
    conditions: { minAge: 12, relationship: { types: ['irmao', 'amigo'], personAge: { min: 20, max: 35 }, personFlagNone: 'policial' } },
    weight: 1,
    once: true,
    text: '{pessoa} passou num concurso e agora é da polícia.',
    choices: [
      { id: 'parabens', label: 'Dar os parabéns', effects: { social: { affection: 5, setPersonFlags: { policial: true } } }, resultText: 'Teve churrasco para comemorar.' },
      { id: 'zoar', label: 'Fazer piada com a farda', effects: { social: { affection: -2, setPersonFlags: { policial: true } } }, resultText: '{pessoa} riu, mas nem tanto.' },
    ],
  },
  {
    id: 'cruz_redencao_luta',
    conditions: { minAge: 18, maxAge: 42, flagsAll: ['recomecou'], crime: { imprisoned: false, record: true } },
    weight: 4,
    once: true,
    text: 'O dono de uma academia do bairro, que também já foi preso um dia, te chama para treinar de graça: "A luta me tirou do buraco. Pode tirar você também."',
    choices: [
      { id: 'aceitar', label: 'Aceitar e treinar sério', effects: { fighter: { joinGym: 'local', reputation: 3 }, stats: { happiness: 6, athletic: 2 }, setFlags: { redencao_luta: true, gostaDeLuta: true } }, resultText: 'Primeiro treino em anos. Você saiu do tatame leve como não se sentia havia muito tempo.' },
      { id: 'aulas', label: 'Ajudar a dar aulas para a molecada', effects: { stats: { happiness: 8 }, crime: { rep: -10 }, setFlags: { redencao_luta: true } }, resultText: 'Ensinar os meninos a respeitar o tatame virou o melhor momento da sua semana.' },
      { id: 'recusar', label: 'Agradecer e recusar', effects: {}, resultText: 'A porta ficou aberta.' },
    ],
  },
];
