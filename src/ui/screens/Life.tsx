/**
 * Tela principal (Etapa 8): busto do personagem no topo, o log da vida como feed por ano, energia, barras dos
 * atributos visíveis (recolhíveis) e a barra inferior com os menus e o botão "+ Idade".
 */
import { Briefcase, ChevronDown, ChevronUp, HeartHandshake, Sparkles, Wallet } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GAME_CONTENT } from '../../content';
import type { LogYear, StatKey } from '../../engine';
import { LIFE_STAGE_LABEL, deriveAvatar, lifeStage } from '../../engine';
import { AgeButton, BottomNav, StatBar } from '../design/components';
import { EventModal, ResultModal } from '../design/modals';
import FightScreen from '../components/FightScreen';
import MenuHost from '../components/MenuHost';
import PixelAvatar from '../avatar/PixelAvatar';
import AvatarSheet from '../avatar/AvatarSheet';
import NavHost from './menus/NavHost';
import { useNav } from '../nav';
import { useGameStore } from '../store';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const STATS: { key: StatKey; label: string; color: string; emoji: string }[] = [
  { key: 'happiness', label: 'Felicidade', color: 'var(--ds-stat-happy)', emoji: '😊' },
  { key: 'health', label: 'Saúde', color: 'var(--ds-stat-health)', emoji: '❤️' },
  { key: 'intelligence', label: 'Inteligência', color: 'var(--ds-stat-smart)', emoji: '🧠' },
  { key: 'looks', label: 'Aparência', color: 'var(--ds-stat-looks)', emoji: '✨' },
  { key: 'athletic', label: 'Cap. atlética', color: 'var(--ds-stat-athletic)', emoji: '💪' },
];

