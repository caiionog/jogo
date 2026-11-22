import { create } from 'zustand';
import { GAME_CONTENT } from '../content';
import {
  acceptOffer,
  advanceYear,
  autoFinishFight,
  chooseFightCorner,
  closeFight,
  declineOffer,
  joinClub,
  joinGym,
  leaveClub,
  leaveGym,
  newGame,
  performAction,
  resolveEvent,
  trainFighter,
  interact,
  meetSomeoneAction,
  setRelationshipSettings,
} from '../engine';
import type { GameState, InteractionKind, MeetMode, PartnerPreference, Sex, SkillKey, Strategy, TrainingKind } from '../engine';
import { clearGame, loadGame, saveGame } from '../save';

interface GameStore {
  status: 'loading' | 'ready';
  game: GameState | null;
  init(): Promise<void>;
  startLife(name: string, sex: Sex, opts?: { adultContent?: boolean; preference?: PartnerPreference }): void;
  doAction(actionId: string): void;
  joinClub(clubId: string): void;
  leaveClub(): void;
  joinGym(gymId: string): void;
  leaveGym(): void;
  train(kind: TrainingKind, skill?: SkillKey): void;
  acceptOffer(offerId: string, aggressiveCut: boolean): void;
  declineOffer(offerId: string): void;
  chooseCorner(strategy: Strategy): void;
  skipFight(): void;
  closeFight(): void;
  interact(personId: string, kind: InteractionKind): void;
  meet(mode: MeetMode): void;
  setSettings(patch: { adultContent?: boolean; preference?: PartnerPreference }): void;
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
    startLife(name, sex, opts = {}) {
      // A seed vem da UI; a engine nunca usa fontes de aleatoriedade não determinísticas.
      const seed = `${Date.now()}-${Math.floor(performance.now() * 1000)}`;
      setState({ game: newGame({ seed, name, sex, ...opts }, GAME_CONTENT) });
    },
    interact(personId, kind) {
      update((g) => interact(g, personId, kind, GAME_CONTENT));
    },
    meet(mode) {
      update((g) => meetSomeoneAction(g, mode, GAME_CONTENT));
    },
    setSettings(patch) {
      update((g) => setRelationshipSettings(g, patch));
    },
    doAction(actionId) {
      update((g) => performAction(g, actionId, GAME_CONTENT));
    },
    joinClub(clubId) {
      update((g) => joinClub(g, clubId, GAME_CONTENT));
    },
    leaveClub() {
      update((g) => leaveClub(g, GAME_CONTENT));
    },
    joinGym(gymId) {
      update((g) => joinGym(g, gymId, GAME_CONTENT));
    },
    leaveGym() {
      update((g) => leaveGym(g, GAME_CONTENT));
    },
    train(kind, skill) {
      update((g) => trainFighter(g, kind, skill, GAME_CONTENT));
    },
    acceptOffer(offerId, aggressiveCut) {
      update((g) => acceptOffer(g, offerId, { aggressiveCut }, GAME_CONTENT));
    },
    declineOffer(offerId) {
      update((g) => declineOffer(g, offerId));
    },
    chooseCorner(strategy) {
      update((g) => chooseFightCorner(g, strategy, GAME_CONTENT));
    },
    skipFight() {
      update((g) => autoFinishFight(g, GAME_CONTENT));
    },
    closeFight() {
      update((g) => closeFight(g));
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
