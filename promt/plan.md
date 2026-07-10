# Plan — Daily Activity Timers

A client-only React SPA to time the activities you do during the day, grouped by
category, with per-day persistence and CSV export. Built on the stack and rules in
`CLAUDE.md`.

## Decisions (confirmed)

- **One timer at a time** — starting an activity auto-pauses whatever was running.
- **UI language: Spanish** (activity names are already Spanish).
- **Reset is manual** — a "Reiniciar día" button; no automatic midnight reset.
- **CSV = all 28 activities**, columns `Categoria, Actividad, Minutos`, plus a TOTAL row.
  Time is reported in **minutes** (1 decimal).

## Data model (parsed from `categories.csv`)

7 categories → 28 activities:

| Category | Activities |
|---|---|
| Rutinas | Rutina mañana, Rutina noche, Laila, Lectura |
| Comidas | Desayuno, Comida |
| Higiene | Baño, M, Regadera |
| Estudio | Estudio Code, Estudio Video, Estudio Psi, Escuela |
| Trabajo/Creación | Creación Video, Proyecto pavimento, Proyectos personales, Música, Trabajo Pagado |
| Ejercicio | Padel/Tenis, Correr, Fuerza, Estiramiento |
| Descanso | Tele, Redes, Siesta, Ocio, Otros, Proceso |

Each category gets a distinct color for a clean, modern look.

## Architecture

This is a **local-first app — no REST API**, so we deviate from the axios-oriented
rules as `CLAUDE.md` Rule 35 anticipates: the **data-source boundary is `localStorage`**,
owned by a Zustand store with the `persist` middleware (Rule 4). Timers are global
client state — exactly Zustand's job. The scaffolded `axios` instance stays unused
for now.

How timing works (survives page reloads):
- Store keeps `elapsed: Record<activityId, committedSeconds>`, plus `runningId` and
  `startedAt` (epoch ms).
- The live elapsed of the running activity = `committed + (now - startedAt)`, computed
  on each tick — we don't write every second.
- Because `startedAt` is persisted, a reload keeps the running timer accurate.
- Start/stop/switch commits `elapsed[id] += now - startedAt`.

## Files

```
src/
├── lib/
│   ├── time.ts                     formatDuration(seconds) → "H:MM:SS", secondsToMinutes()
│   └── csv.ts                      buildActivitiesCsv(rows) + downloadCsv(filename, text)
├── timers/
│   ├── interfaces/
│   │   └── timer.interface.ts      Category, Activity, CategoryColor types
│   ├── data/
│   │   └── categories.data.ts      CATEGORIES constant (typed, module-level) + colors
│   ├── store/
│   │   └── timers.store.ts         zustand + persist: elapsed, runningId, startedAt,
│   │                               toggle(id), stop(), resetAll(), elapsedOf(id, now)
│   ├── hooks/
│   │   └── useNow.tsx              ticks every 1s while a timer runs; returns Date.now()
│   ├── components/
│   │   ├── CategoryCard.tsx        colored card, per-category total, → /category/:id
│   │   ├── ActivityTimer.tsx       one activity: elapsed + Start/Pause toggle
│   │   ├── ResetDayButton.tsx      AlertDialog confirm → resetAll() + toast
│   │   └── DownloadCsvButton.tsx   builds + downloads CSV + toast
│   ├── layouts/
│   │   └── TimersLayout.tsx        header (title + Reset + Download) + <Outlet/>
│   └── pages/
│       ├── CategoriesPage.tsx      grid of CategoryCard (the landing page)
│       └── CategoryPage.tsx        activities of :categoryId as ActivityTimers + back
└── app.router.tsx                  / → TimersLayout [ index: Categories, category/:id ],
                                    wrapped in ErrorBoundary (Rule 28)
```

## UX flow

1. Landing (`/`) shows the 7 category cards, each colored, showing that category's
   total time today. Header has **Reiniciar día** and **Descargar CSV**.
2. Click a card → `/category/:categoryId` lists its activities. Each row shows the
   running total and a Start/Pause button. Starting one pauses any other (globally).
3. Time accumulates and is saved to `localStorage` continuously (persist middleware).
4. **Reiniciar día** → confirmation dialog → sets every activity back to 0.
5. **Descargar CSV** → downloads `actividades-YYYY-MM-DD.csv` with all 28 activities
   in minutes + a TOTAL row.

## Rules applied

- Zustand store for global state + persist for the "cache" (Rule 4).
- Named exports; `@/` imports; TS interfaces for all data (Rules 13, 18, 14).
- Static category data at module level (Rule 21); stable `key` by id (Rule 20).
- `<Link>`/`useNavigate` for navigation (Rule 22); `<Navigate>` guard for bad
  category id (Rule 23, 33).
- Tailwind + `cn()`, shadcn primitives, `sonner` toasts, no `window.confirm`
  (Rules 9, 10, 11); AlertDialog for the destructive reset.
- ErrorBoundary around the route section (Rule 28).

## Out of scope (not requested)

- No backend / sync across devices (localStorage only).
- No editing of categories/activities from the UI (data comes from the CSV).
- No automatic midnight rollover (reset is manual, as chosen).
