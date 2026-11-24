import type { GameEvent } from '../../../engine';

/**
 * Acontecimentos do dia a dia (release 0.0.4): pequenas histórias aleatórias em todas as idades, para a vida não
 * ficar repetitiva. Valores baixos, nada de mecânica nova. Segunda pessoa, pt-BR.
 */
export const DAILY_EVENTS: readonly GameEvent[] = [
  // ----- infância (3–11) -----
  { id: 'd_kid_chuva', weight: 4, conditions: { minAge: 4, maxAge: 11 }, text: 'Caiu um temporal e a rua virou um rio de enxurrada.',
    choices: [
      { id: 'pular', label: 'Pular nas poças', resultText: 'Você voltou encharcad{o/a} e feliz da vida.', effects: { stats: { happiness: 4, health: -1 } } },
      { id: 'janela', label: 'Ver da janela com chocolate quente', resultText: 'Aconchego puro.', effects: { stats: { happiness: 2 } } },
    ] },
  { id: 'd_kid_figurinhas', weight: 4, conditions: { minAge: 6, maxAge: 12 }, text: 'Falta só uma figurinha para completar o álbum, e o colega tem repetida.',
    choices: [
      { id: 'trocar', label: 'Oferecer três figurinhas em troca', resultText: 'Álbum completo! Você mostrou para todo mundo.', effects: { stats: { happiness: 5 } } },
      { id: 'bafo', label: 'Desafiar para o bafo', resultText: 'Você ganhou no bafo.', effects: { stats: { happiness: 4 } }, risk: { chance: 0.5, resultText: 'Perdeu no bafo e ainda deixou cinco figurinhas.', effects: { stats: { happiness: -3 } } } },
    ] },
  { id: 'd_kid_vovo_historias', weight: 3, conditions: { minAge: 4, maxAge: 11 }, text: 'Na casa da avó, ela conta histórias de quando era criança, sem luz elétrica na roça.',
    choices: [
      { id: 'ouvir', label: 'Pedir mais uma história', resultText: 'Você dormiu no colo dela.', effects: { stats: { happiness: 3, intelligence: 1 } } },
      { id: 'brincar', label: 'Sair para brincar no quintal', resultText: 'Galinha, cachorro e pé de goiaba.', effects: { stats: { happiness: 2, athletic: 1 } } },
    ] },
  { id: 'd_kid_bicicleta', weight: 4, conditions: { minAge: 5, maxAge: 10 }, once: true, text: 'Hoje tiraram as rodinhas da sua bicicleta.',
    choices: [
      { id: 'ir', label: 'Pedalar sem medo', resultText: 'Dois tombos e, de repente, você estava andando sozinh{o/a}!', effects: { stats: { athletic: 2, happiness: 4 } } },
      { id: 'segura', label: 'Pedir para segurarem atrás', resultText: 'Ninguém estava segurando havia meia quadra. Você conseguiu.', effects: { stats: { happiness: 3, athletic: 1 } } },
    ] },
  { id: 'd_kid_festa_junina', weight: 4, conditions: { minAge: 4, maxAge: 11 }, text: 'Festa junina da escola: a quadrilha precisa de um par.',
    choices: [
      { id: 'dancar', label: 'Dançar a quadrilha', resultText: 'Chapéu de palha, pé de moleque e muita risada.', effects: { stats: { happiness: 4 }, school: { popularity: 2 } } },
      { id: 'barraca', label: 'Ficar na barraca da pescaria', resultText: 'Você pescou um apito e um pirulito.', effects: { stats: { happiness: 2 } } },
    ] },
  { id: 'd_kid_medo_escuro', weight: 3, conditions: { minAge: 3, maxAge: 8 }, text: 'Tem um barulho estranho debaixo da cama.',
    choices: [
      { id: 'olhar', label: 'Olhar com a lanterna', resultText: 'Era o gato. Coragem desbloqueada.', effects: { stats: { happiness: 2 } } },
      { id: 'pais', label: 'Correr para a cama dos pais', resultText: 'Dormiu espremid{o/a}, mas seguro.', effects: { social: { parentsAffection: 2 } } },
    ] },
  { id: 'd_kid_vizinho_bola', weight: 4, tone: 'bad', conditions: { minAge: 6, maxAge: 12 }, text: 'Sua bola caiu no quintal do vizinho mal-humorado.',
    choices: [
      { id: 'pedir', label: 'Tocar a campainha e pedir', resultText: 'Ele resmungou, mas devolveu. E ainda deu uma bala.', effects: { stats: { happiness: 1 } } },
      { id: 'pular', label: 'Pular o muro escondido', resultText: 'Missão cumprida, joelho ralado.', effects: { stats: { health: -1, happiness: 2 } }, risk: { chance: 0.4, resultText: 'O cachorro dele te viu. Correria e castigo em casa.', effects: { stats: { happiness: -3 } } } },
    ] },
  { id: 'd_kid_doce_proibido', weight: 3, conditions: { minAge: 4, maxAge: 10 }, text: 'O pote de doces está no alto do armário e não tem ninguém na cozinha.',
    choices: [
      { id: 'pegar', label: 'Subir na cadeira e pegar', resultText: 'Doce roubado é o mais gostoso.', effects: { stats: { happiness: 3 } }, risk: { chance: 0.4, resultText: 'Flagrante! Ficou sem sobremesa a semana inteira.', effects: { stats: { happiness: -2 } } } },
      { id: 'pedir', label: 'Pedir um doce', resultText: 'Ganhou um, com a condição de comer o almoço todo.', effects: { stats: { happiness: 1 } } },
    ] },
  // ----- adolescência (12–17) -----
  { id: 'd_teen_espinha', weight: 4, conditions: { minAge: 12, maxAge: 17 }, text: 'Apareceu uma espinha enorme no nariz bem no dia da foto da turma.',
    choices: [
      { id: 'assumir', label: 'Sorrir assim mesmo', resultText: 'Ninguém reparou. Ou fingiram.', effects: { stats: { happiness: 1 } } },
      { id: 'faltar', label: 'Inventar dor de barriga', resultText: 'Você ficou fora da foto oficial para sempre.', effects: { stats: { happiness: -1 } } },
    ] },
  { id: 'd_teen_primeiro_show', weight: 4, conditions: { minAge: 14, maxAge: 17 }, text: 'Sua banda favorita vem tocar na cidade. O ingresso custa caro.',
    choices: [
      { id: 'juntar', label: 'Juntar a mesada e ir', resultText: 'Você cantou todas e perdeu a voz por dois dias.', effects: { money: -250, stats: { happiness: 7 } } },
      { id: 'live', label: 'Assistir pela live', resultText: 'Não é a mesma coisa, mas foi divertido.', effects: { stats: { happiness: 2 } } },
    ] },
  { id: 'd_teen_celular_quebrado', weight: 3, tone: 'bad', conditions: { minAge: 12, maxAge: 17 }, text: 'Seu celular caiu de tela no chão. A tela virou uma teia de aranha.',
    choices: [
      { id: 'consertar', label: 'Pagar o conserto', resultText: 'Novinho de novo.', effects: { money: -300 } },
      { id: 'usar', label: 'Usar assim mesmo', resultText: 'Você aprendeu a ler entre as rachaduras.', effects: { stats: { happiness: -1 } } },
    ] },
  { id: 'd_teen_bico', weight: 4, conditions: { minAge: 14, maxAge: 17 }, text: 'Um vizinho oferece um bico de fim de semana ajudando na feira.',
    choices: [
      { id: 'aceitar', label: 'Aceitar o bico', resultText: 'Acordar às cinco foi duro, mas o dinheiro foi seu.', effects: { money: 200, stats: { happiness: 1 } } },
      { id: 'dormir', label: 'Preferir dormir', resultText: 'Sábado é sagrado.', effects: { stats: { happiness: 1 } } },
    ] },
  { id: 'd_teen_grupo_whats', weight: 4, conditions: { minAge: 13, maxAge: 17 }, text: 'Criaram um grupo da turma só para falar mal de um colega.',
    choices: [
      { id: 'sair', label: 'Sair do grupo e avisar que é errado', resultText: 'Alguns te acharam chat{o/a}; o colega te agradeceu depois.', effects: { stats: { happiness: 1 }, school: { popularity: -1 } } },
      { id: 'ficar', label: 'Ficar quieto no grupo', resultText: 'Você não escreveu nada, mas leu tudo. Não se sentiu bem.', effects: { stats: { happiness: -2 } } },
    ] },
  { id: 'd_teen_viagem_escola', weight: 3, tone: 'good', cooldownYears: 3, conditions: { minAge: 12, maxAge: 17, enrolled: true }, text: 'A escola organizou uma viagem para uma cidade histórica.',
    choices: [
      { id: 'ir', label: 'Ir na viagem', resultText: 'Igrejas antigas, guerra de travesseiro no hotel e histórias para a vida toda.', effects: { money: -400, stats: { happiness: 6, intelligence: 1 } } },
      { id: 'ficar', label: 'Ficar em casa', resultText: 'Você viu tudo pelos stories dos colegas.', effects: { stats: { happiness: -1 } } },
    ] },
  { id: 'd_teen_carta_futuro', weight: 3, once: true, conditions: { minAge: 15, maxAge: 17 }, text: 'A professora pede que todos escrevam uma carta para si mesmos daqui a dez anos.',
    choices: [
      { id: 'sincero', label: 'Escrever com sinceridade', resultText: 'Você escreveu sobre medos e sonhos. Guardou a carta numa caixa.', effects: { stats: { happiness: 2, intelligence: 1 }, setFlags: { carta_futuro: true } } },
      { id: 'piada', label: 'Escrever uma piada', resultText: '"Oi, eu do futuro. Ainda sem carro voador?"', effects: { stats: { happiness: 1 } } },
    ] },
  { id: 'd_carta_futuro_lida', weight: 6, once: true, conditions: { minAge: 25, maxAge: 28, flagsAll: ['carta_futuro'] }, text: 'Arrumando a casa, você encontra a carta que escreveu para si mesm{o/a} aos 15 anos.',
    choices: [
      { id: 'ler', label: 'Ler com calma', resultText: 'Algumas coisas deram certo, outras mudaram. Você sorriu e chorou um pouco.', effects: { stats: { happiness: 4 } } },
      { id: 'guardar', label: 'Guardar sem ler', resultText: 'Fica para os 35.', effects: {} },
    ] },
  // ----- adultos -----
  { id: 'd_adult_carteira_achada', weight: 4, conditions: { minAge: 16 }, text: 'Você acha uma carteira na rua com documentos e R$ 400.',
    choices: [
      { id: 'devolver', label: 'Procurar o dono e devolver tudo', resultText: 'A dona chorou de alívio e te deu um abraço.', effects: { stats: { happiness: 5 } } },
      { id: 'dinheiro', label: 'Ficar com o dinheiro e deixar os documentos no correio', resultText: 'O dinheiro durou uma semana. O peso na consciência, mais.', effects: { money: 400, stats: { happiness: -2 } } },
    ] },
  { id: 'd_adult_vizinho_barulho', weight: 4, tone: 'bad', conditions: { minAge: 18 }, text: 'O vizinho de cima resolveu reformar a casa e começa às sete da manhã.',
    choices: [
      { id: 'conversar', label: 'Conversar educadamente', resultText: 'Ele mudou o horário para as nove.', effects: { stats: { happiness: 1 } } },
      { id: 'vassoura', label: 'Bater no teto com a vassoura', resultText: 'A guerra fria começou.', effects: { stats: { happiness: -2 } } },
    ] },
  { id: 'd_adult_promocao_mercado', weight: 3, conditions: { minAge: 18 }, text: 'Promoção-relâmpago no mercado: leve 10 pacotes de café pelo preço de 6.',
    choices: [
      { id: 'estoque', label: 'Fazer estoque', resultText: 'Café garantido por meses.', effects: { money: -120, stats: { happiness: 1 } } },
      { id: 'normal', label: 'Comprar só o de sempre', resultText: 'Sem exageros.', effects: {} },
    ] },
  { id: 'd_adult_maratona_serie', weight: 4, conditions: { minAge: 14 }, text: 'Saiu a temporada nova da série que você ama. São 10 episódios.',
    choices: [
      { id: 'maratonar', label: 'Maratonar até de madrugada', resultText: 'Valeu cada minuto. O dia seguinte, nem tanto.', effects: { stats: { happiness: 4, health: -1 } } },
      { id: 'um', label: 'Um episódio por dia', resultText: 'Disciplina digna de monge.', effects: { stats: { happiness: 2 } } },
    ] },
  { id: 'd_adult_cachorro_rua', weight: 4, conditions: { minAge: 12 }, text: 'Um cachorro de rua começa a te seguir até em casa, abanando o rabo.',
    choices: [
      { id: 'adotar', label: 'Adotar o cachorro', resultText: 'Ganhou um companheiro para a vida. Vacinas e ração no orçamento.', effects: { money: -600, stats: { happiness: 7 }, setFlags: { tem_cachorro: true } } },
      { id: 'agua', label: 'Dar água e comida e deixar ir', resultText: 'Ele voltou no dia seguinte. E no outro.', effects: { stats: { happiness: 2 } } },
    ] },
  { id: 'd_adult_cachorro_velho', weight: 5, once: true, conditions: { minAge: 22, flagsAll: ['tem_cachorro'] }, text: 'Seu cachorro está velhinho e já não sobe no sofá sozinho.',
    choices: [
      { id: 'rampa', label: 'Fazer uma rampinha para ele', resultText: 'Ele subiu, deitou no seu colo e dormiu.', effects: { stats: { happiness: 3 } } },
      { id: 'colo', label: 'Pegar no colo sempre que ele pedir', resultText: 'Um amor que não cabe no peito.', effects: { stats: { happiness: 3 } } },
    ] },
  { id: 'd_adult_voo_atrasado', weight: 3, tone: 'bad', conditions: { minAge: 18 }, text: 'Seu voo atrasou seis horas e a companhia ofereceu um voucher de lanche de R$ 20.',
    choices: [
      { id: 'reclamar', label: 'Registrar reclamação e pedir indenização', resultText: 'Meses depois veio uma indenização.', effects: { money: 1500, stats: { happiness: -1 } } },
      { id: 'livro', label: 'Ler um livro e esperar', resultText: 'Você terminou o livro inteiro.', effects: { stats: { intelligence: 1 } } },
    ] },
  { id: 'd_adult_amigo_casamento_padrinho', weight: 3, tone: 'good', cooldownYears: 6, conditions: { minAge: 22, relationship: { types: ['amigo'], affection: { min: 60 }, personAge: { min: 20 } } }, text: '{pessoa} vai casar e quer você como padrinho ou madrinha.',
    choices: [
      { id: 'aceitar', label: 'Aceitar e fazer um discurso', resultText: 'Teve gente chorando de rir e de emoção.', effects: { money: -800, social: { affection: 10 }, stats: { happiness: 5 } } },
      { id: 'convidado', label: 'Ir só como convidado', resultText: '{pessoa} entendeu, mas ficou um pouco chateado.', effects: { social: { affection: -3 } } },
    ] },
  { id: 'd_adult_bolo_trabalho', weight: 3, conditions: { minAge: 18, economy: { employed: true } }, text: 'É seu aniversário e ninguém no trabalho lembrou. Até que, às 16h, aparece um bolo.',
    choices: [
      { id: 'agradecer', label: 'Agradecer emocionad{o/a}', resultText: 'Parabéns cantado desafinado é o melhor.', effects: { stats: { happiness: 4 } } },
      { id: 'piada', label: 'Fingir que nem tinha lembrado', resultText: 'Todo mundo riu. Você comeu duas fatias.', effects: { stats: { happiness: 3 } } },
    ] },
  { id: 'd_adult_ex_mensagem', weight: 3, conditions: { minAge: 18, relationship: { types: ['ex'], personAge: { min: 18 } } }, text: 'Meia-noite. Chega uma mensagem de {pessoa}: "Tô com saudade."',
    choices: [
      { id: 'responder', label: 'Responder e marcar um café', resultText: 'Vocês conversaram por horas. Será?', effects: { social: { affection: 12 } } },
      { id: 'visualizar', label: 'Deixar no visualizado', resultText: 'Você dormiu mal, mas manteve a decisão.', effects: { social: { affection: -5 }, stats: { happiness: -1 } } },
    ] },
  { id: 'd_adult_reencontro_ex', weight: 3, conditions: { minAge: 18, relationship: { types: ['ex'], personAge: { min: 18 } } }, text: 'Você esbarra com {pessoa} no supermercado, na fila do pão.',
    choices: [
      { id: 'conversar', label: 'Conversar como velhos conhecidos', resultText: 'Conversa leve. Ficou um sorriso no ar.', effects: { social: { affection: 6 } } },
      { id: 'fugir', label: 'Fingir que não viu', resultText: 'Você deu meia-volta com o carrinho.', effects: {} },
    ] },
  { id: 'd_adult_curso_online', weight: 3, conditions: { minAge: 18 }, text: 'Você vê um curso on-line gratuito de algo que sempre quis aprender.',
    choices: [
      { id: 'fazer', label: 'Fazer até o fim', resultText: 'Certificado na parede e cabeça mais leve.', effects: { stats: { intelligence: 2, happiness: 2 } } },
      { id: 'largar', label: 'Fazer só a primeira aula', resultText: 'O curso ficou na lista de "um dia".', effects: {} },
    ] },
  { id: 'd_adult_golpe_telefone', weight: 3, tone: 'bad', conditions: { minAge: 20 }, text: 'Alguém liga dizendo ser do seu banco e pede um código que chegou por SMS.',
    choices: [
      { id: 'desligar', label: 'Desligar e ligar para o banco', resultText: 'Era golpe. Você se livrou.', effects: { stats: { happiness: 1 } } },
      { id: 'passar', label: 'Passar o código', resultText: 'Limparam parte da sua conta.', effects: { economy: { postShareOfMoney: { cat: 'eventos', share: -0.1, label: 'Golpe por telefone' } }, stats: { happiness: -6 } } },
    ] },
  { id: 'd_adult_mudanca_amigo', weight: 3, conditions: { minAge: 18, relationship: { types: ['amigo'], affection: { min: 40 } } }, text: '{pessoa} vai se mudar e pede ajuda para carregar a mudança no sábado.',
    choices: [
      { id: 'ajudar', label: 'Ajudar o dia inteiro', resultText: 'Costas doloridas, amizade fortalecida.', effects: { social: { affection: 8 }, stats: { health: -1 } } },
      { id: 'pizza', label: 'Aparecer só na hora da pizza', resultText: '{pessoa} riu: "Típico."', effects: { social: { affection: -2 }, stats: { happiness: 1 } } },
    ] },
  { id: 'd_adult_horta', weight: 3, conditions: { minAge: 25 }, text: 'Você pensa em começar uma hortinha na varanda.',
    choices: [
      { id: 'plantar', label: 'Plantar tempero e tomate-cereja', resultText: 'O primeiro tomate foi o mais gostoso da sua vida.', effects: { money: -80, stats: { happiness: 3, health: 1 } } },
      { id: 'cacto', label: 'Comprar um cacto e pronto', resultText: 'Até o cacto pede água de vez em quando.', effects: { stats: { happiness: 1 } } },
    ] },
  { id: 'd_adult_corrida_rua', weight: 3, conditions: { minAge: 16, maxAge: 65 }, text: 'Tem uma corrida de rua de 5 km no domingo.',
    choices: [
      { id: 'correr', label: 'Se inscrever e correr', resultText: 'Medalha no peito e pernas tremendo.', effects: { money: -90, stats: { athletic: 2, happiness: 3 } } },
      { id: 'torcer', label: 'Ir torcer pelos amigos', resultText: 'Você gritou tanto que ficou rouc{o/a}.', effects: { stats: { happiness: 1 } } },
    ] },
  { id: 'd_adult_conta_luz', weight: 3, tone: 'bad', conditions: { minAge: 21, economy: { housing: ['aluguel', 'propria'] } }, text: 'A conta de luz veio o dobro do normal.',
    choices: [
      { id: 'reclamar', label: 'Reclamar com a distribuidora', resultText: 'Erro de leitura. Corrigiram a conta.', effects: { stats: { happiness: 1 } }, risk: { chance: 0.5, resultText: 'Não era erro: era o ar-condicionado. Pagou.', effects: { money: -350 } } },
      { id: 'pagar', label: 'Pagar e economizar no mês', resultText: 'Banho mais curto e luz apagada.', effects: { money: -350 } },
    ] },
  { id: 'd_adult_reuniao_familia', weight: 3, tone: 'good', cooldownYears: 4, conditions: { minAge: 20 }, text: 'Almoço de domingo com a família inteira: tios, primos e o macarrão da avó.',
    choices: [
      { id: 'ir', label: 'Ir e ficar até o café', resultText: 'Teve discussão sobre futebol e política, mas também muita risada.', effects: { social: { parentsAffection: 4 }, stats: { happiness: 3 } } },
      { id: 'desculpa', label: 'Inventar um compromisso', resultText: 'Sua mãe percebeu.', effects: { social: { parentsAffection: -3 } } },
    ] },
  // ----- maturidade e velhice -----
  { id: 'd_mid_crise_40', weight: 4, once: true, conditions: { minAge: 40, maxAge: 46 }, text: 'Você se olha no espelho e pensa no que fez da vida até aqui.',
    choices: [
      { id: 'hobby', label: 'Começar um hobby novo', resultText: 'Aulas de violão às quintas. Nunca é tarde.', effects: { stats: { happiness: 4 }, money: -500 } },
      { id: 'moto', label: 'Comprar algo caro por impulso', resultText: 'A empolgação durou três semanas.', effects: { money: -6000, stats: { happiness: 2 } } },
      { id: 'grato', label: 'Fazer uma lista do que deu certo', resultText: 'A lista foi maior do que você imaginava.', effects: { stats: { happiness: 3 } } },
    ] },
  { id: 'd_old_neto_tecnologia', weight: 4, conditions: { minAge: 60 }, text: 'Um jovem da família tenta te ensinar a usar um aplicativo novo pela quinta vez.',
    choices: [
      { id: 'paciencia', label: 'Anotar tudo num caderninho', resultText: 'Agora você manda figurinha no grupo da família.', effects: { stats: { intelligence: 1, happiness: 2 } } },
      { id: 'desistir', label: 'Dizer que no seu tempo era melhor', resultText: 'Ninguém discordou.', effects: { stats: { happiness: 1 } } },
    ] },
  { id: 'd_old_baile', weight: 3, tone: 'good', conditions: { minAge: 60 }, text: 'O centro de convivência do bairro promove um baile da saudade.',
    choices: [
      { id: 'dancar', label: 'Dançar a noite toda', resultText: 'Você ainda tem gingado.', effects: { stats: { happiness: 5, athletic: 1 } } },
      { id: 'mesa', label: 'Ficar na mesa conversando', resultText: 'Fez duas amizades novas.', effects: { stats: { happiness: 3 }, social: { meet: { context: 'school', type: 'amigo' } } } },
    ] },
  { id: 'd_old_memorias', weight: 3, conditions: { minAge: 65 }, text: 'Você encontra uma caixa de fotos antigas no armário.',
    choices: [
      { id: 'album', label: 'Montar um álbum para a família', resultText: 'Virou presente de Natal disputado.', effects: { stats: { happiness: 4 } } },
      { id: 'sozinho', label: 'Olhar sozinh{o/a} com um café', resultText: 'Saudade boa.', effects: { stats: { happiness: 2 } } },
    ] },
  { id: 'd_old_voluntario', weight: 3, tone: 'good', conditions: { minAge: 60 }, text: 'Uma escola do bairro procura voluntários para contar histórias às crianças.',
    choices: [
      { id: 'aceitar', label: 'Ser voluntári{o/a} toda semana', resultText: 'As crianças te chamam pelo nome no portão.', effects: { stats: { happiness: 6 } } },
      { id: 'uma', label: 'Ir só uma vez', resultText: 'Foi bonito.', effects: { stats: { happiness: 2 } } },
    ] },
];
