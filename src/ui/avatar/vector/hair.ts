/**
 * Cabelo cartoon em até quatro camadas: atrás do corpo (`back`), sobre a roupa e atrás da cabeça (`mid`, rabo de
 * cavalo), mechas na frente dos ombros (`locks`) e a franja/topo (`front`). O tipo muda o volume e a borda:
 * liso (lisa, com brilho), ondulado (ondas suaves), cacheado (cachos) e crespo (cachos miúdos e mais volume).
 * A calvície sobe a linha do cabelo e, quando forte, deixa só as laterais.
 */
import type { AvatarDescriptor } from '../../../engine';
import type { Fig, Head } from './body';
import { clamp, ellipse, lerp, n, smooth } from './geom';
import type { Pt } from './geom';
import type { Ramp } from './palette';
import type { Doc } from './svg';
import { faceOf, headPt } from './head';

type HairType = AvatarDescriptor['hair']['type'];

const VOL: Record<HairType, number> = { liso: 1, ondulado: 1.3, cacheado: 1.75, crespo: 2.1 };

/** Aplica a textura na borda (pontos já com folga), empurrando para fora a partir do centro (cx, cy). */
function texture(pts: Pt[], type: HairType, cx: number, cy: number, amp: number): Pt[] {
  if (type === 'liso' || pts.length < 3) return pts;
  const out: Pt[] = [];
  const push = (x: number, y: number, k: number, corner = false) => {
    const dx = x - cx;
    const dy = y - cy;
    const l = Math.hypot(dx, dy) || 1;
    out.push(corner ? [x + (dx / l) * k, y + (dy / l) * k, 1] : [x + (dx / l) * k, y + (dy / l) * k]);
  };
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    if (type === 'ondulado') {
      push(p[0], p[1], i % 2 ? amp * 0.55 : -amp * 0.25);
      continue;
    }
    // cacheado/crespo: base em quina (entre cachos) e um cacho arredondado entre cada par
    push(p[0], p[1], -amp * 0.2, i > 0 && i < pts.length - 1);
    const q = pts[i + 1];
    if (q) push((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, amp * (type === 'crespo' ? 0.85 : 1));
  }
  return out;
}

/** Densidade de pontos da borda pelo tipo (cachos crespos são menores e mais numerosos). */
const STEPS: Record<HairType, number> = { liso: 12, ondulado: 14, cacheado: 13, crespo: 19 };

type Hairline = 'side' | 'straight' | 'fringe' | 'back' | 'center';

interface CapOpts {
  vol: number;
  thS: number;
  line: Hairline;
  hl: number;
  /** Até onde a borda de dentro desce pelo rosto (θ). */
  inS?: number;
}

/** Topo/franja: entre a borda de fora (cabeça + volume) e a linha do cabelo na testa. */
function capPath(h: Head, type: HairType, o: CapOpts): { d: string; inner: string } {
  const N = STEPS[type];
  const outer: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const th = lerp(-o.thS, o.thS, i / N);
    const e = o.vol * (0.38 + 0.62 * Math.max(0, Math.cos(th)));
    outer.push(headPt(h, (th + Math.PI * 2) % (Math.PI * 2), e));
  }
  const tex = texture(outer, type, h.cx, h.cy + 6, clamp(o.vol * 0.42, 1.4, 4.2) * h.s);
  const inS = o.inS ?? o.thS;
  const W = h.W;
  const hl = o.hl;
  const tR = headPt(h, 1.02, -1.4);
  const tL: Pt = [2 * h.cx - tR[0], tR[1]];
  let line: Pt[];
  switch (o.line) {
    case 'side':
      line = [[h.cx + W * 0.6, hl + 4], [h.cx + W * 0.2, hl + 0.5], [h.cx - W * 0.12, hl + 2.2], [h.cx - W * 0.28, hl + 0.6, 1], [h.cx - W * 0.55, hl + 5]];
      break;
    case 'center':
      line = [[h.cx + W * 0.62, hl + 6], [h.cx + W * 0.25, hl + 1.5], [h.cx, hl - 1, 1], [h.cx - W * 0.25, hl + 1.5], [h.cx - W * 0.62, hl + 6]];
      break;
    case 'fringe':
      line = [[h.cx + W * 0.82, hl - 3], [h.cx + W * 0.55, hl + 0.5], [h.cx + W * 0.28, hl + 1.6, 1], [h.cx, hl + 1, 1], [h.cx - W * 0.28, hl + 1.6, 1], [h.cx - W * 0.55, hl + 0.5], [h.cx - W * 0.82, hl - 3]];
      break;
    case 'back':
      line = [[h.cx + W * 0.62, hl + 2.5], [h.cx, hl - 1.5], [h.cx - W * 0.62, hl + 2.5]];
      break;
    default:
      line = [[h.cx + W * 0.62, hl + 2.5], [h.cx + W * 0.3, hl + 0.2], [h.cx - W * 0.3, hl + 0.2], [h.cx - W * 0.62, hl + 2.5]];
  }
  const sideR: Pt[] = [];
  for (let i = 0; i <= 3; i++) sideR.push(headPt(h, lerp(inS, 1.12, i / 3), -1.2));
  const sideL = sideR.map((p): Pt => [2 * h.cx - p[0], p[1]]).reverse();
  const endR = headPt(h, o.thS, -0.6);
  const endL: Pt = [2 * h.cx - endR[0], endR[1], 1];
  const innerPts: Pt[] = [[endR[0], endR[1], 1], ...sideR, ...(o.line === 'fringe' ? [] : [tR]), ...line, ...(o.line === 'fringe' ? [] : [tL]), ...sideL, endL];
  const d = smooth([...tex.slice(1, -1), ...innerPts]);
  const inner = smooth(innerPts, false);
  return { d, inner };
}

