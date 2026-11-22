/** Família: geração ao nascer, envelhecimento e morte de NPCs. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { FlagValue, GameState, Sex } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { addRelation, createPerson, firstName, lastName, relationsOf, updatePerson } from './people';
import type { Person } from './types';

export function jobTier(familyWealth: number): 'low' | 'mid' | 'high' {
  return familyWealth < 35 ? 'low' : familyWealth < 70 ? 'mid' : 'high';
}

export function randomJob(rng: Rng, content: GameContent, tier: 'low' | 'mid' | 'high'): string {
  return rng.pick(content.relationships.jobs[tier]);
}

/**
 * Gera pai, mãe e irmãos mais velhos para um personagem de `charAge` anos.
 * Usada no nascimento (charAge 0) e na migração de saves antigos.
 */
export function generateFamily(state: GameState, rng: Rng, content: GameContent, charAge = state.character.age): GameState {
  let s = state;
  const c = state.character;
  const surname = lastName(c.name);
  const tier = jobTier(c.familyWealth);
  const fatherAge = charAge + rng.int(21, 42);
  const motherAge = charAge + rng.int(19, 40);
  const separated = rng.chance(0.2);
  const parentFlags: Record<string, FlagValue> = separated ? { separados: true } : {};

  let father: Person;
  [s, father] = createPerson(s, rng, content, { sex: 'M', age: fatherAge, surname, job: randomJob(rng, content, tier), flags: { ...parentFlags } });
  s = addRelation(s, father.id, 'pai', rng.int(55, 85));
  let mother: Person;
  [s, mother] = createPerson(s, rng, content, { sex: 'F', age: motherAge, job: randomJob(rng, content, tier), flags: { ...parentFlags } });
  s = addRelation(s, mother.id, 'mae', rng.int(60, 90));

  // irmãos mais velhos (0–2), nascidos depois que a mãe tinha 18
  const older = rng.int(0, 2);
  for (let i = 0; i < older; i++) {
    const gap = rng.int(1, 8);
    const age = charAge + gap;
    if (motherAge - age < 18) continue;
    s = addSibling(s, rng, content, age, surname);
  }
  return s;
}

export function addSibling(state: GameState, rng: Rng, content: GameContent, age: number, surname: string, sex?: Sex): GameState {
  let s = state;
  let sib: Person;
  [s, sib] = createPerson(s, rng, content, {
    ...(sex ? { sex } : {}),
    age,
    surname,
    ...(age >= 18 ? { job: randomJob(rng, content, jobTier(state.character.familyWealth)) } : {}),
  });
  return addRelation(s, sib.id, 'irmao', rng.int(45, 80));
}

/** Probabilidade anual de morte de um NPC (crianças não morrem por idade). */
export function npcDeathChance(age: number, health: number): number {
  if (age < 18) return 0;
  let p: number;
  if (age < 40) p = 0.0008;
  else if (age < 60) p = 0.003 + (age - 40) * 0.0006;
  else p = 0.015 + (age - 60) * 0.0045;
  if (health < 30) p += 0.05;
  return Math.min(0.6, p);
}

/** Chance de estar vivo na idade `age` (usada na migração para pais de saves antigos). */
export function survivalByAge(age: number): number {
  if (age < 60) return 0.97;
  if (age < 70) return 0.85;
  if (age < 80) return 0.6;
  if (age < 90) return 0.25;
  return 0.05;
}

const GRIEF: Record<string, number> = { pai: 15, mae: 15, irmao: 12, conjuge: 20, filho: 25, parceiro: 12, amigo: 6, treinador: 4 };

