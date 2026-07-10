import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Global timer state, persisted to localStorage so the day's data survives reloads
// (Rule 4). Only one activity runs at a time.
interface TimersState {
  // Committed seconds per activity id (does NOT include the live running delta).
  elapsed: Record<string, number>;
  // The activity currently running, or null if none.
  runningId: string | null;
  // Epoch ms when the running activity was started.
  startedAt: number | null;

  // Start/stop an activity. Starting one commits and pauses any other (one-at-a-time).
  toggle: (id: string) => void;
  // Pause whatever is running, committing its elapsed time.
  stop: () => void;
  // Reset every activity back to zero for a new day.
  resetAll: () => void;
  // Live elapsed seconds for an activity, including the running delta at `now`.
  elapsedOf: (id: string, now: number) => number;
}

// Commits the running activity's delta into `elapsed` and clears the running flags.
const commit = (state: TimersState, now: number): Partial<TimersState> => {
  if (state.runningId === null || state.startedAt === null) return {};
  const delta = Math.max(0, (now - state.startedAt) / 1000);
  return {
    elapsed: {
      ...state.elapsed,
      [state.runningId]: (state.elapsed[state.runningId] ?? 0) + delta,
    },
    runningId: null,
    startedAt: null,
  };
};

export const useTimersStore = create<TimersState>()(
  persist(
    (set, get) => ({
      elapsed: {},
      runningId: null,
      startedAt: null,

      toggle: (id) => {
        const state = get();
        const now = Date.now();
        const wasRunning = state.runningId === id;
        // Always commit the current running timer first...
        const committed = commit(state, now);
        // ...then start this one, unless it was the one we just paused.
        set({
          ...committed,
          runningId: wasRunning ? null : id,
          startedAt: wasRunning ? null : now,
        });
      },

      stop: () => set((state) => commit(state, Date.now())),

      resetAll: () => set({ elapsed: {}, runningId: null, startedAt: null }),

      elapsedOf: (id, now) => {
        const state = get();
        const base = state.elapsed[id] ?? 0;
        if (state.runningId === id && state.startedAt !== null) {
          return base + Math.max(0, (now - state.startedAt) / 1000);
        }
        return base;
      },
    }),
    { name: 'timers-storage' },
  ),
);
