/**
 * Tela central "Carreira de Luta" (release 0.0.1): tudo da luta num lugar só, de cima para baixo — avatar de treino,
 * linha do tempo, próximo passo (com o botão que leva até lá), modalidades e graduações, academia, treinador,
 * treinos, cartel e ranking, ofertas, últimas lutas e aposentadoria. Treinar, procurar luta e ver o ranking ficam a
 * 2 toques da tela principal (atalho "Carreira de Luta" → ação).
 */
import { useMemo, useRef } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import type { GameState, ModalityId } from '../../../engine';
import {
  PLAYER_ID,
  coachAssessment,
  currentRosterKey,
  deriveAvatar,
  fighterNextStepText,
  fighterStage,
  getOrg,
  gradeText,
  injuryVeto,
  monthsText,
  worstInjury,
  playerDivision,
  rankOf,
  sessionsBreakdown,
  sessionsLeft,
  sessionsReserved,
} from '../../../engine';
import PixelAvatar from '../../avatar/PixelAvatar';
import { GymSection, OfferCard, RecordLine, RetireSection, TrainingButtons } from '../../components/CareerPanel';
import FirstTimeTip from '../../components/FirstTimeTip';
import { useNav } from '../../nav';
import { TrainingMeter } from '../Life';
import { modalityLabel } from '../../text/fight';

/** Iniciante → Amador → Profissional regional → Liga principal → Campeão. */
const TIMELINE = ['Iniciante', 'Amador', 'Profissional regional', 'Liga principal', 'Campeão'] as const;

export function timelineIndex(game: GameState): number {
  const stage = fighterStage(game, C);
  const f = game.fighter;
  if (f.titles.length || f.titlesWon > 0) return 4;
  if (stage === 'liga_principal') return 3;
  if (stage === 'pro_regional') return 2;
  if (stage === 'amador') return 1;
  if (stage === 'aposentado') return f.majorDebutAge !== null ? 3 : f.proDebutAge !== null ? 2 : f.amateur.wins + f.amateur.losses > 0 ? 1 : 0;
  return 0;
}

function Section({ title, children, testId }: { title: string; children: React.ReactNode; testId?: string }) {
  return (
    <section className="flex flex-col gap-2" data-testid={testId}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-muted)]">{title}</h2>
      {children}
    </section>
  );
}

/** Modalidades que o personagem pratica (graduação ou treino) e as da academia atual. */
function practicedModalities(game: GameState): ModalityId[] {
  const gym = C.fighting.gyms.find((g) => g.id === game.fighter.gymId);
  const set = new Set<ModalityId>([...(Object.keys(game.fighter.grades) as ModalityId[]), ...game.fighter.trainedThisYear, ...(gym?.modalities ?? [])]);
  return C.fighting.modalities.map((m) => m.id).filter((id) => set.has(id));
}

