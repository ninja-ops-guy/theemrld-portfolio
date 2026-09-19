import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import KBandStage from './KBandStage';
import { K_ZONE_LABELS, K_ZONE_PLAYLISTS, type KAudioTrack, type KAudioZone } from '../data/kAudioZones';

interface Track {
  id: number;
  url: string;
  title: string;
  duration: number;
  plays: number;
}

interface TerminalLine {
  text: string;
  className?: string;
}

const bootMessages = [
  'BIOS DATE 04/08/26 14:22:55 VER 1.0.2',
  'CPU: NEURAL-NET PROCESSOR TYPE A-1',
  '640K RAM SYSTEM... OK',
  'SOUNDCLOUD API MODULE... DETECTED',
  'INITIALIZING AUDIO SUBSYSTEM...',
  'Loading @raikouno profile...',
  'MOUNTING VIRTUAL FILESYSTEM...',
  'ESTABLISHING SECURE CONNECTION...',
  'TARGET: soundcloud.com/raikouno',
  'SYSTEM READY.',
];

// Sorted by SoundCloud play count (most popular first) — from raikouno/popular-tracks
const defaultTracks: Track[] = [
  { id: 1, url: 'https://soundcloud.com/raikouno/real', title: "Real (I'm trying to articulate)", duration: 0, plays: 46111 },
  { id: 2, url: 'https://soundcloud.com/raikouno/two-cups', title: 'Two cups', duration: 0, plays: 9639 },
  { id: 3, url: 'https://soundcloud.com/raikouno/3-valentines-2-mp3', title: '3 valentines', duration: 0, plays: 3117 },
  { id: 4, url: 'https://soundcloud.com/raikouno/when-its-all-done-minor-1', title: "When It's All Done (Minor Dream Mix)", duration: 0, plays: 1186 },
  { id: 5, url: 'https://soundcloud.com/raikouno/waiting-patience-ay-mp3', title: 'waiting-patience-ay', duration: 0, plays: 334 },
  { id: 6, url: 'https://soundcloud.com/raikouno/hot-sauce-mp3', title: 'Hot sauce', duration: 0, plays: 272 },
  { id: 7, url: 'https://soundcloud.com/raikouno/ghost-town', title: 'Ghost town', duration: 0, plays: 250 },
  { id: 8, url: 'https://soundcloud.com/raikouno/motorcell-mp3', title: 'MOTORCELL', duration: 0, plays: 234 },
  { id: 9, url: 'https://soundcloud.com/raikouno/see-right-thru-3', title: 'See right thru 3', duration: 0, plays: 222 },
  { id: 10, url: 'https://soundcloud.com/raikouno/flow-mp3', title: 'My Master Hacker', duration: 0, plays: 220 },
  { id: 11, url: 'https://soundcloud.com/raikouno/black', title: 'BLACK', duration: 0, plays: 212 },
  { id: 12, url: 'https://soundcloud.com/raikouno/heavy-wav', title: 'Heavy', duration: 0, plays: 204 },
  { id: 13, url: 'https://soundcloud.com/raikouno/when-its-all-done', title: "When It's All Done", duration: 0, plays: 199 },
  { id: 14, url: 'https://soundcloud.com/raikouno/wake-up-and-die-ft-oz', title: 'Wake up and die B ft OZ', duration: 0, plays: 199 },
  { id: 15, url: 'https://soundcloud.com/raikouno/will-i-be-there', title: 'will-i-be-there', duration: 0, plays: 197 },
  { id: 16, url: 'https://soundcloud.com/raikouno/i-was-a-dreamer-once-too-mp3', title: 'I was a dreamer too, you know', duration: 0, plays: 183 },
  { id: 17, url: 'https://soundcloud.com/raikouno/when-its-all-done-minor-dream', title: "When It's All Done (Minor Dream Mix) 2", duration: 0, plays: 182 },
  { id: 18, url: 'https://soundcloud.com/raikouno/floor-mp3', title: 'Temporal pressure', duration: 0, plays: 179 },
  { id: 19, url: 'https://soundcloud.com/raikouno/two-horses', title: 'Urim and Thummim', duration: 0, plays: 176 },
  { id: 20, url: 'https://soundcloud.com/raikouno/black-bside', title: 'BLACK BSIDE', duration: 0, plays: 174 },
];


const ASCII_LIGHT = ' .·:░▒▓█';

type V3 = [number, number, number];

function rotate3([x, y, z]: V3, ax: number, ay: number, az: number): V3 {
  const cx = Math.cos(ax), sx = Math.sin(ax);
  const cy = Math.cos(ay), sy = Math.sin(ay);
  const cz = Math.cos(az), sz = Math.sin(az);
  const y1 = y * cx - z * sx;
  const z1 = y * sx + z * cx;
  const x2 = x * cy + z1 * sy;
  const z2 = -x * sy + z1 * cy;
  return [x2 * cz - y1 * sz, x2 * sz + y1 * cz, z2];
}

function asciiBuffer(width: number, height: number) {
  const chars = Array.from({ length: height }, () => Array(width).fill(' '));
  const depth = Array.from({ length: height }, () => Array(width).fill(-Infinity));
  return { chars, depth };
}


function renderIdleHashFrame(tick: number): string {
  const width = 31, height = 11;
  const rows: string[] = [];
  let seed = (tick + 1) * 2654435761 >>> 0;
  const next = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return seed >>> 0;
  };
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const r = next() % 23;
      row += r < 5 ? '#' : r < 11 ? String((next() >>> 3) & 1) : ' ';
    }
    rows.push(row.replace(/\s+$/, ''));
  }
  return rows.join('\n');
}

function renderTainoFrame(tick: number): string {
  const width = 31, height = 15;
  const { chars, depth } = asciiBuffer(width, height);
  const ay = tick * (Math.PI * 2 / 96);
  const ax = -0.18 + Math.sin(tick * 0.031) * 0.12;
  const az = Math.sin(tick * 0.024) * 0.08;
  const light: V3 = [-0.35, -0.35, 0.86];

  const putPoint = (p0: V3, ch = '█') => {
    const p = rotate3(p0, ax, ay, az);
    const camera = 4.8 - p[2];
    if (camera <= 0.2) return;
    const k = 1 / camera;
    const sx = Math.round(width / 2 + p[0] * 31 * k);
    const sy = Math.round(height / 2 + p[1] * 17 * k);
    if (sx < 0 || sx >= width || sy < 0 || sy >= height || p[2] <= depth[sy][sx]) return;
    depth[sy][sx] = p[2];
    chars[sy][sx] = ch;
  };

  const shadedPoint = (p0: V3, normal0: V3) => {
    const p = rotate3(p0, ax, ay, az);
    const n = rotate3(normal0, ax, ay, az);
    const camera = 4.8 - p[2];
    if (camera <= 0.2) return;
    const k = 1 / camera;
    const sx = Math.round(width / 2 + p[0] * 31 * k);
    const sy = Math.round(height / 2 + p[1] * 17 * k);
    if (sx < 0 || sx >= width || sy < 0 || sy >= height || p[2] <= depth[sy][sx]) return;
    const lum = n[0] * light[0] + n[1] * light[1] + n[2] * light[2];
    const idx = Math.max(2, Math.min(ASCII_LIGHT.length - 1, Math.round(((lum + 1) / 2) * (ASCII_LIGHT.length - 1))));
    depth[sy][sx] = p[2];
    chars[sy][sx] = ASCII_LIGHT[idx];
  };

  // A stylized Taíno sun / petroglyph-inspired relief: central face, circular brow,
  // spiral cheek marks, mouth and radial rays extruded into a shallow 3D tablet.
  for (let a = 0; a < Math.PI * 2; a += 0.055) {
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let z = -0.12; z <= 0.12; z += 0.12) {
      shadedPoint([1.0 * ca, 1.0 * sa, z], [ca, sa, 0.35]);
    }
  }

  for (let r = 1.24, i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    const ux = Math.cos(a), uy = Math.sin(a);
    for (let t = 0; t <= 1; t += 0.08) {
      const rr = r + t * 0.48;
      putPoint([rr * ux, rr * uy, 0.02 + 0.06 * Math.sin(t * Math.PI)], t > 0.75 ? '◆' : '▓');
    }
  }

  const facial = [
    [-0.42, -0.22], [0.42, -0.22], // eyes
    [-0.18, 0.34], [0, 0.42], [0.18, 0.34], // mouth
    [0, 0.02], [0, 0.12], // nose
  ] as [number, number][];
  facial.forEach(([x, y], i) => putPoint([x, y, 0.22], i < 2 ? '◉' : i < 5 ? '▄' : '│'));

  for (const side of [-1, 1]) {
    for (let a = 0; a < Math.PI * 1.65; a += 0.13) {
      const rr = 0.12 + a * 0.075;
      const x = side * (0.50 + rr * Math.cos(a));
      const y = 0.12 + rr * Math.sin(a);
      putPoint([x, y, 0.18], a > 3.2 ? '░' : '▒');
    }
  }

  // Brow / crown bridge to make the face read even at narrow angles.
  for (let x = -0.62; x <= 0.62; x += 0.06) {
    putPoint([x, -0.48 - 0.08 * Math.cos(x * Math.PI / 0.62), 0.20], '▓');
  }

  return chars.map((row) => row.join('').replace(/\s+$/, '')).join('\n');
}


function renderMoonFrame(tick: number): string {
  const width = 31, height = 15;
  const { chars, depth } = asciiBuffer(width, height);
  const ay = tick * (Math.PI * 2 / 112);
  const ax = -0.12;
  const light: V3 = [-0.55, -0.34, 0.76];

  const craters = [
    { lon: -0.9, lat: -0.28, r: 0.28 },
    { lon: 0.45, lat: 0.18, r: 0.22 },
    { lon: 1.35, lat: -0.10, r: 0.18 },
    { lon: -2.05, lat: 0.36, r: 0.17 },
    { lon: 2.55, lat: -0.42, r: 0.14 },
  ];

  for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += 0.065) {
    for (let lon = 0; lon < Math.PI * 2; lon += 0.07) {
      const cl = Math.cos(lat);
      const base: V3 = [cl * Math.cos(lon), Math.sin(lat), cl * Math.sin(lon)];
      const p = rotate3(base, ax, ay, 0);
      const n = rotate3(base, ax, ay, 0);
      const camera = 4.5 - p[2];
      if (camera <= 0.2) continue;
      const k = 1 / camera;
      const sx = Math.round(width / 2 + p[0] * 31 * k);
      const sy = Math.round(height / 2 + p[1] * 17 * k);
      if (sx < 0 || sx >= width || sy < 0 || sy >= height || p[2] <= depth[sy][sx]) continue;

      let crater = 0;
      for (const cc of craters) {
        let dl = Math.abs(lon - cc.lon);
        dl = Math.min(dl, Math.PI * 2 - dl);
        const d = Math.hypot(dl * Math.cos(lat), lat - cc.lat);
        if (d < cc.r) crater = Math.max(crater, 1 - d / cc.r);
      }

      const lum = n[0] * light[0] + n[1] * light[1] + n[2] * light[2] - crater * 0.58;
      const idx = Math.max(1, Math.min(ASCII_LIGHT.length - 1, Math.round(((lum + 1) / 2) * (ASCII_LIGHT.length - 1))));
      depth[sy][sx] = p[2];
      chars[sy][sx] = crater > 0.58 ? '·' : ASCII_LIGHT[idx];
    }
  }

  return chars.map((row) => row.join('').replace(/\s+$/, '')).join('\n');
}

