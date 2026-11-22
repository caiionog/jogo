import type { GameContent } from '../engine';
import { ACTIONS } from './actions';
import { CLUBS } from './clubs';
import { CHILDHOOD_EVENTS } from './events/childhood';
import { SCHOOL_EVENTS } from './events/school';
import { LOCATIONS } from './locations';
import { NAMES } from './names';
import { FIGHT_TEXT } from './fightText';
import { INJURIES, NICKNAMES } from './fightText/nicknames';
import { GYMS } from './gyms';
import { ORGANIZATIONS } from './organizations';
import { DIVISIONS } from './organizations/divisions';
import { FIGHTING_EVENTS } from './events/fighting';
import { RELATIONSHIP_EVENTS } from './events/relationships';
import { RELATIONSHIPS_CONTENT } from './relationships';

export const GAME_CONTENT: GameContent = {
  actions: ACTIONS,
  events: [...CHILDHOOD_EVENTS, ...SCHOOL_EVENTS, ...FIGHTING_EVENTS, ...RELATIONSHIP_EVENTS],
  locations: LOCATIONS,
  clubs: CLUBS,
  names: NAMES,
  fighting: {
    orgs: ORGANIZATIONS,
    gyms: GYMS,
    divisions: DIVISIONS,
    text: FIGHT_TEXT,
    nicknames: NICKNAMES,
    injuries: INJURIES,
    hooks: { weightMissEventId: 'fight_weight_miss' },
  },
  relationships: RELATIONSHIPS_CONTENT,
};

export { RELATIONSHIP_EVENTS, RELATIONSHIPS_CONTENT };
export { ACTIONS, CHILDHOOD_EVENTS, CLUBS, DIVISIONS, FIGHT_TEXT, FIGHTING_EVENTS, GYMS, LOCATIONS, NAMES, ORGANIZATIONS, SCHOOL_EVENTS };
