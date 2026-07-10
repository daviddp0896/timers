import type { Category } from '@/timers/interfaces/timer.interface';

// The general "unclassified" timer — a pseudo-activity that belongs to no category.
// It counts time that isn't assigned to any activity.
export const GENERAL_ID = '__general__';
export const GENERAL_REPORT = {
  category: 'Sin clasificar',
  activity: 'Tiempo sin clasificar',
};

// Static category → activity data parsed from promt/categories.csv (Rule 21).
// Color classes are written as full literals so Tailwind's scanner keeps them.
export const CATEGORIES: Category[] = [
  {
    id: 'rutinas',
    name: 'Rutinas',
    color: {
      bar: 'bg-amber-500',
      soft: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-900',
      ring: 'ring-amber-500',
    },
    activities: [
      { id: 'rutina-manana', name: 'Rutina mañana' },
      { id: 'rutina-noche', name: 'Rutina noche' },
      { id: 'laila', name: 'Laila' },
      { id: 'lectura', name: 'Lectura' },
      { id: 'en-cama', name: 'En cama' },
    ],
  },
  {
    id: 'comidas',
    name: 'Comidas',
    color: {
      bar: 'bg-rose-500',
      soft: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-900',
      ring: 'ring-rose-500',
    },
    activities: [
      { id: 'desayuno', name: 'Desayuno' },
      { id: 'comida', name: 'Comida' },
    ],
  },
  {
    id: 'higiene',
    name: 'Higiene',
    color: {
      bar: 'bg-sky-500',
      soft: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-900',
      ring: 'ring-sky-500',
    },
    activities: [
      { id: 'bano', name: 'Baño' },
      { id: 'm', name: 'M' },
      { id: 'regadera', name: 'Regadera' },
    ],
  },
  {
    id: 'estudio',
    name: 'Estudio',
    color: {
      bar: 'bg-indigo-500',
      soft: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-900',
      ring: 'ring-indigo-500',
    },
    activities: [
      { id: 'estudio-code', name: 'Estudio Code' },
      { id: 'estudio-video', name: 'Estudio Video' },
      { id: 'estudio-psi', name: 'Estudio Psi' },
      { id: 'escuela', name: 'Escuela' },
    ],
  },
  {
    id: 'trabajo-creacion',
    name: 'Trabajo/Creación',
    color: {
      bar: 'bg-violet-500',
      soft: 'bg-violet-50 dark:bg-violet-950/40',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-200 dark:border-violet-900',
      ring: 'ring-violet-500',
    },
    activities: [
      { id: 'creacion-video', name: 'Creación Video' },
      { id: 'proyecto-pavimento', name: 'Proyecto pavimento' },
      { id: 'proyectos-personales', name: 'Proyectos personales' },
      { id: 'musica', name: 'Música' },
      { id: 'trabajo-pagado', name: 'Trabajo Pagado' },
    ],
  },
  {
    id: 'ejercicio',
    name: 'Ejercicio',
    color: {
      bar: 'bg-emerald-500',
      soft: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-900',
      ring: 'ring-emerald-500',
    },
    activities: [
      { id: 'padel-tenis', name: 'Padel/Tenis' },
      { id: 'correr', name: 'Correr' },
      { id: 'fuerza', name: 'Fuerza' },
      { id: 'estiramiento', name: 'Estiramiento' },
    ],
  },
  {
    id: 'descanso',
    name: 'Descanso',
    color: {
      bar: 'bg-teal-500',
      soft: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-900',
      ring: 'ring-teal-500',
    },
    activities: [
      { id: 'tele', name: 'Tele' },
      { id: 'redes', name: 'Redes' },
      { id: 'siesta', name: 'Siesta' },
      { id: 'ocio', name: 'Ocio' },
      { id: 'otros', name: 'Otros' },
      { id: 'proceso', name: 'Proceso' },
    ],
  },
  {
    id: 'otros-categoria',
    name: 'Otros',
    color: {
      bar: 'bg-slate-500',
      soft: 'bg-slate-50 dark:bg-slate-950/40',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-900',
      ring: 'ring-slate-500',
    },
    activities: [
      { id: 'otros-actividad', name: 'Otros' },
      { id: 'procesos', name: 'Procesos' },
    ],
  },
];

// Flat lookup helpers derived once at module level.
export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export const ALL_ACTIVITIES = CATEGORIES.flatMap((category) =>
  category.activities.map((activity) => ({ category, activity })),
);
