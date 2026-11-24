/**
 * População da cidade (release 0.0.4, fase 2). Os moradores são gerados sob demanda por (seed, UF, cidade, versão do
 * gerador): nada disso vai para o save. Só entra no save (`Person`) quem ganha relação com o personagem; o save guarda
 * qual morador virou qual pessoa (`population.met`), para não gerar a mesma pessoa duas vezes. A idade sai do ano de
 * nascimento, então todo mundo envelhece junto com o ano. Os bairros são fictícios e fixos por cidade.
 * Tudo com RNG derivado (`seedToState`): nunca mexe no `rngState`, exceto ao conhecer alguém (ação do jogador).
 */
import type { GameContent } from '../core/content';
import { createRng, seedToState } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState, Sex } from '../core/state';
import { appendLog } from '../core/stats';
import { composeName, pickFirstName } from '../character/names';
import { cityDef, ufDef } from '../geo';
import { addRelation, createPerson, enforcePeopleLimit, updateRelation, withHistory } from '../relationships/people';

/** Versão do gerador: mudar as listas de nomes ou a fórmula exige subir a versão (as pessoas já conhecidas ficam). */
export const POP_VERSION = 1;
export const POP_MIN = 60;
export const POP_MAX = 400;

export interface PopulationState {
  version: number;
  /** Morador gerado (id) → pessoa do save (id). */
  met: Record<string, string>;
}

export interface PopulationContent {
  /** Partes de nome de bairro fictício: "Jardim" + "das Acácias". */
  neighborhoodPrefixes: readonly string[];
  neighborhoodNames: readonly string[];
  /** Ocupações de fachada dos moradores (texto). */
  occupations: readonly string[];
  /**
   * Imigração: parte dos moradores nascida em outro país, por UF e país. Vazio até haver dados oficiais por UF e
   * nacionalidade (OBMigra/SISMIGRA); o gerador não inventa números.
   */
  immigration: readonly { uf: string; origin: string; share: number }[];
}

export interface Resident {
  id: string;
  name: string;
  sex: Sex;
  birthYear: number;
  /** Idade em que o morador morre (oculta; a partir dela ele some da lista). */
  lifespan: number;
  neighborhood: string;
  occupation: string;
  /** País de nascimento ('Brasil' para a maioria). */
  origin: string;
}

export function emptyPopulation(): PopulationState {
  return { version: POP_VERSION, met: {} };
}

/** Quantos moradores a cidade mostra: 60 numa cidade pequena, até 400 numa metrópole (escala logarítmica). */
export function residentCount(population: number): number {
  const t = Math.log10(Math.max(5000, population) / 5000) / Math.log10(12_000_000 / 5000);
  return Math.round(POP_MIN + (POP_MAX - POP_MIN) * Math.min(1, Math.max(0, t)));
}

/** Bairros fictícios da cidade (6 a 12, iguais em todas as vidas). */
export function cityNeighborhoods(content: GameContent, uf: string, city: string): string[] {
  const p = content.population;
  const rng = createRng(seedToState(`bairros:v${POP_VERSION}:${uf}:${city}`));
  const pop = cityDef(content.geo, uf, city)?.populacao ?? 50_000;
  const n = 6 + Math.round(6 * Math.min(1, Math.max(0, Math.log10(Math.max(1, pop / 20_000)) / 2.8)));
  const names = new Set<string>(['Centro']);
  for (let tries = 0; names.size < n && tries < 200; tries++) names.add(`${rng.pick(p.neighborhoodPrefixes)} ${rng.pick(p.neighborhoodNames)}`);
  return [...names];
}

/** Bairro onde o personagem mora na cidade atual (fixo por vida e cidade). */
export function homeNeighborhood(state: GameState, content: GameContent): string {
  const list = cityNeighborhoods(content, state.character.uf, state.character.city);
  return createRng(seedToState(`${state.seed}:casa:${state.character.uf}:${state.character.city}`)).pick(list);
}

function pickOrigin(rng: Rng, content: GameContent, uf: string): string {
  let r = rng.next();
  for (const im of content.population.immigration) {
    if (im.uf !== uf) continue;
    if (r < im.share) return im.origin;
    r -= im.share;
  }
  return 'Brasil';
}

