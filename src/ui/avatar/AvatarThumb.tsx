/** Miniatura de NPC: imagem do cache (renderizador compartilhado) ou o SVG enquanto não chega. */
import { useEffect, useMemo, useState } from 'react';
import type { AvatarDescriptor } from '../../engine';
import { avatarHash } from '../../engine';
import AvatarSvg from './AvatarSvg';
import { supports3D } from './AvatarStage';
import { thumbnails } from './thumbnails';

export default function AvatarThumb({ d, size = 48, className = '', label, dim = false }: { d: AvatarDescriptor | null; size?: number; className?: string; label?: string; dim?: boolean }) {
  const hash = useMemo(() => (d ? avatarHash(d) : ''), [d]);
  const [url, setUrl] = useState(() => (d ? thumbnails.get(d, size) : undefined));
  useEffect(() => {
    if (!d || !supports3D()) return;
    let alive = true;
    const hit = thumbnails.get(d, size);
    setUrl(hit);
    if (!hit) void thumbnails.request(d, size).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, size]);
  const box = `shrink-0 overflow-hidden rounded-full bg-slate-800 ${dim ? 'opacity-50 grayscale' : ''} ${className}`;
  if (!d) return <div className={box} style={{ width: size, height: size }} />;
  return (
    <div className={box} style={{ width: size, height: size }}>
      {url ? <img src={url} alt={label ?? ''} width={size} height={size} className="h-full w-full object-cover" /> : <AvatarSvg d={d} className="h-full w-full" title={label} />}
    </div>
  );
}
