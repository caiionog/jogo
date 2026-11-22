/**
 * Busto procedural low-poly (Fase A do avatar 3D, Etapa 7).
 * `buildBust(desc)` monta um THREE.Group a partir do AvatarDescriptor da engine — a UI não calcula aparência:
 * só traduz os números do descriptor em geometria. Usado pelo canvas ao vivo e pelas miniaturas.
 * Limite: ≤ 6 mil triângulos por busto (ver ASSETS.md; testado em tests/bust.test.ts).
 */
import * as THREE from 'three';
import type { AvatarDescriptor } from '../../engine';

export const MAX_TRIANGLES = 6000;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function mixHex(a: string, b: string, t: number): THREE.Color {
  return new THREE.Color(a).lerp(new THREE.Color(b), t);
}

/** Medidas do busto (exportadas para o enquadramento da câmera). */
export interface BustFrame {
  bottom: number;
  shoulderY: number;
  top: number;
}

interface Ctx {
  d: AvatarDescriptor;
  g: number;
  headR: number;
  headY: number;
  shoulderY: number;
  half: number;
  depth: number;
  eyeY: number;
  mats: Map<string, THREE.Material>;
}

function mat(ctx: Ctx, key: string, color: THREE.ColorRepresentation, opts: { rough?: number; opacity?: number; flat?: boolean; side?: THREE.Side } = {}): THREE.Material {
  const id = `${key}:${new THREE.Color(color).getHexString()}:${opts.rough ?? ''}:${opts.opacity ?? ''}:${opts.flat ?? ''}`;
  let m = ctx.mats.get(id);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.8,
      metalness: 0,
      flatShading: opts.flat ?? false,
      side: opts.side ?? THREE.FrontSide,
      ...(opts.opacity !== undefined ? { transparent: true, opacity: opts.opacity, depthWrite: false } : {}),
    });
    ctx.mats.set(id, m);
  }
  return m;
}

function mesh(geo: THREE.BufferGeometry, m: THREE.Material, pos?: [number, number, number], scale?: [number, number, number], rot?: [number, number, number]): THREE.Mesh {
  const x = new THREE.Mesh(geo, m);
  if (pos) x.position.set(...pos);
  if (scale) x.scale.set(...scale);
  if (rot) x.rotation.set(...rot);
  return x;
}

// ---------------------------------------------------------------------------
// cabeça
// ---------------------------------------------------------------------------

/** Escala base da cabeça (elipsoide): usada para posicionar os traços na superfície. */
const HEAD_S = { x: 0.86, y: 1.08, z: 0.95 };

/** z da superfície frontal da cabeça na posição (x, y) relativa ao centro (unidades absolutas). */
function surfaceZ(ctx: Ctx, x: number, y: number): number {
  const nx = x / (ctx.headR * HEAD_S.x);
  const ny = y / (ctx.headR * HEAD_S.y);
  return Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny)) * ctx.headR * HEAD_S.z;
}

function headGeometry(ctx: Ctx): THREE.BufferGeometry {
  const { d, g } = ctx;
  const geo = new THREE.SphereGeometry(1, 24, 18);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let { x, y, z } = v;
    x *= HEAD_S.x;
    y *= HEAD_S.y;
    z *= HEAD_S.z;
    switch (d.faceShape) {
      case 'redondo': x *= 1.06; y *= 0.97; break;
      case 'quadrado': if (v.y < -0.15) x *= 1 + 0.12 * Math.min(1, (-v.y - 0.15) * 2.5); break;
      case 'coracao': if (v.y > 0.2) x *= 1.04; if (v.y < -0.35) x *= 1 - 0.2 * (-v.y - 0.35); break;
      case 'longo': y *= 1.1; x *= 0.94; break;
      default: break;
    }
    // mandíbula afinando para o queixo (bebês: rosto mais cheio)
    if (v.y < 0) x *= 1 - 0.2 * g * v.y * v.y;
    // crânio maior no bebê (rosto baixo)
    if (v.y > 0) { const k = 1 + 0.1 * (1 - g) * v.y; x *= k; y *= k; z *= 1 + 0.06 * (1 - g) * v.y; }
    // bochechas: gordura e bebê
    if (v.y < 0.1 && v.y > -0.75 && v.z > 0) x *= 1 + (0.13 * d.fat + 0.06 * (1 - g)) * (1 - Math.abs(v.y + 0.3));
    // papada leve no idoso
    if (v.y < -0.4) x *= 1 + 0.05 * d.elder;
    p.setXYZ(i, x * ctx.headR, y * ctx.headR, z * ctx.headR);
  }
  geo.computeVertexNormals();
  return geo;
}

