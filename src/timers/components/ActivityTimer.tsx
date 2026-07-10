import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/time';
import { GENERAL_ID } from '@/timers/data/categories.data';
import { useTimersStore } from '@/timers/store/timers.store';
import type { Activity, CategoryColor } from '@/timers/interfaces/timer.interface';

interface Props {
  activity: Activity;
  color: CategoryColor;
  now: number;
}

export const ActivityTimer = ({ activity, color, now }: Props) => {
  const toggle = useTimersStore((state) => state.toggle);
  const resetActivity = useTimersStore((state) => state.resetActivity);
  const undoReset = useTimersStore((state) => state.undoReset);
  const addMinute = useTimersStore((state) => state.addMinute);
  const subtractMinute = useTimersStore((state) => state.subtractMinute);
  const isRunning = useTimersStore((state) => state.runningId === activity.id);
  const seconds = useTimersStore((state) => state.elapsedOf(activity.id, now));
  // ± transfer whole minutes with the unclassified timer, so each side must hold ≥60s
  // of live time (base + running delta), matching what the transfer can actually move.
  const canAdd = useTimersStore((state) => state.elapsedOf(GENERAL_ID, now) >= 60);
  const canSubtract = useTimersStore((state) => state.elapsedOf(activity.id, now) >= 60);

  // Reset dumps this activity's time into the unclassified timer — offer a one-tap undo.
  const handleReset = () => {
    resetActivity(activity.id);
    toast(`${activity.name} reiniciada`, {
      description: 'Su tiempo se movió a “sin clasificar”.',
      action: { label: 'Deshacer', onClick: () => undoReset() },
    });
  };

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
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => subtractMinute(activity.id)}
          disabled={!canSubtract}
          aria-label={`Quitar un minuto a ${activity.name}`}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => addMinute(activity.id)}
          disabled={!canAdd}
          aria-label={`Añadir un minuto a ${activity.name}`}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleReset}
          aria-label={`Reiniciar ${activity.name}`}
        >
          <RotateCcw className="size-4" />
        </Button>
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
