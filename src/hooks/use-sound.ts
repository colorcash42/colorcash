
"use client";

import { useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';

export const useSound = (soundUrl: string, volume: number = 0.5) => {
  const { soundEnabled } = useAppContext();

  const play = useCallback(() => {
    if (soundEnabled) {
      try {
        // Lazily create the audio object only when needed
        const audio = new Audio(soundUrl);
        audio.crossOrigin = "anonymous"; // Fix for cross-origin loading issues
        audio.volume = volume;
        audio.play().catch(error => {
          // This catch block handles cases where autoplay is blocked by the browser,
          // which is a common policy. It's not necessarily a critical error.
          console.log(`Audio playback for ${soundUrl} was prevented. This is often expected browser behavior.`);
        });
      } catch (e) {
        console.error(`Failed to play sound from ${soundUrl}:`, e);
      }
    }
  }, [soundEnabled, soundUrl, volume]);

  return play;
};
