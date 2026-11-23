/** Peças da carreira de luta (academia, treino, ofertas, aposentadoria) usadas pela tela central (`menus/fightCareer.tsx`). */
import AvatarThumb from '../avatar/AvatarThumb';
import { fighterAvatar } from '../avatar/descriptors';
import { useState } from 'react';
import { GAME_CONTENT } from '../../content';
import {
  AGGRESSIVE_CUT_MISS_CHANCE,
  fightBlockReason,
  getOrg,
  gymBlockReason,
  gymsInCity,
  opponentFullName,
  recordText,
  retireBlockReason,
  trainingBlockReason,
} from '../../engine';
import type { CareerRecord, FightOffer, GameState, TrainingKind } from '../../engine';
import { useGameStore } from '../store';
import { gymModalitiesText } from '../text/fight';
import { STYLE_LABEL, money } from './fightUi';

const C = GAME_CONTENT;

const BLOCK_TEXT: Record<string, string> = {
  'no-sessions': 'Sem tempo livre',
  busy: 'Resolva o evento',
  'too-young': 'Muito novo',
  injured: 'Lesionado',
  suspended: 'Suspenso',
  dead: '—',
  unknown: '—',
  'bad-skill': '—',
  'other-city': 'Outra cidade',
  current: 'Sua academia',
  'no-money': 'Sem dinheiro',
  retired: 'Aposentado',
};

export function RecordLine({ label, r }: { label: string; r: CareerRecord }) {
  const total = r.wins + r.losses + r.draws;
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span>
        <span className="font-semibold tabular-nums">{recordText(r)}</span>
        {r.wins > 0 && (
          <span className="ml-2 text-[11px] text-slate-500">
            KO {r.winsBy.KO} · FIN {r.winsBy.SUB} · DEC {r.winsBy.DEC}
          </span>
        )}
        {total === 0 && <span className="ml-2 text-[11px] text-slate-500">sem lutas</span>}
      </span>
    </div>
  );
}


/** Próximo degrau da escada: a organização com contrato de nível acima e o que falta. */

