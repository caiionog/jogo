/**
 * Ícones dos empreendimentos (release 0.0.1): 16×16 na direção de arte do avatar. Todos usam a mesma base — placa
 * clara com o símbolo do ramo em cima e a fachada com toldo listrado na cor do ramo embaixo — para formar uma família
 * coerente; o símbolo (8×7) e a cor do toldo tornam cada um único e reconhecível. Contorno escuro colorido (não
 * preto puro) e placa clara: funcionam no tema claro e no escuro.
 */
import type { IconSprite } from './index';

const OUT = '#2a2238';
const SIGN = '#f6efdc';
const WALL = '#e7dcc4';
const DOOR = '#6b4a34';
const GLASS = '#8fc3df';

/** Símbolo 8×7: `k` cor principal, `K` detalhe, `.` fundo da placa. */
interface Glyph {
  rows: readonly [string, string, string, string, string, string, string];
  k: string;
  K: string;
  awning: string;
}

export const BUSINESS_GLYPHS: Readonly<Record<string, Glyph>> = {
  lanchonete_bairro: { awning: '#d8482e', k: '#c98a3a', K: '#5c3a1e', rows: ['..kkkk..', '.kkkkkk.', 'KKKKKKKK', '.kkkkkk.', 'KKKKKKKK', '.kkkkkk.', '........'] }, // hambúrguer
  acaiteria: { awning: '#6b2f8a', k: '#5a2272', K: '#e9e2f0', rows: ['.KKKKKK.', '.kkkkkk.', 'kkkkkkkk', '.kkkkkk.', '..kkkk..', '...kk...', '..KKKK..'] }, // tigela
  pizzaria: { awning: '#2f8a3f', k: '#e8b64a', K: '#c33a2a', rows: ['kkkkkkkk', '.kKkkKk.', '.kkkkkk.', '..kKkk..', '..kkkk..', '...kk...', '...kk...'] }, // fatia
  padaria: { awning: '#b0742c', k: '#d39a4e', K: '#8a5a24', rows: ['........', '..kkkk..', '.kKkKkk.', 'kkkkkkkk', 'kKkKkKkk', '.kkkkkk.', '........'] }, // pão
  barbearia: { awning: '#c23a3a', k: '#3a6fb4', K: '#c23a3a', rows: ['..kkkk..', '..kKKk..', '..KkkK..', '..kKKk..', '..KkkK..', '..kKKk..', '..kkkk..'] }, // poste listrado
  salao_beleza: { awning: '#e070a8', k: '#8a8f9a', K: '#e070a8', rows: ['.K....K.', 'KkK..KkK', '.KkkkK..', '...kk...', '..k..k..', '.k....k.', 'k......k'] }, // tesoura
  lava_jato: { awning: '#2f7fd0', k: '#2f7fd0', K: '#ffffff', rows: ['...k....', '..kkk...', '.kkKkk..', '.kKkkk..', 'kkkkkkk.', '.kkkkk.K', '..kkk..K'] }, // gota
  mercadinho: { awning: '#2f8a3f', k: '#4a4f5a', K: '#e8b64a', rows: ['K.......', '.kkkkkkk', '.kKKKKKk', '.kKKKKk.', '.kkkkkk.', '..k..k..', '........'] }, // carrinho
  farmacia: { awning: '#2fa86a', k: '#2fa86a', K: '#ffffff', rows: ['..kkkk..', '..kKKk..', 'kkkKKkkk', 'kKKKKKKk', 'kkkKKkkk', '..kKKk..', '..kkkk..'] }, // cruz
  loja_roupas: { awning: '#d05a8a', k: '#4a4f5a', K: '#d05a8a', rows: ['...kk...', '....k...', '...kk...', '..kKKk..', '.kKKKKk.', 'kKKKKKKk', 'kkkkkkkk'] }, // cabide
  roupa: { awning: '#1f2a44', k: '#c23a3a', K: '#1f2a44', rows: ['kk....kk', 'kkk..kkk', '.kkkkkk.', '.kkKKkk.', '.kkkkkk.', '.kkkkkk.', '........'] }, // camiseta da marca
  suplementos: { awning: '#d0a02a', k: '#3a3f4a', K: '#d0a02a', rows: ['..kkkk..', '..KKKK..', '.kkkkkk.', '.kKKKKk.', '.kKkkKk.', '.kKKKKk.', '.kkkkkk.'] }, // pote
  oficina: { awning: '#5a5f6a', k: '#8a8f9a', K: '#4a4f5a', rows: ['kk......', 'k.k.....', '.kkk....', '...kkk..', '....kkk.', '.....kKk', '......kk'] }, // chave
  academia_luta: { awning: '#a8282e', k: '#c23a3a', K: '#ffffff', rows: ['.kkkkk..', 'kkkkkkk.', 'kkkkkkKk', 'kkkkkkKk', '.kkkkkk.', '.KKKKK..', '.kkkkk..'] }, // luva
  academia: { awning: '#3a3f4a', k: '#3a3f4a', K: '#8a8f9a', rows: ['........', 'kk....kk', 'kk....kk', 'kKKKKKKk', 'kk....kk', 'kk....kk', '........'] }, // halter
  pet_shop: { awning: '#d07a2a', k: '#6b4a34', K: '#6b4a34', rows: ['.k....k.', 'kk.kk.kk', '...kk...', '........', '..kkkk..', '.kkkkkk.', '.kkkkkk.'] }, // pata
  sorveteria: { awning: '#f0a0c0', k: '#d07a9a', K: '#d0a050', rows: ['..kkkk..', '.kkkkkk.', '.kkkkkk.', '.KKKKKK.', '..KKKK..', '...KK...', '...KK...'] }, // casquinha
  food_truck: { awning: '#e0b030', k: '#e0b030', K: '#3a3f4a', rows: ['........', 'kkkkkk..', 'kKKkkkk.', 'kKKkkkkk', 'kkkkkkkk', '.KK..KK.', '........'] }, // caminhão
  grafica: { awning: '#2fa0c0', k: '#4a4f5a', K: '#ffffff', rows: ['..KKKK..', '..KKKK..', 'kkkkkkkk', 'kkkkkkkk', 'kKKKKKKk', 'kkKKKKkk', '..KKKK..'] }, // impressora
  loja_celulares: { awning: '#3a3f4a', k: '#2a2f3a', K: '#8fc3df', rows: ['..kkkk..', '..kKKk..', '..kKKk..', '..kKKk..', '..kKKk..', '..kkkk..', '...kk...'] }, // celular
  pousada: { awning: '#2f7f6a', k: '#6b4a34', K: '#e8d8b8', rows: ['........', 'k.......', 'kKK.....', 'kKKKKKKk', 'kkkkkkkk', 'k......k', '........'] }, // cama
  bar: { awning: '#7a3a1e', k: '#e0a030', K: '#ffffff', rows: ['.KKKKK..', '.kkkkkkk', '.kkkkk.k', '.kkkkk.k', '.kkkkkkk', '.kkkkk..', '.kkkkk..'] }, // caneca
  estudio_tatuagem: { awning: '#2a2f3a', k: '#4a4f5a', K: '#c23a3a', rows: ['.......K', '......k.', '.....k..', '....kk..', '...kk...', '..kk....', '.k......'] }, // agulha
  restaurante: { awning: '#a8282e', k: '#8a8f9a', K: '#e8e2d4', rows: ['k.k...k.', 'k.k..kk.', 'kkk.kKKk', '.k..kKKk', '.k...kk.', '.k....k.', '.k....k.'] }, // garfo e prato
};

