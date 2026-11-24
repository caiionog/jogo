/** Futebol (release 0.0.4, fase 6): nomes proibidos, regras de clubes fictícios e o motor da carreira. */
import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { GameState } from '../src/engine';
import { STATE_VERSION, acceptFootballOffer, advanceYear, createRng, divisionTable, footballYear, overall, retireFootball, sportFame, trainFootball, tryout, tryoutBlockReason } from '../src/engine';
import { migrate } from '../src/save/migrations';
import fixturesV19 from '../src/save/__fixtures__/saves-v19.json';
import { makeGame, resolveAllFirst, withAge } from './helpers';

const F = GAME_CONTENT.football;

/** Clubes reais (nome, apelido ou mascote marcante) que nunca podem aparecer no conteúdo. */
const REAL_NAMES = [
  'Flamengo', 'Fluminense', 'Vasco', 'Botafogo', 'Corinthians', 'Palmeiras', 'São Paulo FC', 'Santos FC', 'Atlético Mineiro', 'Cruzeiro',
  'Grêmio', 'Internacional', 'Athletico', 'Coritiba', 'Bahia', 'EC Vitória', 'Sport Recife', 'Fortaleza EC', 'Ceará SC', 'Goiás',
  'Bragantino', 'Juventude', 'Mirassol', 'Cuiabá EC', 'América Mineiro', 'Atlético Goianiense', 'Chapecoense', 'Criciúma EC', 'Avaí',
  'Figueirense', 'Ponte Preta', 'Guarani', 'Paysandu', 'Remo', 'CRB', 'CSA', 'Náutico', 'Santa Cruz', 'Sampaio Corrêa', 'ABC',
  'América de Natal', 'Vila Nova', 'Botafogo-SP', 'Operário', 'Londrina', 'Novorizontino', 'Amazonas FC', 'Brasiliense', 'Gama',
  'Campinense', 'Treze', 'Volta Redonda', 'Ituano', 'Portuguesa', 'Juventus da Mooca', 'Paraná Clube', 'Joinville EC', 'Tuna Luso',
  'Mengão', 'Timão', 'Verdão', 'Fogão', 'Fluzão', 'Colorado', 'Imortal Tricolor', 'Furacão', 'Coxa', 'Raposa', 'Galo Doido',
  'Peixão', 'Leão da Ilha', 'Leão do Pici', 'Vozão', 'Esmeraldino', 'Massa Bruta', 'Papão', 'Macaca', 'Bugre', 'Timbu',
  'Cobra Coral', 'Tricolor do Morumbi', 'Gigante da Colina', 'Glorioso', 'Porco', 'Urubu', 'Gambá', 'Mosqueteiro', 'Real Madrid',
  'Barcelona', 'Manchester', 'Liverpool', 'Chelsea', 'Arsenal', 'Juventus', 'Milan', 'Inter de Milão', 'Bayern', 'Benfica', 'Porto FC',
  'Boca Juniors', 'River Plate', 'Libertadores', 'Sul-Americana', 'Brasileirão', 'Copa do Brasil', 'CBF', 'Conmebol', 'Bola de Ouro',
  'Premier League', 'La Liga', 'Serie A TIM', 'Bundesliga', 'MLS', 'Saudi Pro League',
];

/** Cidade + cores dos clubes reais da lista principal: nenhum fictício pode repetir a combinação. */
const REAL_CITY_COLORS: [string, string][] = [
  ['Rio de Janeiro', 'vermelho e preto'], ['Rio de Janeiro', 'grená, verde e branco'], ['Rio de Janeiro', 'preto e branco'],
  ['São Paulo', 'preto e branco'], ['São Paulo', 'verde e branco'], ['São Paulo', 'vermelho, branco e preto'],
  ['Santos', 'branco e preto'], ['Belo Horizonte', 'preto e branco'], ['Belo Horizonte', 'azul e branco'], ['Belo Horizonte', 'verde e preto'],
  ['Porto Alegre', 'azul, preto e branco'], ['Porto Alegre', 'vermelho e branco'], ['Curitiba', 'vermelho e preto'], ['Curitiba', 'verde e branco'],
  ['Salvador', 'azul, vermelho e branco'], ['Salvador', 'vermelho e preto'], ['Recife', 'vermelho e preto'], ['Recife', 'vermelho e branco'],
  ['Fortaleza', 'azul, vermelho e branco'], ['Fortaleza', 'preto e branco'], ['Goiânia', 'verde e branco'], ['Goiânia', 'vermelho e preto'],
  ['Campinas', 'preto e branco'], ['Campinas', 'verde e branco'], ['Belém', 'azul e branco'], ['Florianópolis', 'azul e branco'],
  ['Florianópolis', 'preto e branco'], ['Caxias do Sul', 'verde e branco'], ['Criciúma', 'amarelo, preto e branco'], ['Natal', 'preto e branco'],
  ['Natal', 'vermelho e branco'], ['Maceió', 'vermelho e branco'], ['Maceió', 'azul e branco'], ['Cuiabá', 'verde e amarelo'],
  ['Brasília', 'verde e branco'], ['Brasília', 'amarelo e verde'], ['Manaus', 'amarelo e preto'], ['Joinville', 'vermelho, preto e branco'],
  ['São Luís', 'vermelho, verde e amarelo'], ['Vitória', 'azul e branco'], ['Bragança Paulista', 'vermelho e branco'],
];

