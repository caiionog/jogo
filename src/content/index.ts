import type { GameContent } from '../engine';
import { ACTIONS } from './actions';
import { CHILDHOOD_EVENTS } from './events/childhood';
import { LOCATIONS } from './locations';

export const GAME_CONTENT: GameContent = {
  actions: ACTIONS,
  events: [...CHILDHOOD_EVENTS],
  locations: LOCATIONS,
};

export { ACTIONS, CHILDHOOD_EVENTS, LOCATIONS };
