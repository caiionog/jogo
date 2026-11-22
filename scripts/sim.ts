/**
 * Balanceamento da carreira de luta: simula N vidas focadas em luta usando só a engine + conteúdo.
 *   npm run sim            (200 vidas)
 *   npm run sim -- 500     (N vidas)
 */
import { GAME_CONTENT } from '../src/content';
import {
  PLAYER_ID,
  acceptOffer,
  advanceYear,
  autoFinishFight,
  closeFight,
  createRng,
  currentRosterKey,
  enterGym,
  getOrg,
  gymsInCity,
  newGame,
  performAction,
  rankOf,
  resolveEvent,
  trainFighter,
} from '../src/engine';
import type { GameState, Rng, SkillKey } from '../src/engine';

const N = Number(process.argv[2] ?? 200);
const MAX_AGE = 40;
const C = GAME_CONTENT;

/** Escolha nos eventos: carreira de luta primeiro; resto aleatório. */
function chooseEvent(s: GameState, rng: Rng): GameState {
  const p = s.pendingEvents[0]!;
  const ev = C.events.find((e) => e.id === p.eventId)!;
  let choice = ev.choices[0]!;
  if (ev.id === 'adult_path_18') choice = ev.choices.find((c) => c.id === 'fight') ?? choice;
  else if (ev.id === 'fight_doping_offer') choice = ev.choices.find((c) => c.id === 'refuse') ?? choice;
  else if (ev.id === 'fight_offer_titan' || ev.id === 'fight_offer_arc' || ev.id === 'fight_offer_lfm') choice = ev.choices[0]!;
  else if (!ev.id.startsWith('fight_')) choice = rng.pick(ev.choices);
  return resolveEvent(s, ev.id, choice.id, C);
}

function drain(s: GameState, rng: Rng): GameState {
  let g = s;
  for (let i = 0; i < 10 && g.pendingEvents.length; i++) g = chooseEvent(g, rng);
  return g;
}

/** Política: academia cedo, treino com a energia que sobra, aceita todas as lutas. */
function playYear(s0: GameState, rng: Rng): GameState {
  let s = drain(s0, rng);
  if (!s.fighter.gymId && s.character.age >= 5) {
    const gyms = gymsInCity(s, C).filter((g) => g.minAge <= s.character.age);
    const best = gyms.sort((a, b) => b.coach - a.coach)[0];
    if (best && (s.character.age < 18 || s.money >= best.fee || s.fighter.reputation >= 15)) s = enterGym(s, best.id, C);
  }
  // lutas primeiro (as melhores ofertas: maior bolsa)
  const offers = s.fighter.offers.slice().sort((a, b) => b.purse + b.winBonus - (a.purse + a.winBonus));
  for (const o of offers) {
    if (s.energy.current < o.campCost + 1) continue;
    s = acceptOffer(s, o.id, {}, C);
    s = autoFinishFight(s, C);
    s = closeFight(s);
    s = drain(s, rng);
  }
  // treino com o resto da energia: técnica na habilidade mais fraca, jiu-jitsu, condicionamento
  const weakest = () => (['striking', 'wrestling', 'defense'] as SkillKey[]).sort((a, b) => s.fighter.skills[a] - s.fighter.skills[b])[0]!;
  const plan = ['technique', 'conditioning', 'bjj', 'technique', 'sparring', 'conditioning'] as const;
  for (let i = 0; i < 8 && s.energy.current > 0; i++) {
    const before = s.energy.current;
    const kind = s.energy.current >= 2 ? plan[(i + s.character.age) % plan.length]! : 'conditioning';
    s = trainFighter(s, kind, weakest(), C);
    if (s.energy.current === before) s = trainFighter(s, 'conditioning', undefined, C);
    if (s.energy.current === before) s = performAction(s, 'train', C);
    if (s.energy.current === before) break;
    s = drain(s, rng);
  }
  return s;
}

interface Stats {
  proDebut: number[];
  majorDebut: number[];
  reachedMajor: number;
  champion: number;
  majorChampion: number;
  methods: Record<string, number>;
  careerLen: number[];
  proRecords: [number, number, number][];
  black: number;
  amateurWins: number[];
  died: number;
  money: number[];
  peakRank: number[];
}

const st: Stats = { proDebut: [], majorDebut: [], reachedMajor: 0, champion: 0, majorChampion: 0, methods: {}, careerLen: [], proRecords: [], black: 0, amateurWins: [], died: 0, money: [], peakRank: [] };

