/** Bens: Meus bens (com ações), Mercado (categorias, filtros, outra cidade, compra) e Finanças. */
import { Building2, Car, Gem, Home, Landmark, Store, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import type { AssetKind, BusinessOffer, GameState, Offer } from '../../../engine';
import {
  dedicateBlockReason, MIN_DOWN_PAYMENT, RENT_YIELD, businessDef, businessOffers, businessValue, buyBlockReason, buyBusinessBlockReason, buyCost,
  expandCost, financingQuote, marketOffers, openBlockReason, renovateBlockReason, renovationCost, sellProceeds,
} from '../../../engine';
import { BottomSheet, DsButton, ListGroup, ListItem } from '../../design/components';
import { useNav } from '../../nav';
import { useGameStore } from '../../store';
import { GameIcon } from '../../icons/GameIcon';
import FinancePanel from '../../components/FinancePanel';
import { money } from '../../components/ecoUi';

const KIND_TITLE: Record<AssetKind, string> = { imovel: 'Imóveis', veiculo: 'Veículos', luxo: 'Luxo' };
const BUY_REASON: Record<string, string> = {
  'too-young': 'Só a partir dos 18 (antes, só luxo barato com o próprio dinheiro)',
  'no-money': 'Dinheiro insuficiente',
  income: 'Renda insuficiente para a parcela',
  credit: 'Crédito negado (dívida ou falência)',
  busy: 'Resolva o acontecimento pendente',
  dead: '—',
  'not-found': 'Oferta indisponível',
  already: 'Indisponível',
  'no-sessions': 'Sem tempo livre para isso neste ano',
  'max-level': 'Nível máximo',
};
const CONDITION = { nova: 'novo', boa: 'bom estado', reformar: 'precisa de reforma' } as const;
const STATUS = { reforma: 'precisa de reforma', regular: 'clientela regular', fiel: 'clientela fiel' } as const;
const RISK = { baixo: 'risco baixo', medio: 'risco médio', alto: 'risco alto' } as const;

function trendText(t: number | undefined): string {
  if (t === undefined) return '';
  return t > 0.006 ? 'bairro valorizando' : t < -0.006 ? 'bairro desvalorizando' : 'bairro estável';
}

export function Icon({ id, size = 3 }: { id: string; size?: number }) {
  return <GameIcon set="market" id={id} size={size * 16} />;
}

export function BensScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const owned = game.economy.assets.length + game.economy.businesses.length;
  return (
    <>
      <ListItem icon={Home} title="Meus bens" subtitle={owned ? `${owned} item(ns)` : 'Nada por enquanto'} onClick={() => nav.push('meus-bens')} testId="assets-mine" />
      <ListItem icon={Store} title="Mercado" subtitle="Imóveis, veículos, luxo e empreendimentos" onClick={() => nav.push('mercado')} testId="assets-market" />
      <ListItem icon={Wallet} title="Finanças" subtitle={`Saldo ${money.format(game.money)}${game.economy.debt ? ` · dívida ${money.format(game.economy.debt)}` : ''}`} onClick={() => nav.push('financas')} testId="assets-finance" />
    </>
  );
}

export function MeusBensScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const { assets, businesses } = game.economy;
  return (
    <>
      {!assets.length && !businesses.length && <p className="text-sm text-[var(--ds-text-muted)]">Você ainda não tem bens. Dê uma olhada no Mercado.</p>}
      {(['imovel', 'veiculo', 'luxo'] as const).map((k) => {
        const list = assets.filter((a) => a.kind === k);
        if (!list.length) return null;
        return (
          <ListGroup key={k} title={KIND_TITLE[k]}>
            {list.map((a) => (
              <ListItem key={a.id} leading={<Icon id={a.catalogId} size={2} />} title={a.name} subtitle={[money.format(a.value), a.home && 'você mora aqui', a.rented && 'alugado', a.condition && CONDITION[a.condition], a.city].filter(Boolean).join(' · ')} onClick={() => nav.push({ id: 'bem', params: { id: a.id } })} testId="my-asset" />
            ))}
          </ListGroup>
        );
      })}
      {businesses.length > 0 && (
        <ListGroup title="Empreendimentos">
          {businesses.map((b) => (
            <ListItem key={b.id} leading={<Icon id={b.defId} size={2} />} title={b.name} subtitle={`Nível ${b.level} · último ano ${money.format(b.lastProfit)}`} onClick={() => nav.push({ id: 'empresa', params: { id: b.id } })} testId="my-business" />
          ))}
        </ListGroup>
      )}
    </>
  );
}

