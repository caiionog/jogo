import type { GameContent } from '../engine';
import { ACTIONS } from './actions';
import { CLUBS } from './clubs';
import { CHILDHOOD_EVENTS } from './events/childhood';
import { SCHOOL_EVENTS } from './events/school';
import { LOCATIONS } from './locations';
import { NAMES } from './names';

export const GAME_CONTENT: GameContent = {
  actions: ACTIONS,
  events: [...CHILDHOOD_EVENTS, ...SCHOOL_EVENTS],
  locations: LOCATIONS,
  clubs: CLUBS,
  names: NAMES,
};

export { ACTIONS, CHILDHOOD_EVENTS, CLUBS, LOCATIONS, NAMES, SCHOOL_EVENTS };