function hairlineY(h: Head, d: AvatarDescriptor, line: Hairline): number {
  const fc = faceOf(h);
  if (line === 'fringe') return fc.browY - 2.5 * h.s;
  const base = h.crown + h.Ht * (line === 'back' ? 0.34 : 0.42);
  return base + clamp(d.hair.baldness, 0, 1) * 15 * h.s;
}

/** Brilho do cabelo liso/ondulado (um arco claro no alto à esquerda). */
function sheen(doc: Doc, h: Head, vol: number, hair: Ramp, type: HairType): void {
  if (type === 'cacheado' || type === 'crespo') return;
  const a = headPt(h, Math.PI * 2 - 1.0, vol * 0.45);
  const b = headPt(h, Math.PI * 2 - 0.62, vol * 0.62);
  const c = headPt(h, Math.PI * 2 - 0.25, vol * 0.72);
  doc.stroke(`M${n(a[0] + 2)} ${n(a[1] + 2)}Q${n(b[0] + 3)} ${n(b[1] + 3)} ${n(c[0] + 1)} ${n(c[1] + 3.5)}`, hair.light, 2.4 * h.s, 0.6);
}

/** Lateral comprida (de cima da orelha até `yEnd`), atrás do corpo. */
function backPanel(h: Head, type: HairType, vol: number, yEnd: number, spread: number): string {
  const N = STEPS[type] + 4;
  const top: Pt[] = [];
  for (let i = 0; i <= N; i++) top.push(headPt(h, lerp(-Math.PI / 2 - 0.15, Math.PI / 2 + 0.15, i / N) + (i / N < 0.5 ? Math.PI * 2 : 0), vol * 0.9));
  const fixed = top.map((p): Pt => [p[0], p[1]]);
  const tex = texture(fixed, type, h.cx, h.cy, clamp(vol * 0.4, 1.4, 4.4) * h.s);
  const r = fixed[fixed.length - 1]!;
  const l = fixed[0]!;
  const side = (x: number, s: number): Pt[] => [
    [x + s * 1, lerp(r[1], yEnd, 0.45)],
    [x + s * spread, yEnd - 4],
    [x + s * (spread - 3), yEnd, 1],
  ];
  const right = side(r[0], 1);
  const left = side(l[0], -1).reverse();
  return smooth([...tex, ...right, [h.cx + h.W * 0.5, yEnd + 2, 1], [h.cx - h.W * 0.5, yEnd + 2, 1], ...left]);
}

