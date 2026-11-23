import type { GameEvent } from '../../../engine';

/**
 * Vida na prisão e reintegração (release 0.0.2, fase 7). Tom sóbrio, violência curta e não gráfica, NENHUMA
 * violência sexual (nem insinuação; `tests/prison.test.ts` verifica). Presídios e programas fictícios.
 */
const IN = { minAge: 18, crime: { imprisoned: true, regime: ['fechado' as const, 'semiaberto' as const] } };
const COMUM = { minAge: 18, crime: { imprisoned: true, wing: 'comum' as const, regime: ['fechado' as const, 'semiaberto' as const] } };
const ESPECIAL = { minAge: 18, crime: { imprisoned: true, wing: 'especial' as const } };

export const PRISON_EVENTS: readonly GameEvent[] = [
  {
    id: 'prisao_briga_patio',
    conditions: COMUM,
    weight: 6,
    cooldownYears: 2,
    text: 'Uma discussão no banho de sol vira briga. Dois presos vêm na sua direção.',
    choices: [
      { id: 'lutar', label: 'Se defender (você sabe lutar)', effects: { crime: { behavior: -10, rep: 4 }, fighter: { reputation: 1 } }, risk: { chance: 0.3, effects: { crime: { behavior: -15 }, health: { injury: 'random' } }, resultText: 'Você se defendeu, mas saiu machucad{o/a} e foi para o isolamento.' }, resultText: 'Em segundos acabou. Ninguém mais mexeu com você naquela ala.' },
      { id: 'separar', label: 'Separar a briga', effects: { crime: { behavior: 5 } }, resultText: 'Você separou os dois. Os agentes anotaram seu nome — do jeito bom.' },
      { id: 'sair', label: 'Sair de perto', effects: { crime: { behavior: 3 }, stats: { happiness: -1 } }, resultText: 'Você foi para o outro lado do pátio. Melhor assim.' },
    ],
  },
  {
    id: 'prisao_recrutamento',
    conditions: { ...COMUM, crime: { ...COMUM.crime, faction: false } },
    weight: 5,
    cooldownYears: 3,
    text: 'Um preso influente diz que lá dentro "ninguém fica sozinho" e oferece proteção da facção.',
    choices: [
      { id: 'aceitar', label: 'Aceitar a proteção', effects: { crime: { joinFaction: 'local', protection: true } }, resultText: 'Você ganhou proteção. E uma dívida que não se paga com dinheiro.' },
      { id: 'recusar', label: 'Recusar', effects: { stats: { happiness: -2 } }, risk: { chance: 0.25, effects: { health: { injury: 'random' }, stats: { happiness: -4 } }, resultText: 'Recusar teve preço: você apanhou no corredor.' }, resultText: 'Ele deu de ombros. "Depois não reclama."' },
    ],
  },
  {
    id: 'prisao_divida',
    conditions: COMUM,
    weight: 4,
    cooldownYears: 3,
    text: 'Um colega de cela diz que você está devendo pelo "favor" de semana passada.',
    choices: [
      { id: 'pagar', label: 'Pedir para a família depositar', effects: { economy: { post: { cat: 'eventos', amount: -2000, label: 'Dívida na prisão' } }, social: { parentsAffection: -3 } }, resultText: 'Pago. Sua mãe não perguntou para quê.' },
      { id: 'servico', label: 'Pagar fazendo a faxina dele', effects: { stats: { happiness: -3 } }, resultText: 'Um mês limpando a cela dos outros.' },
      { id: 'recusar', label: 'Dizer que não deve nada', effects: { crime: { behavior: -5 } }, risk: { chance: 0.35, effects: { health: { injury: 'random' } }, resultText: 'A conversa terminou em agressão.' }, resultText: 'Ele recuou. Por enquanto.' },
    ],
  },
  {
    id: 'prisao_revista',
    conditions: IN,
    weight: 5,
    cooldownYears: 2,
    text: 'Revista surpresa na madrugada. Os agentes viram a cela do avesso.',
    choices: [
      { id: 'colaborar', label: 'Colaborar', effects: { crime: { behavior: 4 } }, resultText: 'Não acharam nada com você.' },
      { id: 'assumir', label: 'Assumir um celular que não era seu', effects: { crime: { behavior: -12, rep: 5 } }, resultText: 'Falta grave na sua ficha. Na ala, ganhou respeito.' },
    ],
  },
  {
    id: 'prisao_rebeliao',
    conditions: COMUM,
    weight: 2,
    cooldownYears: 5,
    text: 'Rebelião: presos tomam um pavilhão e exigem melhores condições.',
    choices: [
      { id: 'aderir', label: 'Ficar do lado dos presos', effects: { crime: { behavior: -20, rep: 6 } }, risk: { chance: 0.15, effects: { health: { injury: 'random' }, crime: { behavior: -10 } }, resultText: 'A retomada foi dura e você se feriu.' }, resultText: 'A rebelião acabou em negociação. Seu nome ficou marcado.' },
      { id: 'esconder', label: 'Se esconder na cela', effects: { stats: { happiness: -4 } }, resultText: 'Horas de tensão sem saber o que acontecia.' },
      { id: 'agentes', label: 'Ajudar os agentes a tirar os feridos', effects: { crime: { behavior: 15 } }, risk: { chance: 0.2, effects: { crime: { behavior: 10 }, stats: { happiness: -6 } }, resultText: 'Alguns presos passaram a te chamar de "x-9".' }, resultText: 'O diretor fez questão de registrar sua ajuda.' },
    ],
  },
  {
    id: 'prisao_transferencia',
    conditions: IN,
    weight: 3,
    cooldownYears: 4,
    text: 'Chega a notícia: você vai ser transferid{o/a} para uma unidade longe da sua família.',
    choices: [
      { id: 'aceitar', label: 'Aceitar', effects: { stats: { happiness: -5 } }, resultText: 'Visitas ficaram mais raras.' },
      { id: 'pedir', label: 'Pedir para ficar perto da família', effects: { crime: { behavior: 2 } }, risk: { chance: 0.5, effects: { stats: { happiness: -5 } }, resultText: 'Pedido negado.' }, resultText: 'O juiz atendeu o pedido. Você ficou.' },
    ],
  },
  {
    id: 'prisao_fuga',
    conditions: { ...COMUM, crime: { ...COMUM.crime, regime: ['fechado'] } },
    weight: 2,
    cooldownYears: 5,
    text: 'Um grupo da sua ala planeja uma fuga e quer você junto.',
    choices: [
      { id: 'fugir', label: 'Fugir com eles', effects: { crime: { escape: true } }, resultText: 'Na noite combinada, vocês partiram.' },
      { id: 'recusar', label: 'Recusar e ficar quieto', effects: { crime: { behavior: 3 } }, resultText: 'Dias depois, todos foram recapturados.' },
      { id: 'denunciar', label: 'Avisar a direção', effects: { crime: { behavior: 15 } }, risk: { chance: 0.3, effects: { health: { injury: 'random' }, crime: { behavior: 15 } }, resultText: 'Descobriram quem avisou.' }, resultText: 'A fuga foi frustrada. Ninguém soube que foi você.' },
    ],
  },
  {
    id: 'prisao_visita_nao_veio',
    conditions: { ...IN, hasRelation: ['mae', 'pai', 'conjuge', 'parceiro'] },
    weight: 4,
    cooldownYears: 3,
    text: 'Era para ser dia de visita. Você passou a manhã olhando o portão.',
    choices: [
      { id: 'carta', label: 'Escrever uma carta', effects: { social: { parentsAffection: 3 }, stats: { happiness: -2 } }, resultText: 'A resposta chegou semanas depois. Valeu a espera.' },
      { id: 'aceitar', label: 'Engolir em seco', effects: { stats: { happiness: -5 } }, resultText: 'Ninguém viu você chorar.' },
    ],
  },
  {
    id: 'prisao_mentor',
    once: true,
    conditions: IN,
    weight: 3,
    text: 'Um preso mais velho, que cumpre pena há décadas, diz que viu em você "alguém que ainda dá tempo de salvar".',
    choices: [
      { id: 'ouvir', label: 'Ouvir os conselhos dele', effects: { crime: { behavior: 10, rep: -8 }, stats: { intelligence: 2, happiness: 3 }, setFlags: { mentor_prisao: true } }, resultText: 'Ele te ensinou a ler devagar e a pensar antes de agir. Você nunca esqueceu.' },
      { id: 'ignorar', label: 'Não dar ouvidos', effects: {}, resultText: '"Cada um sabe a sua hora", ele disse.' },
    ],
  },
  {
    id: 'prisao_carta_filho',
    conditions: { ...IN, children: { min: 1 } },
    weight: 4,
    cooldownYears: 3,
    text: 'Chega uma carta com letra de criança: um desenho de vocês dois e um "volta logo".',
    choices: [
      { id: 'responder', label: 'Responder com um desenho também', effects: { stats: { happiness: 6 }, crime: { behavior: 4 } }, resultText: 'Você guardou a carta embaixo do colchão.' },
      { id: 'guardar', label: 'Guardar sem responder', effects: { stats: { happiness: -2 } }, resultText: 'Doeu demais para responder.' },
    ],
  },
  {
    id: 'prisao_curso',
    conditions: IN,
    weight: 4,
    cooldownYears: 2,
    text: 'Abriram vagas para um curso profissionalizante de eletricista dentro da unidade.',
    choices: [
      { id: 'fazer', label: 'Se inscrever', effects: { crime: { remission: 0.25, behavior: 5 }, stats: { intelligence: 2 }, setFlags: { curso_prisao: true } }, resultText: 'Certificado na mão e dias a menos de pena.' },
      { id: 'nao', label: 'Deixar para lá', effects: {}, resultText: 'As vagas acabaram no mesmo dia.' },
    ],
  },
  {
    id: 'prisao_leitura',
    conditions: IN,
    weight: 3,
    cooldownYears: 3,
    text: 'A biblioteca da unidade tem um projeto: cada livro lido e resenhado desconta dias da pena.',
    choices: [
      { id: 'ler', label: 'Entrar no projeto', effects: { crime: { remission: 0.15 }, stats: { intelligence: 2, happiness: 2 } }, resultText: 'Você descobriu que gosta de ler.' },
      { id: 'nao', label: 'Não é para mim', effects: {}, resultText: 'Os livros ficaram na estante.' },
    ],
  },
  {
    id: 'prisao_campeonato',
    conditions: IN,
    weight: 3,
    cooldownYears: 2,
    text: 'Campeonato de futebol entre as alas da unidade.',
    choices: [
      { id: 'jogar', label: 'Jogar', effects: { stats: { athletic: 1, happiness: 4 }, crime: { behavior: 3 } }, resultText: 'Sua ala levou a taça de lata. Melhor dia do ano.' },
      { id: 'torcer', label: 'Só torcer', effects: { stats: { happiness: 2 } }, resultText: 'Gritou até ficar rouco.' },
    ],
  },
  {
    id: 'prisao_aniversario',
    conditions: IN,
    weight: 3,
    cooldownYears: 3,
    text: 'Seu aniversário na prisão. Um colega guardou um pedaço de bolo da visita dele para você.',
    choices: [
      { id: 'agradecer', label: 'Agradecer e dividir', effects: { stats: { happiness: 4 } }, resultText: 'Pequenos gestos pesam muito lá dentro.' },
      { id: 'sozinho', label: 'Passar o dia em silêncio', effects: { stats: { happiness: -3 } }, resultText: 'O dia demorou a passar.' },
    ],
  },
  {
    id: 'prisao_colega_cela',
    conditions: IN,
    weight: 4,
    cooldownYears: 2,
    text: 'Chegou um novo colega de cela, assustado, no primeiro dia.',
    choices: [
      { id: 'acolher', label: 'Explicar como as coisas funcionam', effects: { stats: { happiness: 2 }, crime: { behavior: 3 } }, resultText: 'Ele virou um amigo leal.' },
      { id: 'ignorar', label: 'Ignorar', effects: {}, resultText: 'Cada um com seus problemas.' },
    ],
  },
  {
    id: 'prisao_progressao',
    conditions: { ...IN, crime: { ...IN.crime, regime: ['fechado'] } },
    weight: 3,
    cooldownYears: 3,
    text: 'A defesa pede ao juiz a progressão de regime antecipada pelo seu comportamento.',
    choices: [
      { id: 'pedir', label: 'Seguir com o pedido', effects: { crime: { behavior: 2 } }, risk: { chance: 0.35, effects: { crime: { behavior: 8, remission: 0.5 } }, resultText: 'O juiz reconheceu seu comportamento e descontou mais tempo.' }, resultText: 'Negado por enquanto. Tente de novo depois.' },
      { id: 'esperar', label: 'Esperar o tempo certo', effects: {}, resultText: 'Paciência é a moeda daqui.' },
    ],
  },
  {
    id: 'prisao_surto',
    conditions: IN,
    weight: 2,
    cooldownYears: 4,
    text: 'Um surto de gripe se espalha pela unidade superlotada.',
    choices: [
      { id: 'enfermaria', label: 'Ir à enfermaria logo', effects: { stats: { health: -2 } }, resultText: 'Você se tratou cedo e melhorou.' },
      { id: 'aguentar', label: 'Aguentar na cela', effects: { stats: { health: -6, happiness: -2 } }, resultText: 'Foram semanas difíceis.' },
    ],
  },
  {
    id: 'prisao_ala_reconhecido',
    conditions: ESPECIAL,
    weight: 5,
    cooldownYears: 3,
    text: 'Na ala especial, um preso transferido reconhece você dos tempos de farda.',
    choices: [
      { id: 'conversar', label: 'Conversar com calma', effects: { stats: { happiness: 1 }, crime: { behavior: 3 } }, resultText: 'Ele também já foi policial. Vocês dividiram histórias e arrependimentos.' },
      { id: 'evitar', label: 'Pedir para mudar de cela', effects: { stats: { happiness: -2 } }, resultText: 'O pedido foi aceito.' },
    ],
  },
  {
    id: 'prisao_ala_vergonha',
    once: true,
    conditions: ESPECIAL,
    weight: 4,
    text: 'Seu antigo batalhão aparece no noticiário. Você assiste da cela, sem farda e sem distintivo.',
    choices: [
      { id: 'refletir', label: 'Escrever o que aprendeu', effects: { stats: { intelligence: 1, happiness: -2 }, crime: { behavior: 5 } }, resultText: 'Páginas e páginas num caderno.' },
      { id: 'desligar', label: 'Pedir para desligar a TV', effects: { stats: { happiness: -4 } }, resultText: 'Ninguém comentou.' },
    ],
  },

  // --- saída e reintegração ---
  {
    id: 'prisao_reintegracao',
    trigger: 'auto',
    conditions: { minAge: 18, flagsAll: ['egresso'], crime: { imprisoned: false } },
    weight: 0,
    text: 'Você saiu da prisão. A rua parece maior e mais barulhenta do que você lembrava.',
    choices: [
      { id: 'programa', label: 'Entrar no Programa Portas Abertas', effects: { clearFlags: ['egresso'], setFlags: { portas_abertas: true, recomecou: true }, stats: { happiness: 4 }, crime: { rep: -10 } }, resultText: 'O programa ajuda com currículo, curso e empresas parceiras que contratam egressos.' },
      { id: 'familia', label: 'Voltar para a casa da família', effects: { clearFlags: ['egresso'], social: { parentsAffection: 5 }, stats: { happiness: 3 } }, resultText: 'Sua mãe deixou o quarto do jeito que estava.' },
      { id: 'antigos', label: 'Procurar os antigos parceiros', effects: { clearFlags: ['egresso'], crime: { rep: 4 }, setFlags: { voltou_ao_crime: true } }, resultText: 'Eles te receberam com festa. E com planos.' },
    ],
  },
  {
    id: 'prisao_egresso_emprego',
    conditions: { minAge: 18, flagsAll: ['recomecou'], crime: { imprisoned: false, record: true }, economy: { employed: false } },
    weight: 4,
    cooldownYears: 3,
    text: 'Na entrevista de emprego, o recrutador para na pergunta sobre antecedentes criminais.',
    choices: [
      { id: 'verdade', label: 'Contar a verdade', effects: { stats: { happiness: 1 } }, risk: { chance: 0.5, effects: { stats: { happiness: -4 } }, resultText: '"Vamos entrar em contato." Ninguém entrou.' }, resultText: 'O recrutador agradeceu a sinceridade e te deu uma chance de experiência.' },
      { id: 'omitir', label: 'Omitir', effects: {}, risk: { chance: 0.4, effects: { stats: { happiness: -5 } }, resultText: 'Descobriram na checagem e a vaga sumiu.' }, resultText: 'Passou na entrevista. Agora é torcer.' },
    ],
  },
  {
    id: 'prisao_convite_volta',
    conditions: { minAge: 18, flagsAll: ['recomecou'], crime: { imprisoned: false, record: true } },
    weight: 3,
    cooldownYears: 4,
    text: 'Um antigo parceiro aparece com "um trabalho rápido, só desta vez".',
    choices: [
      { id: 'recusar', label: 'Recusar de vez', effects: { stats: { happiness: 2 }, crime: { rep: -5 } }, resultText: 'Ele foi embora balançando a cabeça. Você respirou aliviad{o/a}.' },
      { id: 'aceitar', label: 'Aceitar', effects: { crime: { rep: 5, wanted: 15 }, clearFlags: ['recomecou'], setFlags: { voltou_ao_crime: true } }, resultText: 'Foi só desta vez. Até a próxima.' },
    ],
  },
];
