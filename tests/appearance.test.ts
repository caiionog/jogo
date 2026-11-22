import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import type { Appearance } from '../src/engine';
import {
  RACES, SKIN_NOISE, createRng, genesForRace, inheritAppearance, inheritGenes, newGame, parentsFor, randomAppearance,
  relationsOf, ufOrDefault, deriveAvatar,
} from '../src/engine';

const look = (race: Appearance['race'], seed = 1): Appearance => ({ genes: genesForRace(createRng(seed), race), race, facialHair: 'nenhuma' });

describe('genética da aparência', () => {
  it('é determinística: mesma seed → mesma UF, cidade, nome, genes e descriptor', () => {
    const a = newGame({ seed: 'det', name: 'Lia', sex: 'F', birthYear: 2000 }, GAME_CONTENT);
    const b = newGame({ seed: 'det', name: 'Lia', sex: 'F', birthYear: 2000 }, GAME_CONTENT);
    expect(a.character.uf).toBe(b.character.uf);
    expect(a.character.city).toBe(b.character.city);
    expect(a.character.name).toBe(b.character.name);
    expect(a.character.appearance).toEqual(b.character.appearance);
    expect(a.relationships.people.map((p) => p.appearance)).toEqual(b.relationships.people.map((p) => p.appearance));
    expect(deriveAvatar(a, GAME_CONTENT)).toEqual(deriveAvatar(b, GAME_CONTENT));
  });

  it('herança: tom do filho entre os pais ± ruído; categóricos vêm de um dos pais (salvo mutação rara)', () => {
    const rng = createRng(7);
    let fromParent = 0;
    const N = 3000;
    for (let i = 0; i < N; i++) {
      const f = genesForRace(rng, RACES[i % 5]!);
      const m = genesForRace(rng, RACES[(i + 2) % 5]!);
      const k = inheritGenes(rng, f, m);
      expect(k.skinTone).toBeGreaterThanOrEqual(Math.min(f.skinTone, m.skinTone) - SKIN_NOISE - 1e-9);
      expect(k.skinTone).toBeLessThanOrEqual(Math.max(f.skinTone, m.skinTone) + SKIN_NOISE + 1e-9);
      if ([f.hairType, m.hairType].includes(k.hairType) && [f.eyeShape, m.eyeShape].includes(k.eyeShape) && [f.faceShape, m.faceShape].includes(k.faceShape)) fromParent++;
    }
    expect(fromParent / N).toBeGreaterThan(0.85);
  });

  it('pais gerados para um filho (criação/migração) ficam um acima e outro abaixo no tom', () => {
    const rng = createRng(3);
    for (let i = 0; i < 500; i++) {
      const child = look(RACES[i % 5]!, i);
      const { father, mother } = parentsFor(rng, child);
      const t = child.genes.skinTone;
      expect(Math.min(father.genes.skinTone, mother.genes.skinTone)).toBeLessThanOrEqual(t + 1e-9);
      expect(Math.max(father.genes.skinTone, mother.genes.skinTone)).toBeGreaterThanOrEqual(t - 1e-9);
    }
  });

  it('na família do jogo, irmãos e filhos herdam dos pais (sobrenome da mãe + do pai)', () => {
    const g = newGame({ seed: 'fam', name: 'Rui', surnames: ['Prado', 'Lima'], sex: 'M', birthYear: 1990 }, GAME_CONTENT);
    const pai = relationsOf(g, ['pai'], false)[0]!.person;
    const mae = relationsOf(g, ['mae'], false)[0]!.person;
    const t = g.character.appearance.genes.skinTone;
    expect(t).toBeGreaterThanOrEqual(Math.min(pai.appearance!.genes.skinTone, mae.appearance!.genes.skinTone) - 1e-9);
    expect(t).toBeLessThanOrEqual(Math.max(pai.appearance!.genes.skinTone, mae.appearance!.genes.skinTone) + 1e-9);
    const last = (n: string) => n.split(' ').at(-1);
    expect(g.character.name).toBe('Rui Prado Lima');
    expect(last(pai.name)).toBe('Lima');
    expect(last(mae.name)).toBe('Prado');
    const kid = inheritAppearance(createRng(9), pai.appearance!, mae.appearance!, 'F');
    expect(kid.facialHair).toBe('nenhuma');
  });

  it('diversidade: faixas amplas e sobrepostas; todo tipo de cabelo e cor de olho aparece em todo grupo', () => {
    const rng = createRng(11);
    const ranges: Record<string, [number, number]> = {};
    for (const race of RACES) {
      const hair = new Set<string>();
      const eyes = new Set<string>();
      let lo = 1, hi = 0;
      for (let i = 0; i < 4000; i++) {
        const g = genesForRace(rng, race);
        hair.add(g.hairType); eyes.add(g.eyeColor);
        lo = Math.min(lo, g.skinTone); hi = Math.max(hi, g.skinTone);
      }
      expect(hair.size).toBe(4);
      expect(eyes.size).toBe(6);
      expect(hi - lo).toBeGreaterThan(0.3);
      ranges[race] = [lo, hi];
    }
    // grupos vizinhos se sobrepõem: não há fronteira rígida de tom
    const ov = (a: string, b: string) => Math.min(ranges[a]![1], ranges[b]![1]) - Math.max(ranges[a]![0], ranges[b]![0]);
    expect(ov('branca', 'parda')).toBeGreaterThan(0.1);
    expect(ov('parda', 'preta')).toBeGreaterThan(0.1);
    expect(ov('indigena', 'parda')).toBeGreaterThan(0.1);
    expect(ov('amarela', 'branca')).toBeGreaterThan(0.1);
  });

  it('pessoas sem família no jogo seguem a UF atual', () => {
    const rr = ufOrDefault(GAME_CONTENT.geo, 'RR');
    const rng = createRng(5);
    let ind = 0;
    for (let i = 0; i < 4000; i++) if (randomAppearance(rng, rr, 'M').race === 'indigena') ind++;
    expect(ind / 4000).toBeGreaterThan(0.1);
  });
});

