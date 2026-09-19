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
  { id: 'cope', label: 'A', title: 'COPE', file: 'smokegirl.webp', x: 14.2, y: 5.0, width: 1.9, height: 2.4, accent: '#ff5266' },
  { id: 'fear', label: 'B', title: 'FEAR', file: 'fear.webp', x: 16.6, y: 5.0, width: 1.8, height: 2.3, accent: '#ff3bd4' },
  { id: 'death-eater', label: 'C', title: 'DEATH EATER', file: 'death-eater.webp', x: 19.0, y: 5.0, width: 2.7, height: 1.8, accent: '#c66dff' },
  { id: 'wolf', label: 'D', title: 'SIGNAL HOUND', file: 'wolf.webp', x: 14.3, y: 8.2, width: 2.0, height: 2.0, accent: '#00d9ff' },
  { id: 'garden', label: 'E', title: 'ORCHARD SIGNAL', file: 'garden.webp', x: 18.0, y: 8.2, width: 2.1, height: 1.7, accent: '#ff4a98' },
  { id: 'meteor', label: 'F', title: 'METEOR / RABBIT', file: 'meteor.webp', x: 23.2, y: 8.2, width: 1.8, height: 2.4, accent: '#ff9b42' },
  { id: 'cathedral', label: 'G', title: 'STAIR / CATHEDRAL', file: 'cathedral.webp', x: 27.0, y: 8.2, width: 2.0, height: 2.0, accent: '#7a78ff' },
  { id: 'blue-map', label: 'H', title: 'BLUE RELIC', file: 'blue-map.webp', x: 31.2, y: 5.0, width: 2.0, height: 2.0, accent: '#00bfff' },
  { id: 'neon-cosmos', label: 'I', title: 'NEON COSMOS', file: 'neon-cosmos.webp', x: 33.4, y: 5.0, width: 2.0, height: 2.0, accent: '#63ffd8' },
  { id: 'equations', label: 'J', title: 'EQUATION STUDY', file: 'equations.webp', x: 31.8, y: 9.0, width: 2.6, height: 2.1, accent: '#00ff91' },
];

export const K_GALLERY_ASSET = (file: string) => `${import.meta.env.BASE_URL}assets/gallery/${file}`;
