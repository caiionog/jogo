import type { AchievementDef } from '../../engine';

/**
 * Conquistas (Etapa 6). `metric` referencia o registro da engine (`engine/meta/metrics.ts`);
 * `min`/`max` definem o limite. `secret` esconde a descrição até desbloquear; `onDeath` só avalia na morte.
 */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // --- escola e vida ---
  { id: 'formatura', name: 'Diploma na mão', description: 'Termine o ensino médio.', icon: '🎓', metric: 'graduated', min: 1 },
  { id: 'medalha_escolar', name: 'Orgulho da escola', description: 'Ganhe uma medalha no interescolar.', icon: '🏅', metric: 'schoolMedal', min: 1 },
  { id: 'expulso_formado', name: 'Dei a volta por cima', description: 'Seja expulso da escola e mesmo assim se forme.', icon: '🔄', secret: true, metric: 'expelledGraduated', min: 1 },
  { id: 'primeiro_beijo', name: 'Frio na barriga', description: 'Dê o primeiro beijo.', icon: '💋', metric: 'firstKiss', min: 1 },
  { id: 'turma', name: 'Turma grande', description: 'Tenha 5 amigos ou colegas de treino ao mesmo tempo.', icon: '👥', metric: 'friends', min: 5 },
  // --- luta ---
  { id: 'primeira_vitoria', name: 'Primeira vitória', description: 'Vença sua primeira luta.', icon: '🥊', metric: 'anyWin', min: 1 },
  { id: 'primeira_finalizacao', name: 'Bateu!', description: 'Vença uma luta por finalização.', icon: '🤼', metric: 'subWins', min: 1 },
  { id: 'primeiro_ko', name: 'Apagou', description: 'Vença uma luta por nocaute.', icon: '💥', metric: 'koWins', min: 1 },
  { id: 'estreia_pro', name: 'Agora é profissional', description: 'Vença uma luta profissional.', icon: '📜', metric: 'proWins', min: 1 },
  { id: 'dez_pro', name: 'Veterano', description: 'Chegue a 10 vitórias profissionais.', icon: '🔟', metric: 'proWins', min: 10 },
  { id: 'vinte_cinco_pro', name: 'Máquina de vencer', description: 'Chegue a 25 vitórias profissionais.', icon: '⚙️', metric: 'proWins', min: 25 },
  { id: 'invicto_10', name: 'Invicto', description: 'Fique 10 lutas profissionais sem perder.', icon: '🛡️', metric: 'maxUnbeaten', min: 10 },
  { id: 'faixa_roxa', name: 'Faixa roxa', description: 'Chegue à faixa roxa de jiu-jitsu.', icon: '🟪', metric: 'belt', min: 2 },
  { id: 'faixa_preta', name: 'Faixa preta', description: 'Chegue à faixa preta de jiu-jitsu.', icon: '⬛', metric: 'belt', min: 4 },
  { id: 'campeao_regional', name: 'Rei da região', description: 'Conquiste um cinturão regional.', icon: '🏆', metric: 'regionalTitles', min: 1 },
  { id: 'campeao_tita', name: 'Campeão do Circuito Titã', description: 'Conquiste o cinturão da liga principal.', icon: '👑', metric: 'majorTitles', min: 1 },
  { id: 'tres_defesas', name: 'Dono da categoria', description: 'Defenda um cinturão 3 vezes.', icon: '🔒', metric: 'titleDefenses', min: 3 },
  { id: 'ko_rival', name: 'Acerto de contas', description: 'Nocauteie o seu rival.', icon: '😤', secret: true, metric: 'koRival', min: 1 },
  { id: 'lenda', name: 'Lenda viva', description: 'Chegue a 90 de reputação.', icon: '🌟', metric: 'reputation', min: 90 },
  { id: 'veterano_40', name: 'O tempo não manda', description: 'Lute com 40 anos ou mais.', icon: '🧓', metric: 'oldestFightAge', min: 40 },
  { id: 'invicto_aposentado', name: 'Saiu invicto', description: 'Aposente-se sem nenhuma derrota profissional (mínimo 5 vitórias).', icon: '💎', secret: true, metric: 'undefeatedRetired', min: 1 },
  { id: 'despedida', name: 'Saiu por cima', description: 'Vença a luta de despedida.', icon: '👋', metric: 'farewellWin', min: 1 },
  { id: 'volta', name: 'Ele(a) voltou!', description: 'Volte da aposentadoria.', icon: '🔙', metric: 'comebacks', min: 1 },
  // --- saúde ---
  { id: 'cirurgia', name: 'Bisturi', description: 'Passe por uma cirurgia.', icon: '🩺', metric: 'surgeries', min: 1 },
  { id: 'colecao_lesoes', name: 'Corpo marcado', description: 'Sofra 8 lesões numa vida.', icon: '🩹', metric: 'injuries', min: 8 },
  { id: 'aposentou_inteiro', name: 'Inteiro', description: 'Aposente-se da luta sem nenhuma sequela.', icon: '🙌', metric: 'retiredHealthy', min: 1 },
  { id: 'cortado', name: 'Dispensado', description: 'Tenha o contrato cortado por derrotas.', icon: '✂️', secret: true, metric: 'contractCuts', min: 1 },
  { id: 'oitenta_saudavel', name: 'Saúde de ferro', description: 'Chegue aos 80 com saúde 60 ou mais.', icon: '💪', metric: 'healthyOld', min: 1 },
  { id: 'centenario', name: 'Centenário', description: 'Viva até os 100 anos.', icon: '💯', metric: 'age', min: 100 },
  // --- relações ---
  { id: 'casou', name: 'Sim!', description: 'Case-se.', icon: '💍', metric: 'married', min: 1 },
  { id: 'para_sempre', name: 'Até que a morte nos separe', description: 'Case-se e nunca se divorcie.', icon: '💞', metric: 'marriedNeverDivorced', min: 1, onDeath: true },
  { id: 'familia_grande', name: 'Casa cheia', description: 'Tenha 3 filhos.', icon: '👨‍👩‍👧‍👦', metric: 'children', min: 3 },
  // --- economia ---
  { id: 'casa_propria', name: 'Lar, doce lar', description: 'More num imóvel próprio.', icon: '🏠', metric: 'ownHome', min: 1 },
  { id: 'milionario', name: 'Primeiro milhão', description: 'Chegue a R$ 1 milhão de patrimônio.', icon: '💰', metric: 'netWorth', min: 1_000_000 },
  { id: 'milionario_jovem', name: 'Rico antes dos 30', description: 'Tenha R$ 1 milhão de patrimônio até os 30 anos.', icon: '🚀', secret: true, metric: 'millionaireYoung', min: 1 },
  { id: 'dez_milhoes', name: 'Magnata', description: 'Chegue a R$ 10 milhões de patrimônio.', icon: '🏦', metric: 'netWorth', min: 10_000_000 },
  { id: 'academia_propria', name: 'Meu próprio tatame', description: 'Tenha a sua própria academia.', icon: '🥋', metric: 'gymOwner', min: 1 },
  { id: 'tres_empresas', name: 'Empreendedor serial', description: 'Abra 3 empresas numa vida.', icon: '🏢', metric: 'businessesOpened', min: 3 },
  { id: 'fenix', name: 'Fênix', description: 'Passe por uma falência e volte a ter R$ 200 mil de patrimônio.', icon: '🔥', secret: true, metric: 'bankruptcyRecovered', min: 1 },
  { id: 'garoto_propaganda', name: 'Garoto-propaganda', description: 'Tenha 3 patrocínios ao mesmo tempo.', icon: '📣', metric: 'sponsors', min: 3 },
  { id: 'comentarista', name: 'Voz da arena', description: 'Trabalhe como comentarista de lutas na TV.', icon: '🎙️', metric: 'tvCommentator', min: 1 },
  // --- legado ---
  { id: 'testamento', name: 'Tudo em ordem', description: 'Faça um testamento.', icon: '📝', metric: 'willMade', min: 1 },
  { id: 'segunda_geracao', name: 'A história continua', description: 'Continue a vida como seu filho ou sua filha.', icon: '🌱', metric: 'generation', min: 2 },
  { id: 'tres_geracoes_lutadores', name: 'Sangue de lutador', description: 'Tenha 3 gerações de lutadores na família.', icon: '🧬', metric: 'fighterGenerations', min: 3 },
  { id: 'filho_campeao', name: 'Tal pai, tal filho', description: 'Seja campeão sendo da 2ª geração ou mais.', icon: '🏆', metric: 'heirChampion', min: 1 },
  { id: 'dinastia_tita', name: 'Dinastia Titã', description: 'Seja campeão do Titã como herdeiro de um campeão do Titã.', icon: '🐉', secret: true, metric: 'heirMajorChampion', min: 1 },
  { id: 'academia_herdada', name: 'Tradição de família', description: 'Herde a academia da família.', icon: '🏛️', metric: 'inheritedGym', min: 1 },
  { id: 'cinco_geracoes', name: 'Dinastia', description: 'Chegue à 5ª geração da família.', icon: '🌳', metric: 'generation', min: 5 },
  { id: 'vida_exemplar', name: 'Vida exemplar', description: 'Termine uma vida com nota 80 ou mais.', icon: '⭐', metric: 'lifeScore', min: 80, onDeath: true },
  { id: 'hall_cinco', name: 'Galeria', description: 'Tenha 5 vidas no Hall da Fama.', icon: '🖼️', metric: 'hallSize', min: 5 },
];
