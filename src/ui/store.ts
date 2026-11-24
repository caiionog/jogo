import { create } from 'zustand';
import { GAME_CONTENT } from '../content';
import {
  removeOutfit,
  setHairStyle,
  STAT_KEYS,
  buyBusiness,
  getDriversLicense,
  renameBusiness,
  renovateAsset,
  talkToColleagues,
  buyOutfit,
  moveTo,
  selectOutfit,
  setFacialHair,
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
  overtrainExtras,
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
  takePoliceExam,
  policeWorkHard,
  policeCourse,
  shootingRange,
  requestTransfer,
  resignPolice,
  trySpecialCourse,
  commitCrime,
  startPlan,
  launderMoney,
  tryLeaveFaction,
  prisonAction,
  startTrafficking,
  stopTrafficking,
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
  retire,
  treatInjury,
  healthAction,
  makeWill,
  revokeWill,
  continueAsChild,
  emptyMeta,
  evaluateAchievements,
  recordLifeEnd,
  recordLifeStart,
  takeExam,
  takeBarExam,
  meetResident,
  appLike,
  appSkip,
  reconnectExFriend,
  takeCivilExam,
  postOnSocial,
  setEating,
  startPostgrad,
  tryout,
  trainFootball,
  acceptFootballOffer,
  retireFootball,
  finishMinigame,
  startPenaltyPractice,
  doCommercial,
  enrollCollege,
  lockCollege,
  unlockCollege,
  dropCollege,
  joinSportsClub,
  leaveSportsClub,
  trainAtClub,
  askParentsForExchange,
  askJobLeave,
  startExchange,
  goOut,
  hangOutAll,
} from '../engine';
import type { Eating, FootballPosition, PenaltyInput, PostgradKind, PostKind } from '../engine';
import type { CollegeType, PoliceTrackId, PrisonAction, SportId, TraffickingLevel } from '../engine';
import type {
  AchievementDef,
  StatKey,
  Appearance,
  FacialHair,
  HairStyle,
  GameState,
  HealthActionId,
  Housing,
  LivingStandard,
  InteractionKind,
  IntimacyVariant,
  MeetMode,
  MetaSettings,
  MetaState,
  PartnerPreference,
  Sex,
  Strategy,
  TrainingKind,
  Treatment,
} from '../engine';
import {
  SLOT_COUNT,
  clearGame,
  clearSlot,
  exportFileName,
  exportSave,
  getActiveSlot,
  importSave,
  listSlots,
  loadGame,
  loadMeta,
  loadSlot,
  saveGame,
  saveMeta,
  saveSlot,
  setActiveSlot,
} from '../save';
import type { SlotInfo } from '../save';

/** Rótulos curtos dos atributos visíveis (toasts). */
export const STAT_SHORT: Record<StatKey, string> = { happiness: 'Felicidade', health: 'Saúde', intelligence: 'Inteligência', looks: 'Aparência', athletic: 'Capacidade atlética' };

export interface Toast {
  id: number;
  icon: string;
  title: string;
  text: string;
}

/** Mudança de um atributo visível (para o pop-up de resultado e os toasts). */
export interface StatDelta {
  key: StatKey;
  delta: number;
}

/** Resultado de uma escolha de evento (pop-up curto). */
export interface Outcome {
  lines: string[];
  deltas: StatDelta[];
  money: number;
}

/** Compara o antes e o depois de uma ação do jogador: atributos visíveis, dinheiro e linhas novas do log. */
export function diffOf(before: GameState, after: GameState): Outcome {
  const deltas: StatDelta[] = [];
  for (const key of STAT_KEYS) {
    const d = Math.round(after.character.stats[key] - before.character.stats[key]);
    if (d) deltas.push({ key, delta: d });
  }
  const lastBefore = before.log.at(-1);
  const lastAfter = after.log.at(-1);
  const lines = lastAfter ? (lastBefore && lastBefore.age === lastAfter.age ? lastAfter.entries.slice(lastBefore.entries.length) : lastAfter.entries) : [];
  return { lines, deltas, money: after.money - before.money };
}

