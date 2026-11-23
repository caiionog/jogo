import type { GameEvent } from '../../../engine';

/**
 * Eventos que revelam talentos de nascimento (release 0.0.1). Só acontecem para quem tem o talento e ainda não o
 * descobriu (`conditions.talent`). Mais os eventos de sorte (amuleto, espelho quebrado).
 */
const reveal = (id: string, talent: string, minAge: number, maxAge: number, text: string, label: string, result: string, extra: Partial<GameEvent> = {}): GameEvent => ({
  id,
  weight: 4,
  once: true,
  tone: 'good',
  conditions: { minAge, maxAge, talent: { id: talent, revealed: false } },
  text,
  choices: [{ id: 'ok', label, resultText: result, effects: { revealTalent: talent } }],
  ...extra,
});

export const TALENT_EVENTS: readonly GameEvent[] = [
  reveal('talent_atletico', 'atletico', 7, 30, 'O professor de educação física chamou você no canto da quadra: "Você tem um dom raro. Nunca vi alguém pegar o jeito tão rápido."', 'Ficar vermelh{o/a} de orgulho', 'Desde aquele dia você corre com outra confiança.'),
  reveal('talent_prodigio', 'prodigio', 6, 25, 'A professora devolveu sua prova com um bilhete: "Você resolveu do jeito que nem eu ensinei. Vamos conversar sobre olimpíadas?"', 'Aceitar o desafio', 'Você descobriu que aprender é fácil para você.'),
  reveal('talent_beleza', 'beleza', 13, 35, 'Uma agência de modelos parou você na rua pedindo para tirar umas fotos de teste.', 'Rir e agradecer', 'Você percebeu que chama atenção por onde passa.'),
  reveal('talent_saude_ferro', 'saude_ferro', 8, 60, 'Um surto de gripe derrubou a família inteira. Só você passou o mês sem nem um espirro.', 'Cuidar de todo mundo', 'O médico brincou que você tem saúde de ferro.'),
  reveal('talent_mao_pesada', 'mao_pesada', 12, 40, 'No saco de pancadas, a corrente do teto estalou com o seu cruzado. O treinador assobiou: "Mão pesada, hein?"', 'Bater de novo', 'Seu soco tem um peso diferente.', { conditions: { minAge: 12, maxAge: 40, talent: { id: 'mao_pesada', revealed: false }, fighting: { hasGym: true } } }),
  reveal('talent_corpo_elastico', 'corpo_elastico', 8, 40, 'No treino, você encaixou um triângulo de uma posição que o professor jurou ser impossível.', 'Repetir para provar', 'Seu corpo dobra onde o dos outros trava.', { conditions: { minAge: 8, maxAge: 40, talent: { id: 'corpo_elastico', revealed: false }, fighting: { hasGym: true } } }),
  reveal('talent_carismatico', 'carismatico', 10, 50, 'Você foi escolhid{o/a} para falar em nome da turma, sem nem ter se candidatado. "Todo mundo gosta de você", disseram.', 'Subir no palco', 'As pessoas se aproximam de você com facilidade.'),
  reveal('talent_saude_fragil', 'saude_fragil', 6, 50, 'Mais uma semana de cama por causa de um resfriado à toa. O médico suspira: "Você precisa se cuidar mais que os outros."', 'Seguir a recomendação', 'Você aprendeu que sua saúde é frágil.', { tone: 'bad' }),
  reveal('talent_propenso_lesao', 'propenso_lesao', 10, 45, 'Outra torção num movimento simples. O fisioterapeuta comenta que suas articulações são mais frouxas que o normal.', 'Fortalecer a musculatura', 'Você descobriu que se machuca com facilidade.', { tone: 'bad' }),
  reveal('talent_pavio_curto', 'pavio_curto', 9, 40, 'Uma provocação boba e, quando você viu, já estava aos gritos. Até você se assustou.', 'Respirar fundo (tarde demais)', 'Você percebeu que tem o pavio curto.', { tone: 'bad' }),
  {
    id: 'luck_amuleto',
    weight: 2,
    once: true,
    tone: 'good',
    conditions: { minAge: 8 },
    text: 'Você achou uma figa de madeira antiga na calçada. Parece ter sido de alguém muito supersticioso.',
    choices: [
      { id: 'keep', label: 'Guardar no bolso', resultText: 'Desde então, as coisas parecem dar um pouco mais certo.', effects: { luck: 6, stats: { happiness: 2 } } },
      { id: 'leave', label: 'Deixar onde estava', resultText: 'Você seguiu o caminho sem pensar mais nisso.' },
    ],
  },
  {
    id: 'luck_espelho',
    weight: 2,
    once: true,
    tone: 'bad',
    conditions: { minAge: 8 },
    text: 'O espelho do banheiro escorregou e se espatifou no chão. Sua avó dizia que isso dá sete anos de azar.',
    choices: [
      { id: 'shrug', label: 'Superstição boba', resultText: 'Você varreu os cacos. Será?', effects: { luck: -6 } },
      { id: 'ritual', label: 'Jogar sal por cima do ombro', resultText: 'Por via das dúvidas, você fez o ritual da avó.', effects: { luck: -3, stats: { happiness: 1 } } },
    ],
  },
];
