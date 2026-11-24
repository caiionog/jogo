import type { GameEvent } from '../../../engine';
import { CIVIL_EVENTS } from './civil';
import { POLICE_LIFE_EVENTS } from './life';
import { POLICE_COLLEAGUE_EVENTS } from './colleagues';
import { PM_EVENTS } from './pm';

/** Eventos da carreira policial (release 0.0.2). */
export const POLICE_EVENTS: readonly GameEvent[] = [...PM_EVENTS, ...CIVIL_EVENTS, ...POLICE_LIFE_EVENTS, ...POLICE_COLLEAGUE_EVENTS];
