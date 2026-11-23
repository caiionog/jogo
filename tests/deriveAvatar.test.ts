import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { GameState } from '../src/engine';
import { avatarHash, deriveAvatar, deriveNpcAvatar, derivePersonAvatar, growthAt, playerOutfit, previewAvatar } from '../src/engine';
import { makeGame } from './helpers';

const C = GAME_CONTENT;
const at = (s: GameState, age: number, stats: Partial<GameState['character']['stats']> = {}): GameState => ({
  ...s,
  character: { ...s.character, age, stats: { ...s.character.stats, ...stats } },
  education: { ...s.education, current: null },
});

describe('deriveAvatar', () => {
  const base = makeGame('avatar');

  it('fases por idade com crescimento contínuo (sem saltos nas trocas de fase)', () => {
    expect(deriveAvatar(at(base, 1), C).stage).toBe('bebe');
    expect(deriveAvatar(at(base, 8), C).stage).toBe('crianca');
    expect(deriveAvatar(at(base, 15), C).stage).toBe('adolescente');
    expect(deriveAvatar(at(base, 30), C).stage).toBe('adulto');
    expect(deriveAvatar(at(base, 70), C).stage).toBe('idoso');
    for (let a = 1; a <= 90; a++) expect(Math.abs(growthAt(a) - growthAt(a - 1))).toBeLessThanOrEqual(0.2);
    for (const [a, b] of [[11, 12], [17, 18], [59, 60]] as const) {
      const x = deriveAvatar(at(base, a), C);
      const y = deriveAvatar(at(base, b), C);
      expect(Math.abs(x.growth - y.growth)).toBeLessThanOrEqual(0.06);
      expect(Math.abs(x.elder - y.elder)).toBeLessThanOrEqual(0.06);
      expect(Math.abs(x.wrinkles - y.wrinkles)).toBeLessThanOrEqual(0.06);
    }
  });

  it('corpo: condicionamento baixo e padrão luxo engordam; força alta dá musculatura', () => {
    const fit = deriveAvatar(at(base, 30, { athletic: 85 }), C);
    const lazy = deriveAvatar({ ...at(base, 30, { athletic: 10 }), economy: { ...base.economy, standard: 'luxo' } }, C);
    expect(lazy.fat).toBeGreaterThan(fit.fat);
    const weak = deriveAvatar(at(base, 30, { athletic: 15 }), C);
    const strong = deriveAvatar(at(base, 30, { athletic: 90 }), C);
    expect(strong.muscle).toBeGreaterThan(weak.muscle + 0.2);
  });

  it('grisalho, calvície e rugas crescem com a idade', () => {
    let prev = deriveAvatar(at(base, 20), C);
    for (const age of [35, 50, 65, 80]) {
      const d = deriveAvatar(at(base, age), C);
      expect(d.wrinkles).toBeGreaterThanOrEqual(prev.wrinkles);
      expect(d.hair.grey).toBeGreaterThanOrEqual(prev.hair.grey);
      expect(d.hair.baldness).toBeGreaterThanOrEqual(prev.hair.baldness);
      prev = d;
    }
    expect(prev.wrinkles).toBeGreaterThan(0.5);
    expect(prev.hair.grey).toBeGreaterThan(0.5);
  });

  it('kimono com a cor real da faixa na luta de grappling; uniforme na escola', () => {
    const s = at(base, 25);
    const fight = { ...s, fighter: { ...s.fighter, grades: { jiujitsu: { system: 'bjj_adulto', rank: 2, degree: 0, years: 0 } } }, activeFight: { offer: { rules: 'grappling' } } } as unknown as GameState;
    const o = playerOutfit(fight, C, 'luta');
    expect(o.inteira?.id).toBe('kimono');
    expect(o.acessorio?.id).toBe('faixa');
    expect(o.acessorio?.color).toBe(C.fighting.graduations.find((g) => g.id === 'bjj_adulto')!.levels[2]!.color);
    const kid = makeGame('escola-av');
    const enrolled = { ...kid, character: { ...kid.character, age: 9 }, education: { ...kid.education, current: { stage: 'fund1' } } } as unknown as GameState;
    expect(playerOutfit(enrolled, C).cima?.id).toBe('uniforme');
    expect(playerOutfit(at(base, 1), C).inteira?.id).toBe('body');
  });

  it('marcas: sequelas da Etapa 6 e olho roxo depois de uma derrota no ano', () => {
    const s = at(base, 28);
    const marked = { ...s, health: { ...s.health, sequelae: ['cicatriz', 'nariz_torto', 'orelha_couve_flor'] } };
    expect(deriveAvatar(marked, C).marks).toMatchObject({ scar: true, brokenNose: true, cauliflowerEar: true });
    expect(deriveAvatar(s, C).marks.blackEye).toBe(false);
    const loss = { age: 28, year: s.year, orgId: 'arc', opponent: 'X', result: 'L' as const, method: 'DEC' as const, round: 3, title: false, pro: true };
    const d = deriveAvatar({ ...s, fighter: { ...s.fighter, history: [loss] } }, C);
    expect(d.marks.blackEye).toBe(true);
    expect(d.expression).toBe('machucado');
  });

  it('barba só a partir dos 16; NPCs e pessoas usam o mesmo descriptor', () => {
    const s = { ...at(base, 12), wardrobe: { ...base.wardrobe, facialHair: 'barba' as const } };
    expect(deriveAvatar(s, C).facialHair).toBe('nenhuma');
    const p = base.relationships.people[0]!;
    const pd = derivePersonAvatar(p, C)!;
    expect(pd.age).toBe(p.age);
    const npc = { id: 'n1', name: 'X', nickname: 'Y', age: 27, athletic: 70, style: 'grappler' } as never;
    expect(deriveNpcAvatar('s', npc, 'M', C)).toEqual(deriveNpcAvatar('s', npc, 'M', C));
    expect(previewAvatar(base.character.appearance, 'M', 80, C).stage).toBe('idoso');
  });

  it('hash estável: mesmo descriptor → mesmo hash; mudança → outro', () => {
    const a = deriveAvatar(at(base, 30), C);
    expect(avatarHash(a)).toBe(avatarHash(structuredClone(a)));
    expect(avatarHash(a)).not.toBe(avatarHash({ ...a, fat: a.fat + 0.1 }));
  });
});
