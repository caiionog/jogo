import { POPULATION } from './population';
import { JOB_EVENTS } from './events/jobs';
import { COACH_LINES } from './fightText/coach';
import { POLICE } from './careers/police';
import { CRIME } from './crime';
import { FRIENDS } from './friends';
import { FRIEND_GROUP_EVENTS } from './events/friends';
import { CRIME_EVENTS } from './events/crime';
import { PRISON_EVENTS } from './events/prison';
import { POLICE_EVENTS } from './events/police';
import { OVERTRAIN } from './fightText/overtrain';
import type { GameContent } from '../engine';
import { ACTIONS } from './actions';
import { LIMITS } from './config';
import { LUCK, TALENTS } from './talents';
import { COLLEGE } from './college';
import { SPORTS_CLUBS } from './sportsClubs';
import { EXCHANGE_PROGRAMS } from './exchange';
import { VENUES } from './nightlife';
import { CLUBS } from './clubs';
import { CHILDHOOD_EVENTS } from './events/childhood';
import { SCHOOL_EVENTS } from './events/school';
import { GEO_CONTENT } from './geo/brasil';
import { OUTFITS } from './outfits';
import { NAMES } from './names';
import { FIGHT_TEXT } from './fightText';
import { NICKNAMES } from './fightText/nicknames';
import { HEALTH_CONTENT } from './health';
import { LEGACY_CONTENT } from './legacy';
import { ACHIEVEMENTS } from './achievements';
import { GYMS } from './gyms';
import { GRADUATIONS, MODALITIES } from './martialArts';
import { ORGANIZATIONS } from './organizations';
import { DIVISIONS } from './organizations/divisions';
import { FIGHTING_EVENTS } from './events/fighting';
import { RELATIONSHIP_EVENTS } from './events/relationships';
import { RELATIONSHIPS_CONTENT } from './relationships';
import { ECONOMY_CONTENT } from './economy';
import { ECONOMY_EVENTS } from './events/economy';
import { HEALTH_EVENTS } from './events/health';
import { LEGACY_EVENTS } from './events/legacy';
import { TALENT_EVENTS } from './events/talents';
import { COLLEGE_EVENTS } from './events/college';
import { CLUB_EXCHANGE_EVENTS } from './events/clubs';
import { NIGHTLIFE_EVENTS } from './events/nightlife';
import { RANDOM_EVENTS } from './events/random';

export const GAME_CONTENT: GameContent = {
  limits: LIMITS,
  talents: TALENTS,
  luck: LUCK,
  college: COLLEGE,
  sportsClubs: SPORTS_CLUBS,
  exchangePrograms: EXCHANGE_PROGRAMS,
  venues: VENUES,
  police: POLICE,
  crime: CRIME,
  friends: FRIENDS,
  population: POPULATION,
  actions: ACTIONS,
  events: [...CHILDHOOD_EVENTS, ...SCHOOL_EVENTS, ...FIGHTING_EVENTS, ...RELATIONSHIP_EVENTS, ...ECONOMY_EVENTS, ...JOB_EVENTS, ...HEALTH_EVENTS, ...LEGACY_EVENTS, ...TALENT_EVENTS, ...COLLEGE_EVENTS, ...CLUB_EXCHANGE_EVENTS, ...NIGHTLIFE_EVENTS, ...RANDOM_EVENTS, ...POLICE_EVENTS, ...CRIME_EVENTS, ...PRISON_EVENTS, ...FRIEND_GROUP_EVENTS],
  geo: GEO_CONTENT,
  clubs: CLUBS,
  names: NAMES,
  fighting: {
    orgs: ORGANIZATIONS,
    gyms: GYMS,
    divisions: DIVISIONS,
    text: FIGHT_TEXT,
    nicknames: NICKNAMES,
    coachLines: COACH_LINES,
    overtrain: OVERTRAIN,
    modalities: MODALITIES,
    graduations: GRADUATIONS,
    hooks: { weightMissEventId: 'fight_weight_miss', farewellEventId: 'retire_farewell', losingStreakEventId: 'retire_losing_streak', doctorRetireEventId: 'retire_doctor' },
  },
  relationships: RELATIONSHIPS_CONTENT,
  economy: ECONOMY_CONTENT,
  health: HEALTH_CONTENT,
  legacy: LEGACY_CONTENT,
  achievements: ACHIEVEMENTS,
  outfits: OUTFITS,
};

export { HEALTH_EVENTS, LEGACY_EVENTS };
export { RELATIONSHIP_EVENTS, RELATIONSHIPS_CONTENT, ECONOMY_CONTENT, ECONOMY_EVENTS };
export { GEO_CONTENT };
export { ACTIONS, CHILDHOOD_EVENTS, CLUBS, DIVISIONS, FIGHT_TEXT, FIGHTING_EVENTS, GYMS, NAMES, ORGANIZATIONS, SCHOOL_EVENTS };
