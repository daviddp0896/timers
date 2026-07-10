import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
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
import { useTimersStore } from '@/timers/store/timers.store';

export const ResetDayButton = () => {
  const resetAll = useTimersStore((state) => state.resetAll);

  const handleReset = () => {
    resetAll();
    toast.success('Todos los timers se reiniciaron para un nuevo día');
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="size-4" />
          Reiniciar día
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Reiniciar todos los timers?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto pondrá en cero el tiempo de todas las actividades para empezar un
            nuevo día. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>Reiniciar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
