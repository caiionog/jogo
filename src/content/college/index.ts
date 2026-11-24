import type { CollegeContent } from '../../engine';

/**
 * Faculdade (release 0.0.1). Exame nacional FICTÍCIO (ENU, nota 0–1000), instituições fictícias e 15 cursos.
 * `cutoffPublic`/`cutoffPrivate`: nota mínima do ENU; `tuitionMW`: mensalidade da particular em salários mínimos
 * (× 12 por ano, × custo da cidade); `difficulty` 0–1 pesa na nota do ano; `develops`: atributo que sobe a cada ano.
 */
export const COLLEGE: CollegeContent = {
  examName: 'Exame Nacional Unificado (ENU)',
  loanName: 'Crédito Estudantil Futuro',
  loanRate: 0.04,
  scholarshipMargin: 160,
  barExam: { name: 'Exame da Ordem', fee: 300, cut: 60, degree: 'direito' },
  postgrad: [
    { id: 'especializacao', label: 'Especialização', years: 1, tuitionMW: 0.8, minIntelligence: 40 },
    { id: 'mestrado', label: 'Mestrado', years: 2, tuitionMW: 0, minIntelligence: 60 },
    { id: 'doutorado', label: 'Doutorado', years: 4, tuitionMW: 0, minIntelligence: 70, requires: 'mestrado' },
  ],
  publicNames: ['Universidade Federal do Cerrado', 'Universidade Estadual Ipê', 'Universidade Federal Atlântica', 'Instituto Federal Jequitibá'],
  privateNames: ['Centro Universitário Horizonte', 'Faculdade Saber Mais', 'Universidade Particular Aurora', 'Faculdade Nova Era'],
  courses: [
    { id: 'educacao_fisica', label: 'Educação Física', years: 4, cutoffPublic: 600, cutoffPrivate: 380, tuitionMW: 0.6, difficulty: 0.3, develops: 'athletic' },
    { id: 'fisioterapia', label: 'Fisioterapia', years: 5, cutoffPublic: 680, cutoffPrivate: 420, tuitionMW: 0.9, difficulty: 0.5, develops: 'intelligence' },
    { id: 'nutricao', label: 'Nutrição', years: 4, cutoffPublic: 650, cutoffPrivate: 400, tuitionMW: 0.8, difficulty: 0.45, develops: 'intelligence' },
    { id: 'direito', label: 'Direito', years: 5, cutoffPublic: 740, cutoffPrivate: 430, tuitionMW: 1.0, difficulty: 0.55, develops: 'intelligence' },
    { id: 'administracao', label: 'Administração', years: 4, cutoffPublic: 640, cutoffPrivate: 380, tuitionMW: 0.6, difficulty: 0.35, develops: 'intelligence' },
    { id: 'contabeis', label: 'Ciências Contábeis', years: 4, cutoffPublic: 630, cutoffPrivate: 380, tuitionMW: 0.6, difficulty: 0.4, develops: 'intelligence' },
    { id: 'medicina', label: 'Medicina', years: 6, cutoffPublic: 820, cutoffPrivate: 650, tuitionMW: 6.0, difficulty: 0.8, develops: 'intelligence' },
    { id: 'enfermagem', label: 'Enfermagem', years: 5, cutoffPublic: 660, cutoffPrivate: 400, tuitionMW: 0.8, difficulty: 0.5, develops: 'intelligence' },
    { id: 'engenharia', label: 'Engenharia', years: 5, cutoffPublic: 750, cutoffPrivate: 440, tuitionMW: 1.1, difficulty: 0.7, develops: 'intelligence' },
    { id: 'computacao', label: 'Ciência da Computação', years: 4, cutoffPublic: 740, cutoffPrivate: 430, tuitionMW: 1.0, difficulty: 0.65, develops: 'intelligence' },
    { id: 'jornalismo', label: 'Jornalismo', years: 4, cutoffPublic: 660, cutoffPrivate: 390, tuitionMW: 0.8, difficulty: 0.4, develops: 'looks' },
    { id: 'psicologia', label: 'Psicologia', years: 5, cutoffPublic: 690, cutoffPrivate: 410, tuitionMW: 0.9, difficulty: 0.5, develops: 'happiness' },
    { id: 'pedagogia', label: 'Pedagogia', years: 4, cutoffPublic: 600, cutoffPrivate: 360, tuitionMW: 0.5, difficulty: 0.3, develops: 'intelligence' },
    { id: 'arquitetura', label: 'Arquitetura e Urbanismo', years: 5, cutoffPublic: 720, cutoffPrivate: 420, tuitionMW: 1.1, difficulty: 0.6, develops: 'intelligence' },
    { id: 'marketing', label: 'Marketing', years: 4, cutoffPublic: 640, cutoffPrivate: 380, tuitionMW: 0.8, difficulty: 0.35, develops: 'looks' },
  ],
};
