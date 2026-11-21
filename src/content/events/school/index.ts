import type { GameEvent } from '../../../engine';
import { DISCIPLINE_EVENTS } from './discipline';
import { FUNDAMENTAL1_EVENTS } from './fundamental1';
import { FUNDAMENTAL2_EVENTS } from './fundamental2';
import { HIGHSCHOOL_EVENTS } from './highschool';
import { MILESTONE_EVENTS } from './milestones';
import { PRESCHOOL_EVENTS } from './preschool';

export const SCHOOL_EVENTS: readonly GameEvent[] = [
  ...PRESCHOOL_EVENTS,
  ...FUNDAMENTAL1_EVENTS,
  ...FUNDAMENTAL2_EVENTS,
  ...HIGHSCHOOL_EVENTS,
  ...DISCIPLINE_EVENTS,
  ...MILESTONE_EVENTS,
];
