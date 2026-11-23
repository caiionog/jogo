import type { GameEvent } from '../../../engine';

/**
 * Vida de policial (release 0.0.2): dilemas (propina, colega corrupto, pressão política, corregedoria), academia,
 * homenagem, Natal no plantão, colega morto em serviço, ameaça à família, NPCs presos que voltam e o curso de
 * seleção da força especial (3 etapas abertas pela ação "Tentar o curso"; a engine decide quem passa).
 * Nenhum lado é glamourizado: aceitar dinheiro sujo abre risco de corregedoria, exoneração e prisão (fase 8).
 */
const ACTIVE = { stage: ['probatorio' as const, 'efetivo' as const] };

export const POLICE_LIFE_EVENTS: readonly GameEvent[] = [
  // --- academia ---
  {
    id: 'pol_academia_tiro',
    conditions: { minAge: 18, police: { stage: ['formacao'] } },
    weight: 8,
    text: 'Semana de tiro na academia de polícia. O instrutor avisa: "Quem não acertar o mínimo, repete."',
    choices: [
      { id: 'dedicar', label: 'Ficar depois do horário treinando', effects: { police: { shooting: 6 }, stats: { happiness: -1 } }, resultText: 'Suas séries melhoraram a cada dia.' },
      { id: 'normal', label: 'Fazer só o exigido', effects: { police: { shooting: 2 } }, resultText: 'Passou no limite.' },
    ],
  },
  {
    id: 'pol_academia_disciplina',
    conditions: { minAge: 18, police: { stage: ['formacao'] } },
    weight: 6,
    text: 'Um instrutor pega no seu pé o curso inteiro, com flexões e corridas extras por qualquer detalhe.',
    choices: [
      { id: 'aguentar', label: 'Aguentar calad{o/a}', effects: { stats: { athletic: 2, happiness: -2 }, police: { merit: 2 } }, resultText: 'No fim do curso, ele apertou sua mão: "Era para ver se você aguentava".' },
      { id: 'reclamar', label: 'Reclamar com a coordenação', effects: { stats: { happiness: 1 }, police: { merit: -2 } }, resultText: 'Ele maneirou, mas sua turma passou a te chamar de "reclamação".' },
    ],
  },
  {
    id: 'pol_academia_turma',
    conditions: { minAge: 18, police: { stage: ['formacao'] } },
    weight: 5,
    text: 'Sua turma da academia organiza um churrasco de fim de módulo.',
    choices: [
      { id: 'ir', label: 'Ir e conhecer o pessoal', effects: { stats: { happiness: 3 }, social: { meet: { context: 'work', type: 'amigo' } } }, resultText: 'Você saiu de lá com uma amizade para a carreira toda.' },
      { id: 'estudar', label: 'Ficar estudando o regulamento', effects: { stats: { intelligence: 1 } }, resultText: 'Decorou o regulamento. Perdeu o churrasco.' },
    ],
  },

  // --- dilemas ---
  {
    id: 'pol_propina',
    conditions: { minAge: 18, police: ACTIVE },
    weight: 5,
    text: 'Numa blitz, um motorista sem documentos desliza um envelope pela janela: "Para o seu café, chefe."',
    choices: [
      { id: 'recusar_prender', label: 'Recusar e registrar a tentativa de suborno', effects: { police: { merit: 5, arrest: true } }, resultText: 'Ele foi conduzido. O comando elogiou a postura.' },
      { id: 'recusar', label: 'Recusar e só aplicar a multa', effects: { police: { merit: 1 } }, resultText: 'Envelope devolvido, multa aplicada.' },
      { id: 'aceitar', label: 'Aceitar o envelope', effects: { economy: { post: { cat: 'crime', amount: 1500, label: 'Propina' } }, stats: { happiness: -2 } }, risk: { chance: 0.25, effects: { economy: { post: { cat: 'crime', amount: 1500, label: 'Propina' } }, police: { corregedoria: 2 }, stats: { happiness: -6 } }, resultText: 'Era uma câmera escondida de uma reportagem. A corregedoria abriu processo.' }, resultText: 'Ninguém viu. Mas você viu.' },
    ],
  },
  {
    id: 'pol_colega_corrupto',
    conditions: { minAge: 18, police: { ...ACTIVE, serviceYears: { min: 1 } } },
    weight: 4,
    text: 'Você percebe que seu parceiro de viatura recebe dinheiro de um comerciante para "proteger" a rua.',
    choices: [
      { id: 'denunciar', label: 'Denunciar à corregedoria', effects: { police: { merit: 4 }, stats: { happiness: -3 } }, risk: { chance: 0.3, effects: { police: { merit: 2 }, stats: { happiness: -8 } }, resultText: 'Ele foi afastado, e parte da tropa passou a te tratar com frieza.' }, resultText: 'Ele foi afastado. Você fez o certo, mas o clima pesou.' },
      { id: 'ignorar', label: 'Fingir que não viu', effects: { stats: { happiness: -2 } }, risk: { chance: 0.2, effects: { police: { corregedoria: 1 } }, resultText: 'O esquema caiu e você foi ouvid{o/a} como suspeit{o/a} de omissão.' }, resultText: 'Você passou a pedir para trocar de parceiro.' },
      { id: 'participar', label: 'Aceitar uma parte', effects: { economy: { post: { cat: 'crime', amount: 4000, label: 'Parte do esquema' } } }, risk: { chance: 0.35, effects: { economy: { post: { cat: 'crime', amount: 4000, label: 'Parte do esquema' } }, police: { corregedoria: 3 } }, resultText: 'O esquema foi descoberto. Seu nome estava na lista.' }, resultText: 'Dinheiro extra todo mês. E um aperto no peito toda vez que a corregedoria liga.' },
    ],
  },
  {
    id: 'pol_pressao_politica',
    conditions: { minAge: 22, police: { ...ACTIVE, force: ['civil'], serviceYears: { min: 2 } } },
    weight: 3,
    text: 'Um político local liga pedindo que uma investigação sobre um aliado "ande devagar".',
    choices: [
      { id: 'seguir', label: 'Seguir a investigação normalmente', effects: { police: { merit: 4 } }, risk: { chance: 0.3, effects: { police: { merit: 2 }, stats: { happiness: -4 } }, resultText: 'Semanas depois, você recebeu uma transferência para longe de casa. Coincidência?' }, resultText: 'O caso andou. O político nunca mais ligou.' },
      { id: 'devagar', label: 'Deixar o caso na gaveta', effects: { police: { merit: -3 }, stats: { happiness: -3 } }, risk: { chance: 0.2, effects: { police: { corregedoria: 2 } }, resultText: 'A imprensa descobriu o engavetamento.' }, resultText: 'Ninguém reclamou. Você também não dormiu direito.' },
      { id: 'imprensa', label: 'Contar à imprensa', effects: { police: { merit: -1 }, stats: { happiness: 2 } }, risk: { chance: 0.4, effects: { police: { corregedoria: 1 } }, resultText: 'O vazamento virou processo administrativo contra você.' }, resultText: 'A pressão sumiu da noite para o dia.' },
    ],
  },
  {
    id: 'pol_corregedoria',
    conditions: { minAge: 18, police: { corregedoria: { min: 2 } } },
    weight: 6,
    cooldownYears: 2,
    text: 'A corregedoria chamou você para depor sobre os processos acumulados na sua ficha funcional.',
    choices: [
      { id: 'advogado', label: 'Contratar um advogado', effects: { economy: { post: { cat: 'eventos', amount: -8000, label: 'Advogado (corregedoria)' } }, police: { corregedoria: -1 } }, risk: { chance: 0.25, effects: { economy: { post: { cat: 'eventos', amount: -8000, label: 'Advogado (corregedoria)' } }, police: { exonerate: true } }, resultText: 'Nem o advogado segurou: a corregedoria decidiu pela sua exoneração.' }, resultText: 'O advogado conseguiu arquivar parte dos processos.' },
      { id: 'sozinho', label: 'Se defender sozinh{o/a}', effects: { police: { merit: -3 } }, risk: { chance: 0.45, effects: { police: { exonerate: true } }, resultText: 'A decisão saiu: você foi exonerad{o/a}.' }, resultText: 'Você levou uma suspensão, mas continua na polícia.' },
    ],
  },

  // --- outros ---
  {
    id: 'pol_homenagem',
    conditions: { minAge: 18, police: { stage: ['efetivo'] } },
    weight: 3,
    text: 'Você foi indicad{o/a} para receber uma homenagem por bons serviços na cerimônia do aniversário da corporação.',
    choices: [
      { id: 'familia', label: 'Levar a família', effects: { stats: { happiness: 6 }, police: { merit: 3, notable: 'Homenagead{o/a} por bons serviços' }, social: { parentsAffection: 5 } }, resultText: 'Seus pais choraram na plateia.' },
      { id: 'discreto', label: 'Receber sem alarde', effects: { stats: { happiness: 3 }, police: { merit: 3, notable: 'Homenagead{o/a} por bons serviços' } }, resultText: 'Medalha na gaveta, orgulho no peito.' },
    ],
  },
  {
    id: 'pol_natal',
    conditions: { minAge: 18, police: ACTIVE },
    weight: 3,
    cooldownYears: 3,
    text: 'A escala saiu: você está de plantão no Natal.',
    choices: [
      { id: 'cumprir', label: 'Cumprir o plantão', effects: { police: { merit: 2 }, stats: { happiness: -3 } }, resultText: 'Ceia de marmita na viatura, com os colegas. Teve até amigo-secreto.' },
      { id: 'trocar', label: 'Trocar com um colega (e dever um favor)', effects: { stats: { happiness: 3 }, police: { merit: -1 } }, resultText: 'Natal em casa. No Ano-Novo, a escala é sua.' },
    ],
  },
  {
    id: 'pol_colega_morto',
    once: true,
    conditions: { minAge: 19, police: { ...ACTIVE, serviceYears: { min: 1 } } },
    weight: 2,
    text: 'Um colega da sua turma de formação morreu em serviço. A notícia chegou pelo rádio.',
    choices: [
      { id: 'velorio', label: 'Ir ao velório e apoiar a família', effects: { stats: { happiness: -6 } }, resultText: 'A tropa inteira estava lá, em silêncio.' },
      { id: 'terapia', label: 'Procurar o apoio psicológico da corporação', effects: { stats: { happiness: -3, health: 1 } }, resultText: 'Falar ajudou mais do que você imaginava.' },
      { id: 'pensar', label: 'Pensar em largar a farda', effects: { stats: { happiness: -5 }, setFlags: { pensa_sair_policia: true } }, resultText: 'Pela primeira vez você olhou para outros concursos.' },
    ],
  },
  {
    id: 'pol_ameaca_familia',
    conditions: { minAge: 20, police: { ...ACTIVE, serviceYears: { min: 2 } }, hasRelation: ['conjuge', 'filho', 'mae', 'pai'] },
    weight: 2,
    cooldownYears: 5,
    text: 'Um bilhete anônimo deixado na sua casa cita o nome da sua família e manda você "pegar leve".',
    choices: [
      { id: 'registrar', label: 'Registrar e pedir proteção', effects: { police: { merit: 1 }, stats: { happiness: -3 } }, resultText: 'Uma viatura passou a rondar sua rua por um tempo.' },
      { id: 'transferencia', label: 'Pedir transferência e se mudar', effects: { stats: { happiness: -2 }, move: { to: 'mesma_uf' } }, resultText: 'Recomeço em outra cidade, com a família mais tranquila.' },
      { id: 'ignorar', label: 'Ignorar: deve ser blefe', effects: { stats: { happiness: -1 } }, resultText: 'Nada aconteceu. Mesmo assim, você passou a olhar o retrovisor.' },
    ],
  },
  {
    id: 'pol_reconhecido',
    conditions: { minAge: 19, police: ACTIVE, relationship: { types: ['conhecido'], personFlag: 'preso_por_voce' } },
    weight: 4,
    cooldownYears: 3,
    text: 'Na fila da padaria, alguém olha fixo para você: é {pessoa}, que você prendeu tempos atrás.',
    choices: [
      { id: 'cumprimentar', label: 'Cumprimentar com um aceno', effects: { social: { affection: 8 } }, resultText: '{pessoa} acenou de volta. Disse que está trabalhando e quer distância de confusão.' },
      { id: 'encarar', label: 'Encarar de volta', effects: { social: { affection: -10 }, stats: { happiness: -1 } }, resultText: 'Clima pesado. {pessoa} saiu sem comprar nada.' },
      { id: 'sair', label: 'Sair discretamente', effects: {}, resultText: 'Melhor não arriscar.' },
    ],
  },
  {
    id: 'pol_vinganca',
    conditions: { minAge: 19, police: ACTIVE, relationship: { types: ['conhecido'], personFlag: 'preso_por_voce', affection: { max: 15 } } },
    weight: 2,
    cooldownYears: 4,
    text: 'Um informante avisa: {pessoa}, que você prendeu, saiu da cadeia e anda perguntando onde você mora.',
    choices: [
      { id: 'prevenir', label: 'Avisar o comando e mudar a rotina', effects: { police: { merit: 1 }, stats: { happiness: -2 } }, resultText: 'Você trocou trajetos e horários por meses. Nada aconteceu.' },
      { id: 'conversar', label: 'Procurar {pessoa} para conversar', effects: { social: { affection: 15 } }, risk: { chance: 0.3, effects: { health: { injury: 'random' }, stats: { happiness: -5 } }, resultText: 'A conversa virou confusão e você saiu machucad{o/a}.' }, resultText: 'Foi tenso, mas cada um seguiu sua vida.' },
    ],
  },
  {
    id: 'pol_delacao',
    conditions: { minAge: 19, police: ACTIVE, relationship: { types: ['conhecido'], personFlag: 'preso_por_voce', affection: { min: 10 } } },
    weight: 2,
    cooldownYears: 4,
    text: '{pessoa}, que você prendeu, manda recado: tem informações sobre um esquema grande e só fala com você.',
    choices: [
      { id: 'ouvir', label: 'Ouvir e formalizar a colaboração', effects: { police: { merit: 6, notable: 'Desmontou um esquema com uma delação' } }, risk: { chance: 0.25, effects: { police: { merit: -2 }, stats: { happiness: -2 } }, resultText: 'Era uma armadilha para desviar a atenção da polícia.' }, resultText: 'As informações levaram a uma operação de sucesso.' },
      { id: 'recusar', label: 'Recusar: pode ser armadilha', effects: {}, resultText: 'Você nunca vai saber.' },
    ],
  },

  // --- curso de seleção da força especial (aberto pela ação) ---
  {
    id: 'pol_especial_1',
    trigger: 'followUp',
    conditions: { minAge: 18, police: { stage: ['efetivo'], unit: 'regular' } },
    weight: 0,
    text: 'Primeira semana do curso de seleção: corrida de madrugada, frio e sono. Metade da turma já pediu para sair.',
    choices: [
      { id: 'seguir', label: 'Seguir firme', effects: { police: { specialStep: 1 } }, resultText: 'Você cerrou os dentes.' },
      { id: 'desistir', label: 'Pedir para sair', effects: { stats: { happiness: -2 } }, resultText: 'Você saiu do curso. Não é para todo mundo.' },
    ],
  },
  {
    id: 'pol_especial_2',
    trigger: 'followUp',
    conditions: { minAge: 18, police: { stage: ['efetivo'], unit: 'regular' } },
    weight: 0,
    text: 'Fase de tiro e tática: provas sob cansaço extremo, com instrutores gritando o tempo todo.',
    choices: [
      { id: 'seguir', label: 'Manter a calma e atirar', effects: { police: { specialStep: 2, shooting: 2 } }, resultText: 'Respira, mira, dispara.' },
      { id: 'desistir', label: 'Pedir para sair', effects: { stats: { happiness: -3 } }, resultText: 'Você entregou o gorro do curso.' },
    ],
  },
  {
    id: 'pol_especial_3',
    trigger: 'followUp',
    conditions: { minAge: 18, police: { stage: ['efetivo'], unit: 'regular' } },
    weight: 0,
    text: 'Prova final: uma simulação de resgate que dura dois dias sem dormir.',
    choices: [
      { id: 'seguir', label: 'Ir até o fim', effects: { police: { specialStep: 3 }, stats: { athletic: 1 } }, resultText: 'Você foi até o limite.' },
      { id: 'desistir', label: 'Pedir para sair', effects: { stats: { happiness: -4 } }, resultText: 'Tão perto... mas você saiu.' },
    ],
  },
];
