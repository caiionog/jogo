import type { GameEvent } from '../../engine';

/** Eventos de infância (3–12 anos). Flags criadas aqui alimentam sistemas futuros. */
export const CHILDHOOD_EVENTS: readonly GameEvent[] = [
  {
    id: 'child_playground_fight',
    conditions: { minAge: 6, maxAge: 12 },
    weight: 10,
    text: 'Um colega empurrou você no recreio na frente de todo mundo.',
    choices: [
      {
        id: 'fight',
        label: 'Empurrar de volta',
        effects: { stats: { happiness: 3 }, setFlags: { brigou_na_escola: true } },
        resultText: 'Você empurrou de volta e o colega recuou. A turma ficou impressionada.',
        risk: {
          chance: 0.4,
          effects: { stats: { health: -5, happiness: -4 }, setFlags: { brigou_na_escola: true } },
          resultText: 'Você revidou, mas levou a pior e voltou para casa com o olho roxo.',
        },
      },
      {
        id: 'teacher',
        label: 'Contar para a professora',
        effects: { stats: { happiness: -1, intelligence: 1 } },
        resultText: 'A professora deu uma bronca no colega. Alguns te chamaram de dedo-duro.',
      },
      {
        id: 'ignore',
        label: 'Ignorar e sair andando',
        effects: { stats: { happiness: -2 } },
        resultText: 'Você ignorou a provocação e foi brincar em outro lugar.',
      },
    ],
  },
  {
    id: 'child_martial_arts_invite',
    conditions: { minAge: 5, maxAge: 12, flagsNone: ['artesMarciais'] },
    weight: 8,
    once: true,
    text: 'Abriu uma academia de judô e jiu-jitsu perto de casa. Seus pais perguntam se você quer se matricular.',
    choices: [
      {
        id: 'judo',
        label: 'Quero fazer judô!',
        effects: { stats: { athletic: 3, happiness: 2 }, setFlags: { artesMarciais: 'judo', gostaDeLuta: true } },
        resultText: 'Você começou no judô e ganhou sua primeira faixa branca.',
      },
      {
        id: 'bjj',
        label: 'Quero fazer jiu-jitsu!',
        effects: { stats: { athletic: 3, happiness: 2 }, setFlags: { artesMarciais: 'jiujitsu', gostaDeLuta: true } },
        resultText: 'Você começou no jiu-jitsu e aprendeu sua primeira raspagem.',
      },
      {
        id: 'no',
        label: 'Não, obrigado',
        effects: {},
        resultText: 'Você preferiu não se matricular na academia.',
      },
    ],
  },
  {
    id: 'child_stray_dog',
    conditions: { minAge: 4, maxAge: 12 },
    weight: 6,
    once: true,
    text: 'Um cachorro de rua começou a seguir você até em casa.',
    choices: [
      {
        id: 'adopt',
        label: 'Pedir para adotar',
        effects: { stats: { happiness: 8 }, setFlags: { temCachorro: true } },
        resultText: 'Seus pais deixaram! Você ganhou um novo melhor amigo de quatro patas.',
        risk: { chance: 0.3, effects: { stats: { happiness: -3 } }, resultText: 'Seus pais não deixaram ficar com o cachorro. Você chorou a noite toda.' },
      },
      {
        id: 'feed',
        label: 'Só dar um pouco de comida',
        effects: { stats: { happiness: 2 } },
        resultText: 'Você dividiu seu lanche com o cachorro. Ele abanou o rabo feliz.',
      },
    ],
  },
  {
    id: 'child_found_money',
    conditions: { minAge: 5, maxAge: 12 },
    weight: 6,
    text: 'Você encontrou uma nota de 20 no chão da praça.',
    choices: [
      {
        id: 'keep',
        label: 'Guardar para você',
        effects: { money: 20, stats: { happiness: 2 } },
        resultText: 'Você guardou o dinheiro no seu cofrinho.',
      },
      {
        id: 'candy',
        label: 'Gastar tudo em doces',
        effects: { stats: { happiness: 5, health: -1 } },
        resultText: 'Você comprou doces até ter dor de barriga. Valeu a pena.',
      },
      {
        id: 'return',
        label: 'Procurar o dono',
        effects: { stats: { happiness: 1, intelligence: 1 } },
        resultText: 'Uma senhora agradeceu muito ao recuperar o dinheiro.',
      },
    ],
  },
  {
    id: 'child_neighbor_bully',
    conditions: { minAge: 7, maxAge: 12 },
    weight: 6,
    text: 'O garoto mais velho da rua tenta tomar sua bola.',
    choices: [
      {
        id: 'stand',
        label: 'Encarar e não soltar a bola',
        effects: { stats: { happiness: 4, athletic: 1 }, setFlags: { corajoso: true } },
        resultText: 'Você segurou firme. O valentão desistiu e foi embora.',
        risk: { chance: 0.45, effects: { stats: { health: -4, happiness: -3 } }, resultText: 'O valentão te derrubou e levou a bola.' },
      },
      {
        id: 'run',
        label: 'Correr para casa',
        effects: { stats: { athletic: 1, happiness: -2 } },
        resultText: 'Você correu mais rápido do que imaginava e chegou em casa a salvo.',
      },
      {
        id: 'give',
        label: 'Entregar a bola',
        effects: { stats: { happiness: -4 } },
        resultText: 'Você entregou a bola e ficou chateado o resto do dia.',
      },
    ],
  },
  {
    id: 'child_science_fair',
    conditions: { minAge: 7, maxAge: 12 },
    weight: 5,
    text: 'A escola vai ter uma feira de ciências.',
    choices: [
      {
        id: 'volcano',
        label: 'Fazer um vulcão de bicarbonato',
        effects: { stats: { intelligence: 3, happiness: 2 } },
        resultText: 'Seu vulcão foi um sucesso e você ganhou uma menção honrosa.',
        risk: { chance: 0.25, effects: { stats: { happiness: -2, intelligence: 1 } }, resultText: 'O vulcão não entrou em erupção. Pelo menos você aprendeu algo.' },
      },
      {
        id: 'skip',
        label: 'Fazer o mínimo',
        effects: { stats: { intelligence: -1 } },
        resultText: 'Você entregou um cartaz feito na última hora.',
      },
    ],
  },
  {
    id: 'child_broken_window',
    conditions: { minAge: 6, maxAge: 12 },
    weight: 5,
    once: true,
    text: 'Jogando bola, você quebrou a janela do vizinho.',
    choices: [
      {
        id: 'confess',
        label: 'Bater na porta e confessar',
        effects: { stats: { happiness: -2, intelligence: 1 }, setFlags: { honesto: true } },
        resultText: 'O vizinho ficou bravo, mas respeitou sua honestidade.',
      },
      {
        id: 'run',
        label: 'Fugir correndo',
        effects: { stats: { athletic: 1 } },
        resultText: 'Ninguém descobriu... por enquanto.',
        risk: { chance: 0.4, effects: { stats: { happiness: -5 } }, resultText: 'Seus pais descobriram e você ficou de castigo por um mês.' },
      },
    ],
  },
  {
    id: 'child_birthday_party',
    conditions: { minAge: 4, maxAge: 12 },
    weight: 6,
    text: 'Seus pais perguntam como você quer comemorar seu aniversário.',
    choices: [
      {
        id: 'party',
        label: 'Festa com os amigos',
        effects: { stats: { happiness: 6 } },
        resultText: 'A festa foi incrível e todo mundo da turma apareceu.',
      },
      {
        id: 'gloves',
        label: 'Pedir luvas de boxe de presente',
        effects: { stats: { happiness: 3, athletic: 1 }, setFlags: { temLuvas: true, gostaDeLuta: true } },
        resultText: 'Você ganhou luvas de boxe infantis e não tirou mais das mãos.',
      },
      {
        id: 'books',
        label: 'Pedir livros',
        effects: { stats: { intelligence: 3, happiness: 2 } },
        resultText: 'Você ganhou uma coleção de livros de aventura.',
      },
    ],
  },
  {
    id: 'child_flu',
    conditions: { minAge: 3, maxAge: 12 },
    weight: 5,
    text: 'Você pegou uma gripe forte.',
    choices: [
      {
        id: 'rest',
        label: 'Ficar de repouso',
        effects: { stats: { health: -2, happiness: -1 } },
        resultText: 'Você descansou e se recuperou em poucos dias.',
      },
      {
        id: 'play',
        label: 'Ir brincar mesmo assim',
        effects: { stats: { health: -6, happiness: 2 } },
        resultText: 'Você brincou com febre e a gripe piorou bastante.',
      },
    ],
  },
  {
    id: 'child_fight_on_tv',
    conditions: { minAge: 5, maxAge: 12 },
    weight: 6,
    once: true,
    text: 'Você assistiu na TV a uma luta do Circuito Titã de MMA. O campeão Rafael "Trovão" Mendes nocauteou o rival no primeiro round.',
    choices: [
      {
        id: 'dream',
        label: '"Um dia vou ser campeão!"',
        effects: { stats: { happiness: 4 }, setFlags: { sonhaSerLutador: true, gostaDeLuta: true } },
        resultText: 'Você decidiu que um dia vai ter o cinturão do Circuito Titã.',
      },
      {
        id: 'scared',
        label: 'Achar violento demais',
        effects: { stats: { happiness: -1 } },
        resultText: 'Você mudou de canal. Lutas não parecem ser a sua praia.',
      },
    ],
  },
];
