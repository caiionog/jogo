import type { GameContent } from '../engine';
import { ACTIONS } from './actions';
import { CLUBS } from './clubs';
import { CHILDHOOD_EVENTS } from './events/childhood';
import { SCHOOL_EVENTS } from './events/school';
import { LOCATIONS } from './locations';
import { NAMES } from './names';
import { FIGHT_TEXT } from './fightText';
import { NICKNAMES } from './fightText/nicknames';
import { HEALTH_CONTENT } from './health';
import { LEGACY_CONTENT } from './legacy';
import { ACHIEVEMENTS } from './achievements';
import { GYMS } from './gyms';
import { ORGANIZATIONS } from './organizations';
import { DIVISIONS } from './organizations/divisions';
import { FIGHTING_EVENTS } from './events/fighting';
import { RELATIONSHIP_EVENTS } from './events/relationships';
import { RELATIONSHIPS_CONTENT } from './relationships';
import { ECONOMY_CONTENT } from './economy';
import { ECONOMY_EVENTS } from './events/economy';
import { HEALTH_EVENTS } from './events/health';
import { LEGACY_EVENTS } from './events/legacy';

export const GAME_CONTENT: GameContent = {
  actions: ACTIONS,
  events: [...CHILDHOOD_EVENTS, ...SCHOOL_EVENTS, ...FIGHTING_EVENTS, ...RELATIONSHIP_EVENTS, ...ECONOMY_EVENTS, ...HEALTH_EVENTS, ...LEGACY_EVENTS],
  locations: LOCATIONS,
  clubs: CLUBS,
  names: NAMES,
  fighting: {
    orgs: ORGANIZATIONS,
    gyms: GYMS,
    divisions: DIVISIONS,
    text: FIGHT_TEXT,
    nicknames: NICKNAMES,
    hooks: { weightMissEventId: 'fight_weight_miss', farewellEventId: 'retire_farewell', losingStreakEventId: 'retire_losing_streak', doctorRetireEventId: 'retire_doctor' },
  },
  relationships: RELATIONSHIPS_CONTENT,
  economy: ECONOMY_CONTENT,
  health: HEALTH_CONTENT,
  legacy: LEGACY_CONTENT,
  achievements: ACHIEVEMENTS,
};

export { HEALTH_EVENTS, LEGACY_EVENTS };
export { RELATIONSHIP_EVENTS, RELATIONSHIPS_CONTENT, ECONOMY_CONTENT, ECONOMY_EVENTS };
export { ACTIONS, CHILDHOOD_EVENTS, CLUBS, DIVISIONS, FIGHT_TEXT, FIGHTING_EVENTS, GYMS, LOCATIONS, NAMES, ORGANIZATIONS, SCHOOL_EVENTS };
