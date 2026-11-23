export function createMediaHandoff(options: {
  pauseMusic: () => void;
  media: () => Iterable<HTMLMediaElement>;
}): {
  playClip: (clip: HTMLMediaElement) => void;
  playMusic: () => void;
  observeMusic: (status: string) => void;
};