/** Todos os moradores gerados da cidade (vivos ou não, conhecidos ou não). Puro e determinístico. */
export function generateResidents(state: GameState, content: GameContent, uf = state.character.uf, city = state.character.city): Resident[] {
  const pop = cityDef(content.geo, uf, city)?.populacao ?? 50_000;
  const n = residentCount(pop);
  const hoods = cityNeighborhoods(content, uf, city);
  const regiao = ufDef(content.geo, uf)?.regiao;
  const rng = createRng(seedToState(`${state.seed}:pop:v${POP_VERSION}:${uf}:${city}`));
  // a lista nasce no ano de nascimento do personagem (idades 0–85) e envelhece junto com o ano
  const base = state.year - state.character.age;
  const out: Resident[] = [];
  for (let i = 0; i < n; i++) {
    const sex: Sex = rng.chance(0.5) ? 'M' : 'F';
    const birthYear = base - rng.int(0, 85);
    const first = pickFirstName(rng, content.names, sex, birthYear, regiao);
    const name = composeName(first, rng.pick(content.names.surnames), rng.pick(content.names.surnames));
    out.push({
      id: `${uf}:${city}:${i}`,
      name,
      sex,
      birthYear,
      lifespan: rng.int(62, 98),
      neighborhood: rng.pick(hoods),
      occupation: rng.pick(content.population.occupations),
      origin: pickOrigin(rng, content, uf),
    });
  }
  return out;
}

export function residentAge(state: GameState, r: Resident): number {
  return state.year - r.birthYear;
}

/** Moradores que ainda vivem na cidade e que o personagem ainda não conhece. */
export function cityResidents(state: GameState, content: GameContent): Resident[] {
  const met = state.population?.met ?? {};
  return generateResidents(state, content).filter((r) => {
    const age = residentAge(state, r);
    return age >= 0 && age < r.lifespan && !met[r.id];
  });
}

/** Vizinhos: moradores do mesmo bairro do personagem. */
export function neighbors(state: GameState, content: GameContent): Resident[] {
  const home = homeNeighborhood(state, content);
  return cityResidents(state, content).filter((r) => r.neighborhood === home);
}

export type MeetResidentBlockReason = 'busy' | 'prison' | 'unknown' | 'too-young' | 'minor' | 'age-gap';

/**
 * Pode puxar conversa: criança (5–11) só com quem tem até 3 anos de diferença; adulto não puxa conversa com menor
 * desconhecido; adolescente não puxa conversa com criança mais de 3 anos mais nova.
 */
export function meetResidentBlockReason(state: GameState, residentId: string, content: GameContent): MeetResidentBlockReason | null {
  if (!state.alive || state.pendingEvents.length || state.activeFight) return 'busy';
  if (state.prison && state.prison.regime !== 'aberto') return 'prison';
  const r = cityResidents(state, content).find((x) => x.id === residentId);
  if (!r) return 'unknown';
  return residentAgeBlock(state.character.age, residentAge(state, r));
}

export function residentAgeBlock(me: number, age: number): MeetResidentBlockReason | null {
  if (me < 5) return 'too-young';
  if (me < 12 && Math.abs(me - age) > 3) return 'age-gap';
  if (me >= 18 && age < 18) return 'minor';
  if (me < 18 && age < 12 && me - age > 3) return 'age-gap';
  return null;
}

/** Conhecer um morador: vira `Person` com relação `conhecido` (afeto 35–45) e a história do bairro. */
export function meetResident(state: GameState, residentId: string, content: GameContent): GameState {
  if (meetResidentBlockReason(state, residentId, content) !== null) return state;
  const r = cityResidents(state, content).find((x) => x.id === residentId)!;
  const rng = createRng(state.rngState);
  const age = residentAge(state, r);
  const flags = { morador: r.id, bairro: r.neighborhood, ...(r.origin !== 'Brasil' ? { origem: r.origin } : {}) };
  const [s0, p] = createPerson(state, rng, content, { name: r.name, sex: r.sex, age, flags });
  let s = addRelation(s0, p.id, 'conhecido', 35 + rng.int(0, 10));
  const where = r.neighborhood === homeNeighborhood(s, content) ? 'no seu bairro' : `no bairro ${r.neighborhood}`;
  s = updateRelation(s, p.id, (rel) => withHistory(rel, `Vocês se conheceram ${where}.`));
  s = { ...s, population: { ...(s.population ?? emptyPopulation()), met: { ...s.population?.met, [r.id]: p.id } } };
  s = enforcePeopleLimit(s);
  s = appendLog(s, `Você puxou conversa com ${p.name} ${where}.`);
  return { ...s, rngState: rng.state };
}
