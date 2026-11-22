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
import StatBars from '../components/StatBars';
import { useGameStore } from '../store';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Life() {
  const game = useGameStore((s) => s.game);
  const doAction = useGameStore((s) => s.doAction);
  const joinClub = useGameStore((s) => s.joinClub);
  const leaveClub = useGameStore((s) => s.leaveClub);
  const advance = useGameStore((s) => s.advance);
  const choose = useGameStore((s) => s.choose);
  const newLife = useGameStore((s) => s.newLife);
  const [tab, setTab] = useState<'vida' | 'carreira' | 'ranking'>('vida');
  if (!game) return null;

  const { character: c } = game;
  const pending = game.pendingEvents[0];
  const pendingEvent = pending ? GAME_CONTENT.events.find((e) => e.id === pending.eventId) : undefined;

  const confirmNewLife = () => {
    if (!game.alive || window.confirm('Começar uma nova vida? A vida atual será perdida.')) void newLife();
  };

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 pb-2 pt-4 backdrop-blur">
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
            <p className="font-semibold text-emerald-400 tabular-nums">{money.format(game.money)}</p>
            <button onClick={confirmNewLife} className="mt-1 text-xs text-slate-400 underline">
              Nova vida
            </button>
          </div>
        </div>
        <nav className="mt-3 grid grid-cols-3 gap-1" role="tablist">
          {(
            [
              ['vida', '🏠 Vida'],
              ['carreira', `🥊 Carreira${game.fighter.offers.length ? ` (${game.fighter.offers.length})` : ''}`],
              ['ranking', '🏆 Ranking'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-lg py-2 text-sm ${tab === id ? 'bg-slate-800 font-bold text-white' : 'text-slate-400'}`}
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
        {tab === 'ranking' && <RankingPanel game={game} />}
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
          <button onClick={confirmNewLife} className="w-full rounded-xl bg-slate-200 py-4 text-lg font-bold text-slate-950">
            🔁 Nova vida
          </button>
        )}
      </footer>

      {game.activeFight && <FightScreen key={game.activeFight.offer.id} af={game.activeFight} />}
      {!game.activeFight && pending && pendingEvent && <EventModal game={game} event={pendingEvent} pending={pending} onChoose={choose} />}
    </>
  );
}
