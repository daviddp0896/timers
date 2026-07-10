import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/time';
import { useTimersStore } from '@/timers/store/timers.store';
import type { Activity, CategoryColor } from '@/timers/interfaces/timer.interface';

interface Props {
  activity: Activity;
  color: CategoryColor;
  now: number;
}

export const ActivityTimer = ({ activity, color, now }: Props) => {
  const toggle = useTimersStore((state) => state.toggle);
  const isRunning = useTimersStore((state) => state.runningId === activity.id);
  const seconds = useTimersStore((state) => state.elapsedOf(activity.id, now));

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-colors',
        isRunning ? cn(color.soft, color.border) : 'border-border',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'size-2.5 shrink-0 rounded-full',
            isRunning ? cn(color.bar, 'animate-pulse') : 'bg-muted-foreground/30',
          )}
        />
        <span className="truncate font-medium">{activity.name}</span>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            'font-mono text-lg tabular-nums',
            isRunning ? color.text : 'text-muted-foreground',
          )}
        >
          {formatDuration(seconds)}
        </span>
        <Button
          size="icon"
          variant={isRunning ? 'default' : 'secondary'}
          onClick={() => toggle(activity.id)}
          aria-label={isRunning ? `Pausar ${activity.name}` : `Iniciar ${activity.name}`}
          className={cn(isRunning && color.bar)}
        >
          {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
      </div>
    </div>
  );
};
