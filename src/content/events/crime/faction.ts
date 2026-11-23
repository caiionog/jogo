import type { GameEvent } from '../../../engine';

/**
 * Facções e tráfico (release 0.0.2, fase 5). Todos 18+ (`minAge: 18` e a guarda `crimeAllowed` nas condições).
 * Morte e violência sempre em uma frase, sem detalhe. Sair é possível, mas arriscado.
 */
const DIE = (cause: string) => ({ health: { die: cause } });

export const FACTION_EVENTS: readonly GameEvent[] = [
  {
    id: 'crime_faccao_convite',
    conditions: { minAge: 18, maxAge: 45, crime: { rep: { min: 25 }, faction: false, factionHere: true } },
    weight: 4,
    cooldownYears: 4,
    text: 'Um homem de poucas palavras te procura: a facção que manda no bairro ouviu falar de você e quer você dentro.',
    choices: [
      { id: 'aceitar', label: 'Aceitar o convite', effects: { crime: { joinFaction: 'local' } }, resultText: 'Não existe contrato. Existe palavra — e consequência.' },
      { id: 'recusar', label: 'Recusar com respeito', effects: { crime: { rep: -3 } }, risk: { chance: 0.15, effects: { crime: { rep: -5 }, health: { injury: 'random' } }, resultText: 'Recusar não caiu bem. Você levou um "recado" na rua.' }, resultText: 'Eles aceitaram, por enquanto. Mas agora sabem quem você é.' },
    ],
  },
  {
    id: 'crime_faccao_convite_amigo',
    conditions: { minAge: 18, maxAge: 45, crime: { faction: false }, relationship: { types: ['amigo'], personFlag: 'faccao', personAge: { min: 18 } } },
    weight: 3,
    cooldownYears: 5,
    text: '{pessoa}, seu amigo de longa data, conta que entrou para uma facção e diz que pode te colocar lá dentro.',
    choices: [
      { id: 'aceitar', label: 'Entrar com {pessoa}', effects: { crime: { joinFaction: 'local' }, social: { affection: 8 } }, resultText: 'Agora vocês estão juntos nessa — para o bem e para o mal.' },
      { id: 'recusar', label: 'Recusar e pedir para ele sair também', effects: { social: { affection: -6 } }, resultText: '{pessoa} riu e disse que "não tem mais volta".' },
    ],
  },
  {
    id: 'crime_faccao_missao',
    trigger: 'followUp',
    conditions: { minAge: 18, crime: { faction: true } },
    weight: 0,
    text: 'A facção passou uma "missão" para você este ano. Recusar tem preço.',
    choices: [
      { id: 'cumprir', label: 'Cumprir a missão', effects: { crime: { rep: 5, wanted: 12 } }, risk: { chance: 0.25, effects: { crime: { arrest: 'assalto_comercio' } }, resultText: 'A missão deu errado e a polícia chegou.' }, resultText: 'Missão cumprida. Seu nome subiu lá dentro.' },
      { id: 'recusar', label: 'Recusar', effects: { crime: { factionDebt: 15000, rep: -4 } }, resultText: 'Recusar virou dívida. A facção vai cobrar.' },
      { id: 'enrolar', label: 'Dar uma desculpa e enrolar', effects: { crime: { rep: -1 } }, risk: { chance: 0.4, effects: { crime: { factionDebt: 25000, rep: -6 } }, resultText: 'Descobriram a mentira. A dívida ficou maior.' }, resultText: 'Colou. Desta vez.' },
    ],
  },
  {
    id: 'crime_faccao_guerra',
    conditions: { minAge: 18, crime: { faction: true, factionWar: true } },
    weight: 5,
    cooldownYears: 2,
    text: 'Guerra declarada com a facção rival. Toque de recolher no bairro e todo mundo olhando por cima do ombro.',
    choices: [
      { id: 'lutar', label: 'Ficar na linha de frente', effects: { crime: { rep: 8, wanted: 10 } }, risk: { chance: 0.15, effects: DIE('Guerra entre facções'), resultText: 'Você não voltou daquela noite.' }, resultText: 'Você sobreviveu à pior semana do ano.' },
      { id: 'esconder', label: 'Se esconder até passar', effects: { crime: { rep: -4 }, stats: { happiness: -4 } }, resultText: 'Semanas trancad{o/a} em casa.' },
      { id: 'fugir', label: 'Mudar de cidade', effects: { move: { to: 'outra_capital' }, crime: { leaveFaction: true, rep: -10 } }, risk: { chance: 0.2, effects: { ...DIE('Traição à facção'), move: { to: 'outra_capital' } }, resultText: 'Fugir foi visto como traição. Eles te acharam.' }, resultText: 'Você sumiu no meio da noite e começou de novo longe dali.' },
    ],
  },
  {
    id: 'crime_faccao_traicao',
    conditions: { minAge: 18, crime: { faction: true, record: true } },
    weight: 3,
    cooldownYears: 4,
    text: 'Corre um boato de que você falou demais com a polícia depois da sua última prisão.',
    choices: [
      { id: 'provar', label: 'Provar lealdade numa missão perigosa', effects: { crime: { rep: 6, wanted: 15 } }, risk: { chance: 0.2, effects: { crime: { arrest: 'assalto_comercio' } }, resultText: 'Provou lealdade, mas foi preso fazendo isso.' }, resultText: 'O boato morreu.' },
      { id: 'negar', label: 'Negar e manter a cabeça baixa', effects: {}, risk: { chance: 0.2, effects: DIE('Acusado de traição pela facção'), resultText: 'Não acreditaram em você.' }, resultText: 'Acreditaram. Por enquanto.' },
    ],
  },
  {
    id: 'crime_faccao_saida',
    trigger: 'followUp',
    conditions: { minAge: 18, crime: { faction: true } },
    weight: 0,
    text: 'Você decidiu sair da facção. Ninguém sai fácil.',
    choices: [
      { id: 'pagar', label: 'Pagar para sair', effects: { economy: { post: { cat: 'eventos', amount: -40000, label: 'Saída da facção' } }, crime: { leaveFaction: true, rep: -15 } }, risk: { chance: 0.1, effects: DIE('Cobrança da facção'), resultText: 'Pagar não bastou.' }, resultText: 'Aceitaram o dinheiro. Você está fora — e vigiad{o/a}.' },
      { id: 'fugir', label: 'Fugir para longe', effects: { move: { to: 'outra_capital' }, crime: { leaveFaction: true, rep: -20 } }, risk: { chance: 0.25, effects: { ...DIE('Perseguido pela facção'), move: { to: 'outra_capital' } }, resultText: 'Eles te encontraram na cidade nova.' }, resultText: 'Você recomeçou do zero, longe de tudo.' },
      { id: 'igreja', label: 'Se converter e pedir para sair', effects: { crime: { leaveFaction: true, rep: -20 }, stats: { happiness: 5 }, setFlags: { conversao: true } }, risk: { chance: 0.12, effects: DIE('Cobrança da facção'), resultText: 'Nem a fé convenceu quem mandava.' }, resultText: 'Respeitaram sua decisão. Você passou a ajudar outros a sair também.' },
    ],
  },
  {
    id: 'crime_faccao_familia',
    conditions: { minAge: 18, crime: { faction: true }, hasRelation: ['mae'] },
    weight: 3,
    cooldownYears: 4,
    text: 'Sua mãe aparece na sua porta e implora para você largar "essa gente".',
    choices: [
      { id: 'prometer', label: 'Prometer que vai sair', effects: { social: { parentsAffection: 6 }, stats: { happiness: 2 } }, resultText: 'Ela foi embora com esperança. Agora depende de você.' },
      { id: 'mandar_embora', label: 'Mandar ela embora', effects: { social: { parentsAffection: -12 }, stats: { happiness: -4 } }, resultText: 'A porta bateu. Você ficou um tempo parado no corredor.' },
    ],
  },

  // --- tráfico ---
  {
    id: 'crime_trafico_rival',
    conditions: { minAge: 18, crime: { trafficking: true } },
    weight: 4,
    cooldownYears: 2,
    text: 'Um grupo rival quer o seu ponto de venda.',
    choices: [
      { id: 'ceder', label: 'Ceder o ponto e largar o tráfico', effects: { crime: { stopTrafficking: true, rep: -6 } }, resultText: 'Você saiu do caminho. Perdeu dinheiro, ganhou sossego.' },
      { id: 'enfrentar', label: 'Enfrentar', effects: { crime: { rep: 6, wanted: 10 } }, risk: { chance: 0.2, effects: { health: { injury: 'random' }, crime: { wanted: 15 } }, resultText: 'O confronto deixou você ferid{o/a}.' }, resultText: 'O grupo rival recuou.' },
      { id: 'faccao', label: 'Pedir proteção a quem manda', effects: { crime: { factionDebt: 10000 } }, resultText: 'A proteção veio. A conta também.' },
    ],
  },
  {
    id: 'crime_trafico_policia',
    conditions: { minAge: 18, crime: { trafficking: true } },
    weight: 4,
    cooldownYears: 2,
    text: 'Uma viatura para do lado do ponto. Os policiais descem devagar.',
    choices: [
      { id: 'largar', label: 'Largar tudo e sair andando', effects: { crime: { seizeDirty: 0.3 } }, resultText: 'Você perdeu a mercadoria, mas não a liberdade.' },
      { id: 'correr', label: 'Correr', effects: { crime: { wanted: 10 } }, risk: { chance: 0.45, effects: { crime: { arrest: 'trafico', stopTrafficking: true } }, resultText: 'Você não foi rápid{o/a} o bastante.' }, resultText: 'Você escapou pelos fundos.' },
      { id: 'subornar', label: 'Oferecer dinheiro', effects: { economy: { post: { cat: 'eventos', amount: -5000, label: 'Suborno' } } }, risk: { chance: 0.35, effects: { crime: { arrest: 'trafico', stopTrafficking: true } }, resultText: 'Os policiais eram honestos — e agora você responde por corrupção também.' }, resultText: 'O dinheiro mudou de mão e a viatura foi embora.' },
    ],
  },
];