/** Mecha na frente do ombro (de cima da orelha até `yEnd`). */
function lockPath(h: Head, f: Fig, side: -1 | 1, type: HairType, vol: number, yEnd: number): string {
  const fc = faceOf(h);
  const tip = clamp(yEnd, h.chin - 4, f.yChest + 30);
  const pts: Pt[] = [];
  const top = headPt(h, side > 0 ? 1.45 : Math.PI * 2 - 1.45, -2.2);
  const outerTop = headPt(h, side > 0 ? 1.35 : Math.PI * 2 - 1.35, vol * 0.9);
  const longHair = tip > f.yNeck;
  pts.push([top[0], top[1]]);
  pts.push([h.cx + side * (h.W - 2.6), fc.mouthY - 2]);
  if (longHair) {
    pts.push([h.cx + side * (f.neck + 4.5), f.yNeck + 2]);
    pts.push([h.cx + side * (f.neck + 6), lerp(f.yNeck, tip, 0.65)]);
    pts.push([h.cx + side * (f.neck + 10), tip, 1]);
    pts.push([h.cx + side * (f.neck + 17 + vol * 0.6), tip - 5]);
    pts.push([h.cx + side * Math.min(f.shoulder - 4, h.W + vol + 4), lerp(f.yNeck, tip, 0.3)]);
  } else {
    pts.push([h.cx + side * (h.W - 3.5), tip - 2]);
    pts.push([h.cx + side * (h.W + 1), tip, 1]);
  }
  pts.push([h.cx + side * (h.W + vol * 0.95 + 0.5), h.chin - 8]);
  pts.push([outerTop[0], outerTop[1]]);
  const ordered = pts;
  const tex = type === 'liso' ? ordered : ordered.map((p, i): Pt => (i > 1 && i < ordered.length - 1 && !p[2] ? [p[0] + side * (i % 2 ? 1.2 : -0.6) * VOL[type], p[1]] : p));
  return smooth(tex);
}

function braids(doc: Doc, h: Head, f: Fig, hair: Ramp, thick: boolean, yEnd: number): void {
  const fc = faceOf(h);
  const per = thick ? 2 : 3;
  const w = thick ? 5.2 : 3.6;
  for (const side of [-1, 1] as const) {
    for (let k = 0; k < per; k++) {
      const x0 = h.cx + side * (h.W - 3 + k * (thick ? 6 : 4.5));
      const y0 = fc.eyeY - 2 + k * 3;
      const x1 = h.cx + side * (f.neck + 7 + k * (thick ? 9 : 6.5));
      const y1 = yEnd - k * 6;
      const mid = [lerp(x0, x1, 0.5) + side * 3, lerp(y0, y1, 0.45)] as const;
      const d = smooth([[x0 - w, y0], [mid[0] - w, mid[1]], [x1 - w * 0.8, y1 - 2], [x1, y1 + (thick ? 3 : 1)], [x1 + w * 0.8, y1 - 2], [mid[0] + w, mid[1]], [x0 + w, y0]]);
      doc.region(d, hair, { shift: [-1.5, -1], sw: 1.2 });
      // trançado / gomos
      const segs = thick ? 6 : 9;
      let marks = '';
      for (let i = 1; i < segs; i++) {
        const t = i / segs;
        const x = t < 0.45 ? lerp(x0, mid[0], t / 0.45) : lerp(mid[0], x1, (t - 0.45) / 0.55);
        const y = t < 0.45 ? lerp(y0, mid[1], t / 0.45) : lerp(mid[1], y1, (t - 0.45) / 0.55);
        marks += thick ? `M${n(x - w * 0.8)} ${n(y)}q${n(w * 0.8)} 1.6 ${n(w * 1.6)} 0` : `M${n(x - w * 0.8)} ${n(y - 1)}l${n(w * 0.8)} 1.6l${n(w * 0.8)} -1.6`;
      }
      doc.stroke(marks, hair.line, 0.8, 0.55);
    }
  }
}

export interface HairPlan {
  back(doc: Doc): void;
  mid(doc: Doc): void;
  locks(doc: Doc): void;
  front(doc: Doc): void;
}

