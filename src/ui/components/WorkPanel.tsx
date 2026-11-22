import { GAME_CONTENT } from '../../content';
import {
  AGENT_CUT,
  AGENT_PURSE_BONUS,
  EDUCATION_LABEL,
  SEEK_SPONSOR_COST,
  WORK_HARD_COST,
  canManageMoney,
  cityMultOf,
  educationLevel,
  eligibleSponsors,
  getOrg,
  jobBlockReason,
  jobDef,
  salaryOf,
  seekSponsorBlockReason,
  sponsorDef,
} from '../../engine';
import type { GameState, JobBlockReason, JobCategory, JobDef } from '../../engine';
import { useGameStore } from '../store';
import { Bar } from './fightUi';
import { Btn, Row, Section, money } from './ecoUi';

const C = GAME_CONTENT;

const CATEGORY_TITLE: Record<JobCategory, string> = { meio_periodo: 'Meio período', formal: 'Emprego formal', luta: 'Ligados à luta' };

function reasonText(r: JobBlockReason, def: JobDef): string {
  switch (r) {
    case 'age':
      return `a partir de ${def.minAge} anos`;
    case 'education':
      return `exige ${EDUCATION_LABEL[def.education].toLowerCase()}`;
    case 'stats': {
      const m = def.minStats ?? {};
      return [m.intelligence && `inteligência ${m.intelligence}`, m.strength && `força ${m.strength}`, m.looks && `aparência ${m.looks}`].filter(Boolean).join(', ');
    }
    case 'reputation':
      return `reputação ${def.minReputation}`;
    case 'fight':
      return `faixa roxa ou ${def.fightReq?.minProWins ?? 0} vitórias pro`;
    case 'no-energy':
      return `precisa de ⚡${1 + def.energy}`;
    case 'current':
      return 'seu emprego atual';
    case 'busy':
      return 'resolva o evento';
    case 'dead':
      return '—';
  }
}

function CurrentJob({ game }: { game: GameState }) {
  const workHard = useGameStore((s) => s.workHard);
  const askRaise = useGameStore((s) => s.askRaise);
  const quitJob = useGameStore((s) => s.quitJob);
  const job = game.economy.job;
  const def = jobDef(C, job?.jobId);
  const ok = canManageMoney(game);
  if (!job || !def) {
    return (
      <Section title="Emprego">
        <p className="text-sm text-slate-400">Você está sem emprego.</p>
        <p className="text-[11px] text-slate-500">Escolaridade: {EDUCATION_LABEL[educationLevel(game)]}. Um emprego reserva parte da sua energia todo ano.</p>
      </Section>
    );
  }
  return (
    <Section title="Emprego" right={<span className="text-[11px] text-sky-300">⚡{def.energy} reservada/ano</span>}>
      <p className="font-semibold" data-testid="job-title">
        {def.title}
      </p>
      <Row label={`Nível ${job.level}/5 · ${job.years} ano(s)`} value={`${money.format(salaryOf(def, job.level, cityMultOf(game, C)))}/ano`} tone="pos" />
      <div className="my-1 text-[11px] text-slate-400">
        Desempenho {job.performance}
        <Bar value={job.performance} color={job.performance >= 75 ? 'bg-emerald-500' : job.performance >= 40 ? 'bg-amber-400' : 'bg-rose-500'} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Btn disabled={!ok || game.energy.current < WORK_HARD_COST} onClick={workHard}>
          💪 Dar o sangue <span className="block text-[10px] text-slate-400">⚡{WORK_HARD_COST}</span>
        </Btn>
        <Btn disabled={!ok || game.flags.pediu_aumento === game.year} onClick={askRaise}>
          💰 Pedir aumento
        </Btn>
        <Btn tone="danger" disabled={!ok} onClick={quitJob}>
          🚪 Pedir demissão
        </Btn>
      </div>
    </Section>
  );
}

