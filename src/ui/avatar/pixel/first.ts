/** Primeiro personagem da Etapa 8 (adulto, corpo médio, camiseta, calça, cabelo curto) — referência de qualidade. */
import { ADULTO_M_MEDIO } from '../../../content/sprites/body/adulto_M_medio';
import type { AvatarSpec } from './compose';

// cabelo curto, origem (8, 1): 16 colunas (x8..23)
// prettier-ignore
const CURTO = [
  '....ffffffff....', // 1
  '..ffffffffffff..', // 2
  '.ffffffffffffff.', // 3
  'ffffffffffffffff', // 4
  'ffffffffffffffff', // 5
  'ffffffffffffffff', // 6
  'fff.f....f..ffff', // 7
  'ff............ff', // 8
  '.f............f.', // 9
];

export function firstCharacter(skin: string, hair = '#2b1d14', shirt = '#3f6fb5'): AvatarSpec {
  return {
    body: ADULTO_M_MEDIO,
    skin,
    hair: { color: hair, grid: CURTO, origin: [8, 1] },
    face: { eyeColor: '#4a2e1c', lip: '#b0605a' },
    clothes: [
      // calça jeans: quadril + pernas até o tornozelo; cós escuro; dobras no joelho e na virilha
      {
        id: 'calca', color: '#34476b',
        cover: [{ regions: ['c', 'l', 'r'], toY: 59 }],
        folds: [[15, 41], [16, 41], [12, 50], [19, 50], [13, 51], [20, 51]],
        details: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((x) => ({ x, y: 36, tone: 1 as const })),
      },
      // tênis: cabedal escuro e solado claro (cobre o tornozelo também)
      { id: 'tenis', color: '#3a3a46', cover: [{ regions: ['p'] }, { regions: ['l', 'r'], fromY: 60 }] },
      { id: 'sola', color: '#ece6da', cover: [{ regions: ['p'], fromY: 62 }] },
      // camiseta manga curta: tronco + braço até 5 linhas abaixo do ombro; dobras nas axilas e na cintura
      {
        id: 'camiseta', color: shirt,
        cover: [{ regions: ['t'] }, { regions: ['a'], toY: 27 }],
        folds: [[9, 24], [9, 25], [22, 24], [22, 25], [21, 33], [11, 34], [12, 34], [5, 27], [6, 27], [7, 27], [8, 27], [23, 27], [24, 27], [25, 27], [26, 27]],
        details: [13, 14, 15, 16, 17, 18].map((x) => ({ x, y: 21, tone: 1 as const })),
      },
    ],
  };
}
