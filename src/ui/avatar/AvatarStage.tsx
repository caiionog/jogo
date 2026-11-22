/**
 * Avatar no topo da tela: 3D (chunk sob demanda) quando o aparelho aguenta, senão o SVG 2D.
 * Enquanto o 3D carrega, mostra o SVG do mesmo descriptor.
 */
import { Component, Suspense, lazy, useState } from 'react';
import type { ReactNode } from 'react';
import type { AvatarDescriptor } from '../../engine';
import AvatarSvg from './AvatarSvg';

const Avatar3D = lazy(() => import('./Avatar3D'));

let support: boolean | null = null;
/** WebGL disponível e aparelho não muito fraco. */
export function supports3D(): boolean {
  if (support !== null) return support;
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weak = (nav.hardwareConcurrency ?? 4) <= 2 || (nav.deviceMemory ?? 4) <= 2;
    const c = document.createElement('canvas');
    support = !weak && !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    support = false;
  }
  return support;
}

class Guard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function AvatarStage({ d, orbit = false, enabled = true, className = '', label }: { d: AvatarDescriptor; orbit?: boolean; enabled?: boolean; className?: string; label?: string }) {
  const [ready, setReady] = useState(false);
  const svg = <AvatarSvg d={d} className="h-full w-full" title={label} />;
  if (!enabled || !supports3D()) return <div className={className}>{svg}</div>;
  return (
    <div className={`relative ${className}`} aria-label={label} role="img" data-avatar3d={ready ? 'ready' : 'loading'}>
      {!ready && <div className="absolute inset-0">{svg}</div>}
      <Guard fallback={svg}>
        <Suspense fallback={null}>
          <Avatar3D d={d} orbit={orbit} className="!absolute inset-0" onReady={() => setReady(true)} />
        </Suspense>
      </Guard>
    </div>
  );
}
