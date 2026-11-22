/** Efeitos `economy` dos eventos. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { EventVars, GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { loseAsset } from '../assets/assets';
import { sellBusiness, businessValue } from './business';
import { setRegime } from './family';
import { deposit } from './bank';
import { relationsOf, updatePerson, firstName } from '../relationships/people';
import { fireAgent, hireAgent, signSponsor } from './fightIncome';
import { jobDef, salaryOf } from './jobs';
import { post, toMoney } from './ledger';
import type { AssetKind, LedgerCategory, Regime } from './types';

export interface EconomyEffects {
  /** Lançamento com categoria (valor inteiro com sinal). */
  post?: { cat: LedgerCategory; amount: number; label: string };
  /** Lançamento proporcional ao dinheiro atual (ex.: −0.3 = perde 30% do saldo). */
  postShareOfMoney?: { cat: LedgerCategory; share: number; label: string };
  hireAgent?: boolean;
  fireAgent?: boolean;
  /** Empresário some com parte das bolsas do ano. */
  agentScam?: boolean;
  signSponsor?: 'best';
  cancelSponsors?: boolean;
  loseJob?: string;
  promote?: boolean;
  /** Oferta de emprego aceita na hora (ex.: comentarista de TV). */
  jobOffer?: string;
  /** Dano num bem do tipo (percentual do valor, pago como manutenção). */
  assetDamage?: { kind: AssetKind; share: number; label: string };
  /** Perde o veículo (roubo) se não tiver seguro; com seguro, recebe o valor. */
  vehicleTheft?: boolean;
  /** Perde parte das aplicações no índice (golpe/pirâmide). */
  investLoss?: number;
  /** Vende a primeira empresa (ou a academia) por um múltiplo do valor. */
  sellBusinessOffer?: { defId?: string; multiple: number };
  /** Multa de malha fina: cobra o imposto sonegado + 75%. */
  taxFine?: boolean;
  /** Sonega metade do imposto deste ano. */
  evade?: boolean;
  /** Empresta dinheiro à pessoa-alvo; devolução com chance. */
  lend?: { amount: number; repayChance: number };
  /** Herança de parente distante (valor sorteado). */
  inherit?: [number, number];
  regime?: Regime;
  /** Aplica uma fração do saldo no índice / na poupança. */
  investShare?: number;
  savingsShare?: number;
  /** Ajuda dos pais: até 5% do patrimônio do mais rico (máx. R$ 100 mil). */
  parentGift?: boolean;
}

