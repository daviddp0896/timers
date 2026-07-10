import { Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/time';
import { GENERAL_ID } from '@/timers/data/categories.data';
import { useTimersStore } from '@/timers/store/timers.store';

interface Props {
  now: number;
}

// The general "unclassified" timer, pinned to the top of the categories page.
// Counts whenever it is enabled and no category activity is running.
export const GeneralTimerCard = ({ now }: Props) => {
  const generalOn = useTimersStore((state) => state.generalOn);
  const isCounting = useTimersStore((state) => state.runningId === GENERAL_ID);
  const seconds = useTimersStore((state) => state.elapsedOf(GENERAL_ID, now));
  const toggleGeneral = useTimersStore((state) => state.toggleGeneral);
  const resetActivity = useTimersStore((state) => state.resetActivity);

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
                : 'Presiona play para empezar el día'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            'font-mono text-2xl tabular-nums',
            isCounting ? 'text-slate-700 dark:text-slate-200' : 'text-muted-foreground',
          )}
        >
          {formatDuration(seconds)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => resetActivity(GENERAL_ID)}
          aria-label="Reiniciar tiempo sin clasificar"
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          size="icon"
          onClick={toggleGeneral}
          aria-label={generalOn ? 'Pausar tiempo sin clasificar' : 'Iniciar tiempo sin clasificar'}
        >
          {generalOn ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
      </div>
    </div>
  );
};
