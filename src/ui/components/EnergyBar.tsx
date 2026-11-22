import type { Energy } from '../../engine';

export default function EnergyBar({ energy }: { energy: Energy }) {
  if (energy.max === 0) {
    return <p className="text-sm text-slate-400">⚡ Ainda muito pequeno para gastar energia. Avance o ano.</p>;
  }
  const reserved = Math.min(energy.reserved ?? 0, energy.max);
  const free = energy.max - reserved;
  return (
    <div aria-label={`Energia ${energy.current} de ${energy.max}${reserved ? `, ${reserved} reservada pelo emprego` : ''}`} data-testid="energy">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">⚡ Energia</span>
        <div className="flex flex-1 gap-1">
          {Array.from({ length: energy.max }, (_, i) => (
            <div
              key={i}
              className={`h-3 flex-1 rounded ${i >= free ? 'bg-sky-700/70 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.15)_3px,rgba(255,255,255,0.15)_6px)]' : i < energy.current ? 'bg-yellow-400' : 'bg-slate-800'}`}
            />
          ))}
        </div>
        <span className="text-sm tabular-nums">
          {energy.current}/{energy.max}
        </span>
      </div>
      {reserved > 0 && <p className="mt-1 text-right text-[11px] text-sky-300">💼 {reserved} reservada(s) pelo emprego</p>}
    </div>
  );
}
