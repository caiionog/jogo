/** Reexporta o que o teste de segurança adulta (release 0.0.1) usa, para manter os imports do topo intactos. */
import { GAME_CONTENT } from '../src/content';
export { FLIRT_TYPES, addRelation, createPerson, goOut, isValidPartnerAge } from '../src/engine';
export const VENUES_FOR_TEST = GAME_CONTENT.venues;
