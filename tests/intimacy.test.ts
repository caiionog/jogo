import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { applySocialEffects, createRng, interact, intimacyVariant } from '../src/engine';
import type { GameState } from '../src/engine';
import { aged, withPerson } from './relHelpers';

const C = GAME_CONTENT;
const intimo = (s: GameState) => (s.scene?.kind === 'intimo' ? s.scene : null);

describe('cena íntima (release 0.0.3)', () => {
  it('aparece após interação sexual entre adultos com a opção ligada; seq incrementa', () => {
    const [g, p] = withPerson({ ...aged(25, 'int', { adultContent: true }), pendingEvents: [] }, 'conjuge', 26, { stage: 'casados', affection: 80 });
    const r = interact(g, p.id, 'intimacy_protected', C);
    expect(intimo(r)).toMatchObject({ kind: 'intimo', year: g.year, seq: 1, variant: intimacyVariant(r) });
    const r2 = interact(r, p.id, 'intimacy', C);
    expect(intimo(r2)?.seq).toBe(2);
  });

  it('passar a noite com amizade adulta também grava a cena', () => {
    const [g, p] = withPerson({ ...aged(25, 'int2', { adultContent: true }), pendingEvents: [] }, 'amigo', 27);
    expect(intimo(interact(g, p.id, 'night_together', C))?.seq).toBe(1);
  });

  it('nunca com a opção desligada', () => {
    const [g, p] = withPerson({ ...aged(25, 'int3', { adultContent: false }), pendingEvents: [] }, 'conjuge', 26, { stage: 'casados', affection: 80 });
    for (const k of ['intimacy', 'intimacy_protected', 'try_baby'] as const) expect(intimo(interact(g, p.id, k, C))).toBeNull();
    const [g2, f] = withPerson(g, 'amigo', 27);
    expect(intimo(interact(g2, f.id, 'night_together', C))).toBeNull();
    expect(intimo(applySocialEffects(g, { intimacy: true }, createRng(1), C, { pessoa_id: p.id }))).toBeNull();
  });

  it('nunca com personagem ou alvo menor de 18', () => {
    const [teen, tp] = withPerson({ ...aged(17, 'int4', { adultContent: true }), pendingEvents: [] }, 'parceiro', 17, { stage: 'namorando' });
    for (const k of ['intimacy', 'intimacy_protected', 'night_together'] as const) expect(intimo(interact(teen, tp.id, k, C))).toBeNull();
    expect(intimo(applySocialEffects(teen, { intimacy: true }, createRng(1), C, { pessoa_id: tp.id }))).toBeNull();
    const [adult, minor] = withPerson({ ...aged(19, 'int5', { adultContent: true }), pendingEvents: [] }, 'amigo', 17);
    expect(intimo(interact(adult, minor.id, 'night_together', C))).toBeNull();
    expect(intimo(applySocialEffects(adult, { intimacy: true }, createRng(1), C, { pessoa_id: minor.id }))).toBeNull();
  });

  it('o efeito social.intimacy grava com alvo adulto e a opção ligada (e exige alvo)', () => {
    const [g, p] = withPerson({ ...aged(30, 'int6', { adultContent: true }), pendingEvents: [] }, 'parceiro', 31, { stage: 'namorando' });
    const r = applySocialEffects(g, { intimacy: true }, createRng(1), C, { pessoa_id: p.id });
    expect(intimo(r)?.seq).toBe(1);
    expect(intimo(applySocialEffects(r, { intimacy: true }, createRng(1), C, { pessoa_id: p.id }))?.seq).toBe(2);
    expect(intimo(applySocialEffects(g, { intimacy: true }, createRng(1), C))).toBeNull();
  });

  it('variante determinística pelo contexto', () => {
    const g = aged(30, 'int7', { adultContent: true });
    expect(intimacyVariant({ ...g, economy: { ...g.economy, housing: 'pais', standard: 'simples' } })).toBe('simples');
    expect(intimacyVariant({ ...g, economy: { ...g.economy, housing: 'aluguel', standard: 'luxo' } })).toBe('hotel');
    const [m] = withPerson(g, 'conjuge', 30, { stage: 'casados' });
    expect(intimacyVariant({ ...m, economy: { ...m.economy, housing: 'propria', standard: 'simples' } })).toBe('casal');
  });
});
