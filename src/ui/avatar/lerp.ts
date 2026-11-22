/** Transição suave entre dois descriptors (só interpolação visual; os valores vêm da engine). */
import type { AvatarDescriptor } from '../../engine';

const num = (a: number, b: number, t: number) => a + (b - a) * t;

function hex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(num((pa >> s) & 255, (pb >> s) & 255, t));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

export function lerpDescriptor(a: AvatarDescriptor, b: AvatarDescriptor, t: number): AvatarDescriptor {
  if (t >= 1) return b;
  const pick = t < 0.5 ? a : b;
  return {
    ...pick,
    growth: num(a.growth, b.growth, t),
    elder: num(a.elder, b.elder, t),
    fat: num(a.fat, b.fat, t),
    muscle: num(a.muscle, b.muscle, t),
    wrinkles: num(a.wrinkles, b.wrinkles, t),
    noseWidth: num(a.noseWidth, b.noseWidth, t),
    lipVolume: num(a.lipVolume, b.lipVolume, t),
    skin: hex(a.skin, b.skin, t),
    hair: { ...pick.hair, color: hex(a.hair.color, b.hair.color, t), grey: num(a.hair.grey, b.hair.grey, t), baldness: num(a.hair.baldness, b.hair.baldness, t) },
  };
}
