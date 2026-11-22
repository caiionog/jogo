import { useState } from 'react';
import { GAME_CONTENT } from '../../content';
import {
  CATEGORY_LABEL,
  DEBT_RATE,
  ECON_LABEL,
  HOUSING_LABEL,
  INDEX_NAME,
  INDEX_WITHDRAW_FEE,
  LOAN_TERMS,
  STANDARD,
  canManageMoney,
  creditLimit,
  currentMarket,
  ledgerTotals,
  livingCost,
  loanTotalCost,
  netWorth,
  priceInstallment,
  relationsOf,
} from '../../engine';
import type { GameState, Housing, LedgerCategory, LivingStandard } from '../../engine';
import { useGameStore } from '../store';
import { AmountInput, Btn, Row, Section, money, signed, useConfirm } from './ecoUi';

const C = GAME_CONTENT;
const pct = (x: number) => `${(x * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

function Ledger({ game }: { game: GameState }) {
  const totals = ledgerTotals(game);
  const cats = (Object.entries(totals) as [LedgerCategory, number][]).filter(([, v]) => v !== 0);
  const income = cats.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const spend = cats.filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]);
  const sum = cats.reduce((t, [, v]) => t + v, 0);
  const { opening } = game.economy.ledger;
  return (
    <Section title={`Extrato de ${game.year}`}>
      <Row label="Saldo no início do ano" value={money.format(opening)} />
      {income.length + spend.length === 0 && <p className="py-1 text-xs text-slate-500">Nenhuma movimentação este ano.</p>}
      {income.map(([k, v]) => (
        <Row key={k} label={CATEGORY_LABEL[k]} value={signed(v)} tone="pos" />
      ))}
      {spend.map(([k, v]) => (
        <Row key={k} label={CATEGORY_LABEL[k]} value={signed(v)} tone="neg" />
      ))}
      <div className="mt-1 border-t border-slate-800 pt-1" data-testid="ledger-total">
        <Row label="Total do ano" value={signed(sum)} tone={sum >= 0 ? 'pos' : 'neg'} />
        <Row label="Saldo atual" value={money.format(game.money)} />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        Custos automáticos (moradia, padrão de vida, filhos, parcelas, impostos) entram ao avançar o ano.
      </p>
    </Section>
  );
}

function History({ game }: { game: GameState }) {
  const [open, setOpen] = useState(false);
  const hist = game.economy.history.slice(-(open ? 30 : 5)).reverse();
  if (!hist.length) return null;
  return (
    <Section
      title="Anos anteriores"
      right={
        game.economy.history.length > 5 ? (
          <button className="text-xs text-slate-400 underline" onClick={() => setOpen((v) => !v)}>
            {open ? 'menos' : 'mais'}
          </button>
        ) : undefined
      }
    >
      <ul className="divide-y divide-slate-800" data-testid="history">
        {hist.map((h) => {
          const net = Object.values(h.totals).reduce((t, v) => t + (v ?? 0), 0);
          return (
            <li key={h.year} className="flex items-baseline justify-between gap-2 py-1 text-xs">
              <span className="text-slate-400">
                {h.year} · {h.age} anos
              </span>
              <span className={`tabular-nums ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{signed(net)}</span>
              <span className="tabular-nums text-slate-300">patrimônio {money.format(h.netWorth)}</span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Bank({ game }: { game: GameState }) {
  const deposit = useGameStore((s) => s.deposit);
  const withdraw = useGameStore((s) => s.withdraw);
  const [amount, setAmount] = useState(0);
  const [where, setWhere] = useState<'savings' | 'investments'>('savings');
  const e = game.economy;
  const m = currentMarket(game);
  const ok = canManageMoney(game);
  const balance = e[where];
  return (
    <Section title="Banco Aurora">
      <Row label="Poupança" value={money.format(e.savings)} />
      <Row label={INDEX_NAME} value={money.format(e.investments)} />
      <p className="mb-2 text-[11px] text-slate-500">
        {ECON_LABEL[m.kind]}: poupança rende {pct(m.savingsRate)} este ano; o índice varia com o mercado (resgate com taxa de {pct(INDEX_WITHDRAW_FEE)}).
      </p>
      <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-slate-950 p-1 text-sm">
        {(['savings', 'investments'] as const).map((w) => (
          <button key={w} onClick={() => setWhere(w)} className={`rounded-lg py-2 ${where === w ? 'bg-slate-800 font-semibold' : 'text-slate-400'}`}>
            {w === 'savings' ? 'Poupança' : 'Índice'}
          </button>
        ))}
      </div>
      <AmountInput
        value={amount}
        onChange={setAmount}
        presets={[
          { label: 'R$ 1 mil', value: 1000 },
          { label: 'R$ 10 mil', value: 10000 },
          { label: 'Metade do saldo', value: Math.floor(game.money / 2) },
          { label: 'Tudo aplicado', value: balance },
        ]}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Btn testId="bank-deposit" tone="primary" disabled={!ok || amount <= 0 || amount > game.money} onClick={() => (deposit(amount, where), setAmount(0))}>
          Aplicar
        </Btn>
        <Btn testId="bank-withdraw" disabled={!ok || amount <= 0 || balance <= 0} onClick={() => (withdraw(amount, where), setAmount(0))}>
          Resgatar
        </Btn>
      </div>
    </Section>
  );
}

