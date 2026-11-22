import type { BodySprite } from '../types';

/** Adulto, masculino, corpo médio — 32×64. Primeiro modelo da Etapa 8 (base para os outros tipos). */
export const ADULTO_M_MEDIO: BodySprite = {
  id: 'adulto_M_medio',
  w: 32,
  h: 64,
  // prettier-ignore
  shape: [
    '................................', //  0
    '................................', //  1
    '................................', //  2
    '............hhhhhhhh............', //  3
    '..........hhhhhhhhhhhh..........', //  4
    '.........hhhhhhhhhhhhhh.........', //  5
    '.........hhhhhhhhhhhhhh.........', //  6
    '.........hhhhhhhhhhhhhh.........', //  7
    '.........hhhhhhhhhhhhhh.........', //  8
    '.........hhhhhhhhhhhhhh.........', //  9
    '........ehhhhhhhhhhhhhhe........', // 10
    '........ehhhhhhhhhhhhhhe........', // 11
    '........ehhhhhhhhhhhhhhe........', // 12
    '.........hhhhhhhhhhhhhh.........', // 13
    '.........hhhhhhhhhhhhhh.........', // 14
    '..........hhhhhhhhhhhh..........', // 15
    '..........hhhhhhhhhhhh..........', // 16
    '...........hhhhhhhhhh...........', // 17
    '............hhhhhhhh............', // 18
    '.............nnnnnn.............', // 19
    '.............nnnnnn.............', // 20
    '..........tttttttttttt..........', // 21
    '.......atttttttttttttttta.......', // 22
    '......aaattttttttttttttaaa......', // 23
    '.....aaaattttttttttttttaaaa.....', // 24
    '.....aaaattttttttttttttaaaa.....', // 25
    '.....aaaattttttttttttttaaaa.....', // 26
    '.....aaaattttttttttttttaaaa.....', // 27
    '.....aaaattttttttttttttaaaa.....', // 28
    '.....aaaattttttttttttttaaaa.....', // 29
    '.....aaaa.tttttttttttt.aaaa.....', // 30
    '.....aaa..tttttttttttt..aaa.....', // 31
    '.....aaa..tttttttttttt..aaa.....', // 32
    '.....aaa..tttttttttttt..aaa.....', // 33
    '.....aaa..tttttttttttt..aaa.....', // 34
    '.....aaa..tttttttttttt..aaa.....', // 35
    '.....aaa..cccccccccccc..aaa.....', // 36
    '.....mmm..cccccccccccc..mmm.....', // 37
    '.....mmm..cccccccccccc..mmm.....', // 38
    '......m...cccccccccccc...m......', // 39
    '..........cccccccccccc..........', // 40
    '..........llllllrrrrrr..........', // 41
    '..........llllllrrrrrr..........', // 42
    '..........llllllrrrrrr..........', // 43
    '..........llllllrrrrrr..........', // 44
    '..........llllllrrrrrr..........', // 45
    '..........lllll..rrrrr..........', // 46
    '..........lllll..rrrrr..........', // 47
    '..........lllll..rrrrr..........', // 48
    '..........lllll..rrrrr..........', // 49
    '..........lllll..rrrrr..........', // 50
    '..........lllll..rrrrr..........', // 51
    '..........lllll..rrrrr..........', // 52
    '..........lllll..rrrrr..........', // 53
    '..........lllll..rrrrr..........', // 54
    '..........lllll..rrrrr..........', // 55
    '..........lllll..rrrrr..........', // 56
    '..........lllll..rrrrr..........', // 57
    '..........lllll..rrrrr..........', // 58
    '...........llll..rrrr...........', // 59
    '...........llll..rrrr...........', // 60
    '..........ppppp..ppppp..........', // 61
    '.........pppppp..pppppp.........', // 62
    '................................', // 63
  ],
  anchors: {
    head: [15, 10], eyeL: [12, 11], eyeR: [18, 11], mouth: [15, 15], neck: [15, 19],
    shoulderL: [8, 22], shoulderR: [23, 22], chest: [15, 25], waist: [15, 36],
    elbowL: [6, 30], elbowR: [25, 30], wristL: [6, 36], wristR: [25, 36],
    hipL: [12, 40], hipR: [19, 40], kneeL: [12, 50], kneeR: [19, 50], ankleL: [12, 60], ankleR: [19, 60],
  },
  headBox: [9, 3, 14, 16],
};
