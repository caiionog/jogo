/** Ocupação: minha ocupação, Carreiras (categorias → cartões → detalhe), Escola e Carreira de luta. */
import { Briefcase, Dumbbell, GraduationCap, Medal, School, Store, Swords, Trophy, UserRound } from 'lucide-react';
import { useState } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import type { CareerCategory, GameState, RequirementKey } from '../../../engine';
import {
  BELTS, actionBlockReason, careerCard, careersIn, cityMultOf, coachAssessment, fighterNextStep, gymBlockReason, gymsInCity, jobDef, jobTitle, salaryOf,
} from '../../../engine';
import { BottomSheet, DsButton, ListGroup, ListItem } from '../../design/components';
import { useNav } from '../../nav';
import { useGameStore } from '../../store';
import { jobReasonText } from '../../text/jobs';
import CareerPanel from '../../components/CareerPanel';
import SchoolPanel from '../../components/SchoolPanel';
import { money } from '../../components/ecoUi';

export const ACTION_REASON: Record<string, string> = {
  'too-young': 'Ainda muito novo(a) para isso',
  'too-old': 'Não combina com a sua idade',
  'no-energy': 'Energia insuficiente',
  'pending-event': 'Resolva o acontecimento pendente',
  'not-enrolled': 'Só para quem está na escola',
  'wrong-stage': 'Indisponível na sua série',
  dead: '—',
  unknown: '—',
};

const CAT_LABEL: Record<CareerCategory, { title: string; sub: string; minAge: number }> = {
  aprendiz: { title: 'Aprendiz e estágio', sub: 'A partir dos 14 (aprendiz) e 16 (estágio)', minAge: 14 },
  meio_periodo: { title: 'Meio período', sub: 'A partir dos 16 anos', minAge: 16 },
  integral: { title: 'Tempo integral', sub: 'A partir dos 18 anos', minAge: 18 },
};

const STAGE_LABEL = { sem_academia: 'Sem academia', aluno: 'Aluno(a) de academia', amador: 'Lutador(a) amador(a)', pro_regional: 'Profissional regional', liga_principal: 'Liga principal', aposentado: 'Aposentado(a)' } as const;

export function OcupacaoScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const job = game.economy.job;
  const def = jobDef(C, job?.jobId);
  const enrolled = !!game.education.current;
  return (
    <>
      <ListItem icon={UserRound} title="Minha ocupação" subtitle={[enrolled && 'Escola', def && jobTitle(def, job!.level), game.fighter.gymId && 'Treino de luta'].filter(Boolean).join(' · ') || 'Nada por enquanto'} onClick={() => nav.push('minha-ocupacao')} testId="occ-mine" />
      <ListItem icon={Briefcase} title="Carreiras" subtitle="Empregos, carreira de lutador, estudos e empreender" onClick={() => nav.push('carreiras')} testId="occ-careers" />
      <ListItem icon={School} title="Escola" subtitle={enrolled ? 'Série, nota, clube e ações escolares' : undefined} disabled={!enrolled} reason="Você não está matriculado(a)" onClick={() => nav.push('escola')} testId="occ-school" />
      <ListItem icon={Swords} title="Carreira de luta" subtitle={`${STAGE_LABEL[fighterNextStep(game, C).stage]} · faixa ${BELTS[game.fighter.belt.rank]}`} onClick={() => nav.push('luta')} testId="occ-fight" />
    </>
  );
}

