import type { StatKey, Stats } from '../../engine';
import { STAT_KEYS } from '../../engine';

const LABELS: Record<StatKey, { label: string; emoji: string }> = {
  health: { label: 'Saúde', emoji: '❤️' },
  happiness: { label: 'Felicidade', emoji: '😊' },
  intelligence: { label: 'Inteligência', emoji: '🧠' },
  looks: { label: 'Aparência', emoji: '✨' },
  strength: { label: 'Força', emoji: '💪' },
  fitness: { label: 'Condicionamento', emoji: '🏃' },
};

function barColor(v: number): string {
  if (v >= 70) return 'bg-emerald-500';
  if (v >= 40) return 'bg-amber-400';
  return 'bg-rose-500';
}

export default function StatBars({ stats }: { stats: Stats }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
      {STAT_KEYS.map((k) => (
        <li key={k} className="text-xs">
          <div className="mb-1 flex justify-between text-slate-300">
            <span>
              {LABELS[k].emoji} {LABELS[k].label}
            </span>
            <span className="tabular-nums">{stats[k]}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full ${barColor(stats[k])}`} style={{ width: `${stats[k]}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
