import { METRICS } from '../meta/metrics';
import type { GameContent } from '../core/content';
import { STAT_KEYS } from '../core/state';
import { STAGE_ORDER } from '../lifeStages/school';
import type { Effects } from '../core/effects';
import type { GameEvent } from './types';
import { FIGHT_TEXT_KEYS } from '../fighting/types';

/**
 * Valida o conteúdo contra o schema (além do que o TypeScript garante).
 * Retorna a lista de erros; vazia = conteúdo válido.
 */
export function validateContent(content: GameContent): string[] {
  const errors: string[] = [];
  const eventIds = new Set<string>();
  const clubIds = new Set(content.clubs.map((c) => c.id));
  const allEventIds = new Set(content.events.map((e) => e.id));
  const fc = content.fighting;
  const orgIds = new Set(fc.orgs.map((o) => o.id));
  const gymIds = new Set(fc.gyms.map((g) => g.id));
  const traitIds = new Set(content.relationships.traits.map((t) => t.id));

  const checkEffects = (where: string, fx: Effects | undefined) => {
    if (!fx) return;
    for (const k of Object.keys(fx.stats ?? {})) {
      if (!(STAT_KEYS as readonly string[]).includes(k)) errors.push(`${where}: atributo desconhecido "${k}"`);
    }
    if (fx.school?.joinClub && !clubIds.has(fx.school.joinClub)) {
      errors.push(`${where}: clube inexistente "${fx.school.joinClub}"`);
    }
    const ff = fx.fighter;
    if (ff?.joinGym && !['local', 'best'].includes(ff.joinGym) && !gymIds.has(ff.joinGym)) errors.push(`${where}: academia inexistente "${ff.joinGym}"`);
    if (ff?.signWith && !orgIds.has(ff.signWith)) errors.push(`${where}: organização inexistente "${ff.signWith}"`);
    for (const k of Object.keys(ff?.skills ?? {})) {
      if (!['jiujitsu', 'trocacao', 'athletic', 'chin'].includes(k)) errors.push(`${where}: habilidade desconhecida "${k}"`);
    }
    const he = fx.health;
    if (he?.injury && he.injury !== 'random' && !content.health.injuries.some((d) => d.id === he.injury)) errors.push(`${where}: lesão inexistente "${he.injury}"`);
    if (he?.condition && !content.health.conditions.some((d) => d.id === he.condition)) errors.push(`${where}: doença inexistente "${he.condition}"`);
    if (he?.controlCondition && he.controlCondition !== 'var' && !content.health.conditions.some((d) => d.id === he.controlCondition)) errors.push(`${where}: doença inexistente "${he.controlCondition}"`);
    if (he?.sequela && !content.health.sequelae.some((d) => d.id === he.sequela)) errors.push(`${where}: sequela inexistente "${he.sequela}"`);
    if (he?.die !== undefined && !he.die.trim()) errors.push(`${where}: causa de morte vazia`);
    const so = fx.social;
    if (so?.pregnancyChance !== undefined && !(so.pregnancyChance > 0 && so.pregnancyChance <= 1)) errors.push(`${where}: pregnancyChance fora de (0,1]`);
    for (const f of fx.followUps ?? []) {
      if (!allEventIds.has(f.eventId)) errors.push(`${where}: followUp para evento inexistente "${f.eventId}"`);
      if (!Number.isInteger(f.delayYears) || f.delayYears < 0) errors.push(`${where}: delayYears inválido`);
    }
  };

  const checkEvent = (e: GameEvent) => {
    if (!e.id) errors.push('evento sem id');
    if (eventIds.has(e.id)) errors.push(`id de evento duplicado: ${e.id}`);
    eventIds.add(e.id);
    const trigger = e.trigger ?? 'random';
    if (trigger === 'random' && !(e.weight > 0)) errors.push(`${e.id}: evento aleatório precisa de peso > 0`);
    if (!e.text.trim()) errors.push(`${e.id}: texto vazio`);
    if (e.choices.length === 0) errors.push(`${e.id}: sem escolhas`);
    const c = e.conditions;
    if (c.minAge !== undefined && c.maxAge !== undefined && c.minAge > c.maxAge) errors.push(`${e.id}: minAge > maxAge`);
    for (const s of c.schoolStages ?? []) if (!STAGE_ORDER.includes(s)) errors.push(`${e.id}: fase escolar inválida "${s}"`);
    if (Array.isArray(c.club)) for (const id of c.club) if (!clubIds.has(id)) errors.push(`${e.id}: clube inexistente "${id}"`);
    // relacionamentos
    const relTypes = ['pai', 'mae', 'irmao', 'amigo', 'parceiro', 'conjuge', 'ex', 'filho', 'treinador', 'rival', 'colega_treino'];
    for (const t of [...(c.relationship?.types ?? []), ...(c.hasRelation ?? []), ...(c.noRelation ?? [])]) if (!relTypes.includes(t)) errors.push(`${e.id}: tipo de relação inválido "${t}"`);
    for (const t of c.relationship?.traits ?? []) if (!traitIds.has(t)) errors.push(`${e.id}: traço inexistente "${t}"`);
    if (e.tags?.includes('adult')) {
      // regra obrigatória: eventos adultos só para 18+ (o motor também filtra por canHaveSexualContent)
      if ((c.minAge ?? 0) < 18) errors.push(`${e.id}: evento 'adult' precisa de minAge >= 18`);
      if (c.relationship && (c.relationship.personAge?.min ?? 0) < 18) errors.push(`${e.id}: evento 'adult' com pessoa-alvo precisa de personAge.min >= 18`);
    }
    if (!e.tags?.includes('adult') && c.maxAge !== undefined && c.maxAge < 18 && c.relationship?.types.some((t) => t === 'parceiro') && (c.relationship.personAge?.max ?? 99) > 17) {
      errors.push(`${e.id}: romance adolescente precisa limitar personAge a 14–17`);
    }
    if (c.fighting?.orgEligible && !orgIds.has(c.fighting.orgEligible)) errors.push(`${e.id}: organização inexistente "${c.fighting.orgEligible}"`);
    for (const o of c.fighting?.orgs ?? []) if (!orgIds.has(o)) errors.push(`${e.id}: organização inexistente "${o}"`);
    const choiceIds = new Set<string>();
    for (const ch of e.choices) {
      if (choiceIds.has(ch.id)) errors.push(`${e.id}: escolha duplicada ${ch.id}`);
      choiceIds.add(ch.id);
      if (!ch.label.trim() || !ch.resultText.trim()) errors.push(`${e.id}/${ch.id}: label ou resultado vazio`);
      checkEffects(`${e.id}/${ch.id}`, ch.effects);
      if (ch.risk) {
        if (!(ch.risk.chance > 0 && ch.risk.chance < 1)) errors.push(`${e.id}/${ch.id}: risk.chance fora de (0,1)`);
        checkEffects(`${e.id}/${ch.id}/risk`, ch.risk.effects);
      }
    }
  };

  content.events.forEach(checkEvent);

  const actionIds = new Set<string>();
  for (const a of content.actions) {
    if (actionIds.has(a.id)) errors.push(`id de ação duplicado: ${a.id}`);
    actionIds.add(a.id);
    if (!(a.energyCost > 0)) errors.push(`ação ${a.id}: custo de energia deve ser > 0`);
    if (a.logTexts.length === 0) errors.push(`ação ${a.id}: sem textos de log`);
    checkEffects(`ação ${a.id}`, a.effects);
    if (a.risk) {
      if (!(a.risk.chance > 0 && a.risk.chance < 1)) errors.push(`ação ${a.id}: risk.chance fora de (0,1)`);
      checkEffects(`ação ${a.id}/risk`, a.risk.effects);
    }
  }

  const seenClubs = new Set<string>();
  for (const club of content.clubs) {
    if (seenClubs.has(club.id)) errors.push(`id de clube duplicado: ${club.id}`);
    seenClubs.add(club.id);
    checkEffects(`clube ${club.id}`, club.joinEffects);
    checkEffects(`clube ${club.id}`, club.yearlyEffects);
  }
  // --- luta ---
  const seenOrgs = new Set<string>();
  const divisionIds = new Set(fc.divisions.map((d) => d.id));
  if (divisionIds.size !== fc.divisions.length) errors.push('ids de categoria duplicados');
  for (const o of fc.orgs) {
    if (seenOrgs.has(o.id)) errors.push(`id de organização duplicado: ${o.id}`);
    seenOrgs.add(o.id);
    if (o.rounds < 1 || o.titleRounds < o.rounds) errors.push(`organização ${o.id}: rounds inválidos`);
    if (o.npcSkill[0] > o.npcSkill[1]) errors.push(`organização ${o.id}: npcSkill invertido`);
    if (o.maxAge !== undefined && o.maxAge < o.minAge) errors.push(`organização ${o.id}: maxAge < minAge`);
    if (o.rankingSize > 0 && !o.contract) errors.push(`organização ${o.id}: ranking exige contrato`);
  }
  const seenGyms = new Set<string>();
  for (const g of fc.gyms) {
    if (seenGyms.has(g.id)) errors.push(`id de academia duplicado: ${g.id}`);
    seenGyms.add(g.id);
    if (g.coach < 0 || g.coach > 100) errors.push(`academia ${g.id}: coach fora de 0–100`);
    if (g.city && !content.geo.ufs.some((u) => u.cities.some((c) => c.name === g.city))) errors.push(`academia ${g.id}: cidade inexistente "${g.city}"`);
  }
  for (const k of FIGHT_TEXT_KEYS) if (!fc.text[k]?.length) errors.push(`fightText: sem textos para "${k}"`);
  for (const w of ['standing', 'clinch', 'ground'] as const) if (!fc.text.strikes[w].length) errors.push(`fightText: sem golpes "${w}"`);
  if (!fc.text.submissions.length) errors.push('fightText: sem finalizações');
  for (const h of Object.values(fc.hooks)) if (h && !allEventIds.has(h)) errors.push(`hook: evento inexistente "${h}"`);
  if (!fc.nicknames.length) errors.push('apelidos vazios');
  // saúde (Etapa 6)
  const hc = content.health;
  const seqIds = new Set(hc.sequelae.map((x) => x.id));
  const injIds = new Set<string>();
  for (const d of hc.injuries) {
    if (injIds.has(d.id)) errors.push(`lesão duplicada: ${d.id}`);
    injIds.add(d.id);
    if (d.months[0] < 1 || d.months[1] < d.months[0]) errors.push(`lesão ${d.id}: meses inválidos`);
    if (d.sequelaId && !seqIds.has(d.sequelaId)) errors.push(`lesão ${d.id}: sequela inexistente "${d.sequelaId}"`);
    if (d.surgery && !(d.surgery.successChance > 0 && d.surgery.successChance <= 1)) errors.push(`lesão ${d.id}: chance de cirurgia inválida`);
    if (d.surgery && !d.cost.cirurgia) errors.push(`lesão ${d.id}: cirurgia sem custo`);
    if (!(d.sequelaChance >= 0 && d.sequelaChance < 1)) errors.push(`lesão ${d.id}: sequelaChance fora de [0,1)`);
    if (!d.sources.length) errors.push(`lesão ${d.id}: sem origem`);
  }
  for (const src of ['luta', 'sparring', 'treino', 'evento'] as const) if (!hc.injuries.some((d) => d.sources.includes(src))) errors.push(`nenhuma lesão com origem "${src}"`);
  if (seqIds.size !== hc.sequelae.length) errors.push('sequelas duplicadas');
  for (const [name, id] of Object.entries(hc.legacyNames)) if (!injIds.has(id)) errors.push(`lesão antiga "${name}" aponta para id inexistente "${id}"`);
  const condIds = new Set(hc.conditions.map((c) => c.id));
  if (condIds.size !== hc.conditions.length) errors.push('doenças duplicadas');
  for (const c of hc.conditions) if (!(c.baseChance > 0 && c.baseChance < 0.2) || c.deathMult < 1) errors.push(`doença ${c.id}: parâmetros inválidos`);
  if (hc.diagnosisEventId && !allEventIds.has(hc.diagnosisEventId)) errors.push(`hook: evento inexistente "${hc.diagnosisEventId}"`);
  // conquistas (Etapa 6)
  const achIds = new Set<string>();
  for (const a of content.achievements) {
    if (achIds.has(a.id)) errors.push(`conquista duplicada: ${a.id}`);
    achIds.add(a.id);
    if (!METRICS[a.metric]) errors.push(`conquista ${a.id}: métrica inexistente "${a.metric}"`);
    if (a.min === undefined && a.max === undefined) errors.push(`conquista ${a.id}: sem limite (min/max)`);
    if (!a.name.trim() || !a.description.trim() || !a.icon) errors.push(`conquista ${a.id}: nome/descrição/ícone vazios`);
  }
  // legado
  const lc = content.legacy;
  if (!(lc.inheritanceTax >= 0 && lc.inheritanceTax < 1)) errors.push('legado: imposto de herança fora de [0,1)');
  if (!(lc.defaultSplit.spouseWithChildren >= 0 && lc.defaultSplit.spouseWithChildren <= 1)) errors.push('legado: divisão padrão inválida');
  // relacionamentos
  if (traitIds.size !== content.relationships.traits.length) errors.push('ids de traço duplicados');
  for (const t of content.relationships.traits) for (const x of [...(t.likes ?? []), ...(t.dislikes ?? [])]) if (!traitIds.has(x)) errors.push(`traço ${t.id}: referência inexistente "${x}"`);
  for (const h of Object.values(content.relationships.hooks)) if (h && !allEventIds.has(h)) errors.push(`hook: evento inexistente "${h}"`);
  // geografia (Etapa 7)
  const siglas = new Set<string>();
  for (const u of content.geo.ufs) {
    if (siglas.has(u.sigla)) errors.push(`UF duplicada: ${u.sigla}`);
    siglas.add(u.sigla);
    const sum = Object.values(u.corRaca).reduce((t, v) => t + v, 0);
    if (Math.abs(sum - 100) > 0.2) errors.push(`UF ${u.sigla}: cor ou raça soma ${sum}`);
    if (u.cities.length < 5) errors.push(`UF ${u.sigla}: menos de 5 cidades`);
    if (!u.cities.some((c) => c.name === u.capital)) errors.push(`UF ${u.sigla}: capital fora da lista de cidades`);
    if (new Set(u.cities.map((c) => c.name)).size !== u.cities.length) errors.push(`UF ${u.sigla}: cidades duplicadas`);
    for (const c of u.cities) if (!(c.populacao > 0) || !(c.custo >= 0.5 && c.custo <= 2)) errors.push(`cidade ${c.name}/${u.sigla}: dados inválidos`);
  }
  // economia
  const ec = content.economy;
  const uniq = (label: string, ids: string[]) => {
    if (new Set(ids).size !== ids.length) errors.push(`ids duplicados em ${label}`);
  };
  uniq('empregos', ec.jobs.map((j) => j.id));
  uniq('bens', ec.assets.map((a) => a.id));
  uniq('empresas', ec.businesses.map((b) => b.id));
  uniq('patrocinadores', ec.sponsors.map((x) => x.id));
  for (const j of ec.jobs) {
    if (j.salary[0] > j.salary[1] || j.salary.some((v) => !Number.isInteger(v))) errors.push(`emprego ${j.id}: salário inválido`);
    if (j.energy < 0 || j.energy > 5) errors.push(`emprego ${j.id}: energia inválida`);
  }
  for (const a of ec.assets) if (a.price[0] > a.price[1] || a.price[0] <= 0) errors.push(`bem ${a.id}: preço inválido`);
  for (const b of ec.businesses) if (!Number.isInteger(b.startCost) || b.revenue <= 0 || b.cost <= 0) errors.push(`empresa ${b.id}: valores inválidos`);
  for (const x of ec.sponsors) if (x.amount <= 0 || x.years <= 0 || x.maxLossStreak < 1) errors.push(`patrocinador ${x.id}: valores inválidos`);
  let last = 0;
  ec.taxBrackets.forEach((b, i) => {
    if (b.rate < 0 || b.rate > 1) errors.push('faixa de imposto com alíquota inválida');
    if (b.upTo === null && i !== ec.taxBrackets.length - 1) errors.push('faixa sem teto precisa ser a última');
    if (b.upTo !== null && b.upTo <= last) errors.push('faixas de imposto fora de ordem');
    if (b.upTo !== null) last = b.upTo;
  });
  for (const h of Object.values(ec.hooks)) if (h && !allEventIds.has(h)) errors.push(`hook: evento inexistente "${h}"`);
  const jobIds = new Set(ec.jobs.map((j) => j.id));
  const bizIds = new Set(ec.businesses.map((b) => b.id));
  for (const e of content.events) {
    for (const j of e.conditions.economy?.jobs ?? []) if (!jobIds.has(j)) errors.push(`${e.id}: emprego inexistente "${j}"`);
    for (const b of e.conditions.economy?.businessDefs ?? []) if (!bizIds.has(b)) errors.push(`${e.id}: empresa inexistente "${b}"`);
    for (const ch of e.choices) for (const fx of [ch.effects, ch.risk?.effects]) {
      if (fx?.move && !['outra_capital', 'mesma_uf'].includes(fx.move.to)) errors.push(`${e.id}: mudança inválida "${fx.move.to}"`);
      const eco = fx?.economy;
      if (eco?.jobOffer && !jobIds.has(eco.jobOffer)) errors.push(`${e.id}: jobOffer inexistente "${eco.jobOffer}"`);
      if (eco?.sellBusinessOffer?.defId && !bizIds.has(eco.sellBusinessOffer.defId)) errors.push(`${e.id}: empresa inexistente`);
      if (fx?.money !== undefined && !Number.isInteger(fx.money)) errors.push(`${e.id}: dinheiro precisa ser inteiro`);
      if (eco?.post && !Number.isInteger(eco.post.amount)) errors.push(`${e.id}: lançamento precisa ser inteiro`);
    }
  }

  // efeitos com chance de gravidez/IST só em eventos 18+
  for (const e of content.events) {
    const fxs = e.choices.flatMap((ch) => [ch.effects, ch.risk?.effects]);
    if (fxs.some((fx) => fx?.social?.pregnancyChance || fx?.social?.ist) && (e.conditions.minAge ?? 0) < 18) errors.push(`${e.id}: gravidez/IST exige minAge >= 18`);
  }
  return errors;
}
