import type { CSSProperties } from 'react';
import { isSpriteStrip, type SpriteStrip } from '../lib/bandPerformance';

type Props = {
  cell: number;
  size?: number;
  className?: string;
  glow?: boolean;
  atlas?: string;
  columns?: number;
  rows?: number;
  strip?: SpriteStrip;
};

export default function KBandSprite({ cell, size = 92, className = '', glow = false, atlas = 'assets/k-band-sheet.webp', columns = 6, rows = 4, strip }: Props) {
  const COLS = Number.isSafeInteger(columns) && columns > 0 ? columns : 6;
  const ROWS = Number.isSafeInteger(rows) && rows > 0 ? rows : 4;
  const safe = Number.isFinite(cell) ? Math.max(0, Math.min(COLS * ROWS - 1, Math.floor(cell))) : 0;
  const col = safe % COLS;
  const row = Math.floor(safe / COLS);
  const crop = isSpriteStrip(strip) ? strip : undefined;
  const y = crop ? (crop.atlasHeight === crop.height ? 0 : crop.top / (crop.atlasHeight - crop.height) * 100) : ROWS === 1 ? 0 : row / (ROWS - 1) * 100;
  const style: CSSProperties = {
    width: size,
    height: crop ? size * crop.height / crop.frameWidth : size,
    aspectRatio: crop ? `${crop.frameWidth} / ${crop.height}` : '1',
    backgroundImage: `url(${import.meta.env.BASE_URL}${atlas})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${COLS * 100}% ${crop ? crop.atlasHeight / crop.height * 100 : ROWS * 100}%`,
    backgroundPosition: `${COLS === 1 ? 0 : (col / (COLS - 1)) * 100}% ${y}%`,
    imageRendering: 'pixelated',
    filter: glow
      ? 'drop-shadow(0 0 7px rgba(0,255,65,.38)) drop-shadow(0 0 12px rgba(176,0,255,.2))'
      : undefined,
  };
  return <div className={className} style={style} aria-hidden="true" />;
}