/** Envelhece todas as pessoas, aplica mortes e nascimentos de irmãos mais novos. */
export function ageFamilyAndPeople(state: GameState, rng: Rng, content: GameContent): GameState {
  let s = state;
  // envelhecer
  s = {
    ...s,
    relationships: {
      ...s.relationships,
      people: s.relationships.people.map((p) => {
        if (!p.alive) return p;
        const age = p.age + 1;
        const health = age >= 50 ? Math.max(0, p.health - rng.int(0, 3)) : p.health;
        return { ...p, age, health };
      }),
    },
  };
  // mortes
  for (const { person, rel } of relationsOf(s, undefined)) {
    if (!rng.chance(npcDeathChance(person.age, person.health))) continue;
    s = updatePerson(s, person.id, (p) => ({ ...p, alive: false, deathAge: p.age }));
    const grief = rel.affection >= 40 ? (GRIEF[rel.type] ?? 3) : Math.round((GRIEF[rel.type] ?? 3) / 3);
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: -grief }) } };
    const label = relLabelPossessive(rel.type, person.sex);
    s = appendLog(s, `${label}, ${firstName(person.name)}, faleceu aos ${person.age} anos.`);
    if (rel.romance) {
      // viuvez: a relação romântica termina
      s = {
        ...s,
        relationships: {
          ...s.relationships,
          relations: s.relationships.relations.map((r) => {
            if (r.personId !== person.id) return r;
            const { romance: _gone, ...rest } = r;
            return rest;
          }),
        },
      };
      s = { ...s, flags: { ...s.flags, viuvo: true } };
    }
  }
  // irmão(ã) mais novo(a)
  const age = s.character.age;
  const parents = relationsOf(s, ['pai', 'mae']);
  const mother = parents.find((x) => x.rel.type === 'mae')?.person;
  const together = parents.length === 2 && !parents.some((x) => x.person.flags.separados);
  const siblings = relationsOf(s, ['irmao'], false).length;
  if (age >= 1 && age <= 10 && together && mother && mother.age < 42 && siblings < 3 && rng.chance(0.12)) {
    s = addSibling(s, rng, content, 0, lastName(s.character.name));
    const sib = s.relationships.people[s.relationships.people.length - 1]!;
    s = appendLog(s, `Nasceu ${sib.sex === 'M' ? 'seu irmão' : 'sua irmã'}, ${firstName(sib.name)}!`);
  }
  return s;
}

export function relLabelPossessive(type: string, sex: Sex): string {
  const m = sex === 'M';
  switch (type) {
    case 'pai': return 'Seu pai';
    case 'mae': return 'Sua mãe';
    case 'irmao': return m ? 'Seu irmão' : 'Sua irmã';
    case 'filho': return m ? 'Seu filho' : 'Sua filha';
    case 'conjuge': return m ? 'Seu marido' : 'Sua esposa';
    case 'parceiro': return m ? 'Seu namorado' : 'Sua namorada';
    case 'amigo': return m ? 'Seu amigo' : 'Sua amiga';
    case 'treinador': return m ? 'Seu treinador' : 'Sua treinadora';
    case 'ex': return m ? 'Seu ex' : 'Sua ex';
    default: return m ? 'Seu conhecido' : 'Sua conhecida';
  }
}

/** Marcos de uma linha dos irmãos e filhos. */
export function lifeMilestones(state: GameState, rng: Rng, content: GameContent): GameState {
  let s = state;
  for (const { person, rel } of relationsOf(s, ['irmao', 'filho'])) {
    const who = relLabelPossessive(rel.type, person.sex);
    const n = firstName(person.name);
    if (rel.type === 'filho' && person.age === 6) s = appendLog(s, `${who}, ${n}, começou a ir à escola.`);
    if (rel.type === 'filho' && person.age === 13) s = appendLog(s, `${who}, ${n}, virou adolescente${person.flags.interesse_luta ? ' e não sai da academia' : ''}.`);
    if (person.age === 18 && !person.job) {
      const job = randomJob(rng, content, rng.pick(['low', 'mid', 'high'] as const));
      s = updatePerson(s, person.id, (p) => ({ ...p, job }));
      const extra = rel.type === 'irmao' && rng.chance(0.4) ? ' e se mudou de cidade' : '';
      s = appendLog(s, `${who}, ${n}, começou a trabalhar como ${job.toLowerCase()}${extra}.`);
    }
    if (person.age >= 25 && person.age <= 34 && !person.flags.casado && rng.chance(0.12)) {
      s = updatePerson(s, person.id, (p) => ({ ...p, flags: { ...p.flags, casado: true } }));
      s = appendLog(s, `${who}, ${n}, se casou.`);
    }
  }
  return s;
}
