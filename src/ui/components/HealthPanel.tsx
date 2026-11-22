import { GAME_CONTENT } from '../../content';
import {
  HEALTH_ACTION_ENERGY,
  brainHint,
  canManageMoney,
  conditionDef,
  healthActionBlock,
  healthActionCost,
  injuryDef,
  injuryVeto,
  monthsText,
  sequelaDef,
  treatBlockReason,
  treatmentCost,
} from '../../engine';
import type { ActiveInjury, GameState, HealthActionId, Treatment } from '../../engine';
import { useGameStore } from '../store';
import { Bar } from './fightUi';
import { Btn, Section, money, useConfirm } from './ecoUi';

const C = GAME_CONTENT;
const SEVERITY = ['', 'leve', 'moderada', 'grave', 'gravíssima'];
const SEV_COLOR = ['', 'text-amber-300', 'text-orange-300', 'text-rose-300', 'text-rose-400'];
const TREAT_LABEL: Record<Treatment, string> = { none: 'Sem tratamento', repouso: 'Repouso', fisio: 'Fisioterapia', cirurgia: 'Cirurgia' };
const BLOCK: Record<string, string> = {
  busy: 'Resolva o evento',
  already: 'Já em tratamento',
  'no-money': 'Sem dinheiro',
  'no-energy': 'Sem energia',
  'no-surgery': 'Não indicada',
  'not-found': '—',
};

