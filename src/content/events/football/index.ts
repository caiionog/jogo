import type { GameEvent } from '../../../engine';

/**
 * Futebol (release 0.0.4, fase 6). Clubes, ligas, marcas e torneios fictícios. Condição `football`, efeito `football`
 * (prestígio e habilidades ocultas). Lesão usa o catálogo de saúde (`health.injury`).
 */
const PRO = { stage: ['pro' as const], contracted: true };
const BASE = { stage: ['base' as const] };

export const FOOTBALL_EVENTS: readonly GameEvent[] = [
  // ----- base -----
  { id: 'fut_base_alojamento', weight: 7, conditions: { minAge: 10, maxAge: 17, football: BASE }, text: 'O alojamento da base tem beliche, chuveiro gelado e dez garotos sonhando com a mesma coisa.',
    choices: [
      { id: 'focar', label: 'Focar só no futebol', resultText: 'Você é o primeiro a chegar ao campo e o último a sair.', effects: { football: { skills: { pace: 1, passing: 1 } }, stats: { happiness: -1 } } },
      { id: 'amigos', label: 'Fazer amizade com a turma', resultText: 'Saudade de casa dói menos com amigos.', effects: { stats: { happiness: 3 }, social: { meet: { context: 'school', type: 'amigo' } } } },
    ] },
  { id: 'fut_base_escola', weight: 6, conditions: { minAge: 10, maxAge: 17, football: BASE, enrolled: true }, text: 'O treinador da base cobra presença; a escola cobra a prova de matemática. Os horários batem.',
    choices: [
      { id: 'escola', label: 'Priorizar a escola', resultText: 'Nota boa, mas perdeu o treino tático da semana.', effects: { school: { average: 5 } } },
      { id: 'treino', label: 'Priorizar o treino', resultText: 'O técnico elogiou. A professora, nem tanto.', effects: { school: { average: -5 }, football: { skills: { passing: 1 } } } },
    ] },
  { id: 'fut_base_empresario', weight: 4, tone: 'bad', conditions: { minAge: 13, maxAge: 17, football: BASE }, text: 'Um "empresário" promete te levar para a Europa se sua família pagar uma taxa de R$ 5 mil.',
    choices: [
      { id: 'recusar', label: 'Desconfiar e recusar', resultText: 'Dias depois, a polícia prendeu o golpista.', effects: { social: { parentsAffection: 2 } } },
      { id: 'pagar', label: 'Convencer a família a pagar', resultText: 'O homem sumiu com o dinheiro.', effects: { money: -5000, stats: { happiness: -6 } } },
    ] },
  { id: 'fut_base_campeonato', weight: 5, tone: 'good', conditions: { minAge: 12, maxAge: 17, football: BASE }, text: 'Final do torneio sub-17. A arquibancada tem olheiros de três clubes grandes.',
    choices: [
      { id: 'decidir', label: 'Pedir a bola nos minutos finais', resultText: 'Você decidiu o jogo e saiu nos jornais locais.', effects: { football: { reputation: 4, skills: { finishing: 1 } }, stats: { happiness: 5 } }, risk: { chance: 0.4, resultText: 'Você errou o lance decisivo. Doeu, mas faz parte.', effects: { stats: { happiness: -4 } } } },
      { id: 'coletivo', label: 'Jogar para o time', resultText: 'O técnico anotou seu nome: "Esse entende de jogo."', effects: { football: { reputation: 2, skills: { passing: 1 } } } },
    ] },
  // ----- profissional: vestiário e jogo -----
  { id: 'fut_finalizacao_jogo', weight: 7, conditions: { minAge: 16, football: { ...PRO, position: ['ATA', 'MEI'] } }, text: 'Lançamento perfeito: você sai cara a cara com o goleiro.',
    choices: [
      { id: 'chutar', label: 'Bater no canto', resultText: 'Você ajeitou o corpo para finalizar.', effects: { minigame: { kind: 'shot', context: 'jogo' } } },
      { id: 'rolar', label: 'Rolar para o companheiro', resultText: 'O companheiro empurrou para o gol. Assistência sua!', effects: { football: { reputation: 1 } } },
    ] },
  { id: 'fut_passe_decisivo', weight: 6, conditions: { minAge: 16, football: { ...PRO, position: ['MEI', 'VOL', 'LAT'] } }, text: 'Contra-ataque no fim do jogo. Três companheiros correndo, e a bola está no seu pé.',
    choices: [
      { id: 'passar', label: 'Escolher o passe', resultText: 'Você levantou a cabeça.', effects: { minigame: { kind: 'pass', context: 'jogo' } } },
      { id: 'segurar', label: 'Segurar a bola e gastar o tempo', resultText: 'O juiz apitou o fim. Resultado mantido.', effects: {} },
    ] },
  { id: 'fut_goleiro_penalti', weight: 8, conditions: { minAge: 16, football: { ...PRO, position: ['GOL'] } }, text: 'Pênalti contra o seu time no último minuto. O batedor ajeita a bola e te encara.',
    choices: [
      { id: 'defender', label: 'Ler o batedor e pular', resultText: 'Você se agachou na linha.', effects: { minigame: { kind: 'goalie', context: 'jogo' } } },
      { id: 'catimba', label: 'Fazer catimba antes da cobrança', resultText: 'Cartão amarelo. O batedor errou mesmo assim: por cima!', effects: { football: { reputation: 1 } }, risk: { chance: 0.6, resultText: 'Cartão amarelo e gol do adversário.', effects: { football: { reputation: -1 } } } },
    ] },
  { id: 'fut_penalti_jogo', weight: 8, conditions: { minAge: 16, football: { ...PRO, position: ['ATA', 'MEI', 'VOL', 'LAT', 'ZAG'] } }, text: 'Pênalti para o seu time aos 44 do segundo tempo, jogo empatado. O técnico olha para você.',
    choices: [
      { id: 'cobrar', label: 'Pegar a bola e cobrar', resultText: 'Você ajeitou a bola na marca e respirou fundo.', effects: { minigame: { kind: 'penalty', context: 'jogo' } } },
      { id: 'passar', label: 'Deixar para o batedor oficial', resultText: 'O batedor converteu. Você comemorou junto, mas ficou a vontade.', effects: { stats: { happiness: 1 } } },
    ] },
  { id: 'fut_estreia', weight: 9, once: true, conditions: { minAge: 16, football: PRO }, text: 'Estreia como profissional! O estádio canta o hino e suas pernas tremem no túnel.',
    choices: [
      { id: 'fome', label: 'Entrar com fome de bola', resultText: 'Você deu um drible logo no primeiro lance e a torcida gostou.', effects: { football: { reputation: 3 }, stats: { happiness: 8 } } },
      { id: 'simples', label: 'Jogar simples', resultText: 'Sem invenção, sem erro. Estreia segura.', effects: { stats: { happiness: 5 } } },
    ] },
  { id: 'fut_banco', weight: 6, tone: 'bad', conditions: { minAge: 17, football: PRO }, text: 'O técnico novo te mandou para o banco. Ninguém explicou o porquê.',
    choices: [
      { id: 'treinar', label: 'Treinar dobrado em silêncio', resultText: 'Em três semanas você voltou ao time titular.', effects: { football: { skills: { pace: 1, passing: 1 } }, stats: { happiness: -1 } } },
      { id: 'reclamar', label: 'Reclamar com a imprensa', resultText: 'Virou manchete. O técnico te afastou de vez por um tempo.', effects: { football: { reputation: -3 }, fame: 1, stats: { happiness: -3 } } },
    ] },
  { id: 'fut_gol_bonito', weight: 6, tone: 'good', conditions: { minAge: 17, football: { ...PRO, position: ['ATA', 'MEI'] } }, text: 'Você recebeu na entrada da área e encheu o pé: no ângulo. O estádio inteiro levantou.',
    choices: [
      { id: 'comemorar', label: 'Correr para a torcida', resultText: 'O gol virou vinheta da TV por semanas.', effects: { football: { reputation: 4 }, fame: 2, stats: { happiness: 5 } } },
      { id: 'dedicar', label: 'Dedicar para a família', resultText: 'Sua mãe chorou no sofá de casa.', effects: { football: { reputation: 3 }, social: { parentsAffection: 4 }, stats: { happiness: 4 } } },
    ] },
  { id: 'fut_defesa_milagrosa', weight: 6, tone: 'good', conditions: { minAge: 17, football: { ...PRO, position: ['GOL'] } }, text: 'Pênalti no último minuto. Você escolhe um canto...',
    choices: [
      { id: 'esquerda', label: 'Pular no canto esquerdo', resultText: 'DEFENDEU! Você virou herói da noite.', effects: { football: { reputation: 4, skills: { goalkeeping: 1 } }, fame: 2 }, risk: { chance: 0.6, resultText: 'Gol no outro canto. Não foi dessa vez.', effects: { stats: { happiness: -3 } } } },
      { id: 'centro', label: 'Ficar no centro', resultText: 'O batedor tentou a cavadinha e você segurou. Que frieza!', effects: { football: { reputation: 5, skills: { goalkeeping: 1 } }, fame: 3 }, risk: { chance: 0.7, resultText: 'Ele bateu no canto. Você nem se mexeu.', effects: { stats: { happiness: -4 } } } },
    ] },
  { id: 'fut_zaga_carrinho', weight: 5, conditions: { minAge: 17, football: { ...PRO, position: ['ZAG', 'VOL', 'LAT'] } }, text: 'O atacante adversário escapou sozinho. Só você pode alcançar.',
    choices: [
      { id: 'carrinho', label: 'Dar o carrinho na bola', resultText: 'Desarme limpo, aplaudido como gol.', effects: { football: { reputation: 3, skills: { defending: 1 } } }, risk: { chance: 0.3, resultText: 'Chegou atrasado: cartão vermelho e suspensão.', effects: { football: { reputation: -2 }, stats: { happiness: -3 } } } },
      { id: 'acompanhar', label: 'Acompanhar e fechar o ângulo', resultText: 'O chute saiu fraco nas mãos do goleiro.', effects: { football: { skills: { defending: 1 } } } },
    ] },
  { id: 'fut_lesao', weight: 4, tone: 'bad', conditions: { minAge: 17, football: PRO }, text: 'Uma dividida forte e você sente o joelho estalar.',
    choices: [
      { id: 'sair', label: 'Pedir para sair na hora', resultText: 'O departamento médico agiu rápido.', effects: { health: { injury: 'random' } } },
      { id: 'seguir', label: 'Continuar jogando', resultText: 'Você terminou o jogo mancando e piorou a lesão.', effects: { health: { injury: 'random' }, stats: { health: -4 }, football: { reputation: 1 } } },
    ] },
  { id: 'fut_classico', weight: 6, conditions: { minAge: 17, football: { ...PRO, division: ['A', 'B'] } }, text: 'Semana de clássico. A cidade inteira só fala disso e a torcida rival picha o muro do CT.',
    choices: [
      { id: 'provocar', label: 'Provocar nas redes', resultText: 'Você marcou e calou o estádio rival.', effects: { fame: 3, football: { reputation: 3 } }, risk: { chance: 0.45, resultText: 'Perderam de 3 a 0 e a provocação virou meme contra você.', effects: { fame: 1, football: { reputation: -3 }, stats: { happiness: -4 } } } },
      { id: 'respeitar', label: 'Falar em respeito e trabalho', resultText: 'Empate tenso. Ninguém pôde falar nada de você.', effects: { football: { reputation: 1 } } },
    ] },
  { id: 'fut_torcida_protesto', weight: 4, tone: 'bad', conditions: { minAge: 17, football: PRO }, text: 'Depois de cinco derrotas seguidas, a torcida organizada protesta no portão do CT.',
    choices: [
      { id: 'conversar', label: 'Descer para conversar', resultText: 'O diálogo acalmou os ânimos.', effects: { football: { reputation: 2 } } },
      { id: 'evitar', label: 'Sair pelos fundos', resultText: 'Disseram que você fugiu. Fica a mágoa.', effects: { football: { reputation: -2 }, stats: { happiness: -2 } } },
    ] },
  { id: 'fut_capitao', weight: 3, tone: 'good', cooldownYears: 4, conditions: { minAge: 24, football: { ...PRO, minRating: 7 } }, text: 'O técnico entrega a braçadeira de capitão para você.',
    choices: [
      { id: 'aceitar', label: 'Aceitar com orgulho', resultText: 'Você passou a ser a voz do vestiário.', effects: { football: { reputation: 4 }, stats: { happiness: 4 } } },
      { id: 'recusar', label: 'Preferir liderar pelo exemplo', resultText: 'O grupo respeitou ainda mais sua decisão.', effects: { football: { reputation: 2 } } },
    ] },
  { id: 'fut_vestiario_briga', weight: 4, conditions: { minAge: 18, football: PRO }, text: 'Dois companheiros saem no braço no vestiário por causa de uma cobrança de falta.',
    choices: [
      { id: 'apartar', label: 'Apartar e chamar para conversar', resultText: 'O clima melhorou e o time engrenou.', effects: { football: { reputation: 2 } } },
      { id: 'filmar', label: 'Ficar de fora', resultText: 'O vídeo vazou e o clube abriu sindicância.', effects: { stats: { happiness: -1 } } },
    ] },
  // ----- mercado e carreira -----
  { id: 'fut_proposta_exterior', weight: 6, conditions: { minAge: 18, maxAge: 31, football: { ...PRO, hasOffer: true, division: ['A', 'B'] } }, text: 'Seu celular não para: tem proposta na mesa e o clube quer saber se você fica.',
    choices: [
      { id: 'ouvir', label: 'Ouvir as propostas com calma', resultText: 'As propostas ficam em Ocupação → Carreiras → Jogador de futebol.', effects: { stats: { happiness: 2 } } },
      { id: 'ficar', label: 'Jurar amor ao clube', resultText: 'A torcida fez faixa para você.', effects: { football: { reputation: 3 }, fame: 1 } },
    ] },
  { id: 'fut_saudade_exterior', weight: 6, tone: 'bad', conditions: { minAge: 18, football: { ...PRO, division: ['X'] } }, text: 'Inverno pesado no exterior, comida diferente e um idioma que você ainda não domina.',
    choices: [
      { id: 'aula', label: 'Fazer aulas do idioma', resultText: 'Em seis meses você já dava entrevista na língua local.', effects: { stats: { intelligence: 2, happiness: 2 } } },
      { id: 'video', label: 'Fazer chamada de vídeo com a família todo dia', resultText: 'A saudade diminui um pouco.', effects: { stats: { happiness: 1 }, social: { parentsAffection: 3 } } },
    ] },
  { id: 'fut_patrocinio_chuteira', weight: 4, tone: 'good', cooldownYears: 4, conditions: { minAge: 18, fame: { min: 25 }, football: PRO }, text: 'A marca de chuteiras Passo Rápido quer você como garoto-propaganda.',
    choices: [
      { id: 'assinar', label: 'Assinar', resultText: 'Chuteira com seu nome bordado e um bom cachê.', effects: { money: 30000, fame: 2 } },
      { id: 'recusar', label: 'Recusar: não usa aquele modelo', resultText: 'Coerência acima de tudo.', effects: {} },
    ] },
  { id: 'fut_rebaixamento', weight: 5, tone: 'bad', conditions: { minAge: 17, football: { ...PRO, division: ['A', 'B', 'C'] } }, text: 'O time está na zona de rebaixamento e faltam quatro rodadas.',
    choices: [
      { id: 'liderar', label: 'Chamar a responsabilidade', resultText: 'Você foi o melhor em campo na reta final.', effects: { football: { reputation: 3 }, stats: { happiness: 2 } } },
      { id: 'sumir', label: 'Esconder-se em campo', resultText: 'A torcida percebeu e não perdoou.', effects: { football: { reputation: -4 }, stats: { happiness: -3 } } },
    ] },
  { id: 'fut_doping_suplemento', weight: 3, tone: 'bad', cooldownYears: 8, conditions: { minAge: 18, football: PRO }, text: 'Um preparador de fora oferece um suplemento "milagroso" que ninguém do clube conhece.',
    choices: [
      { id: 'recusar', label: 'Recusar e avisar o departamento médico', resultText: 'O clube agradeceu a honestidade.', effects: { football: { reputation: 1 } } },
      { id: 'tomar', label: 'Tomar escondido', resultText: 'Você se sentiu mais forte por um tempo.', effects: { football: { skills: { pace: 2 } } }, risk: { chance: 0.5, resultText: 'Caiu no exame antidoping: suspensão e manchetes.', effects: { football: { reputation: -15 }, fame: -6, stats: { happiness: -10 } } } },
    ] },
  { id: 'fut_selecao_convite', weight: 5, tone: 'good', conditions: { minAge: 19, football: { ...PRO, division: ['A', 'X'], minRating: 7.6 } }, text: 'A lista da Seleção Nacional sai hoje. Você está na frente da TV com a família.',
    choices: [
      { id: 'assistir', label: 'Assistir ao anúncio com todo mundo', resultText: 'Seu nome foi chamado! A sala explodiu de alegria.', effects: { football: { reputation: 5 }, fame: 4, stats: { happiness: 8 } }, risk: { chance: 0.5, resultText: 'Não foi desta vez. Fica para a próxima convocação.', effects: { stats: { happiness: -3 } } } },
      { id: 'treinar', label: 'Ir treinar para não pensar nisso', resultText: 'Um amigo ligou gritando: você foi convocad{o/a}!', effects: { football: { reputation: 4 }, fame: 3, stats: { happiness: 6 } }, risk: { chance: 0.5, resultText: 'O telefone não tocou. Treino é treino.', effects: { football: { skills: { pace: 1 } } } } },
    ] },
  { id: 'fut_entrevista_polemica', weight: 4, conditions: { minAge: 18, football: PRO, fame: { min: 15 } }, text: 'Depois do jogo, o repórter pergunta sobre a arbitragem. O sangue ainda está quente.',
    choices: [
      { id: 'soltar', label: 'Detonar o juiz', resultText: 'Multa da federação e muito engajamento.', effects: { money: -3000, fame: 2, football: { reputation: -1 } } },
      { id: 'calma', label: 'Respirar e falar do time', resultText: 'Resposta madura, elogiada pelos comentaristas.', effects: { football: { reputation: 1 } } },
    ] },
  { id: 'fut_veterano', weight: 5, conditions: { minAge: 32, football: PRO }, text: 'O corpo já reclama depois dos jogos. O clube oferece um papel de "veterano" no elenco.',
    choices: [
      { id: 'aceitar', label: 'Aceitar e ajudar os mais novos', resultText: 'Você virou mentor de dois garotos da base.', effects: { stats: { happiness: 3 }, football: { reputation: 1 } } },
      { id: 'lutar', label: 'Brigar pela titularidade', resultText: 'Você treinou como um garoto, mas o tempo cobra.', effects: { stats: { health: -2 }, football: { skills: { pace: 1 } } } },
    ] },
  { id: 'fut_aposentado_comentarista', weight: 5, once: true, conditions: { minAge: 30, football: { stage: ['aposentado'] }, fame: { min: 20 } }, text: 'Um canal de esportes convida você para comentar os jogos do Campeonato Nacional.',
    choices: [
      { id: 'aceitar', label: 'Aceitar o microfone', resultText: 'Você leva jeito: análise boa e piada na hora certa.', effects: { money: 60000, fame: 3 } },
      { id: 'recusar', label: 'Curtir a aposentadoria longe dos holofotes', resultText: 'Pescaria às terças. Vida boa.', effects: { stats: { happiness: 4 } } },
    ] },
  { id: 'fut_aposentado_escolinha', weight: 4, once: true, conditions: { minAge: 30, football: { stage: ['aposentado'] } }, text: 'Um amigo sugere abrir uma escolinha de futebol com o seu nome no bairro.',
    choices: [
      { id: 'abrir', label: 'Abrir a escolinha', resultText: 'Quarenta crianças na primeira semana.', effects: { money: -15000, stats: { happiness: 6 }, fame: 1 } },
      { id: 'nao', label: 'Deixar a ideia para depois', resultText: 'Talvez um dia.', effects: {} },
    ] },
  { id: 'fut_torcedor_mirim', weight: 5, tone: 'good', conditions: { minAge: 18, football: PRO }, text: 'Um menino de seis anos invade o gramado no treino aberto só para te abraçar.',
    choices: [
      { id: 'camisa', label: 'Dar a camisa para ele', resultText: 'A foto rodou o país.', effects: { fame: 2, stats: { happiness: 5 } } },
      { id: 'foto', label: 'Tirar uma foto e devolver para os pais', resultText: 'Um sorriso que vale o ano.', effects: { stats: { happiness: 3 } } },
    ] },
  { id: 'fut_sem_clube', weight: 7, tone: 'bad', conditions: { minAge: 18, football: { stage: ['pro'], contracted: false } }, text: 'Sem clube, você treina sozinho num campo de bairro esperando o telefone tocar.',
    choices: [
      { id: 'treinar', label: 'Manter a forma todo dia', resultText: 'Quando a proposta vier, você vai estar pronto.', effects: { football: { skills: { pace: 1 } }, stats: { happiness: -1 } } },
      { id: 'pensar', label: 'Pensar em outro caminho', resultText: 'Talvez seja hora de pendurar as chuteiras.', effects: { stats: { happiness: -2 } } },
    ] },
];
