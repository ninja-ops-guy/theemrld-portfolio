/** Last playback wins. Pausing/ending never restarts a displaced source. */
export function createMediaHandoff({ pauseMusic, media }) {
  let sharedStatus = 'idle';
  const pauseClips = except => {
    for (const clip of media()) if (clip !== except && !clip.paused) clip.pause();
  };
  return {
    playClip(clip) { pauseClips(clip); pauseMusic(); },
    playMusic() { pauseClips(null); },
    observeMusic(status) {
      // State broadcasts repeat while playing: they must not steal priority
      // back from a clip while the shared player's pause is in flight.
      if (status === 'playing' && sharedStatus !== 'playing') pauseClips(null);
      sharedStatus = status;
    },
  };
}
