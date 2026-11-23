/** Ações de relacionamento na tela de detalhe da pessoa. */
import type { GameContent } from '../core/content';
import { createRng } from '../core/rng';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { addStats, appendLog } from '../core/stats';
import { adultContentAllowed, canDate, canMarry } from './guards';
import { breakUp, canConceive, divorce, ADOPTION_COST, startPregnancy } from './romance';
import { changeAffection, firstName, getPerson, getRelation, relLabel, updatePerson, updateRelation, withHistory } from './people';
import type { InteractionKind, Person, Relation } from './types';
import { post } from '../economy/ledger';
import { moneyFromParent } from '../economy/family';
import { bumpUse, repeatMultiplier } from '../lifeStages/sessions';

export const GIFT_COST = 200;

export const INTERACTION_LABEL: Record<InteractionKind, string> = {
  spend_time: 'Passar tempo junto',
  talk: 'Conversar',
  compliment: 'Elogiar',
  argue: 'Discutir',
  gift: `Dar um presente (R$ ${GIFT_COST})`,
  ask_money: 'Pedir dinheiro',
  teach_fight: 'Ensinar luta',
  date: 'Sair para um encontro',
  ask_out: 'Pedir em namoro',
  propose: 'Pedir em casamento',
  break_up: 'Terminar',
  divorce: 'Pedir o divórcio',
  intimacy: 'Noite a dois (sem proteção)',
  intimacy_protected: 'Noite a dois (com proteção)',
  try_baby: 'Tentar ter um filho',
  adopt: `Adotar uma criança (R$ ${ADOPTION_COST.toLocaleString('pt-BR')})`,
};

/** Ações que envolvem sexo: SEMPRE exigem canHaveSexualContent (os dois com 18+). */
export const SEXUAL_INTERACTIONS: readonly InteractionKind[] = ['intimacy', 'intimacy_protected', 'try_baby'];
/** Ações com texto adulto: além da idade, exigem a opção "Conteúdo adulto" ligada. */
export const ADULT_INTERACTIONS: readonly InteractionKind[] = ['intimacy', 'intimacy_protected'];

export type InteractionBlockReason =
  | 'dead'
  | 'person-dead'
  | 'busy'
  | 'no-money'
  | 'not-applicable'
  | 'too-young'
  | 'adult-off'
  | 'stage'
  | 'asked';

/** Ações que fazem sentido para a relação (a UI mostra só estas). */
export function applicableInteractions(state: GameState, person: Person, rel: Relation): InteractionKind[] {
  const out: InteractionKind[] = ['spend_time', 'talk', 'compliment', 'argue', 'gift'];
  if (rel.type === 'pai' || rel.type === 'mae') out.push('ask_money');
  if (rel.type === 'filho' && person.age >= 4) out.push('teach_fight');
  const stage = rel.romance?.stage;
  if (stage) {
    out.push('date');
    if (stage === 'ficando') out.push('ask_out');
    if (stage === 'namorando' && canMarry(state.character.age, person.age)) out.push('propose');
    if (stage === 'casados') out.push('divorce');
    else out.push('break_up');
    if (adultContentAllowed(state, person)) out.push('intimacy_protected', 'intimacy');
    // planejamento familiar: não é texto explícito, mas exige os dois com 18+ (canConceive → canHaveSexualContent)
    if ((stage === 'casados' || stage === 'noivos') && canConceive(state, person)) out.push('try_baby');
    if (stage === 'casados' && !state.relationships.pregnancy) out.push('adopt');
  }
  return out;
}

export function interactionBlockReason(state: GameState, personId: string, kind: InteractionKind): InteractionBlockReason | null {
  const person = getPerson(state, personId);
  const rel = getRelation(state, personId);
  if (!state.alive) return 'dead';
  if (!person || !rel || !person.alive) return 'person-dead';
  if (state.pendingEvents.length > 0 || state.activeFight) return 'busy';
  if (!applicableInteractions(state, person, rel).includes(kind)) {
    if (ADULT_INTERACTIONS.includes(kind) && !state.relationships.settings.adultContent) return 'adult-off';
    if (SEXUAL_INTERACTIONS.includes(kind)) return 'too-young';
    return 'not-applicable';
  }
  if (state.character.age < 3 && kind !== 'spend_time') return 'too-young';
  if (rel.romance && !canDate(state.character.age)) return 'too-young';
  if (kind === 'ask_money' && person.flags.pediu_dinheiro === state.year) return 'asked';
  if (kind === 'gift' && state.money < GIFT_COST) return 'no-money';
  if (kind === 'adopt' && state.money < ADOPTION_COST) return 'no-money';
  return null;
}

/** Multiplicador dos traços para uma ação. */
function traitMult(person: Person, kind: InteractionKind, content: GameContent): number {
  let m = 1;
  for (const t of person.traits) m *= content.relationships.traits.find((d) => d.id === t)?.actionMods?.[kind] ?? 1;
  return m;
}

function hasTrait(p: Person, id: string) {
  return p.traits.includes(id);
}

