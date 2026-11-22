import type { GameEvent } from '../../../engine';
import { ADULT_EVENTS } from './adult';
import { LOVE_CAREER_EVENTS } from './career';
import { CHILDREN_EVENTS } from './children';
import { FAMILY_EVENTS } from './family';
import { FRIEND_EVENTS } from './friends';
import { ROMANCE_EVENTS } from './romance';

export const RELATIONSHIP_EVENTS: readonly GameEvent[] = [
  ...FAMILY_EVENTS,
  ...FRIEND_EVENTS,
  ...ROMANCE_EVENTS,
  ...ADULT_EVENTS,
  ...CHILDREN_EVENTS,
  ...LOVE_CAREER_EVENTS,
];
