import { describe, expect, it } from 'vitest';
import { GAME_CONTENT as C } from '../src/content';
import { ICON_FOR, MARKET_ICONS } from '../src/content/sprites/market';

describe('ícones de empreendimentos (release 0.0.1)', () => {
  it('pelo menos 22 tipos, cada um com ícone próprio, 16×16 e cores definidas', () => {
    const biz = C.economy.businesses;
    expect(biz.length).toBeGreaterThanOrEqual(22);
    const seen = new Set<string>();
    for (const b of biz) {
      const key = ICON_FOR[b.id];
      expect(key, b.id).toBe(b.id);
      const icon = MARKET_ICONS[key!]!;
      expect(icon.grid).toHaveLength(16);
      for (const row of icon.grid) {
        expect(row).toHaveLength(16);
        for (const ch of row) if (ch !== '.') expect(icon.palette[ch], `${b.id}:${ch}`).toBeDefined();
      }
      const sig = icon.grid.join('') + JSON.stringify(icon.palette);
      expect(seen.has(sig), `${b.id} repete outro ícone`).toBe(false);
      seen.add(sig);
    }
  });
  it('os tipos pedidos existem', () => {
    const ids = new Set(C.economy.businesses.map((b) => b.id));
    for (const id of ['lanchonete_bairro', 'acaiteria', 'pizzaria', 'padaria', 'barbearia', 'salao_beleza', 'lava_jato', 'mercadinho', 'farmacia', 'loja_roupas', 'suplementos', 'oficina', 'academia_luta', 'academia', 'pet_shop', 'sorveteria', 'food_truck', 'grafica', 'loja_celulares', 'pousada', 'bar', 'estudio_tatuagem']) expect(ids.has(id), id).toBe(true);
  });
});
