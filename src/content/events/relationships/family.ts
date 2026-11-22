import type { GameEvent } from '../../../engine';

/** Família: pais, irmãos, doença e a carreira de luta vista de casa. */
export const FAMILY_EVENTS: readonly GameEvent[] = [
  {
    id: 'rel_parents_fight_career',
    conditions: { minAge: 12, fighting: { hasFought: true }, relationship: { types: ['pai', 'mae'], traits: ['protetor', 'religioso', 'ciumento'] } },
    weight: 6,
    text: '{pessoa} brigou com você em casa por causa da sua carreira: "Luta não é futuro para ninguém!"',
    choices: [
      { id: 'defend', label: 'Defender o seu sonho', effects: { stats: { happiness: 2 }, social: { affection: -8 } }, resultText: 'Você bateu o pé. O clima em casa ficou pesado.' },
      { id: 'promise', label: 'Prometer que vai se cuidar', effects: { social: { affection: 6 } }, resultText: '{pessoa} não ficou feliz, mas aceitou.' },
      { id: 'doubt', label: 'Pensar em largar a luta', effects: { stats: { happiness: -4 }, setFlags: { pensa_parar: true }, social: { affection: 8 } }, resultText: 'Pela primeira vez você duvidou do caminho.' },
    ],
  },
  {
    id: 'rel_parent_proud',
    conditions: { fighting: { hasFought: true }, relationship: { types: ['pai', 'mae'], traits: ['ambicioso', 'competitivo', 'orgulhoso', 'aventureiro'] } },
    weight: 5,
    text: '{pessoa} foi assistir à sua luta e gritou mais alto que a torcida inteira.',
    choices: [
      { id: 'thank', label: 'Agradecer com um abraço', effects: { stats: { happiness: 5 }, social: { affection: 8 } }, resultText: 'Depois da luta, vocês comemoraram juntos.' },
      { id: 'shy', label: 'Ficar com vergonha', effects: { stats: { happiness: 2 }, social: { affection: 2 } }, resultText: 'Por dentro, você adorou.' },
    ],
  },
  {
    id: 'rel_sibling_money',
    conditions: { minAge: 18, relationship: { types: ['irmao'], personAge: { min: 18 }, personFlagNone: 'pediu_dinheiro' } },
    weight: 5,
    text: '{pessoa} está com as contas atrasadas e pede R$ 2.000 emprestados.',
    choices: [
      {
        id: 'lend',
        label: 'Emprestar',
        // o empréstimo volta com um agradinho; no risco, o dinheiro nunca volta
        effects: { money: 200, social: { affection: 12, setPersonFlags: { pediu_dinheiro: true } } },
        resultText: '{pessoa} te pagou de volta alguns meses depois, com juros de gratidão.',
        risk: { chance: 0.4, effects: { money: -2200, social: { affection: 6 } }, resultText: 'O dinheiro nunca voltou, mas {pessoa} ficou devendo um favor.' },
      },
      { id: 'refuse', label: 'Negar', effects: { social: { affection: -8, setPersonFlags: { pediu_dinheiro: true } } }, resultText: '{pessoa} ficou magoado(a).' },
    ],
  },
  {
    id: 'rel_parent_sick',
    conditions: { relationship: { types: ['pai', 'mae'], personAge: { min: 55 } } },
    weight: 4,
    text: '{pessoa} ficou doente e vai precisar de cuidados por um tempo.',
    choices: [
      { id: 'care', label: 'Cuidar de perto', effects: { stats: { happiness: -2 }, money: -1000, social: { affection: 12, personHealth: 8 } }, resultText: 'Você esteve presente em cada consulta.' },
      { id: 'pay', label: 'Pagar um tratamento particular (R$ 5.000)', effects: { money: -5000, social: { affection: 10, personHealth: 15 } }, resultText: 'O tratamento fez efeito rápido.' },
      { id: 'busy', label: 'Seguir com a sua rotina', effects: { social: { affection: -10, personHealth: -5 } }, resultText: 'Você ligou de vez em quando. {pessoa} sentiu sua falta.' },
    ],
  },
  {
    id: 'rel_parents_split',
    conditions: { minAge: 6, maxAge: 16, relationship: { types: ['pai'] }, hasRelation: ['mae'], flagsNone: ['pais_separados'] },
    weight: 2,
    once: true,
    text: 'Seus pais sentaram com você na sala: eles vão se separar.',
    choices: [
      { id: 'mom', label: 'Morar com a mãe', effects: { stats: { happiness: -8 }, setFlags: { pais_separados: true }, social: { affection: -6, setPersonFlags: { separados: true } } }, resultText: 'Você passou a ver o pai nos fins de semana.' },
      { id: 'dad', label: 'Morar com o pai', effects: { stats: { happiness: -8 }, setFlags: { pais_separados: true }, social: { affection: 6, setPersonFlags: { separados: true }, parentsAffection: -2 } }, resultText: 'A mudança foi difícil, mas você se adaptou.' },
      { id: 'unite', label: 'Implorar para tentarem de novo', effects: { stats: { happiness: -4 }, social: { parentsAffection: 4 } }, resultText: 'Eles decidiram fazer terapia de casal. Ainda há esperança.' },
    ],
  },
  {
    id: 'rel_sibling_fight',
    conditions: { minAge: 6, maxAge: 17, relationship: { types: ['irmao'], personAge: { min: 4, max: 22 } } },
    weight: 5,
    text: '{pessoa} pegou suas coisas sem pedir. De novo.',
    choices: [
      { id: 'fight', label: 'Brigar', effects: { stats: { happiness: 1 }, social: { affection: -8 } }, resultText: 'Vocês rolaram pelo chão até alguém separar.' },
      { id: 'talk', label: 'Conversar', effects: { social: { affection: 4 } }, resultText: '{pessoa} pediu desculpas, meio a contragosto.' },
      { id: 'let', label: 'Deixar para lá', effects: { social: { affection: 1 } }, resultText: 'Irmãos são assim mesmo.' },
    ],
  },
  {
    id: 'rel_family_lunch',
    conditions: { minAge: 20, hasRelation: ['pai', 'mae', 'irmao'] },
    weight: 4,
    text: 'Almoço de domingo na casa da família, com todo mundo reunido.',
    choices: [
      { id: 'go', label: 'Ir e ficar a tarde toda', effects: { stats: { happiness: 4 }, social: { parentsAffection: 5 } }, resultText: 'Teve churrasco, risadas e histórias de infância.' },
      { id: 'skip', label: 'Inventar uma desculpa', effects: { social: { parentsAffection: -4 } }, resultText: 'Sua mãe percebeu que era desculpa.' },
    ],
  },
];
