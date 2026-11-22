/** Fim de vida (Etapa 6): morte, obituário, nota da vida (legado) e partilha do espólio. */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { netWorth } from '../economy/worth';
import { BELTS } from '../fighting/belts';
import { childrenOf, relationsOf, updatePerson } from '../relationships/people';
import { splitEstate } from './will';
import type { LifeEnding, Obituary } from './types';

const money = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

/** Nota da vida (0–100): carreira, riqueza, família, longevidade e felicidade. */
export function lifeScore(state: GameState): { score: number; parts: Record<string, number> } {
  const f = state.fighter;
  const feats = state.feats;
  const career = Math.min(
    35,
    (feats.majorTitles ?? 0) * 10 + (feats.regionalTitles ?? 0) * 4 + (feats.titleDefenses ?? 0) * 2 + f.pro.wins * 0.4 + (f.belt.rank >= 4 ? 5 : f.belt.rank) + (feats.peakRep ?? f.reputation) / 6,
  );
  const nw = netWorth(state);
  const wealth = nw <= 0 ? 0 : Math.min(20, Math.max(0, (Math.log10(nw) - 4) * 6.5));
  const spouse = relationsOf(state, ['conjuge']).length > 0;
  const kids = childrenOf(state).length;
  const family = Math.min(20, (spouse ? 6 : 0) + Math.min(12, kids * 4) + (state.flags.divorciado ? -2 : 0) + 2);
  const longevity = Math.min(15, (state.character.age / 100) * 15);
  const happiness = Math.min(10, state.character.stats.happiness / 10);
  const parts = {
    carreira: Math.round(career),
    riqueza: Math.round(wealth),
    familia: Math.max(0, Math.round(family)),
    longevidade: Math.round(longevity),
    felicidade: Math.round(happiness),
  };
  const score = Math.max(0, Math.min(100, Object.values(parts).reduce((t, v) => t + v, 0)));
  return { score, parts };
}

/** Momentos marcantes: a primeira ocorrência de cada tipo no log. */
const HIGHLIGHTS: { re: RegExp; max?: number }[] = [
  { re: /novo campeão/ },
  { re: /faixa preta/ },
  { re: /Você se casou/ },
  { re: /Nasceu (seu filho|sua filha)|Chegou (seu filho|sua filha)/ },
  { re: /abriu (a sua própria academia|um negócio)/ },
  { re: /formou|Formatura/ },
  { re: /Você comprou (um|uma) (apartamento|casa)/ },
  { re: /pendurou as luvas|aposentou/ },
  { re: /volta aos ringues/ },
];

export function lifeHighlights(state: GameState, max = 5): string[] {
  const out: string[] = [];
  for (const h of HIGHLIGHTS) {
    for (const y of state.log) {
      const e = y.entries.find((t) => h.re.test(t));
      if (e) {
        out.push(`${y.age} anos — ${e.length > 140 ? `${e.slice(0, 137)}…` : e}`);
        break;
      }
    }
    if (out.length >= max) break;
  }
  return out;
}

export function buildObituary(state: GameState, cause: string): Obituary {
  const c = state.character;
  const f = state.fighter;
  const he = c.sex === 'M';
  const lines: string[] = [];
  const titles = (state.feats.majorTitles ?? 0) + (state.feats.regionalTitles ?? 0);
  const totalFights = f.pro.wins + f.pro.losses + f.pro.draws;
  let headline = `${c.name} (${c.birthYear}–${state.year}) morreu aos ${c.age} anos, de ${cause}.`;
  if ((state.feats.majorTitles ?? 0) > 0) headline = `Morre ${c.name}, ${he ? 'ex-campeão' : 'ex-campeã'} do Circuito Titã, aos ${c.age} anos.`;
  else if (totalFights >= 10) headline = `Morre ${he ? 'o lutador' : 'a lutadora'} ${c.name}, aos ${c.age} anos.`;
  if (totalFights) lines.push(`Cartel profissional: ${f.pro.wins}-${f.pro.losses}-${f.pro.draws}${titles ? `, ${titles} cinturão${titles > 1 ? 'ões' : ''}` : ''}.`);
  if (f.belt.rank > 0) lines.push(`Faixa ${BELTS[f.belt.rank]} de jiu-jitsu.`);
  if (f.retired) lines.push(`Aposentou-se aos ${f.retired.age} anos.`);
  const spouse = relationsOf(state, ['conjuge'])[0];
  const kids = childrenOf(state);
  const fam: string[] = [];
  if (spouse) fam.push(`${spouse.person.sex === 'M' ? 'o marido' : 'a esposa'} ${spouse.person.name}`);
  if (kids.length) fam.push(`${kids.length} ${kids.length === 1 ? (kids[0]!.person.sex === 'M' ? 'filho' : 'filha') : 'filhos'} (${kids.map((k) => k.person.name.split(' ')[0]).join(', ')})`);
  lines.push(fam.length ? `Deixa ${fam.join(' e ')}.` : 'Não deixou herdeiros diretos.');
  lines.push(`Patrimônio: ${money(netWorth(state))}.`);
  if (state.dynasty.generation > 1) lines.push(`${state.dynasty.generation}ª geração da família ${state.dynasty.surname}.`);
  return { headline, lines, highlights: lifeHighlights(state) };
}

/**
 * Morte: encerra a vida, calcula obituário, nota e partilha (testamento ou divisão padrão) e repassa a parte
 * de cada herdeiro NPC ao patrimônio dele. O herdeiro que continuar a história recebe a parte em bens/dinheiro
 * na sucessão (`continueAsChild`).
 */
export function killCharacter(state: GameState, cause: string, content: GameContent): GameState {
  if (!state.alive) return state;
  const c = state.character;
  let s: GameState = {
    ...state,
    alive: false,
    activeFight: null,
    pendingEvents: [],
    scheduledEvents: [],
    energy: { current: 0, max: 0, reserved: 0 },
    character: { ...c, death: { age: c.age, year: state.year, cause } },
  };
  const { score, parts } = lifeScore(s);
  const estate = splitEstate(s, content);
  // os herdeiros recebem a parte no patrimônio deles
  for (const h of estate.heirs) if (h.amount > 0) s = updatePerson(s, h.personId, (p) => ({ ...p, wealth: (p.wealth ?? 0) + h.amount }));
  const ending: LifeEnding = {
    age: c.age,
    year: state.year,
    cause,
    score,
    scoreParts: parts,
    obituary: buildObituary(s, cause),
    estate: { gross: estate.gross, tax: estate.tax, net: estate.net, byWill: estate.byWill },
    heirs: estate.heirs,
  };
  s = { ...s, ending };
  return appendLog(s, `Você faleceu aos ${c.age} anos (${cause}). Fim da jornada.`);
}
