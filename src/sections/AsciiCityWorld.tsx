import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import KTerminal from './KTerminal';

type Phase = 'explore' | 'sitting' | 'seated' | 'standing';
type Camera = { x: number; y: number; ang: number; pitch: number; height: number };
type Target = { kind: 'console' | 'relic'; label?: string } | null;

type Sign = { x: number; y: number; text: string[]; color: string; scale?: number };

type Hud = {
  area: string;
  prompt: string | null;
  fps: number;
  x: number;
  y: number;
  ang: number;
};

const WORLD_W = 40;
const WORLD_H = 32;
const FOV = Math.PI / 2.65;
const SPAWN = { x: 20.0, y: 29.0, a: -Math.PI / 2 };
const APSE_RETURN = { x: 20.0, y: 6.35, a: -Math.PI / 2 };
const SEAT = { x: 20.0, y: 4.55, a: -Math.PI / 2 };
const FONT = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

function buildMap(): string[] {
  const g = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill('#'));

  // Cathedral/gallery interior.
  for (let y = 2; y <= 12; y++) {
    for (let x = 8; x <= 31; x++) g[y][x] = ' ';
  }
  for (let x = 8; x <= 31; x++) {
    g[2][x] = 'G';
    g[12][x] = 'G';
  }
  for (let y = 2; y <= 12; y++) {
    g[y][8] = 'G';
    g[y][31] = 'G';
  }
  g[12][19] = '.';
  g[12][20] = '.';
  g[12][21] = '.';

  // Apse console and exhibit panels.
  g[3][19] = 'C';
  g[3][20] = 'C';
  for (const y of [4, 7, 10]) {
    g[y][8] = 'A';
    g[y][31] = 'A';
  }

  // Pillars inside the nave.
  for (const y of [6, 9]) {
    g[y][13] = 'P';
    g[y][26] = 'P';
  }

  // North-south rain boulevard from cathedral to lower city.
  for (let y = 12; y <= 30; y++) {
    for (let x = 17; x <= 22; x++) g[y][x] = '.';
  }

  // Cross street.
  for (let y = 19; y <= 23; y++) {
    for (let x = 3; x <= 36; x++) g[y][x] = '.';
  }

  // Lower plaza / transit court.
  for (let y = 25; y <= 30; y++) {
    for (let x = 10; x <= 29; x++) g[y][x] = '.';
  }

  // Side alleys.
  for (let y = 22; y <= 27; y++) {
    for (let x = 5; x <= 10; x++) g[y][x] = '.';
    for (let x = 29; x <= 34; x++) g[y][x] = '.';
  }

  // Neon facades on surfaces facing streets.
  for (let y = 14; y <= 29; y += 3) {
    if (g[y][16] === '#') g[y][16] = 'N';
    if (g[y][23] === '#') g[y][23] = 'N';
  }
  for (let x = 5; x <= 34; x += 4) {
    if (g[18][x] === '#') g[18][x] = 'N';
    if (g[24][x] === '#') g[24][x] = 'N';
  }

  return g.map((row) => row.join(''));
}

const MAP = buildMap();

const WALL_COLOR: Record<string, string> = {
  '#': '#26324a',
  N: '#d73cff',
  G: '#8d63d8',
  A: '#d9a83e',
  C: '#00ff66',
  P: '#75529f',
};

const SIGNS: Sign[] = [
  { x: 15.9, y: 15.5, text: ['╔══════════════╗', '║ K//THE EMRLD ║', '╚══════════════╝'], color: '#b86bff', scale: 1.2 },
  { x: 24.0, y: 17.8, text: ['┌─────────────┐', '│ TECHOPS//L3 │', '│ QUEUE:015   │', '└─────────────┘'], color: '#00ff66' },
  { x: 8.6, y: 21.0, text: ['┌─────────────┐', '│ DHCP//TRACE │', '│ PORT → HOST │', '└─────────────┘'], color: '#00d9ff' },
  { x: 31.6, y: 21.0, text: ['┌──────────────┐', '│ RESIDUAL//RT │', '│ EVIDENCE>AI  │', '└──────────────┘'], color: '#ff3bd4' },
  { x: 12.0, y: 27.0, text: ['[ P2 RECOVERY ]', 'PRODUCTION NEVER SLEEPS'], color: '#ffb000' },
  { x: 28.0, y: 27.0, text: ['[ NIGHT SHIFT ]', 'FACTORY NET // ACTIVE'], color: '#00ff91' },
  { x: 20.0, y: 3.55, text: ['╔═══════════════╗', '║  K TERMINAL 01 ║', '║  APSE CONSOLE  ║', '╚════════════════╝'], color: '#00ff66', scale: 1.18 },
  { x: 12.5, y: 7.0, text: ['SIGNAL SCRIPTURE', '01001011 // ☿'], color: '#c377ff' },
  { x: 27.5, y: 7.0, text: ['SYSTEM RELIC', 'P2 // RESIDUAL'], color: '#c377ff' },
];

