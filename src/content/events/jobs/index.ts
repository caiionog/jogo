import type { GameEvent } from '../../../engine';

/** Eventos de trabalho (Etapa 8): o dia a dia dos empregos básicos, com escolhas. */
const ATENDIMENTO = ['lanchonete', 'caixa', 'vendedor', 'garcom', 'recepcionista', 'empacotador', 'frentista'];
const CAIXA = ['caixa', 'lanchonete', 'empacotador', 'vendedor', 'frentista'];
const GORJETA = ['garcom', 'entregador', 'motorista_app', 'lanchonete', 'empacotador'];
const PESADO = ['servente', 'frentista', 'entregador', 'motorista_app', 'repositor', 'auxiliar_limpeza'];
const INFORMAL = ['entregador', 'servente', 'cuidador', 'motorista_app', 'professor_particular'];

export const JOB_EVENTS: readonly GameEvent[] = [
  // ----- release 0.0.4: servidores públicos (concursos civis) -----
  {
    id: 'job_servidor_posse',
    once: true,
    weight: 8,
    tone: 'good',
    conditions: { minAge: 18, economy: { jobCategory: ['concurso'] } },
    text: 'Primeiro mês no cargo público: crachá novo, sala com ar-condicionado barulhento e uma pilha de processos esperando.',
    choices: [
      { id: 'mergulhar', label: 'Mergulhar no serviço', effects: { stats: { intelligence: 1, happiness: 2 } }, resultText: 'Em pouco tempo você já sabia onde ficava cada carimbo.' },
      { id: 'devagar', label: 'Ir com calma', effects: { stats: { happiness: 3 } }, resultText: 'Estabilidade tem dessas: dá para respirar.' },
    ],
  },
  {
    id: 'job_servidor_greve',
    weight: 3,
    cooldownYears: 6,
    conditions: { minAge: 18, economy: { jobCategory: ['concurso'] } },
    text: 'O sindicato da categoria convocou greve por reajuste. A assembleia está cheia e dividida.',
    choices: [
      { id: 'aderir', label: 'Aderir à greve', effects: { stats: { happiness: 1 }, money: -800 }, resultText: 'Depois de três semanas saiu um reajuste pequeno, e o ponto foi descontado.' },
      { id: 'trabalhar', label: 'Continuar trabalhando', effects: { stats: { happiness: -2 } }, resultText: 'Alguns colegas pararam de falar com você.' },
    ],
  },
  {
    id: 'job_servidor_concurso_novo',
    weight: 3,
    cooldownYears: 5,
    conditions: { minAge: 20, economy: { jobCategory: ['concurso'] } },
    text: 'Abriu um concurso para um cargo maior e um colega de sala jura que dá para passar estudando de madrugada.',
    choices: [
      { id: 'estudar', label: 'Montar um cronograma de estudo', effects: { stats: { intelligence: 2, happiness: -2 } }, resultText: 'Apostilas na mesa de jantar outra vez. Os concursos ficam em Ocupação → Carreiras.' },
      { id: 'ficar', label: 'Ficar onde está', effects: { stats: { happiness: 1 } }, resultText: 'Você gosta do que tem.' },
    ],
  },
  {
    id: 'job_rude_customer',
    conditions: { minAge: 16, economy: { jobs: ATENDIMENTO } },
    weight: 5,
    text: 'Um cliente grosseiro gritou com você na frente de todo mundo por causa de um troco.',
    choices: [
      { id: 'calm', label: 'Respirar fundo e resolver com educação', effects: { stats: { happiness: -2 }, economy: { jobPerformance: 8 } }, resultText: 'O gerente viu tudo e elogiou sua paciência.' },
      { id: 'reply', label: 'Responder à altura', effects: { stats: { happiness: 3 }, economy: { jobPerformance: -12 } }, risk: { chance: 0.25, effects: { economy: { loseJob: 'Bateu boca com cliente: você foi mandado embora.' } }, resultText: 'O cliente reclamou com a gerência. Você foi demitido(a).' }, resultText: 'Lavou a alma, mas levou uma advertência.' },
    ],
  },
  {
    id: 'job_overtime_fight_eve',
    conditions: { minAge: 18, economy: { employed: true }, fighting: { contracted: true } },
    weight: 4,
    text: 'Seu chefe pede hora extra no fim de semana… justo na véspera da sua luta.',
    choices: [
      { id: 'accept', label: 'Fazer a hora extra', effects: { stats: { athletic: -1, happiness: -3 }, economy: { jobPerformance: 10, post: { cat: 'salario', amount: 350, label: 'Hora extra' } } }, resultText: 'Dinheiro a mais, perna pesada no dia seguinte.' },
      { id: 'refuse', label: 'Explicar que tem luta e recusar', effects: { economy: { jobPerformance: -8 }, fighter: { reputation: 1 } }, resultText: 'O chefe torceu o nariz, mas você chegou inteiro(a) para a luta.' },
    ],
  },
  {
    id: 'job_cash_theft_accused',
    conditions: { minAge: 16, economy: { jobs: CAIXA } },
    weight: 3,
    once: true,
    text: 'Faltou dinheiro no caixa. O colega que fechou com você jura que foi você.',
    choices: [
      { id: 'prove', label: 'Pedir as imagens da câmera', effects: { stats: { happiness: -2 } }, risk: { chance: 0.25, effects: { economy: { loseJob: 'Sem provas, a empresa preferiu te desligar.' } }, resultText: 'A câmera estava desligada. Sobrou para você: demissão.' }, resultText: 'As imagens mostraram o colega embolsando as notas. Você foi inocentado(a).' },
      { id: 'pay', label: 'Pagar a diferença para evitar confusão', effects: { stats: { happiness: -4 }, economy: { post: { cat: 'multas', amount: -600, label: 'Diferença do caixa' }, jobPerformance: -3 } }, resultText: 'Saiu caro, mas o assunto morreu.' },
    ],
  },
  {
    id: 'job_big_tip',
    conditions: { minAge: 16, economy: { jobs: GORJETA } },
    weight: 5,
    text: 'Um cliente gostou tanto do atendimento que deixou uma gorjeta generosa.',
    choices: [
      { id: 'keep', label: 'Agradecer e guardar', effects: { stats: { happiness: 4 }, economy: { post: { cat: 'trabalho_informal', amount: 300, label: 'Gorjeta' } } }, resultText: 'Dia ganho.' },
      { id: 'share', label: 'Dividir com a equipe', effects: { stats: { happiness: 3 }, economy: { post: { cat: 'trabalho_informal', amount: 100, label: 'Gorjeta (dividida)' }, jobPerformance: 6 } }, resultText: 'A equipe passou a te tratar diferente. Para melhor.' },
    ],
  },
  {
    id: 'job_supervisor_offer',
    conditions: { minAge: 19, economy: { employed: true, jobCategory: ['meio_periodo', 'formal'] } },
    weight: 3,
    text: 'A gerência quer você como supervisor(a). Mais responsabilidade, mais dinheiro, menos tempo livre.',
    choices: [
      { id: 'accept', label: 'Aceitar a promoção', effects: { stats: { happiness: 2 }, economy: { promote: true } }, resultText: 'Crachá novo e a equipe agora responde a você.' },
      { id: 'decline', label: 'Recusar para ter tempo de treinar', effects: { stats: { happiness: 1 }, economy: { jobPerformance: -4 } }, resultText: 'O tatame agradece.' },
    ],
  },
  {
    id: 'job_mass_layoff',
    conditions: { minAge: 18, economy: { employed: true, econYear: ['crise'] } },
    weight: 4,
    text: 'Corre o boato: a empresa vai cortar metade da equipe até o fim do mês.',
    choices: [
      { id: 'stay', label: 'Dar o sangue para não entrar na lista', effects: { stats: { happiness: -3 }, economy: { jobPerformance: 12 } }, risk: { chance: 0.35, effects: { economy: { loseJob: 'Você entrou na lista de cortes da crise.' } }, resultText: 'Não adiantou: seu nome estava na lista.' }, resultText: 'Você escapou do corte.' },
      { id: 'leave', label: 'Sair antes, com acordo', effects: { economy: { loseJob: 'Você saiu num acordo antes do corte.', post: { cat: 'salario', amount: 2500, label: 'Acordo de saída' } } }, resultText: 'Saiu com um dinheirinho e a cabeça erguida.' },
    ],
  },
  {
    id: 'job_minor_accident',
    conditions: { minAge: 18, economy: { jobs: PESADO } },
    weight: 3,
    text: 'Um descuido no trabalho e você se machucou de leve.',
    choices: [
      { id: 'rest', label: 'Pegar atestado e descansar', effects: { economy: { jobPerformance: -5 }, health: { injury: 'distensao' } }, resultText: 'Uns dias em casa, gelo e paciência.' },
      { id: 'work', label: 'Trabalhar assim mesmo', effects: { economy: { jobPerformance: 4 }, stats: { health: -2 } }, risk: { chance: 0.35, effects: { health: { injury: 'entorse_tornozelo' } }, resultText: 'Piorou. Agora vai ter que parar de qualquer jeito.' }, resultText: 'Doeu, mas passou.' },
    ],
  },
  {
    id: 'job_recognized_fighter',
    conditions: { minAge: 16, economy: { employed: true }, fighting: { reputation: { min: 15 } } },
    weight: 4,
    text: 'Um cliente te reconheceu das lutas e quer uma foto no meio do expediente.',
    choices: [
      { id: 'photo', label: 'Tirar a foto e conversar', effects: { stats: { happiness: 4 }, fighter: { reputation: 1 }, economy: { jobPerformance: -2 } }, resultText: 'A foto rodou nas redes. Mais gente sabe quem você é.' },
      { id: 'later', label: 'Pedir para ser depois do turno', effects: { economy: { jobPerformance: 3 } }, resultText: 'Profissional dos dois lados.' },
    ],
  },
  {
    id: 'job_informal_inspection',
    conditions: { minAge: 18, economy: { jobs: INFORMAL } },
    weight: 3,
    text: 'Uma fiscalização aparece. Sem carteira assinada, você fica sem saber o que dizer.',
    choices: [
      { id: 'formalize', label: 'Pedir para ser registrado(a)', effects: { economy: { jobPerformance: -5 } }, risk: { chance: 0.3, effects: { economy: { loseJob: 'O patrão preferiu te dispensar a assinar a carteira.' } }, resultText: 'Em vez de assinar, o patrão te dispensou.' }, resultText: 'Ficou no "vamos ver". Pelo menos você perguntou.' },
      { id: 'quiet', label: 'Ficar quieto(a)', effects: { stats: { happiness: -2 } }, resultText: 'Tudo como antes: mais dinheiro na mão, nenhum direito.' },
    ],
  },
  {
    id: 'job_late_salary',
    conditions: { minAge: 16, economy: { employed: true } },
    weight: 3,
    text: 'O patrão atrasou o salário de novo. "Semana que vem cai, juro."',
    choices: [
      { id: 'wait', label: 'Esperar mais um pouco', effects: { stats: { happiness: -3 } }, risk: { chance: 0.25, effects: { economy: { post: { cat: 'salario', amount: -800, label: 'Salário que nunca veio' } } }, resultText: 'Parte do dinheiro nunca veio.' }, resultText: 'Caiu, com uma semana de atraso.' },
      { id: 'quit', label: 'Pedir as contas', effects: { economy: { loseJob: 'Você pediu as contas depois de mais um atraso.' } }, resultText: 'Melhor procurar algo mais sério.' },
    ],
  },
  {
    id: 'job_apprentice_star',
    conditions: { minAge: 14, maxAge: 18, economy: { jobs: ['jovem_aprendiz', 'estagio'] } },
    weight: 4,
    once: true,
    text: 'Seu supervisor elogiou você na reunião: "Esse(a) aprendiz vai longe."',
    choices: [
      { id: 'thanks', label: 'Agradecer e se dedicar mais', effects: { stats: { intelligence: 2, happiness: 3 }, economy: { jobPerformance: 10 } }, resultText: 'Você ganhou confiança e um padrinho na empresa.' },
      { id: 'shy', label: 'Ficar vermelho(a) e mudar de assunto', effects: { stats: { happiness: 2 } }, resultText: 'Por dentro, você comemorou.' },
    ],
  },
  {
    id: 'job_internship_hire',
    conditions: { minAge: 18, economy: { jobs: ['estagio'] } },
    weight: 5,
    once: true,
    text: 'O estágio acabou e a empresa quer te efetivar como auxiliar administrativo.',
    choices: [
      { id: 'accept', label: 'Aceitar a efetivação', effects: { stats: { happiness: 4 }, economy: { jobOffer: 'auxiliar_adm' } }, resultText: 'Carteira assinada e salário de verdade.' },
      { id: 'decline', label: 'Recusar para focar na luta', effects: { economy: { loseJob: 'Você encerrou o estágio.' } }, resultText: 'Mais tempo livre para treinar.' },
    ],
  },
  {
    id: 'job_boss_persecution',
    conditions: { minAge: 18, economy: { employed: true } },
    weight: 2,
    text: 'O novo gerente pegou implicância com você: escala ruim, broncas na frente dos outros.',
    choices: [
      { id: 'hr', label: 'Levar o caso ao RH', effects: { stats: { happiness: 1 } }, risk: { chance: 0.3, effects: { economy: { jobPerformance: -15 } }, resultText: 'O RH ficou do lado dele. O clima piorou.' }, resultText: 'O gerente foi chamado para conversar e maneirou.' },
      { id: 'endure', label: 'Aguentar calado(a)', effects: { stats: { happiness: -5 } }, resultText: 'Engoliu sapo. O treino virou válvula de escape.' },
      { id: 'quit', label: 'Pedir demissão', effects: { stats: { happiness: 3 }, economy: { loseJob: 'Você saiu por causa do gerente.' } }, resultText: 'Paz de espírito não tem preço. Mas tem conta para pagar.' },
    ],
  },
  {
    id: 'job_night_shift',
    conditions: { minAge: 18, economy: { employed: true, jobCategory: ['formal'] } },
    weight: 3,
    text: 'Ofereceram o turno da noite, com adicional noturno.',
    choices: [
      { id: 'accept', label: 'Aceitar o turno da noite', effects: { stats: { health: -2, happiness: -1 }, economy: { post: { cat: 'salario', amount: 2400, label: 'Adicional noturno' } } }, resultText: 'Mais dinheiro, menos sono.' },
      { id: 'decline', label: 'Ficar no turno do dia', effects: {}, resultText: 'Dormir também é treino.' },
    ],
  },
  {
    id: 'job_driving_license',
    conditions: { minAge: 18, maxAge: 40, flagsNone: ['cnh'] },
    weight: 3,
    once: true,
    text: 'Um parente oferece pagar metade da autoescola para você tirar a carteira de motorista.',
    choices: [
      { id: 'go', label: 'Fazer a autoescola (R$ 1.500)', effects: { economy: { post: { cat: 'compras', amount: -1500, label: 'Autoescola (metade)' } } }, risk: { chance: 0.7, effects: { setFlags: { cnh: true }, stats: { happiness: 3 } }, resultText: 'Aprovado(a) de primeira! CNH na mão: dá para ser motorista de aplicativo.' }, resultText: 'Você reprovou na prova prática. Dá para tentar de novo em Atividades.' },
      { id: 'later', label: 'Deixar para depois', effects: {}, resultText: 'Ônibus e bicicleta por enquanto.' },
    ],
  },
  {
    id: 'job_happy_hour',
    conditions: { minAge: 18, economy: { employed: true } },
    weight: 4,
    text: 'Os colegas te chamam para o happy hour depois do expediente.',
    choices: [
      { id: 'go', label: 'Ir junto', effects: { stats: { happiness: 3 }, economy: { jobPerformance: 3, post: { cat: 'padrao_vida', amount: -80, label: 'Happy hour' } }, social: { meet: { context: 'work' } } }, resultText: 'Boas risadas e um(a) amigo(a) novo(a) no trabalho.' },
      { id: 'train', label: 'Ir direto para o treino', effects: { stats: { athletic: 1 } }, resultText: 'Foco total.' },
    ],
  },
];
