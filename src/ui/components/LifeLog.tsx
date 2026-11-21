import { useEffect, useRef } from 'react';
import type { LogYear } from '../../engine';

export default function LifeLog({ log }: { log: LogYear[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const total = log.reduce((n, y) => n + y.entries.length, 0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [total]);

  return (
    <div className="flex flex-col gap-3" data-testid="life-log">
      {log.map((y) => (
        <section key={`${y.year}-${y.age}`}>
          <h3 className="text-sm font-bold text-emerald-400">
            Idade {y.age} <span className="font-normal text-slate-500">· {y.year}</span>
          </h3>
          <ul className="mt-1 space-y-1 text-sm text-slate-300">
            {y.entries.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </section>
      ))}
      <div ref={endRef} />
    </div>
  );
}
