export type KGalleryArtPiece = {
  id: string;
  label: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accent: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

export const K_GALLERY_ATLAS = `${import.meta.env.BASE_URL}assets/gallery/k-gallery-atlas.webp`;

export const K_GALLERY_ART: KGalleryArtPiece[] = [
  { id: 'cope', label: 'A', title: 'COPE', x: 13.65, y: 4.2, width: 1.7, height: 2.1, accent: '#ff5266', sx: 6, sy: 6, sw: 308, sh: 308 },
  { id: 'fear', label: 'B', title: 'FEAR', x: 13.65, y: 6.8, width: 1.55, height: 1.95, accent: '#ff3bd4', sx: 326, sy: 6, sw: 308, sh: 308 },
  { id: 'death-eater', label: 'C', title: 'DEATH EATER', x: 13.65, y: 9.5, width: 2.35, height: 1.55, accent: '#c66dff', sx: 646, sy: 57, sw: 308, sh: 205 },
  { id: 'wolf', label: 'D', title: 'SIGNAL HOUND', x: 13.65, y: 12.7, width: 1.8, height: 1.8, accent: '#00d9ff', sx: 966, sy: 6, sw: 308, sh: 308 },
  { id: 'garden', label: 'E', title: 'ORCHARD SIGNAL', x: 18.2, y: 14.2, width: 2.05, height: 1.7, accent: '#ff4a98', sx: 1286, sy: 19, sw: 308, sh: 282 },
  { id: 'meteor', label: 'F', title: 'METEOR / RABBIT', x: 22.0, y: 14.2, width: 1.55, height: 2.05, accent: '#ff9b42', sx: 44, sy: 326, sw: 231, sh: 308 },
  { id: 'cathedral', label: 'G', title: 'STAIR / CATHEDRAL', x: 26.0, y: 14.2, width: 1.8, height: 1.8, accent: '#7a78ff', sx: 326, sy: 326, sw: 308, sh: 308 },
  { id: 'blue-map', label: 'H', title: 'BLUE RELIC', x: 34.35, y: 4.6, width: 1.8, height: 1.8, accent: '#00bfff', sx: 646, sy: 328, sw: 308, sh: 303 },
  { id: 'neon-cosmos', label: 'I', title: 'NEON COSMOS', x: 34.35, y: 7.7, width: 1.8, height: 1.8, accent: '#63ffd8', sx: 966, sy: 326, sw: 307, sh: 308 },
  { id: 'equations', label: 'J', title: 'EQUATION STUDY', x: 34.35, y: 11.0, width: 2.15, height: 1.75, accent: '#00ff91', sx: 1286, sy: 338, sw: 308, sh: 284 },
];
