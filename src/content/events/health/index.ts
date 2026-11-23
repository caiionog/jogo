import type { GameEvent } from '../../../engine';

/** Aposentadoria, saúde, doenças e mortes por evento (Etapa 6). */
export const HEALTH_EVENTS: readonly GameEvent[] = [
  // --- aposentadoria ---
  {
    id: 'retire_farewell',
    trigger: 'followUp',
    weight: 0,
    conditions: {},
    text: 'Chegou a hora de pendurar as luvas. Como você quer se despedir dos tatames?',
    choices: [
      { id: 'fight', label: 'Uma última luta, diante da torcida', effects: { fighter: { offer: { kind: 'farewell' } } }, resultText: 'A luta de despedida foi marcada. Ela está na sua lista de ofertas.' },
      { id: 'ceremony', label: 'Uma cerimônia com a equipe e a família', effects: { stats: { happiness: 6 }, fighter: { retire: 'voluntaria', reputation: 4 } }, resultText: 'Teve discurso, choro e foto com todo mundo da academia.' },
      { id: 'quiet', label: 'Sair em silêncio', effects: { stats: { happiness: 2 }, fighter: { retire: 'voluntaria' } }, resultText: 'Sem alarde. Só você sabe o quanto aquilo pesou.' },
    ],
  },
  {
    id: 'retire_losing_streak',
    trigger: 'followUp',
    weight: 0,
    conditions: {},
    text: 'Mais uma derrota. No vestiário, seu treinador pergunta baixinho se não é hora de parar.',
    choices: [
      { id: 'stop', label: 'Ele tem razão. Vou parar.', effects: { stats: { happiness: -2 }, fighter: { retire: 'derrotas' } }, resultText: 'Você saiu de cabeça erguida.' },
      { id: 'go', label: 'Ainda não acabou!', effects: { stats: { happiness: 2 } }, resultText: 'Você voltou a treinar no dia seguinte.', risk: { chance: 0.3, effects: { health: { brainDamage: 3 } }, resultText: 'Você insistiu, mas a cabeça já não aguenta como antes.' } },
    ],
  },
  {
    id: 'retire_doctor',
    trigger: 'followUp',
    weight: 0,
    conditions: {},
    text: 'O ortopedista olha seus exames por um bom tempo e diz: "Se continuar lutando, você pode não andar direito aos cinquenta."',
    choices: [
      { id: 'accept', label: 'Aceitar o conselho e se aposentar', effects: { fighter: { retire: 'lesao' } }, resultText: 'O corpo agradece.' },
      { id: 'insist', label: 'Insistir mais um pouco', effects: { stats: { happiness: 1 } }, resultText: 'Você assinou o termo de responsabilidade.', risk: { chance: 0.35, effects: { health: { injury: 'menisco' } }, resultText: 'Na semana seguinte, o joelho travou no treino.' } },
    ],
  },
  {
    id: 'retire_reflection',
    once: true,
    weight: 3,
    conditions: { minAge: 34, maxAge: 45, fighting: { retired: false, hasFought: true, proWins: { min: 3 } }, flagsNone: ['pensa_aposentar'] },
    text: 'Depois de um treino, você demora mais para levantar do chão. Pela primeira vez você pensa no fim da carreira.',
    choices: [
      { id: 'plan', label: 'Começar a planejar a saída', effects: { setFlags: { pensa_aposentar: true }, stats: { happiness: 1 } }, resultText: 'Você abriu uma planilha chamada "depois".' },
      { id: 'deny', label: 'Ainda tenho muita lenha para queimar', effects: { setFlags: { pensa_aposentar: true }, stats: { happiness: 2 } }, resultText: 'Mais um ano, pelo menos.' },
    ],
  },
  {
    id: 'comeback_offer',
    weight: 3,
    conditions: { minAge: 30, maxAge: 48, fighting: { retired: true, retiredYears: { min: 1, max: 6 }, reputation: { min: 30 } }, health: { brainDamage: { max: 60 } } },
    text: 'Um promotor liga com uma proposta irrecusável: "O público quer ver você de volta. A bolsa vai ser a maior da sua vida."',
    choices: [
      { id: 'back', label: 'Voltar aos ringues', effects: { fighter: { unretire: true, reputation: 5 }, stats: { happiness: 4 } }, resultText: 'O anúncio da volta lotou as redes.' },
      { id: 'no', label: 'Minha história já foi escrita', effects: { stats: { happiness: 1 } }, resultText: 'Você desligou o telefone com um sorriso.' },
    ],
  },
  {
    id: 'retired_teaching_invite',
    once: true,
    weight: 3,
    conditions: { minAge: 26, fighting: { retired: true, reputation: { min: 15 } }, economy: { employed: false } },
    text: 'Uma academia da cidade convida você para dar aulas: "Os alunos querem aprender com quem já esteve lá."',
    choices: [
      { id: 'yes', label: 'Aceitar as aulas', effects: { economy: { jobOffer: 'treinador' }, stats: { happiness: 3 } }, resultText: 'Você voltou ao tatame, agora do outro lado.' },
      { id: 'no', label: 'Quero distância dos tatames por um tempo', effects: { stats: { happiness: 1 } }, resultText: 'Você agradeceu o convite.' },
    ],
  },
  // --- doenças ---
  {
    id: 'health_diagnosis',
    trigger: 'followUp',
    weight: 0,
    conditions: {},
    text: 'O médico confirmou o diagnóstico: {doenca}. "Com tratamento, dá para viver bem", ele diz.',
    choices: [
      { id: 'treat', label: 'Começar o tratamento', effects: { health: { controlCondition: 'var' }, stats: { happiness: -1 } }, resultText: 'Remédios, consultas e cuidado: a rotina mudou.' },
      { id: 'ignore', label: 'Deixar para depois', effects: { stats: { happiness: 1 } }, resultText: 'Você guardou a receita na gaveta.' },
    ],
  },
  {
    id: 'health_chest_pain',
    weight: 2,
    conditions: { minAge: 45 },
    text: 'Uma dor estranha no peito te acorda no meio da noite.',
    choices: [
      { id: 'doctor', label: 'Ir ao pronto-socorro', effects: { money: -800, stats: { health: 3 } }, resultText: 'Os exames vieram tranquilos. Susto.' },
      { id: 'ignore', label: 'Deve ser só o jantar', effects: {}, resultText: 'A dor passou.', risk: { chance: 0.2, effects: { health: { condition: 'cardiopatia' }, stats: { health: -5 } }, resultText: 'Semanas depois, o diagnóstico: doença cardíaca.' } },
    ],
  },
  {
    id: 'health_brain_hint',
    weight: 3,
    conditions: { minAge: 30, health: { brainDamage: { min: 35 } } },
    text: 'Sua família repara que você anda esquecendo compromissos e repetindo as mesmas histórias.',
    choices: [
      { id: 'doctor', label: 'Procurar um neurologista', effects: { money: -1500, stats: { happiness: -2 } }, resultText: 'O médico perguntou quantos nocautes você já sofreu. Você preferiu não contar.' },
      { id: 'joke', label: 'Rir e mudar de assunto', effects: { stats: { happiness: 1 } }, resultText: 'Todo mundo riu. Menos sua mãe.' },
    ],
  },
  {
    id: 'health_back_pain',
    weight: 2,
    conditions: { minAge: 35, health: { sequela: ['coluna_cronica', 'joelho_instavel', 'ombro_fragil'] } },
    text: 'As dores das lesões antigas voltaram com o frio.',
    choices: [
      { id: 'physio', label: 'Fazer fisioterapia', effects: { money: -2000, stats: { health: 2, happiness: 1 } }, resultText: 'Aliviou bastante.' },
      { id: 'pills', label: 'Tomar analgésico e seguir', effects: { stats: { health: -1 } }, resultText: 'O corpo cobra os juros das pancadas.' },
    ],
  },
  // --- mortes por evento (raras) ---
  {
    id: 'health_car_accident',
    weight: 1,
    conditions: { minAge: 18, health: { hasVehicle: true } },
    text: 'Na volta para casa, numa noite de chuva, um carro atravessou o sinal e bateu no seu.',
    choices: [
      { id: 'hospital', label: 'Ir ao hospital', effects: { health: { injury: 'costela_fraturada' }, money: -3000 }, resultText: 'Costela quebrada e um carro amassado, mas você sobreviveu.', risk: { chance: 0.04, effects: { health: { die: 'um acidente de carro' } }, resultText: 'O acidente foi grave demais.' } },
      { id: 'home', label: 'Dizer que está tudo bem e ir para casa', effects: { stats: { health: -4 } }, resultText: 'No dia seguinte, você mal conseguia levantar.', risk: { chance: 0.06, effects: { health: { die: 'complicações de um acidente de carro' } }, resultText: 'Houve uma hemorragia interna que ninguém percebeu.' } },
    ],
  },
  {
    id: 'health_street_fight',
    tags: ['briga'],
    tone: 'bad',
    weight: 0.5,
    conditions: { minAge: 16, maxAge: 65 },
    text: 'Na saída de um bar, um homem bêbado reconhece você e quer "testar o lutador".',
    choices: [
      { id: 'leave', label: 'Ir embora', effects: { stats: { happiness: -1 } }, resultText: 'Lutador de verdade não briga na rua.' },
      { id: 'fight', label: 'Aceitar a provocação', effects: { health: { injury: 'corte_supercilio' }, fighter: { reputation: -2 } }, resultText: 'Você venceu, mas o vídeo foi parar na internet.', risk: { chance: 0.01, effects: { health: { die: 'uma briga de rua' } }, resultText: 'Ele estava armado.' } },
    ],
  },
  {
    id: 'health_clandestine_fight',
    weight: 2,
    conditions: { minAge: 25, maxAge: 55, fighting: { hasFought: true }, health: { brainDamage: { min: 60 } } },
    text: 'Sem licença para lutar, você recebe uma proposta: R$ 30.000 por uma luta clandestina num galpão.',
    choices: [
      { id: 'yes', label: 'Aceitar', effects: { money: 30000, health: { brainDamage: 6, injury: 'random' } }, resultText: 'Você saiu de lá com o dinheiro e sem lembrar do terceiro round.', risk: { chance: 0.05, effects: { health: { die: 'uma luta clandestina' } }, resultText: 'Você não acordou depois do nocaute.' } },
      { id: 'no', label: 'Recusar', effects: { stats: { happiness: 1 } }, resultText: 'Tem dinheiro que não vale o risco.' },
    ],
  },
];