function lipColor(skin: string): THREE.Color {
  return mixHex(skin, '#a8434f', 0.38).multiplyScalar(0.88);
}

function addFace(ctx: Ctx, head: THREE.Group): void {
  const { d, g, headR: R } = ctx;
  const skinM = mat(ctx, 'skin', d.skin, { rough: 0.7 });
  const dark = new THREE.Color(d.skin).multiplyScalar(0.55);
  const eyeY = ctx.eyeY;
  const eyeX = R * 0.32;
  const eyeR = R * 0.12 * (1 + 0.25 * (1 - g));
  const shape = d.eyes.shape;
  const eyeScale: [number, number, number] = shape === 'alongado' ? [1.22, 0.78, 0.5] : shape === 'redondo' ? [1, 1.08, 0.5] : shape === 'palpebra_lisa' ? [1.15, 0.8, 0.5] : [1.1, 0.88, 0.5];
  const sclera = mat(ctx, 'sclera', '#f4f1ec', { rough: 0.4 });
  const iris = mat(ctx, 'iris', d.eyes.color, { rough: 0.3 });
  const pupil = mat(ctx, 'pupil', '#0d0b0a', { rough: 0.2 });
  const lidClosed = d.expression === 'cansado' ? 0.55 : d.expression === 'machucado' ? 0.25 : shape === 'palpebra_lisa' ? 0.32 : 0.12;
  for (const side of [-1, 1]) {
    const x = side * eyeX;
    const z = surfaceZ(ctx, x, eyeY) - eyeR * 0.28;
    const eye = new THREE.Group();
    eye.position.set(x, eyeY, z);
    eye.add(mesh(new THREE.SphereGeometry(eyeR, 12, 8), sclera, undefined, eyeScale));
    eye.add(mesh(new THREE.CircleGeometry(eyeR * 0.58, 12), iris, [0, 0, eyeR * 0.52]));
    eye.add(mesh(new THREE.CircleGeometry(eyeR * 0.28, 10), pupil, [0, 0, eyeR * 0.525]));
    // pálpebra superior (pele): cobre o topo do olho conforme o formato e o cansaço
    const lid = mesh(new THREE.SphereGeometry(eyeR * 1.08, 12, 6, 0, Math.PI * 2, 0, Math.PI * (0.18 + lidClosed * 0.5)), skinM, [0, 0, 0.002], eyeScale);
    eye.add(lid);
    if (d.marks.blackEye && side === -1) {
      eye.add(mesh(new THREE.CircleGeometry(eyeR * 1.6, 14), mat(ctx, 'bruise', '#4a2440', { opacity: 0.55 }), [0, -eyeR * 0.1, eyeR * 0.05], [1.2, 1, 1]));
    }
    head.add(eye);
    // sobrancelha
    const browY = eyeY + R * 0.2;
    const tilt = d.expression === 'triste' ? 0.28 : d.expression === 'machucado' ? -0.2 : d.expression === 'feliz' ? 0.06 : 0;
    const brow = mesh(new THREE.BoxGeometry(R * 0.27, R * 0.045 * (0.8 + 0.3 * g), R * 0.05), mat(ctx, 'brow', mixHex(d.hair.color, '#1a1410', 0.25), { rough: 0.95 }), [x, browY, surfaceZ(ctx, x, browY) + R * 0.005], undefined, [0, side * 0.15, side * tilt]);
    head.add(brow);
    // orelhas
    const earX = side * R * HEAD_S.x * 0.98;
    const cauli = d.marks.cauliflowerEar;
    const ear = mesh(cauli ? new THREE.IcosahedronGeometry(R * 0.17, 1) : new THREE.SphereGeometry(R * 0.17, 10, 8), cauli ? mat(ctx, 'skin_flat', d.skin, { rough: 0.7, flat: true }) : skinM, [earX, eyeY - R * 0.08, -R * 0.05], cauli ? [0.65, 0.92, 0.78] : [0.42, 1, 0.62], [0, side * 0.35, 0]);
    head.add(ear);
  }
  // nariz
  const noseY = eyeY - R * 0.27;
  const nw = 0.85 + 0.6 * d.noseWidth;
  const noseZ = surfaceZ(ctx, 0, noseY);
  const nose = new THREE.Group();
  nose.position.set(0, noseY, noseZ - R * 0.03);
  nose.add(mesh(new THREE.SphereGeometry(R * 0.09, 10, 8), skinM, [0, 0, R * 0.08], [nw, 0.85, 0.9]));
  nose.add(mesh(new THREE.BoxGeometry(R * 0.07, R * 0.28, R * 0.08), skinM, [0, R * 0.13, R * 0.04], undefined, [-0.35, 0, 0]));
  for (const s of [-1, 1]) nose.add(mesh(new THREE.SphereGeometry(R * 0.06, 8, 6), skinM, [s * R * 0.075 * nw, -R * 0.02, R * 0.03], [1, 0.8, 0.8]));
  if (d.marks.brokenNose) { nose.rotation.z = 0.14; nose.position.x += R * 0.02; }
  head.add(nose);
  // boca: curva entre os cantos; sorriso = cantos acima do centro
  const mouthY = noseY - R * 0.24;
  const curve = d.expression === 'feliz' ? -0.07 : d.expression === 'triste' ? 0.06 : d.expression === 'machucado' ? 0.03 : 0;
  const w = R * 0.21 * (1 + 0.1 * d.fat);
  const mz = surfaceZ(ctx, 0, mouthY) + R * 0.01 + (d.facialHair === 'barba' ? R * 0.05 : 0);
  const sideZ = surfaceZ(ctx, w, mouthY) + R * 0.01 + (d.facialHair === 'barba' ? R * 0.05 : 0);
  const lips = mat(ctx, 'lips', lipColor(d.skin), { rough: 0.55 });
  const lip = (dy: number, thick: number) => {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-w, mouthY + dy, sideZ - R * 0.02), new THREE.Vector3(0, mouthY + dy + curve * R * 2, mz + R * 0.015), new THREE.Vector3(w, mouthY + dy, sideZ - R * 0.02));
    return new THREE.Mesh(new THREE.TubeGeometry(c, 10, thick, 6, false), lips);
  };
  const lv = d.lipVolume;
  head.add(lip(R * 0.025, R * (0.018 + 0.022 * lv)));
  head.add(lip(-R * 0.03, R * (0.024 + 0.032 * lv)));
  // rugas: linhas na testa e sulcos nasolabiais
  if (d.wrinkles > 0.08) {
    const wm = mat(ctx, 'wrinkle', dark, { opacity: clamp01(d.wrinkles) * 0.55 });
    for (let i = 0; i < 3; i++) {
      const y = eyeY + R * (0.36 + i * 0.09);
      const z = surfaceZ(ctx, 0, y);
      const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-R * 0.24, y, surfaceZ(ctx, R * 0.24, y) + R * 0.004), new THREE.Vector3(0, y + R * 0.015, z + R * 0.006), new THREE.Vector3(R * 0.24, y, surfaceZ(ctx, R * 0.24, y) + R * 0.004));
      head.add(new THREE.Mesh(new THREE.TubeGeometry(c, 8, R * 0.007, 3, false), wm));
    }
    if (d.wrinkles > 0.35) {
      for (const s of [-1, 1]) {
        const a = new THREE.Vector3(s * R * 0.14, noseY + R * 0.02, surfaceZ(ctx, R * 0.14, noseY) + R * 0.004);
        const b = new THREE.Vector3(s * R * 0.25, mouthY - R * 0.06, surfaceZ(ctx, R * 0.25, mouthY) + R * 0.004);
        const m = a.clone().lerp(b, 0.5).add(new THREE.Vector3(s * R * 0.03, 0, R * 0.01));
        head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, m, b), 6, R * 0.008, 3, false), wm));
      }
    }
  }
  // cicatriz no supercílio
  if (d.marks.scar) {
    const x = R * 0.36;
    const a = new THREE.Vector3(x - R * 0.04, eyeY + R * 0.32, surfaceZ(ctx, x, eyeY + R * 0.32) + R * 0.008);
    const b = new THREE.Vector3(x + R * 0.03, eyeY + R * 0.12, surfaceZ(ctx, x, eyeY + R * 0.12) + R * 0.012);
    head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, R * 0.012, 4, false), mat(ctx, 'scar', mixHex(d.skin, '#f2c7c0', 0.5), { rough: 0.4 })));
  }
  // papada
  if (d.fat > 0.6 && g > 0.8) head.add(mesh(new THREE.SphereGeometry(R * 0.32, 12, 8), skinM, [0, -R * 0.82, R * 0.28], [1.1, 0.45, 0.7]));
}

