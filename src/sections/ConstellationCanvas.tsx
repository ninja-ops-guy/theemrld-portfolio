import { useEffect, useRef } from 'react';

const NUM_STARS = 500;
const STAR_SIZE = 1.5;
const STAR_GLOW = 8;
const LINE_MAX_DIST = 0.22;
const GOLDEN_ANGLE = 2.3999632298;
const TWO_PI = 6.28318530718;

function getSpherePos(idx: number): [number, number, number] {
  const f = idx;
  const y = 1.0 - (f / (NUM_STARS - 1.0)) * 2.0;
  const radius = Math.sqrt(1.0 - y * y);
  const theta = GOLDEN_ANGLE * f;
  return [Math.cos(theta) * radius, y, Math.sin(theta) * radius];
}

function getStarColor(idx: number): [number, number, number] {
  const f = idx;
  const hue = (f * 0.618033 + 0.13) % 1.0;
  const c = [
    Math.cos(hue * TWO_PI),
    Math.cos(hue * TWO_PI + TWO_PI / 3.0),
    Math.cos(hue * TWO_PI - TWO_PI / 3.0),
  ];
  return [0.5 + 0.5 * c[0], 0.5 + 0.5 * c[1], 0.5 + 0.5 * c[2]];
}

function perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1.0 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function lookAt(eye: [number, number, number], target: [number, number, number], up: [number, number, number]): Float32Array {
  const f = normalize([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]]);
  const s = normalize(cross(f, up));
  const u = cross(s, f);
  return new Float32Array([
    s[0], u[0], -f[0], 0,
    s[1], u[1], -f[1], 0,
    s[2], u[2], -f[2], 0,
    -(dot(s, eye)), -(dot(u, eye)), dot(f, eye), 1,
  ]);
}

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
}

function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      out[i * 4 + j] =
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j];
    }
  }
  return out;
}

