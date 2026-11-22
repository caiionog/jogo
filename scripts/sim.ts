/**
 * Balanceamento da carreira de luta: simula N vidas focadas em luta usando só a engine + conteúdo.
 *   npm run sim            (500 vidas)
 *   npm run sim -- 500     (N vidas)
 */
import { GAME_CONTENT } from '../src/content';
import {
  PLAYER_ID,
  acceptOffer,
  advanceYear,
  autoFinishFight,
  applyJob,
  buyAsset,
  dedicate,
  deposit,
  expandBusiness,
  financingQuote,
  jobBlockReason,
  marketOffers,
  netWorth,
  openBusiness,
  salaryOf,
  setHousing,
  setStandard,
  workHard,
  businessDef,
  expandCost,
  childrenOf,
  civilStatus,
  currentPartner,
  interact,
  meetSomeone,
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
import { withdraw as withdrawFn } from '../src/engine';

const N = Number(process.argv[2] ?? 500);
/** Vidas por perfil econômico (até os 70). */
const M = Number(process.argv[3] ?? 150);
const MAX_AGE = 40;
const C = GAME_CONTENT;

/** Escolha nos eventos: carreira de luta primeiro; resto aleatório. */
function chooseEvent(s: GameState, rng: Rng): GameState {
  const p = s.pendingEvents[0]!;
  const ev = C.events.find((e) => e.id === p.eventId)!;
  let choice = ev.choices[0]!;
  if (ev.id === 'adult_path_18') choice = ev.choices.find((c) => c.id === 'fight') ?? choice;
  else if (ev.id === 'rel_wedding') choice = ev.choices.find((c) => c.id === 'simple') ?? choice;
  else if (ev.id === 'rel_proposal_moment') choice = ev.choices.find((c) => c.id === 'ask') ?? choice;
  else if (ev.id === 'rel_want_child') choice = ev.choices.find((c) => c.id === (rng.chance(0.75) ? 'try' : 'later')) ?? choice;
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
  // casal que quer filhos tenta antes de gastar a energia com camps
  const q = currentPartner(s);
  const kids = childrenOf(s).length;
  if (q && q.rel.romance?.stage === 'casados' && kids < 3 && s.character.age >= 24 && rng.chance(kids === 0 ? 0.6 : 0.25)) {
    s = drain(interact(s, q.person.id, 'try_baby', C), rng);
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
  // vida amorosa: ~1 de energia por ano (a partir dos 16) — o resto vai para o treino
  if (s.character.age >= 16 && !s.pendingEvents.length && rng.chance(Number(process.env.ROMANCE ?? 0.7))) {
    const p = currentPartner(s);
    if (!p) {
      if (rng.chance(0.6)) s = meetSomeone(s, s.character.age >= 18 && rng.chance(0.5) ? 'app' : 'social', C, rng);
    } else {
      const stage = p.rel.romance?.stage;
      const together = s.character.age - p.rel.romance!.since;
      if (stage === 'ficando') s = interact(s, p.person.id, 'ask_out', C);
      else if (stage === 'namorando' && s.character.age >= 22 && together >= 2 && p.rel.affection >= 55 && rng.chance(0.5)) s = interact(s, p.person.id, 'propose', C);
      else s = interact(s, p.person.id, 'date', C);
      s = drain(s, rng);
    }
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
  married: number;
  marriageAge: number[];
  divorced: number;
  children: number[];
  saveKB80: number[];
  people80: number[];
  fightsMarried: [number, number];
  fightsSingle: [number, number];
  yearsMarried: number;
  yearsSingle: number;
}

const st: Stats = { proDebut: [], majorDebut: [], reachedMajor: 0, champion: 0, majorChampion: 0, methods: {}, careerLen: [], proRecords: [], black: 0, amateurWins: [], died: 0, money: [], peakRank: [], married: 0, marriageAge: [], divorced: 0, children: [], saveKB80: [], people80: [], fightsMarried: [0, 0], fightsSingle: [0, 0], yearsMarried: 0, yearsSingle: 0 };

for (let i = 0; i < N; i++) {
  const rng = createRng(1000 + i);
  const sex = i % 4 === 3 ? 'F' : 'M';
  // população: ~90% procura o sexo oposto, ~10% o mesmo sexo ou ambos
  const preference = i % 10 === 0 ? 'any' : sex === 'M' ? 'F' : 'M';
  let s = newGame({ seed: `sim-${i}`, name: 'Sim Lutador', sex, adultContent: i % 2 === 0, preference }, C);
  let marriedAt: number | null = null;
  s = { ...s, flags: { ...s.flags, gostaDeLuta: true } };
  let bestRank: number | null = null;
  let champ = false;
  let majorChamp = false;
  while (s.alive && s.character.age < MAX_AGE) {
    const wasMarried = civilStatus(s) === 'casado';
    const before = s.fighter.history.length;
    s = drain(advanceYear(s, C), rng);
    s = playYear(s, rng);
    if (marriedAt === null && civilStatus(s) === 'casado') marriedAt = s.character.age;
    if (s.character.age >= 20) {
      const pro = s.fighter.history.slice(before).filter((h) => h.pro && h.result !== 'D');
      const wins = pro.filter((h) => h.result === 'W').length;
      const bucket = wasMarried ? st.fightsMarried : st.fightsSingle;
      bucket[0] += wins;
      bucket[1] += pro.length;
      if (wasMarried) st.yearsMarried++;
      else st.yearsSingle++;
    }
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
  if (marriedAt !== null) {
    st.married++;
    st.marriageAge.push(marriedAt);
  }
  if (s.flags.divorciado) st.divorced++;
  st.children.push(childrenOf(s).length);
  // subamostra: continua a vida até os 80 para medir o tamanho do save
  if (i < 60) {
    let old = s;
    while (old.alive && old.character.age < 80) old = playYear(drain(advanceYear(old, C), rng), rng);
    st.saveKB80.push(JSON.stringify(old).length / 1024);
    st.people80.push(old.relationships.people.length);
  }
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
console.log('--- Relacionamentos ---');
console.log(`Casou até os ${MAX_AGE} .............. ${pct(st.married)} | idade média ${avg(st.marriageAge).toFixed(1)}`);
console.log(`Divorciou (dos casados) ......... ${((100 * st.divorced) / Math.max(1, st.married)).toFixed(1)}%`);
console.log(`Filhos aos ${MAX_AGE} (média) .......... ${avg(st.children).toFixed(2)} | sem filhos ${pct(st.children.filter((c) => c === 0).length)}`);
const rate = (x: [number, number]) => (x[1] ? `${((100 * x[0]) / x[1]).toFixed(1)}%` : '—');
console.log(`Aproveitamento pro casado/solteiro ${rate(st.fightsMarried)} / ${rate(st.fightsSingle)}`);
console.log(`Lutas pro por ano casado/solteiro ${(st.fightsMarried[1] / Math.max(1, st.yearsMarried)).toFixed(2)} / ${(st.fightsSingle[1] / Math.max(1, st.yearsSingle)).toFixed(2)}`);
console.log(`Save aos 80 anos (${st.saveKB80.length} vidas) ... média ${avg(st.saveKB80).toFixed(0)} KB · máx ${Math.max(...st.saveKB80).toFixed(0)} KB · pessoas ativas ${avg(st.people80).toFixed(1)}`);


// ===========================================================================
// Perfis econômicos (vidas até os 70)
// ===========================================================================
type Profile = 'luta' | 'emprego' | 'misto' | 'empreendedor';
const PROFILES: Profile[] = ['luta', 'emprego', 'misto', 'empreendedor'];

/** Escolhe a melhor vaga disponível (maior salário inicial) dentro de uma lista de categorias. */
function bestJob(s: GameState, cats: string[]): string | undefined {
  return C.economy.jobs
    .filter((j) => cats.includes(j.category) && jobBlockReason(s, j) === null)
    .sort((a, b) => salaryOf(b, 1) - salaryOf(a, 1))[0]?.id;
}

/** Gestão de dinheiro comum a todos os perfis: moradia, padrão de vida, reserva e investimentos, casa própria. */
function manageMoney(s0: GameState, rng: Rng): GameState {
  let s = s0;
  const age = s.character.age;
  if (age >= 18) {
    // sai da casa dos pais aos 24 se der para pagar; volta se estiver endividado
    if (age >= 24 && s.economy.housing === 'pais' && s.economy.debt === 0 && s.economy.lastIncome > 40000) s = setHousing(s, 'aluguel');
    if (s.economy.debt > 0 && s.economy.housing === 'aluguel') s = setHousing(s, 'pais');
    const nw = netWorth(s);
    const inc = s.economy.lastIncome;
    s = setStandard(s, nw > 4_000_000 && inc > 250_000 ? 'luxo' : nw > 300_000 && inc > 70_000 ? 'confortavel' : 'simples');
    // casa própria financiada a partir dos 28, se couber no bolso
    if (age >= 28 && !s.economy.assets.some((a) => a.kind === 'imovel')) {
      const offer = marketOffers(s, C).filter((o) => o.defId === 'apartamento').sort((a, b) => a.price - b.price)[0];
      if (offer) {
        const q = financingQuote(offer, 20);
        if (q && s.money >= q.downPayment + 15000 && q.installment <= s.economy.lastIncome * 0.3) {
          s = buyAsset(s, offer.id, C, { financed: true, years: 20 });
          const home = s.economy.assets.find((a) => a.kind === 'imovel');
          if (home) s = { ...s, economy: { ...s.economy, housing: 'propria', assets: s.economy.assets.map((a) => (a.id === home.id ? { ...a, home: true } : a)) } };
        }
      }
    }
    // reserva de emergência (1,5× os gastos do último ano) e o resto investido
    const lastYear = s.economy.history.at(-1);
    const spent = lastYear ? -Object.values(lastYear.totals).filter((v) => (v ?? 0) < 0).reduce((t, v) => t + (v ?? 0), 0) : 30000;
    const reserve = Math.max(30000, Math.round(spent * 1.5));
    if (s.money > reserve * 2) {
      const extra = s.money - reserve;
      s = deposit(s, extra * 0.5, 'investments');
      s = deposit(s, extra * 0.3, 'savings');
    }
  }
  void rng;
  return s;
}

interface EcoStats {
  nw: Record<number, number[]>;
  bankrupt: number;
  millionaire50: number;
  millionaireEver: number;
  bizOpened: number;
  bizFailed: number;
  lives: number;
}

const eco = Object.fromEntries(
  PROFILES.map((p) => [p, { nw: { 30: [], 50: [], 70: [] }, bankrupt: 0, millionaire50: 0, millionaireEver: 0, bizOpened: 0, bizFailed: 0, lives: 0 }]),
) as unknown as Record<Profile, EcoStats>;
const fightIncome = { champion: [] as number[], regional: [] as number[], major: [] as number[] };

function ecoYear(s0: GameState, profile: Profile, rng: Rng): GameState {
  let s = drain(s0, rng);
  const age = s.character.age;
  // emprego conforme o perfil
  if (!s.economy.job && age >= 16) {
    const cats = profile === 'luta' ? (age > 40 ? ['luta', 'formal', 'meio_periodo'] : []) : profile === 'misto' ? (age >= 18 ? ['luta', 'meio_periodo'] : ['meio_periodo']) : ['formal', 'meio_periodo'];
    const id = cats.length ? bestJob(s, cats) : undefined;
    if (id) s = drain(applyJob(s, id, C), rng);
  } else if (s.economy.job && profile !== 'luta') {
    // troca por uma vaga melhor
    const better = bestJob(s, profile === 'misto' ? ['luta', 'meio_periodo'] : ['formal']);
    const cur = C.economy.jobs.find((j) => j.id === s.economy.job!.jobId)!;
    if (better && better !== cur.id && salaryOf(C.economy.jobs.find((j) => j.id === better)!, 1) > salaryOf(cur, s.economy.job.level) * 1.2) s = drain(applyJob(s, better, C), rng);
  }
  // empreendedor: abre a empresa quando tiver o capital (25+) e cuida dela
  if (profile === 'empreendedor' && age >= 25) {
    if (!s.economy.businesses.length && !s.flags.empresa_aberta_sim) {
      const defId = rng.pick(['academia', 'suplementos', 'roupa', 'restaurante', 'lava_jato']);
      const def = businessDef(C, defId)!;
      if (s.money + s.economy.savings + s.economy.investments >= def.startCost * 1.3) {
        // resgata o que precisar
        if (s.money < def.startCost) {
          const need = def.startCost - s.money;
          s = { ...s };
          const fromSav = Math.min(s.economy.savings, need);
          if (fromSav) s = drain(requireWithdraw(s, fromSav, 'savings'), rng);
          if (s.money < def.startCost) s = requireWithdraw(s, def.startCost - s.money + 1000, 'investments');
        }
        const before = s.economy.businesses.length;
        s = openBusiness(s, defId, C);
        if (s.economy.businesses.length > before) {
          eco[profile].bizOpened++;
          s = { ...s, flags: { ...s.flags, empresa_aberta_sim: true } };
        }
      }
    }
    for (const b of s.economy.businesses) {
      s = dedicate(s, b.id);
      const def = businessDef(C, b.defId)!;
      if (b.cash > expandCost(def, b.level) * 1.5 && s.money > expandCost(def, b.level) && b.lastProfit > 0) s = expandBusiness(s, b.id, C);
    }
  }
  // lutas (perfis luta e misto)
  // lutadores se aposentam aos 40 (a engine ainda não tem aposentadoria; gancho `pensa_aposentar`)
  if ((profile === 'luta' || profile === 'misto') && age <= 40) s = playYear(s, rng);
  else {
    // trabalha duro com a energia que sobra
    for (let k = 0; k < 3 && s.economy.job; k++) s = workHard(s);
  }
  return manageMoney(drain(s, rng), rng);
}

function requireWithdraw(s: GameState, amount: number, where: 'savings' | 'investments'): GameState {
  return withdrawFn(s, amount, where);
}

const failedBefore = (s: GameState) => Number(s.flags.empresa_faliu) || 0;

for (const profile of PROFILES) {
  for (let i = 0; i < M; i++) {
    const rng = createRng(70000 + i * 7 + PROFILES.indexOf(profile));
    const sex = i % 4 === 3 ? 'F' : 'M';
    let s = newGame({ seed: `eco-${profile}-${i}`, name: 'Sim Econômico', sex, preference: sex === 'M' ? 'F' : 'M' }, C);
    if (profile === 'luta' || profile === 'misto') s = { ...s, flags: { ...s.flags, gostaDeLuta: true } };
    let ever = false;
    while (s.alive && s.character.age < 70) {
      s = drain(advanceYear(s, C), rng);
      s = ecoYear(s, profile, rng);
      const age = s.character.age;
      const nw = netWorth(s);
      if (nw >= 1_000_000) ever = true;
      if (age === 30 || age === 50 || age === 70) eco[profile].nw[age]!.push(nw);
      if (age === 50 && nw >= 1_000_000) eco[profile].millionaire50++;
      // renda anual da luta (bolsas + patrocínios) por status
      if (profile === 'luta' && age >= 20 && age <= 40) {
        const h = s.economy.history.at(-1);
        if (h) {
          const inc = (h.totals.luta ?? 0) + (h.totals.patrocinio ?? 0) + (h.totals.agente ?? 0);
          const org = getOrg(C, s.fighter.orgId);
          if (s.fighter.titles.some((t) => getOrg(C, t.orgId)?.tier === 'major')) fightIncome.champion.push(inc);
          else if (org?.tier === 'major') fightIncome.major.push(inc);
          else if (org?.tier === 'regional') fightIncome.regional.push(inc);
        }
      }
    }
    eco[profile].lives++;
    if (Number(s.flags.falencia) > 0) eco[profile].bankrupt++;
    if (ever) eco[profile].millionaireEver++;
    eco[profile].bizFailed += failedBefore(s);
  }
}

const fmt = (v: number) => (Number.isFinite(v) ? `R$ ${Math.round(v).toLocaleString('pt-BR')}` : '—');
console.log(`\n=== Economia: ${M} vidas por perfil, até os 70 anos ===`);
console.log('Perfil         | Patrimônio médio (mediana)  30 · 50 · 70                         | Falência | Milionário aos 50 / alguma vez');
for (const p of PROFILES) {
  const e = eco[p];
  const cell = (age: number) => `${fmt(avg(e.nw[age]!))} (${fmt(median(e.nw[age]!))})`;
  console.log(`${p.padEnd(14)} | ${cell(30)} · ${cell(50)} · ${cell(70)} | ${((100 * e.bankrupt) / e.lives).toFixed(1)}% | ${((100 * e.millionaire50) / e.lives).toFixed(1)}% / ${((100 * e.millionaireEver) / e.lives).toFixed(1)}%`);
}
const opened = eco.empreendedor.bizOpened;
console.log(`Empresas abertas (empreendedor): ${opened} · quebraram ${eco.empreendedor.bizFailed} (${opened ? ((100 * eco.empreendedor.bizFailed) / opened).toFixed(1) : '—'}%)`);
console.log(`Renda anual da luta (bolsas + patrocínios − empresário): campeão do Titã ${fmt(avg(fightIncome.champion))} · Titã ${fmt(avg(fightIncome.major))} · regional ${fmt(avg(fightIncome.regional))}`);
