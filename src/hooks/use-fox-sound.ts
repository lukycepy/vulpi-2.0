"use client";

import { useCallback } from "react";

export function useFoxSound() {
  const playSwoosh = useCallback(() => {
    try {
      const audio = new Audio("/sounds/swoosh.mp3");
      audio.volume = 0.5;
      audio.play().catch((e) => {
        console.error("Failed to play sound:", e);
      });
    } catch (e) {
      console.error("Audio API not supported or error:", e);
    }
  }, []);

  return { playSwoosh };
}