/** Feed do log: frases curtas agrupadas por idade; rola sozinho até o ano atual (embaixo). */
function LifeFeed({ log }: { log: LogYear[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const total = log.reduce((n, y) => n + y.entries.length, 0);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [total]);
  return (
    <div ref={ref} className="flex-1 overflow-y-auto overscroll-contain px-4 py-3" data-testid="life-log" aria-live="polite">
      {log.map((y, i) => (
        <section key={`${y.year}-${y.age}`} className={`mb-4 ${i === log.length - 1 ? 'ds-anim-rise' : ''}`}>
          <h3 className="ds-pixel-title text-[15px] text-[var(--ds-accent)]">
            Idade: {y.age} {y.age === 1 ? 'ano' : 'anos'} <span className="font-sans text-xs text-[var(--ds-text-muted)]">· {y.year}</span>
          </h3>
          <ul className="mt-1 space-y-1 text-[15px] leading-snug">
            {y.entries.map((e, j) => (
              <li key={j}>{e}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function EnergyDots({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--ds-text-muted)]" role="meter" aria-label="Energia do ano" aria-valuemin={0} aria-valuemax={max} aria-valuenow={current} data-testid="energy">
      <span aria-hidden>⚡</span>
      <span className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < current ? 'bg-[var(--ds-age)]' : 'bg-[var(--ds-surface-2)]'}`} />
        ))}
      </span>
      <span className="tabular-nums">
        {current}/{max} energia
      </span>
    </div>
  );
}

export default function Life({ onShowObituary }: { onShowObituary?: () => void }) {
  const game = useGameStore((s) => s.game);
  const advance = useGameStore((s) => s.advance);
  const choose = useGameStore((s) => s.choose);
  const outcome = useGameStore((s) => s.outcome);
  const dismissOutcome = useGameStore((s) => s.dismissOutcome);
  const nav = useNav();
  const [profile, setProfile] = useState(false);
  const [statsOpen, setStatsOpen] = useState(true);
  const desc = useMemo(() => (game ? deriveAvatar(game, GAME_CONTENT, game.activeFight ? 'luta' : 'principal') : null), [game]);
  if (!game || !desc) return null;
  const c = game.character;
  const pending = game.pendingEvents[0];
  const pendingEvent = pending ? GAME_CONTENT.events.find((e) => e.id === pending.eventId) : undefined;
  const root = nav.stack[0]?.id;
  const busy = game.pendingEvents.length > 0 || !!game.activeFight;
  const usable = game.energy.max - (game.energy.reserved ?? 0);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={() => setProfile(true)} aria-label="Abrir perfil e guarda-roupa" className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--ds-avatar-bg)]" data-testid="avatar-button">
          <PixelAvatar d={desc} scale={2} bust animate={!profile} label={`Avatar de ${c.name}`} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="ds-pixel-title truncate text-lg leading-tight" data-testid="char-name">
            {c.name}
          </h1>
          <p className="truncate text-xs text-[var(--ds-text-muted)]" data-testid="char-age">
            {c.age} {c.age === 1 ? 'ano' : 'anos'} · {LIFE_STAGE_LABEL[lifeStage(c.age)]} · <span data-testid="char-city">{c.city} – {c.uf}</span>
          </p>
          <p className={`text-sm font-semibold tabular-nums ${game.money < 0 ? 'text-[var(--ds-danger)]' : 'text-[var(--ds-accent)]'}`} data-testid="money">
            {money.format(game.money)}
            {game.economy.debt > 0 && <span className="ml-2 text-xs text-[var(--ds-danger)]">dívida {money.format(game.economy.debt)}</span>}
          </p>
        </div>
        <MenuHost className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl" />
      </header>

      <LifeFeed log={game.log} />

      <div className="border-t border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 pt-2">
        <div className="flex items-center justify-between">
          {game.alive ? <EnergyDots current={game.energy.current} max={Math.max(game.energy.current, usable)} /> : <span className="text-xs text-[var(--ds-text-muted)]">Fim da vida</span>}
          <button type="button" onClick={() => setStatsOpen((v) => !v)} aria-expanded={statsOpen} className="flex min-h-9 items-center gap-1 text-xs text-[var(--ds-text-muted)]" data-testid="stats-toggle">
            Atributos {statsOpen ? <ChevronDown size={14} aria-hidden /> : <ChevronUp size={14} aria-hidden />}
          </button>
        </div>
        {statsOpen && (
          <div className="flex flex-col gap-1.5 py-2" data-testid="stat-bars">
            {STATS.map((s) => (
              <StatBar key={s.key} label={s.label} value={c.stats[s.key]} color={s.color} icon={<span aria-hidden>{s.emoji}</span>} compact />
            ))}
          </div>
        )}
      </div>

      {game.alive ? (
        <BottomNav
          left={[
            { id: 'ocupacao', label: 'Ocupação', icon: Briefcase, onClick: () => nav.open('ocupacao'), active: root === 'ocupacao' || root === 'carreiras', badge: game.fighter.offers.length > 0 },
            { id: 'bens', label: 'Bens', icon: Wallet, onClick: () => nav.open('bens'), active: root === 'bens', badge: game.economy.debt > 0 },
          ]}
          center={<AgeButton onClick={advance} disabled={busy} />}
          right={[
            { id: 'relacoes', label: 'Relações', icon: HeartHandshake, onClick: () => nav.open('relacoes'), active: root === 'relacoes' },
            { id: 'atividades', label: 'Atividades', icon: Sparkles, onClick: () => nav.open('atividades'), active: root === 'atividades' },
          ]}
        />
      ) : (
        <div className="border-t border-[var(--ds-border)] bg-[var(--ds-surface)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => onShowObituary?.()} className="min-h-12 w-full rounded-[var(--ds-radius)] bg-[var(--ds-text)] font-bold text-[var(--ds-bg)]">
            🕯️ Ver obituário
          </button>
        </div>
      )}

      <NavHost game={game} />
      {game.activeFight && <FightScreen key={game.activeFight.offer.id} af={game.activeFight} />}
      {!game.activeFight && pending && pendingEvent && <EventModal game={game} event={pendingEvent} pending={pending} onChoose={choose} />}
      {!pending && outcome && <ResultModal outcome={outcome} onClose={dismissOutcome} />}
      {profile && <AvatarSheet onClose={() => setProfile(false)} />}
    </div>
  );
}
