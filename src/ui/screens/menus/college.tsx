/**
 * Estudos / Faculdade (release 0.0.1): exame nacional (ENU), cursos com nota de corte da pública e da particular,
 * matrícula (bolsa, mensalidade ou financiamento), curso atual com ações, trancar/destrancar/largar e diplomas.
 */
import { useState } from 'react';
import { GAME_CONTENT as C } from '../../../content';
import type { CollegeType, GameState } from '../../../engine';
import { actionBlockReason, courseDef, earnsScholarship, enrollBlockReason, examBlockReason, tuitionOf, usesThisYear } from '../../../engine';
import { BottomSheet, ListGroup, ListItem } from '../../design/components';
import { money } from '../../components/ecoUi';
import { useGameStore } from '../../store';

const EXAM_REASON: Record<string, string> = {
  busy: 'Resolva o acontecimento pendente',
  'too-young': 'A partir dos 16 anos',
  'no-highschool': 'No 3º ano do ensino médio ou depois de terminar a escola',
  done: 'Você já fez a prova este ano',
};
const ENROLL_REASON: Record<string, string> = {
  busy: 'Resolva o acontecimento pendente',
  'too-young': 'A partir dos 17 anos',
  'no-highschool': 'Termine o ensino médio primeiro',
  'no-exam': 'Faça o ENU primeiro',
  cutoff: 'Sua nota não alcança o corte',
  enrolled: 'Você já está numa faculdade',
  'has-diploma': 'Você já é formado(a) neste curso',
};

export function FaculdadeScreen({ game }: { game: GameState }) {
  const st = useGameStore();
  const [pick, setPick] = useState<string | null>(null);
  const col = game.college;
  const cur = col.current;
  const curDef = courseDef(C, cur?.courseId);
  const exam = examBlockReason(game);
  return (
    <>
      {cur && curDef ? (
        <ListGroup title="Curso atual">
          <div className="rounded-[var(--ds-radius)] bg-[var(--ds-surface)] p-3 text-sm" data-testid="college-current">
            <p className="font-semibold">{curDef.label}</p>
            <p className="text-[var(--ds-text-muted)]">
              {cur.institution} · {cur.type === 'publica' ? 'pública' : 'particular'} · {cur.year}º de {curDef.years} anos
              {cur.status === 'trancado' ? ' · matrícula trancada' : ''}
            </p>
            <p className="text-[var(--ds-text-muted)]">
              {cur.funding === 'gratis' ? 'Sem mensalidade' : cur.funding === 'bolsa' ? 'Bolsa integral' : cur.funding === 'financiamento' ? `${C.college.loanName}: paga depois de formado(a)` : `Mensalidade: ${money.format(tuitionOf(game, curDef, C))}/ano`}
              {cur.grade !== null ? ` · nota do último ano: ${cur.grade}` : ''}
              {cur.failures > 0 ? ` · ${cur.failures} reprovação (mais uma e você é jubilado)` : ''}
            </p>
            <p className="mt-1 text-xs text-[var(--ds-text-muted)]">A faculdade toma parte do seu tempo de treino enquanto você estiver cursando.</p>
          </div>
          {(['college_study', 'college_skip', 'college_party'] as const).map((id) => {
            const a = C.actions.find((x) => x.id === id)!;
            const r = actionBlockReason(game, a);
            const n = usesThisYear(game, `acao:${id}`);
            return <ListItem key={id} emoji={a.emoji} title={a.label} subtitle={n ? `Feito ${n}× este ano · ${a.description}` : a.description} disabled={!!r} reason={r === 'not-enrolled' ? 'Matrícula trancada' : 'Indisponível agora'} onClick={() => st.doAction(id)} chevron={false} testId={`act-${id}`} />;
          })}
          {cur.status === 'cursando' ? <ListItem emoji="⏸️" title="Trancar a matrícula" subtitle="Pausa o curso (sem mensalidade e sem ocupar treinos)" onClick={st.lockCollege} chevron={false} testId="college-lock" /> : <ListItem emoji="▶️" title="Destrancar a matrícula" onClick={st.unlockCollege} chevron={false} testId="college-unlock" />}
          <ListItem emoji="🚪" title="Largar o curso" tone="danger" subtitle={cur.financed > 0 ? 'O financiamento vira dívida' : undefined} onClick={st.dropCollege} chevron={false} />
        </ListGroup>
      ) : null}

      <ListGroup title={C.college.examName}>
        <p className="text-sm" data-testid="exam-score">{col.examScore === null ? 'Você ainda não fez a prova.' : `Sua melhor nota: ${col.examScore} de 1000.`}</p>
        <ListItem emoji="📝" title="Fazer a prova" subtitle="Uma vez por ano. Estudar no ano ajuda." disabled={!!exam} reason={exam ? EXAM_REASON[exam] : undefined} onClick={st.takeExam} chevron={false} testId="take-exam" />
      </ListGroup>

      {!cur && (
        <ListGroup title="Cursos">
          {C.college.courses.map((c) => {
            const pub = enrollBlockReason(game, c.id, 'publica', C);
            const pri = enrollBlockReason(game, c.id, 'particular', C);
            return (
              <ListItem
                key={c.id}
                emoji="🎓"
                title={c.label}
                subtitle={`${c.years} anos · corte: pública ${c.cutoffPublic}, particular ${c.cutoffPrivate} · ${money.format(tuitionOf(game, c, C))}/ano na particular`}
                disabled={!!pub && !!pri}
                reason={pri ? ENROLL_REASON[pri] : undefined}
                onClick={() => setPick(c.id)}
                testId={`course-${c.id}`}
              />
            );
          })}
        </ListGroup>
      )}

      {col.diplomas.length > 0 && (
        <ListGroup title="Diplomas">
          <ul className="text-sm" data-testid="diplomas">
            {col.diplomas.map((d) => (
              <li key={d}>🎓 {courseDef(C, d)?.label ?? d}</li>
            ))}
          </ul>
        </ListGroup>
      )}

      {pick && (
        <EnrollSheet game={game} courseId={pick} onClose={() => setPick(null)} onEnroll={(type, fin) => { st.enrollCollege(pick, type, fin); setPick(null); }} />
      )}
    </>
  );
}

