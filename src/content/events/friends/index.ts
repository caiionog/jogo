import type { GameEvent } from '../../../engine';

/**
 * Eventos de grupo (release 0.0.3): sorteados depois de "Passar tempo com os amigos" (`FRIENDS.groupEvents`).
 * `trigger: 'followUp'` e peso 0: a engine escolhe e preenche {pessoa} e {pessoa2} com dois amigos presentes.
 * Sem condição `relationship` (as pessoas já vêm escolhidas). Nada sexual, nada gráfico.
 */
const group = (e: Omit<GameEvent, 'trigger' | 'weight'>): GameEvent => ({ trigger: 'followUp', weight: 0, ...e });

export const FRIEND_GROUP_EVENTS: readonly GameEvent[] = [
  // ——— dois amigos se conhecem ———
  group({
    id: 'grupo_se_conhecem',
    tone: 'good',
    conditions: { minAge: 6 },
    text: '{pessoa} e {pessoa2} nunca tinham se falado. Hoje descobriram que gostam das mesmas coisas.',
    choices: [
      { id: 'aproximar', label: 'Puxar mais assunto entre os dois', resultText: '{pessoa} e {pessoa2} ficaram amigos. Agora a turma tem mais um laço.', effects: { social: { pairFriends: 'amizade', groupAffection: 2 }, stats: { happiness: 3 } } },
      { id: 'deixar', label: 'Deixar rolar sozinho', resultText: 'Os dois conversaram um pouco, e cada um voltou para o seu canto.', effects: { stats: { happiness: 1 } } },
    ],
  }),
  group({
    id: 'grupo_rivais',
    tone: 'bad',
    conditions: { minAge: 10 },
    text: '{pessoa} e {pessoa2} discordaram de tudo hoje, de time de futebol a ponto de ônibus. O clima esquentou.',
    choices: [
      { id: 'acalmar', label: 'Tentar fazer as pazes', resultText: 'Você mediou a conversa e os dois apertaram as mãos, meio a contragosto.', effects: { social: { groupAffection: 1 }, stats: { happiness: 1 } }, risk: { chance: 0.35, resultText: 'Não adiantou: {pessoa} e {pessoa2} viraram rivais declarados.', effects: { social: { pairFriends: 'rivalidade' }, stats: { happiness: -2 } } } },
      { id: 'lado', label: 'Ficar do lado de {pessoa}', resultText: '{pessoa} gostou do apoio. {pessoa2} saiu bufando, e agora os dois mal se olham.', effects: { social: { affection: 5, pairFriends: 'rivalidade' }, stats: { happiness: -1 } } },
    ],
  }),

  // ——— casal entre NPCs ———
  group({
    id: 'grupo_casal_adulto',
    tone: 'good',
    conditions: { minAge: 18 },
    text: 'Você reparou que {pessoa} e {pessoa2} passaram a noite inteira conversando num canto, só os dois.',
    choices: [
      { id: 'cupido', label: 'Dar uma forcinha', resultText: 'Você deu um jeito de deixar os dois a sós. Semanas depois, {pessoa} e {pessoa2} assumiram o namoro.', effects: { social: { npcCouple: true, groupAffection: 2 }, stats: { happiness: 3 } } },
      { id: 'zoar', label: 'Zoar os dois na frente de todos', resultText: 'Todo mundo riu, menos {pessoa} e {pessoa2}, que ficaram vermelhos.', effects: { social: { affection: -3 }, stats: { happiness: 2 } }, risk: { chance: 0.4, tone: 'good', resultText: 'A zoeira quebrou o gelo: {pessoa} e {pessoa2} começaram a namorar.', effects: { social: { npcCouple: true }, stats: { happiness: 3 } } } },
      { id: 'quieto', label: 'Não se meter', resultText: 'Você guardou para si. O tempo dirá.' },
    ],
  }),
  group({
    id: 'grupo_casal_teen',
    tone: 'good',
    conditions: { minAge: 14, maxAge: 17 },
    text: 'No fim do rolê, {pessoa} e {pessoa2} saíram de mãos dadas, morrendo de vergonha.',
    choices: [
      { id: 'apoiar', label: 'Ajudar os dois a trocar telefone', resultText: 'Você fez a ponte, e agora {pessoa} e {pessoa2} estão namorando. A turma toda aprovou.', effects: { social: { npcCouple: true, groupAffection: 2 }, stats: { happiness: 3 } } },
      { id: 'segredo', label: 'Guardar segredo', resultText: '{pessoa} agradeceu a discrição com um sorriso tímido.', effects: { social: { affection: 4 } } },
    ],
  }),

  // ——— briga no churrasco ———
  group({
    id: 'grupo_briga_churrasco',
    tags: ['briga'],
    tone: 'bad',
    conditions: { minAge: 18 },
    text: 'Depois de umas cervejas, {pessoa} e {pessoa2} começaram a discutir perto da churrasqueira. Já tem gente empurrando.',
    choices: [
      { id: 'separar', label: 'Entrar no meio e separar', resultText: 'Você segurou os dois com firmeza e a briga acabou antes de começar. A turma ficou impressionada.', effects: { social: { groupAffection: 3 }, fighter: { reputation: 1 }, stats: { happiness: 2 } } },
      { id: 'brigar', label: 'Tomar as dores de {pessoa}', resultText: 'Teve empurra-empurra, mas o pessoal apartou a tempo. {pessoa} agradeceu o apoio. {pessoa2}, nem tanto.', effects: { social: { affection: 5, pairFriends: 'rivalidade' }, stats: { happiness: -2 } }, risk: { chance: 0.4, resultText: 'Na confusão, você levou a pior. O churrasco acabou mais cedo para você.', effects: { health: { injury: 'random' }, stats: { happiness: -5 } } } },
      { id: 'sair', label: 'Pegar seu prato e sair de perto', resultText: 'Os outros resolveram. Você comeu sua picanha em paz.', effects: { stats: { happiness: -1 } } },
    ],
  }),

  // ——— alguém some com a conta ———
  group({
    id: 'grupo_conta_sumiu',
    tone: 'bad',
    conditions: { minAge: 18 },
    text: 'Na hora da conta, {pessoa} foi "ao banheiro" e não voltou. A conta ficou na mesa.',
    choices: [
      { id: 'pagar', label: 'Pagar a parte de {pessoa}', resultText: 'Você cobriu a parte que faltava. Ficou a lição (e a mensagem cobrando no dia seguinte).', effects: { money: -150, social: { affection: -3 }, stats: { happiness: -2 } } },
      { id: 'dividir', label: 'Propor dividir com {pessoa2} e o resto', resultText: 'Cada um pôs um pouco a mais. {pessoa2} reclamou, mas ajudou.', effects: { money: -60, social: { affection: -4 }, stats: { happiness: -1 } } },
      { id: 'ligar', label: 'Ligar para {pessoa} na hora', resultText: '{pessoa} atendeu sem graça, voltou e pagou. A turma não deixou passar a zoeira.', effects: { social: { affection: -2, groupAffection: 1 }, stats: { happiness: 1 } } },
    ],
  }),

  // ——— foto que vira lembrança ———
  group({
    id: 'grupo_foto',
    tone: 'good',
    conditions: { minAge: 6 },
    text: '{pessoa} juntou todo mundo para uma foto. {pessoa2} fez uma careta no último segundo.',
    choices: [
      { id: 'guardar', label: 'Guardar a foto de recordação', resultText: 'A foto virou a favorita da turma. Daqui a anos, vocês ainda vão rir dela.', effects: { social: { groupAffection: 3 }, stats: { happiness: 4 } } },
      { id: 'outra', label: 'Pedir outra, séria', resultText: 'Saiu certinha. Mas todo mundo prefere a da careta.', effects: { social: { groupAffection: 1 }, stats: { happiness: 2 } } },
    ],
  }),

  // ——— amigo pede ajuda na frente de todos ———
  group({
    id: 'grupo_pedido_ajuda',
    conditions: { minAge: 18 },
    text: 'Na frente de todo mundo, {pessoa} pediu sua ajuda: está sem grana e precisa fazer uma mudança no fim de semana.',
    choices: [
      { id: 'dinheiro', label: 'Emprestar R$ 500', resultText: '{pessoa} te abraçou na hora. A turma toda viu quem é amig{o/a} de verdade.', effects: { money: -500, social: { affection: 10, groupAffection: 2 }, stats: { happiness: 2 } } },
      { id: 'tempo', label: 'Ajudar a carregar as caixas', resultText: 'Você passou o sábado carregando caixas com {pessoa} e {pessoa2}. Cansativo, mas divertido.', effects: { social: { affection: 7, groupAffection: 1 }, stats: { happiness: 1, health: -1 } } },
      { id: 'nao', label: 'Dizer que não dá', resultText: '{pessoa} disse que entendia, mas o silêncio da mesa pesou.', effects: { social: { affection: -6, groupAffection: -1 }, stats: { happiness: -2 } } },
    ],
  }),

  // ——— ex aparece ———
  group({
    id: 'grupo_ex_aparece',
    conditions: { minAge: 15 },
    text: '{pessoa2} chegou dizendo "trouxe uma pessoa", e era alguém que você namorou. O clima ficou estranho.',
    choices: [
      { id: 'cumprimentar', label: 'Cumprimentar numa boa', resultText: 'Vocês conversaram numa boa. No fim, foi até bom colocar o passado no lugar.', effects: { stats: { happiness: 2 } }, risk: { chance: 0.3, resultText: 'A conversa reabriu velhas feridas. Você foi embora mais cedo.', effects: { stats: { happiness: -4 } } } },
      { id: 'evitar', label: 'Fugir dessa pessoa a noite toda', resultText: 'Você ficou grudad{o/a} em {pessoa} o tempo todo. Deu certo, mas não foi a mesma coisa.', effects: { social: { affection: 2 }, stats: { happiness: -2 } } },
      { id: 'sair', label: 'Inventar uma desculpa e ir embora', resultText: 'Você saiu de fininho. {pessoa2} mandou mensagem pedindo desculpas.', effects: { stats: { happiness: -3 } } },
    ],
  }),

  // ——— aniversário surpresa ———
  group({
    id: 'grupo_surpresa',
    tone: 'good',
    conditions: { minAge: 10 },
    text: '{pessoa} cochichou: o aniversário de {pessoa2} é amanhã. Que tal uma surpresa?',
    choices: [
      { id: 'organizar', label: 'Organizar a surpresa', resultText: '{pessoa2} se emocionou com o bolo e os balões. A turma toda te elogiou.', effects: { money: -80, social: { groupAffection: 3 }, stats: { happiness: 4 } } },
      { id: 'cartao', label: 'Só assinar um cartão', resultText: 'Simples, mas {pessoa2} gostou do carinho.', effects: { social: { groupAffection: 1 }, stats: { happiness: 1 } } },
    ],
  }),

  // ——— karaokê ———
  group({
    id: 'grupo_karaoke',
    tone: 'good',
    conditions: { minAge: 16 },
    text: '{pessoa} achou um karaokê e já colocou seu nome na lista. {pessoa2} escolheu a música: aquele sucesso brega que todo mundo sabe.',
    choices: [
      { id: 'cantar', label: 'Soltar a voz', resultText: 'Desafinou? Desafinou. Mas a turma cantou junto, e o vídeo virou figurinha no grupo.', effects: { social: { groupAffection: 2 }, stats: { happiness: 5 } } },
      { id: 'dueto', label: 'Chamar {pessoa} para um dueto', resultText: 'O dueto foi um desastre lindo. {pessoa} não para de falar disso.', effects: { social: { affection: 5 }, stats: { happiness: 4 } } },
      { id: 'fugir', label: 'Fugir do palco', resultText: 'Você escapou, mas a zoeira da turma não perdoou.', effects: { stats: { happiness: -1 } } },
    ],
  }),

  // ——— pelada que vira rixa ———
  group({
    id: 'grupo_pelada_rixa',
    tags: ['briga'],
    tone: 'bad',
    conditions: { minAge: 12 },
    text: 'Na pelada, {pessoa} deu uma entrada dura em {pessoa2}. Os dois ficaram cara a cara.',
    choices: [
      { id: 'apartar', label: 'Apartar e seguir o jogo', resultText: 'Você separou os dois e o jogo continuou. No fim, todo mundo dividiu um refrigerante.', effects: { social: { groupAffection: 2 }, stats: { happiness: 2 } } },
      { id: 'juiz', label: 'Marcar falta e expulsar {pessoa}', resultText: '{pessoa} saiu de cara amarrada. {pessoa2} te agradeceu, mas a rixa entre os dois ficou.', effects: { social: { affection: -4, pairFriends: 'rivalidade' } } },
      { id: 'entrar', label: 'Tirar satisfação também', resultText: 'Virou bate-boca geral, mas ninguém passou disso.', effects: { stats: { happiness: -2 } }, risk: { chance: 0.25, resultText: 'Na confusão, você tropeçou e se machucou.', effects: { health: { injury: 'random' }, stats: { happiness: -4 } } } },
    ],
  }),

  // ——— piada que ofende ———
  group({
    id: 'grupo_piada',
    tone: 'bad',
    conditions: { minAge: 10 },
    text: 'Você fez uma piada sobre {pessoa}, todo mundo riu... menos {pessoa}.',
    choices: [
      { id: 'desculpa', label: 'Pedir desculpas na hora', resultText: '{pessoa} aceitou as desculpas. Ficou um climão rápido, que passou.', effects: { social: { affection: 1 } } },
      { id: 'dobrar', label: 'Dizer que foi só brincadeira', resultText: '{pessoa} foi embora com o orgulho ferido. {pessoa2} te chamou num canto: "pegou mal".', effects: { social: { affection: -8, groupAffection: -1 }, stats: { happiness: -2 } } },
    ],
  }),

  // ——— alguém passa mal ———
  group({
    id: 'grupo_passou_mal',
    conditions: { minAge: 18 },
    text: '{pessoa} exagerou na comida e na bebida e começou a passar mal. {pessoa2} olhou para você: "e agora?"',
    choices: [
      { id: 'cuidar', label: 'Levar {pessoa} para casa', resultText: 'Você chamou um carro, deixou {pessoa} em segurança e ainda mandou mensagem de manhã. Gratidão eterna.', effects: { money: -60, social: { affection: 9 }, stats: { happiness: 1 } } },
      { id: 'agua', label: 'Água, sombra e paciência', resultText: 'Com {pessoa2}, você cuidou até {pessoa} melhorar. A festa seguiu.', effects: { social: { affection: 5, groupAffection: 1 } } },
      { id: 'ignorar', label: 'Deixar com os outros', resultText: 'Outra pessoa cuidou. {pessoa} reparou quem ajudou e quem não ajudou.', effects: { social: { affection: -5 } } },
    ],
  }),

  // ——— segredo revelado ———
  group({
    id: 'grupo_segredo',
    tone: 'bad',
    conditions: { minAge: 12 },
    text: 'No meio da conversa, {pessoa2} soltou sem querer um segredo que {pessoa} tinha contado só para vocês dois.',
    choices: [
      { id: 'defender', label: 'Mudar de assunto e proteger {pessoa}', resultText: 'Você desviou o papo rapidinho. {pessoa} percebeu e agradeceu depois.', effects: { social: { affection: 6 } } },
      { id: 'cobrar', label: 'Cobrar {pessoa2} na hora', resultText: '{pessoa2} pediu desculpas, mas os dois ficaram estremecidos.', effects: { social: { affection: 3, pairFriends: 'rivalidade' } } },
      { id: 'rir', label: 'Rir junto', resultText: '{pessoa} ficou sem chão. Vai demorar para confiar em você de novo.', effects: { social: { affection: -10 }, stats: { happiness: -1 } } },
    ],
  }),

  // ——— carona ———
  group({
    id: 'grupo_carona',
    conditions: { minAge: 18 },
    text: 'Fim de noite, e {pessoa} e {pessoa2} moram do outro lado da cidade. Os dois olham para você.',
    choices: [
      { id: 'levar', label: 'Dar carona (ou rachar o carro de aplicativo)', resultText: 'Você levou os dois. No caminho, a conversa foi a melhor parte da noite.', effects: { money: -50, social: { groupAffection: 3 }, stats: { happiness: 2 } } },
      { id: 'nao', label: 'Cada um se vira', resultText: 'Os dois foram juntos de ônibus. Parece que ficaram mais próximos.', effects: { social: { pairFriends: 'amizade' } } },
    ],
  }),

  // ——— desafio na praia/rolê (teen e adulto) ———
  group({
    id: 'grupo_desafio',
    conditions: { minAge: 12 },
    text: '{pessoa} desafiou a turma: quem conseguir ficar mais tempo sem olhar o celular ganha. {pessoa2} já está suando.',
    choices: [
      { id: 'topar', label: 'Topar o desafio', resultText: 'Você aguentou firme e conversou de verdade com todo mundo. Que dia bom.', effects: { social: { groupAffection: 2 }, stats: { happiness: 4 } } },
      { id: 'recusar', label: 'Dizer que está esperando uma mensagem', resultText: 'A turma vaiou, mas deixou passar.', effects: { stats: { happiness: -1 } } },
    ],
  }),

  // ——— infância (6–11) ———
  group({
    id: 'grupo_briga_brinquedo',
    tone: 'bad',
    conditions: { minAge: 6, maxAge: 11 },
    text: '{pessoa} e {pessoa2} estão puxando o mesmo brinquedo, cada um de um lado, e ninguém solta.',
    choices: [
      { id: 'revezar', label: 'Propor revezar', resultText: 'Cada um brincou um pouco, e logo os dois inventaram um jogo juntos.', effects: { social: { pairFriends: 'amizade', groupAffection: 2 }, stats: { happiness: 2 } } },
      { id: 'pegar', label: 'Pegar o brinquedo para você', resultText: 'Os dois ficaram bravos com você, mas pelo menos pararam de brigar entre si.', effects: { social: { groupAffection: -2 }, stats: { happiness: 1 } } },
      { id: 'adulto', label: 'Chamar um adulto', resultText: 'O adulto guardou o brinquedo e ninguém brincou com ele. Pelo menos acabou o choro.' },
    ],
  }),
  group({
    id: 'grupo_machucou_brincando',
    conditions: { minAge: 6, maxAge: 11 },
    text: 'Correndo atrás de {pessoa2}, {pessoa} tropeçou e ralou o joelho. Começou a chorar.',
    choices: [
      { id: 'ajudar', label: 'Ajudar {pessoa} e chamar um adulto', resultText: 'Um curativo, um copo de suco, e {pessoa} voltou a brincar. Fez questão de te agradecer.', effects: { social: { affection: 6 }, stats: { happiness: 2 } } },
      { id: 'continuar', label: 'Continuar brincando', resultText: '{pessoa2} foi ajudar. {pessoa} ficou de mal com você.', effects: { social: { affection: -4 } } },
    ],
  }),
  group({
    id: 'grupo_esconde_esconde',
    tone: 'good',
    conditions: { minAge: 6, maxAge: 11 },
    text: 'No esconde-esconde, você e {pessoa} acharam o esconderijo perfeito. {pessoa2} está procurando há um tempão.',
    choices: [
      { id: 'ficar', label: 'Ficar quietinh{o/a} até o fim', resultText: 'Vocês ganharam! {pessoa} disse que agora vocês são a melhor dupla do mundo.', effects: { social: { affection: 5 }, stats: { happiness: 4 } } },
      { id: 'revelar', label: 'Sair de surpresa e dar um susto', resultText: '{pessoa2} deu um pulo e todo mundo morreu de rir.', effects: { social: { groupAffection: 2 }, stats: { happiness: 3 } } },
    ],
  }),
  group({
    id: 'grupo_lanche_dividido',
    tone: 'good',
    conditions: { minAge: 6, maxAge: 11 },
    text: '{pessoa2} esqueceu o lanche em casa e ficou olhando para o seu biscoito. {pessoa} também tem um pacote.',
    choices: [
      { id: 'dividir', label: 'Dividir o seu biscoito', resultText: '{pessoa2} sorriu de orelha a orelha. {pessoa} abriu o pacote também, e virou um piquenique.', effects: { social: { groupAffection: 3 }, stats: { happiness: 3 } } },
      { id: 'comer', label: 'Comer tudo sozinh{o/a}', resultText: 'O biscoito estava ótimo. O clima, nem tanto.', effects: { social: { groupAffection: -1 } } },
    ],
  }),
];
