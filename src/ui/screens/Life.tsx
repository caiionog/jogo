import { GAME_CONTENT } from '../../content';
import { LIFE_STAGE_LABEL, lifeStage } from '../../engine';
import ActionList from '../components/ActionList';
import EnergyBar from '../components/EnergyBar';
import EventModal from '../components/EventModal';
import LifeLog from '../components/LifeLog';
import SchoolPanel from '../components/SchoolPanel';
import CareerPanel from '../components/CareerPanel';
import FightScreen from '../components/FightScreen';
import RankingPanel from '../components/RankingPanel';
import { useState } from 'react';
import RelationshipsPanel from '../components/RelationshipsPanel';
import MenuHost from '../components/MenuHost';
import HealthPanel from '../components/HealthPanel';
import { FamilyTree } from '../components/MetaScreens';
import StatBars from '../components/StatBars';
import FinancePanel from '../components/FinancePanel';
import WorkPanel from '../components/WorkPanel';
import AssetsPanel from '../components/AssetsPanel';
import BusinessPanel from '../components/BusinessPanel';
import { useGameStore } from '../store';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function Life({ onShowObituary }: { onShowObituary?: () => void }) {
  const game = useGameStore((s) => s.game);
  const doAction = useGameStore((s) => s.doAction);
  const joinClub = useGameStore((s) => s.joinClub);
  const leaveClub = useGameStore((s) => s.leaveClub);
  const advance = useGameStore((s) => s.advance);
  const choose = useGameStore((s) => s.choose);
  const newLife = useGameStore((s) => s.newLife);
  const [tab, setTab] = useState<'vida' | 'saude' | 'carreira' | 'relacoes' | 'ranking' | 'financas' | 'trabalho' | 'bens' | 'empresas'>('vida');
  const [confirming, setConfirming] = useState(false);
  if (!game) return null;

  const { character: c } = game;
  const pending = game.pendingEvents[0];
  const pendingEvent = pending ? GAME_CONTENT.events.find((e) => e.id === pending.eventId) : undefined;

  // confirmação dentro da tela (window.confirm não funciona em páginas embutidas)
  const confirmNewLife = () => {
    if (!game.alive) void newLife();
    else setConfirming(true);
  };

  return (
    <>
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 border-b border-slate-800 bg-slate-950/95 px-4 pb-2 pt-4 backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold" data-testid="char-name">
              {c.sex === 'M' ? '👦' : '👧'} {c.name}
            </h1>
            <p className="text-sm text-slate-400" data-testid="char-age">
              {c.age} {c.age === 1 ? 'ano' : 'anos'} · {LIFE_STAGE_LABEL[lifeStage(c.age)]} · {c.city}, {c.country}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-semibold tabular-nums ${game.money < 0 ? 'text-rose-400' : 'text-emerald-400'}`} data-testid="money">
              {money.format(game.money)}
            </p>
            {game.economy.debt > 0 && <p className="text-[11px] text-rose-400 tabular-nums">dívida {money.format(game.economy.debt)}</p>}
            <div className="mt-1 flex items-center justify-end gap-3">
              <MenuHost className="flex h-11 w-11 items-center justify-center rounded-lg text-xl" />
              <button onClick={confirmNewLife} className="text-xs text-slate-400 underline">
                Nova vida
              </button>
            </div>
          </div>
        </div>
        <nav className="-mx-4 mt-3 flex snap-x gap-1 overflow-x-auto px-4 [scrollbar-width:none]" role="tablist">
          {(
            [
              ['vida', '🏠 Vida'],
              ['saude', `🩺 Saúde${game.health.injuries.length ? ' 🩹' : ''}`],
              ['carreira', `🥊 Carreira${game.fighter.offers.length ? ` (${game.fighter.offers.length})` : ''}`],
              ['relacoes', '❤️ Relações'],
              ['ranking', '🏆 Ranking'],
              ['financas', `💰 Finanças${game.economy.debt > 0 ? ' ⚠️' : ''}`],
              ['trabalho', '💼 Trabalho'],
              ['bens', '🏡 Bens'],
              ['empresas', '🏢 Empresas'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`shrink-0 snap-start whitespace-nowrap rounded-lg px-3 py-2 text-[13px] leading-tight ${tab === id ? 'bg-slate-800 font-bold text-white' : 'text-slate-400'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>


      <main className="flex flex-1 flex-col gap-4 px-4 py-4 pb-28">
        {game.alive && <EnergyBar energy={game.energy} />}
        {tab === 'vida' && (
          <>
            <StatBars stats={c.stats} />
            {game.alive && <SchoolPanel education={game.education} age={c.age} />}
            {game.alive && <ActionList game={game} onAction={doAction} onJoinClub={joinClub} onLeaveClub={leaveClub} />}
            <LifeLog log={game.log} />
          </>
        )}
        {tab === 'carreira' && game.alive && <CareerPanel game={game} />}
        {tab === 'saude' && <HealthPanel game={game} />}
        {tab === 'relacoes' && (
          <>
            <RelationshipsPanel game={game} />
            {(game.dynasty.generation > 1 || game.relationships.relations.some((r) => r.type === 'filho')) && <FamilyTree game={game} />}
          </>
        )}
        {tab === 'ranking' && <RankingPanel game={game} />}
        {tab === 'financas' && <FinancePanel game={game} />}
        {tab === 'trabalho' && <WorkPanel game={game} />}
        {tab === 'bens' && <AssetsPanel game={game} />}
        {tab === 'empresas' && <BusinessPanel game={game} />}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md border-t border-slate-800 bg-slate-950/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        {game.alive ? (
          <button
            onClick={advance}
            disabled={game.pendingEvents.length > 0 || !!game.activeFight}
            className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-slate-950 active:scale-[0.98] disabled:opacity-40"
          >
            ➕ Avançar ano
          </button>
        ) : (
          <button onClick={() => (game.ending && onShowObituary ? onShowObituary() : confirmNewLife())} className="w-full rounded-xl bg-slate-200 py-4 text-lg font-bold text-slate-950">
            {game.ending ? '🕯️ Ver obituário' : '🔁 Nova vida'}
          </button>
        )}
      </footer>

      {confirming && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-lg font-semibold">Começar uma nova vida?</p>
            <p className="mt-1 text-sm text-slate-400">A vida de {c.name} será perdida.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirming(false)} className="rounded-xl border border-slate-600 py-3">
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirming(false);
                  void newLife();
                }}
                className="rounded-xl bg-rose-500 py-3 font-bold text-slate-950"
              >
                Nova vida
              </button>
            </div>
          </div>
        </div>
      )}
      {game.activeFight && <FightScreen key={game.activeFight.offer.id} af={game.activeFight} />}
      {!game.activeFight && pending && pendingEvent && <EventModal game={game} event={pendingEvent} pending={pending} onChoose={choose} />}
    </>
  );
}
