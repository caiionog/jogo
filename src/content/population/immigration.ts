/**
 * Imigração por UF (release 0.0.4). **Estimativa NÃO oficial**, arredondada e simplificada para o jogo. Não existe um
 * recorte público por UF e nacionalidade ao mesmo tempo, então ela foi montada a partir de:
 * - Ministério da Justiça, Boletim da Migração (ed. 5, 8, 10 e 15, 2024–2025): registros por UF (SP, PR e RR à
 *   frente em 2024) e totais por nacionalidade (Venezuela, Haiti, Bolívia e Colômbia entre as maiores);
 * - reportagens regionais (Goiás e Ceará, 2024): nacionalidades predominantes nas entradas.
 * O total de cada UF é a parte dos moradores nascida fora do Brasil; a mistura por região diz de onde vêm.
 * Troque pelos números do SISMIGRA/OBMigra assim que houver o cruzamento oficial.
 */
type Mix = Record<string, number>;

const NORTE: Mix = { Venezuela: 0.8, Haiti: 0.07, Colômbia: 0.05, Peru: 0.04, Bolívia: 0.04 };
const FRONTEIRA_OESTE: Mix = { Bolívia: 0.4, Peru: 0.25, Venezuela: 0.25, Haiti: 0.1 };
const SUL: Mix = { Venezuela: 0.35, Haiti: 0.28, Paraguai: 0.1, Argentina: 0.1, Uruguai: 0.07, Colômbia: 0.05, Cuba: 0.05 };
const SP: Mix = { Bolívia: 0.24, Venezuela: 0.15, Haiti: 0.14, China: 0.1, Portugal: 0.08, Colômbia: 0.07, Angola: 0.05, Peru: 0.06, Argentina: 0.06, Paraguai: 0.05 };
const RJ: Mix = { Portugal: 0.2, Venezuela: 0.18, China: 0.1, Angola: 0.1, Argentina: 0.1, Colômbia: 0.1, 'Estados Unidos': 0.1, Haiti: 0.12 };
const CENTRO_OESTE: Mix = { Paraguai: 0.3, Bolívia: 0.28, Venezuela: 0.27, Haiti: 0.1, Colômbia: 0.05 };
const NORDESTE: Mix = { Venezuela: 0.4, Portugal: 0.15, Itália: 0.13, Cuba: 0.1, 'Guiné-Bissau': 0.1, Angola: 0.07, 'Coreia do Sul': 0.05 };
const CENTRO: Mix = { Venezuela: 0.4, Haiti: 0.2, Colômbia: 0.1, Portugal: 0.1, Bolívia: 0.1, Cuba: 0.1 };

/** UF → [parte nascida fora do Brasil, mistura de origens]. */
const UF_TOTAL: Record<string, [number, Mix]> = {
  RR: [0.08, NORTE], AM: [0.015, NORTE], PA: [0.003, NORTE], AP: [0.005, { 'Guiana Francesa': 0.4, Venezuela: 0.3, Haiti: 0.3 }], TO: [0.002, NORTE],
  AC: [0.01, FRONTEIRA_OESTE], RO: [0.006, FRONTEIRA_OESTE],
  PR: [0.015, SUL], SC: [0.015, SUL], RS: [0.008, SUL],
  SP: [0.012, SP], RJ: [0.008, RJ], MG: [0.003, CENTRO], ES: [0.003, CENTRO],
  MS: [0.01, CENTRO_OESTE], MT: [0.008, CENTRO_OESTE], GO: [0.004, CENTRO], DF: [0.008, CENTRO],
  BA: [0.002, NORDESTE], PE: [0.002, NORDESTE], CE: [0.002, NORDESTE], RN: [0.002, NORDESTE], PB: [0.0015, NORDESTE],
  AL: [0.0015, NORDESTE], SE: [0.0015, NORDESTE], PI: [0.001, NORDESTE], MA: [0.001, NORDESTE],
};

