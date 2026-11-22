import { useState } from 'react';
import { GAME_CONTENT } from '../../content';
import {
  BUY_FEE,
  DEPRECIATION,
  INSURANCE_RATE,
  LOAN_TERMS,
  MAINTENANCE,
  MAX_INSTALLMENT_SHARE,
  RENT_YIELD,
  buyBlockReason,
  buyCost,
  canManageMoney,
  financingQuote,
  marketOffers,
  sellProceeds,
} from '../../engine';
import type { Asset, AssetKind, BuyBlockReason, GameState, Offer } from '../../engine';
import { useGameStore } from '../store';
import { Btn, Section, money, useConfirm } from './ecoUi';

const C = GAME_CONTENT;
const KIND_TITLE: Record<AssetKind, string> = { imovel: '🏠 Imóveis', veiculo: '🚗 Veículos', luxo: '💎 Luxo' };
const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;

const BLOCK: Record<BuyBlockReason, string> = {
  dead: '—',
  busy: 'Resolva o evento',
  'too-young': 'Só a partir dos 18',
  'no-money': 'Dinheiro insuficiente',
  income: `Parcela acima de ${Math.round(MAX_INSTALLMENT_SHARE * 100)}% da sua renda`,
  'not-found': '—',
};

function MyAsset({ game, a }: { game: GameState; a: Asset }) {
  const sellAsset = useGameStore((s) => s.sellAsset);
  const setHome = useGameStore((s) => s.setHome);
  const setRented = useGameStore((s) => s.setRented);
  const setInsured = useGameStore((s) => s.setInsured);
  const [modal, confirm] = useConfirm();
  const ok = canManageMoney(game);
  const loan = a.loanId ? game.economy.loans.find((l) => l.id === a.loanId) : undefined;
  const proceeds = sellProceeds(a);
  const askSell = () =>
    confirm({
      title: `Vender ${a.name}?`,
      lines: [
        { label: 'Valor de mercado', value: money.format(a.value) },
        { label: 'Você recebe (com taxas)', value: money.format(proceeds) },
        ...(loan ? [{ label: 'Quitação do financiamento', value: `−${money.format(loan.balance)}` }] : []),
        { label: 'Sobra no bolso', value: money.format(proceeds - (loan?.balance ?? 0)), strong: true },
        { label: 'Você pagou', value: money.format(a.paid) },
      ],
      confirmLabel: 'Vender',
      onConfirm: () => sellAsset(a.id),
    });
  return (
    <li className="rounded-xl bg-slate-950 p-3" data-testid={`asset-${a.catalogId}`}>
      {modal}
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">
          {a.name} {a.home && <span className="text-[11px] text-emerald-400">· sua casa</span>}
          {a.rented && <span className="text-[11px] text-sky-300">· alugado</span>}
        </p>
        <span className="shrink-0 text-sm tabular-nums">{money.format(a.value)}</span>
      </div>
      <p className="text-[11px] text-slate-500">
        Comprado em {a.boughtYear} por {money.format(a.paid)}
        {loan ? ` · financiamento: ${money.format(loan.balance)} restantes` : ''}
        {a.kind === 'veiculo' ? ` · deprecia ${pct(DEPRECIATION.veiculo)}/ano` : ''}
        {a.kind === 'imovel' ? ` · manutenção ${pct(MAINTENANCE.imovel)}/ano` : ''}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {a.kind === 'imovel' && a.catalogId !== 'sala_comercial' && !a.home && (
          <Btn disabled={!ok} onClick={() => setHome(a.id)}>
            Morar aqui
          </Btn>
        )}
        {a.kind === 'imovel' && !a.home && (
          <Btn disabled={!ok} onClick={() => setRented(a.id, !a.rented)}>
            {a.rented ? 'Parar de alugar' : `Alugar (~${money.format(a.value * RENT_YIELD)}/ano)`}
          </Btn>
        )}
        {a.kind === 'veiculo' && (
          <Btn disabled={!ok} onClick={() => setInsured(a.id, !a.insured)}>
            {a.insured ? '🛡️ Cancelar seguro' : `🛡️ Seguro (${money.format(a.value * INSURANCE_RATE)}/ano)`}
          </Btn>
        )}
        <Btn tone="danger" disabled={!ok} onClick={askSell}>
          Vender
        </Btn>
      </div>
    </li>
  );
}

