/** Textos dos motivos de bloqueio dos empregos (UI). */
import type { JobBlockReason, JobDef } from '../../engine';
import { EDUCATION_LABEL } from '../../engine';

const BELT_NAMES = ['branca', 'azul', 'roxa', 'marrom', 'preta'];

export function jobReasonText(r: JobBlockReason, def: JobDef): string {
  switch (r) {
    case 'age':
      return `Disponível a partir dos ${def.minAge} anos`;
    case 'education':
      return `Exige ${EDUCATION_LABEL[def.education].toLowerCase()}`;
    case 'study':
      return def.requires?.schoolStages ? 'Exige estar no ensino médio (ou faculdade)' : 'Exige estar estudando';
    case 'cnh':
      return 'Exige CNH (Atividades → Tirar a CNH)';
    case 'stats': {
      const m = def.minStats ?? {};
      return `Exige ${[m.intelligence && `inteligência ${m.intelligence}`, m.athletic && `Capacidade atlética ${m.athletic}`, m.looks && `aparência ${m.looks}`].filter(Boolean).join(', ')}`;
    }
    case 'reputation':
      return `Exige reputação ${def.minReputation}`;
    case 'fight':
      return `Exige faixa ${BELT_NAMES[def.fightReq?.minBelt ?? 1] ?? 'azul'}+${def.fightReq?.minProWins ? ` ou ${def.fightReq.minProWins} vitórias pro` : ''} ou Capacidade atlética alta`;
    case 'no-energy':
      return `Energia insuficiente (precisa de ⚡${1 + def.energy})`;
    case 'no-opening':
      return 'Sem vagas na sua cidade este ano';
    case 'employed':
      return 'Você já tem um emprego (peça demissão para trocar)';
    case 'current':
      return 'Seu emprego atual';
    case 'busy':
      return 'Resolva o acontecimento pendente';
    case 'dead':
      return '—';
  }
}
