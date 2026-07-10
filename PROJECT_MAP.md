# PROJECT_MAP.md

> **Timers** — a local-first React + TypeScript SPA to time your daily activities,
> grouped by category, with per-day persistence and CSV export.

This file is the manual for the codebase. Read it before opening any source file.
Keep it updated: add files when created, remove them when deleted.

---

## Architecture

```
                    ┌──────────────────────────────┐
                    │            main.tsx            │
                    │  QueryClientProvider + Router  │
                    │  + <Toaster /> + Devtools      │
                    └───────────────┬────────────────┘
                                    │
                            app.router.tsx
                                    │
                    ┌───────────────┴────────────────┐
                    │           TimersLayout          │
                    │  header: Reset + Download CSV    │
                    │   ├─ /            CategoriesPage │
                    │   └─ /category/:id CategoryPage  │
                    └─────────────────────────────────┘

State flow:  Component → useTimersStore (zustand + persist) → localStorage
```

This app is **local-first — no REST API**. The data-source boundary (Rule 34) is
`localStorage`, owned by the Zustand `persist` store. The scaffolded `timersApi`
axios instance is unused and kept for a possible future backend.

---

## Directory Tree

```
timers/
├── index.html                 Vite HTML entry, mounts #root
├── .env.example               VITE_API_URL template
├── vite.config.ts             Vite config: react + tailwind plugins, @/ alias
├── components.json            shadcn/ui config (radix base, Nova preset)
├── CLAUDE.md                  Project rules / conventions (source of truth)
├── PROJECT_MAP.md             This file
└── src/
    ├── main.tsx               Entry: providers, router, toaster, devtools
    ├── app.router.tsx         Route tree (createBrowserRouter) + ErrorBoundary
    ├── index.css              Tailwind v4 import + shadcn theme tokens
    ├── api/
    │   └── timersApi.ts       Scaffolded axios instance (unused — local-first app)
    ├── components/
    │   ├── custom/
    │   │   └── CustomFullScreenLoading.tsx
    │   ├── routes/            Route guard components (empty)
    │   └── ui/                shadcn/ui primitives (generated)
    │       ├── alert-dialog.tsx  badge.tsx  button.tsx  card.tsx
    │       └── input.tsx  label.tsx  skeleton.tsx  sonner.tsx
    ├── interfaces/            Types shared across features (empty)
    ├── lib/
    │   ├── utils.ts           cn() class-merge helper
    │   ├── time.ts            formatDuration(), secondsToMinutes()
    │   └── csv.ts             buildActivitiesCsv(), downloadCsv()
    └── timers/                ← the activity-timers feature
        ├── interfaces/timer.interface.ts   Category, Activity, colors, report row
        ├── data/categories.data.ts         CATEGORIES (from categories.csv) + lookups
        ├── store/timers.store.ts           zustand + persist: elapsed, toggle, resetAll
        ├── hooks/useNow.tsx                 1s tick while a timer runs
        ├── components/
        │   ├── CategoryCard.tsx             colored card → category, live total
        │   ├── ActivityTimer.tsx            one activity row: elapsed + start/pause + reset
        │   ├── DayControls.tsx              green start/finish-day toggle + pause button
        │   ├── TimeLeftCard.tsx             remaining / total registered / over-budget (24h)
        │   ├── GeneralTimerCard.tsx         top "Tiempo sin clasificar" timer + +1 min
        │   ├── ResetDayButton.tsx           AlertDialog confirm → resetAll()
        │   └── DownloadCsvButton.tsx        builds + downloads the daily CSV
        ├── layouts/TimersLayout.tsx         header (title + controls) + <Outlet/>
        └── pages/
            ├── CategoriesPage.tsx           grid of category cards (landing)
            └── CategoryPage.tsx             activities of :categoryId
```

Data comes from `promt/categories.csv` (7 categories, 28 activities), hand-mapped
into `categories.data.ts`.

---

## File Reference

