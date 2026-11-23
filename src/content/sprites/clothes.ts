/**
 * Regras de roupa em pixel art (Etapa 8): cada peça é uma REGRA sobre a silhueta, não um desenho por corpo.
 * `cover` diz quais regiões do corpo a peça cobre, de qual âncora até qual (linhas, inclusive); o renderizador
 * recolore essas regiões com a rampa da cor, aplica dobras (axilas, cintura, joelhos, cotovelos) e o contorno.
 * Assim toda peça funciona em todos os corpos e idades. Regiões: ver `types.ts`.
 */
import type { AnchorName, Region } from './types';

export interface AnchorY {
  a: AnchorName;
  dy?: number;
}

export interface CoverRule {
  regions: readonly Region[];
  from?: AnchorY;
  to?: AnchorY;
}

export type ClothingDetail =
  | 'gola' // gola redonda (linha escura no topo do tronco)
  | 'decote' // decote em V/U mostrando a pele
  | 'alcas' // alças (vestido/macacão): ombros à mostra
  | 'botoes'
  | 'ziper'
  | 'bolso'
  | 'capuz'
  | 'cordao'
  | 'manga' // barra da manga
  | 'barra' // barra da peça
  | 'cos' // cós (linha da cintura)
  | 'emblema'
  | 'lapela'
  | 'gravata'
  | 'aberto' // agasalho aberto na frente (mostra a peça de baixo)
  | 'saia' // preenche o vão entre as pernas
  | 'sola'
  | 'tira' // tira do chinelo
  | 'brilho'
  | 'faixa' // faixa de jiu-jitsu/judô (acessório; `accent` = listra da faixa infantil)
  | 'prajied' // prajied do muay thai no braço (acessório; `accent` = ponta)
  | 'aba' // boné
  | 'lentes' // óculos
  | 'vinco'
  | 'algemas'; // algemas nos pulsos (contexto da prisão)

export interface ClothingRule {
  cover: readonly CoverRule[];
  details?: readonly ClothingDetail[];
}

const TOP_SHORT: CoverRule[] = [{ regions: ['t'] }, { regions: ['a'], to: { a: 'elbowL', dy: -2 } }];
const TOP_LONG: CoverRule[] = [{ regions: ['t', 'a'] }];
const TORSO: CoverRule[] = [{ regions: ['t'] }];
const LEGS_FULL: CoverRule[] = [{ regions: ['c', 'l', 'r'], to: { a: 'ankleL', dy: -1 } }];