export function MinhaOcupacaoScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const job = game.economy.job;
  const def = jobDef(C, job?.jobId);
  const cur = game.education.current;
  const stage = fighterNextStep(game, C).stage;
  const none = !cur && !def && stage === 'sem_academia';
  return (
    <>
      {cur && <ListItem icon={School} title={cur.school.name} subtitle={`Média ${Math.round(cur.average)} · ${cur.club ? 'clube de ' + cur.club : 'sem clube'}`} onClick={() => nav.push('escola')} />}
      {def && job && <ListItem icon={Briefcase} title={jobTitle(def, job.level)} subtitle={`${money.format(salaryOf(def, job.level, cityMultOf(game, C)))}/ano · ${def.formal === false ? 'sem carteira' : 'carteira assinada'}`} onClick={() => nav.push({ id: 'carreira', params: { job: def.id } })} />}
      {stage !== 'sem_academia' && <ListItem icon={Swords} title={STAGE_LABEL[stage]} subtitle={C.fighting.gyms.find((g) => g.id === game.fighter.gymId)?.name ?? 'Sem academia'} onClick={() => nav.push('luta')} />}
      {none && <p className="rounded-xl bg-[var(--ds-surface)] p-3 text-sm text-[var(--ds-text-muted)]">Você não estuda, não trabalha e não treina. Que tal procurar algo em Carreiras?</p>}
      <DsButton onClick={() => nav.push('carreiras')} full>
        Ver carreiras
      </DsButton>
    </>
  );
}

export function CarreirasScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const age = game.character.age;
  const path = game.flags.caminho_18;
  return (
    <>
      <ListGroup title="Empregos">
        {(Object.keys(CAT_LABEL) as CareerCategory[]).map((cat) => (
          <ListItem key={cat} icon={cat === 'aprendiz' ? GraduationCap : Briefcase} title={CAT_LABEL[cat].title} subtitle={CAT_LABEL[cat].sub} disabled={age < CAT_LABEL[cat].minAge} reason={`Disponível a partir dos ${CAT_LABEL[cat].minAge} anos`} onClick={() => nav.push({ id: 'carreiras-cat', params: { cat } })} testId={`career-cat-${cat}`} />
        ))}
      </ListGroup>
      <ListGroup title="Especiais">
        <ListItem icon={Swords} title="Carreira de lutador" subtitle="Academia, faixas, lutas amadoras e profissionais" onClick={() => nav.push('carreira-luta')} testId="career-fighter" />
        <ListItem icon={GraduationCap} title="Estudos" subtitle={path === 'faculdade' ? 'Você escolheu a faculdade aos 18' : 'Cursinho, curso técnico e faculdade'} disabled reason="Em breve" />
        <ListItem icon={Store} title="Empreender" subtitle="Comprar ou abrir um negócio" disabled={age < 18} reason="Disponível a partir dos 18 anos" onClick={() => nav.push({ id: 'mercado-cat', params: { cat: 'negocios' } })} />
      </ListGroup>
    </>
  );
}

function reqLabel(key: RequirementKey, game: GameState, jobId: string): string {
  const def = jobDef(C, jobId)!;
  switch (key) {
    case 'age':
      return `${def.minAge}+ anos`;
    case 'education':
      return `Escolaridade: ${def.education === 'medio' ? 'ensino médio completo' : def.education === 'superior' ? 'superior' : 'fundamental completo'}`;
    case 'study':
      return def.requires?.schoolStages ? 'Estar no ensino médio (ou formado)' : 'Estar estudando';
    case 'cnh':
      return 'Carteira de motorista (CNH)';
    case 'stats': {
      const m = def.minStats ?? {};
      return [m.intelligence && `Inteligência ${m.intelligence}+`, m.athletic && `Capacidade atlética ${m.athletic}+`, m.looks && `Aparência ${m.looks}+`].filter(Boolean).join(' · ');
    }
    case 'reputation':
      return `Reputação ${def.minReputation}+ (você: ${game.fighter.reputation})`;
    case 'fight':
      return `Faixa ${BELTS[def.fightReq?.minBelt ?? 1]}+ ou Capacidade atlética alta`;
  }
}

