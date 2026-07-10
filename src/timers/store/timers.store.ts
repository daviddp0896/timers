import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GENERAL_ID } from '@/timers/data/categories.data';

// The persisted, restorable core of the timer state (used for undo + persistence).
interface TimersSnapshot {
  elapsed: Record<string, number>;
  runningId: string | null;
  startedAt: number | null;
  generalOn: boolean;
}

// Global timer state, persisted to localStorage so the day's data survives reloads
// (Rule 4). Exactly one entity counts at a time: a category activity, the general
// (unclassified) timer, or nothing.
interface TimersState extends TimersSnapshot {
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
  // Snapshot of the timers taken right before the last reset, so it can be undone.
  // Transient (not persisted) — a single-level undo for accidental resets.
  undo: TimersSnapshot | null;

  // Start/stop a category activity. Starting commits & pauses whatever ran and
  // auto-starts the day (enables the general timer); pausing resumes the general
  // timer since the day is now enabled (one-at-a-time).
  toggle: (id: string) => void;
  // The green button. Off → start the day (begin counting the unclassified timer).
  // On → finish the day (pause every timer).
  toggleDay: () => void;
  // The pause button. Pauses the running activity and resumes the unclassified
  // timer. Only meaningful while a category activity runs (no-op otherwise).
  pauseToGeneral: () => void;
  // Clear a single activity's time. The time it held is NOT lost — it moves to the
  // unclassified timer. Resetting pauses the activity (resumes the unclassified timer).
  resetActivity: (id: string) => void;
  // Restore the snapshot captured by the last reset (undo). No-op if none exists.
  undoReset: () => void;
  // Move one minute (60s) FROM the unclassified timer INTO an activity, bounded by
  // how much the unclassified timer holds. Conserves the day's total time.
  addMinute: (id: string) => void;
  // Move one minute (60s) FROM an activity BACK to the unclassified timer, bounded by
  // how much the activity holds. Conserves the day's total time.
  subtractMinute: (id: string) => void;
  // Reset every activity + the general timer back to zero for a new day.
  resetAll: () => void;
  // Live elapsed seconds for an entity, including the running delta at `now`.
  elapsedOf: (id: string, now: number) => number;
  // Total live seconds across every timer (all activities + the general timer).
  totalElapsedSeconds: (now: number) => number;
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
      undo: null,

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
          // Starting this activity → it counts, general auto-pauses, and the day is
          // auto-started so the general timer resumes once this activity is paused.
          set({ ...committed, runningId: id, startedAt: now, generalOn: true });
        }
      },

      toggleDay: () => {
        const state = get();
        const now = Date.now();
        const committed = commit(state, now);

        if (state.generalOn) {
          // Finish the day → pause every timer.
          set({ ...committed, generalOn: false });
        } else {
          // Start the day → begin counting the unclassified timer.
          set({ ...committed, generalOn: true, runningId: GENERAL_ID, startedAt: now });
        }
      },

      pauseToGeneral: () => {
        const state = get();
        const now = Date.now();
        // Only meaningful while a category activity runs; the unclassified timer is
        // already counting (or nothing is) otherwise.
        if (state.runningId === null || state.runningId === GENERAL_ID) return;
        const committed = commit(state, now);
        set({ ...committed, runningId: GENERAL_ID, startedAt: now, generalOn: true });
      },

      resetActivity: (id) => {
        const state = get();
        const now = Date.now();
        const running = state.runningId === id;
        // Snapshot the exact pre-reset state so the move can be undone (Rec #4).
        const undo: TimersSnapshot = {
          elapsed: state.elapsed,
          runningId: state.runningId,
          startedAt: state.startedAt,
          generalOn: state.generalOn,
        };
        // Whatever this activity currently shows (base + live delta while running).
        const current =
          (state.elapsed[id] ?? 0) +
          (running && state.startedAt !== null ? Math.max(0, (now - state.startedAt) / 1000) : 0);

        // The activity's time is not thrown away — it moves to the unclassified timer.
        const nextElapsed = {
          ...state.elapsed,
          [GENERAL_ID]: (state.elapsed[GENERAL_ID] ?? 0) + current,
          [id]: 0,
        };

        // Resetting pauses the activity; resume the unclassified timer if the day is on.
        if (running) {
          set({
            elapsed: nextElapsed,
            runningId: state.generalOn ? GENERAL_ID : null,
            startedAt: state.generalOn ? now : null,
            undo,
          });
        } else {
          set({ elapsed: nextElapsed, undo });
        }
      },

      undoReset: () => {
        const { undo } = get();
        if (undo === null) return;
        set({ ...undo, undo: null });
      },

      addMinute: (id) => {
        const state = get();
        const now = Date.now();
        // Fold the live running delta into `elapsed` first so the transfer uses the
        // true on-screen time, then resume the same timer from now (Rec #1).
        const committed = commit(state, now);
        const elapsed = committed.elapsed ?? state.elapsed;
        const available = elapsed[GENERAL_ID] ?? 0;
        const move = Math.min(60, available);
        set({
          elapsed: { ...elapsed, [GENERAL_ID]: available - move, [id]: (elapsed[id] ?? 0) + move },
          runningId: state.runningId,
          startedAt: state.runningId !== null ? now : null,
        });
      },

      subtractMinute: (id) => {
        const state = get();
        const now = Date.now();
        const committed = commit(state, now);
        const elapsed = committed.elapsed ?? state.elapsed;
        const base = elapsed[id] ?? 0;
        const move = Math.min(60, base);
        set({
          elapsed: { ...elapsed, [id]: base - move, [GENERAL_ID]: (elapsed[GENERAL_ID] ?? 0) + move },
          runningId: state.runningId,
          startedAt: state.runningId !== null ? now : null,
        });
      },

      resetAll: () =>
        set({ elapsed: {}, runningId: null, startedAt: null, generalOn: false, undo: null }),

      elapsedOf: (id, now) => {
        const state = get();
        const base = state.elapsed[id] ?? 0;
        if (state.runningId === id && state.startedAt !== null) {
          return base + Math.max(0, (now - state.startedAt) / 1000);
        }
        return base;
      },

      totalElapsedSeconds: (now) => {
        const state = get();
        let total = 0;
        for (const value of Object.values(state.elapsed)) total += value;
        if (state.runningId !== null && state.startedAt !== null) {
          total += Math.max(0, (now - state.startedAt) / 1000);
        }
        return total;
      },
    }),
    {
      name: 'timers-storage',
      // Only the core timer facts are persisted — never the transient `undo` buffer.
      partialize: (state): TimersSnapshot => ({
        elapsed: state.elapsed,
        runningId: state.runningId,
        startedAt: state.startedAt,
        generalOn: state.generalOn,
      }),
    },
  ),
);

// Keep multiple open tabs in sync: when another tab writes the persisted state,
// rehydrate this one so both converge instead of double-counting time (Rec #6).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'timers-storage') {
      void useTimersStore.persist.rehydrate();
    }
  });
}
