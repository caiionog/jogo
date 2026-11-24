import type { GameEvent } from '../../../engine';

/**
 * Polícia Civil (release 0.0.2): quatro investigações encadeadas. A 1ª etapa abre o caso (`caseStart`), as
 * seguintes somam pistas (`caseScore`) e a última fecha (`caseEnd`): resolvido, arquivado ou suspeito errado
 * (placar oculto + sorte limitada). A passagem da 1ª para a 2ª etapa leva um ano (`delayYears: 1`: o inquérito amadurece); as demais seguem no
 * mesmo ano (`delayYears: 0`). Todas só valem com o caso aberto (`inCase`): se a pessoa sai da polícia, o agendamento cai.
 */
const CIVIL = { force: ['civil' as const], stage: ['probatorio' as const, 'efetivo' as const] };
const step = (id: string) => ({ minAge: 18, police: { force: ['civil' as const], inCase: id } });
const next = (eventId: string) => [{ eventId, delayYears: 0 }];
const nextYear = (eventId: string) => [{ eventId, delayYears: 1 }];

export const CIVIL_EVENTS: readonly GameEvent[] = [
  // --- furto de carga (3 etapas) ---
  {
    id: 'pol_caso_carga_1',
    conditions: { minAge: 18, police: { ...CIVIL, noCase: true } },
    weight: 5,
    text: 'Um caminhão de eletrônicos sumiu na rodovia. O caso caiu na sua mesa.',
    choices: [
      { id: 'cameras', label: 'Puxar as câmeras do posto de pedágio', effects: { police: { caseStart: 'carga', caseScore: 2 }, followUps: nextYear('pol_caso_carga_2') }, resultText: 'As imagens mostram um carro acompanhando o caminhão.' },
      { id: 'motorista', label: 'Ouvir o motorista de novo', effects: { police: { caseStart: 'carga', caseScore: 1 }, followUps: nextYear('pol_caso_carga_2') }, resultText: 'O motorista se contradisse em dois detalhes.' },
      { id: 'esperar', label: 'Esperar uma denúncia anônima', effects: { police: { caseStart: 'carga', caseScore: -1 }, followUps: nextYear('pol_caso_carga_2') }, resultText: 'Dias passaram sem nada de novo.' },
    ],
  },
  {
    id: 'pol_caso_carga_2',
    trigger: 'followUp',
    conditions: step('carga'),
    weight: 0,
    text: 'Furto de carga: um depósito na periferia começou a vender eletrônicos baratos demais.',
    choices: [
      { id: 'campana', label: 'Fazer campana no depósito', effects: { police: { caseScore: 2 }, followUps: next('pol_caso_carga_3') }, resultText: 'Você anotou placas e horários.' },
      { id: 'mandado', label: 'Pedir mandado de busca já', effects: { police: { caseScore: 1 }, followUps: next('pol_caso_carga_3') }, resultText: 'O juiz concedeu, mas pediu mais elementos para as prisões.' },
      { id: 'pressionar', label: 'Pressionar o dono do depósito', effects: { police: { caseScore: -1 }, followUps: next('pol_caso_carga_3') }, resultText: 'Ele chamou o advogado e ficou em silêncio.' },
    ],
  },
  {
    id: 'pol_caso_carga_3',
    trigger: 'followUp',
    conditions: step('carga'),
    weight: 0,
    text: 'Furto de carga: hora de decidir a operação.',
    choices: [
      { id: 'agora', label: 'Deflagrar a operação agora', effects: { police: { caseEnd: true } }, resultText: 'Viaturas na rua de madrugada.' },
      { id: 'provas', label: 'Esperar mais uma semana de provas', effects: { police: { caseScore: 1, caseEnd: true } }, resultText: 'Você segurou a ansiedade e reuniu mais provas.' },
      { id: 'apoio', label: 'Chamar apoio de outra delegacia', effects: { police: { caseScore: 1, merit: -1, caseEnd: true } }, resultText: 'Mais gente, mais segurança — e o crédito dividido.' },
    ],
  },

  // --- homicídio (4 etapas) ---
  {
    id: 'pol_caso_homicidio_1',
    conditions: { minAge: 18, police: { ...CIVIL, noCase: true } },
    weight: 4,
    text: 'Um comerciante do bairro foi encontrado sem vida na loja. A família cobra respostas.',
    choices: [
      { id: 'pericia', label: 'Esperar o laudo da perícia', effects: { police: { caseStart: 'homicidio', caseScore: 2 }, followUps: nextYear('pol_caso_homicidio_2') }, resultText: 'O laudo aponta uma discussão antes do crime.' },
      { id: 'vizinhos', label: 'Ouvir os vizinhos', effects: { police: { caseStart: 'homicidio', caseScore: 1 }, followUps: nextYear('pol_caso_homicidio_2') }, resultText: 'Uma vizinha viu alguém sair às pressas.' },
      { id: 'suspeito', label: 'Ir atrás do primeiro suspeito óbvio', effects: { police: { caseStart: 'homicidio', caseScore: -2 }, followUps: nextYear('pol_caso_homicidio_2') }, resultText: 'O "óbvio" tinha um álibi razoável.' },
    ],
  },
  {
    id: 'pol_caso_homicidio_2',
    trigger: 'followUp',
    conditions: step('homicidio'),
    weight: 0,
    text: 'Homicídio no bairro: uma testemunha tem medo de falar.',
    choices: [
      { id: 'proteger', label: 'Garantir proteção e conversar com calma', effects: { police: { caseScore: 2 }, followUps: next('pol_caso_homicidio_3') }, resultText: 'Ela contou o que viu.' },
      { id: 'intimar', label: 'Intimar formalmente', effects: { police: { caseScore: 0 }, followUps: next('pol_caso_homicidio_3') }, resultText: 'O depoimento veio curto e cheio de "não lembro".' },
      { id: 'pular', label: 'Seguir sem ela', effects: { police: { caseScore: -1 }, followUps: next('pol_caso_homicidio_3') }, resultText: 'Você perdeu uma peça importante.' },
    ],
  },
  {
    id: 'pol_caso_homicidio_3',
    trigger: 'followUp',
    conditions: step('homicidio'),
    weight: 0,
    text: 'Homicídio no bairro: o telefone do suspeito pode confirmar a história.',
    choices: [
      { id: 'mandado', label: 'Pedir mandado para os registros', effects: { police: { caseScore: 2 }, followUps: next('pol_caso_homicidio_4') }, resultText: 'Os registros batem com o depoimento da testemunha.' },
      { id: 'informal', label: 'Conseguir "por fora" com um contato', effects: { police: { caseScore: 1, corregedoria: 1 }, followUps: next('pol_caso_homicidio_4') }, resultText: 'Funcionou, mas é prova que o advogado pode derrubar.' },
      { id: 'sem', label: 'Seguir sem os registros', effects: { followUps: next('pol_caso_homicidio_4') }, resultText: 'Você confia no que já tem.' },
    ],
  },
  {
    id: 'pol_caso_homicidio_4',
    trigger: 'followUp',
    conditions: step('homicidio'),
    weight: 0,
    text: 'Homicídio no bairro: o inquérito precisa ser concluído.',
    choices: [
      { id: 'prender', label: 'Pedir a prisão do suspeito', effects: { police: { caseEnd: true } }, resultText: 'O pedido foi para o juiz.' },
      { id: 'interrogar', label: 'Interrogar o suspeito mais uma vez', effects: { police: { caseScore: 1, caseEnd: true } }, resultText: 'Você apertou nos detalhes.' },
    ],
  },

  // --- desvio de dinheiro (3 etapas) ---
  {
    id: 'pol_caso_desvio_1',
    conditions: { minAge: 18, police: { ...CIVIL, noCase: true } },
    weight: 3,
    text: 'Uma associação de moradores denuncia que o dinheiro de uma obra sumiu.',
    choices: [
      { id: 'contas', label: 'Analisar as contas com calma', effects: { police: { caseStart: 'desvio', caseScore: 2 }, stats: { intelligence: 1 }, followUps: nextYear('pol_caso_desvio_2') }, resultText: 'Notas fiscais de uma empresa que não existe.' },
      { id: 'tesoureiro', label: 'Chamar o tesoureiro para depor', effects: { police: { caseStart: 'desvio', caseScore: 0 }, followUps: nextYear('pol_caso_desvio_2') }, resultText: 'Ele trouxe um advogado caro.' },
    ],
  },
  {
    id: 'pol_caso_desvio_2',
    trigger: 'followUp',
    conditions: step('desvio'),
    weight: 0,
    text: 'Desvio de dinheiro: a empresa de fachada está no nome de um parente do tesoureiro.',
    choices: [
      { id: 'quebra', label: 'Pedir a quebra de sigilo bancário', effects: { police: { caseScore: 2 }, followUps: next('pol_caso_desvio_3') }, resultText: 'O dinheiro fez um caminho curioso.' },
      { id: 'imprensa', label: 'Vazar para a imprensa', effects: { police: { caseScore: -1, merit: -2 }, followUps: next('pol_caso_desvio_3') }, resultText: 'Os suspeitos ficaram em alerta.' },
    ],
  },
  {
    id: 'pol_caso_desvio_3',
    trigger: 'followUp',
    conditions: step('desvio'),
    weight: 0,
    text: 'Desvio de dinheiro: dá para indiciar.',
    choices: [
      { id: 'indiciar', label: 'Indiciar e encerrar o inquérito', effects: { police: { caseEnd: true } }, resultText: 'O relatório foi para o Ministério Público.' },
      { id: 'mais', label: 'Rastrear mais um repasse antes', effects: { police: { caseScore: 1, caseEnd: true } }, resultText: 'Mais uma semana de planilhas.' },
    ],
  },

  // --- facção (4 etapas) ---
  {
    id: 'pol_caso_faccao_1',
    conditions: { minAge: 18, police: { ...CIVIL, noCase: true, serviceYears: { min: 2 } } },
    weight: 3,
    text: 'Você foi escalad{o/a} para investigar o braço de uma facção que domina a venda de drogas num bairro.',
    choices: [
      { id: 'mapa', label: 'Mapear quem é quem', effects: { police: { caseStart: 'faccao', caseScore: 2 }, followUps: nextYear('pol_caso_faccao_2') }, resultText: 'O organograma começou a ganhar forma.' },
      { id: 'informante', label: 'Recrutar um informante', effects: { police: { caseStart: 'faccao', caseScore: 1 }, followUps: nextYear('pol_caso_faccao_2') }, risk: { chance: 0.2, effects: { police: { caseStart: 'faccao', caseScore: -1 }, stats: { happiness: -3 }, followUps: nextYear('pol_caso_faccao_2') }, resultText: 'O informante sumiu depois da primeira conversa.' }, resultText: 'Ele aceitou falar em troca de proteção.' },
    ],
  },
  {
    id: 'pol_caso_faccao_2',
    trigger: 'followUp',
    conditions: step('faccao'),
    weight: 0,
    text: 'Investigação da facção: o grupo usa um lava-jato para movimentar dinheiro.',
    choices: [
      { id: 'monitorar', label: 'Monitorar o movimento', effects: { police: { caseScore: 2 }, followUps: next('pol_caso_faccao_3') }, resultText: 'O padrão ficou claro.' },
      { id: 'abordar', label: 'Abordar o gerente do lava-jato', effects: { police: { caseScore: -1 }, followUps: next('pol_caso_faccao_3') }, resultText: 'No dia seguinte o lava-jato fechou "para reforma".' },
    ],
  },
  {
    id: 'pol_caso_faccao_3',
    trigger: 'followUp',
    conditions: step('faccao'),
    weight: 0,
    text: 'Investigação da facção: um policial de outra unidade parece estar passando informações para eles.',
    choices: [
      { id: 'corregedoria', label: 'Levar à corregedoria', effects: { police: { caseScore: 1, merit: 2 }, stats: { happiness: -2 }, followUps: next('pol_caso_faccao_4') }, resultText: 'O vazamento parou. Alguns colegas passaram a evitar você.' },
      { id: 'contornar', label: 'Esconder dele os próximos passos', effects: { police: { caseScore: 1 }, followUps: next('pol_caso_faccao_4') }, resultText: 'Você passou a trabalhar com um grupo menor.' },
      { id: 'ignorar', label: 'Fingir que não percebeu', effects: { police: { caseScore: -2 }, followUps: next('pol_caso_faccao_4') }, resultText: 'Coincidência ou não, a facção mudou de endereço.' },
    ],
  },
  {
    id: 'pol_caso_faccao_4',
    trigger: 'followUp',
    conditions: step('faccao'),
    weight: 0,
    text: 'Investigação da facção: a operação está pronta. Na madrugada, um dos alvos reage.',
    choices: [
      { id: 'avancar', label: 'Entrar com a equipe', effects: { police: { caseEnd: true, shootout: 'avancar' } }, resultText: 'Mandados em mãos, vocês entraram.' },
      { id: 'abrigar', label: 'Cercar e esperar a rendição', effects: { police: { caseEnd: true, shootout: 'abrigar' } }, resultText: 'Vocês cercaram o local.' },
    ],
  },
];