function InjuryCard({ game, inj }: { game: GameState; inj: ActiveInjury }) {
  const treat = useGameStore((s) => s.treatInjury);
  const [modal, confirm] = useConfirm();
  const def = injuryDef(C, inj.defId);
  if (!def) return null;
  // sem números: as habilidades de luta são ocultas
  const effects = Object.keys(def.effects.skills ?? {}).map((k) => (k === 'jiujitsu' ? 'atrapalha o jogo de chão' : k === 'trocacao' ? 'atrapalha a trocação' : k === 'athletic' ? 'tira o fôlego' : 'deixa o queixo mais frágil'));
  const options: Treatment[] = def.surgery ? ['repouso', 'fisio', 'cirurgia'] : ['repouso', 'fisio'];
  const pick = (t: Treatment) => {
    const cost = treatmentCost(game, C, def, t);
    if (t !== 'cirurgia') return treat(inj.id, t);
    confirm({
      title: `Cirurgia: ${def.name}`,
      lines: [
        { label: 'Custo', value: money.format(cost), strong: true },
        { label: 'Chance de sucesso', value: `${Math.round(def.surgery!.successChance * 100)}%` },
        { label: 'Recuperação', value: `${monthsText(Math.max(1, Math.round(inj.months * def.surgery!.monthsFactor)))} (em vez de ${monthsText(inj.months)})` },
      ],
      note: 'Se a cirurgia der errado, fica uma sequela permanente.',
      confirmLabel: 'Operar',
      onConfirm: () => treat(inj.id, 'cirurgia'),
    });
  };
  return (
    <li className="rounded-xl bg-slate-950 p-3" data-testid={`injury-${inj.defId}`}>
      {modal}
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold first-letter:uppercase">{def.name}</p>
        <span className={`shrink-0 text-[11px] ${SEV_COLOR[def.severity]}`}>{SEVERITY[def.severity]}</span>
      </div>
      <p className="text-[11px] text-slate-400">
        Falta{inj.months > 1 ? 'm' : ''} {monthsText(inj.months)} · {TREAT_LABEL[inj.treatment]}
        {inj.aggravated ? ' · agravada' : ''}
      </p>
      {effects.length > 0 && <p className="text-[11px] text-slate-500">Na luta: {effects.join(', ')}</p>}
      {inj.treatment === 'none' ? (
        <div className={`mt-2 grid gap-2 ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {options.map((t) => {
            const r = treatBlockReason(game, inj.id, t, C);
            const cost = treatmentCost(game, C, def, t);
            return (
              <Btn key={t} testId={`treat-${t}`} tone={t === 'repouso' ? 'default' : 'primary'} disabled={r !== null} onClick={() => pick(t)}>
                {TREAT_LABEL[t]}
                <span className="block text-[10px] text-slate-400">{r ? BLOCK[r] : t === 'repouso' ? 'grátis' : `${money.format(cost)}${t === 'fisio' ? ' · ⚡1' : ''}`}</span>
              </Btn>
            );
          })}
        </div>
      ) : null}
    </li>
  );
}

const ACTIONS: { id: HealthActionId; label: string; emoji: string; hint: string }[] = [
  { id: 'checkup', label: 'Check-up', emoji: '🩺', hint: 'detecta doenças cedo' },
  { id: 'gym', label: 'Academia comum', emoji: '🏋️', hint: '+condicionamento, +saúde' },
  { id: 'diet', label: 'Dieta', emoji: '🥗', hint: '+saúde, menos doenças' },
];

export default function HealthPanel({ game }: { game: GameState }) {
  const act = useGameStore((s) => s.healthAction);
  const st = game.character.stats;
  const h = game.health;
  const veto = injuryVeto(game);
  const hint = brainHint(game);
  return (
    <div className="flex flex-col gap-3" data-testid="health-panel">
      <Section title="Corpo">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="mb-1 flex justify-between text-slate-300">
              <span>❤️ Saúde</span>
              <span className="tabular-nums">{st.health}</span>
            </div>
            <Bar value={st.health} color={st.health >= 60 ? 'bg-emerald-500' : st.health >= 30 ? 'bg-amber-400' : 'bg-rose-500'} className="h-2" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-slate-300">
              <span>🏃 Capacidade atlética</span>
              <span className="tabular-nums">{st.athletic}</span>
            </div>
            <Bar value={st.athletic} color="bg-sky-500" className="h-2" />
          </div>
        </div>
        {hint && <p className="mt-3 rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-200" data-testid="brain-hint">🧠 {hint}</p>}
      </Section>

      <Section title="Lesões" right={veto ? <span className="text-[11px] text-rose-300">sem condições de lutar</span> : undefined}>
        {h.injuries.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma lesão no momento.</p>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {h.injuries.map((i) => (
                <InjuryCard key={i.id} game={game} inj={i} />
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-400">Lutar ou fazer sparring antes de sarar pode agravar a lesão e deixar sequela.</p>
          </>
        )}
      </Section>

      {h.sequelae.length > 0 && (
        <Section title="Sequelas permanentes">
          <ul className="flex flex-col gap-1.5">
            {h.sequelae.map((id) => {
              const d = sequelaDef(C, id);
              return (
                <li key={id} className="rounded-xl bg-slate-950 px-3 py-2 text-sm">
                  <span className="font-semibold first-letter:uppercase">{d?.name ?? id}</span>
                  <span className="block text-[11px] text-slate-400">{d?.description}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {h.conditions.length > 0 && (
        <Section title="Doenças">
          <ul className="flex flex-col gap-1.5">
            {h.conditions.map((c) => {
              const d = conditionDef(C, c.defId);
              return (
                <li key={c.defId} className="flex items-baseline justify-between gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm">
                  <span className="first-letter:uppercase">{d?.name ?? c.defId}</span>
                  <span className={`shrink-0 text-[11px] ${c.controlled ? 'text-emerald-300' : 'text-rose-300'}`}>{c.controlled ? 'em tratamento' : 'sem tratamento'}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-slate-400">Um check-up coloca as doenças em tratamento (o custo anual sai pelo extrato).</p>
        </Section>
      )}

      <Section title="Cuidar da saúde">
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map((a) => {
            const r = healthActionBlock(game, C, a.id);
            const cost = game.character.age >= 18 ? healthActionCost(game, C, a.id) : 0;
            return (
              <button
                key={a.id}
                data-testid={`health-${a.id}`}
                disabled={r !== null || !canManageMoney(game)}
                onClick={() => act(a.id)}
                className="flex min-h-11 flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-1 py-2 active:scale-95 disabled:opacity-40"
              >
                <span className="text-xl">{a.emoji}</span>
                <span className="text-center text-[11px] leading-tight">{a.label}</span>
                <span className="text-[10px] text-slate-400">
                  {r === 'done' ? 'feito este ano' : r === 'too-young' ? 'a partir dos 14' : `⚡${HEALTH_ACTION_ENERGY}${cost ? ` · ${money.format(cost)}` : ''}`}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">{ACTIONS.map((a) => `${a.label}: ${a.hint}`).join(' · ')}.</p>
      </Section>
    </div>
  );
}
