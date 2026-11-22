import type { OutfitDef } from '../../engine';

/**
 * Roupas do busto (Etapa 7). Todas podem ser usadas por qualquer sexo; `colors` são as variações.
 * Contextos: bebe/escola/luta/ocasiao são automáticos; dia/luxo vêm do guarda-roupa do jogador.
 * Grifes de luxo são fictícias.
 */
const BASIC = ['#e5e7eb', '#1f2937', '#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed', '#ec4899'];
const EARTH = ['#78716c', '#365314', '#7c2d12', '#1e3a8a', '#4b5563'];

export const OUTFITS: readonly OutfitDef[] = [
  // bebê e criança
  { id: 'body', name: 'Body de bebê', minAge: 0, maxAge: 2, context: 'bebe', mesh: 'body', colors: ['#fde68a', '#bfdbfe', '#fbcfe8', '#bbf7d0', '#f5f5f4'], unlockedByDefault: true },
  { id: 'camiseta_infantil', name: 'Camiseta infantil', minAge: 2, maxAge: 11, context: 'dia', mesh: 'camiseta', colors: ['#facc15', '#38bdf8', '#f472b6', '#4ade80', '#fb923c'], unlockedByDefault: true },
  { id: 'uniforme', name: 'Uniforme escolar', minAge: 4, maxAge: 18, context: 'escola', mesh: 'uniforme', colors: ['#f8fafc'], unlockedByDefault: true },
  // dia a dia
  { id: 'camiseta', name: 'Camiseta', minAge: 3, maxAge: 120, context: 'dia', mesh: 'camiseta', colors: BASIC, unlockedByDefault: true },
  { id: 'regata', name: 'Regata', minAge: 6, maxAge: 120, context: 'dia', mesh: 'regata', colors: BASIC, unlockedByDefault: true },
  { id: 'moletom', name: 'Moletom', minAge: 6, maxAge: 120, context: 'dia', mesh: 'moletom', colors: [...EARTH, '#6b7280', '#0f172a'], unlockedByDefault: true },
  { id: 'polo', name: 'Camisa polo', minAge: 10, maxAge: 120, context: 'dia', mesh: 'polo', colors: ['#f8fafc', '#1e3a8a', '#065f46', '#b91c1c', '#facc15'], unlockedByDefault: true },
  { id: 'social', name: 'Camisa social', minAge: 12, maxAge: 120, context: 'dia', mesh: 'social', colors: ['#ffffff', '#bfdbfe', '#f5f5f4', '#fecaca', '#d9f99d'], unlockedByDefault: true },
  { id: 'jaqueta', name: 'Jaqueta', minAge: 10, maxAge: 120, context: 'dia', mesh: 'jaqueta', colors: ['#111827', '#7c2d12', '#1e40af', '#3f6212'], unlockedByDefault: true },
  { id: 'vestido', name: 'Vestido (parte de cima)', minAge: 3, maxAge: 120, context: 'dia', mesh: 'vestido', colors: ['#f472b6', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#111827'], unlockedByDefault: true },
  { id: 'blusa', name: 'Blusa', minAge: 8, maxAge: 120, context: 'dia', mesh: 'blusa', colors: ['#fda4af', '#fde68a', '#a5f3fc', '#ddd6fe', '#f5f5f4'], unlockedByDefault: true },
  // luta (kimono usa a cor da faixa do jogador)
  { id: 'kimono', name: 'Kimono', minAge: 4, maxAge: 120, context: 'luta', mesh: 'kimono', colors: ['#f8fafc', '#1e3a8a', '#111827'], unlockedByDefault: true },
  { id: 'rashguard', name: 'Rashguard', minAge: 12, maxAge: 120, context: 'luta', mesh: 'rashguard', colors: ['#111827', '#dc2626', '#2563eb', '#16a34a'], unlockedByDefault: true },
  { id: 'regata_treino', name: 'Regata de treino', minAge: 6, maxAge: 120, context: 'luta', mesh: 'regata', colors: ['#111827', '#f59e0b', '#ef4444', '#e5e7eb'], unlockedByDefault: true },
  { id: 'roupao', name: 'Roupão de entrada de luta', minAge: 16, maxAge: 120, context: 'luta', mesh: 'roupao', colors: ['#b91c1c', '#facc15', '#111827', '#1d4ed8'], unlockedByDefault: true },
  // ocasiões
  { id: 'terno', name: 'Terno', minAge: 12, maxAge: 120, context: 'ocasiao', mesh: 'terno', colors: ['#111827', '#1e3a8a', '#4b5563'], unlockedByDefault: true },
  { id: 'vestido_festa', name: 'Vestido de festa', minAge: 12, maxAge: 120, context: 'ocasiao', mesh: 'festa', colors: ['#f8fafc', '#be123c', '#1e3a8a', '#111827'], unlockedByDefault: true },
  { id: 'camisa_formatura', name: 'Camisa da formatura', minAge: 14, maxAge: 25, context: 'ocasiao', mesh: 'camiseta', colors: ['#0f766e', '#7c3aed', '#be123c'], unlockedByDefault: true },
  // luxo (grifes fictícias; desbloqueadas com dinheiro — gancho da Etapa 5)
  { id: 'arara_jaqueta', name: 'Jaqueta de couro Maison Arara', minAge: 16, maxAge: 120, context: 'luxo', mesh: 'jaqueta', colors: ['#3b0d0c', '#0b0b0b', '#5b3a29'], price: 18000, unlockedByDefault: false },
  { id: 'arara_social', name: 'Camisa de seda Maison Arara', minAge: 16, maxAge: 120, context: 'luxo', mesh: 'social', colors: ['#fef3c7', '#1e1b4b', '#7f1d1d'], price: 9000, unlockedByDefault: false },
  { id: 'cronos_terno', name: 'Terno sob medida Cronos Wear', minAge: 18, maxAge: 120, context: 'luxo', mesh: 'terno', colors: ['#0f172a', '#334155', '#78350f'], price: 35000, unlockedByDefault: false },
  { id: 'cronos_moletom', name: 'Moletom Cronos Wear Edição Ouro', minAge: 14, maxAge: 120, context: 'luxo', mesh: 'moletom', colors: ['#facc15', '#0b0b0b'], price: 6000, unlockedByDefault: false },
];