// ---------------------------------------------------------------------------
// cabelo e pelos do rosto
// ---------------------------------------------------------------------------

function displace(geo: THREE.BufferGeometry, amp: number, freq: number): THREE.BufferGeometry {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const len = v.length();
    const k = 1 + amp * Math.sin(v.x * freq / len + 1.3) * Math.sin(v.y * freq * 0.8 / len) * Math.cos(v.z * freq / len);
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

function addHair(ctx: Ctx, head: THREE.Group): void {
  const { d, headR: R } = ctx;
  const hair = d.hair;
  const bald = clamp01(hair.baldness);
  if (bald > 0.97) return;
  const raspado = hair.style === 'raspado' || d.age < 1;
  const color = raspado ? mixHex(hair.color, d.skin, 0.45) : new THREE.Color(hair.color);
  const m = mat(ctx, 'hair', color, { rough: 0.92, side: THREE.DoubleSide });
  const type = hair.type;
  const thick0 = raspado ? 1.015 : type === 'liso' ? 1.04 : type === 'ondulado' ? 1.055 : type === 'cacheado' ? 1.07 : 1.09;
  // o crânio do bebê é maior (ver headGeometry): a calota acompanha
  const thick = thick0 + 0.11 * (1 - ctx.g);
  const sc: [number, number, number] = [HEAD_S.x * R * thick, HEAD_S.y * R * thick, HEAD_S.z * R * thick];
  const crown = bald * Math.PI * 0.3;
  // calota (topo + franja curta); a calvície abre o topo
  const front = Math.PI * (raspado ? 0.36 : 0.4) - crown * 0.3;
  let cap = new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, crown, Math.max(0.05, front - crown));
  if (!raspado && (type === 'ondulado' || type === 'crespo')) cap = displace(cap, type === 'crespo' ? 0.035 : 0.025, type === 'crespo' ? 26 : 9) as THREE.SphereGeometry;
  head.add(mesh(cap, m, [0, R * 0.02, -R * 0.02], sc));
  // nuca e laterais (metade de trás)
  const backLen = raspado || hair.style === 'curto' ? 0.24 : hair.style === 'medio' ? 0.4 : 0.36;
  let back = new THREE.SphereGeometry(1, 20, 8, Math.PI * 0.92, Math.PI * 1.16, Math.max(crown, front - 0.05), Math.PI * backLen);
  if (!raspado && (type === 'ondulado' || type === 'crespo')) back = displace(back, 0.03, type === 'crespo' ? 26 : 9) as THREE.SphereGeometry;
  head.add(mesh(back, m, [0, R * 0.02, -R * 0.02], sc));
  if (raspado) return;

  // volume por tipo e estilo
  const long = hair.style === 'longo';
  if (type === 'crespo' && (hair.style === 'medio' || long)) {
    // black power: volume aberto na frente para não cobrir o rosto
    const r = R * (long ? 1.5 : 1.3);
    const afro = displace(new THREE.SphereGeometry(1, 18, 12, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI * 0.62), 0.04, 22);
    head.add(mesh(afro, m, [0, R * 0.22, -R * 0.12], [r, r * 0.95, r]));
  } else if (type === 'cacheado') {
    const n = hair.style === 'curto' ? 26 : long ? 64 : 44;
    const curl = new THREE.IcosahedronGeometry(R * 0.13, 0);
    const curlM = mat(ctx, 'curl', color, { rough: 0.9, flat: true });
    const maxTheta = long ? 0.92 : hair.style === 'medio' ? 0.7 : 0.5;
    for (let i = 0; i < n; i++) {
      // pontos de Fibonacci na calota, evitando a testa
      const t = (i + 0.5) / n;
      const theta = Math.acos(1 - t * (1 - Math.cos(Math.PI * maxTheta)));
      const phi = i * 2.39996;
      const x = Math.sin(theta) * Math.cos(phi);
      const z = Math.sin(theta) * Math.sin(phi);
      const y = Math.cos(theta);
      if (z > 0.35 && y < 0.55) continue; // rosto livre
      if (theta < crown) continue;
      const k = long && y < 0 ? 1.12 : 1.06;
      head.add(mesh(curl, curlM, [x * sc[0] * k, y * sc[1] * k + R * 0.02, z * sc[2] * k - R * 0.02], undefined, [phi, theta, 0]));
    }
  }
  if (long && type !== 'crespo') {
    // cabelo comprido caindo atrás até os ombros
    const len = ctx.headY - ctx.shoulderY + R * 0.5;
    const flare = type === 'cacheado' ? 1.35 : type === 'ondulado' ? 1.18 : 1.05;
    const panel = new THREE.CylinderGeometry(R * 0.9, R * 0.9 * flare, len, 18, 3, true, Math.PI * 0.55, Math.PI * 0.9);
    const g2 = type === 'ondulado' ? displace(panel, 0.04, 12) : panel;
    head.add(mesh(g2, m, [0, -len / 2 + R * 0.25, -R * 0.12], [1, 1, 0.85]));
  }
  if (hair.style === 'preso') head.add(mesh(new THREE.SphereGeometry(R * 0.24, 12, 10), m, [0, R * 0.55, -R * 0.82]));
  if (hair.style === 'medio' && (type === 'liso' || type === 'ondulado')) {
    // laterais até a altura do queixo
    for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(R * 0.3, 10, 8), m, [s * R * 0.78, -R * 0.12, -R * 0.12], [0.35, 1.25, 0.8]));
  }
}

