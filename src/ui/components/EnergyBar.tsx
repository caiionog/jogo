import type { Energy } from '../../engine';

export default function EnergyBar({ energy }: { energy: Energy }) {
  if (energy.max === 0) {
    return <p className="text-sm text-slate-400">⚡ Ainda muito pequeno para gastar energia. Avance o ano.</p>;
  }
  return (
    <div className="flex items-center gap-3" aria-label={`Energia ${energy.current} de ${energy.max}`}>
      <span className="text-sm font-medium">⚡ Energia</span>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: energy.max }, (_, i) => (
          <div key={i} className={`h-3 flex-1 rounded ${i < energy.current ? 'bg-yellow-400' : 'bg-slate-800'}`} />
        ))}
      </div>
      <span className="text-sm tabular-nums">
        {energy.current}/{energy.max}
      </span>
    </div>
  );
}
