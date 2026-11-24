import type { GameEvent } from '../../../engine';

/**
 * Foragido e regime aberto (pós-0.0.3). Quem fugiu da prisão vive com medo, sem glamour: procurado sobe, a felicidade
 * cai e a saída honesta é se entregar. No regime aberto a pessoa trabalha de dia e dorme na Casa do Albergado Recomeço
 * (lugar fictício). Nada de método de fuga ou de crime: só consequências.
 */
const FORAGIDO = { minAge: 18, flagsAll: ['foragido'], crime: { imprisoned: false } };
const ABERTO = { minAge: 18, crime: { imprisoned: true, regime: ['aberto' as const] } };

export const FUGITIVE_EVENTS: readonly GameEvent[] = [
  {
    id: 'foragido_blitz',
    conditions: FORAGIDO,
    weight: 5,
    cooldownYears: 2,
    tone: 'bad',
    text: 'Uma blitz fecha a estrada. Três carros à frente, policiais pedem documentos de todo mundo, e o seu nome está numa lista.',
    choices: [
      { id: 'entregar', label: 'Se entregar', effects: { clearFlags: ['foragido'], crime: { arrest: 'fuga' }, stats: { happiness: -4 } }, resultText: 'Você baixou o vidro e disse quem era. Foi quase um alívio.' },
      { id: 'documento', label: 'Mostrar o documento de outra pessoa', effects: { crime: { wanted: 8 }, stats: { happiness: -3 } }, risk: { chance: 0.45, effects: { clearFlags: ['foragido'], crime: { arrest: 'fuga' } }, resultText: 'O policial olhou a foto, olhou para você e pediu que descesse do carro.' }, resultText: 'O policial mal olhou. Você passou com as mãos tremendo e a camisa molhada de suor.' },
      { id: 'desviar', label: 'Dar meia-volta e pegar uma estrada de terra', effects: { crime: { wanted: 12 }, stats: { happiness: -4 } }, risk: { chance: 0.3, effects: { clearFlags: ['foragido'], crime: { arrest: 'fuga' } }, resultText: 'Uma viatura que você nem viu foi atrás de você.' }, resultText: 'Ninguém foi atrás. Mas você passou a noite dentro do carro, de olho no retrovisor.' },
    ],
  },
  {
    id: 'foragido_vizinho',
    conditions: FORAGIDO,
    weight: 5,
    cooldownYears: 3,
    tone: 'bad',
    text: 'O vizinho de porta começou a fazer perguntas demais. Viu uma notícia na TV, olhou para você e ficou calado.',
    choices: [
      { id: 'conversar', label: 'Conversar e inventar uma história', effects: { crime: { wanted: 5 }, stats: { happiness: -2 } }, risk: { chance: 0.25, effects: { crime: { wanted: 20 } }, resultText: 'Ele não acreditou e ligou para alguém.' }, resultText: 'Ele aceitou a história, ou fingiu aceitar.' },
      { id: 'mudar', label: 'Arrumar as coisas e se mudar', effects: { crime: { wanted: -5 }, stats: { happiness: -4 }, economy: { post: { cat: 'eventos', amount: -800, label: 'Mudança às pressas' } } }, resultText: 'Você saiu de madrugada, outra vez com tudo numa mochila.' },
    ],
  },
  {
    id: 'foragido_saudade',
    conditions: { ...FORAGIDO, hasRelation: ['mae', 'pai'] },
    weight: 4,
    cooldownYears: 3,
    tone: 'bad',
    text: 'É aniversário da sua mãe. O telefone está na sua mão, e você sabe que a ligação pode estar sendo acompanhada.',
    choices: [
      { id: 'ligar', label: 'Ligar mesmo assim', effects: { stats: { happiness: 5 }, social: { parentsAffection: 4 }, crime: { wanted: 15 } }, resultText: 'Foram dois minutos de voz. Ela chorou, você também, e depois a linha caiu.' },
      { id: 'nao', label: 'Não ligar', effects: { stats: { happiness: -6 } }, resultText: 'Você ficou olhando o telefone até a tela apagar.' },
    ],
  },
  {
    id: 'foragido_bico',
    conditions: FORAGIDO,
    weight: 4,
    cooldownYears: 2,
    text: 'Sem documentos, ninguém assina a sua carteira. Um dono de obra oferece diária em dinheiro, sem perguntar nada.',
    choices: [
      { id: 'aceitar', label: 'Aceitar o bico', effects: { economy: { post: { cat: 'eventos', amount: 1800, label: 'Diárias sem registro' } }, stats: { happiness: -1, health: -2 }, crime: { wanted: 3 } }, resultText: 'O trabalho é pesado e a paga é pouca, mas dá para comer.' },
      { id: 'recusar', label: 'Recusar, é muita exposição', effects: { stats: { happiness: -3 } }, resultText: 'Você passou o mês contando moedas.' },
    ],
  },
  {
    id: 'foragido_noticia',
    conditions: FORAGIDO,
    weight: 3,
    cooldownYears: 3,
    tone: 'bad',
    text: 'Seu rosto aparece num programa policial: "Foragido há anos, continua solto". Alguém no mercado olha para a tela, depois para você.',
    choices: [
      { id: 'sair', label: 'Largar as compras e sair andando', effects: { crime: { wanted: 10 }, stats: { happiness: -4 } }, resultText: 'Você caminhou sem olhar para trás até ter certeza de que ninguém vinha atrás.' },
      { id: 'disfarcar', label: 'Cortar o cabelo e mudar o visual', effects: { crime: { wanted: 4 }, stats: { looks: -1, happiness: -2 } }, risk: { chance: 0.2, effects: { crime: { wanted: 20 } }, resultText: 'Alguém ainda assim reconheceu você.' }, resultText: 'No espelho, você mal se reconheceu. Talvez os outros também não.' },
    ],
  },
  {
    id: 'foragido_advogado',
    conditions: { ...FORAGIDO, economy: { money: { min: 0 } } },
    weight: 3,
    cooldownYears: 3,
    text: 'Um advogado, por meio de um conhecido, manda um recado: se você se entregar por conta própria, o juiz tende a ver isso com bons olhos. Ele garante que acompanha o caso.',
    choices: [
      { id: 'entregar', label: 'Se entregar com o advogado', effects: { clearFlags: ['foragido'], crime: { arrest: 'fuga' }, stats: { happiness: -2 } }, resultText: 'Você entrou na delegacia ao lado dele, de cabeça erguida. Voltar por conta própria pesa a seu favor.' },
      { id: 'pensar', label: 'Pedir um tempo para pensar', effects: { stats: { happiness: -2 } }, resultText: 'Você não disse nem sim, nem não. O recado ficou na sua cabeça.' },
      { id: 'recusar', label: 'Recusar, ainda tem medo', effects: { crime: { wanted: 3 } }, resultText: 'Você apagou a mensagem. A porta continua aberta, mas não vai ficar para sempre.' },
    ],
  },
  {
    id: 'foragido_mudar',
    conditions: { ...FORAGIDO, economy: { money: { min: 3000 } } },
    weight: 3,
    cooldownYears: 3,
    text: 'A vizinhança está ficando pequena demais. Uma passagem de ônibus para outra cidade custa pouco, e recomeçar longe parece a única saída.',
    choices: [
      { id: 'ir', label: 'Ir para outra cidade', effects: { move: { to: 'outra_capital', cost: 2500 }, crime: { wanted: -12 }, stats: { happiness: -3 } }, resultText: 'Um lugar novo, uma identidade discreta e a mesma sombra de sempre.' },
      { id: 'ficar', label: 'Ficar onde está', effects: {}, resultText: 'Mudar de lugar não muda quem procura você. Você ficou.' },
    ],
  },
];

