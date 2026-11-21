import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Sex } from '../../engine';
import { useGameStore } from '../store';

export default function NewLife() {
  const startLife = useGameStore((s) => s.startLife);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex>('M');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) startLife(name.trim(), sex);
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <div className="text-5xl">🥋</div>
        <h1 className="mt-2 text-3xl font-bold">Vida de Lutador</h1>
        <p className="mt-1 text-slate-400">Do primeiro tatame ao cinturão.</p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-300">Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Ex.: João Silva"
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg outline-none focus:border-emerald-500"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-slate-300">Sexo</legend>
        <div className="grid grid-cols-2 gap-3">
          {(['M', 'F'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSex(v)}
              aria-pressed={sex === v}
              className={`rounded-xl border px-4 py-3 text-lg ${
                sex === v ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 bg-slate-900'
              }`}
            >
              {v === 'M' ? '♂ Masculino' : '♀ Feminino'}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="text-center text-sm text-slate-500">País, cidade e atributos serão sorteados.</p>

      <button
        type="submit"
        disabled={!name.trim()}
        className="rounded-xl bg-emerald-500 px-4 py-4 text-lg font-bold text-slate-950 disabled:opacity-40"
      >
        Começar vida
      </button>
    </form>
  );
}