interface GameStore {
  status: 'loading' | 'ready';
  game: GameState | null;
  /** Conquistas, Hall da Fama, estatísticas e preferências (chave própria no IndexedDB). */
  meta: MetaState;
  slot: number;
  slots: SlotInfo[];
  toasts: Toast[];
  /** Pop-up de resultado depois de uma escolha de evento. */
  outcome: Outcome | null;
  dismissOutcome(): void;
  /**
   * Transição de cena íntima (release 0.0.3): a engine grava `game.scene = { kind: 'intimo', seq }` só depois das
   * guardas (18+ dos dois e "Conteúdo adulto"); a UI apenas toca a animação quando chega um `seq` novo.
   */
  intimacy: { variant: IntimacyVariant } | null;
  /** Último `seq` de cena íntima já visto (o do save carregado não toca). */
  intimacySeen: number;
  endIntimacy(): void;
  /** Passar tempo com todos os amigos (release 0.0.3). */
  hangOutAll(activityId: string): void;
  // Etapa 8: trabalho, CNH, mercado e negócios
  talkToColleagues(): void;
  getDriversLicense(): void;
  renovate(assetId: string): void;
  buyBusiness(offerId: string, place?: { uf: string; city: string }): void;
  renameBusiness(id: string, name: string): void;
  init(): Promise<void>;
  // Etapa 6
  retire(): void;
  treatInjury(injuryId: string, treatment: Treatment): void;
  healthAction(id: HealthActionId): void;
  makeWill(shares: Record<string, number>): void;
  revokeWill(): void;
  continueAsChild(personId: string): void;
  refreshSlots(): Promise<void>;
  switchSlot(slot: number): Promise<void>;
  deleteSlot(slot: number): Promise<void>;
  exportCurrent(): { name: string; text: string } | null;
  importFile(text: string): Promise<{ ok: boolean; error?: string }>;
  setMetaSettings(patch: Partial<MetaSettings>): void;
  /** "Entendi" numa explicação de primeira vez: não aparece de novo (meta). */
  dismissTip(id: string): void;
  eraseAll(): Promise<void>;
  dismissToast(id: number): void;
  startLife(name: string, sex: Sex, opts?: { adultContent?: boolean; preference?: PartnerPreference; surnames?: string[]; uf?: string; city?: string; appearance?: Appearance }): void;
  // Etapa 7: guarda-roupa e mudança de cidade
  selectOutfit(id: string, color: number): void;
  buyOutfit(id: string): void;
  setFacialHair(f: FacialHair): void;
  removeOutfit(layer: 'agasalho' | 'acessorio'): void;
  setHairStyle(style: HairStyle): void;
  moveCity(uf: string, city: string): void;
  doAction(actionId: string): void;
  joinClub(clubId: string): void;
  leaveClub(): void;
  joinGym(gymId: string): void;
  leaveGym(): void;
  train(kind: TrainingKind): void;
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
  applyJob(jobId: string, replace?: boolean): void;
  workHard(): void;
  /** Carreira policial (release 0.0.2). */
  takePoliceExam(track: PoliceTrackId): void;
  policeAction(kind: 'afinco' | 'curso' | 'estande' | 'transferencia' | 'exoneracao'): void;
  trySpecialCourse(): void;
  /** Crime (release 0.0.2). */
  commitCrime(id: string): void;
  startPlan(id: string): void;
  launderMoney(): void;
  tryLeaveFaction(): void;
  prisonAction(a: PrisonAction): void;
  setTrafficking(level: TraffickingLevel | null): void;
  askRaise(): void;
  quitJob(): void;
  /** Faculdade (release 0.0.1). */
  takeExam(): void;
  takeBarExam(): void;
  meetResident(residentId: string): void;
  appLike(cardId: string): void;
  appSkip(cardId: string): void;
  reconnectExFriend(personId: string): void;
  takeCivilExam(jobId: string): void;
  postOnSocial(kind: PostKind): void;
  setEating(eating: Eating): void;
  startPostgrad(kind: PostgradKind, field: string): void;
  footballTryout(position: FootballPosition): void;
  trainFootball(): void;
  acceptFootballOffer(clubId: string): void;
  retireFootball(): void;
  finishMinigame(input: PenaltyInput | null): void;
  practicePenalty(): void;
  doCommercial(): void;
  /** Vida noturna (release 0.0.1): sai e o evento do local abre como pop-up. */
  goOut(venueId: string): void;
  /** Clube esportivo e intercâmbio (release 0.0.1). */
  joinSportsClub(clubId: string, sport: SportId): void;
  leaveSportsClub(): void;
  trainAtClub(): void;
  askParentsForExchange(): void;
  askJobLeave(): void;
  startExchange(programId: string): void;
  enrollCollege(courseId: string, type: CollegeType, financing: boolean): void;
  lockCollege(): void;
  unlockCollege(): void;
  dropCollege(): void;
  hireAgent(): void;
  fireAgent(): void;
  seekSponsor(): void;
  buyAsset(offerId: string, financed: boolean, years?: number, place?: { uf: string; city: string }): void;
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

/** `seq` da cena íntima do estado (0 se a cena atual é outra ou não há cena). */
export function intimacySeqOf(game: GameState | null | undefined): number {
  return game?.scene?.kind === 'intimo' ? game.scene.seq : 0;
}

export const useGameStore = create<GameStore>((setState, getState) => {
  let toastId = 1;
  /** Depois de cada mudança: avalia conquistas (toast) e registra a vida no Hall da Fama ao morrer. */
  const afterChange = (game: GameState) => {
    const now = new Date().toISOString();
    let { meta } = getState();
    const r = evaluateAchievements(game, meta, GAME_CONTENT, now);
    meta = r.meta;
    if (!game.alive) meta = recordLifeEnd(meta, game);
    if (meta !== getState().meta) {
      const toasts = [...getState().toasts, ...r.unlocked.map((a: AchievementDef) => ({ id: toastId++, icon: a.icon, title: 'Conquista desbloqueada!', text: a.name }))].slice(-4);
      setState({ meta, toasts });
      void saveMeta(meta);
    }
  };
  const update = (fn: (g: GameState) => GameState) => {
    const g = getState().game;
    if (!g) return;
    const next = fn(g);
    if (next === g) return;
    setState({ game: next });
    afterChange(next);
  };
  const eco = (fn: (g: GameState) => GameState) => update((g) => economyAction(g, fn));
  /** Ação do jogador com toast do resultado (texto do log + mudanças de atributos). */
  const act = (fn: (g: GameState) => GameState) => {
    const before = getState().game;
    update(fn);
    const after = getState().game;
    if (!before || !after || after === before || after.pendingEvents.length > before.pendingEvents.length) return;
    const d = diffOf(before, after);
    const line = d.lines.at(-1);
    if (!line) return;
    const text = d.deltas.map((x) => `${STAT_SHORT[x.key]} ${x.delta > 0 ? '+' : '−'}${Math.abs(x.delta)}`).join(' · ');
    // treino além do limite do ano: o aviso aparece como alerta (treino invisível, release 0.0.2)
    const over = after.fighter.sessionsThisYear > before.fighter.sessionsThisYear && overtrainExtras(after, GAME_CONTENT) > 0;
    setState({ toasts: [...getState().toasts, { id: toastId++, icon: over ? '⚠' : '✔', title: line, text }].slice(-3) });
  };

  return {
    status: 'loading',
    game: null,
    meta: emptyMeta(),
    slot: 1,
    slots: [],
    toasts: [],
    outcome: null,
    dismissOutcome: () => setState({ outcome: null }),
    intimacy: null,
    intimacySeen: 0,
    endIntimacy: () => setState({ intimacy: null }),
    hangOutAll: (activityId) => act((g) => hangOutAll(g, activityId, GAME_CONTENT)),
    talkToColleagues: () => act((g) => talkToColleagues(g, GAME_CONTENT)),
    getDriversLicense: () => act((g) => economyAction(g, (x) => getDriversLicense(x))),
    renovate: (id) => eco((g) => renovateAsset(g, id)),
    buyBusiness: (id, place) => eco((g) => buyBusiness(g, id, GAME_CONTENT, place)),
    renameBusiness: (id, name) => update((g) => renameBusiness(g, id, name)),
    async init() {
      const [slot, meta] = await Promise.all([getActiveSlot(), loadMeta()]);
      const game = await loadGame();
      setState({ game, meta, slot, status: 'ready', intimacySeen: intimacySeqOf(game), intimacy: null });
      void getState().refreshSlots();
    },
    startLife(name, sex, opts = {}) {
      // A seed vem da UI; a engine nunca usa fontes de aleatoriedade não determinísticas.
      const seed = `${Date.now()}-${Math.floor(performance.now() * 1000)}`;
      const meta = recordLifeStart(getState().meta);
      setState({ game: newGame({ seed, name, sex, ...opts }, GAME_CONTENT), meta, intimacySeen: 0, intimacy: null });
      void saveMeta(meta);
    },
    selectOutfit: (id, color) => update((g) => selectOutfit(g, GAME_CONTENT, id, color)),
    buyOutfit: (id) => update((g) => buyOutfit(g, GAME_CONTENT, id)),
    setFacialHair: (f) => update((g) => setFacialHair(g, f)),
    removeOutfit: (layer) => update((g) => removeOutfit(g, layer)),
    setHairStyle: (style) => update((g) => setHairStyle(g, style)),
    moveCity: (uf, city) => update((g) => moveTo(g, GAME_CONTENT, uf, city)),
    retire: () => update((g) => retire(g, GAME_CONTENT)),
    treatInjury: (id, t) => update((g) => treatInjury(g, id, t, GAME_CONTENT)),
    healthAction: (id) => act((g) => healthAction(g, GAME_CONTENT, id)),
    makeWill: (shares) => update((g) => makeWill(g, shares)),
    revokeWill: () => update((g) => revokeWill(g)),
    continueAsChild(personId) {
      const g = getState().game;
      if (!g) return;
      const next = continueAsChild(g, personId, GAME_CONTENT);
      if (next === g) return;
      const meta = recordLifeStart(getState().meta);
      setState({ game: next, meta, intimacySeen: intimacySeqOf(next), intimacy: null });
      void saveMeta(meta);
      afterChange(next);
    },
    async refreshSlots() {
      setState({ slots: await listSlots() });
    },
    async switchSlot(slot) {
      if (slot < 1 || slot > SLOT_COUNT) return;
      const g = getState().game;
      if (g) await saveSlot(getState().slot, g);
      await setActiveSlot(slot);
      const game = await loadSlot(slot);
      setState({ slot, game, intimacySeen: intimacySeqOf(game), intimacy: null });
      await getState().refreshSlots();
    },
    async deleteSlot(slot) {
      await clearSlot(slot);
      if (slot === getState().slot) setState({ game: null });
      await getState().refreshSlots();
    },
    exportCurrent() {
      const g = getState().game;
      if (!g) return null;
      const now = new Date().toISOString();
      return { name: exportFileName(g, now), text: exportSave(g, now) };
    },
    async importFile(text) {
      const r = importSave(text);
      if (!r.ok) return { ok: false, error: r.error };
      setState({ game: r.state, intimacySeen: intimacySeqOf(r.state), intimacy: null });
      await saveGame(r.state);
      await getState().refreshSlots();
      return { ok: true };
    },
    dismissTip(id) {
      const cur = getState().meta;
      if (cur.seenTips.includes(id)) return;
      const meta = { ...cur, seenTips: [...cur.seenTips, id] };
      setState({ meta });
      void saveMeta(meta);
    },
    setMetaSettings(patch) {
      const meta = { ...getState().meta, settings: { ...getState().meta.settings, ...patch } };
      setState({ meta });
      void saveMeta(meta);
    },
    async eraseAll() {
      for (let s = 1; s <= SLOT_COUNT; s++) await clearSlot(s);
      const meta = emptyMeta();
      await saveMeta(meta);
      setState({ game: null, meta, toasts: [] });
      await getState().refreshSlots();
    },
    dismissToast(id) {
      setState({ toasts: getState().toasts.filter((t) => t.id !== id) });
    },
    interact(personId, kind) {
      act((g) => interact(g, personId, kind, GAME_CONTENT));
    },
    meet(mode) {
      update((g) => meetSomeoneAction(g, mode, GAME_CONTENT));
    },
    setSettings(patch) {
      update((g) => setRelationshipSettings(g, patch));
    },
    doAction(actionId) {
      act((g) => performAction(g, actionId, GAME_CONTENT));
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
    train(kind) {
      act((g) => trainFighter(g, kind, GAME_CONTENT));
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
      const before = getState().game;
      update((g) => resolveEvent(g, eventId, choiceId, GAME_CONTENT));
      const after = getState().game;
      if (before && after && after !== before) setState({ outcome: diffOf(before, after) });
    },
    // economia: toda ação passa pela guarda `economyAction` da engine
    deposit: (amount, where) => eco((g) => deposit(g, amount, where)),
    withdraw: (amount, where) => eco((g) => withdraw(g, amount, where)),
    payDebt: (amount) => eco((g) => payDebt(g, amount)),
    payOffLoan: (id) => eco((g) => payOffLoan(g, id)),
    personalLoan: (amount, years) => eco((g) => personalLoan(g, amount, years)),
    setStandard: (st) => eco((g) => setStandard(g, st)),
    setHousing: (h) => eco((g) => setHousing(g, h)),
    applyJob: (id, replace) => {
      const before = getState().game;
      eco((g) => applyJob(g, id, GAME_CONTENT, { replace }));
      const after = getState().game;
      if (before && after && after !== before) setState({ outcome: diffOf(before, after) });
    },
    workHard: () => act((g) => economyAction(g, (x) => workHard(x, GAME_CONTENT))),
    takePoliceExam: (track) => act((g) => takePoliceExam(g, track, GAME_CONTENT)),
    trySpecialCourse: () => update((g) => trySpecialCourse(g, GAME_CONTENT)),
    commitCrime: (id) => {
      const before = getState().game;
      update((g) => commitCrime(g, id, GAME_CONTENT));
      const after = getState().game;
      if (before && after && after !== before) setState({ outcome: diffOf(before, after) });
    },
    startPlan: (id) => update((g) => startPlan(g, id, GAME_CONTENT)),
    launderMoney: () => act((g) => launderMoney(g, GAME_CONTENT)),
    tryLeaveFaction: () => update((g) => tryLeaveFaction(g, GAME_CONTENT)),
    prisonAction: (a) => act((g) => prisonAction(g, a, GAME_CONTENT)),
    setTrafficking: (level) => act((g) => (level ? startTrafficking(g, level) : stopTrafficking(g))),
    policeAction: (kind) => {
      const fn = { afinco: policeWorkHard, curso: policeCourse, estande: shootingRange, transferencia: requestTransfer, exoneracao: resignPolice }[kind];
      act((g) => fn(g, GAME_CONTENT));
    },
    askRaise: () => act((g) => economyAction(g, (x) => askRaise(x, GAME_CONTENT))),
    quitJob: () => eco((g) => quitJob(g, GAME_CONTENT)),
    takeExam: () => act((g) => takeExam(g, GAME_CONTENT)),
    takeBarExam: () => act((g) => takeBarExam(g, GAME_CONTENT)),
    meetResident: (id) => act((g) => meetResident(g, id, GAME_CONTENT)),
    appLike: (id) => act((g) => appLike(g, id, GAME_CONTENT)),
    appSkip: (id) => act((g) => appSkip(g, id)),
    reconnectExFriend: (id) => act((g) => reconnectExFriend(g, id)),
    takeCivilExam: (id) => act((g) => takeCivilExam(g, id, GAME_CONTENT)),
    postOnSocial: (kind) => act((g) => postOnSocial(g, kind, GAME_CONTENT)),
    setEating: (e) => act((g) => setEating(g, e)),
    startPostgrad: (k, f) => act((g) => startPostgrad(g, k, f, GAME_CONTENT)),
    footballTryout: (pos) => act((g) => tryout(g, pos, GAME_CONTENT)),
    trainFootball: () => act((g) => trainFootball(g, GAME_CONTENT)),
    acceptFootballOffer: (id) => act((g) => acceptFootballOffer(g, id, GAME_CONTENT)),
    retireFootball: () => act((g) => retireFootball(g)),
    finishMinigame: (input) => act((g) => finishMinigame(g, input)),
    practicePenalty: () => act((g) => startPenaltyPractice(g)),
    doCommercial: () => act((g) => doCommercial(g, GAME_CONTENT)),
    goOut: (id) => update((g) => goOut(g, id, GAME_CONTENT)),
    joinSportsClub: (id, sport) => update((g) => joinSportsClub(g, id, sport, GAME_CONTENT)),
    leaveSportsClub: () => update((g) => leaveSportsClub(g, GAME_CONTENT)),
    trainAtClub: () => act((g) => trainAtClub(g, GAME_CONTENT)),
    askParentsForExchange: () => update((g) => askParentsForExchange(g)),
    askJobLeave: () => update((g) => askJobLeave(g)),
    startExchange: (id) => eco((g) => startExchange(g, id, GAME_CONTENT)),
    enrollCollege: (id, type, financing) => act((g) => enrollCollege(g, id, type, GAME_CONTENT, financing)),
    lockCollege: () => update((g) => lockCollege(g)),
    unlockCollege: () => update((g) => unlockCollege(g)),
    dropCollege: () => update((g) => dropCollege(g, GAME_CONTENT)),
    hireAgent: () => update((g) => hireAgentAction(g, GAME_CONTENT)),
    fireAgent: () => eco((g) => fireAgent(g)),
    seekSponsor: () => eco((g) => seekSponsor(g, GAME_CONTENT)),
    buyAsset: (id, financed, years, place) => eco((g) => buyAsset(g, id, GAME_CONTENT, { financed, ...(years ? { years } : {}), ...(place ? { place } : {}) })),
    sellAsset: (id) => eco((g) => sellAsset(g, id)),
    setHome: (id) => eco((g) => setHome(g, id)),
    setRented: (id, rented) => eco((g) => setRented(g, id, rented, GAME_CONTENT)),
    setInsured: (id, insured) => eco((g) => setInsured(g, id, insured)),
    openBusiness: (defId) => eco((g) => openBusiness(g, defId, GAME_CONTENT)),
    dedicate: (id) => eco((g) => dedicate(g, id, GAME_CONTENT)),
    setManager: (id, manager) => eco((g) => setManager(g, id, manager)),
    expandBusiness: (id) => eco((g) => expandBusiness(g, id, GAME_CONTENT)),
    injectCash: (id, amount) => eco((g) => injectCash(g, id, amount)),
    sellBusiness: (id) => eco((g) => sellBusiness(g, id)),
    async newLife() {
      await clearGame();
      setState({ game: null });
      await getState().refreshSlots();
    },
  };
});

// Cena íntima nova (seq maior que o último visto): monta a transição antes do pop-up de resultado.
// A engine reinicia o seq em 1 depois de outra cena (praia/piscina), então uma cena não íntima zera o último visto.
useGameStore.subscribe((s, prev) => {
  if (!s.game || s.game === prev.game) return;
  const sc = s.game.scene;
  if (sc?.kind === 'intimo') {
    if (sc.seq > s.intimacySeen) useGameStore.setState({ intimacy: { variant: sc.variant }, intimacySeen: sc.seq });
  } else if (s.intimacySeen !== 0) useGameStore.setState({ intimacySeen: 0 });
});

// Autosave: toda mudança no jogo é gravada no IndexedDB.
// (com debounce curto: vários cliques seguidos viram uma gravação só, fora do caminho do clique)
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave: (() => void) | null = null;
useGameStore.subscribe((s, prev) => {
  if (s.status === 'ready' && s.game && s.game !== prev.game) {
    if (saveTimer) clearTimeout(saveTimer);
    const { game, slot } = s;
    pendingSave = () => {
      saveTimer = null;
      pendingSave = null;
      void saveSlot(slot, game);
    };
    // vida nova (ou herdeiro): grava na hora; mudanças seguidas na mesma vida: debounce
    const newLife = !prev.game || prev.game.seed !== game.seed || prev.game.dynasty.generation !== game.dynasty.generation;
    if (newLife) pendingSave();
    else saveTimer = setTimeout(pendingSave, 150);
  }
});
// ao sair/minimizar o app, grava na hora o que estiver pendente
if (typeof document !== 'undefined') {
  const flush = () => {
    if (!pendingSave) return;
    if (saveTimer) clearTimeout(saveTimer);
    pendingSave();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}