function renderRocketFrame(tick: number): string {
  const width = 31, height = 15;
  const { chars, depth } = asciiBuffer(width, height);
  const ay = tick * (Math.PI * 2 / 80);
  const ax = -0.32 + Math.sin(tick * 0.035) * 0.12;
  const az = 0.12 + Math.sin(tick * 0.04) * 0.08;
  const light: V3 = [-0.22, -0.40, 0.89];

  const project = (p0: V3, n0: V3, force?: string) => {
    const p = rotate3(p0, ax, ay, az);
    const n = rotate3(n0, ax, ay, az);
    const camera = 5.0 - p[2];
    if (camera <= 0.2) return;
    const k = 1 / camera;
    const sx = Math.round(width / 2 + p[0] * 30 * k);
    const sy = Math.round(height / 2 + p[1] * 16 * k);
    if (sx < 0 || sx >= width || sy < 0 || sy >= height || p[2] <= depth[sy][sx]) return;
    const lum = n[0] * light[0] + n[1] * light[1] + n[2] * light[2];
    const idx = Math.max(2, Math.min(ASCII_LIGHT.length - 1, Math.round(((lum + 1) / 2) * (ASCII_LIGHT.length - 1))));
    depth[sy][sx] = p[2];
    chars[sy][sx] = force || ASCII_LIGHT[idx];
  };

  // Cylindrical fuselage.
  for (let y = -0.82; y <= 0.92; y += 0.08) {
    for (let a = 0; a < Math.PI * 2; a += 0.10) {
      const r = 0.40;
      project([r * Math.cos(a), y, r * Math.sin(a)], [Math.cos(a), 0, Math.sin(a)]);
    }
  }

  // Conical nose.
  for (let y = -1.52; y < -0.82; y += 0.07) {
    const t = (y + 1.52) / 0.70;
    const r = 0.40 * t;
    for (let a = 0; a < Math.PI * 2; a += 0.12) {
      project([r * Math.cos(a), y, r * Math.sin(a)], [Math.cos(a), -0.35, Math.sin(a)], y < -1.40 ? '▲' : undefined);
    }
  }

  // Engine bell.
  for (let y = 0.92; y <= 1.25; y += 0.07) {
    const t = (y - 0.92) / 0.33;
    const r = 0.30 + t * 0.22;
    for (let a = 0; a < Math.PI * 2; a += 0.11) {
      project([r * Math.cos(a), y, r * Math.sin(a)], [Math.cos(a), 0.18, Math.sin(a)], y > 1.18 ? '▓' : undefined);
    }
  }

  // Four fins.
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const ux = Math.cos(a), uz = Math.sin(a);
    for (let y = 0.48; y <= 1.12; y += 0.08) {
      const t = (y - 0.48) / 0.64;
      for (let r = 0.42; r <= 0.42 + t * 0.65; r += 0.07) {
        project([ux * r, y, uz * r], [ux, 0, uz], '◆');
      }
    }
  }

  // Rotating porthole marker.
  for (let a = -0.20; a <= 0.20; a += 0.05) {
    project([0.405 * Math.cos(a), -0.20 + a * 0.7, 0.405 * Math.sin(a)], [Math.cos(a), 0, Math.sin(a)], '◉');
  }

  return chars.map((row) => row.join('').replace(/\s+$/, '')).join('\n');
}

function renderTorusFrame(tick: number): string {
  const width = 35, height = 15;
  const { chars, depth } = asciiBuffer(width, height);
  const ax = 0.72 + Math.sin(tick * 0.035) * 0.12;
  const az = tick * 0.075;
  const light: V3 = [0.25, -0.45, 0.86];

  for (let u = 0; u < Math.PI * 2; u += 0.12) {
    for (let v = 0; v < Math.PI * 2; v += 0.18) {
      const ring = 1.75 + 0.62 * Math.cos(v);
      const p = rotate3([ring * Math.cos(u), 0.62 * Math.sin(v), ring * Math.sin(u)], ax, 0, az);
      const n = rotate3([Math.cos(v) * Math.cos(u), Math.sin(v), Math.cos(v) * Math.sin(u)], ax, 0, az);
      const camera = 4.8 - p[2];
      if (camera <= 0.2) continue;
      const perspective = 1 / camera;
      const sx = Math.round(width / 2 + p[0] * 25 * perspective);
      const sy = Math.round(height / 2 + p[1] * 12 * perspective);
      if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
      const z = p[2];
      if (z <= depth[sy][sx]) continue;
      depth[sy][sx] = z;
      const lum = n[0] * light[0] + n[1] * light[1] + n[2] * light[2];
      const idx = Math.max(1, Math.min(ASCII_LIGHT.length - 1, Math.round(((lum + 1) / 2) * (ASCII_LIGHT.length - 1))));
      chars[sy][sx] = ASCII_LIGHT[idx];
    }
  }

  return chars.map((row) => row.join('').replace(/\s+$/, '')).join('\n');
}

function renderDiamondFrame(tick: number): string {
  const width = 31, height = 15;
  const { chars, depth } = asciiBuffer(width, height);
  const ay = tick * (Math.PI * 2 / 64);
  const ax = -0.18 + Math.sin(tick * 0.055) * 0.16;
  const az = Math.sin(tick * 0.04) * 0.08;
  const base: V3[] = [
    [0, -1.42, 0], [0, 1.42, 0],
    [1.12, 0, 0], [0, 0, 0.92], [-1.12, 0, 0], [0, 0, -0.92],
  ];
  const faces = [
    [0,2,3],[0,3,4],[0,4,5],[0,5,2],
    [1,3,2],[1,4,3],[1,5,4],[1,2,5],
  ];
  const verts = base.map((v) => rotate3(v, ax, ay, az));
  const light: V3 = [-0.28, -0.42, 0.86];
  const projected = verts.map((p) => {
    const camera = 4.4 - p[2];
    const k = 1 / camera;
    return [width / 2 + p[0] * 33 * k, height / 2 + p[1] * 18 * k, p[2]] as V3;
  });

  for (const [ia, ib, ic] of faces) {
    const a = verts[ia], b = verts[ib], d = verts[ic];
    const ab: V3 = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
    const ad: V3 = [d[0]-a[0], d[1]-a[1], d[2]-a[2]];
    let nx = ab[1]*ad[2] - ab[2]*ad[1];
    let ny = ab[2]*ad[0] - ab[0]*ad[2];
    let nz = ab[0]*ad[1] - ab[1]*ad[0];
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl; ny /= nl; nz /= nl;
    const lum = nx*light[0] + ny*light[1] + nz*light[2];
    const shade = ASCII_LIGHT[Math.max(2, Math.min(ASCII_LIGHT.length - 1, Math.round(((lum + 1) / 2) * (ASCII_LIGHT.length - 1))))];

    const pa = projected[ia], pb = projected[ib], pc = projected[ic];
    for (let i = 0; i <= 18; i++) {
      for (let j = 0; j <= 18 - i; j++) {
        const wa = i / 18, wb = j / 18, wc = 1 - wa - wb;
        const sx = Math.round(pa[0]*wa + pb[0]*wb + pc[0]*wc);
        const sy = Math.round(pa[1]*wa + pb[1]*wb + pc[1]*wc);
        const z = pa[2]*wa + pb[2]*wb + pc[2]*wc;
        if (sx < 0 || sx >= width || sy < 0 || sy >= height || z <= depth[sy][sx]) continue;
        depth[sy][sx] = z;
        chars[sy][sx] = shade;
      }
    }
  }

  const edges = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,3],[3,4],[4,5],[5,2]];
  for (const [ia, ib] of edges) {
    const a = projected[ia], b = projected[ib];
    const steps = Math.max(2, Math.ceil(Math.max(Math.abs(b[0]-a[0]), Math.abs(b[1]-a[1])) * 1.5));
    const dx = b[0]-a[0], dy = b[1]-a[1];
    const edgeChar = Math.abs(dx) > Math.abs(dy)*1.8 ? '─' : Math.abs(dy) > Math.abs(dx)*1.8 ? '│' : dx*dy >= 0 ? '╲' : '╱';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sx = Math.round(a[0] + dx*t), sy = Math.round(a[1] + dy*t), z = a[2] + (b[2]-a[2])*t + 0.03;
      if (sx < 0 || sx >= width || sy < 0 || sy >= height || z < depth[sy][sx] - 0.08) continue;
      depth[sy][sx] = z;
      chars[sy][sx] = edgeChar;
    }
  }

  const centerY = Math.floor(height / 2), centerX = Math.floor(width / 2);
  if (chars[centerY]?.[centerX] !== undefined) chars[centerY][centerX] = '◆';
  return chars.map((row) => row.join('').replace(/\s+$/, '')).join('\n');
}


function renderTesseractFrame(tick: number, intensity: number): string {
  const width = 33, height = 15;
  const { chars, depth } = asciiBuffer(width, height);
  const power = Math.max(0, Math.min(1, intensity / 100));
  const cycle = (tick % 96) / 96;
  const morph = 0.08 + 0.92 * (0.5 - 0.5 * Math.cos(cycle * Math.PI * 2));

  type V4 = [number, number, number, number];
  const raw: V4[] = [];
  for (let i = 0; i < 16; i++) {
    raw.push([
      (i & 1) ? 1 : -1,
      (i & 2) ? 1 : -1,
      (i & 4) ? 1 : -1,
      (i & 8) ? 1 : -1,
    ]);
  }

  const a = tick * 0.045;
  const b = tick * 0.031;
  const c = tick * 0.023;

  const projected = raw.map(([x, y, z, w]) => {
    // 4D rotations: XW + YZ + XZ. The W axis expands/contracts through
    // the morph value so the object visibly folds from a cube into a tesseract.
    const ca = Math.cos(a), sa = Math.sin(a);
    const cb = Math.cos(b), sb = Math.sin(b);
    const cc = Math.cos(c), sc = Math.sin(c);

    const x1 = x * ca - w * sa;
    const w1 = x * sa + w * ca;
    const y1 = y * cb - z * sb;
    const z1 = y * sb + z * cb;
    const x2 = x1 * cc - z1 * sc;
    const z2 = x1 * sc + z1 * cc;

    const wEff = w1 * morph * (0.72 + power * 0.52);
    const scale4 = 1.40 / Math.max(1.55, 3.05 - wEff);
    const p3 = rotate3(
      [x2 * scale4, y1 * scale4, z2 * scale4],
      -0.24 + Math.sin(tick * 0.021) * 0.10,
      tick * 0.018,
      Math.sin(tick * 0.016) * 0.13
    );

    const camera = 4.15 - p3[2];
    const scale2 = 1 / Math.max(0.8, camera);
    return {
      x: width / 2 + p3[0] * 31 * scale2,
      y: height / 2 + p3[1] * 15 * scale2,
      z: p3[2],
      w: wEff,
    };
  });

  const put = (x: number, y: number, z: number, ch: string) => {
    const sx = Math.round(x), sy = Math.round(y);
    if (sx < 0 || sx >= width || sy < 0 || sy >= height || z < depth[sy][sx]) return;
    depth[sy][sx] = z;
    chars[sy][sx] = ch;
  };

  for (let i = 0; i < 16; i++) {
    for (let dim = 0; dim < 4; dim++) {
      const j = i ^ (1 << dim);
      if (i >= j) continue;
      const p0 = projected[i], p1 = projected[j];
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const steps = Math.max(2, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 1.35));
      const ch = dim === 3
        ? '·'
        : Math.abs(dx) > Math.abs(dy) * 1.8
          ? '─'
          : Math.abs(dy) > Math.abs(dx) * 1.8
            ? '│'
            : dx * dy >= 0 ? '╲' : '╱';
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        put(
          p0.x + dx * t,
          p0.y + dy * t,
          p0.z + (p1.z - p0.z) * t + (dim === 3 ? 0.015 : 0.03),
          ch
        );
      }
    }
  }

  projected.forEach((p, i) => put(p.x, p.y, p.z + 0.05, (i & 8) ? '◆' : '+'));

  const pulseEvery = Math.max(2, 7 - Math.round(power * 4));
  const cy = Math.floor(height / 2), cx = Math.floor(width / 2);
  chars[cy][cx] = tick % pulseEvery === 0 && power > 0.45 ? '✦' : '◇';

  return chars.map((row) => row.join('').replace(/\s+$/, '')).join('\n');
}

