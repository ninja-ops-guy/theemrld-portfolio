export type KGalleryArtPiece = {
  id: string;
  label: string;
  title: string;
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accent: string;
};

export const K_GALLERY_ART: KGalleryArtPiece[] = [
  { id: 'cope', label: 'A', title: 'COPE', file: 'smokegirl.webp', x: 13.65, y: 4.2, width: 1.7, height: 2.1, accent: '#ff5266' },
  { id: 'fear', label: 'B', title: 'FEAR', file: 'fear.webp', x: 13.65, y: 6.8, width: 1.55, height: 1.95, accent: '#ff3bd4' },
  { id: 'death-eater', label: 'C', title: 'DEATH EATER', file: 'death-eater.webp', x: 13.65, y: 9.5, width: 2.35, height: 1.55, accent: '#c66dff' },
  { id: 'wolf', label: 'D', title: 'SIGNAL HOUND', file: 'wolf.webp', x: 13.65, y: 12.7, width: 1.8, height: 1.8, accent: '#00d9ff' },
  { id: 'garden', label: 'E', title: 'ORCHARD SIGNAL', file: 'garden.webp', x: 18.2, y: 14.2, width: 2.05, height: 1.7, accent: '#ff4a98' },
  { id: 'meteor', label: 'F', title: 'METEOR / RABBIT', file: 'meteor.webp', x: 22.0, y: 14.2, width: 1.55, height: 2.05, accent: '#ff9b42' },
  { id: 'cathedral', label: 'G', title: 'STAIR / CATHEDRAL', file: 'cathedral.webp', x: 26.0, y: 14.2, width: 1.8, height: 1.8, accent: '#7a78ff' },
  { id: 'blue-map', label: 'H', title: 'BLUE RELIC', file: 'blue-map.webp', x: 34.35, y: 4.6, width: 1.8, height: 1.8, accent: '#00bfff' },
  { id: 'neon-cosmos', label: 'I', title: 'NEON COSMOS', file: 'neon-cosmos.webp', x: 34.35, y: 7.7, width: 1.8, height: 1.8, accent: '#63ffd8' },
  { id: 'equations', label: 'J', title: 'EQUATION STUDY', file: 'equations.webp', x: 34.35, y: 11.0, width: 2.15, height: 1.75, accent: '#00ff91' },
];

export const K_GALLERY_ASSET = (file: string) => `${import.meta.env.BASE_URL}assets/gallery/${file}`;
