import type { NamePools } from '../core/content';
import type { Rng } from '../core/rng';
import type { School, SchoolType, Sex } from '../core/state';

/** Década usada no sorteio de nomes (a base do IBGE vai de 1930 a 2000). */
export function nameDecade(birthYear: number | undefined, keys: readonly string[]): string | undefined {
  if (birthYear === undefined || !keys.length) return undefined;
  const d = Math.floor(birthYear / 10) * 10;
  const nums = keys.map(Number).sort((a, b) => a - b);
  return String(nums.reduce((best, k) => (Math.abs(k - d) < Math.abs(best - d) ? k : best), nums[0]!));
}

function weightedName(rng: Rng, list: readonly (readonly [string, number])[]): string {
  // raiz da frequência: os nomes campeões continuam comuns, mas sem engolir a variedade
  const w = list.map(([, f]) => Math.sqrt(f));
  const total = w.reduce((t, x) => t + x, 0);
  let r = rng.next() * total;
  for (let i = 0; i < list.length; i++) {
    r -= w[i]!;
    if (r <= 0) return list[i]![0];
  }
  return list[list.length - 1]![0];
}

/** Primeiro nome pela década de nascimento (e, 30% das vezes, pelo ranking da região). */
export function pickFirstName(rng: Rng, names: NamePools, sex: Sex, birthYear?: number, regiao?: string): string {
  const nat = names.byDecade?.[sex];
  const reg = regiao ? names.byRegion?.[regiao]?.[sex] : undefined;
  const useRegion = !!reg && rng.chance(0.3);
  const pool = useRegion ? reg : nat;
  const key = pool ? nameDecade(birthYear, Object.keys(pool)) : undefined;
  const list = key && pool ? pool[key] : undefined;
  if (list?.length) return weightedName(rng, list);
  return rng.pick(sex === 'M' ? names.male : names.female);
}

export function randomPersonName(rng: Rng, names: NamePools, sex?: Sex, birthYear?: number, regiao?: string): string {
  const s = sex ?? (rng.chance(0.5) ? 'M' : 'F');
  return `${pickFirstName(rng, names, s, birthYear, regiao)} ${rng.pick(names.surnames)}`;
}

/** Nome completo brasileiro: nome + sobrenome da mãe + sobrenome do pai (sem repetir). */
export function composeName(first: string, motherSurname: string | undefined, fatherSurname: string): string {
  return motherSurname && motherSurname !== fatherSurname ? `${first} ${motherSurname} ${fatherSurname}` : `${first} ${fatherSurname}`;
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