function Openings({ game }: { game: GameState }) {
  const applyJob = useGameStore((s) => s.applyJob);
  const city = cityMultOf(game, C);
  const cats: JobCategory[] = ['meio_periodo', 'formal', 'luta'];
  return (
    <Section title="Vagas">
      {game.character.age < 16 ? (
        <p className="text-sm text-slate-400">Você poderá trabalhar a partir dos 16 anos (meio período).</p>
      ) : (
        <div className="flex flex-col gap-3">
          {cats.map((cat) => (
            <div key={cat}>
              <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">{CATEGORY_TITLE[cat]}</p>
              <ul className="flex flex-col gap-1.5">
                {C.economy.jobs
                  .filter((j) => j.category === cat)
                  .map((j) => {
                    const r = jobBlockReason(game, j);
                    return (
                      <li key={j.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-950 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm">{j.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {money.format(salaryOf(j, 1, city))}–{money.format(salaryOf(j, 5, city))}/ano · ⚡{j.energy}
                            {r && r !== 'no-energy' ? ` · ${reasonText(r, j)}` : ''}
                          </p>
                        </div>
                        <Btn testId={`apply-${j.id}`} tone="primary" disabled={r !== null} onClick={() => applyJob(j.id)} className="shrink-0">
                          {r === 'current' ? 'Atual' : r === 'no-energy' ? `⚡${1 + j.energy}` : 'Candidatar'}
                        </Btn>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
          <p className="text-[11px] text-slate-500">Candidatar-se custa ⚡1. Se for contratado, a energia do emprego já é reservada neste ano.</p>
        </div>
      )}
    </Section>
  );
}

function FightMoney({ game }: { game: GameState }) {
  const hireAgent = useGameStore((s) => s.hireAgent);
  const fireAgent = useGameStore((s) => s.fireAgent);
  const seekSponsor = useGameStore((s) => s.seekSponsor);
  const e = game.economy;
  const ok = canManageMoney(game);
  const seekBlock = seekSponsorBlockReason(game, C);
  const next = eligibleSponsors(game, C)[0];
  const contractOrg = e.contract ? getOrg(C, e.contract.orgId) : undefined;
  if (game.character.age < 14 && !e.sponsors.length) return null;
  return (
    <Section title="Dinheiro da luta">
      {e.contract && contractOrg && (
        <div className="mb-2 rounded-xl bg-slate-950 p-2">
          <Row label={`Contrato: ${contractOrg.name}`} value={`${money.format(e.contract.basePurse)}/luta`} />
          <p className="text-[11px] text-slate-500">
            Faltam {e.contract.fightsLeft} luta(s) · cartel no contrato {e.contract.wins}-{e.contract.losses}. Renova com bolsa maior se você vencer.
          </p>
        </div>
      )}
      <div className="mb-2 rounded-xl bg-slate-950 p-2">
        {e.agent ? (
          <>
            <Row label="Empresário" value={e.agent.name} />
            <p className="text-[11px] text-slate-500">
              +{Math.round(AGENT_PURSE_BONUS * 100)}% nas bolsas · comissão de {Math.round(e.agent.cut * 100)}%
            </p>
            <Btn className="mt-1 w-full" tone="danger" disabled={!ok} onClick={fireAgent}>
              Dispensar empresário
            </Btn>
          </>
        ) : (
          <>
            <p className="text-sm">Sem empresário</p>
            <p className="text-[11px] text-slate-500">
              Negocia bolsas {Math.round(AGENT_PURSE_BONUS * 100)}% maiores e fica com {Math.round(AGENT_CUT * 100)}%. Exige reputação 10.
            </p>
            <Btn className="mt-1 w-full" disabled={!ok || game.fighter.reputation < 10 || game.character.age < 16} onClick={hireAgent}>
              Contratar empresário
            </Btn>
          </>
        )}
      </div>
      <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Patrocínios</p>
      {e.sponsors.length === 0 && <p className="text-xs text-slate-500">Nenhum patrocínio ativo.</p>}
      <ul className="flex flex-col gap-1">
        {e.sponsors.map((sp) => {
          const def = sponsorDef(C, sp.sponsorId);
          return (
            <li key={sp.sponsorId} className="rounded-xl bg-slate-950 px-3 py-2">
              <Row label={def?.brand ?? sp.sponsorId} value={`${money.format(sp.amount)}/ano`} tone="pos" />
              <p className="text-[11px] text-slate-500">
                {sp.yearsLeft} ano(s) restante(s){def ? ` · cancela com ${def.maxLossStreak} derrotas seguidas${def.scandal ? ' ou escândalo' : ''}` : ''}
              </p>
            </li>
          );
        })}
      </ul>
      <Btn className="mt-2 w-full" testId="seek-sponsor" disabled={seekBlock !== null} onClick={seekSponsor}>
        🤝 Procurar patrocínio (⚡{SEEK_SPONSOR_COST})
        <span className="block text-[10px] text-slate-400">
          {seekBlock === 'none'
            ? 'nenhuma marca para a sua reputação ainda'
            : seekBlock === 'already'
              ? 'já procurou este ano'
              : seekBlock === 'suspended'
                ? 'suspenso: nenhuma marca quer você agora'
                : next
                  ? `melhor marca disponível: ${next.brand}`
                  : ''}
        </span>
      </Btn>
    </Section>
  );
}

export default function WorkPanel({ game }: { game: GameState }) {
  return (
    <div className="flex flex-col gap-3" data-testid="work-panel">
      <CurrentJob game={game} />
      <FightMoney game={game} />
      <Openings game={game} />
    </div>
  );
}