function addFacialHair(ctx: Ctx, head: THREE.Group): void {
  const { d, headR: R } = ctx;
  if (d.facialHair === 'nenhuma' || ctx.g < 0.75) return;
  const color = mixHex(d.hair.color, '#2a2018', d.hair.grey > 0.5 ? 0 : 0.2);
  const m = mat(ctx, 'beard', color, { rough: 0.95 });
  const noseY = ctx.eyeY - R * 0.27;
  const mouthY = noseY - R * 0.24;
  if (d.facialHair === 'barba') {
    // casca na parte de baixo do rosto
    const shell = new THREE.SphereGeometry(1, 20, 8, 0, Math.PI, Math.PI * 0.56, Math.PI * 0.4);
    head.add(mesh(displace(shell, 0.02, 30), m, [0, 0, 0], [HEAD_S.x * R * 1.04, HEAD_S.y * R * 1.04, HEAD_S.z * R * 1.07]));
  }
  if (d.facialHair === 'cavanhaque') {
    head.add(mesh(new THREE.SphereGeometry(R * 0.11, 10, 8), m, [0, mouthY - R * 0.17, surfaceZ(ctx, 0, mouthY - R * 0.17) - R * 0.02], [1, 1.1, 0.55]));
  }
  // bigode (também na barba e no cavanhaque)
  head.add(mesh(new THREE.CapsuleGeometry(R * 0.035, R * 0.26, 3, 8), m, [0, mouthY + R * 0.075, surfaceZ(ctx, 0, mouthY + R * 0.075) + R * (d.facialHair === 'barba' ? 0.05 : 0.012)], [1, 1, 0.7], [0, 0, Math.PI / 2]));
}