| File | Does | Depends on | Used by |
|---|---|---|---|
| `main.tsx` | Boots the app; mounts providers | react-query, react-router, sonner, app.router | Vite entry |
| `app.router.tsx` | Route tree + ErrorBoundary | react-router, TimersLayout, pages | main.tsx |
| `lib/time.ts` | Duration formatting + seconds→minutes | — | timers components, csv button |
| `lib/csv.ts` | Build + download the daily CSV | time, interfaces | DownloadCsvButton |
| `timers/data/categories.data.ts` | The 7 categories / 28 activities + colors | interfaces | store consumers, pages |
| `timers/store/timers.store.ts` | Timer state, one-at-a-time, general timer, per-activity + day reset, persist | zustand/persist | all timer components |
| `timers/hooks/useNow.tsx` | 1s tick while running | store | pages |
| `timers/pages/*` | Category grid + activity list | store, components, data | app.router |
| `timers/components/*` | Cards, timer rows, reset/download buttons | store, ui, lib | pages, layout |
| `components/ui/*` | shadcn primitives | radix-ui, cva | components/pages |

---

## External Libraries

| Library | Role in this project |
|---|---|
| `zustand` (+ persist) | Timer state, persisted to localStorage (the "cache") |
| `react-router` v8 | Routing (data router) |
| `axios` | Scaffolded HTTP client — unused (local-first app) |
| `@tanstack/react-query` | Available for future server state |
| `react-hook-form` + `zod` | Available for future forms |
| `tailwindcss` v4 | Styling (utility classes) |
| `shadcn/ui` (radix-ui) | UI primitives in `components/ui/` |
| `lucide-react` | Icons |
| `sonner` | Toast notifications |
| `react-error-boundary` | Render-crash boundaries around route sections |
| `clsx` + `tailwind-merge` | Class merging via `cn()` |

---

## Key Patterns

- **One entity counts at a time** — a category activity, the general timer, or nothing.
  The store commits the running one's delta on every transition (see `timers.store.ts`).
- **General (unclassified) timer** — the day is started by the green `DayControls` button
  (`toggleDay` → `generalOn`), which then toggles to "Finalizar día" (pauses every timer).
  The day also auto-starts the first time any activity runs. Once enabled the general timer
  counts whenever no category runs. The `Pausar` button (`pauseToGeneral`) pauses the running
  activity and resumes the unclassified timer — disabled once it is already counting. Exported
  in the CSV as the `Sin clasificar` row.
- **Reset moves time, never deletes it** — an activity's reset button (`resetActivity`) transfers
  its accumulated time into the unclassified timer and zeroes the activity. Resetting **pauses**
  the activity (the unclassified timer resumes if the day is on).
- **±1 minute transfers with the unclassified timer** — each activity has `+`/`−` buttons.
  `addMinute` moves 60s from the unclassified timer into the activity; `subtractMinute` moves 60s
  back. Both commit the live running delta first (so they act on true on-screen time) and are
  bounded (never negative) so the day's total time is conserved — which is why the unclassified
  timer needs no `+` button. Buttons disable when the giving side holds < 60s of live time.
- **Undo on reset** — `resetActivity` snapshots the pre-reset state into a transient `undo` buffer;
  the reset toast offers "Deshacer" (`undoReset`). `undo` is excluded from persistence via `partialize`.
- **Conservation is visible** — `TimeLeftCard` shows remaining, total registered, and an over-budget
  (> 24h) state, so corrections are seen to redistribute time, never create or destroy it.
- **Cross-tab sync** — a `storage` listener calls `persist.rehydrate()` so multiple tabs converge
  on the same state instead of double-counting.
- **Time left of day** — `TimeLeftCard` shows `24h − totalElapsedSeconds` across all timers.
- **Action layer is the data-source boundary** — only `actions/` import `timersApi` (Rule 1, 34).
- **Hooks wrap actions with react-query** — always set `staleTime`, include every dep in `queryKey` (Rule 3).
- **URL as state** for filters/pagination via `useSearchParams` (Rule 5).
- **Named exports everywhere** except lazy-loaded layouts (Rule 13).
- **`@/` alias** — never `../../` relative climbs (Rule 18).
- **Page guard order**: error → loading → missing → render (Rule 23).
