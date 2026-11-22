/** Fallback 2D do busto (sem WebGL, aparelho fraco, ou enquanto o 3D carrega). Só desenha o descriptor. */
import type { AvatarDescriptor } from '../../engine';

export default function AvatarSvg({ d, className = '', title }: { d: AvatarDescriptor; className?: string; title?: string }) {
  const g = d.growth;
  const headR = 30 - 3 * g;
  const shoulder = 18 + 22 * g * (1 + 0.15 * d.muscle + 0.18 * d.fat);
  const waist = shoulder * (0.78 + 0.3 * d.fat - 0.1 * d.muscle);
  const headY = 46 + 8 * (1 - g);
  const neckTop = headY + headR * 0.8;
  const torsoTop = 74 + 8 * (1 - g);
  const smile = d.expression === 'feliz' ? 5 : d.expression === 'triste' ? -4 : 0;
  const eyeY = headY + 2 - 4 * (1 - g);
  const bald = d.hair.baldness;
  const hairVol = d.hair.type === 'crespo' && d.hair.style !== 'curto' && d.hair.style !== 'raspado' ? 1.45 : d.hair.type === 'cacheado' ? 1.18 : 1.06;
  const bare = ['regata', 'vestido', 'festa'].includes(d.outfit.mesh);
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label={title ?? 'Avatar'}>
      {title && <title>{title}</title>}
      {d.hair.style === 'longo' && d.hair.type !== 'crespo' && <rect x={60 - headR} y={headY} width={headR * 2} height={torsoTop - headY + 14} rx={headR * 0.6} fill={d.hair.color} />}
      <path d={`M ${60 - waist} 120 C ${60 - waist} 100, ${60 - shoulder} 96, ${60 - shoulder} ${torsoTop + 10} Q ${60 - shoulder} ${torsoTop}, ${60 - shoulder * 0.5} ${torsoTop} L ${60 + shoulder * 0.5} ${torsoTop} Q ${60 + shoulder} ${torsoTop}, ${60 + shoulder} ${torsoTop + 10} C ${60 + shoulder} 96, ${60 + waist} 100, ${60 + waist} 120 Z`} fill={d.outfit.color} stroke="rgba(0,0,0,.15)" />
      {bare && <path d={`M ${60 - shoulder * 0.45} ${torsoTop} L 60 ${torsoTop + 14} L ${60 + shoulder * 0.45} ${torsoTop} Z`} fill={d.skin} />}
      {d.outfit.mesh === 'kimono' && <path d={`M ${60 - shoulder * 0.3} ${torsoTop} L 60 ${torsoTop + 26} L ${60 + shoulder * 0.3} ${torsoTop} Z`} fill={d.skin} stroke="#cbd5e1" strokeWidth="3" />}
      {d.outfit.beltColor && <rect x={60 - waist} y={114} width={waist * 2} height={6} fill={d.outfit.beltColor} />}
      <rect x={60 - 8 - 3 * d.muscle} y={neckTop - 6} width={16 + 6 * d.muscle} height={torsoTop - neckTop + 8} fill={d.skin} />
      {bald < 0.97 && hairVol > 1.3 && <circle cx="60" cy={headY - 6} r={headR * hairVol} fill={d.hair.color} />}
      <ellipse cx={60 - headR * 0.92} cy={eyeY + 3} rx={d.marks.cauliflowerEar ? 6 : 4.5} ry="8" fill={d.skin} />
      <ellipse cx={60 + headR * 0.92} cy={eyeY + 3} rx="4.5" ry="8" fill={d.skin} />
      <ellipse cx="60" cy={headY} rx={headR * (0.9 + 0.12 * d.fat)} ry={headR * 1.08} fill={d.skin} />
      {bald < 0.97 && hairVol <= 1.3 && (
        <path d={`M ${60 - headR * 0.95} ${headY - 2} Q ${60 - headR} ${headY - headR * 1.25}, 60 ${headY - headR * (1.15 + 0.1 * hairVol)} Q ${60 + headR} ${headY - headR * 1.25}, ${60 + headR * 0.95} ${headY - 2} Q ${60 + headR * 0.6} ${headY - headR * 0.75}, 60 ${headY - headR * 0.7} Q ${60 - headR * 0.6} ${headY - headR * 0.75}, ${60 - headR * 0.95} ${headY - 2} Z`} fill={d.hair.color} opacity={d.hair.style === 'raspado' ? 0.55 : 1} />
      )}
      {bald > 0.3 && bald < 0.97 && <ellipse cx="60" cy={headY - headR * 0.95} rx={headR * 0.55 * bald} ry={headR * 0.25 * bald} fill={d.skin} />}
      {d.facialHair === 'barba' && <path d={`M ${60 - headR * 0.85} ${headY + 2} Q 60 ${headY + headR * 1.55}, ${60 + headR * 0.85} ${headY + 2} Q 60 ${headY + headR * 0.9}, ${60 - headR * 0.85} ${headY + 2} Z`} fill={d.hair.color} />}
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={60 + s * 10} cy={eyeY} rx="4.4" ry={d.eyes.shape === 'alongado' ? 2.6 : 3.4} fill="#f4f1ec" />
          <circle cx={60 + s * 10} cy={eyeY + 0.3} r="2.3" fill={d.eyes.color} />
          <circle cx={60 + s * 10} cy={eyeY + 0.3} r="1.1" fill="#0d0b0a" />
          <rect x={60 + s * 10 - 5} y={eyeY - 9} width="10" height="2.2" rx="1" fill={d.hair.color} transform={`rotate(${s * (d.expression === 'triste' ? -10 : 0)} ${60 + s * 10} ${eyeY - 8})`} />
        </g>
      ))}
      {d.marks.blackEye && <ellipse cx="50" cy={eyeY + 1} rx="6.5" ry="5" fill="#4a2440" opacity=".45" />}
      <ellipse cx="60" cy={eyeY + 9} rx={3 + 2.5 * d.noseWidth} ry="3" fill="rgba(0,0,0,.12)" />
      <path d={`M 52 ${eyeY + 17} Q 60 ${eyeY + 17 + smile}, 68 ${eyeY + 17}`} stroke="#7a2e36" strokeWidth={2 + 2 * d.lipVolume} fill="none" strokeLinecap="round" />
      {(d.facialHair === 'bigode' || d.facialHair === 'cavanhaque' || d.facialHair === 'barba') && <rect x="53" y={eyeY + 12.5} width="14" height="3" rx="1.5" fill={d.hair.color} />}
      {d.marks.scar && <line x1="70" y1={eyeY - 12} x2="72" y2={eyeY - 4} stroke="#f2c7c0" strokeWidth="1.5" />}
    </svg>
  );
}
