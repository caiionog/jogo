/**
 * Carreira policial na tela de Carreiras (release 0.0.2, fase 2): concurso por trilha e, para quem já é policial,
 * posto, etapa, avaliação, pista do Tiro e ações do ano. A fase 9 transforma isto na tela central da polícia.
 * Tiro nunca aparece como número (só `shootingHint`).
 */
import { useMemo } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import { UNIFORM_ICONS } from '../../../content/sprites/crimeIcons';
import PixelAvatar from '../../avatar/PixelAvatar';
import PixelCanvas from '../../avatar/pixel/PixelCanvas';
import { renderIcon } from '../../avatar/pixel/icon';
import type { GameState, JobDef, PoliceExamBlockReason, PoliceTrackId } from '../../../engine';
import { EDUCATION_LABEL, deriveAvatar, nextRankGap, policeActionBlock, policeAssessment, policeExamBlockReason, rankTitle, shootingHint, specialBlockReason, specialDef, trackDef } from '../../../engine';
import type { SpecialBlockReason } from '../../../engine';
import { ListGroup, ListItem } from '../../design/components';
import { useGameStore } from '../../store';

const STAGE = { formacao: 'Em formação na academia', probatorio: 'Estágio probatório', efetivo: 'Efetivo(a)' } as const;

function examReason(r: PoliceExamBlockReason, track: PoliceTrackId): string {
  const def = trackDef(C, track)!;
  switch (r) {
    case 'age':
      return `Inscrição de ${def.ageRange[0]} a ${def.ageRange[1]} anos`;
    case 'education':
      return `Exige ${EDUCATION_LABEL[def.education].toLowerCase()}`;
    case 'degree':
      return 'Exige diploma de Direito';
    case 'record':
      return 'Ficha criminal impede a inscrição';
    case 'prison':
      return 'Indisponível enquanto cumpre pena';
    case 'tried':
      return 'Você já prestou concurso este ano';
    case 'already':
      return 'Você já é policial';
    case 'internal':
      return 'Concurso interno: só para praça efetivo da Polícia Militar';
    case 'no-money':
      return `Inscrição: R$ ${def.fee}`;
    case 'busy':
      return 'Resolva o acontecimento pendente';
    default:
      return '—';
  }
}

function specialReason(r: SpecialBlockReason, game: GameState): string {
  const u = game.police.career ? specialDef(C, game.police.career.force) : undefined;
  switch (r) {
    case 'service':
      return `Exige ${u?.minServiceYears ?? 3} anos de serviço`;
    case 'stage':
      return 'Só depois do estágio probatório';
    case 'athletic':
      return 'Exige Capacidade atlética alta';
    case 'shooting':
      return 'Exige mira muito boa (treine no estande)';
    case 'health':
      return 'Exige saúde boa e sem lesões';
    case 'tried':
      return 'Você já tentou este ano';
    case 'already':
      return 'Você já faz parte da unidade';
    case 'busy':
      return 'Resolva o acontecimento pendente';
    default:
      return '—';
  }
}

const ACTION_REASON = { busy: 'Resolva o acontecimento pendente', 'no-career': '—', academy: 'Disponível depois da academia', tried: 'Já feito este ano', 'no-sessions': 'Sem tempo livre para isso neste ano' } as const;

