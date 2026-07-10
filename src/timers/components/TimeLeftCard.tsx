import { Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHoursMinutes } from '@/lib/time';
import { useTimersStore } from '@/timers/store/timers.store';

interface Props {
  now: number;
}

const DAY_SECONDS = 24 * 60 * 60;

// Time left in the day: 24h minus the sum of every timer's elapsed time. Also shows
// the conserved total registered (Rec #3) and flags going over 24h (Rec #2), so it is
// always visible that corrections redistribute time without inventing or losing any.
export const TimeLeftCard = ({ now }: Props) => {
  const usedSeconds = useTimersStore((state) => state.totalElapsedSeconds(now));
  const remaining = DAY_SECONDS - usedSeconds;
  const overBudget = remaining < 0;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Hourglass
          className={cn('size-5', overBudget ? 'text-rose-500' : 'text-muted-foreground')}
        />
        <div>
          <h2 className="font-semibold">
            {overBudget ? 'Día excedido' : 'Tiempo restante del día'}
          </h2>
          <p className="text-muted-foreground text-sm">
            Registrado: {formatHoursMinutes(usedSeconds)} / 24h
          </p>
        </div>
      </div>
      <span
        className={cn(
          'font-mono text-2xl tabular-nums',
          overBudget && 'text-rose-600 dark:text-rose-400',
        )}
      >
        {overBudget ? `+${formatHoursMinutes(-remaining)}` : formatHoursMinutes(remaining)}
      </span>
    </div>
  );
};