export type KWorldScene = 'spring' | 'summer' | 'autumn' | 'winter' | 'light' | 'dark';

type KTerminalProps = {
  embedded?: boolean;
  onExitToCity?: () => void;
  onExitToGallery?: () => void;
  onEnterScene?: (scene: KWorldScene) => void;
  worldAudioZone?: KAudioZone;
  worldAudioArmed?: boolean;
  onAudioState?: (state: { playing: boolean; positionMs: number; durationMs: number; title: string; zone?: KAudioZone; autoDj: boolean }) => void;
};

export default function KTerminal({
  embedded = false,
  onExitToCity,
  onExitToGallery,
  onEnterScene,
  worldAudioZone,
  worldAudioArmed = false,
  onAudioState,
}: KTerminalProps = {}) {
  const navigate = useNavigate();
  const [terminalParams] = useSearchParams();
  const fromGallery = embedded || terminalParams.get('from') === 'gallery';
  const enterWorldScene = useCallback((scene: KWorldScene) => {
    if (embedded && onEnterScene) {
      onEnterScene(scene);
      return;
    }
    navigate(`/gallery?scene=${scene}&spawn=portal`);
  }, [embedded, onEnterScene, navigate]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLIFrameElement>(null);
  const scWidgetRef = useRef<any>(null);
  const widgetBoundRef = useRef(false);
  const catalogHydratedRef = useRef(false);
  const visualizerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackPositionRef = useRef(0);
  const pausedByUserRef = useRef(false);
  const autoDjRef = useRef(true);
  const zoneRef = useRef<KAudioZone | undefined>(worldAudioZone);
  const lastAutoZoneRef = useRef<KAudioZone | undefined>(undefined);
  const zoneIndexRef = useRef(0);
  const autoAdvanceRef = useRef<(() => void) | null>(null);

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [bootPhase, setBootPhase] = useState<'booting' | 'done'>('booting');
  const [bootText, setBootText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>(defaultTracks);
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [timeDisplay, setTimeDisplay] = useState('00:00 / 00:00');
  const [audioStatus, setAudioStatus] = useState('STANDBY');
  const [isMobile, setIsMobile] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const [visualizerBars, setVisualizerBars] = useState(50);
  const [visualizerFps, setVisualizerFps] = useState(20);
  const [bandEnabled, setBandEnabled] = useState(true);
  const [autoDj, setAutoDj] = useState(true);
  const [asciiTick, setAsciiTick] = useState(0);
  const [ritualEnabled, setRitualEnabled] = useState(true);
  const [ritualIntensity, setRitualIntensity] = useState(72);
  const [ritualFps, setRitualFps] = useState(8);

  useEffect(() => { autoDjRef.current = autoDj; }, [autoDj]);
  useEffect(() => { zoneRef.current = worldAudioZone; }, [worldAudioZone]);

  const bootIndexRef = useRef(0);
  const STORAGE_KEY = 'k-terminal:tracks:v3';
  const SETTINGS_KEY = 'k-terminal:audio-settings:v1';

  // Restore persistent library/settings. New bundled tracks merge with saved tracks.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Track[];
      if (Array.isArray(saved) && saved.length) {
        const byUrl = new Map<string, Track>();
        [...defaultTracks, ...saved].forEach((t) => byUrl.set(t.url, t));
        setTracks(Array.from(byUrl.values()));
      }
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (typeof settings.volume === 'number') setVolume(settings.volume);
      if (typeof settings.visualizerEnabled === 'boolean') setVisualizerEnabled(settings.visualizerEnabled);
      if (typeof settings.visualizerBars === 'number') setVisualizerBars(settings.visualizerBars);
      if (typeof settings.visualizerFps === 'number') setVisualizerFps(settings.visualizerFps);
      if (typeof settings.playbackRate === 'number') setPlaybackRate(settings.playbackRate);
      if (typeof settings.bandEnabled === 'boolean') setBandEnabled(settings.bandEnabled);
      if (typeof settings.autoDj === 'boolean') setAutoDj(settings.autoDj);
      if (typeof settings.ritualEnabled === 'boolean') setRitualEnabled(settings.ritualEnabled);
      if (typeof settings.ritualIntensity === 'number') setRitualIntensity(settings.ritualIntensity);
      if (typeof settings.ritualFps === 'number') setRitualFps(settings.ritualFps);
    } catch (_) {}
  }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks)); } catch (_) {} }, [tracks]);
  useEffect(() => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ volume, visualizerEnabled, visualizerBars, visualizerFps, playbackRate, ritualEnabled, ritualIntensity, ritualFps, bandEnabled, autoDj })); } catch (_) {} }, [volume, visualizerEnabled, visualizerBars, visualizerFps, playbackRate, ritualEnabled, ritualIntensity, ritualFps, bandEnabled, autoDj]);

  // Detect mobile on mount
  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  // Low-FPS terminal art clock: intentionally stepped to preserve the retro CRT feel.
  useEffect(() => {
    const timer = window.setInterval(() => setAsciiTick((n) => (n + 1) % 240), Math.max(50, Math.round(1000 / ritualFps)));
    return () => window.clearInterval(timer);
  }, [ritualFps]);

  // Boot sequence
  useEffect(() => {
    const bootSequence = () => {
      if (bootIndexRef.current < bootMessages.length) {
        setBootText((prev) => prev + bootMessages[bootIndexRef.current] + '\n');
        bootIndexRef.current++;
        setTimeout(bootSequence, Math.random() * 300 + 100);
      } else {
        setTimeout(() => {
          setBootPhase('done');
          showWelcome();
        }, 500);
      }
    };
    bootSequence();
  }, []);

  // Keep input focused
  useEffect(() => {
    if (bootPhase === 'done') {
      inputRef.current?.focus();
    }
  }, [bootPhase]);

  // Deep-link commands from the developer portfolio.
  useEffect(() => {
    if (bootPhase !== 'done') return;
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const params = new URLSearchParams(hashQuery || window.location.search);
    if (params.get('cmd') === 'techopshero') {
      setGameOpen(true);
      window.history.replaceState({}, '', window.location.pathname + '#/terminal');
    }
  }, [bootPhase]);

  const addLine = useCallback((text: string, className?: string) => {
    setLines((prev) => [...prev, { text, className }]);
  }, []);

  const showWelcome = useCallback(() => {
    addLine('========================================', 'cyan');
    addLine('  K TERMINAL v2.0.77', 'cyan');
    addLine('========================================', 'cyan');
    addLine('');
    addLine('Artist Profile: <span class="tc-cyan">https://soundcloud.com/raikouno</span>');
    addLine('');
    addLine(`<span class="tc-success">[OK]</span> ${defaultTracks.length} track(s) pre-loaded.`);
    addLine('Type <span class="tc-command">\'list\'</span> to see available tracks.');
    addLine('Type <span class="tc-command">\'help\'</span> for all commands.');
    addLine('Or <span class="tc-cyan">CLICK on any track below to play</span>');
    addLine('');
  }, [addLine]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const updateProgressUI = useCallback((current: number, total: number) => {
    playbackPositionRef.current = current || 0;
    setPlaybackPositionMs(current || 0);
    if (!total) return;
    const percent = (current / total) * 100;
    setProgress(percent);
    const currentSec = Math.floor(current / 1000);
    const totalSec = Math.floor(total / 1000);
    setTimeDisplay(`${formatTime(currentSec)} / ${formatTime(totalSec)}`);
  }, [formatTime]);

  // Bind SoundCloud widget events (call once after iframe loads)
  const bindWidgetEvents = useCallback((widget: any) => {
    const SC = (window as any).SC;
    if (!SC) return;

    if (widgetBoundRef.current) return;
    widgetBoundRef.current = true;

    widget.bind(SC.Widget.Events.READY, () => {
      // The initial widget is the artist profile. SoundCloud resolves it to the
      // current public catalogue, so getSounds() gives us recent uploads without
      // hard-coding a stale list. Only hydrate once; later READY events are tracks.
      if (!catalogHydratedRef.current && typeof widget.getSounds === 'function') {
        widget.getSounds((sounds: any[]) => {
          if (Array.isArray(sounds) && sounds.length > 1) {
            catalogHydratedRef.current = true;
            const liveTracks: Track[] = sounds.map((sound: any, index: number) => ({
              id: index + 1,
              url: sound.permalink_url || sound.uri || '',
              title: sound.title || `Track ${index + 1}`,
              duration: sound.duration || 0,
              plays: sound.playback_count || 0,
            })).filter((track: Track) => track.url);
            if (liveTracks.length) {
              setTracks((saved) => {
                const byUrl = new Map<string, Track>();
                [...liveTracks, ...saved].forEach((t) => { if (!byUrl.has(t.url)) byUrl.set(t.url, t); });
                return Array.from(byUrl.values()).map((t, i) => ({ ...t, id: i + 1 }));
              });
              addLine(`<span class="tc-success">[SYNC]</span> Loaded ${liveTracks.length} current SoundCloud tracks.`);
            }
          }
        });
      }
      widget.getDuration((duration: number) => {
        setCurrentTrack((prev) => (prev ? { ...prev, duration } : prev));
      });
      widget.setVolume(volume);
      // Do not auto-play the initial profile catalogue. Track loads below use
      // auto_play plus their load callback, both originating from the user's gesture.
    });

    widget.bind(SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
      setAudioStatus('PLAYING');
      startVisualizer();
    });

    widget.bind(SC.Widget.Events.PAUSE, () => {
      setIsPlaying(false);
      setAudioStatus('PAUSED');
      stopVisualizer();
    });

    widget.bind(SC.Widget.Events.FINISH, () => {
      setIsPlaying(false);
      setAudioStatus('STOPPED');
      stopVisualizer();
      if (autoDjRef.current && zoneRef.current && autoAdvanceRef.current) {
        autoAdvanceRef.current();
      } else {
        addLine('Track finished. Type "next" to continue or "list" to choose another.', 'warning');
      }
    });

    widget.bind(SC.Widget.Events.PLAY_PROGRESS, (e: any) => {
      updateProgressUI(e.currentPosition, currentTrack?.duration || 0);
    });
  }, [volume, updateProgressUI, addLine, currentTrack?.duration]);

  // SoundCloud Widget init. load() keeps playback attached to the existing
  // iframe/widget instance so a user's click remains the playback gesture.
  const initSoundCloud = useCallback((url: string, shouldAutoPlay = true) => {
    if (!widgetRef.current) return;

    const SC = (window as any).SC;
    if (!SC || !SC.Widget) {
      addLine('<span class="tc-warning">[WARN]</span> SoundCloud API loading... retrying...');
      window.setTimeout(() => initSoundCloud(url), 500);
      return;
    }

    try {
      const widget = scWidgetRef.current || SC.Widget(widgetRef.current);
      scWidgetRef.current = widget;
      bindWidgetEvents(widget);

      widget.load(url, {
        auto_play: shouldAutoPlay,
        hide_related: true,
        show_comments: false,
        show_user: false,
        show_reposts: false,
        visual: false,
        callback: () => {
          widget.setVolume(volume);
          if (shouldAutoPlay) widget.play();
          else widget.pause();
        },
      });
    } catch (err) {
      console.error('SC Widget error:', err);
      setAudioStatus('ERROR');
      addLine('<span class="tc-error">Error loading SoundCloud player. Try the track again.</span>');
    }
  }, [bindWidgetEvents, addLine, volume]);

  // Visualizer
  const startVisualizer = useCallback(() => {
    stopVisualizer();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!visualizerEnabled) return;
    const bars = visualizerBars;
    const draw = () => {
      ctx.fillStyle = 'rgba(13, 2, 8, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / bars;
      const t = playbackPositionRef.current / 1000;
      for (let i = 0; i < bars; i++) {
        // SoundCloud does not expose raw FFT data. Keep the visualizer deterministic
        // and phase-locked to playback position instead of using random bars.
        const wave = (Math.sin(t * 5.1 + i * 0.47) + Math.sin(t * 2.3 + i * 0.19) * 0.55 + 1.55) / 3.1;
        const pulse = 0.62 + 0.38 * Math.abs(Math.sin(t * 3.2));
        const height = Math.max(2, wave * pulse * canvas.height * 0.86);
        const hue = (i / bars) * 120 + 100;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(i * barWidth, canvas.height - height, Math.max(1, barWidth - 2), height);
      }
    };
    visualizerIntervalRef.current = setInterval(draw, Math.max(16, Math.round(1000 / visualizerFps)));
  }, [visualizerEnabled, visualizerBars, visualizerFps]);

  const stopVisualizer = useCallback(() => {
    if (visualizerIntervalRef.current) {
      clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Play track by click
  const playTrack = useCallback((track: Track) => {
    setAutoDj(false);
    pausedByUserRef.current = false;
    setCurrentTrack(track);
    addLine(`Loading track ${track.id}: ${track.title}...`);
    addLine('<span class="tc-cyan">[TIP]</span> If playback does not start automatically, type <span class="tc-command">resume</span> to start the selected song.');
    initSoundCloud(track.url);
  }, [addLine, initSoundCloud]);

  // Play any SoundCloud URL
  const playUrl = useCallback((url: string) => {
    setAutoDj(false);
    pausedByUserRef.current = false;
    if (!url.includes('soundcloud.com')) {
      addLine('<span class="tc-error">Error: URL must be from SoundCloud</span>');
      return;
    }
    const t: Track = { id: 999, url, title: 'Custom URL', duration: 0, plays: 0 };
    setCurrentTrack(t);
    addLine(`Loading SoundCloud URL...`);
    addLine('<span class="tc-cyan">[TIP]</span> If playback does not start automatically, type <span class="tc-command">resume</span> to start the selected song.');
    initSoundCloud(url);
  }, [addLine, initSoundCloud]);

  // Poll the widget as a secondary source of truth. Some mobile/browser combinations
  // can miss an early PLAY event after widget.load(); this keeps the K band and
  // visualizer moving whenever SoundCloud is actually playing.
  useEffect(() => {
    if (!currentTrack) return;
    const id = window.setInterval(() => {
      const widget = scWidgetRef.current;
      if (!widget) return;
      widget.isPaused?.((paused: boolean) => {
        const playing = !paused;
        setIsPlaying(playing);
        setAudioStatus(playing ? 'PLAYING' : 'PAUSED');
        if (playing && !visualizerIntervalRef.current) startVisualizer();
      });
      widget.getPosition?.((position: number) => {
        widget.getDuration?.((duration: number) => updateProgressUI(position || 0, duration || currentTrack.duration || 0));
      });
    }, 300);
    return () => window.clearInterval(id);
  }, [currentTrack, startVisualizer, updateProgressUI]);

  const playWorldTrack = useCallback((track: KAudioTrack, index: number, shouldAutoPlay: boolean) => {
    const t: Track = { id: 7000 + index, url: track.url, title: track.title, duration: 0, plays: 0 };
    setCurrentTrack(t);
    setProgress(0);
    setPlaybackPositionMs(0);
    setTimeDisplay('00:00 / 00:00');
    setAudioStatus(shouldAutoPlay ? 'LOADING' : 'PAUSED');
    initSoundCloud(track.url, shouldAutoPlay);
  }, [initSoundCloud]);

  const playZone = useCallback((zone: KAudioZone, index = 0, forcePlay = false) => {
    const playlist = K_ZONE_PLAYLISTS[zone] || [];
    if (!playlist.length) return;
    const nextIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    zoneIndexRef.current = nextIndex;
    const shouldAutoPlay = forcePlay || !pausedByUserRef.current;
    playWorldTrack(playlist[nextIndex], nextIndex, shouldAutoPlay);
    addLine(`<span class="tc-cyan">[AUTO DJ]</span> ${K_ZONE_LABELS[zone]} → ${playlist[nextIndex].title}`);
  }, [addLine, playWorldTrack]);

  useEffect(() => {
    autoAdvanceRef.current = () => {
      const zone = zoneRef.current;
      if (!zone || !autoDjRef.current) return;
      const playlist = K_ZONE_PLAYLISTS[zone] || [];
      if (!playlist.length) return;
      const next = (zoneIndexRef.current + 1) % playlist.length;
      playZone(zone, next, true);
    };
  }, [playZone]);

  useEffect(() => {
    if (!worldAudioArmed || !worldAudioZone || !autoDj) return;
    if (lastAutoZoneRef.current === worldAudioZone) return;
    lastAutoZoneRef.current = worldAudioZone;
    zoneRef.current = worldAudioZone;
    zoneIndexRef.current = 0;
    playZone(worldAudioZone, 0, false);
  }, [worldAudioArmed, worldAudioZone, autoDj, playZone]);

  useEffect(() => {
    onAudioState?.({
      playing: isPlaying,
      positionMs: playbackPositionMs,
      durationMs: currentTrack?.duration || 0,
      title: currentTrack?.title || '',
      zone: worldAudioZone,
      autoDj,
    });
  }, [isPlaying, playbackPositionMs, currentTrack?.duration, currentTrack?.title, worldAudioZone, autoDj, onAudioState]);

  // Terminal commands
  const executeCommand = useCallback((cmd: string, args: string[]) => {
    switch (cmd) {
      case 'help':
        addLine(`Available commands:
  <span class="tc-command">list</span>              - Display available tracks
  <span class="tc-command">play [id]</span>         - Play track by ID
  <span class="tc-command">play [url]</span>        - Play any SoundCloud URL
  <span class="tc-command">add [url] [title]</span> - Add new track to playlist
  <span class="tc-command">remove [id]</span>       - Remove track from playlist
  <span class="tc-command">clearplaylist</span>     - Remove all tracks
  <span class="tc-command">artist</span>            - Open @raikouno profile
  <span class="tc-command">techopshero</span>       - Launch TechOps Hero inside K Terminal
  <span class="tc-command">city</span>              - Exit terminal back to current city position
  <span class="tc-command">gallery</span>           - Return to gallery apse
  <span class="tc-command">auto on|off</span>       - Scene-synced K Terminal Auto DJ
  <span class="tc-command">zone</span>              - Show current world audio zone
  <span class="tc-command">songs</span>             - Show Auto DJ songs for current zone
  <span class="tc-command">nowplaying</span>        - Show K Terminal audio authority state
  <span class="tc-command">pause</span>             - Pause current track
  <span class="tc-command">resume</span>            - Resume paused track
  <span class="tc-command">stop</span>              - Stop playback
  <span class="tc-command">volume [0-100]</span>    - Set volume level
  <span class="tc-command">speed [0.5-2]</span>      - Set playback speed when provider supports it
  <span class="tc-command">visualizer on|off</span>  - Toggle visualizer
  <span class="tc-command">visualizer bars [8-128]</span> - Set density
  <span class="tc-command">visualizer fps [5-60]</span>   - Set refresh rate\n  <span class="tc-command">band on|off</span>       - Toggle K clone ensemble
  <span class="tc-command">ritual on|off</span>      - Toggle celestial ASCII audio-reactive mode
  <span class="tc-command">ritual intensity [0-100]</span> - Set reaction strength
  <span class="tc-command">ritual fps [2-20]</span>  - Set stepped animation clock
  <span class="tc-command">ritual map</span>         - Show animation/audio mapping
  <span class="tc-command">next</span>              - Play next track
  <span class="tc-command">prev</span>              - Play previous track
  <span class="tc-command">status</span>            - Show playback status
  <span class="tc-command">clear</span>             - Clear terminal screen
  <span class="tc-command">help</span>              - Show this help message`);
        break;

      case 'list': {
        if (tracks.length === 0) {
          addLine('<span class="tc-warning">Playlist is empty.</span>');
          break;
        }
        addLine('PLAYLIST:');
        addLine('='.repeat(40));
        tracks.forEach((track) => {
          const prefix = currentTrack && currentTrack.id === track.id ? '▶ ' : '  ';
          const playsDisplay = track.plays >= 1000
            ? `${(track.plays / 1000).toFixed(track.plays >= 10000 ? 0 : 1)}K`
            : `${track.plays}`;
          const playsStr = track.plays > 0 ? ` <span class="tc-cyan">${playsDisplay} plays</span>` : '';
          addLine(`${prefix}[${track.id}] ${track.title}${playsStr}`, currentTrack && currentTrack.id === track.id ? 'playing' : '');
        });
        addLine('');
        addLine('Click on a track above or use "play [id]" to select');
        break;
      }

      case 'play': {
        if (!args[0]) {
          addLine('Error: No track specified. Usage: play [id] or play [url]', 'error');
          break;
        }
        const arg = args[0];
        if (arg.includes('soundcloud.com')) {
          playUrl(arg);
        } else {
          const id = parseInt(arg);
          const track = tracks.find((t) => t.id === id);
          if (!track) {
            addLine(`Error: Track ${id} not found. Type "list" to see available tracks.`, 'error');
            break;
          }
          playTrack(track);
        }
        break;
      }

      case 'add': {
        if (!args[0]) {
          addLine('Error: No URL specified. Usage: add [url] [title]', 'error');
          break;
        }
        const url = args[0];
        if (!url.includes('soundcloud.com')) {
          addLine('Error: URL must be from SoundCloud', 'error');
          break;
        }
        const title = args.slice(1).join(' ') || `Track ${tracks.length + 1}`;
        const newTrack: Track = {
          id: tracks.length > 0 ? Math.max(...tracks.map((t) => t.id)) + 1 : 1,
          url,
          title,
          duration: 0,
          plays: 0,
        };
        setTracks((prev) => [...prev, newTrack]);
        addLine(`<span class="tc-success">[OK]</span> Added: ${title} (ID: ${newTrack.id})`);
        break;
      }

      case 'remove': {
        if (!args[0]) {
          addLine('Error: No ID specified. Usage: remove [id]', 'error');
          break;
        }
        const id = parseInt(args[0]);
        const index = tracks.findIndex((t) => t.id === id);
        if (index === -1) {
          addLine(`Error: Track ${id} not found.`, 'error');
          break;
        }
        const removed = tracks[index];
        setTracks((prev) => prev.filter((t) => t.id !== id));
        addLine(`<span class="tc-success">[OK]</span> Removed: ${removed.title}`);
        break;
      }

      case 'clearplaylist': {
        setTracks([]);
        addLine('<span class="tc-warning">[OK]</span> Playlist cleared.');
        break;
      }

      case 'artist': {
        window.open('https://soundcloud.com/raikouno', '_blank');
        addLine('Opening RAIKOUNO profile: <span class="tc-cyan">https://soundcloud.com/raikouno</span>');
        break;
      }

      case 'auto': {
        const mode = (args[0] || '').toLowerCase();
        if (mode !== 'on' && mode !== 'off') {
          addLine(`AUTO DJ: ${autoDj ? 'ON' : 'OFF'} · usage: auto on|off`);
          break;
        }
        const enabled = mode === 'on';
        setAutoDj(enabled);
        autoDjRef.current = enabled;
        if (enabled) {
          pausedByUserRef.current = false;
          const zone = worldAudioZone || zoneRef.current;
          if (zone) {
            lastAutoZoneRef.current = undefined;
            playZone(zone, 0, true);
          }
          addLine('<span class="tc-success">AUTO DJ ON</span> — world zones control K Terminal audio.');
        } else {
          addLine('<span class="tc-warning">AUTO DJ OFF</span> — current/manual track remains under terminal control.');
        }
        break;
      }

      case 'zone': {
        const zone = worldAudioZone || zoneRef.current;
        addLine(zone ? `ZONE: ${K_ZONE_LABELS[zone]} · AUTO DJ ${autoDj ? 'ON' : 'OFF'}` : 'ZONE: standalone terminal');
        break;
      }

      case 'songs': {
        const zone = worldAudioZone || zoneRef.current;
        if (!zone) { addLine('No world zone active.'); break; }
        addLine(`${K_ZONE_LABELS[zone]} PLAYLIST:`);
        (K_ZONE_PLAYLISTS[zone] || []).forEach((track, i) => addLine(`  [${i + 1}] ${track.title}`));
        break;
      }

      case 'nowplaying': {
        addLine(`AUDIO AUTHORITY: K TERMINAL
MODE: ${autoDj ? 'AUTO DJ / SCENE SYNC' : 'MANUAL'}
ZONE: ${worldAudioZone ? K_ZONE_LABELS[worldAudioZone] : 'STANDALONE'}
TRACK: ${currentTrack?.title || 'NONE'}
STATUS: ${audioStatus}`);
        break;
      }

      case 'pause': {
        if (!scWidgetRef.current) {
          addLine('Error: No track loaded', 'error');
          break;
        }
        pausedByUserRef.current = true;
        try { scWidgetRef.current.pause(); } catch (e) {}
        addLine('Playback paused.');
        break;
      }

      case 'resume': {
        if (!scWidgetRef.current) {
          addLine('Error: No track loaded', 'error');
          break;
        }
        pausedByUserRef.current = false;
        try { scWidgetRef.current.play(); } catch (e) {}
        addLine('Resuming playback...');
        break;
      }

      case 'stop': {
        if (!scWidgetRef.current) {
          addLine('Error: No track loaded', 'error');
          break;
        }
        try {
          pausedByUserRef.current = true;
        scWidgetRef.current.pause();
          scWidgetRef.current.seekTo(0);
        } catch (e) {}
        setIsPlaying(false);
        setAudioStatus('STOPPED');
        stopVisualizer();
        setProgress(0);
        addLine('Playback stopped.');
        break;
      }

      case 'speed': {
        if (!args[0]) { addLine(`Playback speed: ${playbackRate}x`); break; }
        const rate = Number(args[0]);
        if (!Number.isFinite(rate) || rate < 0.5 || rate > 2) { addLine('Error: Speed must be between 0.5 and 2.0', 'error'); break; }
        setPlaybackRate(rate);
        const widget: any = scWidgetRef.current;
        if (widget && typeof widget.setPlaybackRate === 'function') {
          try { widget.setPlaybackRate(rate); addLine(`Playback speed set to ${rate}x`); } catch (_) { addLine('Provider rejected playback-rate control.', 'error'); }
        } else {
          addLine('Speed preference saved, but SoundCloud embedded playback does not expose playback-rate control in this browser.', 'warning');
        }
        break;
      }

      case 'ritual': {
        const sub = (args[0] || '').toLowerCase();
        if (!sub) { addLine(`Ritual: ${ritualEnabled ? 'ON' : 'OFF'} | intensity=${ritualIntensity} | fps=${ritualFps}`); break; }
        if (sub === 'on' || sub === 'off') { const enabled = sub === 'on'; setRitualEnabled(enabled); addLine(`Celestial ritual ${enabled ? 'engaged' : 'silenced'}.`); break; }
        if (sub === 'intensity') { const n = Number(args[1]); if (!Number.isInteger(n) || n < 0 || n > 100) { addLine('Error: ritual intensity must be 0-100', 'error'); break; } setRitualIntensity(n); addLine(`Ritual intensity set to ${n}.`); break; }
        if (sub === 'fps') { const n = Number(args[1]); if (!Number.isInteger(n) || n < 2 || n > 20) { addLine('Error: ritual fps must be 2-20', 'error'); break; } setRitualFps(n); addLine(`Ritual clock set to ${n} fps.`); break; }
        if (sub === 'map') { addLine('RITUAL MAP // playback-reactive fallback\nBASS/KICK → TAINO sun-relief pulse\nMID → GLOBE meridian rotation\nTRANSIENT → DIAMOND prism flare\nBEAT/CLOCK → CUBE Z-step\nORBIT → MOON crater rotation\nASCENT → ROCKET 3D vector spin\nPLAY/PAUSE → EYE + celestial illumination\n\nRaw frequency analysis requires the planned custom audio engine; SoundCloud iframe mode uses playback state/progress as a deterministic surrogate.', 'cyan'); break; }
        addLine('Usage: ritual on|off | ritual intensity [0-100] | ritual fps [2-20] | ritual map', 'error');
        break;
      }

      case 'band': {
        const sub = (args[0] || '').toLowerCase();
        if (!sub) { addLine(`K clone ensemble: ${bandEnabled ? 'ON' : 'OFF'}`); break; }
        if (sub === 'on' || sub === 'off') {
          const enabled = sub === 'on';
          setBandEnabled(enabled);
          addLine(`K clone ensemble ${enabled ? 'on stage' : 'muted'}.`);
          break;
        }
        addLine('Usage: band on|off', 'error');
        break;
      }

      case 'visualizer': {
        const sub = (args[0] || '').toLowerCase();
        if (!sub) { addLine(`Visualizer: ${visualizerEnabled ? 'ON' : 'OFF'} | bars=${visualizerBars} | fps=${visualizerFps}`); break; }
        if (sub === 'on' || sub === 'off') { const enabled = sub === 'on'; setVisualizerEnabled(enabled); if (!enabled) stopVisualizer(); addLine(`Visualizer ${enabled ? 'enabled' : 'disabled'}.`); break; }
        if (sub === 'bars') { const n = Number(args[1]); if (!Number.isInteger(n) || n < 8 || n > 128) { addLine('Error: visualizer bars must be 8-128', 'error'); break; } setVisualizerBars(n); addLine(`Visualizer bars set to ${n}.`); break; }
        if (sub === 'fps') { const n = Number(args[1]); if (!Number.isInteger(n) || n < 5 || n > 60) { addLine('Error: visualizer fps must be 5-60', 'error'); break; } setVisualizerFps(n); addLine(`Visualizer refresh set to ${n} fps.`); break; }
        addLine('Usage: visualizer on|off | visualizer bars [8-128] | visualizer fps [5-60]', 'error');
        break;
      }

      case 'volume': {
        if (!args[0]) {
          addLine(`Current volume: ${volume}%`);
          break;
        }
        const vol = parseInt(args[0]);
        if (isNaN(vol) || vol < 0 || vol > 100) {
          addLine('Error: Volume must be 0-100', 'error');
          break;
        }
        setVolume(vol);
        try { scWidgetRef.current?.setVolume(vol); } catch (e) {}
        addLine(`Volume set to ${vol}%`);
        break;
      }

      case 'next': {
        if (tracks.length === 0) {
          addLine('Error: No tracks in playlist', 'error');
          break;
        }
        if (!currentTrack) {
          playTrack(tracks[0]);
          break;
        }
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        const nextTrack = tracks[(currentIndex + 1) % tracks.length];
        playTrack(nextTrack);
        break;
      }

      case 'prev': {
        if (tracks.length === 0) {
          addLine('Error: No tracks in playlist', 'error');
          break;
        }
        if (!currentTrack) {
          playTrack(tracks[0]);
          break;
        }
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        const prevTrack = tracks[(currentIndex - 1 + tracks.length) % tracks.length];
        playTrack(prevTrack);
        break;
      }

      case 'status': {
        if (!currentTrack) {
          addLine('No track loaded. System ready.');
          break;
        }
        addLine(`Current Track: ${currentTrack.title}
Status: ${isPlaying ? 'PLAYING' : 'PAUSED/STOPPED'}
Volume: ${volume}%
Playlist: ${tracks.length} track(s)
Audio Authority: K Terminal
Mode: ${autoDj ? 'AUTO DJ' : 'MANUAL'}
Zone: ${worldAudioZone ? K_ZONE_LABELS[worldAudioZone] : 'standalone'}`);
        break;
      }

      case 'city': {
        addLine('<span class="tc-cyan">[CITY]</span> Returning to K//CITY...');
        if (embedded && onExitToCity) onExitToCity();
        else navigate('/gallery?spawn=console');
        break;
      }

      case 'gallery': {
        addLine('<span class="tc-cyan">[GALLERY]</span> Returning to the royal-gothic apse...');
        if (embedded && onExitToGallery) onExitToGallery();
        else if (embedded && onExitToCity) onExitToCity();
        else navigate('/gallery?spawn=console');
        break;
      }

      case 'techopshero': {
        setGameOpen(true);
        addLine('<span class="tc-cyan">[GAME]</span> Mounting TechOps Hero in CRT viewport...');
        break;
      }

      case 'residual': {
        window.open('https://ninja-ops-guy.github.io/residual-agent-harness/', '_blank', 'noopener,noreferrer');
        addLine('<span class="tc-cyan">[RESIDUAL]</span> Opening interactive demo...');
        break;
      }

      case 'clear': {
        setLines([]);
        break;
      }

      default:
        addLine(`Command not found: ${cmd}. Type "help" for available commands.`, 'error');
    }
  }, [tracks, currentTrack, volume, isPlaying, playbackRate, visualizerEnabled, visualizerBars, visualizerFps, ritualEnabled, ritualIntensity, ritualFps, bandEnabled, addLine, playTrack, playUrl, stopVisualizer, navigate, embedded, onExitToCity, onExitToGallery, autoDj, worldAudioZone, playZone]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // K Terminal owns every key while the prompt has focus. Without this,
      // K//CITY's global Space handler treats spaces as flight input and
      // prevents multi-argument commands such as "play 1".
      e.stopPropagation();
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const value = inputValue.trim();
      if (!value) return;
      const parts = value.split(/\s+/).filter(Boolean);
      const [rawCommand, ...rawArgs] = parts;
      const commandHtml = `<span class="tc-prompt"><span class="kt-bashrc-mark">⌐▀͡ ̯ʖ▀)︻̷┻̿═━一</span> <span class="kt-bashrc-k">k</span><span class="kt-bashrc-at">@</span><span class="kt-bashrc-the">the</span><span class="kt-bashrc-emrld">emrld</span></span> <span class="tc-shell-op">$</span> <span class="tc-command-name">${rawCommand}</span>${rawArgs.length ? ' <span class="tc-arg">' + rawArgs.join(' ') + '</span>' : ''}`;
      addLine(commandHtml, 'command');
      setInputValue('');
      executeCommand(rawCommand.toLowerCase(), rawArgs);
    },
    [inputValue, addLine, executeCommand]
  );

  // Canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = Math.max(1, Math.round(canvas.getBoundingClientRect().width || canvas.offsetWidth || 1));
      const height = Math.max(1, Math.round(canvas.getBoundingClientRect().height || canvas.offsetHeight || 1));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    };
    const frame = requestAnimationFrame(resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resizeCanvas); };
  }, []);

  // Load SoundCloud API script
  useEffect(() => {
    if (document.getElementById('sc-api')) return;
    const script = document.createElement('script');
    script.id = 'sc-api';
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => {
      if (widgetRef.current && (window as any).SC?.Widget) {
        const widget = scWidgetRef.current || (window as any).SC.Widget(widgetRef.current);
        scWidgetRef.current = widget;
        bindWidgetEvents(widget);
      }
    };
    document.body.appendChild(script);
    // Keep the shared Widget API loaded. K//CITY uses the same script after
    // the terminal overlay closes, avoiding a silent handoff/reload gap.
  }, [bindWidgetEvents]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  if (bootPhase === 'booting') {
    return (
      <div className="kt-boot-overlay">
        <pre className="kt-boot-text">{bootText}</pre>
      </div>
    );
  }

  return (
    <div className="kt-body">
      <div className="kt-regal-pillar kt-regal-pillar-left" aria-hidden="true"><span className="kt-pillar-glyph">♛</span></div>
      <div className="kt-regal-pillar kt-regal-pillar-right" aria-hidden="true"><span className="kt-pillar-glyph">♛</span></div>

      {/* SoundCloud widget iframe -- tiny but in-viewport for mobile autoplay policy */}
      <iframe
        ref={widgetRef}
        id="soundcloud-widget"
        width="1"
        height="1"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/raikouno&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false"
        style={{ position: 'absolute', bottom: '0', left: '0', width: 1, height: 1, opacity: 0.01, pointerEvents: 'none', border: 0 }}
      />

      {gameOpen && (
        <div className="kt-game-shell" role="dialog" aria-label="TechOps Hero">
          <div className="kt-game-toolbar">
            <span><span className="tc-cyan">K://GAMES/</span>TECHOPS-HERO.EXE</span>
            <div className="kt-game-actions">
              <a href="https://ninja-ops-guy.github.io/techops-hero/" target="_blank" rel="noreferrer">[OPEN NATIVE ↗]</a>
              <button type="button" onClick={() => setGameOpen(false)}>[ESC / CLOSE]</button>
            </div>
          </div>
          <div className="kt-game-frame-wrap">
            <iframe
              className="kt-game-frame"
              src="https://ninja-ops-guy.github.io/techops-hero/"
              title="TechOps Hero"
              allow="autoplay; fullscreen; gamepad"
            />
            <div className="kt-game-scanlines" aria-hidden="true" />
            <div className="kt-game-vignette" aria-hidden="true" />
          </div>
        </div>
      )}

      <div className="kt-container">
        {/* Header */}
        <div className="kt-header">
          <div className="kt-title kt-glitch">
            K Terminal <span className="kt-artist-badge">THEEMRLD</span>
          </div>
          <div className="flex items-center gap-4">
            {fromGallery && (
              <button
                type="button"
                className="kt-gallery-exit"
                onClick={() => { if (embedded && onExitToCity) onExitToCity(); else navigate('/gallery?spawn=console'); }}
                title="Exit K Terminal and return to K//CITY at the apse computer"
              >
                [EXIT → CITY]
              </button>
            )}
            <Link
              to="/"
              className="kt-status hover:text-[#00ffff] transition-colors duration-300"
              style={{ textDecoration: 'none' }}
            >
              [&larr; PORTFOLIO]
            </Link>
            <div className="kt-status">
              [SYSTEM: ONLINE] [AUTO DJ: ${autoDj ? 'ON' : 'OFF'}] [ZONE: ${worldAudioZone ? K_ZONE_LABELS[worldAudioZone] : 'STANDALONE'}] [AUDIO: <span className={`kt-audio-${audioStatus === 'PLAYING' ? 'success' : audioStatus === 'PAUSED' ? 'warning' : 'error'}`}>{audioStatus}</span>]
            </div>
          </div>
        </div>

        {/* Living ASCII sigils / world portals */}
        <div className={`kt-ascii-deck ${ritualEnabled ? "kt-ritual-on" : "kt-ritual-off"} ${isPlaying ? "kt-ritual-playing" : "kt-ritual-idle"}`} style={{ ["--ritual-power" as any]: ritualIntensity / 100 }} aria-label="audio-reactive animated world portals">
          <button type="button" className="kt-ascii-card kt-taino-card" onClick={() => enterWorldScene('spring')} title="Enter SOL//TROPICAL: sunlit jungle coast and temple ruins">
            <span className="kt-ascii-label">☉ TAINO://PETROGLYPH·SOL · RELIEF.EXE</span>
            <span className="kt-scene-tag">SOL // TROPICAL TEMPLE</span>
            <div className="kt-taino-stage">
              {!isPlaying && <pre className="kt-taino-noise">{renderIdleHashFrame(asciiTick)}</pre>}
              <pre className="kt-taino-symbol">{renderTainoFrame(asciiTick)}</pre>
            </div>
          </button>
          <button type="button" className="kt-ascii-card kt-globe-card" onClick={() => enterWorldScene('summer')} title="Enter EMERALD HALO: circular bio-cyber garden and ring habitat">
            <span className="kt-ascii-label">☿ TORUS://ORBIT·RING · MUNDUS.EXE</span>
            <span className="kt-scene-tag">TORUS // EMERALD HALO</span>
            <div className="kt-globe-stage">
              <pre className="kt-globe">{renderTorusFrame(asciiTick)}</pre>
            </div>
          </button>
          <button type="button" className="kt-ascii-card kt-diamond-card" onClick={() => enterWorldScene('autumn')} title="Enter PRISM CAVERNS: crystalline data quarry and cyan cathedral">
            <span className="kt-ascii-label">◇ DIAMOND://CARBON·PRISM · LAPIS.EXE</span>
            <span className="kt-scene-tag">DIAMOND // PRISM CAVERNS</span>
            <div className="kt-diamond-stage">
              <pre className="kt-diamond">{renderDiamondFrame(asciiTick)}</pre>
            </div>
          </button>
          <button type="button" className="kt-ascii-card kt-tesseract-card" onClick={() => enterWorldScene('winter')} title="Enter CRIMSON HYPERCUBE: impossible 4D reactor labyrinth">
            <span className="kt-ascii-label">🜔 TESSERACT://4D·HYPERCUBE · SEAL.EXE</span>
            <span className="kt-scene-tag">TESSERACT // RED LABYRINTH</span>
            <div className="kt-tesseract-stage">
              <pre className="kt-tesseract-face">{renderTesseractFrame(asciiTick, isPlaying ? ritualIntensity : 24)}</pre>
            </div>
          </button>
          <button type="button" className="kt-ascii-card kt-moon-card" onClick={() => enterWorldScene('dark')} title="Enter LUNAR OUTPOST: moon surface, craters, lander and Earth horizon">
            <span className="kt-ascii-label">☽ MOON://CRATER·ORBIT · SELENE.EXE</span>
            <span className="kt-scene-tag">MOON // LUNAR OUTPOST</span>
            <div className="kt-moon-stage">
              <pre className="kt-moon">{renderMoonFrame(asciiTick)}</pre>
            </div>
          </button>
          <button type="button" className="kt-ascii-card kt-rocket-card" onClick={() => enterWorldScene('light')} title="Enter K-01 ORBITAL: walkable space station with docking ring and observation deck">
            <span className="kt-ascii-label">△ ROCKET://ASCENT·VECTOR · APOLLO.EXE</span>
            <span className="kt-scene-tag">ROCKET // K-01 STATION</span>
            <div className="kt-rocket-stage">
              <pre className="kt-rocket">{renderRocketFrame(asciiTick)}</pre>
            </div>
          </button>
        </div>

        {/* CLI console — intentionally directly beneath the projection deck */}
        <div className="kt-cli-console">
        {/* Terminal */}
        <div className="kt-terminal" ref={terminalRef}>
          {lines.map((line, i) => (
            <div
              key={i}
              className="kt-line"
              dangerouslySetInnerHTML={{ __html: line.text }}
              style={{ marginBottom: 5, opacity: 1 }}
            />
          ))}
        </div>

        {/* Input */}
        <div className="kt-input-line">
          <span className="kt-prompt"><span className="kt-bashrc"><span className="kt-bashrc-mark">⌐▀͡ ̯ʖ▀)︻̷┻̿═━一</span> <span className="kt-bashrc-k">k</span><span className="kt-bashrc-at">@</span><span className="kt-bashrc-the">the</span><span className="kt-bashrc-emrld">emrld</span></span><span className="kt-shell-op">$</span></span>
          <input
            ref={inputRef}
            type="text"
            className="kt-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          <span className="kt-cursor" />
        </div>

        </div>

        {/* K clone band — below CLI so the prompt stays directly under projections */}
        <KBandStage
          isPlaying={isPlaying}
          progress={progress}
          positionMs={playbackPositionMs}
          intensity={ritualIntensity}
          trackTitle={currentTrack?.title}
          enabled={bandEnabled}
        />

        {/* Visualizer */}
        <div className="kt-visualizer-container" style={{ display: visualizerEnabled ? 'block' : 'none' }}>
          <canvas ref={canvasRef} className="kt-canvas" />
        </div>

        {/* Progress bar */}
        <div className="kt-progress-container">
          <div className="kt-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="kt-track-info">
          <span id="current-track">{currentTrack ? currentTrack.title.toUpperCase() : 'NO TRACK LOADED'}</span>
          <span id="time-display">{timeDisplay}</span>
        </div>

        {/* Click-to-play track list */}
        <div className="kt-click-play">
            <div className="kt-click-header">
              <span className="kt-cyan">{isMobile ? 'TAP TO PLAY' : 'CLICK TO PLAY'}</span> -- @raikouno · persistent library
            </div>
            {isMobile && (
              <div
                className="kt-mobile-play-hint"
                style={{
                  fontSize: '11px',
                  color: '#008f11',
                  marginBottom: '8px',
                  textAlign: 'center',
                  padding: '6px',
                  border: '1px dashed #008f11',
                }}
              >
                Tap any track below to start playback
              </div>
            )}
            <ul className="kt-track-list">
              {tracks.map((track) => (
                <li
                  key={track.id}
                  className={`kt-track-item ${currentTrack && currentTrack.id === track.id ? 'kt-playing' : ''}`}
                  onClick={() => playTrack(track)}
                >
                  <span className="kt-track-number">[{String(track.id).padStart(2, '0')}]</span>
                  <span className="kt-track-title">{track.title}</span>
                  <span className="kt-track-plays">
                    {track.plays >= 1000
                      ? `${(track.plays / 1000).toFixed(track.plays >= 10000 ? 0 : 1)}K plays`
                      : track.plays > 0
                        ? `${track.plays} plays`
                        : '--'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

      </div>

      {/* Global styles for terminal page */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');

        .kt-body {
          background: #0d0208;
          color: #00ff41;
          font-family: 'Share Tech Mono', monospace;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        /* CRT scanlines */
        .kt-body::before {
          content: " ";
          display: block;
          position: fixed;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
                      linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          z-index: 10;
        }
        .kt-body::after {
          content: " ";
          display: block;
          position: fixed;
          top: 0; left: 0; bottom: 0; right: 0;
          background: rgba(18, 16, 16, 0.1);
          pointer-events: none;
          z-index: 11;
          animation: kt-flicker 0.15s infinite;
        }

        @keyframes kt-flicker {
          0% { opacity: 0.27861; } 5% { opacity: 0.34769; } 10% { opacity: 0.23604; }
          15% { opacity: 0.90626; } 20% { opacity: 0.18128; } 25% { opacity: 0.10689; }
          30% { opacity: 0.20316; } 35% { opacity: 0.85418; } 40% { opacity: 0.12793; }
          45% { opacity: 0.47557; } 50% { opacity: 0.1943; } 55% { opacity: 0.72038; }
          60% { opacity: 0.18335; } 65% { opacity: 0.15978; } 70% { opacity: 0.32258; }
          75% { opacity: 0.93817; } 80% { opacity: 0.13305; } 85% { opacity: 0.20232; }
          90% { opacity: 0.91513; } 95% { opacity: 0.15313; } 100% { opacity: 0.16754; }
        }

        .kt-boot-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: #0d0208;
          z-index: 100;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-family: 'VT323', monospace;
        }
        .kt-boot-text {
          font-size: 20px;
          max-width: 600px;
          width: 90%;
          color: #00ff41;
          line-height: 1.8;
        }

        .kt-container {
          height: 100dvh;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 20px 58px;
          position: relative;
          z-index: 5;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
        }

        .kt-regal-pillar {
          position: fixed;
          top: 58px;
          bottom: 22px;
          width: 34px;
          z-index: 4;
          pointer-events: none;
          border-left: 2px solid #8f4dff;
          border-right: 2px solid #5a189a;
          background:
            repeating-linear-gradient(90deg, rgba(255,255,255,.09) 0 2px, transparent 2px 7px),
            linear-gradient(90deg, #220535 0%, #6f2dbd 22%, #b86bff 46%, #4b1678 72%, #170020 100%);
          box-shadow:
            inset 0 0 9px rgba(255,255,255,.13),
            inset 0 0 18px rgba(32,0,45,.86),
            0 0 12px rgba(158,79,255,.44),
            0 0 28px rgba(112,0,255,.18);
        }
        .kt-regal-pillar-left { left: 10px; }
        .kt-regal-pillar-right { right: 10px; }
        .kt-regal-pillar::before,
        .kt-regal-pillar::after {
          content:'';
          position:absolute;
          left:-9px;
          width:48px;
          height:16px;
          border:2px solid #9d4edd;
          background:
            linear-gradient(180deg, rgba(216,146,255,.25), rgba(52,4,77,.96)),
            repeating-linear-gradient(90deg,#7b2cbf 0 5px,#3c096c 5px 10px);
          box-shadow:0 0 10px rgba(157,78,221,.45), inset 0 0 7px rgba(0,0,0,.8);
        }
        .kt-regal-pillar::before {
          top:-13px;
          clip-path:polygon(0 35%,12% 35%,20% 0,80% 0,88% 35%,100% 35%,100% 100%,0 100%);
        }
        .kt-regal-pillar::after {
          bottom:-13px;
          height:20px;
          clip-path:polygon(0 0,100% 0,100% 72%,88% 72%,82% 100%,18% 100%,12% 72%,0 72%);
        }
        .kt-pillar-glyph {
          position:absolute;
          left:50%;
          top:50%;
          transform:translate(-50%,-50%) rotate(-90deg);
          color:#d892ff;
          font-size:12px;
          letter-spacing:.25em;
          text-shadow:0 0 8px #b86bff, 0 0 16px rgba(0,255,65,.18);
          opacity:.72;
        }

        .kt-header {
          border-bottom: 2px solid #00ff41;
          padding-bottom: 10px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .kt-title {
          font-size: 24px;
          text-shadow: 0 0 10px #00ff41;
          animation: kt-pulse 2s infinite;
        }
        @keyframes kt-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .kt-artist-badge {
          display: inline-block;
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid #00ffff;
          color: #00ffff;
          padding: 2px 8px;
          margin-left: 10px;
          font-size: 12px;
          text-transform: uppercase;
        }
        .kt-status { font-size: 14px; color: #008f11; }
        .kt-gallery-exit { background:rgba(176,0,255,.08); border:1px solid #b000ff; color:#d7a8ff; padding:4px 8px; font:inherit; font-size:12px; cursor:pointer; text-shadow:0 0 7px rgba(176,0,255,.7); }
        .kt-gallery-exit:hover { background:rgba(176,0,255,.22); color:#fff; }
        .kt-audio-success { color: #00ff41; }
        .kt-audio-warning { color: #ffaa00; }
        .kt-audio-error { color: #ff3333; }

        .kt-glitch {
          position: relative;
          animation: kt-glitch-skew 1s infinite;
        }
        @keyframes kt-glitch-skew {
          0% { transform: skew(0deg); } 20% { transform: skew(-2deg); }
          40% { transform: skew(2deg); } 60% { transform: skew(0deg); }
          80% { transform: skew(1deg); } 100% { transform: skew(0deg); }
        }

        .kt-ascii-deck { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:10px; min-height:128px; flex:0 0 auto; }
        .kt-ascii-card { appearance:none; width:100%; padding:0; margin:0; color:inherit; font:inherit; text-align:left; cursor:pointer; position:relative; overflow:hidden; border:1px solid #008f11; background:radial-gradient(circle at 50% 50%,rgba(0,255,65,.08),rgba(13,2,8,.94) 68%); min-height:128px; transition:transform .14s ease,border-color .14s ease,filter .14s ease,box-shadow .14s ease; }
        .kt-ascii-card:hover,.kt-ascii-card:focus-visible { transform:translateY(-2px); filter:brightness(1.16); border-color:#00ffff; outline:none; box-shadow:inset 0 0 22px rgba(0,255,65,.12),0 0 14px rgba(0,255,255,.22); }
        .kt-ascii-card:active { transform:translateY(0) scale(.99); }
        .kt-ascii-card { box-shadow:inset 0 0 22px rgba(0,255,65,.08),0 0 9px rgba(255,0,255,.08); }
        .kt-ascii-card::before { content:'☉  ☽  ☿  ♀  ♂  ♃  ♄  🜍  🜔'; position:absolute; left:0; right:0; bottom:3px; text-align:center; font-size:8px; letter-spacing:.18em; color:#00ffff; opacity:.32; text-shadow:0 0 6px #00ffff; animation:kt-sigil-stream 5s steps(16) infinite; }
        .kt-ascii-label { position:absolute; top:5px; left:8px; z-index:4; color:#008f11; font-size:10px; letter-spacing:.12em; max-width:72%; }
        .kt-scene-tag { position:absolute; right:6px; bottom:13px; z-index:5; padding:2px 4px; border:1px solid rgba(0,255,255,.24); background:rgba(3,5,9,.82); color:#00ffff; font-size:7px; letter-spacing:.08em; text-shadow:0 0 6px rgba(0,255,255,.45); }
        .kt-taino-card .kt-ascii-label,.kt-taino-card .kt-scene-tag{color:#ffb000;border-color:rgba(255,176,0,.5);text-shadow:0 0 7px rgba(255,176,0,.72)}
        .kt-globe-card .kt-ascii-label,.kt-globe-card .kt-scene-tag{color:#00ff91;border-color:rgba(0,255,145,.5);text-shadow:0 0 7px rgba(0,255,145,.72)}
        .kt-diamond-card .kt-ascii-label,.kt-diamond-card .kt-scene-tag{color:#00ffff;border-color:rgba(0,255,255,.5);text-shadow:0 0 7px rgba(0,255,255,.72)}
        .kt-tesseract-card .kt-ascii-label,.kt-tesseract-card .kt-scene-tag{color:#ff3b3b;border-color:rgba(255,59,59,.55);text-shadow:0 0 8px rgba(255,59,59,.8)}
        .kt-moon-card .kt-ascii-label,.kt-moon-card .kt-scene-tag{color:#d8e6ff;border-color:rgba(216,230,255,.48);text-shadow:0 0 7px rgba(216,230,255,.72)}
        .kt-rocket-card .kt-ascii-label,.kt-rocket-card .kt-scene-tag{color:#ffb000;border-color:rgba(255,176,0,.55);text-shadow:0 0 8px rgba(255,176,0,.78)}

        .kt-taino-stage,.kt-tesseract-stage,.kt-globe-stage,.kt-diamond-stage,.kt-moon-stage,.kt-rocket-stage { position:absolute; inset:18px 0 0; display:flex; align-items:center; justify-content:center; perspective:380px; }
        .kt-tesseract-card { background:radial-gradient(circle at 50% 50%,rgba(255,45,65,.18),rgba(255,0,120,.055) 42%,rgba(13,2,8,.97) 72%); border-color:rgba(255,72,72,.68); box-shadow:inset 0 0 22px rgba(255,55,75,.11),0 0 12px rgba(255,35,80,.16); }
        .kt-taino-card { background:radial-gradient(circle at 50% 48%,rgba(255,176,0,.12),rgba(0,255,65,.035) 48%,rgba(13,2,8,.97) 75%); }
        .kt-taino-symbol { position:relative; z-index:2; margin:0; white-space:pre; text-align:center; color:#ffb000; font:8px/.84 'Share Tech Mono',monospace; text-shadow:0 0 5px rgba(255,176,0,.85),0 0 14px rgba(0,255,65,.24); animation:kt-taino-glow 1.7s steps(6) infinite; }
        .kt-taino-noise { position:absolute; inset:6px 4px 0; z-index:1; margin:0; overflow:hidden; color:#00ff41; font:7px/.9 'Share Tech Mono',monospace; white-space:pre; text-align:center; opacity:.24; text-shadow:0 0 6px rgba(0,255,65,.9); animation:kt-binary-flash .72s steps(2,end) infinite; }
        .kt-globe,.kt-diamond { margin:0; white-space:pre; text-align:center; transform-origin:center; }
        .kt-globe { color:#00ff91; font:8px/.82 'Share Tech Mono',monospace; text-shadow:0 0 5px rgba(0,255,145,.8),0 0 13px rgba(0,255,255,.28); animation:kt-torus-glow 1.8s steps(6) infinite; will-change:filter; }
        .kt-globe-card { background:radial-gradient(circle at 50% 48%,rgba(0,255,145,.12),rgba(0,255,255,.035) 45%,rgba(13,2,8,.97) 75%); }
        @keyframes kt-torus-glow { 0%,100%{filter:brightness(.9) contrast(1.08)} 50%{filter:brightness(1.16) contrast(1.18)} }
        .kt-diamond { margin:0; white-space:pre; text-align:center; transform-origin:center; }
        .kt-dodeca { color:#ffb000; font:9px/.95 'Share Tech Mono',monospace; text-shadow:0 0 6px rgba(255,176,0,.7),0 0 13px rgba(255,0,255,.22); animation:kt-poly-spin 4.6s steps(32) infinite; }
        .kt-diamond { color:#00ffff; font:9px/.82 'Share Tech Mono',monospace; text-shadow:0 0 7px rgba(0,255,255,.9),0 0 15px rgba(255,0,255,.34); animation:kt-gem-glow 1.6s steps(6) infinite; will-change:filter; }
        .kt-dodeca-card { background:radial-gradient(circle at 50% 50%,rgba(255,176,0,.10),rgba(13,2,8,.96) 68%); }
        .kt-diamond-card { background:radial-gradient(circle at 50% 48%,rgba(0,255,255,.13),rgba(255,0,255,.035) 46%,rgba(13,2,8,.97) 74%); }
        .kt-moon { margin:0; white-space:pre; text-align:center; color:#d8e6ff; font:8px/.82 'Share Tech Mono',monospace; text-shadow:0 0 6px rgba(216,230,255,.8),0 0 13px rgba(0,255,255,.24); animation:kt-moon-glow 2.4s steps(8) infinite; }
        .kt-moon-card { background:radial-gradient(circle at 50% 48%,rgba(180,205,255,.12),rgba(0,255,255,.025) 44%,rgba(13,2,8,.97) 75%); }
        .kt-rocket { margin:0; white-space:pre; text-align:center; color:#ffb000; font:8px/.82 'Share Tech Mono',monospace; text-shadow:0 0 6px rgba(255,176,0,.84),0 0 14px rgba(255,0,255,.24); animation:kt-rocket-glow 1.7s steps(8) infinite; }
        .kt-rocket-card { background:radial-gradient(circle at 50% 48%,rgba(255,176,0,.11),rgba(255,0,255,.025) 46%,rgba(13,2,8,.97) 75%); }
        @keyframes kt-moon-glow { 0%,100%{filter:brightness(.88) contrast(1.08)} 50%{filter:brightness(1.15) contrast(1.18)} }
        @keyframes kt-rocket-glow { 0%,100%{filter:brightness(.9) contrast(1.08)} 50%{filter:brightness(1.26) contrast(1.22)} }
        @keyframes kt-poly-spin { to { transform:rotateY(360deg) rotateZ(360deg); } }
        @keyframes kt-gem-glow { 0%,100% { filter:brightness(.9) contrast(1.08); } 50% { filter:brightness(1.22) contrast(1.2); } }
        .kt-tesseract-face { margin:0; color:#ff3b3b; font:11px/.94 'Share Tech Mono',monospace; white-space:pre; text-align:center; text-shadow:0 0 6px rgba(255,59,59,.98),0 0 14px rgba(255,0,70,.5),0 0 22px rgba(255,90,90,.2); transform-origin:center; animation:kt-tesseract-pulse 1.9s steps(8) infinite; will-change:transform,filter; }
        @keyframes kt-sigil-stream { 0%,100%{transform:translateX(-3px);opacity:.22} 50%{transform:translateX(3px);opacity:.5} }
        @keyframes kt-taino-glow { 0%,100%{filter:brightness(.88) contrast(1.08)} 50%{filter:brightness(1.24) contrast(1.22)} }
        @keyframes kt-binary-flash { 0%,45%{opacity:.12} 46%,100%{opacity:.42} }
        @keyframes kt-tesseract-pulse { 0%,100%{transform:scale(.96);filter:brightness(.92) contrast(1.08)} 50%{transform:scale(1.045);filter:brightness(1.35) contrast(1.22)} }
        .kt-ritual-off .kt-ascii-card * { animation-play-state:paused !important; }
        .kt-ritual-idle .kt-ascii-card { opacity:.58; filter:saturate(.55) brightness(.72); }
        .kt-ritual-playing .kt-taino-symbol { animation-duration:calc(2s - (var(--ritual-power) * .9s)); text-shadow:0 0 calc(7px + var(--ritual-power) * 16px) rgba(255,176,0,.92),0 0 15px rgba(0,255,65,.3); }
        .kt-ritual-playing .kt-globe { animation-duration:calc(6.5s - (var(--ritual-power) * 2.8s)); }\n        .kt-ritual-playing .kt-diamond { animation-duration:calc(4s - (var(--ritual-power) * 2s)); }
        .kt-ritual-playing .kt-tesseract-face { animation-duration:calc(2.2s - (var(--ritual-power) * 1.0s)); text-shadow:0 0 calc(7px + var(--ritual-power) * 16px) rgba(255,59,59,.98),0 0 calc(12px + var(--ritual-power) * 20px) rgba(255,0,90,.48); }
        .kt-ritual-playing .kt-moon { animation-duration:calc(2.8s - (var(--ritual-power) * 1.0s)); }
        .kt-ritual-playing .kt-rocket { animation-duration:calc(2.0s - (var(--ritual-power) * .8s)); }
        .kt-ritual-playing .kt-eye { text-shadow:0 0 calc(7px + var(--ritual-power) * 15px) rgba(255,0,255,.9); }
        .kt-ascii-card::after { content:''; position:absolute; inset:0; pointer-events:none; opacity:.28; background-image:radial-gradient(circle,rgba(0,255,65,.65) 0 1px,transparent 1px); background-size:4px 4px; mix-blend-mode:screen; box-shadow:inset 0 0 0 1px rgba(255,176,0,.08); }
        @media(max-width:768px){ .kt-ascii-deck{grid-template-columns:1fr 1fr;grid-auto-rows:188px;min-height:0;flex:none}.kt-ascii-card{min-height:188px;height:188px;flex:none}.kt-ascii-label{font-size:9px;line-height:1.25;max-width:68%}.kt-scene-tag{font-size:6px;bottom:12px}.kt-taino-symbol{font-size:7px}.kt-taino-noise{font-size:6px}.kt-moon,.kt-rocket{font-size:7px}.kt-tesseract-face{font-size:8px;line-height:.9} }
        @media(prefers-reduced-motion:reduce){ .kt-taino-symbol,.kt-taino-noise,.kt-tesseract-face,.kt-globe,.kt-diamond,.kt-moon,.kt-rocket,.kt-ascii-card::before{animation:none} }

        .kt-cli-console {
          flex: 0 0 auto;
          border: 1px solid #00ff41;
          background: rgba(0, 8, 3, 0.94);
          box-shadow: inset 0 0 22px rgba(0,255,65,.08), 0 0 10px rgba(0,255,65,.08);
          margin-bottom: 10px;
          min-height: 150px;
          max-height: 30vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .kt-cli-console .kt-terminal {
          border: 0;
          border-bottom: 1px solid #008f11;
          min-height: 90px;
          flex: 1;
        }
        .kt-cli-console .kt-input-line {
          margin: 0;
          border-top: 0;
          padding: 9px 10px;
          background: rgba(0, 18, 5, .72);
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .kt-cli-console { min-height: 126px; max-height: 24vh; }
          .kt-cli-console .kt-terminal { min-height: 72px; max-height: 15vh; }
        }

        .kt-visualizer-container {
          flex: 0 0 auto;
          height: 100px;
          border: 1px solid #008f11;
          margin-bottom: 10px;
          position: relative;
          background: rgba(0, 20, 0, 0.3);
          overflow: hidden;
        }
        .kt-canvas { width: 100%; height: 100%; display: block; }

        .kt-progress-container {
          flex: 0 0 auto;
          width: 100%;
          height: 4px;
          background: #0d0208;
          border: 1px solid #008f11;
          position: relative;
        }
        .kt-progress-bar {
          height: 100%;
          background: #00ff41;
          transition: width 0.1s linear;
          box-shadow: 0 0 10px #00ff41;
        }
        .kt-track-info {
          flex: 0 0 auto;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-top: 5px;
          margin-bottom: 10px;
          color: #008f11;
        }

        /* Click-to-play area */
        .kt-click-play {
          flex: 0 0 auto;
          border: 1px dashed #00ffff;
          padding: 12px 15px;
          margin-bottom: 10px;
          background: rgba(0, 255, 255, 0.05);
          max-height: 160px;
          overflow-y: auto;
        }
        .kt-click-play::-webkit-scrollbar { width: 6px; }
        .kt-click-play::-webkit-scrollbar-track { background: #0d0208; }
        .kt-click-play::-webkit-scrollbar-thumb { background: #008f11; }
        .kt-click-header {
          font-size: 12px;
          color: #008f11;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .kt-track-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .kt-track-item {
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.3s;
          border-left: 2px solid transparent;
          font-size: 14px;
          color: #00ff41;
          display: flex;
          align-items: center;
          min-height: 36px;
          -webkit-tap-highlight-color: rgba(0, 255, 65, 0.2);
        }
        .kt-track-item:active {
          background: rgba(0, 255, 65, 0.15);
        }
        .kt-track-item:hover {
          background: rgba(0, 255, 65, 0.1);
          border-left: 2px solid #00ff41;
          padding-left: 14px;
        }
        .kt-track-item.kt-playing {
          background: rgba(0, 255, 65, 0.2);
          border-left: 2px solid #ff00ff;
          color: #ff00ff;
        }
        .kt-track-number { color: #008f11; margin-right: 8px; flex-shrink: 0; }
        .kt-track-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
        .kt-track-plays { color: #008f11; font-size: 11px; margin-left: 10px; flex-shrink: 0; }

        @media (max-width: 768px) {
          .kt-regal-pillar { display:none; }
          .kt-track-item {
            padding: 12px 10px;
            font-size: 15px;
            min-height: 44px;
          }
          .kt-track-plays { font-size: 12px; }
          .kt-container { padding: 10px; }
          .kt-title { font-size: 18px; }
          .kt-terminal { padding: 10px; font-size: 13px; }
          .kt-click-play { padding: 10px; }
          .kt-visualizer-container { height: 80px; }
        }

        .kt-terminal {
          flex: 1;
          overflow-y: auto;
          border: 1px solid #008f11;
          background: rgba(0, 10, 0, 0.8);
          padding: 15px;
          font-size: 15px;
          line-height: 1.6;
          box-shadow: inset 0 0 20px rgba(0, 255, 65, 0.1);
        }
        .kt-terminal::-webkit-scrollbar { width: 10px; }
        .kt-terminal::-webkit-scrollbar-track { background: #0d0208; border-left: 1px solid #008f11; }
        .kt-terminal::-webkit-scrollbar-thumb { background: #00ff41; border: 1px solid #0d0208; }

        .kt-input-line {
          display: flex;
          align-items: center;
          margin-top: 10px;
          border-top: 1px solid #008f11;
          padding-top: 10px;
        }
        .kt-prompt { color: #00ff41; margin-right: 10px; font-weight: bold; white-space: nowrap; display:flex; align-items:center; gap:8px; }
        .kt-bashrc { display:inline-flex; align-items:center; gap:0; text-shadow:none; }
        .kt-bashrc-mark { color:#9d4edd; text-shadow:0 0 7px rgba(157,78,221,.5); }
        .kt-bashrc-k { color:#ff2b2b; font-weight:900; text-shadow:0 0 8px rgba(255,43,43,.82); }
        .kt-bashrc-at { color:#7b2cbf; }
        .kt-bashrc-the {
          color:#050505;
          background:#00ff41;
          padding:0 2px;
          margin-left:1px;
          text-shadow:none;
          box-shadow:0 0 5px rgba(0,255,65,.42);
        }
        .kt-bashrc-emrld {
          color:#00ff41;
          background:#050505;
          padding:0 2px;
          text-shadow:0 0 7px rgba(0,255,65,.72);
        }
        .kt-shell-op, .tc-shell-op { color:#ffaa00; }
        .tc-command-name { color:#00ffff; font-weight:bold; }
        .tc-arg { color:#f5f5f5; }
        .kt-game-shell { position:fixed; inset:10px; z-index:50; background:#050805; border:2px solid #00ff41; box-shadow:0 0 28px rgba(0,255,65,.35); display:flex; flex-direction:column; }
        .kt-game-toolbar { min-height:42px; padding:8px 12px; border-bottom:1px solid #00ff41; display:flex; align-items:center; justify-content:space-between; gap:12px; background:#071007; color:#00ff41; font-size:13px; }
        .kt-game-actions { display:flex; gap:12px; align-items:center; }
        .kt-game-actions a, .kt-game-actions button { color:#00ffff; background:transparent; border:0; font:inherit; cursor:pointer; text-decoration:none; }
        .kt-game-frame-wrap { flex:1; min-height:0; position:relative; overflow:hidden; background:#000; }
        .kt-game-frame { width:100%; height:100%; border:0; display:block; filter:saturate(.82) contrast(1.08) brightness(.9) sepia(.08); }
        .kt-game-scanlines { position:absolute; inset:0; pointer-events:none; z-index:2; background:repeating-linear-gradient(to bottom,rgba(0,0,0,0) 0 2px,rgba(0,0,0,.22) 2px 4px); mix-blend-mode:multiply; }
        .kt-game-vignette { position:absolute; inset:0; pointer-events:none; z-index:3; box-shadow:inset 0 0 90px 28px rgba(0,0,0,.62); border-radius:2px; }
        @media (max-width:768px) { .kt-game-shell { inset:4px; } .kt-game-toolbar { font-size:11px; flex-wrap:wrap; } .kt-game-actions { gap:8px; } }
        .kt-input {
          background: transparent;
          border: none;
          color: #00ff41;
          font-family: 'Share Tech Mono', monospace;
          font-size: 15px;
          flex: 1;
          outline: none;
          caret-color: #00ff41;
        }
        .kt-cursor {
          display: inline-block;
          width: 10px;
          height: 18px;
          background: #00ff41;
          animation: kt-blink 1s infinite;
          margin-left: 2px;
          flex-shrink: 0;
        }
        @keyframes kt-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }

        /* Terminal color classes */
        .tc-prompt { color: #00ff41; font-weight: bold; }
        .tc-command { color: #00ff41; }
        .tc-response { color: #008f11; margin-left: 20px; }
        .tc-error { color: #ff3333; }
        .tc-success { color: #00ff41; }
        .tc-warning { color: #ffaa00; }
        .tc-cyan { color: #00ffff; }
      `}</style>
    </div>
  );
}
