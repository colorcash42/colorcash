"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';

export const useSound = (soundUrl: string, volume: number = 0.5) => {
  const { soundEnabled } = useAppContext();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Audio is a browser-only API. Only initialize it on the client.
    const audioInstance = new Audio(soundUrl);
    audioInstance.volume = volume;
    setAudio(audioInstance);
  }, [soundUrl, volume]);

  const play = useCallback(() => {
    if (soundEnabled && audio) {
      audio.currentTime = 0; // Rewind to the start
      audio.play().catch(error => {
        // Autoplay was prevented.
        console.error("Audio play failed:", error);
      });
    }
  }, [audio, soundEnabled]);

  return play;
};
