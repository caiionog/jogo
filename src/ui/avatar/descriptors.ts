/** Atalhos da UI para pedir descriptors à engine (a UI não calcula aparência). */
import { GAME_CONTENT } from '../../content';
import type { AvatarDescriptor, GameState, NpcLike, Person } from '../../engine';
import { deriveNpcAvatar, derivePersonAvatar, playerDivision } from '../../engine';

export function personAvatar(p: Person, affection?: number): AvatarDescriptor | null {
  return derivePersonAvatar(p, GAME_CONTENT, affection === undefined ? {} : { affection });
}

export function fighterAvatar(game: GameState, npc: NpcLike, champion = false): AvatarDescriptor {
  const div = playerDivision(game, GAME_CONTENT);
  const heavy = Math.max(0, Math.min(1, (div.limitKg - 52) / 68));
  return deriveNpcAvatar(game.seed, npc, div.sex, GAME_CONTENT, { heavy, champion });
}
