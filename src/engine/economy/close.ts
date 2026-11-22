/** Fechamento do ano econômico: fluxos automáticos, impostos, dívida e arquivo do extrato. */
import type { GameContent } from '../core/content';
import type { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { appendLog } from '../core/stats';
import { assetsYear, propertyValue, sellAsset } from '../assets/assets';
import { payLoans, withdraw } from './bank';
import { businessYear, sellBusiness, businessValue } from './business';
import { alimonyYear, parentsWealthYear } from './family';
import { sponsorsYear } from './fightIncome';
import { jobYear } from './jobs';
import { archiveLedger, post, taxableIncome, toMoney } from './ledger';
import { debtYear, livingYear } from './living';
import { marketYear } from './market';
import { INDEX_GAIN_TAX, PENSION_RATE, PROPERTY_TAX_RATE, incomeTax } from './taxes';
import { netWorth } from './worth';

/** Vende tudo a preço de urgência (falência): bens a 70%, empresas a 50%, aplicações resgatadas. */
export function liquidateAll(state: GameState): GameState {
  let s = state;
  for (const a of s.economy.assets.slice()) s = sellAsset(s, a.id, 0.7);
  for (const b of s.economy.businesses.slice()) s = sellBusiness(s, b.id, toMoney(businessValue(b) * 0.5));
  if (s.economy.savings) s = withdraw(s, s.economy.savings, 'savings');
  if (s.economy.investments) s = withdraw(s, s.economy.investments, 'investments');
  return s;
}

export function closeEconomicYear(state: GameState, rng: Rng, content: GameContent): GameState {
  const market = marketYear(state.seed, state.year);
  let s = state;
  s = jobYear(s, rng, content, market);
  s = sponsorsYear(s, content);
  s = businessYear(s, rng, content, market);
  s = assetsYear(s, rng, content, market);
  // rendimentos: poupança paga juros em dinheiro; o índice valoriza (ou cai) dentro da aplicação
  if (s.economy.savings > 0) s = post(s, 'juros', s.economy.savings * market.savingsRate, 'Rendimento da poupança');
  if (s.economy.investments > 0) {
    // ganho do índice paga 15% de imposto (retido na própria aplicação)
    const gain = s.economy.investments * market.indexReturn;
    const net = gain > 0 ? gain * (1 - INDEX_GAIN_TAX) : gain;
    s = { ...s, economy: { ...s.economy, investments: Math.max(0, toMoney(s.economy.investments + net)) } };
  }
  s = livingYear(s, content);
  s = alimonyYear(s);
  s = payLoans(s);
  // impostos
  const income = taxableIncome(s);
  let tax = incomeTax(income, content.economy.taxBrackets);
  if (s.flags.sonegar_ano === s.year && tax > 0) {
    const evaded = toMoney(tax / 2);
    tax -= evaded;
    s = { ...s, economy: { ...s.economy, evadedTax: s.economy.evadedTax + evaded } };
  }
  if (tax > 0) s = post(s, 'impostos', -tax, 'Imposto de renda');
  // contribuição previdenciária sobre salário (gancho de aposentadoria da Etapa 6)
  const wages = s.economy.ledger.entries.filter((e) => e.cat === 'salario').reduce((t, e) => t + e.amount, 0);
  const pension = toMoney(wages * PENSION_RATE);
  if (pension > 0) s = post(s, 'impostos', -pension, 'Previdência');
  const iptu = toMoney(propertyValue(s) * PROPERTY_TAX_RATE);
  if (iptu > 0) s = post(s, 'impostos', -iptu, 'Imposto sobre imóveis');
  s = { ...s, economy: { ...s.economy, lastIncome: income } };
  s = parentsWealthYear(s, rng);
  s = debtYear(s, liquidateAll);
  if (market.kind !== 'normal' && s.character.age >= 16) s = appendLog(s, market.kind === 'crise' ? 'Foi um ano de crise econômica.' : 'A economia esteve aquecida este ano.');
  return archiveLedger(s, netWorth(s));
}
