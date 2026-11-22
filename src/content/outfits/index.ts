import type { OutfitDef } from '../../engine';

/**
 * Roupas por camada (Etapa 8). Todas servem para qualquer sexo; `colors` são as variações; `pattern` o padrão.
 * Contextos automáticos: bebe, escola, luta, ocasiao; dia/luxo vêm do guarda-roupa. Grifes fictícias.
 * Como cada peça cobre o corpo (pixel art): `src/content/sprites/clothes.ts`.
 */
const BASIC = ['#e5e2da', '#2b2f3a', '#3f6fb5', '#c2413a', '#3f8f4f', '#e3a72f', '#7a52b3', '#d4609a'];
const DENIM = ['#34476b', '#4d6a99', '#26262e', '#6b5a48'];
const EARTH = ['#7a6f62', '#3f5232', '#7a3a22', '#25395f', '#4b5563'];
const SHOES = ['#3a3a46', '#e9e4da', '#b8432f', '#2f5fb3'];
const all = { minAge: 3, maxAge: 120 };

export const OUTFITS: readonly OutfitDef[] = [
  // ---- bebê ----
  { id: 'body', name: 'Body de bebê', layer: 'inteira', minAge: 0, maxAge: 2, context: 'bebe', colors: ['#f6e3a1', '#bfd8f2', '#f4c6d8', '#c9ecc9', '#f2efe8'], unlockedByDefault: true },
  { id: 'meia', name: 'Meinha', layer: 'calcado', minAge: 0, maxAge: 2, context: 'bebe', colors: ['#f2efe8', '#bfd8f2', '#f4c6d8'], unlockedByDefault: true },
  // ---- parte de cima (dia a dia) ----
  { id: 'camiseta', name: 'Camiseta', layer: 'cima', ...all, context: 'dia', colors: BASIC, unlockedByDefault: true },
  { id: 'camiseta_listrada', name: 'Camiseta listrada', layer: 'cima', ...all, context: 'dia', colors: BASIC, pattern: 'listrado', unlockedByDefault: true },
  { id: 'camiseta_estampa', name: 'Camiseta estampada', layer: 'cima', ...all, context: 'dia', colors: BASIC, pattern: 'estampa', unlockedByDefault: true },
  { id: 'regata', name: 'Regata', layer: 'cima', minAge: 6, maxAge: 120, context: 'dia', colors: BASIC, unlockedByDefault: true },
  { id: 'polo', name: 'Camisa polo', layer: 'cima', minAge: 10, maxAge: 120, context: 'dia', colors: ['#f2efe8', '#25395f', '#2f6b4f', '#9e2f27', '#e3a72f'], unlockedByDefault: true },
  { id: 'social', name: 'Camisa social', layer: 'cima', minAge: 12, maxAge: 120, context: 'dia', colors: ['#f7f5f0', '#bcd4ee', '#efe7da', '#f1c9c9'], unlockedByDefault: true },
  { id: 'xadrez', name: 'Camisa xadrez', layer: 'cima', minAge: 8, maxAge: 120, context: 'dia', colors: ['#b8432f', '#2f5fb3', '#3f8f4f'], pattern: 'xadrez', unlockedByDefault: true },
  { id: 'blusa', name: 'Blusa', layer: 'cima', minAge: 8, maxAge: 120, context: 'dia', colors: ['#f2a3b3', '#f6dc8a', '#a8e1ec', '#d6ccf2', '#f2efe8'], unlockedByDefault: true },
  { id: 'moletom', name: 'Moletom com capuz', layer: 'cima', minAge: 6, maxAge: 120, context: 'dia', colors: [...EARTH, '#6b7280', '#14161f'], unlockedByDefault: true },
  { id: 'cropped', name: 'Cropped', layer: 'cima', minAge: 14, maxAge: 120, context: 'dia', colors: BASIC, unlockedByDefault: true },
  // ---- inteiras ----
  { id: 'vestido', name: 'Vestido', layer: 'inteira', ...all, context: 'dia', colors: ['#d4609a', '#4f86c6', '#e3a72f', '#3f9f7a', '#8d6bc9', '#2b2f3a'], unlockedByDefault: true },
  { id: 'macacao', name: 'Macacão jeans', layer: 'inteira', ...all, context: 'dia', colors: DENIM, unlockedByDefault: true },
  // ---- parte de baixo ----
  { id: 'calca_jeans', name: 'Calça jeans', layer: 'baixo', ...all, context: 'dia', colors: DENIM, unlockedByDefault: true },
  { id: 'calca_moletom', name: 'Calça de moletom', layer: 'baixo', ...all, context: 'dia', colors: ['#5b6170', '#14161f', '#7a6f62'], unlockedByDefault: true },
  { id: 'bermuda', name: 'Bermuda', layer: 'baixo', ...all, context: 'dia', colors: [...DENIM, '#a8946a'], unlockedByDefault: true },
  { id: 'shorts', name: 'Shorts', layer: 'baixo', ...all, context: 'dia', colors: ['#2b2f3a', '#3f6fb5', '#c2413a', '#e5e2da'], unlockedByDefault: true },
  { id: 'saia', name: 'Saia', layer: 'baixo', minAge: 4, maxAge: 120, context: 'dia', colors: ['#2b2f3a', '#d4609a', '#4f86c6', '#a8946a'], unlockedByDefault: true },
  { id: 'calca_social', name: 'Calça social', layer: 'baixo', minAge: 12, maxAge: 120, context: 'dia', colors: ['#1d2230', '#4b5563', '#6b5a48'], unlockedByDefault: true },
  // ---- calçados ----
  { id: 'tenis', name: 'Tênis', layer: 'calcado', ...all, context: 'dia', colors: SHOES, unlockedByDefault: true },
  { id: 'chinelo', name: 'Chinelo', layer: 'calcado', ...all, context: 'dia', colors: ['#2f5fb3', '#e3a72f', '#3f8f4f'], unlockedByDefault: true },
  { id: 'sapato', name: 'Sapato social', layer: 'calcado', minAge: 10, maxAge: 120, context: 'dia', colors: ['#2a1d16', '#14161f'], unlockedByDefault: true },
  { id: 'bota', name: 'Bota', layer: 'calcado', minAge: 10, maxAge: 120, context: 'dia', colors: ['#5a3a22', '#14161f'], unlockedByDefault: true },
  // ---- agasalhos ----
  { id: 'jaqueta', name: 'Jaqueta', layer: 'agasalho', minAge: 8, maxAge: 120, context: 'dia', colors: ['#14161f', '#7a3a22', '#25395f', '#3f5232'], unlockedByDefault: true },
  { id: 'casaco', name: 'Casaco', layer: 'agasalho', minAge: 8, maxAge: 120, context: 'dia', colors: ['#7a6f62', '#25395f', '#5a3a22'], unlockedByDefault: true },
  // ---- acessórios ----
  { id: 'bone', name: 'Boné', layer: 'acessorio', minAge: 6, maxAge: 120, context: 'dia', colors: ['#c2413a', '#2b2f3a', '#3f6fb5', '#e5e2da'], unlockedByDefault: true },
  { id: 'oculos', name: 'Óculos', layer: 'acessorio', minAge: 8, maxAge: 120, context: 'dia', colors: ['#14161f', '#7a3a22'], unlockedByDefault: true },
  // ---- escola ----
  { id: 'uniforme', name: 'Uniforme escolar', layer: 'cima', minAge: 4, maxAge: 18, context: 'escola', colors: ['#f7f5f0'], unlockedByDefault: true },
  // ---- luta (o kimono usa a cor real da faixa) ----
  { id: 'kimono', name: 'Kimono', layer: 'inteira', minAge: 4, maxAge: 120, context: 'luta', colors: ['#f7f5f0', '#25395f', '#14161f'], unlockedByDefault: true },
  { id: 'faixa', name: 'Faixa de jiu-jitsu', layer: 'acessorio', minAge: 4, maxAge: 120, context: 'luta', colors: ['#f1f1ee', '#2f5fb3', '#6b3fa0', '#6b4226', '#1b1b1b'], unlockedByDefault: true },
  { id: 'rashguard', name: 'Rashguard', layer: 'cima', minAge: 12, maxAge: 120, context: 'luta', colors: ['#14161f', '#c2413a', '#2f5fb3', '#3f8f4f'], unlockedByDefault: true },
  { id: 'regata_treino', name: 'Regata de treino', layer: 'cima', minAge: 6, maxAge: 120, context: 'luta', colors: ['#14161f', '#e3a72f', '#c2413a', '#e5e2da'], unlockedByDefault: true },
  { id: 'shorts_luta', name: 'Shorts de luta', layer: 'baixo', minAge: 6, maxAge: 120, context: 'luta', colors: ['#14161f', '#c2413a', '#2f5fb3', '#e3a72f'], unlockedByDefault: true },
  { id: 'descalco', name: 'Descalço', layer: 'calcado', minAge: 0, maxAge: 120, context: 'luta', colors: ['#000000'], unlockedByDefault: true },
  { id: 'roupao', name: 'Roupão de entrada de luta', layer: 'agasalho', minAge: 16, maxAge: 120, context: 'luta', colors: ['#9e2f27', '#e3a72f', '#14161f', '#2f5fb3'], unlockedByDefault: true },
  // ---- ocasiões ----
  { id: 'terno', name: 'Paletó', layer: 'agasalho', minAge: 12, maxAge: 120, context: 'ocasiao', colors: ['#14161f', '#25395f', '#4b5563'], unlockedByDefault: true },
  { id: 'vestido_festa', name: 'Vestido de festa', layer: 'inteira', minAge: 12, maxAge: 120, context: 'ocasiao', colors: ['#f7f5f0', '#a8213c', '#25395f', '#14161f'], unlockedByDefault: true },
  { id: 'camisa_formatura', name: 'Camisa da formatura', layer: 'cima', minAge: 14, maxAge: 25, context: 'ocasiao', colors: ['#1f7a6d', '#6d3fc0', '#a8213c'], unlockedByDefault: true },
  // ---- luxo (grifes fictícias; desbloqueadas com dinheiro — gancho da Etapa 5) ----
  { id: 'arara_jaqueta', name: 'Jaqueta de couro Maison Arara', layer: 'agasalho', minAge: 16, maxAge: 120, context: 'luxo', colors: ['#3b0d0c', '#0b0b0b', '#5b3a29'], price: 18000, unlockedByDefault: false },
  { id: 'arara_social', name: 'Camisa de seda Maison Arara', layer: 'cima', minAge: 16, maxAge: 120, context: 'luxo', colors: ['#f4e3b1', '#1e1b4b', '#7f1d1d'], price: 9000, unlockedByDefault: false },
  { id: 'cronos_terno', name: 'Paletó sob medida Cronos Wear', layer: 'agasalho', minAge: 18, maxAge: 120, context: 'luxo', colors: ['#0f172a', '#334155', '#78350f'], price: 35000, unlockedByDefault: false },
  { id: 'cronos_moletom', name: 'Moletom Cronos Wear Edição Ouro', layer: 'cima', minAge: 14, maxAge: 120, context: 'luxo', colors: ['#e3b52f', '#0b0b0b'], price: 6000, unlockedByDefault: false },
];
