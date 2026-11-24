/** Miniatura de NPC: busto (pixel art ou cartoon, pelo visual ativo) vindo do cache (composto uma vez por descriptor). */
import { useEffect, useMemo, useState } from 'react';
import type { AvatarDescriptor } from '../../engine';
import { avatarHash } from '../../engine';
import { thumbnailsFor } from './thumbnails';
import { useAvatarStyle } from './style';

export default function AvatarThumb({ d, size = 48, className = '', label, dim = false }: { d: AvatarDescriptor | null; size?: number; className?: string; label?: string; dim?: boolean }) {
  const style = useAvatarStyle();
  const thumbnails = thumbnailsFor(style);
  const hash = useMemo(() => (d ? avatarHash(d) : ''), [d]);
  const [url, setUrl] = useState(() => (d ? thumbnails.get(d, 28) : undefined));
  useEffect(() => {
    if (!d) return;
    let alive = true;
    const hit = thumbnails.get(d, 28);
    setUrl(hit);
    if (!hit) void thumbnails.request(d, 28).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, style]);
  const box = `shrink-0 overflow-hidden rounded-full bg-[var(--ds-avatar-bg)] ${dim ? 'opacity-50 grayscale' : ''} ${className}`;
  return (
    <div className={box} style={{ width: size, height: size }} role="img" aria-label={label ?? ''}>
      {url ? <img src={url} alt="" width={size} height={size} className="h-full w-full" style={style === 'pixel' ? { imageRendering: 'pixelated' } : undefined} /> : null}
    </div>
  );
}
