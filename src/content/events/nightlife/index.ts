import type { GameEvent } from '../../../engine';

/**
 * Eventos da vida noturna (release 0.0.1). `trigger: 'followUp'`: só acontecem quando o personagem sai (`goOut`).
 * A sorte inclina o peso (tone) e os riscos. A casa de strip tem a tag `adult` (texto sugestivo, nunca gráfico).
 */
const night = (e: Omit<GameEvent, 'trigger' | 'weight'> & { weight?: number }): GameEvent => ({ trigger: 'followUp', weight: e.weight ?? 3, ...e });

export const NIGHTLIFE_EVENTS: readonly GameEvent[] = [
  night({
    id: 'night_meet',
    tone: 'good',
    conditions: { minAge: 10 },
    text: 'No meio da noite, alguém puxou papo com você e a conversa rendeu.',
    choices: [
      { id: 'contact', label: 'Trocar contatos', resultText: 'Vocês ficaram de se falar. Uma amizade nova (quem sabe algo mais um dia).', effects: { social: { meet: { context: 'party' } }, stats: { happiness: 3 } } },
      { id: 'leave', label: 'Ficar só no papo', resultText: 'Foi uma conversa boa e só.', effects: { stats: { happiness: 1 } } },
    ],
  }),
  night({
    id: 'night_acquaintance',
    tone: 'good',
    conditions: { minAge: 10 },
    text: 'Você deu de cara com um conhecido de anos atrás. "Quanto tempo!"',
    choices: [
      { id: 'catch', label: 'Colocar o papo em dia', resultText: 'Vocês riram das histórias antigas até tarde.', effects: { stats: { happiness: 4 } } },
      { id: 'wave', label: 'Só acenar', resultText: 'Um oi rápido e cada um para o seu lado.' },
    ],
  }),
  night({
    id: 'night_fight',
    tags: ['briga'],
    tone: 'bad',
    conditions: { minAge: 18, fighting: { hasFought: false } },
    text: 'Um sujeito esbarrou em você, derrubou sua bebida e ainda partiu para cima.',
    choices: [
      { id: 'fight', label: 'Revidar', resultText: 'Você se defendeu e o segurança separou antes de piorar.', effects: { stats: { happiness: 1 } }, risk: { chance: 0.5, resultText: 'Você apanhou feio, e a polícia ainda levou todo mundo para a delegacia. Multa e um olho roxo.', effects: { health: { injury: 'random' }, money: -1500, setFlags: { preso: true }, stats: { happiness: -6 } } } },
      { id: 'walk', label: 'Ir embora', resultText: 'Você engoliu o orgulho e foi para casa inteir{o/a}.', effects: { stats: { happiness: -1 } } },
    ],
  }),
  night({
    id: 'night_fight_fighter',
    tags: ['briga'],
    tone: 'bad',
    conditions: { minAge: 18, fighting: { hasFought: true } },
    text: 'Um cara te reconheceu das lutas e resolveu provar alguma coisa na frente dos amigos.',
    choices: [
      { id: 'fight', label: 'Resolver ali mesmo', resultText: 'Dois movimentos e acabou. O vídeo viralizou — muita gente achou o máximo.', effects: { fighter: { reputation: 2 }, stats: { happiness: 2 } }, risk: { chance: 0.3, resultText: 'Você venceu, mas a polícia chegou: boletim de ocorrência, multa e a imprensa falando mal.', effects: { fighter: { reputation: -4 }, money: -3000, setFlags: { preso: true }, stats: { happiness: -5 } } } },
      { id: 'walk', label: 'Sair sem responder', resultText: 'Profissional não briga na rua. Seu treinador ficaria orgulhoso.', effects: { stats: { happiness: 1 } } },
    ],
  }),
  night({
    id: 'night_fight_teen',
    tags: ['briga'],
    tone: 'bad',
    conditions: { minAge: 12, maxAge: 17 },
    text: 'Na saída, um grupinho começou a te provocar e a empurrar.',
    choices: [
      { id: 'fight', label: 'Empurrar de volta', resultText: 'Teve gritaria, mas ninguém se machucou.', effects: { setFlags: { brigou_na_escola: true } }, risk: { chance: 0.4, resultText: 'Virou briga feia; seus pais tiveram de te buscar.', effects: { stats: { happiness: -4, health: -2 }, social: { parentsAffection: -5 } } } },
      { id: 'walk', label: 'Ir embora com os amigos', resultText: 'Você saiu de boa e a noite continuou.' },
    ],
  }),
  night({
    id: 'night_overspend',
    tone: 'bad',
    conditions: { minAge: 18 },
    text: 'Uma rodada atrás da outra… quando você viu, a conta estava enorme.',
    choices: [
      { id: 'pay', label: 'Pagar e esquecer', resultText: 'O cartão chorou.', effects: { money: -600, stats: { happiness: 1 } } },
      { id: 'split', label: 'Pedir para dividir', resultText: 'Os amigos racharam, mas reclamaram.', effects: { money: -200 } },
    ],
  }),
  night({
    id: 'night_teen_overspend',
    tone: 'bad',
    conditions: { minAge: 10, maxAge: 17 },
    text: 'Você gastou a mesada inteira em uma noite.',
    choices: [{ id: 'ok', label: 'Fazer o quê', resultText: 'O resto do mês foi a pão e água.', effects: { stats: { happiness: -1 } } }],
  }),
  night({
    id: 'night_phone',
    tone: 'bad',
    conditions: { minAge: 10 },
    text: 'Na hora de ir embora, cadê o celular?',
    choices: [
      { id: 'search', label: 'Procurar pelo lugar todo', resultText: 'Achou embaixo de uma mesa. Que alívio!', effects: { stats: { happiness: 1 } }, risk: { chance: 0.5, resultText: 'Sumiu de vez. Celular novo, dinheiro a menos.', effects: { money: -1200, stats: { happiness: -3 } } } },
      { id: 'give', label: 'Desistir e ir embora', resultText: 'Celular novo, dinheiro a menos.', effects: { money: -1200, stats: { happiness: -2 } } },
    ],
  }),
  night({
    id: 'night_hangover',
    tone: 'bad',
    conditions: { minAge: 18 },
    text: 'A noite foi ótima. A manhã seguinte, nem tanto.',
    choices: [
      { id: 'rest', label: 'Passar o dia de molho', resultText: 'Água, sopa e promessas de nunca mais.', effects: { stats: { health: -2, happiness: -1 } } },
      { id: 'train', label: 'Treinar de ressaca', resultText: 'Foi o pior treino da sua vida.', effects: { stats: { health: -3 } } },
    ],
  }),
  night({
    id: 'night_strip',
    tags: ['adult'],
    conditions: { minAge: 18 },
    text: 'Luzes baixas, música alta e uma dançarina que sabia exatamente o que estava fazendo.',
    choices: [
      { id: 'tip', label: 'Deixar uma boa gorjeta', resultText: 'Você foi embora com a carteira mais leve e um sorriso bobo.', effects: { money: -400, stats: { happiness: 4 } } },
      { id: 'drink', label: 'Só tomar um drinque', resultText: 'Você assistiu ao show de longe e foi embora cedo.', effects: { stats: { happiness: 2 } } },
    ],
  }),
];
