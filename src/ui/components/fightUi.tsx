/** Pequenos componentes visuais compartilhados pelas telas de luta. */
import type { FightStyle, Skills } from '../../engine';
import { SKILL_KEYS, SKILL_LABEL } from '../../engine';

export const STYLE_LABEL: Record<FightStyle, string> = {
  striker: 'Trocador',
  wrestler: 'Wrestler',
  grappler: 'Especialista em chão',
  allround: 'Completo',
};

export function Bar({ value, color = 'bg-emerald-500', className = 'h-1.5' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-slate-800 ${className}`}>
      <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function SkillBars({ skills, keys = SKILL_KEYS, compact = false }: { skills: Skills; keys?: readonly (keyof Skills)[]; compact?: boolean }) {
  return (
    <ul className={`grid ${compact ? 'grid-cols-3 gap-x-3 gap-y-1' : 'grid-cols-2 gap-x-4 gap-y-2'}`}>
      {keys.map((k) => (
        <li key={k} className="text-[11px]">
          <div className="mb-0.5 flex justify-between text-slate-300">
            <span>{SKILL_LABEL[k]}</span>
            <span className="tabular-nums">{Math.round(skills[k])}</span>
          </div>
          <Bar value={skills[k]} color={skills[k] >= 70 ? 'bg-emerald-500' : skills[k] >= 40 ? 'bg-amber-400' : 'bg-rose-500'} />
        </li>
      ))}
    </ul>
  );
}

export const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