export const CLOTHING_RULES: Readonly<Record<string, ClothingRule>> = {
  // bebê
  body: { cover: [{ regions: ['t', 'c'] }, { regions: ['a'], to: { a: 'elbowL', dy: -1 } }], details: ['botoes'] },
  meia: { cover: [{ regions: ['p'] }] },
  // parte de cima
  camiseta: { cover: TOP_SHORT, details: ['gola', 'manga'] },
  camiseta_listrada: { cover: TOP_SHORT, details: ['gola', 'manga'] },
  camiseta_estampa: { cover: TOP_SHORT, details: ['gola', 'manga'] },
  uniforme: { cover: TOP_SHORT, details: ['gola', 'manga', 'emblema'] },
  camisa_formatura: { cover: TOP_SHORT, details: ['gola', 'manga', 'emblema'] },
  regata: { cover: TORSO, details: ['decote'] },
  regata_treino: { cover: TORSO, details: ['decote'] },
  polo: { cover: TOP_SHORT, details: ['gola', 'botoes', 'manga'] },
  social: { cover: TOP_LONG, details: ['gola', 'botoes', 'manga'] },
  arara_social: { cover: TOP_LONG, details: ['gola', 'botoes', 'brilho'] },
  xadrez: { cover: TOP_LONG, details: ['gola', 'botoes', 'manga'] },
  blusa: { cover: TOP_SHORT, details: ['decote', 'manga'] },
  moletom: { cover: TOP_LONG, details: ['capuz', 'cordao', 'bolso', 'manga'] },
  cronos_moletom: { cover: TOP_LONG, details: ['capuz', 'cordao', 'bolso', 'brilho'] },
  cropped: { cover: [{ regions: ['t'], to: { a: 'waist', dy: -4 } }, { regions: ['a'], to: { a: 'elbowL', dy: -3 } }], details: ['gola'] },
  rashguard: { cover: TOP_LONG, details: ['gola', 'barra'] },
  // inteiras
  vestido: { cover: [{ regions: ['t', 'c'] }, { regions: ['l', 'r'], to: { a: 'kneeL', dy: 1 } }], details: ['alcas', 'decote', 'saia', 'barra'] },
  vestido_festa: { cover: [{ regions: ['t', 'c'] }, { regions: ['l', 'r'], to: { a: 'ankleL', dy: -2 } }], details: ['alcas', 'decote', 'saia', 'brilho'] },
  macacao: { cover: [{ regions: ['t', 'c', 'l', 'r'], to: { a: 'ankleL', dy: -1 } }], details: ['alcas', 'bolso'] },
  kimono: { cover: [{ regions: ['t', 'c', 'l', 'r'], to: { a: 'ankleL', dy: -1 } }, { regions: ['a'], to: { a: 'wristL', dy: -1 } }], details: ['lapela', 'manga'] },
  // parte de baixo
  calca_jeans: { cover: LEGS_FULL, details: ['cos', 'barra'] },
  calca_moletom: { cover: LEGS_FULL, details: ['cordao', 'barra'] },
  calca_social: { cover: LEGS_FULL, details: ['cos', 'vinco'] },
  bermuda: { cover: [{ regions: ['c', 'l', 'r'], to: { a: 'kneeL', dy: 1 } }], details: ['cos', 'barra'] },
  shorts: { cover: [{ regions: ['c', 'l', 'r'], to: { a: 'hipL', dy: 4 } }], details: ['cos'] },
  shorts_luta: { cover: [{ regions: ['c', 'l', 'r'], to: { a: 'kneeL', dy: -2 } }], details: ['cos', 'barra'] },
  saia: { cover: [{ regions: ['c'] }, { regions: ['l', 'r'], to: { a: 'kneeL', dy: -1 } }], details: ['saia', 'cos'] },
  // calçados
  tenis: { cover: [{ regions: ['p'] }, { regions: ['l', 'r'], from: { a: 'ankleL' } }], details: ['sola'] },
  chinelo: { cover: [{ regions: ['p'], from: { a: 'ankleL', dy: 2 } }], details: ['tira'] },
  sapato: { cover: [{ regions: ['p'] }], details: ['brilho'] },
  bota: { cover: [{ regions: ['p'] }, { regions: ['l', 'r'], from: { a: 'ankleL', dy: -3 } }], details: ['sola'] },
  descalco: { cover: [] },
  // agasalhos
  jaqueta: { cover: TOP_LONG, details: ['aberto', 'ziper', 'gola', 'manga'] },
  arara_jaqueta: { cover: TOP_LONG, details: ['aberto', 'ziper', 'gola', 'brilho'] },
  casaco: { cover: [{ regions: ['t', 'a', 'c'] }], details: ['aberto', 'botoes', 'gola'] },
  terno: { cover: TOP_LONG, details: ['aberto', 'lapela', 'gravata'] },
  cronos_terno: { cover: TOP_LONG, details: ['aberto', 'lapela', 'gravata', 'brilho'] },
  roupao: { cover: [{ regions: ['t', 'a', 'c'] }, { regions: ['l', 'r'], to: { a: 'kneeL' } }], details: ['aberto', 'lapela', 'brilho', 'saia'] },
  // praia e piscina (release 0.0.1)
  biquini: { cover: [{ regions: ['t'], from: { a: 'chest', dy: -1 }, to: { a: 'chest', dy: 1 } }, { regions: ['c'], to: { a: 'waist', dy: 2 } }], details: ['alcas'] },
  maio: { cover: [{ regions: ['t', 'c'], from: { a: 'chest', dy: -2 } }], details: ['alcas'] },
  sunga: { cover: [{ regions: ['c'], to: { a: 'waist', dy: 2 } }], details: ['cos'] },
  bermuda_praia: { cover: [{ regions: ['c', 'l', 'r'], to: { a: 'kneeL', dy: -1 } }], details: ['cos'] },
  saida_praia: { cover: [{ regions: ['t', 'c'], from: { a: 'chest', dy: -1 } }, { regions: ['l', 'r'], to: { a: 'kneeL', dy: -2 } }], details: ['aberto', 'saia'] },
  maio_infantil: { cover: [{ regions: ['t', 'c'] }], details: ['alcas'] },
  camiseta_uv: { cover: TOP_SHORT, details: ['gola', 'manga'] },
  bermuda_infantil: { cover: [{ regions: ['c', 'l', 'r'], to: { a: 'kneeL', dy: -1 } }], details: ['cos'] },
  // fardas e prisão (release 0.0.2)
  farda_pm: { cover: TOP_SHORT, details: ['gola', 'botoes', 'manga', 'emblema'] },
  calca_farda: { cover: LEGS_FULL, details: ['cos', 'bolso'] },
  colete_pm: { cover: TORSO, details: ['ziper', 'emblema'] },
  coturno: { cover: [{ regions: ['p'] }, { regions: ['l', 'r'], from: { a: 'ankleL', dy: -3 } }], details: ['sola'] },
  camisa_civil: { cover: TOP_SHORT, details: ['gola', 'botoes', 'manga'] },
  colete_civil: { cover: TORSO, details: ['emblema', 'bolso'] },
  farda_tatica: { cover: TOP_LONG, details: ['gola', 'bolso', 'manga'] },
  uniforme_presidiario: { cover: [{ regions: ['t', 'c', 'l', 'r'], to: { a: 'ankleL', dy: -1 } }, { regions: ['a'], to: { a: 'elbowL', dy: -2 } }], details: ['gola', 'barra'] },
  bone_pm: { cover: [], details: ['aba'] },
  capacete: { cover: [], details: ['aba'] },
  algemas: { cover: [], details: ['algemas'] },
  // acessórios (desenhados por cima do cabelo/rosto)
  faixa: { cover: [], details: ['faixa'] },
  prajied: { cover: [], details: ['prajied'] },
  bone: { cover: [], details: ['aba'] },
  oculos: { cover: [], details: ['lentes'] },
};

/** Ordem das camadas de roupa (de baixo para cima). */
export const LAYER_ORDER = ['baixo', 'inteira', 'calcado', 'cima', 'agasalho'] as const;
