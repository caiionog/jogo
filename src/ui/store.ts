import { create } from 'zustand';
import { GAME_CONTENT } from '../content';
import { advanceYear, newGame, performAction, resolveEvent } from '../engine';
import type { GameState, Sex } from '../engine';
import { clearGame, loadGame, saveGame } from '../save';

interface GameStore {
  status: 'loading' | 'ready';
  game: GameState | null;
  init(): Promise<void>;
  startLife(name: string, sex: Sex): void;
  doAction(actionId: string): void;
  advance(): void;
  choose(eventId: string, choiceId: string): void;
  newLife(): Promise<void>;
}

export const useGameStore = create<GameStore>((setState, getState) => {
  const update = (fn: (g: GameState) => GameState) => {
    const g = getState().game;
    if (g) setState({ game: fn(g) });
  };

  return {
    status: 'loading',
    game: null,
    async init() {
      const game = await loadGame();
      setState({ game, status: 'ready' });
    },
    startLife(name, sex) {
      // A seed vem da UI; a engine nunca usa fontes de aleatoriedade não determinísticas.
      const seed = `${Date.now()}-${Math.floor(performance.now() * 1000)}`;
      setState({ game: newGame({ seed, name, sex }, GAME_CONTENT) });
    },
    doAction(actionId) {
      update((g) => performAction(g, actionId, GAME_CONTENT));
    },
    advance() {
      update((g) => advanceYear(g, GAME_CONTENT));
    },
    choose(eventId, choiceId) {
      update((g) => resolveEvent(g, eventId, choiceId, GAME_CONTENT));
    },
    async newLife() {
      await clearGame();
      setState({ game: null });
    },
  };
});

// Autosave: toda mudança no jogo é gravada no IndexedDB.
useGameStore.subscribe((s, prev) => {
  if (s.status === 'ready' && s.game && s.game !== prev.game) {
    void saveGame(s.game);
  }
});
