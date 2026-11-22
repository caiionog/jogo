import { describe, expect, it } from 'vitest';
import { GAME_CONTENT } from '../src/content';
import { composeName, coupleSurnames, createRng, lastName, motherSurnameOf, newGame, pickFirstName, relationsOf } from '../src/engine';

const C = GAME_CONTENT;

describe('nomes brasileiros (IBGE)', () => {
  it('os nomes variam com a década de nascimento', () => {
    const sample = (year: number) => {
      const rng = createRng(year);
      const s = new Set<string>();
      for (let i = 0; i < 400; i++) s.add(pickFirstName(rng, C.names, 'F', year));
      return s;
    };
    const old = sample(1945);
    const young = sample(2005);
    // nomes "de época" aparecem num grupo e não no outro
    expect([...young].some((n) => !old.has(n))).toBe(true);
    expect([...old].some((n) => !young.has(n))).toBe(true);
    for (const n of [...old, ...young]) expect(n).toMatch(/^[A-ZÁÂÉÍÓÔÚÇ][a-záâãéêíóôõúç]+$/);
  });

  it('nome completo = nome + sobrenome da mãe + sobrenome do pai', () => {
    expect(composeName('Ana', 'Souza', 'Lima')).toBe('Ana Souza Lima');
    expect(composeName('Ana', 'Lima', 'Lima')).toBe('Ana Lima');
    const g = newGame({ seed: 'sobrenome', name: 'Caio', surnames: ['Alves', 'Nogueira'], sex: 'M' }, C);
    expect(g.character.name).toBe('Caio Alves Nogueira');
    const one = newGame({ seed: 'sobrenome2', name: 'Lia', surnames: ['Prado'], sex: 'F' }, C);
    expect(lastName(one.character.name)).toBe('Prado');
    expect(one.character.name.split(' ')).toHaveLength(3);
  });

  it('pais e irmãos carregam os sobrenomes da família', () => {
    const g = newGame({ seed: 'familia-nomes', name: 'Rui', surnames: ['Costa', 'Ramos'], sex: 'M' }, C);
    const pai = relationsOf(g, ['pai'])[0]!.person;
    const mae = relationsOf(g, ['mae'])[0]!.person;
    expect(lastName(pai.name)).toBe('Ramos');
    expect(lastName(mae.name)).toBe('Costa');
    for (const { person } of relationsOf(g, ['irmao'])) {
      expect(lastName(person.name)).toBe('Ramos');
      expect(motherSurnameOf(person.name)).toBe('Costa');
    }
  });

  it('filhos do casal: sobrenome da mãe e depois o do pai', () => {
    const partnerM = { name: 'Pedro Lima', sex: 'M' } as Parameters<typeof coupleSurnames>[2];
    const partnerF = { name: 'Júlia Souza', sex: 'F' } as Parameters<typeof coupleSurnames>[2];
    expect(coupleSurnames('F', 'Ana Prado', partnerM)).toEqual(['Lima', 'Prado']);
    expect(coupleSurnames('M', 'Rui Ramos', partnerF)).toEqual(['Ramos', 'Souza']);
  });
});
