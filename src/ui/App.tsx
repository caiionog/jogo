import { useEffect } from 'react';
import { useGameStore } from './store';
import NewLife from './screens/NewLife';
import Life from './screens/Life';

export default function App() {
  const status = useGameStore((s) => s.status);
  const hasGame = useGameStore((s) => s.game !== null);
  const init = useGameStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {status === 'loading' ? (
        <p className="m-auto text-slate-400">Carregando…</p>
      ) : hasGame ? (
        <Life />
      ) : (
        <NewLife />
      )}
    </div>
  );
}
