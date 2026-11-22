import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { buyOutfit, buyOutfitBlock, selectOutfit, unlockOutfit, wardrobeOptions, setFacialHair } from '../src/engine';
import { adult, ledgerOk } from './ecoHelpers';

const C = GAME_CONTENT;

describe('roupas e guarda-roupa', () => {
  it('catálogo válido: ids únicos, cores hex, idades coerentes, luxo com preço, todos os contextos', () => {
    const ids = C.outfits.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of C.outfits) {
      expect(o.colors.length).toBeGreaterThan(0);
      for (const c of o.colors) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
      expect(o.minAge).toBeLessThanOrEqual(o.maxAge);
      if (o.context === 'luxo') expect(o.price).toBeGreaterThan(0);
      if (o.price) expect(Number.isInteger(o.price)).toBe(true);
      // roupas servem para qualquer sexo: o catálogo não tem campo de sexo
      expect(o).not.toHaveProperty('sex');
    }
    for (const ctx of ['bebe', 'dia', 'escola', 'luta', 'ocasiao', 'luxo']) expect(C.outfits.some((o) => o.context === ctx)).toBe(true);
  });

  it('compra de luxo pelo extrato desbloqueia e veste; bloqueios', () => {
    const s = adult(30, 50000);
    const lux = C.outfits.find((o) => o.context === 'luxo' && o.price! <= 50000)!;
    expect(selectOutfit(s, C, lux.id)).toBe(s); // bloqueada
    expect(buyOutfitBlock(adult(30, 10), C, lux.id)).toBe('no-money');
    const b = buyOutfit(s, C, lux.id);
    expect(b.money).toBe(50000 - lux.price!);
    expect(ledgerOk(b)).toBe(true);
    expect(b.wardrobe.unlocked).toContain(lux.id);
    expect(b.wardrobe.outfit.id).toBe(lux.id);
    expect(buyOutfitBlock(b, C, lux.id)).toBe('owned');
    expect(wardrobeOptions(b, C).map((o) => o.id)).toContain(lux.id);
  });

  it('seleção respeita idade e cor; barba só para 16+; desbloqueio por evento', () => {
    const s = adult(30, 0);
    expect(selectOutfit(s, C, 'camiseta', 99).wardrobe.outfit.color).toBe(C.outfits.find((o) => o.id === 'camiseta')!.colors.length - 1);
    expect(selectOutfit(s, C, 'body')).toBe(s);
    expect(setFacialHair(s, 'barba').wardrobe.facialHair).toBe('barba');
    expect(setFacialHair({ ...s, character: { ...s.character, age: 12 } }, 'barba').wardrobe.facialHair).toBe(s.wardrobe.facialHair);
    expect(unlockOutfit(s, 'cronos_terno').wardrobe.unlocked).toContain('cronos_terno');
  });
});
