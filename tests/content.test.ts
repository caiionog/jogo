import { describe, expect, it } from 'vitest';
import { GAME_CONTENT, SCHOOL_EVENTS } from '../src/content';
import { validateContent } from '../src/engine';
import type { Effects } from '../src/engine';

describe('conteúdo', () => {
  it('passa no validador de schema (ids únicos, followUps e clubes existentes, riscos válidos)', () => {
    expect(validateContent(GAME_CONTENT)).toEqual([]);
  });

  it('o validador detecta erros', () => {
    const bad = {
      ...GAME_CONTENT,
      events: [
        ...GAME_CONTENT.events,
        { ...GAME_CONTENT.events[0]!, choices: [{ id: 'x', label: 'x', resultText: 'x', effects: { followUps: [{ eventId: 'nao_existe', delayYears: 1 }], school: { joinClub: 'boxe' } } }] },
      ],
    };
    const errors = validateContent(bad);
    expect(errors.some((e) => e.includes('duplicado'))).toBe(true);
    expect(errors.some((e) => e.includes('nao_existe'))).toBe(true);
    expect(errors.some((e) => e.includes('boxe'))).toBe(true);
  });

  it('tem pelo menos 10 eventos de infância e 25 eventos escolares', () => {
    expect(GAME_CONTENT.events.length - SCHOOL_EVENTS.length).toBeGreaterThanOrEqual(10);
    expect(SCHOOL_EVENTS.length).toBeGreaterThanOrEqual(25);
  });

  it('eventos escolares têm 2 a 3 escolhas', () => {
    for (const e of SCHOOL_EVENTS) {
      expect(e.choices.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.choices.length, e.id).toBeLessThanOrEqual(3);
    }
  });

  it('todo followUp aponta para um evento existente', () => {
    const ids = new Set(GAME_CONTENT.events.map((e) => e.id));
    const all: Effects[] = GAME_CONTENT.events.flatMap((e) => e.choices.flatMap((c) => [c.effects, c.risk?.effects]))
      .concat(GAME_CONTENT.actions.flatMap((a) => [a.effects, a.risk?.effects]))
      .filter((x): x is Effects => !!x);
    const targets = all.flatMap((fx) => fx.followUps ?? []).map((f) => f.eventId);
    expect(targets.length).toBeGreaterThan(5);
    for (const t of targets) expect(ids.has(t), t).toBe(true);
  });

  it('eventos followUp são alvo de algum agendamento', () => {
    const targets = new Set(JSON.stringify(GAME_CONTENT).match(/"eventId":"[^"]+"/g)!.map((m) => m.slice(11, -1)));
    if (GAME_CONTENT.fighting.hooks.weightMissEventId) targets.add(GAME_CONTENT.fighting.hooks.weightMissEventId);
    for (const h of Object.values(GAME_CONTENT.relationships.hooks)) if (h) targets.add(h);
    for (const h of Object.values(GAME_CONTENT.economy.hooks)) if (h) targets.add(h);
    for (const e of GAME_CONTENT.events.filter((x) => x.trigger === 'followUp')) expect(targets.has(e.id), e.id).toBe(true);
  });

  it('cobre todas as fases escolares e os temas pedidos', () => {
    const stages = new Set(SCHOOL_EVENTS.flatMap((e) => e.conditions.schoolStages ?? []));
    expect([...stages].sort()).toEqual(['fund1', 'fund2', 'medio', 'pre']);
    const ids = SCHOOL_EVENTS.map((e) => e.id).join(' ');
    for (const t of ['bullying', 'cheating', 'strict_teacher', 'group_work', 'science_fair', 'olympiad', 'crush', 'party', 'popular', 'judo_invite', 'wrestling_invite', 'interschool', 'suspension', 'parents_called', 'expelled', 'family_moves', 'graduation', 'prom']) {
      expect(ids, t).toContain(t);
    }
  });

  it('clubes de luta dão a flag interesse_luta', () => {
    for (const c of GAME_CONTENT.clubs.filter((x) => x.combat)) expect(c.joinEffects.setFlags?.interesse_luta).toBe(true);
    expect(GAME_CONTENT.clubs.map((c) => c.id).sort()).toEqual(['chess', 'judo', 'soccer', 'theater', 'wrestling']);
  });

  it('ações têm custo de energia positivo e textos de log', () => {
    for (const a of GAME_CONTENT.actions) {
      expect(a.energyCost).toBeGreaterThan(0);
      expect(a.logTexts.length).toBeGreaterThan(0);
    }
  });

  it('não usa organizações reais de MMA', () => {
    expect(JSON.stringify(GAME_CONTENT)).not.toMatch(/\b(UFC|Bellator|PFL|ONE Championship|IBJJF|Gracie Barra|Pride FC)\b/i);
  });
});
