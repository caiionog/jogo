import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { COACH_NOISE, STAT_KEYS, SKILL_KEYS, advanceYear, chinValue, coachAssessment, coachWord, playerRating } from '../src/engine';
import { CURRENT_VERSION, migrate } from '../src/save/migrations';
import fixturesV7 from './fixtures/saves-v7.json';
import fixturesV1 from './fixtures/saves-v1.json';
import { fighterGame } from './fightHelpers';
import { makeGame, resolveAllFirst } from './helpers';

type Raw = Record<string, unknown> & { version: number };
const REMOVED = /\b(strength|fitness|wrestling|cardio|defense|striking|grappling)\b/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe('atributos da Etapa 8', () => {
  it('o estado só tem os 5 atributos visíveis e as 2 habilidades ocultas', () => {
    const g = makeGame('attr');
    expect(Object.keys(g.character.stats).sort()).toEqual([...STAT_KEYS].sort());
    expect([...STAT_KEYS].sort()).toEqual(['athletic', 'happiness', 'health', 'intelligence', 'looks']);
    expect(Object.keys(g.fighter.skills).sort()).toEqual(['jiujitsu', 'trocacao']);
    expect([...SKILL_KEYS]).toEqual(['jiujitsu', 'trocacao']);
    expect(g.fighter).toHaveProperty('chinBase');
    // nada dos atributos antigos em lugar nenhum do estado
    expect(JSON.stringify(g)).not.toMatch(/"(strength|fitness|wrestling|cardio|defense|striking|grappling|chin)":/);
  });

  it('conteúdo (eventos, conquistas, empregos, clubes, academias, lesões, doenças) não cita atributos removidos', () => {
    const { events, achievements, clubs, health, economy, fighting } = GAME_CONTENT;
    const scan = JSON.stringify({ events, achievements, clubs, health, jobs: economy.jobs, gyms: fighting.gyms });
    // o clube escolar "wrestling" é um nome de clube, não atributo; regras de luta "grappling" idem
    const cleaned = scan.replace(/"(club|joinClub|id)":"wrestling"/g, '').replace(/"wrestling"\]/g, ']').replace(/"rules":"grappling"/g, '');
    const hits = cleaned.match(new RegExp(`"(${REMOVED.source.slice(3, -3)})"\\s*:`, 'g'));
    expect(hits).toBeNull();
  });

  it('código de mecânica não lê atributos removidos', () => {
    const engine = resolve(__dirname, '../src/engine');
    const bad: string[] = [];
    for (const f of files(engine).filter((x) => x.endsWith('.ts'))) {
      const src = readFileSync(f, 'utf8').replace(/rules === 'grappling'|'grappling' \| 'mma'|FightRules = 'mma' \| 'grappling'|rules: 'grappling'|grappling: boolean|grappling \?|grappling\)|, grappling|\(grappling/g, '');
      for (const m of src.matchAll(/\.(strength|fitness|wrestling|cardio|defense|striking)\b|\bskills\.(chin|grappling)\b/g)) bad.push(`${relative(engine, f)}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });

  it('o queixo oculto cai com a idade e com o dano cerebral, com piso pela saúde', () => {
    expect(chinValue(70, 28, 0, 90)).toBe(70);
    expect(chinValue(70, 40, 0, 90)).toBeLessThan(70);
    expect(chinValue(70, 45, 0, 90)).toBeLessThan(chinValue(70, 40, 0, 90));
    expect(chinValue(70, 28, 40, 90)).toBeLessThan(chinValue(70, 28, 0, 90));
    expect(chinValue(10, 80, 100, 50)).toBeGreaterThanOrEqual(10);
  });

  it('avaliação do treinador: palavra certa por faixa e imprecisão dentro do limite', () => {
    expect(coachWord(10)).toBe('Iniciante');
    expect(coachWord(40)).toBe('Promissor');
    expect(coachWord(60)).toBe('Sólido');
    expect(coachWord(85)).toBe('Elite');
    const ORDER = ['Iniciante', 'Promissor', 'Sólido', 'Elite'];
    for (let y = 0; y < 60; y++) {
      const g = { ...fighterGame(26, { jiujitsu: 55, trocacao: 55, athletic: 60, chin: 60 }), year: 2000 + y };
      const r = playerRating(g);
      const w = coachAssessment(g);
      const lo = ORDER.indexOf(coachWord(r - COACH_NOISE));
      const hi = ORDER.indexOf(coachWord(r + COACH_NOISE));
      expect(ORDER.indexOf(w)).toBeGreaterThanOrEqual(lo);
      expect(ORDER.indexOf(w)).toBeLessThanOrEqual(hi);
    }
    expect(coachAssessment(fighterGame(25, { jiujitsu: 95 }), 'jiujitsu')).toBe('Elite');
    expect(coachAssessment(fighterGame(25, { jiujitsu: 5 }), 'jiujitsu')).toBe('Iniciante');
  });

  it('o corpo muda com treino e sedentarismo (Capacidade atlética e carga de treino)', () => {
    let s = fighterGame(30, { athletic: 60 });
    s = { ...s, fighter: { ...s.fighter, trainingLoad: 0, sessionsThisYear: 0 } };
    const sedentary = resolveAllFirst(advanceYear(s, GAME_CONTENT));
    expect(sedentary.character.stats.athletic).toBeLessThanOrEqual(60);
    const trained = resolveAllFirst(advanceYear({ ...s, fighter: { ...s.fighter, sessionsThisYear: 6 } }, GAME_CONTENT));
    expect(trained.fighter.trainingLoad).toBeGreaterThan(sedentary.fighter.trainingLoad);
  });
});

describe('migração v7 → v8', () => {
  const v7 = fixturesV7 as unknown as Record<string, Raw & { character: { stats: Record<string, number> }; fighter: { skills: Record<string, number> } }>;
  it.each(Object.keys(v7))('save %s: Capacidade atlética, jiu-jitsu, trocação, queixo inato e NPCs convertidos', (key) => {
    const raw = v7[key]!;
    const old = raw.character.stats;
    const sk = raw.fighter.skills;
    const g = migrate(structuredClone(raw));
    expect(g.version).toBe(CURRENT_VERSION);
    expect(g.character.stats.athletic).toBeCloseTo(old.strength! * 0.4 + old.fitness! * 0.35 + sk.cardio! * 0.25, 0);
    expect(g.fighter.skills.jiujitsu).toBeCloseTo(sk.grappling! * 0.55 + sk.wrestling! * 0.45, 0);
    expect(g.fighter.skills.trocacao).toBeCloseTo(sk.striking! * 0.7 + sk.defense! * 0.3, 0);
    expect(g.fighter.chinBase).toBe(sk.chin);
    const json = JSON.stringify(g);
    expect(json).not.toMatch(/"(strength|fitness|wrestling|cardio|defense|striking|grappling|chin)":/);
    for (const r of Object.values(g.world.rosters)) for (const n of r.npcs) {
      expect(n.athletic).toBeGreaterThan(0);
      expect(Object.keys(n.skills).sort()).toEqual(['jiujitsu', 'trocacao']);
      expect(['striker', 'grappler', 'allround']).toContain(n.style);
    }
    if (g.alive) expect(resolveAllFirst(advanceYear(g, GAME_CONTENT)).character.age).toBe(g.character.age + 1);
  });

  it('é determinística e a cadeia v1 → v8 funciona', () => {
    expect(migrate(structuredClone(v7['40']!))).toEqual(migrate(structuredClone(v7['40']!)));
    for (const raw of Object.values(fixturesV1 as unknown as Record<string, Raw>)) {
      const g = migrate(structuredClone(raw));
      expect(g.version).toBe(CURRENT_VERSION);
      expect(Number.isFinite(g.character.stats.athletic)).toBe(true);
      expect(Number.isFinite(g.character.weightKg)).toBe(true);
    }
  });
});