/** Monta o ícone 16×16: placa com o símbolo (linhas 0–8), toldo listrado (9–10), fachada com vitrine e porta (11–15). */
export function businessIcon(g: Glyph): IconSprite {
  const rows: string[] = [];
  rows.push('.oooooooooooooo.');
  for (const r of g.rows) rows.push(`.oss${r.replace(/\./g, 's')}sso.`);
  rows.push('.oooooooooooooo.');
  rows.push('oaAaAaAaAaAaAaAo');
  rows.push('oAaAaAaAaAaAaAao');
  rows.push('.owwwwwwwwwwwwo.');
  rows.push('.owbbbbwwwddwwo.');
  rows.push('.owbbbbwwwddwwo.');
  rows.push('.owwwwwwwwddwwo.');
  rows.push('oooooooooooooooo');
  return {
    grid: rows.map((r) => r.padEnd(16, '.').slice(0, 16)),
    palette: { o: OUT, s: SIGN, k: g.k, K: g.K, a: g.awning, A: '#f3eee4', w: WALL, b: GLASS, d: DOOR },
  };
}

export const BUSINESS_ICONS: Readonly<Record<string, IconSprite>> = Object.fromEntries(Object.entries(BUSINESS_GLYPHS).map(([id, g]) => [id, businessIcon(g)]));
