import { GAME_CONTENT } from '../../content';
import type { Education } from '../../engine';
import { SCHOOL_STAGE_LABEL, gradeLabel, stageOfGrade } from '../../engine';

function Meter({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="text-xs">
      <div className="mb-1 flex justify-between text-[var(--ds-text)]">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ds-surface-2)]">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function SchoolPanel({ education, age }: { education: Education; age: number }) {
  const cur = education.current;
  if (!cur) {
    if (age < 3) return null;
    return (
      <section className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] px-4 py-3 text-sm text-[var(--ds-text)]" data-testid="school-panel">
        🏫 {education.graduated ? '🎓 Ensino Médio concluído' : 'Fora da escola'}
        {education.history.length > 0 && (
          <span className="text-[var(--ds-text-muted)]"> · {education.history.filter((h) => !h.gradeLabel.startsWith('Pré')).length} anos letivos cursados</span>
        )}
      </section>
    );
  }
  const club = cur.club ? GAME_CONTENT.clubs.find((c) => c.id === cur.club) : undefined;
  return (
    <section className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-4" data-testid="school-panel">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold">🏫 {cur.school.name}</h2>
          <p className="text-xs text-[var(--ds-text-muted)]" data-testid="school-grade">
            {gradeLabel(cur.grade)} · {SCHOOL_STAGE_LABEL[stageOfGrade(cur.grade)]} · {cur.school.type === 'publica' ? 'Pública' : 'Particular'}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-[var(--ds-text-muted)]">
          <div>Faltas: <span className="tabular-nums text-[var(--ds-text)]">{cur.absences}</span></div>
          {club && <div className="text-emerald-300">{club.emoji} {club.label}</div>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Meter label="Nota" value={cur.average} />
        <Meter label="Disciplina" value={cur.discipline} />
        <Meter label="Popular." value={cur.popularity} />
      </div>
    </section>
  );
}