export function BemScreen({ game, id }: { game: GameState; id: string }) {
  const a = game.economy.assets.find((x) => x.id === id);
  const st = useGameStore();
  const nav = useNav();
  const [sell, setSell] = useState(false);
  if (!a) return <p className="text-sm">Este bem não é mais seu.</p>;
  const def = C.economy.assets.find((d) => d.id === a.catalogId);
  const ren = renovateBlockReason(game, a.id);
  return (
    <>
      <div className="flex items-center gap-3">
        <Icon id={a.catalogId} size={4} />
        <div className="text-sm">
          <p className="font-semibold">{a.name}</p>
          <p className="text-[var(--ds-text-muted)]">Valor {money.format(a.value)} · pago {money.format(a.paid)}</p>
          {a.kind === 'imovel' && !def?.noRent && <p className="text-[var(--ds-text-muted)]">Aluguel estimado {money.format(Math.round(a.value * RENT_YIELD))}/ano</p>}
        </div>
      </div>
      {a.kind === 'imovel' && (
        <>
          <ListItem emoji="🏠" title={a.home ? 'Você mora aqui' : 'Morar aqui'} disabled={!!a.home || a.catalogId === 'sala_comercial' || a.catalogId === 'terreno'} reason={a.home ? 'Sua casa' : 'Não dá para morar aqui'} onClick={() => st.setHome(a.id)} chevron={false} />
          {!def?.noRent && <ListItem emoji="🔑" title={a.rented ? 'Parar de alugar' : 'Alugar para terceiros'} disabled={!!a.home} reason="Você mora aqui" onClick={() => st.setRented(a.id, !a.rented)} chevron={false} testId="rent-toggle" />}
          <ListItem emoji="🧱" title="Reformar" subtitle={`${money.format(renovationCost(a))} · valoriza o imóvel`} disabled={!!ren} reason={ren === 'already' ? 'Já reformado este ano' : ren === 'no-money' ? 'Dinheiro insuficiente' : 'Indisponível'} onClick={() => st.renovate(a.id)} chevron={false} />
        </>
      )}
      {a.kind === 'veiculo' && <ListItem emoji="🛡️" title={a.insured ? 'Cancelar seguro' : 'Fazer seguro'} subtitle="Protege contra roubo e perda total" onClick={() => st.setInsured(a.id, !a.insured)} chevron={false} />}
      <ListItem emoji="💸" title="Vender" subtitle={`Recebe ${money.format(sellProceeds(a))} (preço do ano menos a taxa)`} tone="danger" onClick={() => setSell(true)} chevron={false} />
      {sell && (
        <BottomSheet title={`Vender ${a.name}?`} onClose={() => setSell(false)}>
          <p className="mb-3 text-sm">Você recebe {money.format(sellProceeds(a))}{a.loanId ? ' e o financiamento é quitado com esse dinheiro' : ''}.</p>
          <div className="grid grid-cols-2 gap-2">
            <DsButton onClick={() => setSell(false)}>Cancelar</DsButton>
            <DsButton tone="danger" onClick={() => (st.sellAsset(a.id), setSell(false), nav.back())}>
              Vender
            </DsButton>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export function EmpresaScreen({ game, id }: { game: GameState; id: string }) {
  const b = game.economy.businesses.find((x) => x.id === id);
  const st = useGameStore();
  const nav = useNav();
  const [rename, setRename] = useState<string | null>(null);
  const [sell, setSell] = useState(false);
  if (!b) return <p className="text-sm">Este negócio não é mais seu.</p>;
  const def = businessDef(C, b.defId)!;
  const busy = !!game.pendingEvents.length || !!game.activeFight;
  return (
    <>
      <div className="flex items-center gap-3">
        <Icon id={b.defId} size={4} />
        <div className="text-sm">
          <p className="font-semibold">{b.name}</p>
          <p className="text-[var(--ds-text-muted)]">Nível {b.level} · clientela {b.reputation >= 65 ? 'fiel' : b.reputation >= 40 ? 'regular' : 'fraca'} · caixa {money.format(b.cash)}</p>
          <p className="text-[var(--ds-text-muted)]">Último ano: {b.years ? money.format(b.lastProfit) : 'ainda sem resultado'}</p>
        </div>
      </div>
      <ListItem emoji="📋" title="Gerenciar de perto" subtitle="Toma parte do seu tempo de treino · melhora o lucro deste ano" disabled={busy || dedicateBlockReason(game, b.id, C) !== null} reason={b.dedicatedYear === game.year ? 'Já está gerenciando este ano' : 'Sem tempo livre para isso neste ano'} onClick={() => st.dedicate(b.id)} chevron={false} />
      <ListItem emoji="📈" title="Investir (expandir)" subtitle={`${money.format(expandCost(def, b.level))} · nível ${b.level + 1}`} disabled={b.level >= 5 || game.money < expandCost(def, b.level)} reason={b.level >= 5 ? 'Nível máximo' : 'Dinheiro insuficiente'} onClick={() => st.expandBusiness(b.id)} chevron={false} />
      <ListItem emoji="🧑‍💼" title={b.manager ? 'Dispensar gerente' : 'Contratar gerente'} subtitle={`${money.format(def.managerCost)}/ano · não toma seu tempo de treino`} onClick={() => st.setManager(b.id, !b.manager)} chevron={false} />
      <ListItem emoji="✏️" title="Renomear" onClick={() => setRename(b.name)} chevron={false} />
      <ListItem emoji="💸" title="Vender" subtitle={`Cerca de ${money.format(Math.round(businessValue(b) * 0.9))}`} tone="danger" onClick={() => setSell(true)} chevron={false} />
      {rename !== null && (
        <BottomSheet title="Renomear negócio" onClose={() => setRename(null)}>
          <input value={rename} onChange={(e) => setRename(e.target.value)} maxLength={40} aria-label="Novo nome" className="mb-3 w-full rounded-xl border border-[var(--ds-border)] bg-[var(--ds-bg)] px-3 py-3" />
          <DsButton tone="primary" full disabled={!rename.trim()} onClick={() => (st.renameBusiness(b.id, rename), setRename(null))}>
            Salvar
          </DsButton>
        </BottomSheet>
      )}
      {sell && (
        <BottomSheet title={`Vender ${b.name}?`} onClose={() => setSell(false)}>
          <div className="grid grid-cols-2 gap-2">
            <DsButton onClick={() => setSell(false)}>Cancelar</DsButton>
            <DsButton tone="danger" onClick={() => (st.sellBusiness(b.id), setSell(false), nav.back())}>
              Vender
            </DsButton>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export function MercadoScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const age = game.character.age;
  return (
    <>
      <ListItem icon={Building2} title="Imóveis" subtitle="Kitnet, apartamento, casa, praia, sítio, sala e terreno" onClick={() => nav.push({ id: 'mercado-cat', params: { cat: 'imovel' } })} testId="market-imovel" />
      <ListItem icon={Car} title="Veículos" subtitle="Moto, carro usado, popular, SUV e esportivo" onClick={() => nav.push({ id: 'mercado-cat', params: { cat: 'veiculo' } })} testId="market-veiculo" />
      <ListItem icon={Gem} title="Luxo" subtitle="Relógios, joias e grife" onClick={() => nav.push({ id: 'mercado-cat', params: { cat: 'luxo' } })} testId="market-luxo" />
      <ListItem icon={Landmark} title="Empreendimentos" subtitle="Comprar um negócio ou abrir o seu" disabled={age < 18} reason="Disponível a partir dos 18 anos" onClick={() => nav.push({ id: 'mercado-cat', params: { cat: 'negocios' } })} testId="market-negocios" />
    </>
  );
}

const PRICE_FILTERS: { label: string; max: number }[] = [
  { label: 'Todos', max: Infinity },
  { label: 'Até R$ 50 mil', max: 50000 },
  { label: 'Até R$ 300 mil', max: 300000 },
  { label: 'Até R$ 1 mi', max: 1000000 },
];

function PlacePicker({ place, onChange, game }: { place: { uf: string; city: string }; onChange: (p: { uf: string; city: string }) => void; game: GameState }) {
  const uf = C.geo.ufs.find((u) => u.sigla === place.uf)!;
  const here = place.uf === game.character.uf && place.city === game.character.city;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>📍</span>
      <select aria-label="Estado" value={place.uf} onChange={(e) => { const u = C.geo.ufs.find((x) => x.sigla === e.target.value)!; onChange({ uf: u.sigla, city: u.capital }); }} className="min-h-11 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2">
        {C.geo.ufs.map((u) => (
          <option key={u.sigla} value={u.sigla}>{u.sigla}</option>
        ))}
      </select>
      <select aria-label="Cidade" value={place.city} onChange={(e) => onChange({ uf: place.uf, city: e.target.value })} className="min-h-11 flex-1 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2">
        {uf.cities.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
      {!here && <button type="button" className="min-h-11 text-xs text-[var(--ds-accent)] underline" onClick={() => onChange({ uf: game.character.uf, city: game.character.city })}>minha cidade</button>}
    </div>
  );
}

export function MercadoCatScreen({ game, cat }: { game: GameState; cat: AssetKind | 'negocios' }) {
  const [place, setPlace] = useState({ uf: game.character.uf, city: game.character.city });
  const [maxPrice, setMax] = useState(Infinity);
  const [type, setType] = useState<string>('todos');
  const [pick, setPick] = useState<{ asset?: Offer; biz?: BusinessOffer; open?: string } | null>(null);
  const offers = useMemo(() => (cat === 'negocios' ? [] : marketOffers(game, C, place).filter((o) => o.kind === cat)), [game, cat, place]);
  const bizOffers = useMemo(() => (cat === 'negocios' ? businessOffers(game, C, place) : []), [game, cat, place]);
  const types = [...new Set(offers.map((o) => o.defId))];
  const shown = offers.filter((o) => o.price <= maxPrice && (type === 'todos' || o.defId === type));
  return (
    <>
      <PlacePicker place={place} onChange={setPlace} game={game} />
      {cat !== 'negocios' && (
        <>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Faixa de preço">
            {PRICE_FILTERS.map((f) => (
              <button key={f.label} type="button" role="radio" aria-checked={maxPrice === f.max} onClick={() => setMax(f.max)} className={`min-h-9 rounded-full border px-3 text-xs ${maxPrice === f.max ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>
                {f.label}
              </button>
            ))}
          </div>
          {types.length > 1 && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo">
              {['todos', ...types].map((t) => (
                <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)} className={`min-h-9 rounded-full border px-3 text-xs ${type === t ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>
                  {t === 'todos' ? 'Todos' : C.economy.assets.find((d) => d.id === t)?.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
          {shown.length === 0 && <p className="text-sm text-[var(--ds-text-muted)]">Nenhuma oferta com esses filtros.</p>}
          {shown.map((o) => (
            <ListItem
              key={o.id}
              testId="offer-card"
              leading={<Icon id={o.defId} size={2} />}
              title={o.name}
              subtitle={
                <>
                  <b>{money.format(o.price)}</b>
                  {o.size ? ` · ${o.size >= 10000 ? `${(o.size / 10000).toLocaleString('pt-BR')} ha` : `${o.size} m²`}` : ''}
                  {o.condition ? ` · ${CONDITION[o.condition]}` : ''}
                  {o.rent ? <span className="block">Aluguel estimado {money.format(o.rent)}/ano · {trendText(o.trend)}</span> : o.trend !== undefined ? <span className="block">{trendText(o.trend)}</span> : null}
                </>
              }
              onClick={() => setPick({ asset: o })}
            />
          ))}
        </>
      )}
      {cat === 'negocios' && (
        <>
          <ListGroup title="Comprar negócio existente">
            {bizOffers.length === 0 && <p className="text-sm text-[var(--ds-text-muted)]">Nenhum negócio à venda aqui este ano.</p>}
            {bizOffers.map((o) => (
              <ListItem key={o.id} testId="biz-offer" leading={<Icon id={o.defId} size={2} />} title={o.name} subtitle={<><b>{money.format(o.price)}</b> · {STATUS[o.status]} · {RISK[o.risk]}<span className="block">Faturamento ~{money.format(o.revenue)}/ano · lucro ~{money.format(o.profitOwner)}/ano gerenciando de perto · ~{money.format(o.profit)} com gerente</span></>} onClick={() => setPick({ biz: o })} />
            ))}
          </ListGroup>
          <ListGroup title="Abrir do zero ou franquia">
            {C.economy.businesses.filter((d) => d.open).map((d) => (
              <ListItem key={d.id} leading={<Icon id={d.id} size={2} />} title={d.name} subtitle={`${money.format(d.startCost)} · ${d.open === 'franquia' ? 'franquia' : 'do zero'} · ${RISK[d.risk ?? 'medio']}`} onClick={() => setPick({ open: d.id })} />
            ))}
          </ListGroup>
        </>
      )}
      {pick && <BuySheet game={game} pick={pick} place={place} onClose={() => setPick(null)} />}
    </>
  );
}

/** Confirmação de compra: à vista ou financiado, custo total com juros/taxas, parcela anual e impacto na renda. */
function BuySheet({ game, pick, place, onClose }: { game: GameState; pick: { asset?: Offer; biz?: BusinessOffer; open?: string }; place: { uf: string; city: string }; onClose: () => void }) {
  const st = useGameStore();
  const [financed, setFinanced] = useState(false);
  const [years, setYears] = useState(pick.asset?.kind === 'imovel' ? 20 : 5);
  if (pick.asset) {
    const o = pick.asset;
    const canFinance = o.kind !== 'luxo';
    const q = financed ? financingQuote(o, years) : null;
    const reason = buyBlockReason(game, o, financed, years);
    const income = game.economy.lastIncome;
    return (
      <BottomSheet title={o.name} onClose={onClose} testId="buy-sheet">
        <div className="mb-3 flex items-center gap-3">
          <Icon id={o.defId} size={3} />
          <p className="text-sm">
            Preço {money.format(o.price)} · taxas {money.format(buyCost(o) - o.price)}
          </p>
        </div>
        {canFinance && (
          <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Forma de pagamento">
            {[false, true].map((f) => (
              <button key={String(f)} type="button" role="radio" aria-checked={financed === f} onClick={() => setFinanced(f)} className={`min-h-11 rounded-xl border text-sm ${financed === f ? 'border-[var(--ds-accent)] text-[var(--ds-accent)]' : 'border-[var(--ds-border)]'}`}>
                {f ? 'Financiado' : 'À vista'}
              </button>
            ))}
          </div>
        )}
        {financed && q && (
          <>
            <label className="mb-2 flex items-center justify-between text-sm">
              Prazo
              <select value={years} onChange={(e) => setYears(Number(e.target.value))} className="min-h-11 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2">
                {(o.kind === 'imovel' ? [10, 15, 20, 30] : [2, 3, 5]).map((y) => (
                  <option key={y} value={y}>{y} anos</option>
                ))}
              </select>
            </label>
            <dl className="mb-3 grid grid-cols-2 gap-1 text-sm" data-testid="financing">
              <dt>Entrada (≥ {Math.round(MIN_DOWN_PAYMENT * 100)}% + taxas)</dt><dd className="text-right">{money.format(q.downPayment)}</dd>
              <dt>Parcela anual</dt><dd className="text-right">{money.format(q.installment)}</dd>
              <dt>Juros ao ano</dt><dd className="text-right">{(q.rate * 100).toLocaleString('pt-BR')}%</dd>
              <dt className="font-semibold">Custo total</dt><dd className="text-right font-semibold">{money.format(q.totalCost)}</dd>
              <dt>Impacto na renda</dt><dd className="text-right">{income > 0 ? `${Math.round((q.installment / income) * 100)}% da renda do ano` : 'sem renda registrada'}</dd>
            </dl>
          </>
        )}
        {!financed && <p className="mb-3 text-sm">Total à vista: <b>{money.format(buyCost(o))}</b> (saldo depois: {money.format(game.money - buyCost(o))})</p>}
        {reason && <p className="mb-2 text-sm text-[var(--ds-danger)]">{BUY_REASON[reason]}</p>}
        <DsButton tone="primary" full testId="buy-confirm" disabled={!!reason} onClick={() => (st.buyAsset(o.id, financed, financed ? years : undefined, place), onClose())}>
          Comprar
        </DsButton>
      </BottomSheet>
    );
  }
  if (pick.biz) {
    const o = pick.biz;
    const reason = buyBusinessBlockReason(game, o);
    return (
      <BottomSheet title={o.name} onClose={onClose} testId="buy-sheet">
        <p className="mb-2 text-sm">{money.format(o.price)} à vista · {STATUS[o.status]} · nível {o.level} · {RISK[o.risk]}</p>
        <p className="mb-3 text-sm text-[var(--ds-text-muted)]">Faturamento estimado {money.format(o.revenue)}/ano; lucro estimado {money.format(o.profitOwner)}/ano se você gerenciar de perto (toma tempo de treino) ou {money.format(o.profit)}/ano com gerente. Se der prejuízo, ele sai do seu bolso; sem dinheiro para cobrir, o negócio quebra.</p>
        {reason && <p className="mb-2 text-sm text-[var(--ds-danger)]">{BUY_REASON[reason]}</p>}
        <DsButton tone="primary" full testId="buy-confirm" disabled={!!reason} onClick={() => (st.buyBusiness(o.id, place), onClose())}>
          Comprar negócio
        </DsButton>
      </BottomSheet>
    );
  }
  const def = businessDef(C, pick.open!)!;
  const reason = openBlockReason(game, def);
  return (
    <BottomSheet title={def.name} onClose={onClose} testId="buy-sheet">
      <p className="mb-2 text-sm">Investimento inicial {money.format(def.startCost)} · {def.open === 'franquia' ? 'franquia' : 'do zero'} · {RISK[def.risk ?? 'medio']}</p>
      <p className="mb-3 text-sm text-[var(--ds-text-muted)]">Começa no nível 1, sem clientela. {def.combat ? 'Sua academia própria dá bônus no seu treino.' : ''}</p>
      {reason && <p className="mb-2 text-sm text-[var(--ds-danger)]">{BUY_REASON[reason]}</p>}
      <DsButton tone="primary" full testId="buy-confirm" disabled={!!reason} onClick={() => (st.openBusiness(def.id), onClose())}>
        Abrir negócio
      </DsButton>
    </BottomSheet>
  );
}

export function FinancasScreen({ game }: { game: GameState }) {
  return <FinancePanel game={game} />;
}