for (let i = 0; i < N; i++) {
  const rng = createRng(1000 + i);
  let s = newGame({ seed: `sim-${i}`, name: 'Sim Lutador', sex: i % 4 === 3 ? 'F' : 'M' }, C);
  s = { ...s, flags: { ...s.flags, gostaDeLuta: true } };
  let bestRank: number | null = null;
  let champ = false;
  let majorChamp = false;
  while (s.alive && s.character.age < MAX_AGE) {
    s = drain(advanceYear(s, C), rng);
    s = playYear(s, rng);
    const key = currentRosterKey(s, C);
    const roster = key ? s.world.rosters[key] : undefined;
    const r = roster ? rankOf(roster, PLAYER_ID) : null;
    if (r !== null && getOrg(C, s.fighter.orgId)?.tier === 'major') bestRank = bestRank === null ? r : Math.min(bestRank, r);
    if (s.fighter.titles.length) {
      champ = true;
      if (s.fighter.titles.some((t) => getOrg(C, t.orgId)?.tier === 'major')) majorChamp = true;
    }
  }
  const f = s.fighter;
  if (!s.alive) st.died++;
  if (f.proDebutAge !== null) st.proDebut.push(f.proDebutAge);
  if (f.majorDebutAge !== null) {
    st.reachedMajor++;
    st.majorDebut.push(f.majorDebutAge);
  }
  if (champ) st.champion++;
  if (majorChamp) st.majorChampion++;
  if (bestRank !== null) st.peakRank.push(bestRank);
  for (const h of f.history) {
    const org = getOrg(C, h.orgId);
    if (h.result === 'W' && org && (org.tier === 'regional' || org.tier === 'major')) {
      const m = h.method === 'TKO' || h.method === 'DOC' ? 'KO' : h.method;
      st.methods[m] = (st.methods[m] ?? 0) + 1;
    }
  }
  const pro = f.history.filter((h) => ['regional', 'major'].includes(getOrg(C, h.orgId)?.tier ?? ''));
  if (pro.length) st.careerLen.push(pro[pro.length - 1]!.age - pro[0]!.age + 1);
  st.proRecords.push([f.pro.wins, f.pro.losses, f.pro.draws]);
  st.amateurWins.push(f.amateur.wins);
  st.money.push(s.money);
  if (f.belt.rank === 4) st.black++;
}

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const pct = (n: number) => `${((100 * n) / N).toFixed(1)}%`;
const totalW = Object.values(st.methods).reduce((a, b) => a + b, 0);
const median = (a: number[]) => {
  const b = a.slice().sort((x, y) => x - y);
  return b.length ? b[Math.floor(b.length / 2)]! : NaN;
};

console.log(`\n=== Simulação de ${N} vidas focadas em luta (até os ${MAX_AGE} anos) ===`);
console.log(`Estreia profissional ............ ${pct(st.proDebut.length)} | idade média ${avg(st.proDebut).toFixed(1)}`);
console.log(`Chegou à liga principal ......... ${pct(st.reachedMajor)} | idade média de estreia ${avg(st.majorDebut).toFixed(1)}`);
console.log(`Melhor posição no Titã (mediana)  ${median(st.peakRank)}`);
console.log(`Campeão (qualquer liga) ......... ${pct(st.champion)}`);
console.log(`Campeão do Circuito Titã ........ ${pct(st.majorChampion)}`);
console.log(`Faixa preta de jiu-jitsu ........ ${pct(st.black)}`);
console.log(`Vitórias amadoras (média) ....... ${avg(st.amateurWins).toFixed(1)}`);
console.log(`Cartel profissional médio ....... ${avg(st.proRecords.map((r) => r[0])).toFixed(1)}-${avg(st.proRecords.map((r) => r[1])).toFixed(1)}-${avg(st.proRecords.map((r) => r[2])).toFixed(1)}`);
console.log(`Duração da carreira pro (anos) .. ${avg(st.careerLen).toFixed(1)}`);
console.log(`Vitórias pro por método ......... ${Object.entries(st.methods).map(([k, v]) => `${k} ${((100 * v) / totalW).toFixed(0)}%`).join(' · ')}`);
console.log(`Dinheiro aos ${MAX_AGE} (mediana) ...... R$ ${median(st.money).toLocaleString('pt-BR')}`);
console.log(`Morreram antes dos ${MAX_AGE} ......... ${st.died}`);
