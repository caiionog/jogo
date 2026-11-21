import { useEffect, useRef } from 'react';
import type { LogYear } from '../../engine';

/** Histórico ano a ano. Rola dentro da própria caixa (não a página) para manter os painéis visíveis. */
export default function LifeLog({ log }: { log: LogYear[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const total = log.reduce((n, y) => n + y.entries.length, 0);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [total]);

  return (
    <div
      ref={boxRef}
      className="flex max-h-[45vh] flex-col gap-3 overflow-y-auto overscroll-contain rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
      data-testid="life-log"
    >
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
    </div>
  );
}
