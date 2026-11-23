import type { GameEvent } from '../../../engine';

/**
 * Eventos aleatórios novos (release 0.0.1): todas as idades e temas, com tom (bom/ruim — a sorte inclina o peso) e
 * riscos com tom (a sorte inclina a chance). Intervalo de repetição: o padrão de `limits.eventCooldown`.
 */
type E = Omit<GameEvent, 'weight'> & { weight?: number };
const ev = (e: E): GameEvent => ({ weight: 4, ...e });

export const RANDOM_EVENTS: readonly GameEvent[] = [
  // ----- infância -----
  ev({ id: 'r_kid_lost_tooth', tone: 'good', conditions: { minAge: 5, maxAge: 8 }, text: 'Seu dente da frente caiu no meio do almoço.', choices: [
    { id: 'pillow', label: 'Colocar embaixo do travesseiro', resultText: 'De manhã, uma moeda apareceu no lugar.', effects: { stats: { happiness: 4 }, money: 2 } },
    { id: 'keep', label: 'Guardar numa caixinha', resultText: 'Virou relíquia da família.', effects: { stats: { happiness: 2 } } },
  ] }),
  ev({ id: 'r_kid_treehouse', tone: 'good', conditions: { minAge: 6, maxAge: 11 }, text: 'Seu tio topou construir uma casinha na árvore com você.', choices: [
    { id: 'build', label: 'Ajudar a construir', resultText: 'Ficou torta, mas é a melhor casinha do bairro.', effects: { stats: { happiness: 5, athletic: 1 } }, risk: { chance: 0.15, resultText: 'Você caiu da escada e ralou o joelho inteiro.', effects: { stats: { health: -3, happiness: 2 } } } },
    { id: 'watch', label: 'Só dar palpite', resultText: 'Você comandou a obra de baixo.', effects: { stats: { happiness: 3 } } },
  ] }),
  ev({ id: 'r_kid_lost_store', tone: 'bad', conditions: { minAge: 4, maxAge: 7 }, text: 'Você se perdeu dos seus pais no supermercado.', choices: [
    { id: 'staff', label: 'Pedir ajuda a um funcionário', resultText: 'Chamaram seu nome no alto-falante e seus pais apareceram correndo.', effects: { stats: { intelligence: 1 } } },
    { id: 'cry', label: 'Chorar no corredor', resultText: 'Uma senhora gentil te levou até o caixa.', effects: { stats: { happiness: -3 } } },
  ] }),
  ev({ id: 'r_kid_pet_wish', tone: 'good', conditions: { minAge: 6, maxAge: 12 }, text: 'Você implorou por um bichinho de estimação.', choices: [
    { id: 'fish', label: 'Aceitar um peixinho', resultText: 'O Nemo virou o rei do seu quarto.', effects: { stats: { happiness: 3 } } },
    { id: 'insist', label: 'Insistir num cachorro', resultText: 'Depois de semanas de campanha, chegou um vira-lata caramelo.', effects: { stats: { happiness: 6 }, setFlags: { temCachorro: true } }, risk: { chance: 0.5, tone: 'bad', resultText: 'A resposta foi um "não" definitivo.', effects: { stats: { happiness: -3 } } } },
  ] }),
  ev({ id: 'r_kid_science_kit', tone: 'good', conditions: { minAge: 7, maxAge: 12 }, text: 'Você ganhou um kit de ciências de aniversário.', choices: [
    { id: 'all', label: 'Fazer todos os experimentos', resultText: 'O vulcão de bicarbonato foi um sucesso.', effects: { stats: { intelligence: 3, happiness: 2 } } },
    { id: 'mix', label: 'Misturar tudo de uma vez', resultText: 'Fez espuma até o teto. Bronca garantida.', effects: { stats: { happiness: 2 } } },
  ] }),
  ev({ id: 'r_toddler_park', tone: 'good', conditions: { minAge: 3, maxAge: 5 }, text: 'No parquinho, você descobriu o escorregador gigante.', choices: [
    { id: 'slide', label: 'Descer de novo e de novo', resultText: 'Foram umas cinquenta vezes.', effects: { stats: { happiness: 4, athletic: 1 } } },
    { id: 'sand', label: 'Ir para a caixa de areia', resultText: 'Você construiu um castelo enorme.', effects: { stats: { happiness: 3 } } },
  ] }),
  ev({ id: 'r_toddler_bath', tone: 'bad', conditions: { minAge: 3, maxAge: 5 }, text: 'Hora do banho e você decidiu que não ia de jeito nenhum.', choices: [
    { id: 'run', label: 'Fugir pela casa', resultText: 'Foi pego no corredor. Banho com bronca.', effects: { stats: { happiness: -1 } } },
    { id: 'toy', label: 'Negociar um patinho de borracha', resultText: 'Acordo fechado. Banho divertido.', effects: { stats: { happiness: 2 } } },
  ] }),
  ev({ id: 'r_toddler_words', tone: 'good', conditions: { minAge: 3, maxAge: 4 }, text: 'Você falou uma palavra difícil e a família toda aplaudiu.', choices: [
    { id: 'repeat', label: 'Repetir para todo mundo', resultText: 'Virou a história preferida do almoço de domingo.', effects: { stats: { intelligence: 2, happiness: 2 } } },
    { id: 'shy', label: 'Esconder o rosto', resultText: 'Que fofura.', effects: { stats: { happiness: 1 } } },
  ] }),
  ev({ id: 'r_toddler_drawing_wall', tone: 'bad', conditions: { minAge: 3, maxAge: 5 }, text: 'Você achou giz de cera e a parede da sala parecia uma tela em branco.', choices: [
    { id: 'draw', label: 'Desenhar uma obra-prima', resultText: 'Arte moderna. Castigo clássico.', effects: { stats: { happiness: 2 } } },
    { id: 'paper', label: 'Pedir um papel', resultText: 'Seu desenho foi para a geladeira.', effects: { stats: { happiness: 3, intelligence: 1 } } },
  ] }),
  // ----- escola -----
  ev({ id: 'r_school_talent_show', tone: 'good', conditions: { minAge: 9, maxAge: 17, enrolled: true }, text: 'A escola vai fazer um show de talentos.', choices: [
    { id: 'sing', label: 'Subir no palco', resultText: 'Aplaudiram de pé!', effects: { stats: { happiness: 5 }, school: { popularity: 6 } }, risk: { chance: 0.35, resultText: 'Você esqueceu tudo no meio. Riram, mas passa.', effects: { stats: { happiness: -4 }, school: { popularity: -3 } } } },
    { id: 'crew', label: 'Ajudar nos bastidores', resultText: 'Ninguém viu, mas sem você não teria show.', effects: { stats: { happiness: 2 } } },
  ] }),
  ev({ id: 'r_school_lost_homework', tone: 'bad', conditions: { minAge: 7, maxAge: 17, enrolled: true }, text: 'Você esqueceu de fazer o trabalho que valia nota.', choices: [
    { id: 'truth', label: 'Assumir para o professor', resultText: 'Ganhou mais um dia de prazo pela honestidade.', effects: { school: { average: -1 } } },
    { id: 'excuse', label: 'Inventar que o cachorro comeu', resultText: 'Colou.', effects: { stats: { happiness: 1 } }, risk: { chance: 0.6, resultText: 'O professor não caiu e ainda ligou para casa.', effects: { school: { average: -3, discipline: -4 } } } },
  ] }),
  ev({ id: 'r_school_new_kid', tone: 'good', conditions: { minAge: 8, maxAge: 16, enrolled: true }, text: 'Chegou um aluno novo na turma e ninguém fala com ele.', choices: [
    { id: 'talk', label: 'Puxar conversa', resultText: 'Virou seu melhor amigo daquele ano.', effects: { stats: { happiness: 3 }, social: { meet: { context: 'school' } } } },
    { id: 'ignore', label: 'Deixar quieto', resultText: 'Você seguiu com a sua turma.' },
  ] }),
  ev({ id: 'r_school_field_trip_museum', tone: 'good', conditions: { minAge: 10, maxAge: 17, enrolled: true }, text: 'Excursão ao museu de ciências.', choices: [
    { id: 'learn', label: 'Prestar atenção no guia', resultText: 'Você saiu cheio de curiosidade.', effects: { stats: { intelligence: 2 } } },
    { id: 'fun', label: 'Bagunçar com os amigos no ônibus', resultText: 'A viagem foi a melhor parte.', effects: { stats: { happiness: 3 }, school: { discipline: -2 } } },
  ] }),
  // ----- faculdade -----
  ev({ id: 'r_college_group_slacker', tone: 'bad', conditions: { college: { enrolled: true } }, text: 'No trabalho em grupo, um colega não fez nada.', choices: [
    { id: 'cover', label: 'Fazer a parte dele', resultText: 'Nota boa, noites mal dormidas.', effects: { stats: { intelligence: 1, health: -1 } } },
    { id: 'report', label: 'Avisar o professor', resultText: 'O professor separou as notas. Justiça feita.', effects: { stats: { happiness: 1 } } },
  ] }),
  ev({ id: 'r_college_scholarship_research', tone: 'good', conditions: { college: { enrolled: true }, stats: { intelligence: { min: 60 } } }, text: 'Uma professora te convidou para a iniciação científica.', choices: [
    { id: 'yes', label: 'Aceitar', resultText: 'Bolsa pequena, aprendizado enorme.', effects: { stats: { intelligence: 3 }, money: 3000 } },
    { id: 'no', label: 'Recusar por falta de tempo', resultText: 'Fica para outra vez.' },
  ] }),
  ev({ id: 'r_college_strike', tone: 'bad', conditions: { college: { enrolled: true } }, text: 'Os professores entraram em greve e as aulas pararam.', choices: [
    { id: 'study', label: 'Estudar por conta própria', resultText: 'Você voltou mais preparado que a turma.', effects: { stats: { intelligence: 2 } } },
    { id: 'rest', label: 'Aproveitar as férias forçadas', resultText: 'Descansou, mas o semestre vai atrasar.', effects: { stats: { happiness: 3 } } },
  ] }),
  // ----- trabalho -----
  ev({ id: 'r_work_birthday_party', tone: 'good', conditions: { economy: { employed: true } }, text: 'O pessoal do trabalho fez uma festa surpresa no seu aniversário.', choices: [
    { id: 'speech', label: 'Fazer um discurso emocionado', resultText: 'Teve gente chorando.', effects: { stats: { happiness: 5 } } },
    { id: 'cake', label: 'Só cortar o bolo', resultText: 'O bolo estava ótimo.', effects: { stats: { happiness: 3 } } },
  ] }),
  ev({ id: 'r_work_mistake', tone: 'bad', conditions: { economy: { employed: true } }, text: 'Você cometeu um erro que custou dinheiro à empresa.', choices: [
    { id: 'own', label: 'Assumir o erro', resultText: 'O chefe valorizou a sinceridade.', effects: { stats: { happiness: -2 } } },
    { id: 'blame', label: 'Jogar a culpa no sistema', resultText: 'Ninguém investigou.', effects: { stats: { happiness: 1 } }, risk: { chance: 0.4, resultText: 'Descobriram. Advertência por escrito.', effects: { stats: { happiness: -5 } } } },
  ] }),
  ev({ id: 'r_work_remote_day', tone: 'good', conditions: { economy: { employed: true } }, text: 'A empresa liberou um dia por semana de trabalho em casa.', choices: [
    { id: 'yes', label: 'Trabalhar de pijama', resultText: 'Produtividade e conforto.', effects: { stats: { happiness: 3 } } },
    { id: 'office', label: 'Continuar indo ao escritório', resultText: 'Você gosta do cafezinho com a equipe.', effects: { stats: { happiness: 1 } } },
  ] }),
  ev({ id: 'r_work_headhunter', tone: 'good', conditions: { economy: { employed: true }, minAge: 23 }, text: 'Uma recrutadora te chamou para conversar sobre uma vaga melhor.', choices: [
    { id: 'listen', label: 'Ouvir a proposta', resultText: 'Você ficou sabendo quanto vale no mercado — e pediu aumento.', effects: { stats: { happiness: 2 }, economy: { promote: true } }, risk: { chance: 0.5, tone: 'bad', resultText: 'A vaga sumiu antes da entrevista.', effects: { stats: { happiness: -1 } } } },
    { id: 'no', label: 'Dizer que está bem onde está', resultText: 'Lealdade é coisa rara.' },
  ] }),
  // ----- rua e cidade -----
  ev({ id: 'r_street_wallet_found', tone: 'good', conditions: { minAge: 10 }, text: 'Você achou uma carteira cheia de dinheiro na calçada.', choices: [
    { id: 'return', label: 'Devolver ao dono', resultText: 'O dono agradeceu emocionado e te deu uma recompensa.', effects: { stats: { happiness: 4 }, money: 200 } },
    { id: 'keep', label: 'Ficar com o dinheiro', resultText: 'Dinheiro no bolso, consciência pesada.', effects: { money: 600, stats: { happiness: -2 } } },
  ] }),
  ev({ id: 'r_street_flood', tone: 'bad', conditions: { minAge: 8 }, text: 'Um temporal alagou a rua e você ficou ilhado na volta para casa.', choices: [
    { id: 'wait', label: 'Esperar a água baixar', resultText: 'Duas horas num ponto de ônibus.', effects: { stats: { happiness: -2 } } },
    { id: 'cross', label: 'Atravessar a água', resultText: 'Chegou em casa encharcado, mas chegou.', effects: { stats: { happiness: -1 } }, risk: { chance: 0.25, resultText: 'Pegou uma virose daquelas.', effects: { stats: { health: -5 } } } },
  ] }),
  ev({ id: 'r_street_neighbor_help', tone: 'good', conditions: { minAge: 12 }, text: 'A vizinha idosa pediu ajuda para levar as compras.', choices: [
    { id: 'help', label: 'Ajudar', resultText: 'Ganhou bolo caseiro e uma amiga para a vida.', effects: { stats: { happiness: 3 } } },
    { id: 'hurry', label: 'Dizer que está com pressa', resultText: 'Você seguiu, meio sem graça.' },
  ] }),
  ev({ id: 'r_street_robbed', tone: 'bad', conditions: { minAge: 14 }, text: 'Um homem levou seu celular no ponto de ônibus.', choices: [
    { id: 'give', label: 'Entregar sem reagir', resultText: 'Perdeu o celular, mas ficou inteiro.', effects: { money: -1200, stats: { happiness: -4 } } },
    { id: 'chase', label: 'Correr atrás', resultText: 'Você recuperou o celular!', effects: { stats: { happiness: 3 } }, risk: { chance: 0.55, resultText: 'Ele sumiu na multidão e você ainda torceu o pé.', effects: { money: -1200, health: { injury: 'random' } } } },
  ] }),
  // ----- viagem -----
  ev({ id: 'r_travel_beach_family', tone: 'good', conditions: { minAge: 3 }, text: 'A família alugou uma casa na praia no feriado.', choices: [
    { id: 'go', label: 'Passar o dia no mar', resultText: 'Sol, areia e sorvete. Feriado perfeito.', effects: { stats: { happiness: 6 }, scene: 'praia' } },
    { id: 'shade', label: 'Ficar na sombra', resultText: 'Você leu um livro inteiro.', effects: { stats: { happiness: 3, intelligence: 1 }, scene: 'praia' } },
  ] }),
  ev({ id: 'r_travel_lost_bag', tone: 'bad', conditions: { minAge: 18 }, text: 'A companhia aérea perdeu sua mala na viagem.', choices: [
    { id: 'claim', label: 'Brigar pela indenização', resultText: 'Depois de meses, saiu o dinheiro.', effects: { money: 1500 } },
    { id: 'buy', label: 'Comprar roupas novas e seguir', resultText: 'A viagem continuou, a fatura do cartão também.', effects: { money: -900, stats: { happiness: 1 } } },
  ] }),
  ev({ id: 'r_travel_backpack', tone: 'good', conditions: { minAge: 18, maxAge: 35 }, text: 'Uns amigos chamaram para um mochilão pelo Nordeste.', choices: [
    { id: 'go', label: 'Ir', resultText: 'Dormiu em rede, comeu tapioca, voltou outra pessoa.', effects: { money: -2500, stats: { happiness: 8 }, scene: 'praia' } },
    { id: 'no', label: 'Ficar e economizar', resultText: 'Fica para o ano que vem.', effects: { stats: { happiness: -1 } } },
  ] }),
  // ----- saúde -----
  ev({ id: 'r_health_flu', tone: 'bad', conditions: { minAge: 3 }, text: 'Uma gripe forte te derrubou por uma semana.', choices: [
    { id: 'rest', label: 'Repousar direito', resultText: 'Saiu novinho em folha.', effects: { stats: { health: -1 } } },
    { id: 'push', label: 'Seguir a rotina assim mesmo', resultText: 'Arrastou a gripe por um mês.', effects: { stats: { health: -4, happiness: -2 } } },
  ] }),
  ev({ id: 'r_health_glasses', tone: 'bad', conditions: { minAge: 8, maxAge: 60 }, text: 'Você está apertando os olhos para ler. O oftalmologista receitou óculos.', choices: [
    { id: 'wear', label: 'Usar os óculos', resultText: 'O mundo ficou nítido de novo.', effects: { stats: { intelligence: 1 } } },
    { id: 'refuse', label: 'Recusar por vaidade', resultText: 'Dor de cabeça constante.', effects: { stats: { health: -2, happiness: -1 } } },
  ] }),
  ev({ id: 'r_health_running_group', tone: 'good', conditions: { minAge: 16 }, text: 'Um grupo de corrida do parque te chamou para treinar junto.', choices: [
    { id: 'join', label: 'Entrar no grupo', resultText: 'Correu sua primeira prova de 5 km.', effects: { stats: { athletic: 2, health: 2, happiness: 2 } } },
    { id: 'no', label: 'Deixar para depois', resultText: 'O tênis continua na caixa.' },
  ] }),
  ev({ id: 'r_health_back_pain', tone: 'bad', conditions: { minAge: 30 }, text: 'Você acordou com uma dor nas costas que não passa.', choices: [
    { id: 'doctor', label: 'Ir ao médico', resultText: 'Postura. Alongamento todo dia e melhorou.', effects: { money: -300, stats: { health: 1 } } },
    { id: 'ignore', label: 'Esperar passar', resultText: 'Passou… depois de um mês.', effects: { stats: { health: -3, happiness: -2 } } },
  ] }),
  // ----- dinheiro -----
  ev({ id: 'r_money_raffle', tone: 'good', conditions: { minAge: 12 }, text: 'Você comprou uma rifa da igreja do bairro.', choices: [
    { id: 'check', label: 'Conferir o resultado', resultText: 'Ganhou uma cesta básica e um liquidificador!', effects: { stats: { happiness: 4 }, money: 150 }, risk: { chance: 0.75, tone: 'bad', resultText: 'Não foi dessa vez.' } },
    { id: 'forget', label: 'Esquecer a rifa', resultText: 'Nunca soube se ganhou.' },
  ] }),
  ev({ id: 'r_money_old_coin', tone: 'good', conditions: { minAge: 10 }, text: 'Arrumando a gaveta, você achou umas moedas antigas.', choices: [
    { id: 'sell', label: 'Vender para um colecionador', resultText: 'Valiam mais do que você imaginava.', effects: { money: 800, stats: { happiness: 2 } } },
    { id: 'keep', label: 'Guardar de lembrança', resultText: 'Ficaram na estante.', effects: { stats: { happiness: 1 } } },
  ] }),
  ev({ id: 'r_money_bill_shock', tone: 'bad', conditions: { minAge: 18 }, text: 'A conta de luz chegou com um valor absurdo.', choices: [
    { id: 'pay', label: 'Pagar e economizar no mês', resultText: 'Banho rápido e luz apagada por semanas.', effects: { money: -700 } },
    { id: 'contest', label: 'Contestar na companhia', resultText: 'Era erro de leitura! Devolveram a diferença.', effects: { money: -200 }, risk: { chance: 0.5, resultText: 'Perdeu a manhã na fila e pagou tudo igual.', effects: { money: -700, stats: { happiness: -2 } } } },
  ] }),
  ev({ id: 'r_money_friend_debt', tone: 'bad', conditions: { minAge: 18 }, text: 'Um amigo que te devia dinheiro sumiu.', choices: [
    { id: 'charge', label: 'Cobrar com jeito', resultText: 'Ele pagou metade e pediu desculpas.', effects: { money: 400 } },
    { id: 'forget', label: 'Deixar para lá', resultText: 'O dinheiro foi; a amizade esfriou.', effects: { stats: { happiness: -2 } } },
  ] }),
  // ----- luta -----
  ev({ id: 'r_fight_kid_fan', tone: 'good', conditions: { minAge: 18, fighting: { hasFought: true, reputation: { min: 15 } } }, text: 'Uma criança te pediu um autógrafo na padaria.', choices: [
    { id: 'sign', label: 'Assinar e tirar foto', resultText: 'O pai dela postou e marcou você.', effects: { stats: { happiness: 4 }, fighter: { reputation: 1 } } },
    { id: 'shy', label: 'Ficar sem graça', resultText: 'Assinou rapidinho e saiu.', effects: { stats: { happiness: 2 } } },
  ] }),
  ev({ id: 'r_fight_gym_bully', tone: 'bad', conditions: { minAge: 12, fighting: { hasGym: true } }, text: 'Um veterano da academia vive pegando pesado com os iniciantes.', choices: [
    { id: 'face', label: 'Encarar no treino', resultText: 'Você segurou firme e ganhou respeito.', effects: { fighter: { skills: { grappling: 0.5, trocacao: 0.5 } }, stats: { happiness: 2 } }, risk: { chance: 0.3, resultText: 'Ele pegou pesado demais e você se machucou.', effects: { health: { injury: 'random' } } } },
    { id: 'coach', label: 'Falar com o professor', resultText: 'O professor conversou com ele. O clima melhorou.', effects: { stats: { happiness: 1 } } },
  ] }),
  ev({ id: 'r_fight_seminar', tone: 'good', conditions: { minAge: 14, fighting: { hasGym: true } }, text: 'Um campeão de outra equipe veio dar um seminário na sua academia.', choices: [
    { id: 'go', label: 'Participar', resultText: 'Aprendeu uma posição que vai usar para sempre.', effects: { money: -150, fighter: { skills: { grappling: 1, trocacao: 1 } } } },
    { id: 'skip', label: 'Não ir', resultText: 'Ficou sabendo depois que foi ótimo.' },
  ] }),
  ev({ id: 'r_fight_weight_struggle', tone: 'bad', conditions: { minAge: 18, fighting: { hasFought: true } }, text: 'Você engordou nas férias e está longe do peso da categoria.', choices: [
    { id: 'diet', label: 'Dieta séria com nutricionista', resultText: 'Voltou ao peso sem sofrer tanto.', effects: { money: -800, stats: { health: 1 } } },
    { id: 'sauna', label: 'Secar na base da sauna', resultText: 'Bateu o peso, mas ficou fraco.', effects: { stats: { health: -4 } } },
  ] }),
  // ----- vida noturna (eventos aleatórios do ano) -----
  ev({ id: 'r_night_invite', tone: 'good', conditions: { minAge: 18, maxAge: 40 }, text: 'Seus amigos montaram uma noite de karaokê.', choices: [
    { id: 'sing', label: 'Pegar o microfone', resultText: 'Você foi a estrela da noite.', effects: { stats: { happiness: 5 } } },
    { id: 'watch', label: 'Só torcer', resultText: 'Riu até a barriga doer.', effects: { stats: { happiness: 3 } } },
  ] }),
  ev({ id: 'r_night_ex_seen', tone: 'bad', conditions: { minAge: 18, hasRelation: ['ex'] }, text: 'Você encontrou seu ex num bar, muito bem acompanhado.', choices: [
    { id: 'greet', label: 'Cumprimentar numa boa', resultText: 'Foi maduro. Você se sentiu bem.', effects: { stats: { happiness: 1 } } },
    { id: 'leave', label: 'Ir embora cedo', resultText: 'A noite acabou ali.', effects: { stats: { happiness: -3 } } },
  ] }),
  // ----- família e vida -----
  ev({ id: 'r_family_reunion', tone: 'good', conditions: { minAge: 6 }, text: 'Reencontro da família no interior, com primos que você não via há anos.', choices: [
    { id: 'go', label: 'Ir ao reencontro', resultText: 'Churrasco, histórias antigas e fotos para o grupo da família.', effects: { stats: { happiness: 5 }, social: { parentsAffection: 3 } } },
    { id: 'skip', label: 'Dar uma desculpa', resultText: 'Sua mãe ficou chateada.', effects: { social: { parentsAffection: -3 } } },
  ] }),
  ev({ id: 'r_life_volunteer', tone: 'good', conditions: { minAge: 15 }, text: 'Uma ONG do bairro procura voluntários para o fim de semana.', choices: [
    { id: 'help', label: 'Ser voluntário', resultText: 'Você ajudou dezenas de pessoas e saiu mais leve.', effects: { stats: { happiness: 5 } } },
    { id: 'donate', label: 'Doar um pouco de dinheiro', resultText: 'Cada real ajuda.', effects: { money: -100, stats: { happiness: 2 } } },
  ] }),
  ev({ id: 'r_life_move_neighbors', tone: 'bad', conditions: { minAge: 18 }, text: 'Os vizinhos novos fazem festa toda noite.', choices: [
    { id: 'talk', label: 'Conversar com eles', resultText: 'Eles baixaram o som e ainda te convidaram para a próxima.', effects: { stats: { happiness: 2 } } },
    { id: 'complain', label: 'Reclamar com o síndico', resultText: 'Resolveu, mas o clima no prédio ficou frio.', effects: { stats: { happiness: -1 } } },
  ] }),
  ev({ id: 'r_life_cooking', tone: 'good', conditions: { minAge: 14 }, text: 'Você resolveu aprender a cozinhar de verdade.', choices: [
    { id: 'course', label: 'Fazer um curso rápido', resultText: 'Seu estrogonofe virou lenda na família.', effects: { money: -300, stats: { happiness: 3, health: 1 } } },
    { id: 'videos', label: 'Aprender com vídeos', resultText: 'Queimou duas panelas, mas pegou o jeito.', effects: { stats: { happiness: 2 } } },
  ] }),
  ev({ id: 'r_life_old_age_hobby', tone: 'good', conditions: { minAge: 60 }, text: 'No centro de convivência, chamaram você para o grupo de dança de salão.', choices: [
    { id: 'dance', label: 'Dançar', resultText: 'Você é o pé de valsa mais disputado.', effects: { stats: { happiness: 6, health: 2 } } },
    { id: 'cards', label: 'Preferir o carteado', resultText: 'Ganhou umas partidas e fez amigos.', effects: { stats: { happiness: 3 } } },
  ] }),
  ev({ id: 'r_life_grandchild_visit', tone: 'good', conditions: { minAge: 55, children: { min: 1 } }, text: 'A família toda veio passar o domingo com você.', choices: [
    { id: 'cook', label: 'Cozinhar para todo mundo', resultText: 'A casa ficou cheia de risada.', effects: { stats: { happiness: 6 } } },
    { id: 'rest', label: 'Pedir pizza e descansar', resultText: 'O importante foi estar junto.', effects: { stats: { happiness: 4 } } },
  ] }),
  ev({ id: 'r_life_scam_call', tone: 'bad', conditions: { minAge: 50 }, text: 'Ligaram dizendo que um parente estava em apuros e precisava de um depósito urgente.', choices: [
    { id: 'check', label: 'Desligar e ligar para o parente', resultText: 'Era golpe. Você não caiu.', effects: { stats: { intelligence: 1 } } },
    { id: 'pay', label: 'Fazer o depósito', resultText: 'Era golpe. O dinheiro sumiu.', effects: { money: -2000, stats: { happiness: -5 } } },
  ] }),
];