function Credit({ game }: { game: GameState }) {
  const payDebt = useGameStore((s) => s.payDebt);
  const payOffLoan = useGameStore((s) => s.payOffLoan);
  const personalLoan = useGameStore((s) => s.personalLoan);
  const [modal, confirm] = useConfirm();
  const [amount, setAmount] = useState(0);
  const [years, setYears] = useState(3);
  const e = game.economy;
  const ok = canManageMoney(game);
  const limit = creditLimit(game, netWorth(game));
  const t = LOAN_TERMS.pessoal;
  const askLoan = () => {
    const inst = priceInstallment(amount, t.rate, years);
    confirm({
      title: 'Empréstimo pessoal',
      lines: [
        { label: 'Valor', value: money.format(amount) },
        { label: 'Juros', value: `${pct(t.rate)} ao ano` },
        { label: 'Parcelas', value: `${years}× ${money.format(inst)} por ano` },
        { label: 'Custo total com juros', value: money.format(loanTotalCost(amount, t.rate, years)), strong: true },
      ],
      note: 'As parcelas saem automaticamente no fechamento de cada ano.',
      confirmLabel: 'Pegar empréstimo',
      onConfirm: () => (personalLoan(amount, years), setAmount(0)),
    });
  };
  return (
    <Section title="Dívidas e crédito">
      {modal}
      {e.debt > 0 ? (
        <div className="mb-2 rounded-xl border border-rose-800 bg-rose-500/10 p-2">
          <Row label={`Cheque especial (${pct(DEBT_RATE)} a.a.)`} value={money.format(e.debt)} tone="neg" />
          <p className="text-[11px] text-rose-200/80">Devendo há {e.debtYears} ano(s). Dívida grande por muito tempo leva à falência.</p>
          <Btn className="mt-2 w-full" tone="danger" disabled={!ok || game.money <= 0} onClick={() => payDebt(Math.min(game.money, e.debt))}>
            Pagar {money.format(Math.min(Math.max(0, game.money), e.debt))}
          </Btn>
        </div>
      ) : (
        <p className="mb-2 text-xs text-slate-500">Sem dívidas no cheque especial.</p>
      )}
      {e.loans.length > 0 && (
        <ul className="mb-2 flex flex-col gap-2">
          {e.loans.map((l) => (
            <li key={l.id} className="rounded-xl bg-slate-950 p-2">
              <Row label={l.label} value={money.format(l.balance)} />
              <p className="text-[11px] text-slate-500">
                {money.format(l.installment)}/ano · faltam {l.yearsLeft} parcela(s) · {pct(l.rate)} a.a.
              </p>
              <Btn className="mt-1 w-full" disabled={!ok || game.money < l.balance} onClick={() => payOffLoan(l.id)}>
                Quitar agora ({money.format(l.balance)})
              </Btn>
            </li>
          ))}
        </ul>
      )}
      {game.character.age >= 18 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-400">
            Empréstimo pessoal ({pct(t.rate)} a.a.) · limite {money.format(limit)}
          </p>
          <AmountInput
            value={amount}
            onChange={setAmount}
            presets={[
              { label: 'R$ 5 mil', value: Math.min(5000, limit) },
              { label: 'R$ 20 mil', value: Math.min(20000, limit) },
              { label: 'Limite', value: limit },
            ]}
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Prazo</span>
            {[1, 3, 5].map((y) => (
              <button key={y} onClick={() => setYears(y)} className={`rounded-full border px-3 py-1 ${years === y ? 'border-emerald-500 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>
                {y} {y === 1 ? 'ano' : 'anos'}
              </button>
            ))}
          </div>
          <Btn disabled={!ok || amount <= 0 || amount > limit} onClick={askLoan}>
            Simular empréstimo
          </Btn>
        </div>
      )}
    </Section>
  );
}

function Living({ game }: { game: GameState }) {
  const setStandard = useGameStore((s) => s.setStandard);
  const setHousing = useGameStore((s) => s.setHousing);
  const e = game.economy;
  const ok = canManageMoney(game);
  const cost = livingCost(game, C);
  const parents = relationsOf(game, ['pai', 'mae']).length > 0;
  const hasHome = e.assets.some((a) => a.kind === 'imovel');
  if (game.character.age < 18) {
    return (
      <Section title="Custo de vida">
        <p className="text-xs text-slate-400">Até os 18 anos, sua família paga as despesas básicas. Mesada e presentes saem do patrimônio dos seus pais.</p>
      </Section>
    );
  }
  return (
    <Section title="Custo de vida">
      <Row label="Padrão de vida (ano)" value={money.format(cost.standard)} tone="neg" />
      <Row label="Aluguel (ano)" value={money.format(cost.rent)} tone={cost.rent ? 'neg' : 'muted'} />
      <p className="mt-2 text-xs text-slate-400">Padrão de vida</p>
      <div className="mt-1 grid grid-cols-3 gap-1">
        {(Object.keys(STANDARD) as LivingStandard[]).map((k) => (
          <button
            key={k}
            disabled={!ok}
            onClick={() => setStandard(k)}
            className={`min-h-11 rounded-xl border px-1 text-xs ${e.standard === k ? 'border-emerald-500 bg-emerald-500/10 font-semibold' : 'border-slate-700'}`}
          >
            {STANDARD[k].label}
            <span className="block text-[10px] text-slate-400">{STANDARD[k].happiness ? `+${STANDARD[k].happiness} felicidade` : 'básico'}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">Moradia</p>
      <div className="mt-1 grid grid-cols-3 gap-1">
        {(Object.keys(HOUSING_LABEL) as Housing[]).map((k) => {
          const can = k === 'pais' ? parents : k === 'propria' ? hasHome : true;
          return (
            <button
              key={k}
              disabled={!ok || !can}
              onClick={() => setHousing(k)}
              className={`min-h-11 rounded-xl border px-1 text-xs disabled:opacity-40 ${e.housing === k ? 'border-emerald-500 bg-emerald-500/10 font-semibold' : 'border-slate-700'}`}
            >
              {HOUSING_LABEL[k]}
            </button>
          );
        })}
      </div>
      {e.housing === 'propria' || !hasHome ? null : <p className="mt-1 text-[11px] text-slate-500">Para morar no seu imóvel, use "Morar aqui" na aba Bens.</p>}
    </Section>
  );
}

export default function FinancePanel({ game }: { game: GameState }) {
  const e = game.economy;
  const nw = netWorth(game);
  const m = currentMarket(game);
  return (
    <div className="flex flex-col gap-3" data-testid="finance-panel">
      <Section title="Resumo" right={<span className={`text-[11px] ${m.kind === 'crise' ? 'text-rose-400' : m.kind === 'boom' ? 'text-emerald-400' : 'text-slate-400'}`}>{ECON_LABEL[m.kind]}</span>}>
        <Row label="Dinheiro" value={money.format(game.money)} />
        <Row label="Patrimônio líquido" value={<b data-testid="net-worth">{money.format(nw)}</b>} tone={nw >= 0 ? 'pos' : 'neg'} />
        {e.debt > 0 && <Row label="Dívida" value={money.format(e.debt)} tone="neg" />}
        <Row label="Renda tributável do último ano" value={money.format(e.lastIncome)} tone="muted" />
        {e.marriage && <Row label="Regime de bens" value={e.marriage.regime === 'parcial' ? 'Comunhão parcial' : 'Separação total'} tone="muted" />}
      </Section>
      <Ledger game={game} />
      <Living game={game} />
      <Bank game={game} />
      <Credit game={game} />
      <History game={game} />
    </div>
  );
}