/** Executa a ação. Estado inalterado se bloqueada. */
export function interact(state: GameState, personId: string, kind: InteractionKind, content: GameContent): GameState {
  if (interactionBlockReason(state, personId, kind) !== null) return state;
  const rng = createRng(state.rngState);
  const person = getPerson(state, personId)!;
  const rel = getRelation(state, personId)!;
  // sem custo, mas repetir a mesma ação com a mesma pessoa no ano rende menos
  const key = interactionUseKey(kind, personId);
  const rep = repeatMultiplier(state, key, content);
  let s: GameState = bumpUse(state, key);
  s = updateRelation(s, personId, (r) => ({ ...r, interactedYear: state.year }));
  s = runInteraction(s, person, rel, kind, rng, content, rep);
  s = checkTypeShift(s, personId);
  return { ...s, rngState: rng.state };
}

function gain(rng: Rng, lo: number, hi: number, mult: number) {
  return Math.round(rng.int(lo, hi) * mult);
}

/** Chave do retorno decrescente de uma interação (`yearUses`): por ação e por pessoa. */
export function interactionUseKey(kind: InteractionKind, personId: string): string {
  return `rel:${kind}:${personId}`;
}

function runInteraction(state: GameState, person: Person, rel: Relation, kind: InteractionKind, rng: Rng, content: GameContent, rep = 1): GameState {
  let s = state;
  const n = firstName(person.name);
  // ganhos de afeto: traços × retorno decrescente da repetição no ano
  const m = traitMult(person, kind, content) * rep;
  const happy = (d: number) => {
    s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: d }) } };
  };
  switch (kind) {
    case 'spend_time': {
      s = changeAffection(s, person.id, gain(rng, 4, 8, m), 'Passaram um tempo juntos.');
      happy(2);
      return appendLog(s, `Você passou um tempo com ${n}.`);
    }
    case 'talk': {
      s = changeAffection(s, person.id, gain(rng, 2, 5, m), 'Conversaram.');
      if (rel.revealed < person.traits.length) {
        s = updateRelation(s, person.id, (r) => ({ ...r, revealed: r.revealed + 1 }));
        const t = content.relationships.traits.find((d) => d.id === person.traits[rel.revealed]);
        if (t) return appendLog(s, `Conversando com ${n}, você percebeu que é uma pessoa ${t.label.toLowerCase()}.`);
      }
      return appendLog(s, `Você teve uma boa conversa com ${n}.`);
    }
    case 'compliment': {
      if (rng.chance(0.12)) {
        s = changeAffection(s, person.id, -3, 'Achou o elogio falso.');
        return appendLog(s, `${n} achou seu elogio forçado.`);
      }
      s = changeAffection(s, person.id, gain(rng, 3, 7, m), 'Recebeu um elogio.');
      return appendLog(s, `Você elogiou ${n}, que abriu um sorriso.`);
    }
    case 'argue': {
      const loss = Math.round(rng.int(8, 15) * (hasTrait(person, 'explosivo') ? 1.6 : 1) * (hasTrait(person, 'tranquilo') ? 0.6 : 1));
      s = changeAffection(s, person.id, -loss, 'Discutiram.');
      happy(-2);
      const after = getRelation(s, person.id)!;
      if (after.romance && after.romance.stage !== 'casados' && after.affection < 20 && rng.chance(0.5)) return breakUp(appendLog(s, `A discussão com ${n} foi feia.`), person.id, true);
      return appendLog(s, hasTrait(person, 'explosivo') ? `A discussão com ${n} virou briga feia.` : `Você discutiu com ${n}.`);
    }
    case 'gift': {
      s = post(s, 'compras', -GIFT_COST, `Presente para ${n}`);
      s = changeAffection(s, person.id, gain(rng, 4, 9, m), 'Ganhou um presente.');
      return appendLog(s, `Você deu um presente para ${n}.`);
    }
    case 'ask_money': {
      s = updatePerson(s, person.id, (p) => ({ ...p, flags: { ...p.flags, pediu_dinheiro: s.year } }));
      const chance = 0.2 + (s.character.familyWealth / 100) * 0.4 + rel.affection / 300;
      if (rng.chance(chance)) {
        // sai do patrimônio real dos pais (Etapa 5)
        const res = moneyFromParent(s, person.id, rng);
        if (res.amount > 0) return appendLog(res.state, `${n} te deu R$ ${res.amount.toLocaleString('pt-BR')}.`);
      }
      s = changeAffection(s, person.id, -4);
      return appendLog(s, `${n} disse que não dá para ajudar com dinheiro agora.`);
    }
    case 'teach_fight': {
      const ath = rng.int(3, 6);
      s = updatePerson(s, person.id, (p) => ({ ...p, athletic: Math.min(100, p.athletic + ath) }));
      s = changeAffection(s, person.id, gain(rng, 3, 6, 1), 'Treinaram juntos.');
      const p = 0.25 + (s.fighter.reputation / 400);
      if (!person.flags.interesse_luta && rng.chance(p)) {
        s = updatePerson(s, person.id, (x) => ({ ...x, flags: { ...x.flags, interesse_luta: true } }));
        return appendLog(s, `${n} adorou o treino e agora sonha em lutar como você!`);
      }
      return appendLog(s, `Você ensinou alguns golpes para ${n}.`);
    }
    case 'date': {
      // depois de casados, encontros rendem um pouco menos (rotina)
      s = changeAffection(s, person.id, gain(rng, 5, 10, m * (rel.romance?.stage === 'casados' ? 0.6 : 1)), 'Saíram juntos.');
      happy(3);
      return appendLog(s, `Você saiu com ${n} ${rng.pick(['para jantar', 'para o cinema', 'para ver o pôr do sol', 'para dançar'])}.`);
    }
    case 'ask_out': {
      if (rng.chance(0.3 + rel.affection / 150)) {
        s = updateRelation(s, person.id, (r) => withHistory({ ...r, romance: { stage: 'namorando', since: s.character.age } }, 'Começaram a namorar.'));
        happy(5);
        return appendLog(s, `Você e ${n} estão namorando!`);
      }
      s = changeAffection(s, person.id, -5);
      return appendLog(s, `${n} disse que ainda não quer namorar sério.`);
    }
    case 'propose': {
      const chance = 0.15 + rel.affection / 120 + (hasTrait(person, 'leal') ? 0.1 : 0);
      if (rel.affection >= 50 && rng.chance(chance)) {
        s = updateRelation(s, person.id, (r) => withHistory({ ...r, romance: { stage: 'noivos', since: s.character.age } }, 'Ficaram noivos.'));
        happy(8);
        s = appendLog(s, `${n} disse SIM! Vocês estão noivos.`);
        const hook = content.relationships.hooks.weddingEventId;
        if (hook) s = { ...s, pendingEvents: [...s.pendingEvents, { eventId: hook, source: 'action', vars: { pessoa: n, pessoa_nome: person.name, pessoa_id: person.id } }] };
        return s;
      }
      s = changeAffection(s, person.id, -10, 'Recusou o pedido.');
      happy(-6);
      return appendLog(s, `${n} recusou o pedido de casamento.`);
    }
    case 'break_up':
      return breakUp(s, person.id);
    case 'divorce':
      return divorce(s, person.id);
    case 'intimacy':
    case 'intimacy_protected':
      return intimacy(s, person, kind === 'intimacy_protected', rng, content);
    case 'try_baby': {
      if (!canConceive(s, person)) return s;
      s = changeAffection(s, person.id, gain(rng, 3, 6, 1));
      if (rng.chance(0.45)) return startPregnancy(s, person.id, content);
      return appendLog(s, `Você e ${n} estão tentando ter um filho. Ainda não foi desta vez.`);
    }
    case 'adopt': {
      s = post(s, 'compras', -ADOPTION_COST, 'Processo de adoção');
      return startPregnancy(s, person.id, content, true);
    }
  }
}

