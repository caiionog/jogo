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
  economyAction,
  hireAgentAction,
  deposit,
  withdraw,
  payDebt,
  payOffLoan,
  personalLoan,
  setStandard,
  setHousing,
  applyJob,
  workHard,
  askRaise,
  quitJob,
  fireAgent,
  seekSponsor,
  buyAsset,
  sellAsset,
  setHome,
  setRented,
  setInsured,
  openBusiness,
  dedicate,
  setManager,
  expandBusiness,
  injectCash,
  sellBusiness,
} from '../engine';
import type { GameState, Housing, LivingStandard, InteractionKind, MeetMode, PartnerPreference, Sex, SkillKey, Strategy, TrainingKind } from '../engine';
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
  // economia (Etapa 5)
  deposit(amount: number, where: 'savings' | 'investments'): void;
  withdraw(amount: number, where: 'savings' | 'investments'): void;
  payDebt(amount: number): void;
  payOffLoan(loanId: string): void;
  personalLoan(amount: number, years: number): void;
  setStandard(standard: LivingStandard): void;
  setHousing(housing: Housing): void;
  applyJob(jobId: string): void;
  workHard(): void;
  askRaise(): void;
  quitJob(): void;
  hireAgent(): void;
  fireAgent(): void;
  seekSponsor(): void;
  buyAsset(offerId: string, financed: boolean, years?: number): void;
  sellAsset(assetId: string): void;
  setHome(assetId: string): void;
  setRented(assetId: string, rented: boolean): void;
  setInsured(assetId: string, insured: boolean): void;
  openBusiness(defId: string): void;
  dedicate(businessId: string): void;
  setManager(businessId: string, manager: boolean): void;
  expandBusiness(businessId: string): void;
  injectCash(businessId: string, amount: number): void;
  sellBusiness(businessId: string): void;
  choose(eventId: string, choiceId: string): void;
  newLife(): Promise<void>;
}

export const useGameStore = create<GameStore>((setState, getState) => {
  const update = (fn: (g: GameState) => GameState) => {
    const g = getState().game;
    if (g) setState({ game: fn(g) });
  };
  const eco = (fn: (g: GameState) => GameState) => update((g) => economyAction(g, fn));

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
    // economia: toda ação passa pela guarda `economyAction` da engine
    deposit: (amount, where) => eco((g) => deposit(g, amount, where)),
    withdraw: (amount, where) => eco((g) => withdraw(g, amount, where)),
    payDebt: (amount) => eco((g) => payDebt(g, amount)),
    payOffLoan: (id) => eco((g) => payOffLoan(g, id)),
    personalLoan: (amount, years) => eco((g) => personalLoan(g, amount, years)),
    setStandard: (st) => eco((g) => setStandard(g, st)),
    setHousing: (h) => eco((g) => setHousing(g, h)),
    applyJob: (id) => eco((g) => applyJob(g, id, GAME_CONTENT)),
    workHard: () => eco((g) => workHard(g)),
    askRaise: () => eco((g) => askRaise(g, GAME_CONTENT)),
    quitJob: () => eco((g) => quitJob(g, GAME_CONTENT)),
    hireAgent: () => update((g) => hireAgentAction(g, GAME_CONTENT)),
    fireAgent: () => eco((g) => fireAgent(g)),
    seekSponsor: () => eco((g) => seekSponsor(g, GAME_CONTENT)),
    buyAsset: (offerId, financed, years) => eco((g) => buyAsset(g, offerId, GAME_CONTENT, { financed, years })),
    sellAsset: (id) => eco((g) => sellAsset(g, id)),
    setHome: (id) => eco((g) => setHome(g, id)),
    setRented: (id, rented) => eco((g) => setRented(g, id, rented)),
    setInsured: (id, insured) => eco((g) => setInsured(g, id, insured)),
    openBusiness: (defId) => eco((g) => openBusiness(g, defId, GAME_CONTENT)),
    dedicate: (id) => eco((g) => dedicate(g, id)),
    setManager: (id, manager) => eco((g) => setManager(g, id, manager)),
    expandBusiness: (id) => eco((g) => expandBusiness(g, id, GAME_CONTENT)),
    injectCash: (id, amount) => eco((g) => injectCash(g, id, amount)),
    sellBusiness: (id) => eco((g) => sellBusiness(g, id)),
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
