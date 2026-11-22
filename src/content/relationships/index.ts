import type { RelationshipsContent } from '../../engine';
import { JOBS } from './jobs';
import { TRAITS } from './traits';

export const RELATIONSHIPS_CONTENT: RelationshipsContent = {
  traits: TRAITS,
  jobs: JOBS,
  hooks: { weddingEventId: 'rel_wedding', pregnancyEventId: 'rel_pregnancy_news' },
};

export { JOBS, TRAITS };
