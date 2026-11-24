import { useEffect, useState } from 'react';
import { useGameStore } from './store';
import NewLife from './screens/NewLife';
import Life from './screens/Life';
import Obituary from './screens/Obituary';
import Toasts from './components/Toasts';
import { preloadVisual } from './avatar/preload';

export default function App() {
  const status = useGameStore((s) => s.status);
  const game = useGameStore((s) => s.game);
  const init = useGameStore((s) => s.init);
  const fontScale = useGameStore((s) => s.meta.settings.fontScale);
  const avatarStyle = useGameStore((s) => s.meta.settings.avatarStyle ?? 'cartoon');
  const [visualReady, setVisualReady] = useState(false);
  const [viewLife, setViewLife] = useState(false);
  const lifeKey = game ? `${game.seed}:${game.dynasty.generation}:${game.character.name}` : '';

  useEffect(() => {
    void init();
  }, [init]);
  // pré-carrega o visual ativo antes da primeira tela (sem piscar)
  useEffect(() => {
    if (status !== 'ready') return;
    let alive = true;
    void preloadVisual(avatarStyle).then(() => alive && setVisualReady(true));
    return () => {
      alive = false;
    };
  }, [status, avatarStyle]);
  // acessibilidade: texto maior escala tudo (o layout usa rem)
  useEffect(() => {
    document.documentElement.style.fontSize = fontScale === 'grande' ? '112.5%' : '';
  }, [fontScale]);
  // vida nova/herdeiro: volta para a visão normal (ajuste de estado durante o render, sem efeito)
  const [seenLifeKey, setSeenLifeKey] = useState(lifeKey);
  if (seenLifeKey !== lifeKey) {
    setSeenLifeKey(lifeKey);
    setViewLife(false);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {status === 'loading' || !visualReady ? (
        <p className="m-auto text-slate-400">Carregando…</p>
      ) : !game ? (
        <NewLife />
      ) : !game.alive && game.ending && !viewLife ? (
        <Obituary onViewLife={() => setViewLife(true)} />
      ) : (
        <Life onShowObituary={() => setViewLife(false)} />
      )}
      <Toasts />
    </div>
  );
}
