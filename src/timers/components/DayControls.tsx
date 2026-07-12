import { Pause, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GENERAL_ID } from '@/timers/data/categories.data';
import { useTimersStore } from '@/timers/store/timers.store';

// Top-of-page day controls: a large button that starts the day (enabling the
// unclassified timer) and toggles to "finish day" (pausing every timer), plus a
// pause button that pauses the running activity and resumes the unclassified timer.
export const DayControls = () => {
  const generalOn = useTimersStore((state) => state.generalOn);
  const runningId = useTimersStore((state) => state.runningId);
  const toggleDay = useTimersStore((state) => state.toggleDay);
  const pauseToGeneral = useTimersStore((state) => state.pauseToGeneral);
  // Any time recorded yet? Distinguishes a fresh day from one that was finished.
  const hasTime = useTimersStore((state) => Object.values(state.elapsed).some((v) => v > 0));

  // The pause button only applies while a category activity runs — once the
  // unclassified timer is counting (or nothing runs) there is nothing to pause.
  const activityRunning = runningId !== null && runningId !== GENERAL_ID;

  // Running → finish. Stopped with time recorded → resume. Stopped and empty → start.
  const dayLabel = generalOn ? 'Finalizar día' : hasTime ? 'Retomar día' : 'Iniciar día';

  // Starting/resuming fires straight away; finishing goes through the confirmation
  // dialog below, which owns the click (hence no onClick while the day is running).
  const dayButton = (
    <Button
      size="lg"
      onClick={generalOn ? undefined : toggleDay}
      aria-label={dayLabel}
      className={cn(
        'h-16 flex-1 gap-2 rounded-2xl text-lg font-semibold text-white shadow-sm',
        generalOn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700',
      )}
    >
      {generalOn ? <Square className="size-6" /> : <Play className="size-6" />}
      {dayLabel}
    </Button>
  );

  return (
    <div className="flex items-stretch gap-3">
      {generalOn ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>{dayButton}</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Finalizar el día?</AlertDialogTitle>
              <AlertDialogDescription>
                Se detendrán todos los timers y el tiempo dejará de contar. El tiempo
                registrado se conserva y puedes retomar el día cuando quieras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={toggleDay}>Finalizar día</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        dayButton
      )}
      <Button
        size="lg"
        variant="secondary"
        onClick={pauseToGeneral}
        disabled={!activityRunning}
        aria-label="Pausar actividad"
        className="h-16 gap-2 rounded-2xl px-6 text-base font-medium"
      >
        <Pause className="size-5" />
        Pausar
      </Button>
    </div>
  );
};