function tileAt(x: number, y: number): string {
  const ix = Math.floor(x), iy = Math.floor(y);
  if (ix < 0 || iy < 0 || ix >= WORLD_W || iy >= WORLD_H) return '#';
  return MAP[iy][ix];
}

function solid(x: number, y: number): boolean {
  return '#NGACP'.includes(tileAt(x, y));
}

function castRay(px: number, py: number, dx: number, dy: number, maxDist = 40) {
  let mapX = Math.floor(px), mapY = Math.floor(py);
  const deltaX = Math.abs(1 / (dx || 1e-9));
  const deltaY = Math.abs(1 / (dy || 1e-9));
  const stepX = dx < 0 ? -1 : 1;
  const stepY = dy < 0 ? -1 : 1;
  let sideX = dx < 0 ? (px - mapX) * deltaX : (mapX + 1 - px) * deltaX;
  let sideY = dy < 0 ? (py - mapY) * deltaY : (mapY + 1 - py) * deltaY;
  let side = 0;
  for (let i = 0; i < 128; i++) {
    if (sideX < sideY) {
      sideX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      sideY += deltaY;
      mapY += stepY;
      side = 1;
    }
    if (mapX < 0 || mapY < 0 || mapX >= WORLD_W || mapY >= WORLD_H) return null;
    const tile = MAP[mapY][mapX];
    if (tile !== '.' && tile !== ' ') {
      const dist = side === 0 ? sideX - deltaX : sideY - deltaY;
      if (dist > maxDist) return null;
      return { tile, ix: mapX, iy: mapY, dist, side };
    }
  }
  return null;
}

function normAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function areaName(x: number, y: number): string {
  if (y < 5.4 && x > 9 && x < 31) return 'THE APSE // TERMINAL ALCOVE';
  if (y <= 12.5 && x > 8 && x < 32) return 'K//GALLERY // GOTHIC NAVE';
  if (y < 19) return 'CATHEDRAL APPROACH // RAIN STREET';
  if (y < 25) return 'SECTOR 7 // TECHOPS CROSSING';
  return 'LOWER CITY // NIGHT SHIFT PLAZA';
}

function miniMap(x: number, y: number, ang: number): string {
  const W = 21, H = 11;
  const px = Math.floor(x), py = Math.floor(y);
  const dirs = ['→','↘','↓','↙','←','↖','↑','↗'];
  const di = ((Math.round((ang / (Math.PI * 2)) * 8) % 8) + 8) % 8;
  const out: string[] = [];
  for (let j = 0; j < H; j++) {
    let row = '';
    for (let i = 0; i < W; i++) {
      if (i === (W >> 1) && j === (H >> 1)) { row += dirs[di]; continue; }
      const mx = px - (W >> 1) + i, my = py - (H >> 1) + j;
      if (mx < 0 || my < 0 || mx >= WORLD_W || my >= WORLD_H) { row += ' '; continue; }
      const t = MAP[my][mx];
      row += t === '#' ? '▓' : t === 'N' ? '▒' : t === 'G' ? '╫' : t === 'C' ? '▣' : t === 'A' ? '■' : t === 'P' ? '●' : '·';
    }
    out.push(row);
  }
  return out.join('\n');
}

export default function AsciiCityWorld() {
  const [params] = useSearchParams();
  const returnToConsole = params.get('spawn') === 'console';
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const phase = useRef<Phase>('explore');
  const anim = useRef(0);
  const terminalOpenRef = useRef(false);
  const targetRef = useRef<Target>(null);
  const seatFrom = useRef({ x: APSE_RETURN.x, y: APSE_RETURN.y, ang: APSE_RETURN.a, h: 1.55 });
  const lastPaint = useRef(0);
  const touchMove = useRef({ id: -1, x0: 0, y0: 0, dx: 0, dy: 0 });
  const touchLook = useRef({ id: -1, x: 0, y: 0 });
  const start = returnToConsole ? APSE_RETURN : SPAWN;
  const camRef = useRef<Camera>({ x: start.x, y: start.y, ang: start.a, pitch: 0, height: 1.55 });

  const [booted, setBooted] useState(returnToConsole);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [notice, setNotice] = useState(returnToConsole ? 'SESSION CLOSED // APSE CONSOLE // TURN AROUND TO EXPLORE K//CITY' : '');
  const [hud, setHud] = useState<Hud>({ area: areaName(start.x, start.y), prompt: null, fps: 0, x: start.x, y: start.y, ang: start.a });

  terminalOpenRef.current = terminalOpen;

  const resize = useCallback(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, wrap.clientWidth), h = Math.max(1, wrap.clientHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    const t = window.setTimeout(() => setNotice(''), 4200);
    return () => { window.removeEventListener('resize', resize); window.clearTimeout(t); };
  }, [resize]);

  const requestLock = useCallback(() => {
    if (terminalOpenRef.current) return;
    try {
      const p = canvasRef.current?.requestPointerLock?.();
      if (p && typeof (pECB1