export default function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
    }
    resize();
    window.addEventListener('resize', resize);

    const starPositions: [number, number, number][] = [];
    for (let i = 0; i < NUM_STARS; i++) {
      starPositions.push(getSpherePos(i));
    }

    let camTheta = 1.3;
    let camPhi = 0.9;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    function render() {
      const now = Date.now();

      const autoPhi = Math.PI / 2 + Math.sin(now * 0.0001) * 0.2;
      const autoTheta = now * 0.00005;
      camTheta += (autoTheta - camTheta) * 0.02;
      camPhi += (autoPhi - camPhi) * 0.02;

      const eye: [number, number, number] = [
        Math.sin(camPhi) * Math.cos(camTheta),
        Math.cos(camPhi),
        Math.sin(camPhi) * Math.sin(camTheta),
      ];

      const viewMat = lookAt(eye, [0, 0.1, 0], [0, 1, 0]);
      const projMat = perspective(60 * Math.PI / 180, w / h, 0.1, 100);
      const vpMat = mat4Multiply(projMat, viewMat);

      const t = now * 0.001;

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);

      const projected: {
        x: number; y: number; z: number; w4: number;
        color: [number, number, number]; idx: number; pos: [number, number, number];
      }[] = [];

      for (let i = 0; i < NUM_STARS; i++) {
        const base = starPositions[i];
        const swirl = t * (0.3 + 0.2 * ((i % 7) / 7)) + i * 0.1;
        const radius = 0.25 + 0.08 * Math.sin(swirl * 1.7 + i * 0.1);
        const c = Math.cos(swirl);
        const s = Math.sin(swirl);
        const pos: [number, number, number] = [
          (c * base[0] + s * base[2]) * radius + 0.04 * Math.sin(t * 0.7 + i),
          base[1] * radius + 0.06 * Math.sin(swirl * 1.3 + i * 0.2),
          (-s * base[0] + c * base[2]) * radius + 0.04 * Math.sin(t * 0.6 + i * 0.7),
        ];

        const p4 = [
          vpMat[0] * pos[0] + vpMat[4] * pos[1] + vpMat[8] * pos[2] + vpMat[12],
          vpMat[1] * pos[0] + vpMat[5] * pos[1] + vpMat[9] * pos[2] + vpMat[13],
          vpMat[2] * pos[0] + vpMat[6] * pos[1] + vpMat[10] * pos[2] + vpMat[14],
          vpMat[3] * pos[0] + vpMat[7] * pos[1] + vpMat[11] * pos[2] + vpMat[15],
        ];

        if (p4[3] <= 0) continue;

        const screenX = (p4[0] / p4[3]) * 0.5 + 0.5;
        const screenY = (p4[1] / p4[3]) * 0.5 + 0.5;
        const depth = (p4[2] / p4[3]) * 0.5 + 0.5;

        if (screenX < -0.1 || screenX > 1.1 || screenY < -0.1 || screenY > 1.1) continue;

        const color = getStarColor(i);
        projected.push({ x: screenX * w, y: (1 - screenY) * h, z: depth, w4: p4[3], color, idx: i, pos });
      }

      ctx!.globalCompositeOperation = 'lighter';
      const lineOpacity = 0.15;

      for (let i = 0; i < projected.length; i++) {
        const a = projected[i];
        if (a.z > 0.8) continue;
        const numLines = (a.idx * 7 + 3) % 3;
        for (let j = 0; j < numLines; j++) {
          const neighborIdx = (a.idx + j * 7 + 1) % NUM_STARS;
          const b = projected.find((p) => p.idx === neighborIdx);
          if (!b || b.z < 0 || b.z > 0.8) continue;
          const dist = Math.sqrt((a.pos[0] - b.pos[0]) ** 2 + (a.pos[1] - b.pos[1]) ** 2 + (a.pos[2] - b.pos[2]) ** 2);
          if (dist > LINE_MAX_DIST) continue;
          const avgDepth = (a.z + b.z) * 0.5;
          const finalAlpha = lineOpacity * (0.5 + 0.5 * (1 - avgDepth));
          if (finalAlpha < 0.005) continue;
          const r = Math.round((a.color[0] + b.color[0]) * 0.5 * 255);
          const g = Math.round((a.color[1] + b.color[1]) * 0.5 * 255);
          const bl = Math.round((a.color[2] + b.color[2]) * 0.5 * 255);
          const grad = ctx!.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, `rgba(${r},${g},${bl},${finalAlpha})`);
          grad.addColorStop(1, `rgba(${r},${g},${bl},${finalAlpha * 0.3})`);
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = 0.8;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      for (let i = 0; i < projected.length; i++) {
        const s = projected[i];
        const cycle = Math.sin(t * (0.5 + ((s.idx % 10) / 10) * 0.5) + s.idx * 0.1);
        const pulse = 0.6 + 0.4 * cycle;
        const bright = 0.7 + 0.3 * Math.sin(s.idx * 0.1 + t * 0.3);
        const brightness = pulse * bright * (0.5 + 0.5 * ((s.idx % 5) / 5));
        const alpha = brightness * (0.5 + 0.5 * (1 - s.z));
        if (alpha < 0.005) continue;
        const r = Math.round(s.color[0] * 255);
        const g = Math.round(s.color[1] * 255);
        const b_col = Math.round(s.color[2] * 255);
        const glowSize = STAR_GLOW * (0.8 + 0.4 * brightness);
        const glowGrad = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowSize);
        glowGrad.addColorStop(0, `rgba(${r},${g},${b_col},${alpha * 0.5})`);
        glowGrad.addColorStop(0.5, `rgba(${r},${g},${b_col},${alpha * 0.15})`);
        glowGrad.addColorStop(1, `rgba(${r},${g},${b_col},0)`);
        ctx!.fillStyle = glowGrad;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, glowSize, 0, Math.PI * 2);
        ctx!.fill();
        const coreSize = STAR_SIZE * (0.6 + 0.8 * brightness);
        ctx!.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, coreSize, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalCompositeOperation = 'source-over';
      const vigGrad = ctx!.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.85);
      vigGrad.addColorStop(0, 'rgba(5,10,20,0)');
      vigGrad.addColorStop(1, 'rgba(5,10,20,0.5)');
      ctx!.fillStyle = vigGrad;
      ctx!.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#050A14',
      }}
    />
  );
}