export function hairPlan(d: AvatarDescriptor, f: Fig, hair: Ramp): HairPlan {
  const h = f.head;
  const type = d.hair.type;
  const st = d.hair.style;
  const female = d.sex === 'F';
  const v = VOL[type];
  const bald = clamp(d.hair.baldness, 0, 1);
  const none = () => {};
  const plan: HairPlan = { back: none, mid: none, locks: none, front: none };
  const cap = (vol: number, line: Hairline, thS = 1.74, opts: { flat?: boolean; opacity?: number; outlineInnerOnly?: boolean } = {}) => (doc: Doc) => {
    if (bald > 0.62 && line !== 'fringe') {
      // só as laterais e a nuca
      for (const side of [-1, 1] as const) {
        const pts: Pt[] = [];
        for (let i = 0; i <= 6; i++) pts.push(headPt(h, side > 0 ? lerp(0.95, thS, i / 6) : Math.PI * 2 - lerp(0.95, thS, i / 6), vol * 0.32 + 1));
        const inn: Pt[] = [];
        for (let i = 6; i >= 0; i--) inn.push(headPt(h, side > 0 ? lerp(1.05, thS, i / 6) : Math.PI * 2 - lerp(1.05, thS, i / 6), -1.4));
        const first = pts[0]!;
        doc.region(smooth([[first[0], first[1], 1], ...pts.slice(1), ...inn]), hair, { shift: [-1, -1], sw: opts.flat ? 0 : 1.4, ...(opts.opacity ? { opacity: opts.opacity } : {}) });
      }
      return;
    }
    const c = capPath(h, type, { vol, thS, line, hl: hairlineY(h, d, line) });
    if (opts.outlineInnerOnly) {
      doc.region(c.d, hair, { flat: true, sw: 0 });
      doc.stroke(c.inner, hair.line, 1.6);
    } else doc.region(c.d, hair, { shift: [-3, -3.5], sw: opts.flat ? 0 : 1.8, ...(opts.flat ? { flat: true } : {}), ...(opts.opacity ? { opacity: opts.opacity } : {}) });
    if (!opts.flat && !opts.outlineInnerOnly) sheen(doc, h, vol, hair, type);
  };
  switch (st) {
    case 'careca':
      plan.front = (doc) => {
        const a = headPt(h, Math.PI * 2 - 0.7, -4);
        doc.fill(ellipse(a[0] + 3, a[1] + 3, 6 * h.s, 3 * h.s), '#ffffff', 0.14);
      };
      break;
    case 'raspado':
      plan.front = cap(1.4, 'straight', 1.7, { flat: true, opacity: 0.62 });
      break;
    case 'curto':
      plan.front = cap((female ? 5 : 4.6) * v, female ? 'side' : 'side', type === 'crespo' || type === 'cacheado' ? 1.68 : 1.76);
      if (female) plan.locks = (doc) => { for (const s of [-1, 1] as const) doc.region(lockPath(h, f, s, type, 4 * v, h.cy + 18), hair, { shift: [-2, -2], sw: 1.6 }); };
      break;
    case 'medio': {
      const end = female ? h.chin + 8 : h.chin - 6;
      plan.back = (doc) => doc.region(backPanel(h, type, 5 * v, end, 3 + v * 2), hair, { shift: [-3, -3], sw: 1.8 });
      plan.locks = (doc) => { for (const s of [-1, 1] as const) doc.region(lockPath(h, f, s, type, 5 * v, end), hair, { shift: [-2, -2.5], sw: 1.7 }); };
      plan.front = cap(5.2 * v, female ? 'side' : 'side', 1.6);
      break;
    }
    case 'longo': {
      const end = f.yChest + (female ? 16 : 0);
      plan.back = (doc) => doc.region(backPanel(h, type, 5.5 * v, end, 5 + v * 3), hair, { shift: [-3, -3], sw: 1.8 });
      plan.locks = (doc) => { for (const s of [-1, 1] as const) doc.region(lockPath(h, f, s, type, 5.5 * v, end), hair, { shift: [-2.5, -3], sw: 1.7 }); };
      plan.front = cap(5.6 * v, 'center', 1.6);
      break;
    }
    case 'franja': {
      const end = h.chin + 6;
      plan.back = (doc) => doc.region(backPanel(h, type, 5 * v, end, 3 + v * 2), hair, { shift: [-3, -3], sw: 1.8 });
      plan.locks = (doc) => { for (const s of [-1, 1] as const) doc.region(lockPath(h, f, s, type, 5 * v, end), hair, { shift: [-2, -2.5], sw: 1.7 }); };
      plan.front = cap(5.4 * v, 'fringe', 1.6);
      break;
    }
    case 'black_power': {
      const fc = faceOf(h);
      plan.back = (doc) => {
        const N = type === 'crespo' ? 26 : 20;
        const pts: Pt[] = [];
        const rx = h.W + 17 * h.s * (v / 2);
        const ry = h.Ht + 17 * h.s * (v / 2);
        const cy = h.cy - 4 * h.s;
        for (let i = 0; i < N; i++) {
          const a = (Math.PI * 2 * i) / N;
          const y = cy - Math.cos(a) * ry;
          pts.push([h.cx + Math.sin(a) * rx * (y > fc.mouthY ? 0.86 : 1), Math.min(y, fc.mouthY + 4)]);
        }
        doc.region(smooth(texture([...pts, pts[0]!], type === 'liso' ? 'cacheado' : type, h.cx, cy, 3.6 * h.s).slice(0, -2)), hair, { shift: [-5, -5], sw: 1.9 });
      };
      plan.front = cap(6 * v, 'straight', 1.5, { outlineInnerOnly: true });
      break;
    }
    case 'coque':
      plan.back = (doc) => {
        const r = (11 + v * 2.2) * h.s;
        const cy = h.crown - r * 0.55;
        const pts: Pt[] = [];
        for (let i = 0; i < 12; i++) pts.push([h.cx + Math.sin((Math.PI * 2 * i) / 12) * r, cy - Math.cos((Math.PI * 2 * i) / 12) * r]);
        doc.region(smooth(texture([...pts, pts[0]!], type, h.cx, cy, 2.6).slice(0, type === 'liso' ? -1 : -2)), hair, { shift: [-3, -3], sw: 1.8 });
        doc.stroke(`M${n(h.cx - r * 0.5)} ${n(cy - r * 0.2)}q${n(r * 0.5)} ${n(r * 0.5)} ${n(r)} 0`, hair.line, 1, 0.5);
      };
      plan.front = cap(3.2 * Math.min(v, 1.4), 'back', 1.64);
      break;
    case 'rabo':
      plan.mid = (doc) => {
        const x0 = h.cx + h.W * 0.55;
        const tip = f.yChest + 8;
        const w = (6 + v * 2.5) * h.s;
        const pts: Pt[] = [[x0, h.cy - 4], [h.cx + h.W + w + 2, h.chin - 8], [h.cx + h.W + w * 0.9 + 4, f.yNeck + 8], [h.cx + f.shoulder * 0.82, tip, 1], [h.cx + h.W + 2, f.yNeck + 6], [h.cx + h.W - 2, h.chin]];
        doc.region(smooth(type === 'liso' ? pts : pts.map((p, i): Pt => (i === 1 || i === 2 ? [p[0] + 1.5 * v, p[1]] : p))), hair, { shift: [-2.5, -2], sw: 1.7 });
      };
      plan.front = (doc) => {
        cap(3.4 * Math.min(v, 1.4), 'back', 1.64)(doc);
        const p = headPt(h, 1.45, 1.2);
        doc.fill(ellipse(p[0] + 0.5, p[1] + 2, 2.6, 3.6), '#3a3a52');
      };
      break;
    case 'moicano':
      plan.front = (doc) => {
        cap(1.4, 'straight', 1.7, { flat: true, opacity: 0.45 })(doc);
        const hl = hairlineY(h, d, 'straight');
        const top = h.crown - (8 + v * 6) * h.s;
        const w = (6.5 + v) * h.s;
        const base: Pt[] = [[h.cx - w, hl + 2, 1], [h.cx - w * 1.05, h.crown + 4], [h.cx - w * 0.6, top + 4], [h.cx, top], [h.cx + w * 0.6, top + 4], [h.cx + w * 1.05, h.crown + 4], [h.cx + w, hl + 2, 1]];
        const tex = texture(base.slice(1, -1), type, h.cx, h.crown + 10, 2.2);
        doc.region(smooth([base[0]!, ...tex, base[base.length - 1]!]), hair, { shift: [-2.5, -2.5], sw: 1.7 });
      };
      break;
    case 'trancas':
    case 'dreads': {
      const thick = st === 'dreads';
      const end = thick ? f.yChest - 2 : f.yChest + 18;
      plan.back = (doc) => doc.region(backPanel(h, 'liso', 4, end, 8), hair, { shift: [-3, -3], sw: 1.6 });
      plan.locks = (doc) => braids(doc, h, f, hair, thick, end);
      plan.front = (doc) => {
        cap(thick ? 4.2 : 3, 'straight', 1.64)(doc);
        // linhas das tranças na cabeça
        let marks = '';
        for (let i = -3; i <= 3; i++) {
          const a = headPt(h, (i * 0.22 + Math.PI * 2) % (Math.PI * 2), 1);
          marks += `M${n(lerp(h.cx, a[0], 0.85))} ${n(hairlineY(h, d, 'straight') + 1)}L${n(a[0])} ${n(a[1] + 2)}`;
        }
        doc.stroke(marks, hair.line, 0.8, 0.45);
      };
      break;
    }
  }
  return plan;
}