export function CarreirasCatScreen({ game, cat }: { game: GameState; cat: CareerCategory }) {
  const nav = useNav();
  const cards = careersIn(game, C, cat);
  return (
    <>
      {cards.map((c) => {
        const miss = c.requirements.filter((r) => !r.ok);
        return (
          <ListItem
            key={c.def.id}
            testId={`career-${c.def.id}`}
            emoji={c.current ? '⭐' : miss.length ? '🔒' : '💼'}
            title={c.def.title}
            subtitle={
              <>
                {money.format(c.salary[0])}–{money.format(c.salary[1])}/ano · ⚡{c.def.energy}/ano{c.def.formal === false ? ' · sem carteira' : ''}
                <span className="block">
                  {c.requirements.map((r) => (
                    <span key={r.key} className={`mr-2 inline-block ${r.ok ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-danger)]'}`}>
                      {r.ok ? '✓' : '✗'} {reqLabel(r.key, game, c.def.id)}
                    </span>
                  ))}
                </span>
              </>
            }
            onClick={() => nav.push({ id: 'carreira', params: { job: c.def.id } })}
          />
        );
      })}
    </>
  );
}

export function CarreiraScreen({ game, jobId }: { game: GameState; jobId: string }) {
  const card = careerCard(game, C, jobId);
  const applyJob = useGameStore((s) => s.applyJob);
  const quitJob = useGameStore((s) => s.quitJob);
  const workHard = useGameStore((s) => s.workHard);
  const askRaise = useGameStore((s) => s.askRaise);
  const talk = useGameStore((s) => s.talkToColleagues);
  const [confirm, setConfirm] = useState<'swap' | 'quit' | null>(null);
  if (!card) return null;
  const { def } = card;
  const currentDef = jobDef(C, game.economy.job?.jobId);
  const blocked = card.blocked;
  const busyFree = !game.pendingEvents.length && !game.activeFight && game.alive;
  return (
    <>
      {def.description && <p className="text-sm text-[var(--ds-text-muted)]">{def.description}</p>}
      <div className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm">
        <p>
          <b>{money.format(card.salary[0])}</b> a <b>{money.format(card.salary[1])}</b> por ano ({def.salaryMW?.[0].toLocaleString('pt-BR')} a {def.salaryMW?.[1].toLocaleString('pt-BR')} salários mínimos) · ⚡{def.energy} de energia por ano
        </p>
        <p className="text-xs text-[var(--ds-text-muted)]">{def.formal === false ? 'Sem carteira: ganha mais na hora, sem INSS nem benefícios.' : 'Carteira assinada: desconta previdência.'}</p>
      </div>
      <ListGroup title="Requisitos">
        {card.requirements.map((r) => (
          <p key={r.key} className={`text-sm ${r.ok ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-danger)]'}`}>
            {r.ok ? '✓' : '✗'} {reqLabel(r.key, game, def.id)}
          </p>
        ))}
      </ListGroup>
      <ListGroup title="Escada de progressão">
        <ol className="flex flex-col gap-1" data-testid="career-ladder">
          {card.ladder.map((l, i) => (
            <li key={l.title} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${l.current ? 'border border-[var(--ds-accent)] bg-[color-mix(in_srgb,var(--ds-accent)_12%,transparent)] font-semibold' : 'bg-[var(--ds-surface)]'}`}>
              <span>
                {i > 0 ? '→ ' : ''}
                {l.title}
                {l.current ? ' (você)' : ''}
              </span>
              <span className="tabular-nums text-xs">{l.salary[0] === l.salary[1] ? money.format(l.salary[0]) : `${money.format(l.salary[0])}–${money.format(l.salary[1])}`}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-[var(--ds-text-muted)]">Para subir: bom desempenho (trabalhar mais, conversar com a equipe) e tempo de casa. Desempenho baixo pode dar demissão.</p>
      </ListGroup>
      {card.current ? (
        <ListGroup title="No emprego">
          <ListItem emoji="💪" title="Trabalhar mais" subtitle="⚡1 · aumenta a chance de promoção" onClick={workHard} disabled={!busyFree || game.energy.current < 1} reason="Energia insuficiente" chevron={false} />
          <ListItem emoji="💰" title="Pedir aumento" subtitle="Uma vez por ano" onClick={askRaise} disabled={!busyFree || game.flags.pediu_aumento === game.year} reason="Você já pediu este ano" chevron={false} />
          <ListItem emoji="☕" title="Conversar com colegas" subtitle="⚡1 · humor e amizades" onClick={talk} disabled={!busyFree || game.energy.current < 1} reason="Energia insuficiente" chevron={false} />
          <ListItem emoji="🚪" title="Pedir demissão" tone="danger" onClick={() => setConfirm('quit')} chevron={false} />
        </ListGroup>
      ) : (
        <>
          {blocked && blocked !== 'employed' && <p className="text-sm text-[var(--ds-danger)]">{jobReasonText(blocked, def)}</p>}
          <DsButton tone="primary" full testId="apply-job" disabled={!!blocked && blocked !== 'employed'} onClick={() => (currentDef ? setConfirm('swap') : applyJob(def.id))}>
            Candidatar-se {currentDef ? `(sai de ${currentDef.title.toLowerCase()})` : ''}
          </DsButton>
        </>
      )}
      {confirm && (
        <BottomSheet title={confirm === 'quit' ? 'Pedir demissão?' : 'Trocar de emprego?'} onClose={() => setConfirm(null)} testId="confirm-job">
          <p className="mb-3 text-sm">{confirm === 'quit' ? `Você deixa de ser ${def.title.toLowerCase()} e libera a energia do emprego.` : `Se for contratado(a), você pede demissão de ${currentDef?.title.toLowerCase()}. Só dá para ter um emprego por vez.`}</p>
          <div className="grid grid-cols-2 gap-2">
            <DsButton onClick={() => setConfirm(null)}>Cancelar</DsButton>
            <DsButton
              tone={confirm === 'quit' ? 'danger' : 'primary'}
              testId="confirm-job-yes"
              onClick={() => {
                if (confirm === 'quit') quitJob();
                else applyJob(def.id, true);
                setConfirm(null);
              }}
            >
              {confirm === 'quit' ? 'Pedir demissão' : 'Candidatar-se'}
            </DsButton>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

const STAGES = ['sem_academia', 'aluno', 'amador', 'pro_regional', 'liga_principal'] as const;

function nextStepText(game: GameState): string {
  const { stage, nextOrg, gap } = fighterNextStep(game, C);
  const f = game.fighter;
  if (stage === 'aposentado') return 'Você está aposentado(a). Dá para voltar pela Carreira de luta.';
  if (stage === 'sem_academia') return 'Matricule-se numa academia para começar a treinar de verdade.';
  if (!nextOrg) return 'Você está no topo. Defenda o que conquistou.';
  const r = nextOrg.requirements;
  switch (gap) {
    case 'age':
      return `Continue treinando: a ${nextOrg.short} só aceita a partir dos ${nextOrg.minAge} anos.`;
    case 'amateur-wins':
      return `Faça ${Math.max(1, (r.minAmateurWins ?? 0) - f.amateur.wins)} vitória(s) amadora(s) a mais para receber convites da ${nextOrg.short}.`;
    case 'pro-wins':
      return `Vença mais ${Math.max(1, (r.minProWins ?? 0) - f.pro.wins)} luta(s) profissional(is) para chamar a atenção da ${nextOrg.short}.`;
    case 'reputation':
      return `Ganhe nome (vitórias, eventos) para a ${nextOrg.short} te notar.`;
    case 'belt':
      return `Chegue à faixa ${BELTS[r.minBelt ?? 0]} no jiu-jitsu.`;
    case 'win-rate':
      return 'Engate uma sequência de vitórias: a liga olha o seu aproveitamento recente.';
    case 'signing-age':
      return `A ${nextOrg.short} não contrata mais na sua idade.`;
    default:
      return `Requisitos da ${nextOrg.short} atendidos: aguarde a proposta.`;
  }
}

export function CarreiraLutaScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const joinGym = useGameStore((s) => s.joinGym);
  const [gyms, setGyms] = useState(false);
  const { stage } = fighterNextStep(game, C);
  const idx = STAGES.indexOf(stage as (typeof STAGES)[number]);
  const gym = C.fighting.gyms.find((g) => g.id === game.fighter.gymId);
  return (
    <>
      <ol className="flex flex-col gap-1" aria-label="Etapas da carreira" data-testid="fighter-stages">
        {STAGES.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${i === idx ? 'border border-[var(--ds-accent)] font-semibold' : i < idx ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-text-muted)]'}`}>
            <span aria-hidden>{i < idx ? '✓' : i === idx ? '●' : '○'}</span>
            {STAGE_LABEL[s]}
          </li>
        ))}
      </ol>
      <p className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm" data-testid="fighter-next">
        🎯 {nextStepText(game)}
      </p>
      {game.character.age >= 6 && <p className="text-sm">Avaliação do treinador: <b>{coachAssessment(game)}</b></p>}
      <ListItem icon={Dumbbell} title={gym ? `Academia: ${gym.name}` : 'Matricular em academia'} subtitle={gym ? `${money.format(gym.fee)}/ano` : 'Escolha entre as academias da sua cidade'} onClick={() => setGyms(true)} testId="fighter-gyms" />
      <ListItem icon={Trophy} title="Procurar lutas" subtitle={`${game.fighter.offers.length} oferta(s) neste ano`} onClick={() => nav.push('luta')} />
      <ListItem icon={Medal} title="Ranking" onClick={() => nav.push('ranking')} />
      <p className="text-xs text-[var(--ds-text-muted)]">Dá para lutar e trabalhar ao mesmo tempo — a energia do ano é que manda.</p>
      {gyms && (
        <BottomSheet title="Academias da cidade" onClose={() => setGyms(false)} testId="gym-sheet">
          <div className="flex flex-col gap-2">
            {gymsInCity(game, C).map((g) => {
              const r = gymBlockReason(game, g.id, C);
              return (
                <ListItem
                  key={g.id}
                  emoji="🥋"
                  title={g.name}
                  subtitle={`${money.format(g.fee)}/ano${game.character.age < 18 ? ' (pais pagam)' : ''} · treinador ${g.coach >= 75 ? 'renomado' : g.coach >= 55 ? 'experiente' : 'de bairro'} · ${g.specialty === 'jiujitsu' ? 'jiu-jitsu' : g.specialty === 'trocacao' ? 'trocação' : 'MMA'}`}
                  disabled={!!r}
                  reason={r === 'current' ? 'Você treina aqui' : r === 'no-money' ? 'Dinheiro insuficiente' : r === 'too-young' ? 'Muito novo(a)' : r === 'no-energy' ? 'Energia insuficiente' : r ? 'Indisponível' : undefined}
                  onClick={() => {
                    joinGym(g.id);
                    setGyms(false);
                  }}
                  chevron={false}
                />
              );
            })}
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export function EscolaScreen({ game }: { game: GameState }) {
  const doAction = useGameStore((s) => s.doAction);
  const school = C.actions.filter((a) => a.category === 'escola');
  return (
    <>
      <SchoolPanel education={game.education} age={game.character.age} />
      <ListGroup title="Ações escolares">
        {school.map((a) => {
          const r = actionBlockReason(game, a);
          return <ListItem key={a.id} emoji={a.emoji} title={a.label} subtitle={`⚡${a.energyCost} · ${a.description}`} disabled={!!r} reason={r ? ACTION_REASON[r] : undefined} onClick={() => doAction(a.id)} chevron={false} />;
        })}
      </ListGroup>
    </>
  );
}

export function LutaScreen({ game }: { game: GameState }) {
  return <CareerPanel game={game} />;
}