/** Noite a dois — exige adultContentAllowed (canHaveSexualContent). Texto sugestivo, nunca gráfico. */
function intimacy(state: GameState, person: Person, protectedSex: boolean, rng: Rng, content: GameContent): GameState {
  if (!adultContentAllowed(state, person)) return state;
  let s = changeAffection(state, person.id, rng.int(5, 10), 'Noite a dois.');
  s = { ...s, character: { ...s.character, stats: addStats(s.character.stats, { happiness: 4 }) } };
  s = appendLog(s, `Você e ${firstName(person.name)} tiveram uma noite especial${protectedSex ? '' : ', sem se proteger'}.`);
  const rel = getRelation(s, person.id);
  const newPartner = rel ? s.character.age - rel.since <= 1 : true;
  const ist = protectedSex ? 0.005 : newPartner ? 0.05 : 0.01;
  if (rng.chance(ist)) s = contractIst(s);
  if (canConceive(s, person) && rng.chance(protectedSex ? 0.02 : 0.25)) s = startPregnancy(s, person.id, content);
  return s;
}

export function contractIst(state: GameState): GameState {
  const s: GameState = {
    ...state,
    flags: { ...state.flags, ist: true },
    character: { ...state.character, stats: addStats(state.character.stats, { health: -10, happiness: -5 }) },
  };
  return appendLog(s, 'Você pegou uma infecção sexualmente transmissível e precisou de tratamento.');
}

/** Rival com afeto alto vira amigo; amigo com afeto muito baixo vira rival. */
export function checkTypeShift(state: GameState, personId: string): GameState {
  const rel = getRelation(state, personId);
  const person = getPerson(state, personId);
  if (!rel || !person) return state;
  if (rel.type === 'rival' && rel.affection >= 60) {
    const s = updateRelation(state, personId, (r) => withHistory({ ...r, type: 'amigo' }, 'Viraram amigos.'));
    return appendLog(s, `${person.name} deixou de ser rival e virou ${relLabel('amigo', person.sex).toLowerCase()}.`);
  }
  if ((rel.type === 'amigo' || rel.type === 'colega_treino') && rel.affection <= 5) {
    const s = updateRelation(state, personId, (r) => withHistory({ ...r, type: 'rival' }, 'Viraram inimigos.'));
    return appendLog(s, `Você e ${person.name} viraram inimigos.`);
  }
  return state;
}
