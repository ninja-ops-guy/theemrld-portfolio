export type KAudioZone =
  | 'gallery-turnaround'
  | 'gallery-deep'
  | 'city'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'light'
  | 'dark'
  | 'car'
  | 'flight'
  | 'ambient';

export type KAudioTrack = {
  title: string;
  url: string;
};

export const K_ZONE_LABELS: Record<KAudioZone, string> = {
  'gallery-turnaround': 'GALLERY // TURNAROUND',
  'gallery-deep': 'GALLERY // INNER NAVE',
  city: 'K//CITY',
  spring: 'SUN // TROPICAL TEMPLE',
  summer: 'TORUS // EMERALD HALO',
  autumn: 'DIAMOND // PRISM CAVERNS',
  winter: 'TESSERACT // RED LABYRINTH',
  light: 'ROCKET // K-01 ORBITAL',
  dark: 'MOON // LUNAR OUTPOST',
  car: 'K//DRIVE',
  flight: 'K-01 // EVA',
  ambient: 'K//AMBIENT',
};

const T = {
  galleryTurnaround: { title: 'My Song 4DADNM Aggressive', url: 'https://soundcloud.com/raikouno/my-song-4dadnm-aggressive' },
  city: { title: 'Maybe', url: 'https://soundcloud.com/raikouno/maybe-mp3' },
  spring: { title: 'Ponderthought', url: 'https://soundcloud.com/raikouno/ponderthought' },
  winter1: { title: 'Winter', url: 'https://soundcloud.com/raikouno/winter-mp3' },
  winter2: { title: 'Winter 2', url: 'https://soundcloud.com/raikouno/winter-2-mp3' },
  dreamer: { title: 'I Was A Dreamer Once Too', url: 'https://soundcloud.com/raikouno/i-was-a-dreamer-once-too-mp3' },
  summer1: { title: "When It's All Done (Minor Dream Mix)", url: 'https://soundcloud.com/raikouno/when-its-all-done-minor-1' },
  summer2: { title: 'Star Struck Blue', url: 'https://soundcloud.com/raikouno/star-struck-blue' },
  summer3: { title: 'Lovesick', url: 'https://soundcloud.com/raikouno/lovesick-1-wav' },
  autumn1: { title: 'Hot Sauce', url: 'https://soundcloud.com/raikouno/hot-sauce-mp3' },
  autumn2: { title: 'Gandala 3', url: 'https://soundcloud.com/raikouno/gandala-3' },
  galleryDeep: { title: 'God Hands', url: 'https://soundcloud.com/raikouno/god-hands-mp3' },
  car: { title: 'Flag', url: 'https://soundcloud.com/raikouno/flag-mp3' },
  dark: { title: 'I See The Dead', url: 'https://soundcloud.com/raikouno/i-see-the-dead-mp3' },
  ambient1: { title: 'Alien Superstar', url: 'https://soundcloud.com/raikouno/alien-superstar-mp3' },
  ambient2: { title: 'G-13', url: 'https://soundcloud.com/raikouno/g-13' },
  flight: { title: 'Mirror Plane (Autotuned Rage)', url: 'https://soundcloud.com/raikouno/mirror-plane-autotuned-rage' },
} satisfies Record<string, KAudioTrack>;

export const K_ZONE_PLAYLISTS: Record<KAudioZone, KAudioTrack[]> = {
  'gallery-turnaround': [T.galleryTurnaround],
  'gallery-deep': [T.galleryDeep],
  city: [T.city, T.ambient1, T.ambient2],
  spring: [T.spring, T.ambient1, T.ambient2],
  summer: [T.summer1, T.summer2, T.summer3],
  autumn: [T.autumn1, T.autumn2],
  winter: [T.winter1, T.winter2, T.dreamer],
  light: [T.ambient1, T.ambient2],
  dark: [T.dark, T.ambient2],
  car: [T.car],
  flight: [T.flight],
  ambient: [T.ambient1, T.ambient2],
};
