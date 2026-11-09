import { useLayoutEffect, useRef, type CSSProperties } from 'react';

type Props = {
  cell: number;
  size?: number;
  className?: string;
  glow?: boolean;
  blend?: boolean;
  restCell?: number;
};

const COLS = 6;
const ROWS = 4;

function cellPosition(cell: number) {
  const col = cell % COLS;
  const row = Math.floor(cell / COLS);
  return `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
}

export default function KBandSprite({ cell, size = 92, className = '', glow = false, blend = false, restCell = cell }: Props) {
  const safe = Math.max(0, Math.min(COLS * ROWS - 1, cell));
  const previousCell = useRef(safe);
  const overlay = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const previous = previousCell.current;
    previousCell.current = safe;
    const layer = overlay.current;
    if (!layer || !blend || previous === safe || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    layer.style.backgroundPosition = cellPosition(previous);
    const transition = layer.animate({ opacity: [1, 0] }, { duration: 90, easing: 'ease-out' });
    return () => transition.cancel();
  }, [safe, blend]);

  const style: CSSProperties & { '--band-rest-pose': string } = {
    '--band-rest-pose': cellPosition(restCell),
    position: 'relative',
    width: size,
    height: size,
    backgroundImage: `url(${import.meta.env.BASE_URL}assets/k-band-sheet.webp)`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: cellPosition(safe),
    imageRendering: 'pixelated',
    filter: glow
      ? 'drop-shadow(0 0 7px rgba(0,255,65,.38)) drop-shadow(0 0 12px rgba(176,0,255,.2))'
      : undefined,
  };
  return (
    <div className={className} style={style} aria-hidden="true">
      {blend && <span ref={overlay} className="kt-band-pose-fade" />}
    </div>
  );
}