// ---------------------------------------------------------------------------
// tronco e roupa
// ---------------------------------------------------------------------------

function addTorso(ctx: Ctx, root: THREE.Group): void {
  const { d, g, half, depth, shoulderY } = ctx;
  const o = d.outfit;
  const glossy = o.mesh === 'roupao' || o.mesh === 'festa' || o.mesh === 'rashguard';
  const cloth = mat(ctx, 'cloth', o.color, { rough: glossy ? 0.38 : 0.85 });
  const skinM = mat(ctx, 'skin', d.skin, { rough: 0.7 });
  const bulky = o.mesh === 'moletom' || o.mesh === 'roupao' || o.mesh === 'jaqueta' ? 1.05 : 1;
  // perfil do tronco (cintura → peito → ombro → pescoço), girado e achatado na profundidade
  const neckR = ctx.headR * (0.36 + 0.22 * d.muscle + 0.08 * d.fat) / half;
  const waist = (0.76 + 0.32 * d.fat - 0.16 * d.muscle) * (d.sex === 'F' ? 0.9 : 1);
  const chest = 0.9 + 0.08 * d.muscle + 0.1 * d.fat;
  const pts = [
    new THREE.Vector2(waist * 1.04, 0),
    new THREE.Vector2(waist * (1 + 0.08 * d.fat), 0.28),
    new THREE.Vector2(chest, 0.6),
    new THREE.Vector2(0.97, 0.78),
    new THREE.Vector2(0.9, 0.87),
    new THREE.Vector2(0.72, 0.94 + 0.04 * d.muscle),
    new THREE.Vector2(0.45, 0.985 + 0.05 * d.muscle),
    new THREE.Vector2(neckR * 1.15, 1.0),
  ].map((p) => new THREE.Vector2(p.x, p.y * shoulderY));
  const torso = new THREE.LatheGeometry(pts, 24);
  root.add(mesh(torso, cloth, [0, 0, 0], [half * bulky, 1, half * depth * bulky]));
  // ombros (deltoides): pele nas regatas/vestidos
  const bare = o.mesh === 'regata' || o.mesh === 'vestido' || o.mesh === 'festa';
  const delt = (0.12 + 0.1 * d.muscle + 0.03 * d.fat) * lerp(0.6, 1, g);
  for (const s of [-1, 1]) {
    root.add(mesh(new THREE.SphereGeometry(delt, 12, 8), bare ? skinM : cloth, [s * (half * 0.95 * bulky - delt * 0.75), shoulderY * 0.8, 0], [1, 1, depth * 1.5]));
    if (bare && o.mesh !== 'regata') root.add(mesh(new THREE.BoxGeometry(half * 0.07, shoulderY * 0.2, half * 0.06), cloth, [s * half * 0.45, shoulderY * 0.92, half * depth * 0.62], undefined, [0.25, 0, 0]));
  }
  // peito (mulheres adultas, discreto)
  if (d.sex === 'F' && g > 0.75) {
    const k = (g - 0.75) * 4;
    for (const s of [-1, 1]) root.add(mesh(new THREE.SphereGeometry(half * 0.24, 12, 8), cloth, [s * half * 0.3, shoulderY * 0.64, half * depth * 0.62], [1.1, 0.75, 0.38 * k + 0.05]));
  }
  // pescoço
  const neckLen = ctx.headY - shoulderY - ctx.headR * 0.55;
  root.add(mesh(new THREE.CylinderGeometry(neckR * half, neckR * half * 1.1, neckLen + ctx.headR * 0.4, 14), skinM, [0, shoulderY + neckLen / 2, -ctx.headR * 0.05]));
  const frontZ = (y: number) => half * depth * bulky * (y < shoulderY * 0.62 ? waist + (chest - waist) * (y / (shoulderY * 0.62)) : chest) * 0.98;

  // decote em V (pele) e detalhes de cada peça
  const vNeck = (depthV: number, width: number, color: THREE.Material) => {
    const top = shoulderY * 0.99;
    const shape = new THREE.Shape();
    shape.moveTo(-half * width, 0);
    shape.lineTo(half * width, 0);
    shape.lineTo(0, -shoulderY * depthV);
    shape.closePath();
    const v = mesh(new THREE.ShapeGeometry(shape), color, [0, top, frontZ(top - shoulderY * depthV * 0.5) * 0.93 + 0.01], undefined, [-0.42, 0, 0]);
    root.add(v);
  };
  const accent = mat(ctx, 'accent', mixHex(o.color, '#000000', 0.35), { rough: 0.8 });
  switch (o.mesh) {
    case 'regata':
      vNeck(0.18, 0.32, skinM);
      break;
    case 'vestido':
    case 'festa':
    case 'blusa':
      vNeck(o.mesh === 'blusa' ? 0.12 : 0.2, 0.36, skinM);
      break;
    case 'kimono':
    case 'roupao': {
      vNeck(0.42, 0.24, o.mesh === 'kimono' ? skinM : mat(ctx, 'cloth2', mixHex(o.color, '#ffffff', 0.15), { rough: 0.4 }));
      // lapelas
      const lap = o.mesh === 'kimono' ? mat(ctx, 'lapel', mixHex(o.color, '#9ca3af', 0.18), { rough: 0.9 }) : accent;
      for (const s of [-1, 1]) root.add(mesh(new THREE.BoxGeometry(half * 0.13, shoulderY * 0.5, half * 0.04), lap, [s * half * 0.13, shoulderY * 0.75, frontZ(shoulderY * 0.75) + 0.005], undefined, [-0.2, 0, s * 0.42]));
      // faixa (estilizada na altura da barriga, dentro do enquadramento)
      const w28 = waist * (1 + 0.08 * d.fat);
      const beltR = w28 + (chest - w28) * (0.12 / 0.32);
      if (o.mesh === 'kimono' && o.beltColor) {
        root.add(mesh(new THREE.CylinderGeometry(half * beltR * 1.04, half * beltR * 1.05, shoulderY * 0.09, 24, 1, true), mat(ctx, 'belt', o.beltColor, { rough: 0.7, side: THREE.DoubleSide }), [0, shoulderY * 0.4, 0], [1, 1, depth * 1.01]));
      }
      break;
    }
    case 'terno': {
      vNeck(0.45, 0.22, mat(ctx, 'shirt', '#f8fafc', { rough: 0.6 }));
      root.add(mesh(new THREE.BoxGeometry(half * 0.06, shoulderY * 0.36, half * 0.02), mat(ctx, 'tie', '#7f1d1d', { rough: 0.5 }), [0, shoulderY * 0.78, frontZ(shoulderY * 0.78) + 0.012], undefined, [-0.32, 0, 0]));
      break;
    }
    case 'social':
    case 'polo':
    case 'uniforme': {
      const collarM = o.mesh === 'uniforme' ? mat(ctx, 'trim', '#1d4ed8', { rough: 0.8 }) : accent;
      for (const s of [-1, 1]) root.add(mesh(new THREE.BoxGeometry(half * 0.2, shoulderY * 0.07, half * 0.05), collarM, [s * half * 0.13, shoulderY * 0.985, frontZ(shoulderY) * 0.6], undefined, [-0.6, s * 0.5, s * -0.35]));
      if (o.mesh === 'uniforme') root.add(mesh(new THREE.CircleGeometry(half * 0.07, 10), collarM, [half * 0.35, shoulderY * 0.75, frontZ(shoulderY * 0.75) + 0.004], undefined, [-0.15, 0.3, 0]));
      if (o.mesh === 'social') for (let i = 0; i < 3; i++) root.add(mesh(new THREE.CircleGeometry(half * 0.015, 6), accent, [0, shoulderY * (0.88 - i * 0.14), frontZ(shoulderY * (0.88 - i * 0.14)) + 0.004]));
      break;
    }
    case 'moletom':
      root.add(mesh(new THREE.TorusGeometry(neckR * half * 1.7, half * 0.09, 6, 16), cloth, [0, shoulderY * 1.0, -half * depth * 0.35], [1, 1, 0.8], [Math.PI / 2 + 0.5, 0, 0]));
      break;
    case 'jaqueta':
      root.add(mesh(new THREE.BoxGeometry(half * 0.02, shoulderY * 0.85, half * 0.01), accent, [0, shoulderY * 0.45, frontZ(shoulderY * 0.45) + 0.004]));
      root.add(mesh(new THREE.TorusGeometry(neckR * half * 1.3, half * 0.05, 5, 16), accent, [0, shoulderY * 1.0, 0], [1, 1, depth * 1.6], [Math.PI / 2, 0, 0]));
      break;
    case 'rashguard':
      root.add(mesh(new THREE.CylinderGeometry(half * chest * 1.005, half * chest * 1.005, shoulderY * 0.06, 24, 1, true), mat(ctx, 'stripe', '#e5e7eb', { rough: 0.4, side: THREE.DoubleSide }), [0, shoulderY * 0.62, 0], [1, 1, depth]));
      break;
    case 'body':
      for (let i = 0; i < 2; i++) root.add(mesh(new THREE.CircleGeometry(half * 0.03, 8), mat(ctx, 'snap', '#f8fafc', { rough: 0.3 }), [half * (i ? 0.1 : -0.1), shoulderY * 0.9, frontZ(shoulderY * 0.9) * 0.9]));
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------

/** Monta o busto. Chame `disposeBust` ao trocar (geometrias e materiais). */
export function buildBust(d: AvatarDescriptor): THREE.Group {
  const g = clamp01(d.growth);
  const headR = lerp(0.34, 0.29, g);
  const shoulderY = lerp(0.48, 0.86, g) - 0.03 * d.elder;
  const neck = lerp(0.03, 0.14, g);
  const ctx: Ctx = {
    d,
    g,
    headR,
    shoulderY,
    headY: shoulderY + neck + headR * 0.92,
    half: lerp(0.3, 0.55, g) * (1 + 0.24 * d.muscle + 0.16 * d.fat) * (d.sex === 'F' ? 0.92 : 1),
    depth: 0.52 + 0.22 * d.fat + 0.05 * d.muscle,
    eyeY: headR * lerp(-0.1, 0.04, g),
    mats: new Map(),
  };
  const root = new THREE.Group();
  root.name = 'bust';
  addTorso(ctx, root);
  const head = new THREE.Group();
  head.position.set(0, ctx.headY, 0.04 * d.elder);
  head.rotation.x = 0.06 * d.elder - (d.expression === 'triste' ? 0.06 : 0);
  head.add(new THREE.Mesh(headGeometry(ctx), mat(ctx, 'skin', d.skin, { rough: 0.7 })));
  addFace(ctx, head);
  addHair(ctx, head);
  addFacialHair(ctx, head);
  root.add(head);
  const top = ctx.headY + headR * (d.hair.type === 'crespo' && d.hair.style !== 'curto' ? 1.45 : 1.15);
  root.userData.frame = { bottom: shoulderY * 0.32, shoulderY, top } satisfies BustFrame;
  return root;
}

export function bustFrame(group: THREE.Object3D): BustFrame {
  return (group.userData.frame as BustFrame | undefined) ?? { bottom: 0.3, shoulderY: 0.86, top: 1.7 };
}

export function disposeBust(group: THREE.Object3D): void {
  const mats = new Set<THREE.Material>();
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
    }
  });
  mats.forEach((m) => m.dispose());
}

export function countTriangles(group: THREE.Object3D): number {
  let n = 0;
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const geo = o.geometry as THREE.BufferGeometry;
      n += (geo.index ? geo.index.count : geo.attributes.position!.count) / 3;
    }
  });
  return Math.round(n);
}

/** Luzes padrão (as mesmas no canvas ao vivo e nas miniaturas). */
export function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight('#fff7ed', '#334155', 1.4));
  const key = new THREE.DirectionalLight('#ffffff', 2.0);
  key.position.set(1.5, 2.5, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#93c5fd', 0.8);
  rim.position.set(-2, 1.5, -2);
  scene.add(rim);
}

/** Câmera enquadrando o busto (fov vertical em graus). */
export function frameCamera(camera: THREE.PerspectiveCamera, frame: BustFrame, margin = 1.12, tight = false): void {
  const bottom = tight ? frame.shoulderY * 0.62 : frame.bottom;
  const height = frame.top - bottom;
  const centerY = (frame.top + bottom) / 2;
  const dist = (height * margin) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.set(0, centerY + height * 0.16, dist);
  camera.lookAt(0, centerY, 0);
  camera.updateProjectionMatrix();
}

export function frameCenter(f: BustFrame): number {
  return (f.top + f.bottom) / 2;
}