export function PolicePanel({ game, def }: { game: GameState; def: JobDef }) {
  const st = useGameStore();
  const force = def.id === C.police.jobIds.pm ? 'pm' : 'civil';
  const c = game.police.career;
  const mine = c && c.force === force;
  const tracks = C.police.tracks.filter((t) => t.force === force && (t.entry === 'concurso' || (mine && c.track === 'pm_praca')));
  const gap = mine ? nextRankGap(game, C) : null;
  const desc = useMemo(() => deriveAvatar(game, C, 'policia'), [game]);
  const uniform = mine ? UNIFORM_ICONS[c.unit === 'especial' ? 'especial' : c.force] : undefined;
  const nextText = !mine ? null : c.stage === 'formacao' ? `Concluir o ${trackDef(C, c.track)?.course ?? 'curso de formação'}` : c.stage === 'probatorio' ? 'Passar no estágio probatório (cuidado com a corregedoria)' : gap ? `${gap.title}: ${[gap.years > 0 && `mais ${gap.years} ${gap.years === 1 ? 'ano' : 'anos'}`, gap.merit && 'mais mérito'].filter(Boolean).join(' e ') || 'falta pouco'}` : 'Topo da carreira';
  return (
    <>
      {def.description && !mine && <p className="text-sm text-[var(--ds-text-muted)]">{def.description}</p>}
      {mine && (
        <ListGroup title="Sua carreira">
          <div className="flex items-center gap-3 rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm" data-testid="police-status">
            <div className="flex h-28 w-20 shrink-0 items-end justify-center overflow-hidden rounded-2xl bg-[var(--ds-avatar-bg)]">
              <PixelAvatar d={desc} scale={2} label="Você fardado(a)" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-semibold">
                {uniform && <PixelCanvas img={renderIcon(uniform)} scale={2} label="" className="shrink-0" />}
                {def.title} · {c.posting}
              </p>
              <p>
                {rankTitle(game, C)} · {c.serviceYears} {c.serviceYears === 1 ? 'ano' : 'anos'} de serviço
              </p>
              <p className="text-[var(--ds-text-muted)]">{STAGE[c.stage]}{c.unit === 'especial' ? ` · ${specialDef(C, c.force)?.name}` : ''}</p>
              <p>
                Avaliação: <b>{policeAssessment(game)}</b> · Mira: <b>{shootingHint(game.police.shooting)}</b>
              </p>
            </div>
          </div>
          {nextText && (
            <div className="rounded-[var(--ds-radius)] border border-[var(--ds-accent)] p-3 text-sm" data-testid="police-next">
              <p className="text-xs font-semibold uppercase text-[var(--ds-accent)]">Próximo passo</p>
              <p>{nextText}</p>
            </div>
          )}
          {c.notable.length > 0 && (
            <div className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm" data-testid="police-notable">
              <p className="mb-1 text-xs font-semibold uppercase text-[var(--ds-text-muted)]">Ocorrências marcantes</p>
              <ul className="flex flex-col gap-0.5">
                {[...c.notable].reverse().slice(0, 6).map((n, i) => (
                  <li key={i}>• {n.text} ({n.age} anos)</li>
                ))}
              </ul>
            </div>
          )}
          {(
            [
              ['afinco', '💪', 'Trabalhar com afinco', 'Mérito para a promoção (rende menos se repetir)'],
              ['curso', '📚', 'Fazer curso', 'Um por ano · mérito e inteligência'],
              ['estande', '🎯', 'Treinar no estande', 'Melhora a mira'],
              ['transferencia', '🔁', 'Pedir transferência', 'Nova lotação · um pedido por ano'],
              ['exoneracao', '🚪', 'Pedir exoneração', 'Deixar a polícia'],
            ] as const
          ).map(([k, emoji, title, sub]) => {
            const r = policeActionBlock(game, k, C);
            return <ListItem key={k} emoji={emoji} title={title} subtitle={sub} tone={k === 'exoneracao' ? 'danger' : undefined} disabled={!!r} reason={r ? ACTION_REASON[r] : undefined} onClick={() => st.policeAction(k)} chevron={false} testId={`police-${k}`} />;
          })}
        </ListGroup>
      )}
      {mine && specialDef(C, c.force) && (
        <ListGroup title="Força especial">
          {(() => {
            const u = specialDef(C, c.force)!;
            const r = specialBlockReason(game, C);
            return c.unit === 'especial' ? (
              <p className="text-sm" data-testid="special-member">Você faz parte do <b>{u.name}</b>.</p>
            ) : (
              <ListItem emoji="🦅" title={`Tentar o ${u.course}`} subtitle={`${u.name}: seleção muito difícil, poucos terminam`} disabled={!!r} reason={r ? specialReason(r, game) : undefined} onClick={st.trySpecialCourse} chevron={false} testId="special-try" />
            );
          })()}
        </ListGroup>
      )}
      <ListGroup title={mine ? 'Concurso interno' : 'Concurso público'}>
        {tracks
          .filter((t) => !mine || t.entry === 'interno')
          .map((t) => {
            const r = policeExamBlockReason(game, t.id, C);
            return <ListItem key={t.id} emoji="📝" title={t.label} subtitle={`Prova, TAF, saúde, psicológico e investigação social${t.fee ? ` · R$ ${t.fee}` : ''}`} disabled={!!r} reason={r ? examReason(r, t.id) : undefined} onClick={() => st.takePoliceExam(t.id)} chevron={false} testId={`exam-${t.id}`} />;
          })}
      </ListGroup>
    </>
  );
}
