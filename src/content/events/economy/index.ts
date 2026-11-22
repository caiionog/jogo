import type { GameEvent } from '../../../engine';
import { ASSET_EVENTS } from './assets';
import { MONEY_EVENTS } from './money';
import { WORK_EVENTS } from './work';

export const ECONOMY_EVENTS: readonly GameEvent[] = [...WORK_EVENTS, ...MONEY_EVENTS, ...ASSET_EVENTS];
