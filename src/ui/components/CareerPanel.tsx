import AvatarThumb from '../avatar/AvatarThumb';
import { fighterAvatar } from '../avatar/descriptors';
import { useState } from 'react';
import { GAME_CONTENT } from '../../content';
import {
  coachAssessment,
  AGGRESSIVE_CUT_MISS_CHANCE,
  BELTS,
  BELT_EMOJI,
  PLAYER_ID,
  currentRosterKey,
  fightBlockReason,
  getOrg,
  gymBlockReason,
  gymsInCity,
  injuryVeto,
  monthsText,
  worstInjury,
  opponentFullName,
  orgRequirementGap,
  playerDivision,
  rankOf,
  recentProWinRate,
  recordText,
  retireBlockReason,
  tierIndex,
  trainingBlockReason,
} from '../../engine';
import type { CareerRecord, FightOffer, GameState, OrgBlockReason, TrainingKind } from '../../engine';
import { useGameStore } from '../store';
import { Bar, STYLE_LABEL, money } from './fightUi';

const C = GAME_CONTENT;

const BLOCK_TEXT: Record<string, string> = {
  'no-sessions': 'Sem sessões',
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

function RecordLine({ label, r }: { label: string; r: CareerRecord }) {
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

function gapText(state: GameState, reason: OrgBlockReason, orgId: string): string {
  const org = getOrg(C, orgId)!;
  const req = org.requirements;
  const f = state.fighter;
  switch (reason) {
    case 'age':
      return `idade mínima ${org.minAge} anos`;
    case 'signing-age':
      return `só contratam até ${req.maxSigningAge} anos`;
    case 'amateur-wins':
      return `${req.minAmateurWins} vitórias amadoras (você tem ${f.amateur.wins})`;
    case 'pro-wins':
      return `${req.minProWins} vitórias profissionais (você tem ${f.pro.wins})`;
    case 'reputation':
      return `reputação ${req.minReputation} (você tem ${f.reputation})`;
    case 'belt':
      return `faixa ${BELTS[req.minBelt ?? 0]}`;
    case 'win-rate':
      return `aproveitamento de ${Math.round((req.minProWinRate ?? 0) * 100)}% nas últimas lutas (você: ${Math.round(recentProWinRate(state) * 100)}%)`;
  }
}

/** Próximo degrau da escada: a organização com contrato de nível acima e o que falta. */
function NextStep({ game }: { game: GameState }) {
  const current = getOrg(C, game.fighter.orgId);
  const next = C.fighting.orgs
    .filter((o) => o.contract && (!current || tierIndex(o.tier) > tierIndex(current.tier)))
    .sort((a, b) => tierIndex(a.tier) - tierIndex(b.tier) || (a.requirements.minReputation ?? 0) - (b.requirements.minReputation ?? 0))[0];
  if (!next) return null;
  const gap = orgRequirementGap(game, next);
  return (
    <p className="rounded-xl bg-slate-800/60 px-3 py-2 text-xs text-slate-300">
      🎯 Próximo passo: <b>{next.name}</b> — {gap ? `falta ${gapText(game, gap, next.id)}.` : 'requisitos atendidos! Aguarde a proposta.'}
    </p>
  );
}

function TrainingButtons({ game }: { game: GameState }) {
  const train = useGameStore((s) => s.train);
  const items: { kind: TrainingKind; label: string; emoji: string }[] = [
    { kind: 'jiujitsu', label: 'Jiu-jitsu', emoji: '🥋' },
    { kind: 'trocacao', label: 'Trocação', emoji: '🥊' },
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
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-1 py-2 active:scale-95 disabled:opacity-40"
            >
              <span className="text-xl">{it.emoji}</span>
              <span className="text-center text-[11px] leading-tight">{it.label}</span>
              <span className="text-[10px] text-slate-400">{reason ? BLOCK_TEXT[reason] : '1 sessão'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function GymSection({ game }: { game: GameState }) {
  const joinGym = useGameStore((s) => s.joinGym);
  const leaveGym = useGameStore((s) => s.leaveGym);
  const [open, setOpen] = useState(false);
  const gym = C.fighting.gyms.find((g) => g.id === game.fighter.gymId);
  const spec = { trocacao: 'trocação', jiujitsu: 'jiu-jitsu', mma: 'MMA' } as const;
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 text-sm">
          <div className="truncate font-semibold">🏟️ {gym ? gym.name : 'Sem academia'}</div>
          {gym ? (
            <div className="text-[11px] text-slate-400">
              Treinador {gym.coach} · {spec[gym.specialty]} · {money.format(gym.fee)}/ano
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
                        Treinador {g.coach} · {spec[g.specialty]} · {money.format(g.fee)}/ano
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

function OfferCard({ game, offer }: { game: GameState; offer: FightOffer }) {
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
        <span>Camp: {offer.campSessions} {offer.campSessions === 1 ? 'sessão' : 'sessões'} de treino</span>
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

export default function CareerPanel({ game }: { game: GameState }) {
  const f = game.fighter;
  const worst = worstInjury(game, C);
  const veto = injuryVeto(game);
  const org = getOrg(C, f.orgId);
  const div = playerDivision(game, C);
  const key = currentRosterKey(game, C);
  const roster = key ? game.world.rosters[key] : undefined;
  const rank = roster ? rankOf(roster, PLAYER_ID) : null;
  const rankText = rank === 0 ? '🏆 Campeão' : rank !== null ? `#${rank} no ranking` : org?.rankingSize ? 'Fora do ranking' : '';

  return (
    <div className="flex flex-col gap-4" data-testid="career-panel">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Organização</p>
            <p className="truncate font-bold" data-testid="career-org">{org ? org.name : game.character.age >= 15 ? 'Amador (sem contrato)' : 'Base / categorias infantis'}</p>
            <p className="text-xs text-slate-400">
              {div.label} · {game.character.heightCm} cm · {game.character.weightKg} kg
            </p>
          </div>
          {rankText && <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-1 text-xs text-amber-300" data-testid="career-rank">{rankText}</span>}
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <RecordLine label="Profissional" r={f.pro} />
          <RecordLine label="Amador" r={f.amateur} />
          <RecordLine label="Jiu-jitsu" r={f.bjj} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="mb-1 flex justify-between text-slate-300">
              <span>⭐ Reputação</span>
              <span className="tabular-nums">{f.reputation}</span>
            </div>
            <Bar value={f.reputation} color="bg-amber-400" />
          </div>
          <div className="text-slate-300" data-testid="career-belt">
            {BELT_EMOJI[f.belt.rank]} Faixa {BELTS[f.belt.rank]}
            <span className="text-slate-500"> · {f.belt.years} ano{f.belt.years === 1 ? '' : 's'}</span>
          </div>
        </div>
        {(worst || f.suspendedYears > 0 || f.retired) && (
          <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300" data-testid="career-status">
            {f.retired && `🏁 Aposentado${game.character.sex === 'F' ? 'a' : ''} desde os ${f.retired.age} anos. `}
            {worst && `🩹 Lesão: ${worst.def.name} (${monthsText(worst.injury.months)}${veto ? ', sem condições de lutar' : ', lutar agora é arriscado'}). `}
            {f.suspendedYears > 0 && `⛔ Suspenso por ${f.suspendedYears} ano(s).`}
          </p>
        )}
      </section>

      <NextStep game={game} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Avaliação do treinador</h2>
        <p className="text-sm" data-testid="coach-assessment">
          Geral: <b>{coachAssessment(game)}</b> · Chão: <b>{coachAssessment(game, 'jiujitsu')}</b> · Em pé: <b>{coachAssessment(game, 'trocacao')}</b>
        </p>
      </section>

      <GymSection game={game} />
      <TrainingButtons game={game} />

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Ofertas de luta deste ano</h2>
        {f.offers.length === 0 ? (
          <p className="rounded-xl bg-slate-900/60 px-3 py-3 text-sm text-slate-400">
            {f.retired ? 'Aposentado: sem ofertas de luta.' : veto ? 'Lesão grave: sem lutas até se recuperar.' : f.suspendedYears > 0 ? 'Suspenso: sem lutas.' : game.character.age < 6 ? 'Ainda muito novo para competir.' : !f.gymId ? 'Entre numa academia (ou num clube de luta da escola) para receber convites.' : 'Nenhuma oferta pendente. Novas ofertas chegam no próximo ano.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {f.offers.map((o) => (
              <OfferCard key={o.id} game={game} offer={o} />
            ))}
          </ul>
        )}
      </section>

      {f.history.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Últimas lutas</h2>
          <ul className="flex flex-col gap-1 text-xs">
            {f.history
              .slice(-6)
              .reverse()
              .map((h, i) => (
                <li key={i} className="flex justify-between gap-2 rounded-lg bg-slate-900/60 px-3 py-1.5">
                  <span className={h.result === 'W' ? 'text-emerald-400' : h.result === 'L' ? 'text-rose-400' : 'text-slate-300'}>
                    {h.result === 'W' ? 'V' : h.result === 'L' ? 'D' : 'E'} {h.title ? '🏆 ' : ''}
                    {h.opponent}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {getOrg(C, h.orgId)?.short} · {h.method === 'DEC' ? 'Decisão' : h.method === 'SUB' ? 'Finalização' : h.method === 'DOC' ? 'Médico' : h.method} · R{h.round} · {h.age}a
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}
      <RetireSection game={game} />
    </div>
  );
}

/** Aposentadoria (Etapa 6): botão com confirmação; abre o evento de despedida. */
function RetireSection({ game }: { game: GameState }) {
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