const contentText = JSON.stringify({ clubs: F.clubs, leagues: F.leagues, competitions: F.competitions, events: GAME_CONTENT.events.filter((e) => e.id.startsWith('fut_')) });

describe('clubes fictícios', () => {
  it.each(REAL_NAMES)('não usa "%s"', (name) => {
    const re = new RegExp(`(^|[^\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu');
    expect(contentText).not.toMatch(re);
  });

  it('nenhum clube repete cidade + cores de um clube real', () => {
    const bad = F.clubs.filter((c) => REAL_CITY_COLORS.some(([city, cols]) => c.city === city && c.colorNames === cols)).map((c) => c.name);
    expect(bad).toEqual([]);
  });

  it('20 clubes por divisão, ids únicos, no máximo 2 da Divisão A por cidade', () => {
    for (const d of ['A', 'B', 'C', 'D'] as const) expect(F.clubs.filter((c) => c.division === d)).toHaveLength(20);
    expect(new Set(F.clubs.map((c) => c.id)).size).toBe(F.clubs.length);
    const perCity = new Map<string, number>();
    for (const c of F.clubs.filter((x) => x.division === 'A')) perCity.set(c.city, (perCity.get(c.city) ?? 0) + 1);
    expect(Math.max(...perCity.values())).toBeLessThanOrEqual(2);
  });
});

function kid(seed: string, age = 14, athletic = 80): GameState {
  const g = withAge(makeGame(seed), age);
  return { ...g, pendingEvents: [], character: { ...g.character, stats: { ...g.character.stats, athletic } } };
}

function signedPlayer(seed: string): GameState {
  for (let i = 0; i < 60; i++) {
    const s = tryout({ ...kid(`${seed}${i}`, 18, 90) }, 'ATA', GAME_CONTENT);
    if (s.football) return s;
  }
  throw new Error('nenhuma peneira aprovada');
}

describe('carreira de futebol', () => {
  it('migração v19 → v20: football null', () => {
    const v19 = fixturesV19 as unknown as Record<string, unknown>;
    for (const k of Object.keys(v19)) {
      const m = migrate(structuredClone(v19[k]) as never);
      expect(m.version).toBe(STATE_VERSION);
      expect(m.football).toBeNull();
    }
  });

  it('peneira: faixa de idade, uma por ano; aprovado entra na base', () => {
    expect(tryoutBlockReason(kid('p', 8))).toBe('age');
    let approved: GameState | null = null;
    for (let i = 0; i < 40 && !approved; i++) {
      const s = tryout(kid(`k${i}`), 'MEI', GAME_CONTENT);
      expect(tryoutBlockReason(s)).not.toBeNull();
      if (s.football) approved = s;
    }
    expect(approved?.football?.stage).toBe('base');
    expect(approved?.football?.position).toBe('MEI');
  });

  it('adulto aprovado assina contrato; a temporada paga salário e gera estatísticas', () => {
    const s = signedPlayer('pro');
    expect(s.football!.contract).not.toBeNull();
    const next = footballYear({ ...s, character: { ...s.character, age: 19 } }, createRng(5), GAME_CONTENT);
    expect(next.football!.history).toHaveLength(1);
    expect(next.money).toBeGreaterThan(s.money);
    const h = next.football!.history[0]!;
    expect(h.rating).toBeGreaterThanOrEqual(0);
    expect(h.place).toBeGreaterThanOrEqual(1);
  });

  it('promoção e rebaixamento mantêm 20 clubes por divisão', () => {
    let s = signedPlayer('div');
    for (let y = 0; y < 3; y++) s = footballYear({ ...s, year: s.year + 1, character: { ...s.character, age: s.character.age + 1 } }, createRng(y + 1), GAME_CONTENT);
    for (const d of ['A', 'B', 'C', 'D'] as const) expect(divisionTable(s, GAME_CONTENT, d)).toHaveLength(20);
  });

  it('treino extra sobe o nível; aceitar proposta troca de clube; aposentar encerra', () => {
    const s = signedPlayer('tr');
    const t = trainFootball(s, GAME_CONTENT);
    expect(overall(t.football!)).toBeGreaterThanOrEqual(overall(s.football!));
    const withOffer = { ...s, football: { ...s.football!, offers: [{ clubId: 'litoraneo', years: 3, salary: 500000, year: s.year }] } };
    const moved = acceptFootballOffer(withOffer, 'litoraneo', GAME_CONTENT);
    expect(moved.football!.clubId).toBe('litoraneo');
    expect(moved.football!.contract!.salary).toBe(500000);
    expect(retireFootball(moved).football!.stage).toBe('aposentado');
  });

  it('futebol sustenta a fama', () => {
    const s = signedPlayer('fama');
    const famous = { ...s, football: { ...s.football!, reputation: 60 } };
    expect(sportFame(famous)).toBe(48);
  });

  it('vidas inteiras com futebol avançam sem erro (determinístico)', () => {
    let s = signedPlayer('vida');
    for (let y = 0; y < 25 && s.alive; y++) {
      s = resolveAllFirst(advanceYear(resolveAllFirst(s), GAME_CONTENT));
      // sem contrato, aceita a primeira proposta (como um jogador faria)
      const offer = s.football?.offers[0];
      if (s.football && !s.football.contract && offer) s = acceptFootballOffer(s, offer.clubId, GAME_CONTENT);
    }
    expect(s.football!.history.length).toBeGreaterThan(5);
  });
});
