import type { GameEvent } from '../../../engine';
import { FIGHT_BASE_EVENTS } from './base';
import { FIGHT_PRO_EVENTS } from './pro';

export const FIGHTING_EVENTS: readonly GameEvent[] = [...FIGHT_BASE_EVENTS, ...FIGHT_PRO_EVENTS];
