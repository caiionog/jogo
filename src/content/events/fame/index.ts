import type { GameEvent } from '../../../engine';

/**
 * Fama (release 0.0.4, fase 5): reconhecimento na rua, convites, escândalos, paparazzi e o lado ruim da exposição.
 * Condição `fame` (0–100), efeito `fame`. Marcas e programas fictícios.
 */
export const FAME_EVENTS: readonly GameEvent[] = [
  // ----- reconhecimento e convites -----
  { id: 'fama_reconhecido_rua', weight: 7, tone: 'good', conditions: { minAge: 14, fame: { min: 15 } }, text: 'Alguém para você na padaria: "Ei, você não é a pessoa daquele vídeo?" e pede uma foto.',
    choices: [
      { id: 'foto', label: 'Tirar a foto com um sorriso', resultText: 'A foto foi parar nas redes com um elogio.', effects: { fame: 1, stats: { happiness: 2 } } },
      { id: 'fugir', label: 'Disfarçar e sair rápido', resultText: 'Você ficou com fama de antipátic{o/a} naquele quarteirão.', effects: { fame: -1 } },
    ] },
  { id: 'fama_podcast', weight: 5, tone: 'good', cooldownYears: 3, conditions: { minAge: 16, fame: { min: 25 } }, text: 'Um podcast popular, o "Papo Sem Filtro", convida você para uma entrevista de três horas.',
    choices: [
      { id: 'ir', label: 'Aceitar e falar da vida', resultText: 'Os cortes da entrevista rodaram a semana inteira.', effects: { fame: 3, stats: { happiness: 2 } }, risk: { chance: 0.2, resultText: 'Uma frase fora de contexto virou polêmica.', effects: { fame: -2, stats: { happiness: -3 } } } },
      { id: 'recusar', label: 'Recusar com educação', resultText: 'Você preferiu preservar a voz para outra hora.' },
    ] },
  { id: 'fama_talk_show', weight: 5, tone: 'good', cooldownYears: 4, conditions: { minAge: 18, fame: { min: 45 } }, text: 'O talk show de domingo, "Noite Brilhante", quer você no sofá do programa.',
    choices: [
      { id: 'ir', label: 'Ir ao programa', resultText: 'Você contou uma história engraçada e a plateia caiu na risada.', effects: { fame: 4, stats: { happiness: 3 } } },
      { id: 'nao', label: 'Dizer que está sem agenda', resultText: 'O convite foi para outra pessoa.' },
    ] },
  { id: 'fama_fa_carta', weight: 5, tone: 'good', conditions: { minAge: 14, fame: { min: 30 } }, text: 'Chega uma carta escrita à mão: uma fã de 9 anos diz que você é a inspiração dela.',
    choices: [
      { id: 'responder', label: 'Responder com um vídeo', resultText: 'A mãe da menina postou o vídeo e todo mundo se emocionou.', effects: { fame: 2, stats: { happiness: 4 } } },
      { id: 'guardar', label: 'Guardar a carta na gaveta', resultText: 'Você releu a carta num dia ruim e ela ajudou.', effects: { stats: { happiness: 2 } } },
    ] },
  { id: 'fama_evento_vip', weight: 4, cooldownYears: 3, conditions: { minAge: 18, fame: { min: 40 } }, text: 'Convite para a área VIP da estreia de um filme nacional. Tapete vermelho e fotógrafos.',
    choices: [
      { id: 'ir', label: 'Ir caprichado no visual', resultText: 'Seu visual saiu nas listas de "mais bem vestidos".', effects: { fame: 3, money: -1500, stats: { looks: 1 } } },
      { id: 'casa', label: 'Ficar em casa de pijama', resultText: 'Ninguém sentiu sua falta. Ou sentiu?', effects: { stats: { happiness: 1 } } },
    ] },
  { id: 'fama_meme', weight: 4, conditions: { minAge: 13, fame: { max: 40 } }, text: 'Uma careta sua num vídeo de amigos virou meme. Desconhecidos estão usando sua cara como figurinha.',
    choices: [
      { id: 'abracar', label: 'Abraçar o meme e postar mais', resultText: 'Você virou "a pessoa da figurinha". Fama é fama.', effects: { fame: 4, stats: { happiness: 1 } } },
      { id: 'pedir', label: 'Pedir para tirarem do ar', resultText: 'Quanto mais você pedia, mais o meme se espalhava.', effects: { fame: 2, stats: { happiness: -3 } } },
    ] },
  { id: 'fama_proposta_reality', weight: 3, cooldownYears: 6, conditions: { minAge: 18, fame: { min: 20, max: 70 } }, text: 'Um reality show de confinamento, o "Casa de Vidro", quer você na próxima temporada.',
    choices: [
      { id: 'entrar', label: 'Entrar no reality', resultText: 'Três meses de câmeras: você saiu mais famos{o/a} e um pouco exaust{o/a}.', effects: { fame: 12, stats: { happiness: -3 }, money: 20000 }, risk: { chance: 0.35, resultText: 'Você brigou ao vivo e virou a pessoa mais odiada da temporada.', effects: { fame: 6, stats: { happiness: -8 } } } },
      { id: 'recusar', label: 'Recusar', resultText: 'Sua privacidade continua sua.' },
    ] },
  { id: 'fama_marca_propria', weight: 3, once: true, conditions: { minAge: 20, fame: { min: 55 }, economy: { money: { min: 20000 } } }, text: 'Uma empresa propõe lançar uma linha de produtos com o seu nome.',
    choices: [
      { id: 'lancar', label: 'Lançar a linha', resultText: 'Os produtos esgotaram no primeiro mês.', effects: { fame: 3, money: 40000 }, risk: { chance: 0.25, resultText: 'O produto deu defeito e choveram reclamações.', effects: { fame: -5, money: -8000 } } },
      { id: 'nao', label: 'Não colocar seu nome em nada', resultText: 'Você preferiu não arriscar a imagem.' },
    ] },
  { id: 'fama_caridade', weight: 4, tone: 'good', cooldownYears: 4, conditions: { minAge: 18, fame: { min: 35 } }, text: 'Uma ONG pede que você seja padrinho ou madrinha de uma campanha de doação de alimentos.',
    choices: [
      { id: 'aceitar', label: 'Abraçar a campanha', resultText: 'A campanha bateu a meta em duas semanas.', effects: { fame: 3, stats: { happiness: 5 } } },
      { id: 'doar', label: 'Só doar em silêncio', resultText: 'Ninguém soube, e foi melhor assim.', effects: { money: -2000, stats: { happiness: 3 } } },
    ] },
  // ----- escândalos e exposição -----
  { id: 'fama_paparazzi', weight: 5, tone: 'bad', conditions: { minAge: 18, fame: { min: 55 } }, text: 'Um paparazzo fotografou você de moletom e cara amassada no mercado. A foto está em todos os portais.',
    choices: [
      { id: 'rir', label: 'Rir de si mesm{o/a} nas redes', resultText: 'O público adorou a autenticidade.', effects: { fame: 2, stats: { happiness: 1 } } },
      { id: 'brigar', label: 'Reclamar da invasão de privacidade', resultText: 'Virou notícia de novo, agora com você irritad{o/a}.', effects: { fame: 1, stats: { happiness: -3 } } },
    ] },
  { id: 'fama_escandalo_audio', weight: 3, tone: 'bad', cooldownYears: 6, conditions: { minAge: 18, fame: { min: 35 } }, text: 'Vazou um áudio seu reclamando de um colega famoso. Os portais de fofoca estão em festa.',
    choices: [
      { id: 'desculpas', label: 'Pedir desculpas publicamente', resultText: 'O pedido foi bem recebido pela maioria.', effects: { fame: -2, stats: { happiness: -2 } } },
      { id: 'dobrar', label: 'Dizer que falou e repete', resultText: 'Metade do público te apoiou, metade sumiu.', effects: { fame: -5, stats: { happiness: -1 } }, risk: { chance: 0.3, resultText: 'Uma marca cancelou o contrato com você.', effects: { fame: -3, economy: { cancelSponsors: true } } } },
    ] },
  { id: 'fama_escandalo_festa', weight: 3, tone: 'bad', cooldownYears: 5, conditions: { minAge: 18, fame: { min: 30 } }, text: 'Fotos suas numa festa até o amanhecer, véspera de um compromisso importante, viralizaram.',
    choices: [
      { id: 'assumir', label: 'Assumir com bom humor', resultText: 'Virou piada por uma semana e passou.', effects: { fame: -1 } },
      { id: 'negar', label: 'Dizer que as fotos são antigas', resultText: 'Descobriram a data das fotos. Pegou mal.', effects: { fame: -6, stats: { happiness: -4 } } },
    ] },
  { id: 'fama_fake_news', weight: 3, tone: 'bad', cooldownYears: 5, conditions: { minAge: 16, fame: { min: 40 } }, text: 'Um site inventou que você morreu. Sua mãe ligou chorando antes de você conseguir desmentir.',
    choices: [
      { id: 'video', label: 'Gravar um vídeo "estou viv{o/a}"', resultText: 'O vídeo bombou e o site sumiu do mapa.', effects: { fame: 2, social: { parentsAffection: 3 } } },
      { id: 'processo', label: 'Processar o site', resultText: 'Demorou, mas você ganhou uma indenização.', effects: { money: 5000, stats: { happiness: -1 } } },
    ] },
  { id: 'fama_hater', weight: 4, tone: 'bad', conditions: { minAge: 14, fame: { min: 25 } }, text: 'Um perfil anônimo comenta todos os seus posts com ofensas há meses.',
    choices: [
      { id: 'bloquear', label: 'Bloquear e seguir a vida', resultText: 'Silêncio. Que paz.', effects: { stats: { happiness: 2 } } },
      { id: 'responder', label: 'Responder à altura', resultText: 'A briga virou espetáculo e te desgastou.', effects: { fame: 1, stats: { happiness: -4 } } },
      { id: 'terapia', label: 'Falar sobre isso na terapia', resultText: 'Você aprendeu a não levar para o lado pessoal.', effects: { money: -600, stats: { happiness: 3 } } },
    ] },
  { id: 'fama_assedio_fas', weight: 3, tone: 'bad', conditions: { minAge: 18, fame: { min: 65 } }, text: 'Fãs descobriram seu endereço e passam o dia na porta do prédio.',
    choices: [
      { id: 'mudar', label: 'Mudar para um condomínio mais reservado', resultText: 'Mais caro, mais tranquilo.', effects: { money: -10000, stats: { happiness: 3 } } },
      { id: 'conversar', label: 'Descer e conversar com eles', resultText: 'Eles foram embora felizes, mas voltaram no dia seguinte.', effects: { fame: 1, stats: { happiness: -2 } } },
    ] },
  { id: 'fama_esquecimento', weight: 4, conditions: { minAge: 25, fame: { min: 20, max: 50 }, flagsNone: ['fama_saudade'] }, once: true, text: 'Um jovem te para na rua: "Meu pai era seu fã!" Era um elogio, mas doeu um pouco.',
    choices: [
      { id: 'rir', label: 'Levar na esportiva', resultText: 'Você riu e tirou a foto com o garoto.', effects: { stats: { happiness: 1 }, setFlags: { fama_saudade: true } } },
      { id: 'voltar', label: 'Planejar um retorno às redes', resultText: 'Você voltou a postar com força total.', effects: { fame: 3, stats: { happiness: -1 }, setFlags: { fama_saudade: true } } },
    ] },
  { id: 'fama_namoro_exposto', weight: 3, conditions: { minAge: 18, fame: { min: 45 }, relationship: { types: ['parceiro', 'conjuge'], personAge: { min: 18 } } }, text: 'A imprensa descobriu seu relacionamento com {pessoa}. Fotógrafos na porta de casa.',
    choices: [
      { id: 'assumir', label: 'Assumir o namoro publicamente', resultText: 'Vocês viraram "casal do momento".', effects: { fame: 3, social: { affection: 4 } } },
      { id: 'esconder', label: 'Pedir privacidade', resultText: '{pessoa} achou bom manter a vida de vocês longe dos holofotes.', effects: { social: { affection: 2 } } },
    ] },
  { id: 'fama_desafio_viral', weight: 4, conditions: { minAge: 13, maxAge: 35, fame: { min: 10 } }, text: 'Te desafiaram a entrar num desafio viral meio perigoso: pular de um muro alto filmando.',
    choices: [
      { id: 'recusar', label: 'Recusar e explicar o porquê', resultText: 'Muita gente agradeceu o bom exemplo.', effects: { fame: 1 } },
      { id: 'fazer', label: 'Topar o desafio', resultText: 'O vídeo bombou.', effects: { fame: 3 }, risk: { chance: 0.35, resultText: 'Você caiu feio e torceu o tornozelo. O vídeo bombou mesmo assim.', effects: { health: { injury: 'random' }, stats: { health: -3 } } } },
    ] },
  { id: 'fama_entrevista_tv', weight: 4, cooldownYears: 3, conditions: { minAge: 16, fame: { min: 20 } }, text: 'O jornal local quer uma entrevista rápida sobre sua história.',
    choices: [
      { id: 'dar', label: 'Dar a entrevista', resultText: 'Você falou bem e a matéria repercutiu.', effects: { fame: 2 } },
      { id: 'nervo', label: 'Dar a entrevista mesmo nervos{o/a}', resultText: 'Você travou na frente da câmera, mas o clipe virou carinho na internet.', effects: { fame: 1, stats: { happiness: -1 } } },
    ] },
  { id: 'fama_golpe_perfil', weight: 3, tone: 'bad', cooldownYears: 6, conditions: { minAge: 16, fame: { min: 30 } }, text: 'Golpistas criaram um perfil falso seu pedindo dinheiro aos seguidores.',
    choices: [
      { id: 'avisar', label: 'Avisar os seguidores e denunciar', resultText: 'O perfil caiu em dois dias.', effects: { stats: { happiness: -1 } } },
      { id: 'ignorar', label: 'Deixar para lá', resultText: 'Gente caiu no golpe e culpou você.', effects: { fame: -4, stats: { happiness: -3 } } },
    ] },
  { id: 'fama_premio', weight: 2, tone: 'good', cooldownYears: 5, conditions: { minAge: 18, fame: { min: 60 } }, text: 'Você foi indicad{o/a} ao "Prêmio Destaque do Ano", votado pelo público.',
    choices: [
      { id: 'campanha', label: 'Fazer campanha nas redes', resultText: 'Você venceu! Discurso emocionado e troféu na estante.', effects: { fame: 5, stats: { happiness: 6 } }, risk: { chance: 0.5, resultText: 'Ficou em segundo lugar, mas a indicação já valeu.', effects: { fame: 2, stats: { happiness: 1 } } } },
      { id: 'quieto', label: 'Ficar na sua', resultText: 'Outra pessoa levou. Você aplaudiu de pé.', effects: { stats: { happiness: -1 } } },
    ] },
];
