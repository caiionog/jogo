import type { GameEvent } from '../../../engine';

/**
 * Colegas de farda (release 0.0.4): o alvo {pessoa} é um colega (flag `colega_farda`). Dilemas do dia a dia, sem
 * glamourizar nenhum lado e sem detalhe operacional. Violência curta e não gráfica.
 */
const COLEGA = { types: ['conhecido' as const, 'amigo' as const], personFlag: 'colega_farda' };
const ACTIVE = { stage: ['probatorio' as const, 'efetivo' as const] };

export const POLICE_COLLEAGUE_EVENTS: readonly GameEvent[] = [
  {
    id: 'pol_colega_turma',
    conditions: { minAge: 18, police: { stage: ['formacao'] }, relationship: COLEGA },
    weight: 7,
    tone: 'good',
    text: '{pessoa} divide a marmita com você todo dia na academia e sempre tem uma piada pronta para a hora do cansaço.',
    choices: [
      { id: 'amizade', label: 'Retribuir e estudar junto', effects: { social: { affection: 8 }, stats: { intelligence: 1 } }, resultText: 'Vocês viraram dupla de estudo e de corrida.' },
      { id: 'distancia', label: 'Manter só o coleguismo', effects: { social: { affection: 1 } }, resultText: 'Cordialidade, e só.' },
    ],
  },
  {
    id: 'pol_colega_escala',
    conditions: { minAge: 18, police: ACTIVE, relationship: COLEGA },
    weight: 6,
    text: '{pessoa} pede para trocar de escala com você: é aniversário do filho e o plantão caiu bem no dia.',
    choices: [
      { id: 'trocar', label: 'Trocar a escala', effects: { social: { affection: 10 }, stats: { happiness: -1 } }, resultText: '{pessoa} mandou foto do bolo e prometeu pagar a troca em dobro.' },
      { id: 'negar', label: 'Dizer que não dá', effects: { social: { affection: -6 } }, resultText: 'Ficou um climão no rádio por uma semana.' },
    ],
  },
  {
    id: 'pol_colega_desvio',
    conditions: { minAge: 18, police: ACTIVE, relationship: COLEGA },
    weight: 4,
    tone: 'bad',
    text: 'Você percebe que {pessoa} anda aceitando "agrados" de comerciantes para fazer vista grossa.',
    choices: [
      { id: 'conversar', label: 'Conversar a sós com {pessoa}', effects: { social: { affection: -3 }, police: { merit: 1 } }, resultText: '{pessoa} ficou sem graça e prometeu parar.' },
      { id: 'denunciar', label: 'Levar o caso à corregedoria', effects: { social: { affection: -25 }, police: { merit: 4 } }, resultText: 'O caso foi apurado. Parte da equipe passou a te olhar torto, parte te admira.' },
      { id: 'ignorar', label: 'Fingir que não viu', effects: { police: { corregedoria: 5 } }, resultText: 'Você ficou com aquilo na cabeça, e alguém mais viu você ver.' },
    ],
  },
  {
    id: 'pol_colega_ferido',
    conditions: { minAge: 18, police: ACTIVE, relationship: COLEGA },
    weight: 3,
    tone: 'bad',
    text: '{pessoa} se machucou numa ocorrência e vai passar semanas longe do serviço. A família está apertada.',
    choices: [
      { id: 'vaquinha', label: 'Organizar uma vaquinha no batalhão', effects: { money: -400, social: { affection: 12 }, stats: { happiness: 2 } }, resultText: 'A equipe toda contribuiu. {pessoa} chorou ao receber.' },
      { id: 'visitar', label: 'Visitar no hospital', effects: { social: { affection: 7 } }, resultText: 'Você levou revistas e as fofocas do plantão.' },
    ],
  },
  {
    id: 'pol_colega_churrasco',
    conditions: { minAge: 18, police: ACTIVE, relationship: COLEGA },
    weight: 6,
    tone: 'good',
    text: '{pessoa} chama você para o churrasco da equipe no fim de semana de folga.',
    choices: [
      { id: 'ir', label: 'Ir e levar a sobremesa', effects: { social: { affection: 6 }, stats: { happiness: 3 } }, resultText: 'Teve pagode, criança correndo e muita história de plantão.' },
      { id: 'descansar', label: 'Ficar em casa descansando', effects: { stats: { health: 1 } }, resultText: 'Você dormiu doze horas seguidas.' },
    ],
  },
  {
    id: 'pol_colega_promocao',
    conditions: { minAge: 20, police: ACTIVE, relationship: COLEGA },
    weight: 4,
    text: 'Saiu a lista de promoção e {pessoa} subiu antes de você.',
    choices: [
      { id: 'parabens', label: 'Dar os parabéns de verdade', effects: { social: { affection: 6 }, stats: { happiness: -1 } }, resultText: '{pessoa} disse que a sua vez está chegando.' },
      { id: 'inveja', label: 'Ficar remoendo', effects: { social: { affection: -4 }, stats: { happiness: -3 } }, resultText: 'Você passou o plantão emburrad{o/a}.' },
    ],
  },
  {
    id: 'pol_colega_conselho',
    conditions: { minAge: 18, police: { stage: ['probatorio'] }, relationship: COLEGA },
    weight: 5,
    tone: 'good',
    text: '{pessoa}, mais experiente, puxa você de lado: "No começo todo mundo quer resolver tudo sozinho. Pede apoio."',
    choices: [
      { id: 'ouvir', label: 'Ouvir com atenção', effects: { police: { merit: 2 }, social: { affection: 5 } }, resultText: 'O conselho evitou mais de uma enrascada.' },
      { id: 'teimar', label: 'Achar que já sabe tudo', effects: { social: { affection: -3 } }, resultText: '{pessoa} deu de ombros: "Depois não diz que eu não avisei."' },
    ],
  },
  {
    id: 'pol_colega_estresse',
    conditions: { minAge: 18, police: ACTIVE, relationship: COLEGA },
    weight: 4,
    text: '{pessoa} anda quieto demais, chega atrasado e já explodiu com um morador. Parece no limite.',
    choices: [
      { id: 'apoio', label: 'Sugerir o atendimento psicológico da corporação', effects: { social: { affection: 8 } }, resultText: '{pessoa} foi, meio a contragosto. Semanas depois, agradeceu.' },
      { id: 'chefia', label: 'Avisar a chefia', effects: { social: { affection: -8 }, police: { merit: 1 } }, resultText: 'A chefia tirou {pessoa} da rua por um tempo. Foi o certo, mas doeu.' },
      { id: 'nada', label: 'Não se meter', effects: {}, resultText: 'Cada um com seus problemas, você pensou.' },
    ],
  },
  {
    id: 'pol_colega_carona',
    conditions: { minAge: 18, police: ACTIVE, relationship: COLEGA },
    weight: 5,
    text: 'O carro de {pessoa} quebrou e o plantão começa às seis da manhã.',
    choices: [
      { id: 'carona', label: 'Buscar {pessoa} em casa', effects: { social: { affection: 7 }, stats: { health: -1 } }, resultText: 'Vocês tomaram café na padaria antes do serviço.' },
      { id: 'onibus', label: 'Indicar o ônibus das cinco', effects: { social: { affection: -2 } }, resultText: '{pessoa} chegou em cima da hora, mas chegou.' },
    ],
  },
  {
    id: 'pol_colega_despedida',
    conditions: { minAge: 30, police: ACTIVE, relationship: { ...COLEGA, personAge: { min: 45 } } },
    weight: 3,
    text: '{pessoa} vai se aposentar. Na despedida, pede para você dizer umas palavras.',
    choices: [
      { id: 'discurso', label: 'Fazer um discurso emocionado', effects: { social: { affection: 10 }, stats: { happiness: 3 } }, resultText: 'Teve gente segurando o choro no fundo do salão.' },
      { id: 'curto', label: 'Falar pouco e brindar', effects: { social: { affection: 4 } }, resultText: 'Curto e sincero. {pessoa} gostou.' },
    ],
  },
];