function EnrollSheet({ game, courseId, onClose, onEnroll }: { game: GameState; courseId: string; onClose: () => void; onEnroll: (t: CollegeType, financing: boolean) => void }) {
  const c = courseDef(C, courseId)!;
  const pub = enrollBlockReason(game, courseId, 'publica', C);
  const pri = enrollBlockReason(game, courseId, 'particular', C);
  const bolsa = earnsScholarship(game, c, C);
  return (
    <BottomSheet title={c.label} onClose={onClose} testId="enroll-sheet">
      <div className="flex flex-col gap-2">
        <ListItem emoji="🏛️" title="Pública" subtitle={`Sem mensalidade · corte ${c.cutoffPublic}`} disabled={!!pub} reason={pub ? ENROLL_REASON[pub] : undefined} onClick={() => onEnroll('publica', false)} chevron={false} testId="enroll-publica" />
        <ListItem emoji="🏫" title={bolsa ? 'Particular com bolsa integral' : 'Particular pagando a mensalidade'} subtitle={bolsa ? 'Sua nota garante a bolsa' : `${money.format(tuitionOf(game, c, C))}/ano`} disabled={!!pri} reason={pri ? ENROLL_REASON[pri] : undefined} onClick={() => onEnroll('particular', false)} chevron={false} testId="enroll-particular" />
        {!bolsa && <ListItem emoji="🏦" title={`Particular pelo ${C.college.loanName}`} subtitle="Não paga durante o curso; vira um empréstimo depois" disabled={!!pri} reason={pri ? ENROLL_REASON[pri] : undefined} onClick={() => onEnroll('particular', true)} chevron={false} testId="enroll-financiamento" />}
      </div>
    </BottomSheet>
  );
}