export function applyEconomyEffects(state: GameState, fx: EconomyEffects, rng: Rng, content: GameContent, vars?: EventVars): GameState {
  let s = state;
  if (fx.post) s = post(s, fx.post.cat, fx.post.amount, fx.post.label);
  if (fx.postShareOfMoney && s.money > 0) s = post(s, fx.postShareOfMoney.cat, s.money * fx.postShareOfMoney.share, fx.postShareOfMoney.label);
  if (fx.hireAgent) s = hireAgent(s, rng, content);
  if (fx.agentScam && s.economy.agent) {
    const fights = s.economy.ledger.entries.filter((e) => e.cat === 'luta').reduce((t, e) => t + e.amount, 0);
    const stolen = Math.min(Math.max(0, s.money), toMoney(Math.max(5000, fights * 0.5)));
    if (stolen > 0) s = post(s, 'agente', -stolen, `Desfalque do empresário ${s.economy.agent.name}`);
    s = fireAgent(s);
  }
  if (fx.fireAgent) s = fireAgent(s);
  if (fx.signSponsor) s = signSponsor(s, content);
  if (fx.cancelSponsors && s.economy.sponsors.length) {
    s = appendLog({ ...s, economy: { ...s.economy, sponsors: [] } }, 'Seus patrocinadores cancelaram os contratos.');
  }
  if (fx.loseJob && s.economy.job) s = appendLog({ ...s, economy: { ...s.economy, job: null } }, fx.loseJob);
  if (fx.promote && s.economy.job && s.economy.job.level < 5) {
    const job = s.economy.job;
    s = { ...s, economy: { ...s.economy, job: { ...job, level: job.level + 1, performance: Math.min(100, job.performance + 10) } } };
  }
  if (fx.jobOffer) {
    const def = jobDef(content, fx.jobOffer);
    if (def) {
      s = { ...s, economy: { ...s.economy, job: { jobId: def.id, level: 1, performance: 55, years: 0 } } };
      s = appendLog(s, `Novo emprego: ${def.title.toLowerCase()} (R$ ${salaryOf(def, 1).toLocaleString('pt-BR')}/ano).`);
    }
  }
  if (fx.assetDamage) {
    const a = s.economy.assets.find((x) => x.kind === fx.assetDamage!.kind);
    if (a) s = post(s, 'manutencao', -a.value * fx.assetDamage.share, `${fx.assetDamage.label}: ${a.name}`);
  }
  if (fx.vehicleTheft) {
    const v = s.economy.assets.find((x) => x.kind === 'veiculo');
    if (v) {
      if (v.insured) {
        s = post(s, 'venda_bens', v.value * 0.9, `Indenização do seguro: ${v.name}`);
        s = { ...s, economy: { ...s.economy, assets: s.economy.assets.filter((x) => x.id !== v.id) } };
        s = appendLog(s, `O seguro pagou pelo ${v.name} roubado.`);
      } else s = loseAsset(s, v.id, 'Roubo sem seguro');
    }
  }
  if (fx.investLoss && s.economy.investments > 0) {
    const lost = toMoney(s.economy.investments * fx.investLoss);
    s = { ...s, economy: { ...s.economy, investments: s.economy.investments - lost } };
    s = appendLog(s, `Você perdeu R$ ${lost.toLocaleString('pt-BR')} das suas aplicações.`);
  }
  if (fx.sellBusinessOffer) {
    const b = s.economy.businesses.find((x) => !fx.sellBusinessOffer!.defId || x.defId === fx.sellBusinessOffer!.defId);
    if (b) s = sellBusiness(s, b.id, toMoney(Math.max(50000, businessValue(b)) * fx.sellBusinessOffer.multiple));
  }
  if (fx.taxFine && s.economy.evadedTax > 0) {
    const fine = toMoney(s.economy.evadedTax * 1.75);
    s = post(s, 'multas', -fine, 'Malha fina: imposto + multa');
    s = { ...s, economy: { ...s.economy, evadedTax: 0 } };
  }
  if (fx.evade) s = { ...s, flags: { ...s.flags, sonegar_ano: s.year, sonegou: true } };
  if (fx.lend) {
    const amount = Math.min(toMoney(fx.lend.amount), Math.max(0, s.money));
    if (amount > 0) {
      s = post(s, 'familia', -amount, `Empréstimo para ${vars?.pessoa ?? 'alguém próximo'}`);
      if (rng.chance(fx.lend.repayChance)) s = post(s, 'familia', amount, `${vars?.pessoa ?? 'A pessoa'} devolveu o empréstimo`);
      else s = appendLog(s, `${vars?.pessoa ?? 'A pessoa'} nunca devolveu o dinheiro.`);
    }
  }
  if (fx.inherit) {
    const value = toMoney(rng.int(fx.inherit[0], fx.inherit[1]) / 100) * 100;
    s = post(s, 'heranca', value, 'Herança de um parente distante');
  }
  if (fx.regime) s = setRegime(s, fx.regime);
  if (fx.investShare && s.money > 0) s = deposit(s, s.money * fx.investShare, 'investments');
  if (fx.savingsShare && s.money > 0) s = deposit(s, s.money * fx.savingsShare, 'savings');
  if (fx.parentGift) {
    const parent = relationsOf(s, ['pai', 'mae']).sort((a, b) => (b.person.wealth ?? 0) - (a.person.wealth ?? 0))[0]?.person;
    const amount = parent ? Math.min(100000, toMoney(((parent.wealth ?? 0) * 0.05) / 100) * 100) : 0;
    if (parent && amount > 0) {
      s = updatePerson(s, parent.id, (p) => ({ ...p, wealth: (p.wealth ?? 0) - amount }));
      s = post(s, 'familia', amount, `Ajuda de ${firstName(parent.name)}`);
    }
  }
  return s;
}
