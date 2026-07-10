import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GENERAL_ID } from '@/timers/data/categories.data';

// Global timer state, persisted to localStorage so the day's data survives reloads
// (Rule 4). Exactly one entity counts at a time: a category activity, the general
// (unclassified) timer, or nothing.
interface TimersState {
  // Committed seconds per activity id (does NOT include the live running delta).
  // The general timer is stored here under GENERAL_ID.
  elapsed: Record<string, number>;
  // The entity currently running (an activity id, GENERAL_ID, or null).
  runningId: string | null;
  // Epoch ms when the running entity was started.
  startedAt: number | null;
  // Whether the general timer is enabled. When on, it counts during any moment no
  // category activity is running (auto-pausing / auto-resuming around them).
  generalOn: boolean;

  // Start/stop a category activity. Starting commits & pauses whatever ran; stopping
  // resumes the general timer when it is enabled (one-at-a-time).
  toggle: (id: string) => void;
  // Enable/disable the general timer via its Play button.
  toggleGeneral: () => void;
  // Pause whatever is running, committing its elapsed time.
  stop: () => void;
  // Clear a single activity's time (restart in place if it is running).
  resetActivity: (id: string) => void;
  // Reset every activity + the general timer back to zero for a new day.
  resetAll: () => void;
  // Live elapsed seconds for an entity, including the running delta at `now`.
  elapsedOf: (id: string, now: number) => number;
}

// Commits the running entity's delta into `elapsed` and clears the running flags.
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
      generalOn: false,

      toggle: (id) => {
        const state = get();
        const now = Date.now();
        const wasRunning = state.runningId === id;
        // Commit the currently running entity first (activity or general)...
        const committed = commit(state, now);

        if (wasRunning) {
          // Pausing this activity → resume the general timer if it is enabled.
          set({
            ...committed,
            runningId: state.generalOn ? GENERAL_ID : null,
            startedAt: state.generalOn ? now : null,
          });
        } else {
          // Starting this activity → it counts, general auto-pauses.
          set({ ...committed, runningId: id, startedAt: now });
        }
      },

      toggleGeneral: () => {
        const state = get();
        const now = Date.now();

        if (state.generalOn) {
          // Turn the general timer off, committing it if it was counting.
          const committed = state.runningId === GENERAL_ID ? commit(state, now) : {};
          set({ ...committed, generalOn: false });
        } else if (state.runningId === null) {
          // Enable and start counting immediately (nothing else is running).
          set({ generalOn: true, runningId: GENERAL_ID, startedAt: now });
        } else {
          // Enable, but stay paused while a category activity is running.
          set({ generalOn: true });
        }
      },

      stop: () => set((state) => commit(state, Date.now())),

      resetActivity: (id) => {
        const state = get();
        if (state.runningId === id) {
          // Restart in place: zero it but keep it running from now.
          set({ elapsed: { ...state.elapsed, [id]: 0 }, startedAt: Date.now() });
        } else {
          set({ elapsed: { ...state.elapsed, [id]: 0 } });
        }
      },

      resetAll: () =>
        set({ elapsed: {}, runningId: null, startedAt: null, generalOn: false }),

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