export function FightCareerScreen({ game }: { game: GameState }) {
  const nav = useNav();
  const f = game.fighter;
  const desc = useMemo(() => deriveAvatar(game, C, 'treino'), [game]);
  const refs = { treino: useRef<HTMLDivElement>(null), ofertas: useRef<HTMLDivElement>(null), academia: useRef<HTMLDivElement>(null) };
  const idx = timelineIndex(game);
  const next = fighterNextStepText(game, C);
  const org = getOrg(C, f.orgId);
  const key = currentRosterKey(game, C);
  const roster = key ? game.world.rosters[key] : undefined;
  const rank = roster ? rankOf(roster, PLAYER_ID) : null;
  const rankText = rank === 0 ? '🏆 Campeã(o) da categoria' : rank !== null ? `#${rank} no ranking` : org?.rankingSize ? 'Fora do ranking' : 'Sem ranking (amador)';
  const mods = practicedModalities(game);
  const worst = worstInjury(game, C);
  const go = () => {
    if (next.target === 'ranking') return nav.push('ranking');
    if (next.target) refs[next.target].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const btn = next.target === 'ofertas' ? 'Ver as ofertas' : next.target === 'academia' ? 'Escolher academia' : next.target === 'treino' ? 'Treinar' : next.target === 'ranking' ? 'Ver o ranking' : null;

  return (
    <div className="flex flex-col gap-5" data-testid="fight-career">
      <div className="flex items-center gap-3">
        <div className="flex h-28 w-20 shrink-0 items-end justify-center overflow-hidden rounded-2xl bg-[var(--ds-avatar-bg)]">
          <PixelAvatar d={desc} scale={2} label="Você com a roupa de treino" />
        </div>
        <div className="min-w-0 text-sm">
          <p className="font-semibold">{org ? org.name : game.character.age >= 15 ? 'Amador (sem contrato)' : 'Base / categorias infantis'}</p>
          <p className="text-[var(--ds-text-muted)]">{playerDivision(game, C).label}</p>
          <p className="text-[var(--ds-text-muted)]">Reputação: {f.reputation >= 60 ? 'famosa(o)' : f.reputation >= 30 ? 'conhecida(o)' : f.reputation >= 10 ? 'começando a ter nome' : 'desconhecida(o)'}</p>
        </div>
      </div>

      {(worst || f.suspendedYears > 0 || f.retired) && (
        <p className="rounded-lg bg-[var(--ds-surface-2)] px-3 py-2 text-sm text-[var(--ds-danger)]" data-testid="career-status">
          {f.retired && `🏁 Aposentado(a) desde os ${f.retired.age} anos. `}
          {worst && `🩹 Lesão: ${worst.def.name} (${monthsText(worst.injury.months)}${injuryVeto(game) ? ', sem condições de lutar' : ', lutar agora é arriscado'}). `}
          {f.suspendedYears > 0 && `⛔ Suspenso(a) por ${f.suspendedYears} ano(s).`}
        </p>
      )}

      <ol className="flex items-center gap-1" aria-label="Linha do tempo da carreira" data-testid="fight-timeline">
        {TIMELINE.map((label, i) => (
          <li key={label} aria-current={i === idx ? 'step' : undefined} className={`flex-1 rounded-md px-1 py-1.5 text-center text-[11px] leading-tight ${i === idx ? 'bg-[var(--ds-accent)] font-semibold text-[var(--ds-on-accent,#fff)]' : i < idx ? 'bg-[var(--ds-surface-2)] text-[var(--ds-accent)]' : 'bg-[var(--ds-surface)] text-[var(--ds-text-muted)]'}`}>
            {label}
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 rounded-[var(--ds-radius)] border border-[var(--ds-accent)] bg-[var(--ds-surface)] p-3" data-testid="fighter-next">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-accent)]">Próximo passo</p>
        <p className="text-sm">{next.text}</p>
        {btn && (
          <button type="button" onClick={go} className="min-h-11 self-start rounded-lg bg-[var(--ds-accent)] px-4 text-sm font-semibold text-[var(--ds-on-accent,#fff)]" data-testid="next-step-go">
            {btn}
          </button>
        )}
      </div>

      <Section title="Modalidades e graduação" testId="fight-modalities">
        <FirstTimeTip id="graduacao" />
        {mods.length === 0 ? (
          <p className="text-sm text-[var(--ds-text-muted)]">Você ainda não pratica nenhuma modalidade. Entre numa academia.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {mods.map((id) => (
              <li key={id} className="flex justify-between gap-2 rounded-lg bg-[var(--ds-surface)] px-3 py-2">
                <span>{modalityLabel(id)}</span>
                <span className="text-[var(--ds-text-muted)]">{gradeText(C, f.grades[id]) ?? (C.fighting.modalities.find((m) => m.id === id)?.graduation ? 'ainda sem graduação' : 'sem graduação')}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div ref={refs.academia}>
        <Section title="Academia">
          <GymSection game={game} />
        </Section>
      </div>

      {game.character.age >= 6 && (
        <Section title="Treinador">
          <FirstTimeTip id="treinador" />
          <p className="text-sm" data-testid="coach-assessment">
            Geral <b>{coachAssessment(game)}</b> · agarre <b>{coachAssessment(game, 'grappling')}</b> · em pé <b>{coachAssessment(game, 'trocacao')}</b>
          </p>
        </Section>
      )}

      <div ref={refs.treino}>
        <Section title="Treinos do ano" testId="fight-training">
          <TrainingMeter left={sessionsLeft(game, C)} reserved={sessionsReserved(game, C)} limit={C.limits.trainingSessions} notes={sessionsBreakdown(game, C).map((p) => p.text)} />
          <TrainingButtons game={game} />
        </Section>
      </div>

      <Section title="Cartel e ranking" testId="fight-record">
        <FirstTimeTip id="cartel" />
        <div className="flex flex-col gap-1 rounded-lg bg-[var(--ds-surface)] p-3">
          <RecordLine label="Profissional" r={f.pro} />
          <RecordLine label="Amador" r={f.amateur} />
          <RecordLine label="Jiu-jitsu (torneios)" r={f.bjj} />
        </div>
        <button type="button" onClick={() => nav.push('ranking')} className="flex min-h-11 items-center justify-between rounded-lg bg-[var(--ds-surface)] px-3 text-sm" data-testid="open-ranking">
          <span>{rankText}</span>
          <span className="text-[var(--ds-accent)]">Ver ranking ›</span>
        </button>
      </Section>

      <div ref={refs.ofertas}>
        <Section title={`Ofertas de luta deste ano (${f.offers.length})`} testId="fight-offers">
          {f.offers.length > 0 && <FirstTimeTip id="bolsa" />}
          {f.offers.length === 0 ? (
            <p className="rounded-lg bg-[var(--ds-surface)] px-3 py-3 text-sm text-[var(--ds-text-muted)]">
              {f.retired ? 'Aposentado(a): sem ofertas de luta.' : f.suspendedYears > 0 ? 'Suspenso(a): sem lutas.' : game.character.age < 6 ? 'Ainda muito novo(a) para competir.' : !f.gymId ? 'Entre numa academia para receber convites.' : 'Nenhuma oferta pendente. Novas ofertas chegam no próximo ano.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {f.offers.map((o) => (
                <OfferCard key={o.id} game={game} offer={o} />
              ))}
            </ul>
          )}
        </Section>
      </div>

      {f.history.length > 0 && (
        <Section title="Últimas lutas">
          <ul className="flex flex-col gap-1 text-xs">
            {f.history
              .slice(-6)
              .reverse()
              .map((h, i) => (
                <li key={i} className="flex justify-between gap-2 rounded-lg bg-[var(--ds-surface)] px-3 py-1.5">
                  <span>
                    {h.result === 'W' ? '✅ V' : h.result === 'L' ? '❌ D' : '➖ E'} {h.title ? '🏆 ' : ''}
                    {h.opponent}
                  </span>
                  <span className="shrink-0 text-[var(--ds-text-muted)]">
                    {getOrg(C, h.orgId)?.short} · {h.method === 'DEC' ? 'Decisão' : h.method === 'SUB' ? 'Finalização' : h.method === 'DOC' ? 'Médico' : h.method} · {h.age} anos
                  </span>
                </li>
              ))}
          </ul>
        </Section>
      )}
      <RetireSection game={game} />
    </div>
  );
}