export const IMMIGRATION: readonly { uf: string; origin: string; share: number }[] = Object.entries(UF_TOTAL).flatMap(([uf, [total, mix]]) =>
  Object.entries(mix).map(([origin, part]) => ({ uf, origin, share: Math.round(total * part * 100000) / 100000 })),
);

/** Idioma dos nomes por país de origem (o gerador usa o banco de nomes correspondente). */
export const ORIGIN_NAMES: Record<string, 'es' | 'ht' | 'zh' | 'pt' | 'it' | 'ko' | 'en' | 'fr' | 'af'> = {
  Venezuela: 'es', Colômbia: 'es', Peru: 'es', Bolívia: 'es', Paraguai: 'es', Argentina: 'es', Uruguai: 'es', Cuba: 'es',
  Haiti: 'ht', China: 'zh', Portugal: 'pt', Angola: 'af', 'Guiné-Bissau': 'af', Itália: 'it', 'Coreia do Sul': 'ko',
  'Estados Unidos': 'en', 'Guiana Francesa': 'fr',
};

/** Nomes fictícios comuns por idioma (só primeiros nomes e sobrenomes genéricos). */
export const FOREIGN_NAMES: Record<string, { M: readonly string[]; F: readonly string[]; surnames: readonly string[] }> = {
  es: { M: ['José', 'Luis', 'Carlos', 'Andrés', 'Jesús', 'Miguel', 'Alejandro', 'Diego'], F: ['María', 'Carmen', 'Daniela', 'Valentina', 'Gabriela', 'Rosa', 'Andrea', 'Camila'], surnames: ['González', 'Rodríguez', 'Pérez', 'Hernández', 'Martínez', 'Mamani', 'Quispe', 'Gómez'] },
  ht: { M: ['Jean', 'Pierre', 'Wilson', 'Emmanuel', 'Jacques', 'Fritz'], F: ['Marie', 'Nadège', 'Rose', 'Fabiola', 'Mirlande', 'Sandra'], surnames: ['Joseph', 'Jean-Baptiste', 'Pierre', 'Louis', 'Charles', 'Saint-Fleur'] },
  zh: { M: ['Wei', 'Jun', 'Hao', 'Lei', 'Ming'], F: ['Li', 'Mei', 'Xiu', 'Ying', 'Fang'], surnames: ['Wang', 'Li', 'Zhang', 'Chen', 'Liu', 'Huang'] },
  pt: { M: ['Manuel', 'Joaquim', 'Rui', 'Tiago', 'Duarte'], F: ['Inês', 'Leonor', 'Beatriz', 'Mariana', 'Catarina'], surnames: ['Ferreira', 'Pereira', 'Sousa', 'Fonseca', 'Pinto'] },
  it: { M: ['Marco', 'Luca', 'Giuseppe', 'Matteo'], F: ['Giulia', 'Francesca', 'Chiara', 'Sara'], surnames: ['Rossi', 'Bianchi', 'Romano', 'Colombo', 'Ricci'] },
  ko: { M: ['Min-jun', 'Ji-ho', 'Seo-jun'], F: ['Seo-yeon', 'Ji-woo', 'Min-seo'], surnames: ['Kim', 'Lee', 'Park', 'Choi'] },
  en: { M: ['John', 'Michael', 'David', 'James'], F: ['Emily', 'Sarah', 'Jessica', 'Ashley'], surnames: ['Smith', 'Johnson', 'Miller', 'Davis'] },
  fr: { M: ['Lucas', 'Hugo', 'Louis'], F: ['Léa', 'Chloé', 'Manon'], surnames: ['Martin', 'Bernard', 'Thomas', 'Petit'] },
  af: { M: ['João', 'Domingos', 'Mamadu', 'Adão'], F: ['Esperança', 'Fatumata', 'Luzia', 'Domingas'], surnames: ['Baldé', 'Mendes', 'Sanhá', 'Kiala', 'Neto'] },
};