export function TrainingButtons({ game }: { game: GameState }) {
  const train = useGameStore((s) => s.train);
  const gym = GAME_CONTENT.fighting.gyms.find((g) => g.id === game.fighter.gymId);
  const items: { kind: TrainingKind; label: string; emoji: string }[] = [
    ...GAME_CONTENT.fighting.modalities.filter((m) => gym?.modalities.includes(m.id)).map((m) => ({ kind: m.id, label: m.label, emoji: m.emoji })),
    { kind: 'fisico', label: 'Físico', emoji: '🫀' },
    { kind: 'sparring', label: 'Sparring', emoji: '🤼' },
  ];
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Treinar</h2>
      <div className="grid grid-cols-4 gap-2">
        {items.map((it) => {
          const reason = trainingBlockReason(game, it.kind, C);
          return (
            <button
              key={it.kind}
              disabled={reason !== null}
              onClick={() => train(it.kind)}
              data-testid={`fc-train-${it.kind}`}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-1 py-2 active:scale-95 disabled:opacity-40"
            >
              <span className="text-xl">{it.emoji}</span>
              <span className="text-center text-[11px] leading-tight">{it.label}</span>
              <span className="text-[10px] text-slate-400">{reason ? BLOCK_TEXT[reason] : 'Treinar'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function GymSection({ game }: { game: GameState }) {
  const joinGym = useGameStore((s) => s.joinGym);
  const leaveGym = useGameStore((s) => s.leaveGym);
  const [open, setOpen] = useState(false);
  const gym = C.fighting.gyms.find((g) => g.id === game.fighter.gymId);
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 text-sm">
          <div className="truncate font-semibold">🏟️ {gym ? gym.name : 'Sem academia'}</div>
          {gym ? (
            <div className="text-[11px] text-slate-400">
              Treinador {gym.coach} · {gymModalitiesText(gym)} · {money.format(gym.fee)}/ano
              {game.character.age < 18 ? ' (pais pagam)' : game.fighter.reputation >= 15 ? ' (bolsa de atleta)' : ''}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Treinar sozinho rende bem menos.</div>
          )}
        </div>
        <button onClick={() => setOpen((v) => !v)} className="shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-xs" aria-expanded={open}>
          {gym ? 'Trocar' : 'Escolher'}
        </button>
      </div>
      {open && (
        <ul className="mt-2 flex flex-col gap-1" data-testid="gym-list">
          {gymsInCity(game, C)
            .slice()
            .sort((a, b) => b.coach - a.coach)
            .map((g) => {
              const reason = gymBlockReason(game, g.id, C);
              return (
                <li key={g.id}>
                  <button
                    disabled={reason !== null}
                    onClick={() => {
                      joinGym(g.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm active:bg-slate-800 disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{g.name}</span>
                      <span className="text-[11px] text-slate-400">
                        Treinador {g.coach} · {gymModalitiesText(g)} · {money.format(g.fee)}/ano
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400">{reason ? BLOCK_TEXT[reason] : 'Entrar'}</span>
                  </button>
                </li>
              );
            })}
          {gym && (
            <button onClick={() => { leaveGym(); setOpen(false); }} className="mt-1 rounded-lg border border-slate-700 py-2 text-sm text-rose-300">
              Sair da {gym.name}
            </button>
          )}
        </ul>
      )}
    </section>
  );
}

const KIND_BADGE: Record<FightOffer['kind'], string> = {
  regular: '',
  title: '🏆 Disputa de cinturão',
  shortNotice: '⏱️ Substituição de última hora',
  rival: '🔥 Rivalidade',
  bjj: '🥋 Jiu-jitsu',
  kids: '🧒 Torneio infantil',
  farewell: '👋 Luta de despedida',
};

export function OfferCard({ game, offer }: { game: GameState; offer: FightOffer }) {
  const accept = useGameStore((s) => s.acceptOffer);
  const decline = useGameStore((s) => s.declineOffer);
  const [cut, setCut] = useState(false);
  const org = getOrg(C, offer.orgId)!;
  const o = offer.opponent;
  const reason = fightBlockReason(game, offer, C);
  const rank = o.rank === 0 ? 'Campeão' : o.rank ? `#${o.rank}` : null;
  return (
    <li className="rounded-2xl border border-slate-700 bg-slate-900 p-3" data-testid="offer">
      <div className="flex items-start justify-between gap-2">
        <AvatarThumb d={fighterAvatar(game, o, o.rank === 0)} size={52} label={opponentFullName(o)} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            {org.short} · {offer.rounds} round{offer.rounds > 1 ? 's' : ''}
            {offer.rules === 'grappling' ? ' · regras de grappling' : ''}
          </p>
          <p className="truncate font-semibold">{opponentFullName(o)}</p>
          <p className="text-[11px] text-slate-400">
            {recordText(o.record)} · {STYLE_LABEL[o.style]}
            {rank && <span className="ml-1 text-amber-300">· {rank}</span>}
          </p>
        </div>
        {KIND_BADGE[offer.kind] && <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">{KIND_BADGE[offer.kind]}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-slate-300">
        {offer.purse + offer.winBonus > 0 ? (
          <span>💰 {money.format(offer.purse)} + {money.format(offer.winBonus)} se vencer</span>
        ) : (
          <span>🏅 Medalha e reputação</span>
        )}
        <span>Camp {offer.campSessions <= 2 ? 'curto' : offer.campSessions <= 4 ? 'médio' : 'longo'}</span>
      </div>
      {offer.rules === 'mma' && (
        <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" checked={cut} onChange={(e) => setCut(e.target.checked)} className="h-4 w-4 accent-amber-500" />
          Corte de peso agressivo (mais força, {Math.round(AGGRESSIVE_CUT_MISS_CHANCE * 100)}% de risco de não bater o peso)
        </label>
      )}
      {game.health.injuries.length > 0 && (
        <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200" data-testid="injured-warning">
          ⚠️ Você está lesionado(a): lutar agora pesa nas habilidades e pode agravar a lesão.
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => decline(offer.id)} className="rounded-xl border border-slate-600 py-2 text-sm">
          Recusar
        </button>
        <button
          disabled={reason !== null}
          onClick={() => accept(offer.id, cut)}
          className="rounded-xl bg-emerald-500 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"
        >
          {reason ? BLOCK_TEXT[reason] : 'Aceitar luta'}
        </button>
      </div>
    </li>
  );
}

export function RetireSection({ game }: { game: GameState }) {
  const retire = useGameStore((s) => s.retire);
  const [confirming, setConfirming] = useState(false);
  const f = game.fighter;
  const reason = retireBlockReason(game);
  if (reason === 'never-fought') return null;
  if (f.retired) {
    const why = { voluntaria: 'por decisão própria', lesao: 'por causa das lesões', medica: 'por veto médico', derrotas: 'depois de uma sequência de derrotas' }[f.retired.reason];
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm" data-testid="retired-box">
        <p>🏁 Você se aposentou aos {f.retired.age} anos, {why}.</p>
        <p className="mt-1 text-xs text-slate-400">A reputação cai devagar. Dá para seguir como treinador(a), comentarista ou dono(a) de academia (abas Trabalho e Empresas). Uma volta aos ringues pode aparecer como evento.</p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      {!confirming ? (
        <button data-testid="retire" disabled={reason !== null} onClick={() => setConfirming(true)} className="min-h-11 w-full rounded-xl border border-slate-600 py-2 text-sm text-slate-200 disabled:opacity-40">
          🏁 Aposentar da luta
        </button>
      ) : (
        <div>
          <p className="text-sm">Pendurar as luvas? Você sai dos rankings, os cinturões ficam vagos e o contrato acaba.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirming(false)} className="min-h-11 rounded-xl border border-slate-600 py-2 text-sm">
              Ainda não
            </button>
            <button
              data-testid="retire-confirm"
              onClick={() => {
                setConfirming(false);
                retire();
              }}
              className="min-h-11 rounded-xl bg-amber-500 py-2 text-sm font-bold text-slate-950"
            >
              Aposentar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
