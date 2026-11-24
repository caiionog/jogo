/** Ano dos relacionamentos: envelhecer, mortes, nascimentos, decaimento, carreira × família, limite. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { ageFamilyAndPeople, lifeMilestones } from './family';
import { isValidPartnerAge } from './guards';
import { archivePerson, changeAffection, currentPartner, enforcePeopleLimit, firstName, relationsOf, updatePerson, updateRelation, withHistory } from './people';
import { breakUp, divorce, payChildExpenses, resolvePregnancy } from './romance';
import { friendshipHappiness, partnerSupportsFighting } from './social';
import { relationshipsInitiativeYear } from './initiative';
import type { RelType } from './types';

/** Decaimento anual do afeto sem interação. */
export const DECAY: Partial<Record<RelType, number>> = {
  amigo: 5,
  colega_treino: 5,
  parceiro: 4,
  conjuge: 3,
  treinador: 3,
  pai: 2,
  mae: 2,
  irmao: 2,
  filho: 2,
  ex: 3,
  rival: 0,
};

function traitStance(content: GameContent, traits: readonly string[]): number {
  return traits.reduce((t, id) => t + (content.relationships.traits.find((d) => d.id === id)?.fightStance ?? 0), 0);
}

export function relationshipsYear(state: GameState, rng: Rng, content: GameContent): GameState {
  let s = ageFamilyAndPeople(state, rng, content);
  s = lifeMilestones(s, rng, content);
  s = resolvePregnancy(s, rng, content);
  s = payChildExpenses(s);

  // limpa marcas de "recém-chegado" de anos anteriores
  for (const p of s.relationships.people) {
    if (p.flags.recem_chegado && p.age > 0 && !(s.flags.recem_nascido === p.id)) s = updatePerson(s, p.id, (x) => {
      const { recem_chegado: _r, ...flags } = x.flags;
      return { ...x, flags };
    });
  }

  // namoro adolescente que deixou de respeitar a faixa de idade termina
  const partner = currentPartner(s);
  if (partner?.rel.romance && partner.rel.romance.stage !== 'casados' && partner.rel.romance.stage !== 'noivos' && !isValidPartnerAge(s.character.age, partner.person.age)) {
    s = breakUp(s, partner.person.id);
    s = appendLog(s, `Você e ${firstName(partner.person.name)} seguiram caminhos diferentes.`);
  }

  // decaimento e fim de relações frias
  const lastYear = s.year - 1;
  for (const { person, rel } of relationsOf(s)) {
    if (rel.interactedYear < lastYear) s = changeAffection(s, person.id, -(DECAY[rel.type] ?? 3));
  }
  for (const { person, rel } of relationsOf(s)) {
    if ((rel.type === 'amigo' || rel.type === 'colega_treino') && rel.affection < 10) {
      s = appendLog(archivePerson(s, person.id, 'Vocês se afastaram.'), `Você e ${firstName(person.name)} se afastaram.`);
    } else if (rel.romance && rel.romance.stage !== 'casados' && rel.affection < 15) {
      s = breakUp(s, person.id, true);
    } else if (rel.romance?.stage === 'casados' && rel.affection <= 5 && rng.chance(0.35)) {
      s = appendLog(s, `${person.name} pediu o divórcio.`);
      s = divorce(s, person.id);
    } else if (rel.type === 'ex' && rel.affection < 5 && s.character.age - rel.since > 3) {
      s = archivePerson(s, person.id, 'Ex de outros tempos.');
    }
  }

  // release 0.0.4: casos descobertos, iniciativa das amizades e declarações
  s = relationshipsInitiativeYear(s, rng);

  // rotina: casamentos e namoros longos se desgastam mesmo com carinho (crises e divórcios acontecem)
  const cp = currentPartner(s);
  if (cp?.rel.romance) {
    const years = s.character.age - cp.rel.romance.since;
    const wear = cp.rel.romance.stage === 'casados' ? rng.int(2, 11) : years >= 4 ? rng.int(0, 3) : 0;
    if (wear) s = changeAffection(s, cp.person.id, -wear);
  }

  // carreira de luta × família e amor
  const fights = s.fighter.history.filter((h) => h.year === lastYear).length;
  if (fights > 0) {
    const p = currentPartner(s);
    if (p) {
      const heavy = p.person.traits.some((t) => t === 'ciumento' || t === 'protetor');
      // lutas frequentes cansam a relação: a 1ª do ano não pesa, as seguintes sim
      const extra = Math.max(0, fights - 1);
      if (extra) s = changeAffection(s, p.person.id, -extra * (heavy ? 3 : 2), fights >= 3 ? 'Reclamou dos camps longe de casa.' : undefined);
    }
    for (const { person } of relationsOf(s, ['pai', 'mae'])) {
      const stance = Math.sign(traitStance(content, person.traits));
      if (stance === 0) continue;
      s = changeAffection(s, person.id, stance * 2);
      s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: stance }) } };
    }
  }
  if (partnerSupportsFighting(s, content)) s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: 3 }) } };
  s = friendshipHappiness(s);
  // treinador acompanha a dedicação
  if (fights > 0) for (const { person } of relationsOf(s, ['treinador'])) s = updateRelation(s, person.id, (r) => withHistory({ ...r, affection: Math.min(100, r.affection + 2 * fights) }, 'Acompanhou suas lutas.'));
  return enforcePeopleLimit(s);
}
