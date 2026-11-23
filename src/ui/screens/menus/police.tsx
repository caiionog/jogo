/**
 * Carreira policial na tela de Carreiras (release 0.0.2, fase 2): concurso por trilha e, para quem já é policial,
 * posto, etapa, avaliação, pista do Tiro e ações do ano. A fase 9 transforma isto na tela central da polícia.
 * Tiro nunca aparece como número (só `shootingHint`).
 */
import { GAME_CONTENT as C } from '../../../content';
import type { GameState, JobDef, PoliceExamBlockReason, PoliceTrackId } from '../../../engine';
import { EDUCATION_LABEL, nextRankGap, policeActionBlock, policeAssessment, policeExamBlockReason, rankTitle, shootingHint, trackDef } from '../../../engine';
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

const ACTION_REASON = { busy: 'Resolva o acontecimento pendente', 'no-career': '—', academy: 'Disponível depois da academia', tried: 'Já feito este ano', 'no-sessions': 'Sem tempo livre para isso neste ano' } as const;

export function PolicePanel({ game, def }: { game: GameState; def: JobDef }) {
  const st = useGameStore();
  const force = def.id === C.police.jobIds.pm ? 'pm' : 'civil';
  const c = game.police.career;
  const mine = c && c.force === force;
  const tracks = C.police.tracks.filter((t) => t.force === force && (t.entry === 'concurso' || (mine && c.track === 'pm_praca')));
  const gap = mine ? nextRankGap(game, C) : null;
  return (
    <>
      {def.description && <p className="text-sm text-[var(--ds-text-muted)]">{def.description}</p>}
      {mine && (
        <ListGroup title="Sua carreira">
          <div className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm" data-testid="police-status">
            <p className="font-semibold">
              {rankTitle(game, C)} · {c.posting}
            </p>
            <p className="text-[var(--ds-text-muted)]">
              {STAGE[c.stage]} · {c.serviceYears} {c.serviceYears === 1 ? 'ano' : 'anos'} de serviço
            </p>
            <p>
              Avaliação: <b>{policeAssessment(game)}</b> · Mira: <b>{shootingHint(game.police.shooting)}</b>
            </p>
            {gap && <p className="text-xs text-[var(--ds-text-muted)]">Próximo posto: {gap.title}{gap.years > 0 ? ` · mais ${gap.years} ${gap.years === 1 ? 'ano' : 'anos'}` : ''}{gap.merit ? ' · mais mérito' : ''}</p>}
          </div>
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
