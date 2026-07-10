import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/time';
import { GENERAL_ID } from '@/timers/data/categories.data';
import { useTimersStore } from '@/timers/store/timers.store';

interface Props {
  now: number;
}

// The general "unclassified" timer, pinned to the top of the categories page.
// Counts whenever the day is started and no category activity is running. It is
// controlled by the DayControls buttons above it (display only — no buttons). Its
// minutes are added/removed indirectly via the activities' +/- buttons.
export const GeneralTimerCard = ({ now }: Props) => {
  const generalOn = useTimersStore((state) => state.generalOn);
  const isCounting = useTimersStore((state) => state.runningId === GENERAL_ID);
  const seconds = useTimersStore((state) => state.elapsedOf(GENERAL_ID, now));

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-2xl border p-5 shadow-sm transition-colors',
        isCounting
          ? 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60'
          : 'border-border bg-card',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'size-2.5 shrink-0 rounded-full',
            isCounting ? 'animate-pulse bg-slate-500' : 'bg-muted-foreground/30',
          )}
        />
        <div className="min-w-0">
          <h2 className="font-semibold">Tiempo sin clasificar</h2>
          <p className="text-muted-foreground text-sm">
            {isCounting
              ? 'Contando el tiempo libre'
              : generalOn
                ? 'En pausa (hay una actividad activa)'
                : 'Inicia el día para empezar a contar'}
          </p>
        </div>
      </div>

      <span
        className={cn(
          'font-mono text-2xl tabular-nums',
          isCounting ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground',
        )}
      >
        {formatDuration(seconds)}
      </span>
    </div>
  );
};
