import type { NamePools } from '../core/content';
import type { Rng } from '../core/rng';
import type { School, SchoolType, Sex } from '../core/state';

export function randomPersonName(rng: Rng, names: NamePools, sex?: Sex): string {
  const s = sex ?? (rng.chance(0.5) ? 'M' : 'F');
  const first = rng.pick(s === 'M' ? names.male : names.female);
  return `${first} ${rng.pick(names.surnames)}`;
}

export function randomTeacherName(rng: Rng, names: NamePools): string {
  const sex: Sex = rng.chance(0.5) ? 'M' : 'F';
  return `${sex === 'M' ? 'Prof.' : 'Profª'} ${randomPersonName(rng, names, sex)}`;
}

/** Escolas cujo nome começa com "Escola"/"E.E." são femininas (da/na); as demais, masculinas (do/no). */
export function isFeminineSchool(name: string): boolean {
  return /^(Escola|E\.E\.)/.test(name);
}

/** Nome da escola com preposição contraída: withPreposition(n, 'de') → "da Escola X" / "do Colégio Y". */
export function withPreposition(name: string, prep: 'de' | 'em' | 'a' | 'para'): string {
  const fem = isFeminineSchool(name);
  const p = { de: fem ? 'da' : 'do', em: fem ? 'na' : 'no', a: fem ? 'a' : 'o', para: fem ? 'para a' : 'para o' }[prep];
  return `${p} ${name}`;
}

export function randomSchool(rng: Rng, names: NamePools, type: SchoolType): School {
  const prefix = rng.pick(type === 'publica' ? names.publicSchoolPrefixes : names.privateSchoolPrefixes);
  return { name: `${prefix} ${rng.pick(names.schoolNames)}`, type };
}