export const OPEN_REGIME_EVENTS: readonly GameEvent[] = [
  {
    id: 'aberto_atraso',
    conditions: ABERTO,
    weight: 5,
    cooldownYears: 2,
    tone: 'bad',
    text: 'O ônibus quebrou no caminho e você chegou à Casa do Albergado Recomeço depois do horário.',
    choices: [
      { id: 'explicar', label: 'Explicar o que houve e pedir compreensão', effects: { crime: { behavior: -10 } }, resultText: 'Você levou uma advertência por escrito. Podia ter sido pior.' },
      { id: 'mentir', label: 'Dizer que estava no trabalho', effects: { crime: { behavior: -5 } }, risk: { chance: 0.4, effects: { crime: { behavior: -20 } }, resultText: 'Ligaram para o emprego e a mentira caiu.' }, resultText: 'Acreditaram. Você respirou aliviad{o/a}.' },
    ],
  },
  {
    id: 'aberto_emprego',
    conditions: ABERTO,
    weight: 5,
    cooldownYears: 3,
    text: 'Uma padaria do bairro aceita contratar egressos. O dono pede só pontualidade e compromisso.',
    choices: [
      { id: 'aceitar', label: 'Aceitar a vaga', effects: { crime: { behavior: 10 }, economy: { post: { cat: 'eventos', amount: 2200, label: 'Salário na padaria' } }, stats: { happiness: 3 } }, resultText: 'Acordar às cinco da manhã nunca foi tão bom. É a primeira carteira assinada em muito tempo.' },
      { id: 'recusar', label: 'Recusar, o salário é baixo', effects: { stats: { happiness: -1 } }, resultText: 'Você ficou com a sensação de que perdeu algo importante.' },
    ],
  },
  {
    id: 'aberto_antigos_parceiros',
    conditions: ABERTO,
    weight: 4,
    cooldownYears: 3,
    tone: 'bad',
    text: 'Na saída do trabalho, antigos parceiros encostam o carro. "Tem coisa boa vindo, e a gente lembrou de você."',
    choices: [
      { id: 'recusar', label: 'Recusar e seguir para o albergue', effects: { crime: { behavior: 5 }, stats: { happiness: 2 } }, resultText: 'Foi difícil dizer não. Você chegou ao albergue com o coração acelerado, mas em paz.' },
      { id: 'aceitar', label: 'Aceitar o convite', effects: { crime: { wanted: 15, rep: 4 }, stats: { happiness: -2 } }, risk: { chance: 0.4, effects: { crime: { behavior: -25 } }, resultText: 'Alguém avisou a direção da Casa do Albergado Recomeço. Sua conduta foi marcada como grave.' }, resultText: 'Você voltou a andar com eles. Cada noite no albergue ficou mais pesada.' },
    ],
  },
  {
    id: 'aberto_familia',
    conditions: { ...ABERTO, hasRelation: ['mae', 'pai'] },
    weight: 4,
    cooldownYears: 3,
    text: 'Sua família quer ajudar você a recomeçar: oferece um quarto nos fins de semana e uma ajuda para o transporte.',
    choices: [
      { id: 'aceitar', label: 'Aceitar a ajuda', effects: { social: { parentsAffection: 6 }, stats: { happiness: 5 }, crime: { behavior: 3 } }, resultText: 'Almoçar em casa no domingo, sem pressa, valeu mais do que muito dinheiro.' },
      { id: 'orgulho', label: 'Recusar por orgulho', effects: { social: { parentsAffection: -3 }, stats: { happiness: -2 } }, resultText: 'Disse que se vira sozinh{o/a}. Ninguém insistiu, e doeu mais do que você esperava.' },
    ],
  },
  {
    id: 'aberto_curso_noturno',
    conditions: ABERTO,
    weight: 4,
    cooldownYears: 3,
    text: 'Um curso noturno de eletricista, parceria com o Instituto Novo Rumo, tem vaga para quem cumpre o regime aberto. Cada aula conta para reduzir a pena.',
    choices: [
      { id: 'fazer', label: 'Fazer o curso', effects: { crime: { remission: 0.25, behavior: 5 }, stats: { intelligence: 2, happiness: 1 } }, resultText: 'Sem faltar uma noite, você não faltou uma noite. Ganhou ofício e dias a menos de pena.' },
      { id: 'pular', label: 'Deixar para depois', effects: {}, resultText: 'Depois do dia de trabalho, a cama pareceu mais atraente. A vaga foi para outra pessoa.' },
    ],
  },
];
