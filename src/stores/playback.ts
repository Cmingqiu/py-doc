import { create } from "zustand";
import type { Step } from "@/types/visualizer";

interface PlaybackState {
  steps: Step[];
  currentStep: number;
  isPlaying: boolean;
  speed: number;
  setSteps: (steps: Step[]) => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  steps: [],
  currentStep: -1,
  isPlaying: false,
  speed: 1,

  setSteps: (steps) => set({ steps, currentStep: -1 }),

  next: () =>
    set((s) => ({
      currentStep: Math.min(s.currentStep + 1, s.steps.length - 1),
    })),

  prev: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

  goTo: (index) => set({ currentStep: index }),

  play: () => {
    set({ isPlaying: true });
    const { speed, steps, currentStep } = get();
    const delay = 1000 / speed;
    let step = currentStep;

    const tick = () => {
      const s = get();
      if (!s.isPlaying || step >= steps.length - 1) {
        set({ isPlaying: false });
        return;
      }
      step++;
      set({ currentStep: step });
      setTimeout(tick, delay);
    };

    setTimeout(tick, delay);
  },

  pause: () => set({ isPlaying: false }),

  setSpeed: (speed) => set({ speed }),

  reset: () => set({ currentStep: -1, isPlaying: false }),
}));
