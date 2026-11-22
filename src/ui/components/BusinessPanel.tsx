import { GAME_CONTENT } from '../../content';
import { DEDICATE_COST, DIVIDEND_SHARE, MAX_LEVEL, businessDef, businessValue, canManageMoney, expandCost, openBlockReason } from '../../engine';
import type { Business, BusinessBlockReason, GameState } from '../../engine';
import { useGameStore } from '../store';
import { Btn, Row, Section, money, signed, useConfirm } from './ecoUi';

const C = GAME_CONTENT;

const BLOCK: Record<BusinessBlockReason, string> = {
  dead: '—',
  busy: 'Resolva o evento',
  'too-young': 'Só a partir dos 18',
  'no-money': 'Dinheiro insuficiente',
  'no-energy': 'Sem energia',
  'max-level': 'Nível máximo',
  already: '—',
};

function MyBusiness({ game, b }: { game: GameState; b: Business }) {
  const dedicate = useGameStore((s) => s.dedicate);
  const setManager = useGameStore((s) => s.setManager);
  const expand = useGameStore((s) => s.expandBusiness);
  const inject = useGameStore((s) => s.injectCash);
  const sell = useGameStore((s) => s.sellBusiness);
  const [modal, confirm] = useConfirm();
  const def = businessDef(C, b.defId);
  const ok = canManageMoney(game);
  if (!def) return null;
  const cost = expandCost(def, b.level);
  const price = Math.round(businessValue(b) * 0.9);
  const dedicated = b.dedicatedYear === game.year;
  const care = dedicated ? 'você está se dedicando este ano' : b.manager ? `gerente cuidando (${money.format(def.managerCost)}/ano)` : 'abandonada: o resultado cai';
  return (
    <li className="rounded-xl bg-slate-950 p-3" data-testid={`biz-${b.defId}`}>
      {modal}
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold">{b.name}</p>
        <span className="shrink-0 text-[11px] text-slate-400">
          nível {b.level}/{MAX_LEVEL} · {b.years} ano(s)
        </span>
      </div>
      <Row label="Caixa da empresa" value={money.format(b.cash)} tone={b.cash < 10000 ? 'neg' : undefined} />
      <Row label="Último resultado" value={b.years ? signed(b.lastProfit) : '—'} tone={b.lastProfit >= 0 ? 'pos' : 'neg'} />
      <Row label="Reputação" value={b.reputation} />
      <Row label="Valor estimado" value={money.format(businessValue(b))} tone="muted" />
      <p className={`mt-1 text-[11px] ${dedicated ? 'text-emerald-400' : b.manager ? 'text-slate-400' : 'text-amber-300'}`}>{care}</p>
      <p className="text-[11px] text-slate-500">
        {Math.round(DIVIDEND_SHARE * 100)}% do lucro vira dividendo para você; o resto fica no caixa. Caixa negativo = falência.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Btn tone="primary" disabled={!ok || dedicated || game.energy.current < DEDICATE_COST} onClick={() => dedicate(b.id)}>
          Me dedicar (⚡{DEDICATE_COST})
        </Btn>
        <Btn disabled={!ok} onClick={() => setManager(b.id, !b.manager)}>
          {b.manager ? 'Demitir gerente' : 'Contratar gerente'}
        </Btn>
        <Btn disabled={!ok || b.level >= MAX_LEVEL || game.money < cost} onClick={() => expand(b.id)}>
          {b.level >= MAX_LEVEL ? 'Nível máximo' : `Expandir (${money.format(cost)})`}
        </Btn>
        <Btn disabled={!ok || game.money < 10000} onClick={() => inject(b.id, 10000)}>
          Aportar R$ 10 mil
        </Btn>
        <Btn
          tone="danger"
          className="col-span-2"
          disabled={!ok}
          onClick={() =>
            confirm({
              title: `Vender ${b.name}?`,
              lines: [
                { label: 'Valor estimado', value: money.format(businessValue(b)) },
                { label: 'Oferta à vista (−10%)', value: money.format(price), strong: true },
              ],
              confirmLabel: 'Vender',
              onConfirm: () => sell(b.id),
            })
          }
        >
          Vender a empresa
        </Btn>
      </div>
    </li>
  );
}

export default function BusinessPanel({ game }: { game: GameState }) {
  const open = useGameStore((s) => s.openBusiness);
  const [modal, confirm] = useConfirm();
  const list = game.economy.businesses;
  return (
    <div className="flex flex-col gap-3" data-testid="business-panel">
      {modal}
      <Section title="Minhas empresas">
        {list.length === 0 ? (
          <p className="text-sm text-slate-400">Você ainda não tem empresas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((b) => (
              <MyBusiness key={b.id} game={game} b={b} />
            ))}
          </ul>
        )}
      </Section>
      <Section title="Abrir um negócio">
        <ul className="flex flex-col gap-2">
          {C.economy.businesses.map((d) => {
            const r = openBlockReason(game, d);
            return (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-950 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {d.combat ? '🥋 ' : ''}
                    {d.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Investimento {money.format(d.startCost)} · fatura ~{money.format(d.revenue)}/ano{d.combat ? ' · +10% no seu treino' : ''}
                  </p>
                </div>
                <Btn
                  testId={`open-${d.id}`}
                  tone="primary"
                  className="shrink-0"
                  disabled={r !== null}
                  onClick={() =>
                    confirm({
                      title: `Abrir ${d.combat ? 'sua academia' : d.name}?`,
                      lines: [
                        { label: 'Investimento inicial', value: money.format(d.startCost), strong: true },
                        { label: 'Vai para o caixa', value: money.format(Math.round(d.startCost * 0.2)) },
                        { label: 'Faturamento base', value: `${money.format(d.revenue)}/ano` },
                        { label: 'Custo base', value: `${money.format(d.cost)}/ano` },
                        { label: 'Gerente (opcional)', value: `${money.format(d.managerCost)}/ano` },
                      ],
                      note: 'Sem dedicação nem gerente, o resultado cai. Crises derrubam o faturamento.',
                      confirmLabel: 'Abrir',
                      onConfirm: () => open(d.id),
                    })
                  }
                >
                  {r ? BLOCK[r] : 'Abrir'}
                </Btn>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}
