import type { CSSProperties } from 'react';

type Props = {
  cell: number;
  size?: number;
  className?: string;
  glow?: boolean;
};

const COLS = 6;
const ROWS = 4;

export default function KBandSprite({ cell, size = 92, className = '', glow = false }: Props) {
  const safe = Math.max(0, Math.min(COLS * ROWS - 1, cell));
  const col = safe % COLS;
  const row = Math.floor(safe / COLS);
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url(${import.meta.env.BASE_URL}assets/k-band-sheet.webp)`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
    imageRendering: 'pixelated',
    filter: glow
      ? 'drop-shadow(0 0 7px rgba(0,255,65,.38)) drop-shadow(0 0 12px rgba(176,0,255,.2))'
      : undefined,
  };
  return <div className={className} style={style} aria-hidden="true" />;
}