function OfferRow({ game, o }: { game: GameState; o: Offer }) {
  const buyAsset = useGameStore((s) => s.buyAsset);
  const [modal, confirm] = useConfirm();
  const years = o.kind === 'imovel' ? 20 : 5;
  const cash = buyBlockReason(game, o, false);
  const fin = o.kind === 'luxo' ? 'not-found' : buyBlockReason(game, o, true, years);
  const total = buyCost(o);
  const askCash = () =>
    confirm({
      title: `Comprar ${o.name}`,
      lines: [
        { label: 'Preço', value: money.format(o.price) },
        { label: `Taxas (${pct(BUY_FEE[o.kind])})`, value: money.format(total - o.price) },
        { label: 'Total à vista', value: money.format(total), strong: true },
        { label: 'Se vender depois', value: `recebe ~${money.format(sellProceeds({ value: o.price, kind: o.kind }))}` },
      ],
      note: 'Comprar e vender no mesmo ano sempre dá prejuízo (taxas e revenda).',
      confirmLabel: 'Comprar',
      onConfirm: () => buyAsset(o.id, false),
    });
  const askFinanced = () => {
    const q = financingQuote(o, years);
    if (!q) return;
    const kind = o.kind === 'imovel' ? 'imobiliario' : 'veiculo';
    confirm({
      title: `Financiar ${o.name}`,
      lines: [
        { label: 'Preço', value: money.format(o.price) },
        { label: 'Entrada (20% + taxas)', value: money.format(q.downPayment) },
        { label: 'Financiado', value: money.format(q.loan) },
        { label: 'Juros', value: `${pct(LOAN_TERMS[kind].rate)} ao ano` },
        { label: 'Parcelas', value: `${q.years}× ${money.format(q.installment)} por ano` },
        { label: 'Custo total com juros', value: money.format(q.totalCost), strong: true },
      ],
      note: 'As parcelas saem no fechamento de cada ano. Vender o bem quita o saldo do financiamento.',
      confirmLabel: 'Financiar',
      onConfirm: () => buyAsset(o.id, true, years),
    });
  };
  return (
    <li className="rounded-xl bg-slate-950 p-3" data-testid={`offer-${o.defId}`}>
      {modal}
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm">{o.name}</p>
        <span className="shrink-0 text-sm font-semibold tabular-nums">{money.format(o.price)}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Btn testId={`buy-${o.id}`} tone="primary" disabled={cash !== null} onClick={askCash}>
          À vista
          {cash && <span className="block text-[10px] text-slate-400">{BLOCK[cash]}</span>}
        </Btn>
        {o.kind !== 'luxo' && (
          <Btn testId={`finance-${o.id}`} disabled={fin !== null} onClick={askFinanced}>
            Financiar ({years} anos)
            {fin && fin !== 'not-found' && <span className="block text-[10px] text-slate-400">{BLOCK[fin]}</span>}
          </Btn>
        )}
      </div>
    </li>
  );
}

export default function AssetsPanel({ game }: { game: GameState }) {
  const [kind, setKind] = useState<AssetKind>('imovel');
  const assets = game.economy.assets;
  const offers = marketOffers(game, C).filter((o) => o.kind === kind);
  const total = assets.reduce((t, a) => t + a.value, 0);
  return (
    <div className="flex flex-col gap-3" data-testid="assets-panel">
      <Section title="Meus bens" right={<span className="text-xs tabular-nums text-slate-300">{money.format(total)}</span>}>
        {assets.length === 0 ? (
          <p className="text-sm text-slate-400">Você ainda não tem bens.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {assets.map((a) => (
              <MyAsset key={a.id} game={game} a={a} />
            ))}
          </ul>
        )}
      </Section>
      <Section title={`Mercado de ${game.year} · ${game.character.city}`}>
        {game.character.age < 18 && <p className="mb-2 text-xs text-slate-400">Você poderá comprar bens a partir dos 18 anos.</p>}
        <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl bg-slate-950 p-1 text-xs">
          {(Object.keys(KIND_TITLE) as AssetKind[]).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`rounded-lg py-2 ${kind === k ? 'bg-slate-800 font-semibold' : 'text-slate-400'}`}>
              {KIND_TITLE[k]}
            </button>
          ))}
        </div>
        <ul className="flex flex-col gap-2">
          {offers.map((o) => (
            <OfferRow key={o.id} game={game} o={o} />
          ))}
          {offers.length === 0 && <p className="text-xs text-slate-500">Nada à venda nesta categoria este ano.</p>}
        </ul>
        <p className="mt-2 text-[11px] text-slate-500">As ofertas mudam a cada ano. Imóveis valorizam com o mercado; veículos e luxo perdem valor.</p>
      </Section>
    </div>
  );
}
