/** Ações econômicas prontas para a UI (calculam o ano econômico e o patrimônio quando preciso). */
import type { GameContent } from '../core/content';
import type { GameState } from '../core/state';
import { createRng } from '../core/rng';
import { takePersonalLoan } from './bank';
import { appendLog } from '../core/stats';
import { eligibleSponsors, hireAgent, signSponsor } from './fightIncome';
import { applyForJob } from './jobs';
import { marketYear } from './market';
import { netWorth } from './worth';

export function currentMarket(state: GameState) {
  return marketYear(state.seed, state.year);
}

export function applyJob(state: GameState, jobId: string, content: GameContent): GameState {
  return applyForJob(state, jobId, content, currentMarket(state));
}

export function personalLoan(state: GameState, amount: number, years: number): GameState {
  return takePersonalLoan(state, amount, years, netWorth(state));
}

/** Ações de dinheiro só valem com o personagem vivo, sem evento pendente nem luta em andamento. */
export function canManageMoney(state: GameState): boolean {
  return state.alive && state.pendingEvents.length === 0 && !state.activeFight;
}

/** Aplica uma ação econômica respeitando `canManageMoney`. */
export function economyAction(state: GameState, fn: (s: GameState) => GameState): GameState {
  return canManageMoney(state) ? fn(state) : state;
}

/** Contrata um empresário (sorteado com o RNG do estado). */
export function hireAgentAction(state: GameState, content: GameContent): GameState {
  if (!canManageMoney(state) || state.character.age < 16 || state.fighter.reputation < 10) return state;
  const rng = createRng(state.rngState);
  const s = hireAgent(state, rng, content);
  return { ...s, rngState: rng.state };
}

export const SEEK_SPONSOR_COST = 1;

/** Por que não dá para procurar patrocínio agora (null = pode). */
export function seekSponsorBlockReason(state: GameState, content: GameContent): 'busy' | 'no-energy' | 'already' | 'none' | 'suspended' | null {
  if (!canManageMoney(state)) return 'busy';
  if (state.fighter.suspendedYears > 0) return 'suspended';
  if (state.flags.buscou_patrocinio === state.year) return 'already';
  if (!eligibleSponsors(state, content).length) return 'none';
  if (state.energy.current < SEEK_SPONSOR_COST) return 'no-energy';
  return null;
}

/** Procurar patrocínio (⚡1, uma vez por ano): chance cresce com a reputação; fecha com a melhor marca disponível. */
export function seekSponsor(state: GameState, content: GameContent): GameState {
  if (seekSponsorBlockReason(state, content) !== null) return state;
  const rng = createRng(state.rngState);
  let s: GameState = {
    ...state,
    energy: { ...state.energy, current: state.energy.current - SEEK_SPONSOR_COST },
    flags: { ...state.flags, buscou_patrocinio: state.year },
  };
  const chance = Math.min(0.85, 0.35 + state.fighter.reputation / 150);
  if (rng.chance(chance)) {
    const options = eligibleSponsors(s, content);
    const def = options[rng.int(0, Math.min(1, options.length - 1))];
    s = signSponsor(s, content, def?.id);
  } else {
    s = appendLog(s, 'Você procurou patrocinadores, mas nenhuma marca fechou com você este ano.');
  }
  return { ...s, rngState: rng.state };
}
