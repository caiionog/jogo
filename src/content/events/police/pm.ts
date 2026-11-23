import type { GameEvent } from '../../../engine';

/**
 * Polícia Militar (release 0.0.2): abordagens, ocorrências, perseguição e trocas de tiro. Violência curta e não
 * gráfica; o resultado das trocas de tiro e das imobilizações sai da engine (`police.shootout`, `police.subdue`).
 */
const PM = { force: ['pm' as const], stage: ['probatorio' as const, 'efetivo' as const] };

export const PM_EVENTS: readonly GameEvent[] = [
  {
    id: 'pol_abordagem_suspeito',
    conditions: { minAge: 18, police: PM },
    weight: 7,
    text: 'Na ronda, um rapaz muda de calçada ao ver a viatura e acelera o passo.',
    choices: [
      { id: 'protocolo', label: 'Abordar seguindo o protocolo', effects: { police: { merit: 3 } }, resultText: 'Abordagem limpa, documentos em ordem. Seu sargento aprovou a postura.' },
      { id: 'revistar', label: 'Revistar a mochila', effects: { police: { merit: 4 } }, risk: { chance: 0.35, effects: { police: { merit: 6, arrest: true } }, resultText: 'Na mochila havia objetos de um furto da semana. Você o levou para a delegacia.' }, resultText: 'Nada de errado na mochila. Ele seguiu o caminho, resmungando.' },
      { id: 'liberar', label: 'Deixar para lá', effects: { police: { merit: -1 } }, risk: { chance: 0.2, effects: { police: { merit: -3 }, stats: { happiness: -2 } }, resultText: 'Uma hora depois, a central informou um furto naquela rua. O comando quis saber por que você não abordou.' }, resultText: 'Provavelmente era só alguém com pressa.' },
    ],
  },
  {
    id: 'pol_abordagem_tensa',
    conditions: { minAge: 18, police: PM },
    weight: 6,
    text: 'Um homem alterado discute com o porteiro de um prédio e parte para cima de você quando você se aproxima.',
    choices: [
      { id: 'apoio', label: 'Recuar e pedir apoio pelo rádio', effects: { police: { merit: 2 } }, resultText: 'Com mais dois policiais, a situação se acalmou sem ninguém se machucar.' },
      { id: 'imobilizar', label: 'Imobilizar com técnica', effects: { police: { subdue: true, arrest: true } }, resultText: 'Você entrou firme para controlar a situação.' },
      { id: 'forca', label: 'Usar a força', effects: { police: { merit: 1, corregedoria: 1 } }, risk: { chance: 0.4, effects: { police: { corregedoria: 2 }, stats: { happiness: -3 } }, resultText: 'Alguém filmou. O vídeo circulou e a corregedoria abriu um procedimento.' }, resultText: 'Ele foi contido, mas a reclamação chegou ao batalhão.' },
    ],
  },
  {
    id: 'pol_assalto_andamento',
    conditions: { minAge: 18, police: PM },
    weight: 5,
    text: 'Chamado de assalto em andamento numa farmácia. Ao chegar, a viatura é recebida com disparos.',
    choices: [
      { id: 'avancar', label: 'Avançar com a equipe', effects: { police: { shootout: 'avancar' } }, resultText: 'Vocês avançaram em formação.' },
      { id: 'abrigar', label: 'Se abrigar e cercar', effects: { police: { shootout: 'abrigar' } }, resultText: 'Você se protegeu atrás da viatura e pediu cerco.' },
      { id: 'negociar', label: 'Negociar a rendição', effects: { police: { shootout: 'negociar' } }, resultText: 'Você gritou para o suspeito largar a arma e conversar.' },
    ],
  },
  {
    id: 'pol_perseguicao',
    conditions: { minAge: 18, police: PM },
    weight: 4,
    text: 'Um carro furado no bloqueio arranca. Depois de uma perseguição pelas avenidas, ele bate num poste e os ocupantes saem atirando.',
    choices: [
      { id: 'avancar', label: 'Ir atrás a pé', effects: { police: { shootout: 'avancar' } }, resultText: 'Você correu atrás deles.' },
      { id: 'abrigar', label: 'Se abrigar e esperar reforço', effects: { police: { shootout: 'abrigar' } }, resultText: 'Você se abrigou e chamou reforço.' },
      { id: 'recuar', label: 'Recuar e preservar a equipe', effects: { police: { shootout: 'recuar' } }, resultText: 'Você mandou a equipe recuar.' },
    ],
  },
  {
    id: 'pol_briga_bar',
    conditions: { minAge: 18, police: PM },
    weight: 4,
    text: 'Briga generalizada num bar. No meio da confusão você reconhece {lutador}, lutador conhecido do circuito.',
    choices: [
      { id: 'separar', label: 'Separar a briga com técnica', effects: { police: { subdue: true } }, resultText: 'Você entrou no meio.' },
      { id: 'reforco', label: 'Esperar o reforço e conduzir todos', effects: { police: { merit: 3 } }, resultText: 'Todo mundo foi para a delegacia. {lutador} pediu desculpas na saída.' },
      { id: 'liberar', label: 'Liberar o lutador "na moral"', effects: { stats: { happiness: 2 } }, risk: { chance: 0.3, effects: { police: { corregedoria: 1 } }, resultText: 'Um vídeo mostrou você liberando o lutador. A corregedoria pediu explicações.' }, resultText: 'Ele agradeceu e prometeu ingressos para a próxima luta.' },
    ],
  },
  {
    id: 'pol_violencia_domestica',
    conditions: { minAge: 18, police: PM },
    weight: 5,
    text: 'Vizinhos chamaram a polícia por causa de gritos num apartamento. A vítima, assustada, diz que "não foi nada".',
    choices: [
      { id: 'prender', label: 'Conduzir o agressor à delegacia', effects: { police: { merit: 5, arrest: true }, stats: { happiness: 2 } }, resultText: 'Você levou o agressor e encaminhou a vítima para a rede de proteção.' },
      { id: 'orientar', label: 'Orientar a vítima e registrar', effects: { police: { merit: 2 } }, resultText: 'Você deixou contatos de ajuda e registrou a ocorrência.' },
      { id: 'sair', label: 'Ir embora, já que ela não quer', effects: { stats: { happiness: -4 } }, resultText: 'Aquela porta fechada ficou na sua cabeça por dias.' },
    ],
  },
  {
    id: 'pol_acidente',
    conditions: { minAge: 18, police: PM },
    weight: 4,
    text: 'Acidente grave numa avenida: um motociclista caído e o trânsito parado.',
    choices: [
      { id: 'socorrer', label: 'Prestar os primeiros socorros', effects: { police: { merit: 3 }, stats: { happiness: 3 } }, resultText: 'O resgate disse que sua ajuda fez diferença.' },
      { id: 'transito', label: 'Organizar o trânsito', effects: { police: { merit: 2 } }, resultText: 'Em minutos a avenida voltou a andar e o resgate passou.' },
      { id: 'testemunhas', label: 'Ouvir as testemunhas', effects: { police: { merit: 2 }, stats: { intelligence: 1 } }, resultText: 'Seu relatório deixou claro quem causou o acidente.' },
    ],
  },
  {
    id: 'pol_especial_missao',
    conditions: { minAge: 18, police: { unit: 'especial' } },
    weight: 7,
    text: 'Missão da força especial: cumprir mandados num galpão onde se escondem suspeitos armados.',
    choices: [
      { id: 'avancar', label: 'Entrar na primeira equipe', effects: { police: { shootout: 'avancar', merit: 2 }, fighter: { reputation: 1 } }, resultText: 'Você entrou primeiro.' },
      { id: 'abrigar', label: 'Dar cobertura', effects: { police: { shootout: 'abrigar' } }, resultText: 'Você cobriu a entrada da equipe.' },
      { id: 'negociar', label: 'Tentar a rendição antes', effects: { police: { shootout: 'negociar' } }, resultText: 'Você pediu ao comando alguns minutos para negociar.' },
    ],
  },
  {
    id: 'pol_especial_refens',
    conditions: { minAge: 18, police: { unit: 'especial' } },
    weight: 5,
    text: 'Um assalto virou crise com reféns numa loja. Sua unidade foi chamada.',
    choices: [
      { id: 'negociar', label: 'Sustentar a negociação', effects: { police: { shootout: 'negociar', merit: 2 } }, resultText: 'Horas de conversa ao telefone.' },
      { id: 'avancar', label: 'Entrar no momento certo', effects: { police: { shootout: 'avancar' } }, resultText: 'O comando deu o sinal e vocês entraram.' },
      { id: 'abrigar', label: 'Manter o cerco e esperar', effects: { police: { shootout: 'abrigar' } }, resultText: 'Você manteve posição.' },
    ],
  },
];
