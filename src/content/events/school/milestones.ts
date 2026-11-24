import type { GameEvent } from '../../../engine';

/** Marcos escolares: campeonato, honra, reprovação, formatura e a decisão dos 18 anos. */
export const MILESTONE_EVENTS: readonly GameEvent[] = [
  {
    id: 'school_interschool_champ',
    conditions: { club: ['judo', 'wrestling'] },
    weight: 6,
    text: 'Campeonato interescolar de {clube}! Sua escola conta com você no tatame.',
    choices: [
      {
        id: 'compete',
        label: 'Competir com tudo',
        effects: { stats: { happiness: 8, athletic: 1 }, school: { popularity: 6 }, setFlags: { medalha_interescolar: true, interesse_luta: true } },
        resultText: 'Você venceu três lutas e voltou com a medalha de ouro!',
        risk: { chance: 0.5, effects: { stats: { happiness: -2, athletic: 1 }, setFlags: { interesse_luta: true } }, resultText: 'Você perdeu na semifinal, mas aprendeu muito com a derrota.' },
      },
      { id: 'skip', label: 'Ficar na arquibancada', effects: { stats: { happiness: -1 } }, resultText: 'Você torceu pelos colegas, mas ficou com vontade de ter lutado.' },
    ],
  },
  {
    id: 'school_honors',
    trigger: 'auto',
    once: true,
    conditions: { schoolResult: ['honors'], schoolType: 'publica', flagsNone: ['bolsista'] },
    weight: 1,
    text: 'Suas notas foram as melhores {da_escola}! Um colégio particular oferece uma bolsa integral.',
    choices: [
      { id: 'accept', label: 'Aceitar a bolsa', effects: { stats: { happiness: 5 }, setFlags: { bolsista: true }, school: { changeSchool: { type: 'particular' } } }, resultText: 'Você vai estudar com bolsa integral!' },
      { id: 'stay', label: 'Ficar com os amigos', effects: { stats: { happiness: 3 }, school: { popularity: 3 } }, resultText: 'Você recusou a bolsa para continuar com sua turma.' },
    ],
  },
  {
    id: 'school_honors_praise',
    trigger: 'auto',
    conditions: { schoolResult: ['honors'], flagsAll: ['bolsista'] },
    weight: 1,
    text: 'Seu boletim foi exemplar mais uma vez e {professor} elogiou você na frente da turma.',
    choices: [
      { id: 'thanks', label: 'Agradecer, sem graça', effects: { stats: { happiness: 4 } }, resultText: 'Seus pais colaram o boletim na geladeira.' },
      { id: 'brag', label: 'Se gabar para a turma', effects: { stats: { happiness: 3 }, school: { popularity: -3 } }, resultText: 'Alguns colegas acharam você convencid{o/a}.' },
    ],
  },
  {
    id: 'school_failed',
    trigger: 'auto',
    conditions: { schoolResult: ['failed'], enrolled: true },
    weight: 1,
    text: 'Você vai repetir o ano. Seus antigos colegas seguiram em frente.',
    choices: [
      { id: 'focus', label: 'Encarar e estudar mais', effects: { stats: { happiness: 2 }, school: { average: 5 } }, resultText: 'Desta vez vai ser diferente.' },
      { id: 'sulk', label: 'Ficar revoltad{o/a}', effects: { stats: { happiness: -3 }, school: { discipline: -5 } }, resultText: 'Você passou as primeiras semanas emburrad{o/a} no fundo da sala.' },
    ],
  },
  {
    id: 'school_graduation',
    trigger: 'auto',
    conditions: { schoolResult: ['graduated'] },
    weight: 1,
    once: true,
    text: 'Formatura do Ensino Médio! Beca, diploma e, à noite, o baile.',
    choices: [
      { id: 'dance', label: 'Dançar a noite toda no baile', effects: { stats: { happiness: 8 }, setFlags: { baile_formatura: true } }, resultText: 'Uma noite inesquecível com a turma toda.' },
      { id: 'speech', label: 'Fazer o discurso da turma', effects: { stats: { happiness: 6, intelligence: 1 }, setFlags: { orador_turma: true } }, resultText: 'Seu discurso arrancou lágrimas até de {professor}.' },
      { id: 'quiet', label: 'Pegar o diploma e ir embora', effects: { stats: { happiness: 2 } }, resultText: 'Você comemorou em casa, com a família.' },
    ],
  },
  {
    id: 'adult_path_18',
    trigger: 'auto',
    conditions: { minAge: 18, maxAge: 20, flagsNone: ['caminho_18'] },
    weight: 1,
    once: true,
    text: 'Você tem 18 anos. Hora de decidir o rumo da sua vida.',
    choices: [
      { id: 'college', label: '🎓 Fazer faculdade', effects: { setFlags: { caminho_18: 'faculdade' }, stats: { happiness: 2 } }, resultText: 'Você decidiu seguir para a faculdade.' },
      { id: 'work', label: '💼 Começar a trabalhar', effects: { setFlags: { caminho_18: 'trabalho' }, stats: { happiness: 1 } }, resultText: 'Você decidiu procurar um emprego e ganhar seu próprio dinheiro.' },
      { id: 'fight', label: '🥊 Focar na carreira de luta', effects: { setFlags: { caminho_18: 'luta', interesse_luta: true }, stats: { happiness: 3 } }, resultText: 'Você decidiu dedicar sua vida às lutas. O cinturão do Circuito Titã é o objetivo.' },
    ],
  },
];
